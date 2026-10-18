import unittest
import json

from scripts.render_podcast_audio import collect_articles, key_for, normalize_pmid, spoken


class PodcastAudioPreparationTests(unittest.TestCase):
    def test_numeric_sheet_pmid_is_canonical(self):
        sheet = {"table": {"rows": [
            {"c": [{"v": "Modern Pathology"}]},
            {"c": [{"v": "MAP2K1 mutasyonlu melanositik tümörler"}, None, None, None, None,
                   {"v": 42874744.0}]},
        ]}}
        self.assertEqual(collect_articles(sheet)[0]["pmid"], "42874744")

    def test_hash_does_not_depend_on_pmid_float_representation(self):
        first = key_for("Modern Pathology", "MAP2K1 melanositik tümörler", "42874744.0")
        second = key_for("Modern Pathology", "MAP2K1 melanositik tümörler", "42874744")
        self.assertEqual(first, second)

    def test_safe_pmid_normalization(self):
        self.assertEqual(normalize_pmid("42874744.00"), "42874744")
        self.assertEqual(normalize_pmid(42874744.0), "42874744")
        self.assertEqual(normalize_pmid(""), "")

    def test_spoken_only_pathology_rules_unchanged(self):
        self.assertEqual(spoken("H&E p53 Ewing"), "Hematoksilen Eozin pe 53 Yuing")



import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from scripts import render_podcast_audio as generator


class IncrementalCacheTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.audio_patch = patch.object(generator, "AUDIO_DIR", self.dir)
        self.manifest_patch = patch.object(
            generator, "MANIFEST_PATH", self.dir / "manifest.json"
        )
        self.audio_patch.start()
        self.manifest_patch.start()
        self.addCleanup(self.audio_patch.stop)
        self.addCleanup(self.manifest_patch.stop)
        self.addCleanup(self.tmp.cleanup)
        self.now = datetime.now(timezone.utc)
        self.articles = [
            {
                "journal": f"Journal {i // 10}",
                "title": f"Patoloji makale numara {i:03d} yeni molekuler bulgular",
                "pmid": str(42870000 + i),
            }
            for i in range(120)
        ]

    def seed(self, count=5, age_days=0):
        entries = {}
        for article in self.articles[:count]:
            key = generator.key_for(
                article["journal"], article["title"], article["pmid"]
            )
            candidate = generator.catalog([article])[key]
            stamp = self.now - timedelta(days=age_days)
            entries[key] = {**candidate, "generated_at": stamp.isoformat()}
            (self.dir / candidate["file"]).write_bytes(b"ID3" + b"x" * 2048)
        manifest = {"version": 1, "generated_at": self.now.isoformat(),
                    "entries": entries}
        generator.MANIFEST_PATH.write_text(
            json.dumps(manifest, ensure_ascii=False), encoding="utf-8"
        )
        return manifest

    def fake_render(self, _tts, _text, destination):
        destination.write_bytes(b"ID3" + b"x" * 2048)

    def test_keep_initial_five_and_add_at_most_eight_per_run(self):
        old = self.seed()
        plan = generator.plan_updates(self.articles, old, self.now)
        self.assertEqual(len(plan["selected"]), generator.BATCH_SIZE)
        self.assertEqual(plan["ready"], 5)
        self.assertFalse(plan["removed"])
        # The initial five are from Journal 0; the first batch should
        # make progress in eight *other* journals instead of just journals 0–4.
        self.assertEqual(
            len(set(plan["candidates"][k]["journal"] for k in plan["selected"])),
            generator.BATCH_SIZE,
        )
        with patch.object(generator, "create_tts", return_value=object()), \
             patch.object(generator, "render_clip", side_effect=self.fake_render):
            generator.execute_plan(plan)
        updated = generator.load_manifest()
        self.assertEqual(len(updated["entries"]), 5 + generator.BATCH_SIZE)
        self.assertTrue(set(old["entries"]).issubset(updated["entries"]))
        next_plan = generator.plan_updates(self.articles, updated, self.now)
        self.assertEqual(len(next_plan["selected"]), generator.BATCH_SIZE)
        covered = {entry["journal"] for entry in updated["entries"].values()}
        covered.update(
            next_plan["candidates"][key]["journal"]
            for key in next_plan["selected"]
        )
        self.assertEqual(len(covered), 12)

    def test_unchanged_full_cache_needs_no_model_or_rebuild(self):
        old = self.seed(120, age_days=149)
        plan = generator.plan_updates(self.articles, old, self.now)
        self.assertEqual(plan["selected"], [])
        self.assertEqual(plan["ready"], 120)
        self.assertFalse(plan["has_changes"])

    def test_old_but_listed_audio_is_refreshed_in_small_batches(self):
        old = self.seed(120, age_days=151)
        plan = generator.plan_updates(self.articles, old, self.now)
        self.assertEqual(len(plan["selected"]), generator.BATCH_SIZE)
        self.assertEqual(plan["ready"], 120)
        self.assertEqual(plan["missing"], 0)
        self.assertEqual(plan["refresh"], 120)

    def test_across_runs_every_journal_gets_one_ready_clip(self):
        # 12 journals * 10 entries, smaller 8-file batches. The previous
        # algorithm repeatedly favored only the earliest groups.
        old = self.seed(0)
        for _ in range(2):
            plan = generator.plan_updates(self.articles, old, self.now)
            with patch.object(generator, "create_tts", return_value=object()), \
                 patch.object(generator, "render_clip", side_effect=self.fake_render):
                generator.execute_plan(plan)
            old = generator.load_manifest()
        self.assertEqual(
            len({e["journal"] for e in old["entries"].values()}), 12
        )

    def test_at_150_days_audio_is_refreshed_not_deleted(self):
        old = self.seed(120, age_days=150)
        plan = generator.plan_updates(self.articles, old, self.now)
        self.assertEqual(len(plan["selected"]), generator.BATCH_SIZE)
        with patch.object(generator, "create_tts", return_value=object()), \
             patch.object(generator, "render_clip", side_effect=self.fake_render):
            generator.execute_plan(plan)
        new = generator.load_manifest()
        self.assertEqual(len(new["entries"]), 120)
        self.assertEqual(
            set(new["entries"]), set(old["entries"])
        )

    def test_remove_only_titles_absent_from_sheet(self):
        old = self.seed(5)
        removed = self.articles[0]
        missing_key = generator.key_for(
            removed["journal"], removed["title"], removed["pmid"]
        )
        remaining = self.articles[1:]
        plan = generator.plan_updates(remaining, old, self.now)
        self.assertEqual(plan["removed"], [missing_key])
        with patch.object(generator, "create_tts", return_value=object()), \
             patch.object(generator, "render_clip", side_effect=self.fake_render):
            generator.execute_plan(plan)
        after = generator.load_manifest()
        self.assertNotIn(missing_key, after["entries"])
        self.assertFalse((self.dir / (missing_key + ".mp3")).exists())

    def test_failed_synthesis_preserves_manifest_and_existing_audio(self):
        old = self.seed()
        before = generator.MANIFEST_PATH.read_bytes()
        plan = generator.plan_updates(self.articles, old, self.now)
        with patch.object(generator, "create_tts", return_value=object()), \
             patch.object(generator, "render_clip", side_effect=RuntimeError("bad audio")):
            with self.assertRaisesRegex(RuntimeError, "bad audio"):
                generator.execute_plan(plan)
        self.assertEqual(generator.MANIFEST_PATH.read_bytes(), before)
        self.assertTrue(all((self.dir / e["file"]).exists()
                            for e in old["entries"].values()))

    def test_partial_sheet_is_rejected_before_cleanup(self):
        old = self.seed()
        with self.assertRaisesRegex(RuntimeError, "Only"):
            generator.plan_updates(self.articles[:4], old, self.now)


if __name__ == "__main__":
    unittest.main()
