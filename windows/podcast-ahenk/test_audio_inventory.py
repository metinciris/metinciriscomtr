"""Tests for recovering and keeping privately generated Ahenk MP3s.

No TTS model and no GitHub network are needed.
"""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import audio_inventory
from scripts import render_podcast_audio as engine


def article(title, pmid):
    return {"title": title, "journal": "Modern Pathology", "pmid": pmid}


def write_mp3(path, suffix=b""):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"ID3" + b"A" * 1800 + suffix)


class AudioInventoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        self.home = Path(self.temp.name) / "home"
        self.audio = self.root / "public" / "podcast-audio"
        self.audio.mkdir(parents=True)
        self.articles = [
            article("SMARCA4 olmayan mezenkimal tümör incelemesi", "112233"),
            article("Prostat kor biyopsisi ve yeni tanı yöntemleri", "221133"),
        ]
        self.catalog = engine.catalog(self.articles)
        self.keys = list(self.catalog)
        self.manifest_file = self.audio / "manifest.json"
        self.manifest = {"version": 1, "entries": {}}
        self.manifest_file.write_text(json.dumps(self.manifest), encoding="utf-8")

    def test_reports_real_mp3_even_without_manifest_entry(self):
        key = self.keys[0]
        write_mp3(self.audio / (key + ".mp3"))
        web = {"version": 1, "entries": {self.keys[1]: {
            "file": self.keys[1] + ".mp3",
            "title": self.articles[1]["title"], "journal": "Modern Pathology",
        }}}
        rows, counts = audio_inventory.inventory(
            self.root, self.catalog, self.manifest, web
        )
        self.assertTrue(rows[key]["pc"])
        self.assertFalse(rows[key]["registered"])
        self.assertEqual(counts["unregistered"], 1)
        self.assertEqual(counts["pc"], 1)
        self.assertEqual(counts["web"], 1)
        self.assertEqual(counts["pc_missing"], 1)
        self.assertEqual(counts["publish_ready"], 1)

    def test_recover_manifest_record_without_modifying_audio(self):
        key = self.keys[0]
        path = self.audio / (key + ".mp3")
        write_mp3(path, b"RECOVER_ME")
        initial = path.read_bytes()
        count = audio_inventory.restore_missing_entries(
            self.root, self.catalog, [key], self.home
        )
        self.assertEqual(count, 1)
        restored = json.loads(self.manifest_file.read_text(encoding="utf-8"))
        self.assertIn(key, restored["entries"])
        self.assertEqual(restored["entries"][key]["fingerprint"], "unknown-recovered")
        self.assertEqual(path.read_bytes(), initial)
        self.assertTrue(list((self.home / "yedekler").glob("*")))
        self.assertEqual(audio_inventory.restore_missing_entries(
            self.root, self.catalog, [key], self.home
        ), 0)

    def test_non_mp3_and_unknown_article_are_rejected(self):
        key = self.keys[0]
        path = self.audio / (key + ".mp3")
        path.write_bytes(b"<html>" + b"X" * 1800)
        self.assertFalse(audio_inventory.present(self.root, key))
        with self.assertRaises(RuntimeError):
            audio_inventory.restore_missing_entries(
                self.root, self.catalog, [key], self.home
            )
        with self.assertRaisesRegex(RuntimeError, "listesinde bulunamadı"):
            audio_inventory.restore_missing_entries(
                self.root, self.catalog, ["a" * 24], self.home
            )

    def test_generate_new_does_not_delete_unknown_local_recording(self):
        orphan = "d" * 24
        unknown = self.audio / (orphan + ".mp3")
        write_mp3(unknown, b"DO_NOT_DELETE")
        existing = unknown.read_bytes()
        prior = {"version": 1, "entries": {
            orphan: {"file": unknown.name, "title": "Older local title"}
        }}
        self.manifest_file.write_text(json.dumps(prior), encoding="utf-8")
        with patch.object(engine, "AUDIO_DIR", self.audio), \
             patch.object(engine, "MANIFEST_PATH", self.manifest_file), \
             patch.object(engine, "render_clip") as render:
            def fake_render(_tts, _text, target, speed=1.0):
                write_mp3(Path(target))
            render.side_effect = fake_render
            engine.execute_plan({
                "version": 1, "candidates": self.catalog,
                "selected": [self.keys[0]],
            }, tts=object(), preserve_local=True)
        self.assertEqual(unknown.read_bytes(), existing)
        after = json.loads(self.manifest_file.read_text(encoding="utf-8"))
        self.assertIn(orphan, after["entries"])
        self.assertIn(self.keys[0], after["entries"])


if __name__ == "__main__":
    unittest.main()
