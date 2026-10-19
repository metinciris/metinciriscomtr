"""Regression tests for multi-PC podcast audio sync and live website cache."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import git_sync
import online_audio

ONE = "a" * 24
TWO = "b" * 24


def voice(key, generated_at="2026-10-19T09:10:00+00:00"):
    return {
        "title": f"Patoloji makale {key[0]} ses kaydı değerlendirmesi",
        "journal": "Modern Pathology",
        "pmid": str(100000 + (1 if key == ONE else 2)),
        "file": key + ".mp3",
        "fingerprint": key,
        "generated_at": generated_at,
    }


def manifest(entries):
    return {"version": 1, "entries": entries,
            "generated_at": "2026-10-19T09:10:00+00:00"}


def mp3(letter):
    return b"ID3" + bytes(letter, "ascii") * 2500


class GitSyncTests(unittest.TestCase):
    def cmd(self, *args, cwd=None):
        r = subprocess.run(
            args, cwd=cwd, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=60
        )
        if r.returncode:
            raise AssertionError(" ".join(args) + "\n" + r.stderr + r.stdout)
        return r.stdout.strip()

    def git(self, where, *args):
        return self.cmd("git", "-C", str(where), *args)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.dir = Path(self.temp.name)
        self.origin = self.dir / "origin.git"
        self.seed = self.dir / "seed"
        self.local = self.dir / "windows"
        self.other = self.dir / "github-actions"
        self.home = self.dir / "app-home"
        self.cmd("git", "init", "--bare", "--initial-branch=main", str(self.origin))
        self.cmd("git", "clone", str(self.origin), str(self.seed))
        self.git(self.seed, "config", "user.email", "test@example.com")
        self.git(self.seed, "config", "user.name", "Podcast Test")
        self.git(self.seed, "config", "core.autocrlf", "false")
        self.write(self.seed, {ONE: voice(ONE)})
        self.git(self.seed, "add", "public/podcast-audio")
        self.git(self.seed, "commit", "-m", "Seed initial MP3")
        self.git(self.seed, "push", "-u", "origin", "main")
        self.cmd("git", "clone", str(self.origin), str(self.local))
        self.cmd("git", "clone", str(self.origin), str(self.other))
        for where in (self.local, self.other):
            self.git(where, "config", "user.email", "test@example.com")
            self.git(where, "config", "user.name", "Podcast Test")
            self.git(where, "config", "core.autocrlf", "false")
        self.repo_check = patch.object(git_sync, "check_repo")
        self.repo_check.start()
        self.addCleanup(self.repo_check.stop)

    def write(self, root, entries):
        folder = root / "public" / "podcast-audio"
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "manifest.json").write_text(
            json.dumps(manifest(entries), ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8"
        )
        (folder / "pronunciation.json").write_text(
            json.dumps({"version": 1, "global": [], "articles": {}, "global_speed": 1.0}),
            encoding="utf-8"
        )
        for key in entries:
            if not (folder / (key + ".mp3")).exists():
                (folder / (key + ".mp3")).write_bytes(mp3(key[0]))

    def edit_local(self):
        original = git_sync.read_json_file(self.local / git_sync.MANIFEST)
        original["entries"][ONE] = voice(ONE, "2026-10-19T11:00:00+00:00")
        git_sync.save_json(self.local / git_sync.MANIFEST, original)
        (self.local / git_sync.AUDIO_PREFIX / (ONE + ".mp3")).write_bytes(mp3("Z"))

    def test_porcelain_preserves_leading_space_in_path(self):
        self.edit_local()
        changed = git_sync.changes(self.local)
        self.assertIn("public/podcast-audio/manifest.json", changed)
        self.assertIn("public/podcast-audio/" + ONE + ".mp3", changed)
        self.assertFalse(any(p.startswith("ublic/") for p in changed))

    def test_merge_online_new_and_local_approved_voice(self):
        self.edit_local()
        self.write(self.other, {ONE: voice(ONE), TWO: voice(TWO)})
        self.git(self.other, "add", "public/podcast-audio")
        self.git(self.other, "commit", "-m", "Another GH Actions MP3")
        self.git(self.other, "push", "origin", "main")
        msg = git_sync.sync(self.local, self.home)
        self.assertIn("GitHub", msg)
        local = git_sync.read_json_file(self.local / git_sync.MANIFEST)
        self.assertEqual(set(local["entries"]), {ONE, TWO})
        self.assertEqual(
            local["entries"][ONE]["generated_at"], "2026-10-19T11:00:00+00:00"
        )
        self.assertEqual(
            (self.local / git_sync.AUDIO_PREFIX / (ONE + ".mp3")).read_bytes(), mp3("Z")
        )
        self.assertTrue((self.local / git_sync.AUDIO_PREFIX / (TWO + ".mp3")).is_file())
        self.assertIn("public/podcast-audio/manifest.json", git_sync.changes(self.local))
        self.assertTrue(any((self.home / "yedekler").iterdir()))
        result = git_sync.publish(self.local, self.home, selected_key=ONE)
        self.assertIn("GitHub", result)
        current = git_sync.ref_json(self.local, "HEAD", git_sync.MANIFEST)
        self.assertEqual(set(current["entries"]), {ONE, TWO})
        self.assertEqual(current["entries"][ONE]["generated_at"],
                         "2026-10-19T11:00:00+00:00")
        self.assertEqual(
            (self.local / git_sync.AUDIO_PREFIX / (ONE + ".mp3")).read_bytes(), mp3("Z")
        )
        self.assertEqual(
            self.git(self.local, "status", "--porcelain", "--untracked-files=all"), ""
        )

    def test_conflicting_online_and_local_voice_preserves_both(self):
        self.edit_local()
        folder = self.other / git_sync.AUDIO_PREFIX
        self.write(self.other, {
            ONE: voice(ONE, "2026-10-19T12:00:00+00:00")
        })
        (folder / (ONE + ".mp3")).write_bytes(mp3("R"))
        self.git(self.other, "add", "public/podcast-audio")
        self.git(self.other, "commit", "-m", "Regenerate same MP3 remotely")
        self.git(self.other, "push", "origin", "main")
        git_sync.sync(self.local, self.home)
        self.assertEqual(
            (self.local / git_sync.AUDIO_PREFIX / (ONE + ".mp3")).read_bytes(), mp3("Z")
        )
        self.assertEqual(
            git_sync.ref_json(self.local, "HEAD", git_sync.MANIFEST)
            ["entries"][ONE]["generated_at"], "2026-10-19T12:00:00+00:00"
        )
        self.assertEqual(
            git_sync.read_json_file(self.local / git_sync.MANIFEST)
            ["entries"][ONE]["generated_at"], "2026-10-19T11:00:00+00:00"
        )

    def test_unrelated_local_changes_are_not_published(self):
        (self.local / "strange.txt").write_text("unknown", encoding="utf-8")
        with self.assertRaisesRegex(RuntimeError, "Podcast dışındaki"):
            git_sync.sync(self.local, self.home)


class OnlineAudioTests(unittest.TestCase):
    def test_live_manifest_and_clip_are_separate_from_git(self):
        with tempfile.TemporaryDirectory() as home:
            response = manifest({ONE: voice(ONE)})
            def fake_network(url, limit, timeout=25):
                if url.endswith("manifest.json"):
                    return json.dumps(response).encode("utf-8")
                if url.endswith(ONE + ".mp3"):
                    return mp3("W")
                raise AssertionError(url)
            with patch.object(online_audio, "_read_https", side_effect=fake_network):
                live = online_audio.fetch_manifest()
                online_audio.cache_manifest(home, live)
                output = online_audio.download_clip(home, ONE, live)
            self.assertEqual(output.read_bytes(), mp3("W"))
            self.assertEqual(set(online_audio.load_cached_manifest(home)["entries"]), {ONE})
            self.assertEqual(output.parent.name, "web_mp3")

    def test_incorrect_audio_key_is_rejected(self):
        with tempfile.TemporaryDirectory() as home:
            with self.assertRaises(ValueError):
                online_audio.web_clip_path(home, "../not-allowed.mp3")


if __name__ == "__main__":
    unittest.main()
