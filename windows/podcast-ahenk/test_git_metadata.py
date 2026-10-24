"""Integration tests for metadata-only Git transport and selected MP3 upload.

All pushes use temporary local bare repositories; no network, tokens, or
personal MP3 content. The producer's audio folder must remain untouched.
"""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import git_metadata
import git_sync


def cmd(*args):
    result = subprocess.run(
        ["git", *map(str, args)], capture_output=True, text=True,
        encoding="utf-8", errors="replace",
    )
    if result.returncode:
        raise AssertionError(
            f"git command failed ({args}): {result.stderr or result.stdout}"
        )
    return result.stdout.strip()


def entry(key, title):
    return {
        "title": title, "journal": "Modern Pathology", "pmid": "43223456",
        "file": key + ".mp3", "fingerprint": "tested",
        "generated_at": "2026-10-24T10:00:00+00:00",
    }


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def audio_bytes(name):
    return b"ID3" + name.encode("utf-8") * 390


class MetadataOnlyGitTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        base = Path(tmp.name)
        self.remote = base / "origin.git"
        self.seed = base / "seed"
        self.source = base / "source"
        self.home = base / "home"
        self.home.mkdir()
        self.url = self.remote.as_uri()
        cmd("init", "--bare", "--initial-branch=main", self.remote)
        cmd("clone", self.url, self.seed)
        cmd("-C", self.seed, "config", "user.name", "Test")
        cmd("-C", self.seed, "config", "user.email", "test@example.invalid")
        self.a, self.b, self.c = ["a" * 24, "b" * 24, "c" * 24]
        self.published = {
            self.a: entry(self.a, "Already on WEB A"),
            self.b: entry(self.b, "Already on WEB B"),
        }
        self.audio_remote = {
            key: audio_bytes(key) for key in self.published
        }
        for key, data in self.audio_remote.items():
            target = self.seed / git_sync.AUDIO_PREFIX / (key + ".mp3")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        write_json(
            self.seed / git_sync.MANIFEST,
            {"version": 1, "entries": self.published},
        )
        self.rules = {
            "version": 1, "global": [], "global_speed": 1.0, "articles": {},
        }
        write_json(self.seed / git_sync.RULES, self.rules)
        cmd("-C", self.seed, "add", ".")
        cmd("-C", self.seed, "commit", "-m", "Publish two samples")
        cmd("-C", self.seed, "push", "origin", "main")
        cmd("clone", self.url, self.source)
        self.local_new = entry(self.c, "Only missing C")
        file = self.source / git_sync.AUDIO_PREFIX / (self.c + ".mp3")
        file.write_bytes(audio_bytes("LOCAL-C"))
        self.source_audio_before = {
            key: (self.source / git_sync.AUDIO_PREFIX / (key + ".mp3")).read_bytes()
            for key in (self.a, self.b, self.c)
        }
        write_json(
            self.source / git_sync.MANIFEST,
            {"version": 1, "entries": {**self.published, self.c: self.local_new}},
        )
        self.manifest_before = (self.source / git_sync.MANIFEST).read_bytes()
        valid = patch.object(git_metadata.git_sync, "VALID_REMOTE", {self.url})
        valid.start()
        self.addCleanup(valid.stop)

    def test_only_json_downloaded_only_missing_clip_uploaded(self):
        with git_metadata.metadata_checkout(self.source, self.home) as checkout:
            existing = list((checkout / git_sync.AUDIO_PREFIX).glob("*.mp3"))
            self.assertEqual(existing, [], "WEB MP3s must never be downloaded")
            self.assertEqual(
                set(git_sync.remote_manifest(checkout)["entries"]),
                {self.a, self.b},
            )
            result = git_metadata.publish_missing(self.source, checkout, [self.c])
            self.assertEqual(result, 1)
            self.assertFalse((checkout / git_sync.AUDIO_PREFIX /
                              (self.a + ".mp3")).exists())
            self.assertFalse((checkout / git_sync.AUDIO_PREFIX /
                              (self.b + ".mp3")).exists())
        remote_manifest = json.loads(cmd(
            "--git-dir", self.remote, "show", "main:" + git_sync.MANIFEST
        ))
        self.assertEqual(set(remote_manifest["entries"]), {self.a, self.b, self.c})
        self.assertEqual(remote_manifest["entries"][self.a], self.published[self.a])
        self.assertEqual(
            cmd("--git-dir", self.remote, "show", "main:" + git_sync.AUDIO_PREFIX +
                self.c + ".mp3").encode("utf-8")[:3], b"ID3"
        )
        for key, original in self.source_audio_before.items():
            self.assertEqual(
                (self.source / git_sync.AUDIO_PREFIX / (key + ".mp3")).read_bytes(),
                original,
            )
        self.assertEqual((self.source / git_sync.MANIFEST).read_bytes(),
                         self.manifest_before)

    def test_existing_remote_mp3_never_overwritten(self):
        with git_metadata.metadata_checkout(self.source, self.home) as checkout:
            with self.assertRaisesRegex(RuntimeError, "sesleri yayımladı"):
                git_metadata.publish_missing(self.source, checkout, [self.a])
        committed = json.loads(cmd(
            "--git-dir", self.remote, "show", "main:" + git_sync.MANIFEST
        ))
        self.assertEqual(set(committed["entries"]), {self.a, self.b})

    def test_github_action_race_is_detected_after_cloning(self):
        with git_metadata.metadata_checkout(self.source, self.home) as checkout:
            # The other publisher adds the exact same title after clone.
            clip = self.seed / git_sync.AUDIO_PREFIX / (self.c + ".mp3")
            clip.write_bytes(audio_bytes("ACTIONS-SOUND"))
            write_json(
                self.seed / git_sync.MANIFEST,
                {"version": 1, "entries": {
                    **self.published, self.c: entry(self.c, "Actions first"),
                }},
            )
            cmd("-C", self.seed, "add", ".")
            cmd("-C", self.seed, "commit", "-m", "GitHub Actions went first")
            cmd("-C", self.seed, "push", "origin", "main")
            with self.assertRaisesRegex(RuntimeError, "sesleri yayımladı"):
                git_metadata.publish_missing(self.source, checkout, [self.c])
        actual = json.loads(cmd(
            "--git-dir", self.remote, "show", "main:" + git_sync.MANIFEST
        ))
        self.assertEqual(actual["entries"][self.c]["title"], "Actions first")
        self.assertEqual(
            (self.source / git_sync.AUDIO_PREFIX / (self.c + ".mp3")).read_bytes(),
            self.source_audio_before[self.c],
        )

    def test_unverified_audio_refused_before_publishing(self):
        data = json.loads((self.source / git_sync.MANIFEST).read_text(encoding="utf-8"))
        data["entries"][self.c]["fingerprint"] = "unknown-recovered"
        write_json(self.source / git_sync.MANIFEST, data)
        with git_metadata.metadata_checkout(self.source, self.home) as checkout:
            with self.assertRaisesRegex(RuntimeError, "Onaysız"):
                git_metadata.publish_missing(self.source, checkout, [self.c])


if __name__ == "__main__":
    unittest.main()
