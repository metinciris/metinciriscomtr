"""Offline tests of daily 12:30 PC runner: never touch the actual site/repo."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import app_single_instance
import gunluk_otomatik as daily
from scripts import render_podcast_audio as engine


def titles(count=120):
    return [
        {
            "journal": f"Journal {n // 10}",
            "title": f"Türkçe patoloji araştırması ve moleküler tanı başlığı {n:03d}",
            "pmid": str(42000000 + n),
        }
        for n in range(count)
    ]


class DailyPodcastJobTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "repo"
        self.home = Path(self.tmp.name) / "home"
        self.root.mkdir()
        self.audio = self.root / "public" / "podcast-audio"
        self.audio.mkdir(parents=True)
        self.articles = titles()
        self.catalog = engine.catalog(self.articles)
        self.keys = list(self.catalog)
        self.root_patch = patch.object(daily, "ROOT", self.root)
        self.home_patch = patch.object(daily, "HOME", self.home)
        self.status_patch = patch.object(daily, "STATUS", self.home / "status.json")
        self.root_patch.start()
        self.home_patch.start()
        self.status_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.addCleanup(self.home_patch.stop)
        self.addCleanup(self.status_patch.stop)

    def manifest(self, number):
        return {
            "version": 1,
            "entries": {
                key: {**self.catalog[key], "generated_at": "2026-10-20T12:00:00+00:00"}
                for key in self.keys[:number]
            },
        }

    def test_daily_mutex_prevents_second_writer(self):
        with app_single_instance.exclusive_archive() as first:
            self.assertTrue(first)
            with app_single_instance.exclusive_archive() as second:
                self.assertFalse(second)

    def test_no_web_missing_does_not_start_git_or_model(self):
        with patch.object(daily.online_audio, "fetch_manifest",
                          return_value=self.manifest(120)), \
             patch.object(engine, "load_sheet", return_value=self.articles), \
             patch.object(daily.git_sync, "sync",
                          side_effect=AssertionError("Unexpected Git sync")), \
             patch.object(daily.audio_runtime, "ensure_runtime",
                          side_effect=AssertionError("Unexpected model load")):
            result = daily.run_once()
        self.assertEqual(result["status"], "complete")
        self.assertEqual(result["generated"], 0)
        self.assertEqual(result["uploaded"], 0)

    def test_github_pending_deploy_is_not_published_again(self):
        with patch.object(daily.online_audio, "fetch_manifest",
                          return_value=self.manifest(80)), \
             patch.object(engine, "load_sheet", return_value=self.articles), \
             patch.object(daily.git_sync, "sync"), \
             patch.object(daily.git_sync, "remote_manifest",
                          return_value=self.manifest(120)), \
             patch.object(daily.audio_runtime, "ensure_runtime",
                          side_effect=AssertionError("Unexpected model load")), \
             patch.object(daily.git_sync, "publish_selected_local_voices",
                          side_effect=AssertionError("Unexpected reupload")):
            result = daily.run_once()
        self.assertEqual(result["status"], "waiting_for_deploy")
        self.assertEqual(result["generated"], 0)

    def test_missing_audio_generated_in_eights_then_one_github_push(self):
        local = {"version": 1, "entries": {}}
        rendered = []

        def fake_generate(plan, *, tts, preserve_local):
            self.assertTrue(preserve_local)
            self.assertLessEqual(len(plan["selected"]), 8)
            rendered.extend(plan["selected"])
            for key in plan["selected"]:
                (self.audio / (key + ".mp3")).write_bytes(b"ID3" + b"A" * 1800)
                local["entries"][key] = dict(self.catalog[key])

        with patch.object(daily.online_audio, "fetch_manifest",
                          return_value=self.manifest(80)), \
             patch.object(engine, "load_sheet", return_value=self.articles), \
             patch.object(daily.git_sync, "sync"), \
             patch.object(daily.git_sync, "remote_manifest",
                          return_value=self.manifest(85)), \
             patch.object(engine, "load_manifest", return_value=local), \
             patch.object(daily.audio_runtime, "ensure_runtime"), \
             patch.object(engine, "create_tts", return_value=object()) as model, \
             patch.object(engine, "execute_plan", side_effect=fake_generate), \
             patch.object(daily.git_sync, "publish_selected_local_voices",
                          return_value="uploaded") as publisher:
            result = daily.run_once()

        expected = self.keys[85:]
        self.assertEqual(rendered, expected)
        self.assertEqual(result["generated"], len(expected))
        self.assertEqual(result["uploaded"], len(expected))
        self.assertEqual(result["status"], "uploaded_waiting_for_deploy")
        model.assert_called_once()
        publisher.assert_called_once()
        self.assertEqual(publisher.call_args.args[2], expected)
        self.assertTrue(publisher.call_args.kwargs["reject_existing"])

    def test_unregistered_pc_recording_is_never_overwritten(self):
        key = self.keys[-1]
        file = self.audio / (key + ".mp3")
        original = b"ID3" + b"PERSONAL" * 200
        file.write_bytes(original)
        with patch.object(daily.online_audio, "fetch_manifest",
                          return_value=self.manifest(119)), \
             patch.object(engine, "load_sheet", return_value=self.articles), \
             patch.object(daily.git_sync, "sync"), \
             patch.object(daily.git_sync, "remote_manifest",
                          return_value=self.manifest(119)), \
             patch.object(engine, "load_manifest",
                          return_value={"version": 1, "entries": {}}), \
             patch.object(daily.audio_runtime, "ensure_runtime",
                          side_effect=AssertionError("Must not generate")), \
             patch.object(daily.git_sync, "publish_selected_local_voices",
                          side_effect=AssertionError("Must not publish")):
            result = daily.run_once()
        self.assertEqual(result["generated"], 0)
        self.assertEqual(result["uploaded"], 0)
        self.assertEqual(result["skipped"], [key])
        self.assertEqual(file.read_bytes(), original)

    def test_truncated_google_sheet_must_stop_before_git(self):
        with patch.object(daily.online_audio, "fetch_manifest",
                          return_value={"version": 1, "entries": {}}), \
             patch.object(engine, "load_sheet", return_value=titles(20)), \
             patch.object(daily.git_sync, "sync",
                          side_effect=AssertionError("Unexpected Git sync")):
            with self.assertRaisesRegex(RuntimeError, "en az 96"):
                daily.run_once()

    def test_conflicting_web_manifest_blocks_automatic_upload(self):
        corrupt = self.manifest(1)
        first_key = self.keys[0]
        corrupt["entries"][first_key]["title"] = "Wrong article identity"
        with patch.object(daily.online_audio, "fetch_manifest",
                          return_value=corrupt), \
             patch.object(engine, "load_sheet", return_value=self.articles), \
             patch.object(daily.git_sync, "sync",
                          side_effect=AssertionError("Must not sync")):
            with self.assertRaisesRegex(RuntimeError, "eşleşmiyor"):
                daily.run_once()

    def test_recovered_unverified_local_mp3_is_not_auto_published(self):
        key = self.keys[-1]
        path = self.audio / (key + ".mp3")
        path.write_bytes(b"ID3" + b"PRIVATE" * 240)
        entry = {**self.catalog[key], "fingerprint": "unknown-recovered"}
        manifest = {"version": 1, "entries": {key: entry}}
        approved, skipped = daily.approved_pc_keys(
            self.catalog, [key], manifest
        )
        self.assertEqual(approved, [])
        self.assertEqual(skipped, [key])

    def test_registered_pc_clip_uploads_without_model(self):
        key = self.keys[-1]
        file = self.audio / (key + ".mp3")
        file.write_bytes(b"ID3" + b"APPROVED" * 240)
        local = {"version": 1, "entries": {
            key: dict(self.catalog[key])
        }}
        with patch.object(daily.online_audio, "fetch_manifest",
                          return_value=self.manifest(119)), \
             patch.object(engine, "load_sheet", return_value=self.articles), \
             patch.object(daily.git_sync, "sync"), \
             patch.object(daily.git_sync, "remote_manifest",
                          return_value=self.manifest(119)), \
             patch.object(engine, "load_manifest", return_value=local), \
             patch.object(daily.audio_runtime, "ensure_runtime",
                          side_effect=AssertionError("Must not load model")), \
             patch.object(daily.git_sync, "publish_selected_local_voices",
                          return_value="uploaded") as uploader:
            result = daily.run_once()
        self.assertEqual(result["generated"], 0)
        self.assertEqual(result["uploaded"], 1)
        self.assertEqual(uploader.call_args.args[2], [key])


if __name__ == "__main__":
    unittest.main()
