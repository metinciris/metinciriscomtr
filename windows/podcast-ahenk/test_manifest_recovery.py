"""Crash-safe Windows podcast manifest recovery, without network or TTS."""
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from manifest_recovery import recover_if_invalid, identity, atomic_json, parse


class InterruptedManifestTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        base = Path(self.temp.name)
        self.root = base / "repo"
        self.home = base / "home"
        self.audio = self.root / "public" / "podcast-audio"
        self.audio.mkdir(parents=True)
        self.home.mkdir()
        self.path = self.audio / "manifest.json"
        self.article = {"title": "Melanom ve BRAF molekuler analiz calismasi",
                        "journal": "Modern Pathology", "pmid": "42874744"}
        import hashlib
        item = [self.article["journal"], self.article["title"], self.article["pmid"]]
        self.key = hashlib.sha256(json.dumps(item, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()[:24]
        self.mp3 = self.audio / (self.key + ".mp3")
        self.mp3.write_bytes(b"ID3" + b"A" * 4000)
        (self.home / "makale_onbellek.json").write_text(
            json.dumps([self.article]), encoding="utf-8"
        )

    def test_empty_manifest_is_backed_up_and_local_mp3_preserved(self):
        self.path.write_bytes(b"")
        before = self.mp3.read_bytes()
        with patch("manifest_recovery.git", return_value=None):
            result = recover_if_invalid(self.root, self.home)
        self.assertTrue(result["repaired"])
        self.assertEqual(result["local_mp3s"], 1)
        self.assertEqual(result["needs_review"], 1)
        restored = parse(self.path.read_bytes())
        self.assertIn(self.key, restored["entries"])
        self.assertEqual(restored["entries"][self.key]["fingerprint"], "unknown-recovered")
        self.assertEqual(before, self.mp3.read_bytes())
        self.assertTrue(Path(result["backup"]).is_file())
        self.assertEqual(Path(result["backup"]).read_bytes(), b"")
        self.assertFalse(recover_if_invalid(self.root, self.home)["repaired"])

    def test_invalid_json_is_preserved_verbatim(self):
        original = b'{"version": 1, "entries": {"'
        self.path.write_bytes(original)
        with patch("manifest_recovery.git", return_value=None):
            result = recover_if_invalid(self.root, self.home)
        self.assertEqual(Path(result["backup"]).read_bytes(), original)
        self.assertIn(self.key, parse(self.path.read_bytes())["entries"])

    def test_committed_identical_mp3_retains_original_approved_metadata(self):
        old = {"title": self.article["title"], "journal": self.article["journal"],
               "pmid": self.article["pmid"], "file": self.key + ".mp3",
               "fingerprint": "approved-hash", "generated_at": "2026-10-20T10:00:00+00:00"}
        head = {"version": 1, "entries": {self.key: old}}
        self.path.write_bytes(b"")
        def fake_git(root, *args):
            if args[0] == "show":
                return json.dumps(head).encode("utf-8")
            if args[0] in ("hash-object", "rev-parse"):
                return b"same-sha"
            return None
        with patch("manifest_recovery.git", side_effect=fake_git):
            result = recover_if_invalid(self.root, self.home)
        self.assertEqual(result["needs_review"], 0)
        self.assertEqual(parse(self.path.read_bytes())["entries"][self.key], old)

    def test_latest_backup_can_restore_identity_without_cache(self):
        (self.home / "makale_onbellek.json").unlink()
        old = {"title": self.article["title"], "journal": self.article["journal"],
               "pmid": self.article["pmid"], "file": self.key + ".mp3"}
        backup = self.home / "yedekler" / "test" / "public" / "podcast-audio"
        backup.mkdir(parents=True)
        (backup / "manifest.json").write_text(
            json.dumps({"version": 1, "entries": {self.key: old}}), encoding="utf-8"
        )
        self.path.write_bytes(b"corrupted")
        with patch("manifest_recovery.git", return_value=None):
            result = recover_if_invalid(self.root, self.home)
        self.assertEqual(result["needs_review"], 1)
        self.assertIn(self.key, parse(self.path.read_bytes())["entries"])

    def test_unrecognized_local_mp3_is_never_deleted(self):
        self.path.write_bytes(b"")
        unknown = self.audio / ("f" * 24 + ".mp3")
        unknown.write_bytes(b"ID3" + b"B" * 4000)
        with patch("manifest_recovery.git", return_value=None):
            result = recover_if_invalid(self.root, self.home)
        self.assertEqual(result["unmatched_mp3s_kept"], 1)
        self.assertTrue(unknown.exists())

    def test_valid_manifest_never_changes_anything(self):
        old = {"version": 1, "entries": {}}
        self.path.write_text(json.dumps(old), encoding="utf-8")
        before = self.path.read_bytes()
        result = recover_if_invalid(self.root, self.home)
        self.assertFalse(result["repaired"])
        self.assertEqual(before, self.path.read_bytes())
        self.assertFalse((self.home / "kurtarma").exists())

    def test_atomic_write_failure_leaves_original_unchanged(self):
        original = b'{"version": 1, "entries": {}}'
        self.path.write_bytes(original)
        with patch("manifest_recovery.os.replace", side_effect=OSError("power cut")):
            with self.assertRaisesRegex(OSError, "power cut"):
                atomic_json(self.path, {"version": 1, "entries": {}})
        self.assertEqual(self.path.read_bytes(), original)
        self.assertEqual(list(self.audio.glob(".ahenk-repair-*")), [])


if __name__ == "__main__":
    unittest.main()
