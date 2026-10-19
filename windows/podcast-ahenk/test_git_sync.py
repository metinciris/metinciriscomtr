"""Regression tests for Ahenk Git status, 79 local MP3 backups and publishing.

Run from this directory: python test_git_sync.py
Only temporary local Git repos are used; no real GitHub API or network calls.
"""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import git_sync as audio_sync


def mp3_bytes(text):
    return b"ID3" + text.encode("utf-8") * 400


def entry(key, title="Başlık", date="2026-10-19T12:51:00+00:00"):
    return {
        "title": title, "journal": "Modern Pathology", "pmid": "123",
        "file": key + ".mp3", "fingerprint": "test",
        "generated_at": date,
    }


def make_manifest(entries):
    return {"version": 1, "generated_at": "2026-10-19T12:00:00+00:00", "entries": entries}


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def call(*cmd):
    cp = subprocess.run(cmd, text=True, capture_output=True, check=False,
                        encoding="utf-8", errors="replace")
    if cp.returncode:
        raise AssertionError(f"Git test failed {cmd}: {cp.stderr or cp.stdout}")
    return cp.stdout.strip()


class GitStatusRegression(unittest.TestCase):
    def test_never_strip_leading_porcelain_status_space(self):
        a = "a" * 24
        with patch.object(audio_sync, "git", return_value=(
            " M public/podcast-audio/manifest.json\n"
            f"?? public/podcast-audio/{a}.mp3"
        )):
            changes = audio_sync.changes("unused")
        self.assertEqual(changes["public/podcast-audio/manifest.json"], " M")
        self.assertEqual(changes[f"public/podcast-audio/{a}.mp3"], "??")

    def test_reject_unrelated_files(self):
        with patch.object(audio_sync, "git", return_value=" M README.md"):
            with self.assertRaisesRegex(RuntimeError, "Podcast dışındaki"):
                audio_sync.changes("unused")

    def test_three_way_merges_distinct_titles(self):
        a, b, c = ("a" * 24, "b" * 24, "c" * 24)
        merged = audio_sync.three_way_json(
            audio_sync.MANIFEST,
            make_manifest({a: entry(a, "A")}),
            make_manifest({a: entry(a, "A"), b: entry(b, "B")}),
            make_manifest({a: entry(a, "A"), c: entry(c, "C")}),
        )
        self.assertEqual(set(merged["entries"]), {a, b, c})

    def test_merge_79_generated_with_simultaneous_online_voice(self):
        with tempfile.TemporaryDirectory() as t:
            base = Path(t)
            remote, work, agent, home = (
                base / "origin.git", base / "work", base / "agent", base / "home"
            )
            call("git", "init", "--bare", "--initial-branch=main", str(remote))
            call("git", "clone", str(remote), str(work))
            call("git", "-C", str(work), "config", "user.email", "ci@example.invalid")
            call("git", "-C", str(work), "config", "user.name", "Ahenk Test")
            write_json(work / audio_sync.MANIFEST, make_manifest({}))
            write_json(work / audio_sync.RULES, {
                "version": 1, "global": [], "articles": {}, "global_speed": 1.0,
            })
            call("git", "-C", str(work), "add", ".")
            call("git", "-C", str(work), "commit", "-m", "Initial audio manifest")
            call("git", "-C", str(work), "push", "-u", "origin", "main")

            keys = [f"{i:024x}" for i in range(1, 80)]
            locally_generated = {}
            for i, key in enumerate(keys, 1):
                data = mp3_bytes("local-" + str(i))
                locally_generated[key] = data
                file = work / audio_sync.AUDIO_PREFIX / (key + ".mp3")
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(data)
            write_json(work / audio_sync.MANIFEST, make_manifest({
                key: entry(key, "Yerel makale " + str(i))
                for i, key in enumerate(keys, 1)
            }))

            call("git", "clone", "--branch", "main", str(remote), str(agent))
            call("git", "-C", str(agent), "config", "user.email", "ci@example.invalid")
            call("git", "-C", str(agent), "config", "user.name", "Ahenk Action")
            online = "f" * 24
            write_json(agent / audio_sync.MANIFEST, make_manifest({
                online: entry(online, "Çevrimiçi dergide yeni makale"),
            }))
            (agent / audio_sync.AUDIO_PREFIX / (online + ".mp3")).write_bytes(
                mp3_bytes("web")
            )
            call("git", "-C", str(agent), "add", ".")
            call("git", "-C", str(agent), "commit", "-m", "New online audio")
            call("git", "-C", str(agent), "push", "origin", "main")

            with patch.object(audio_sync, "check_repo"):
                result = audio_sync.sync(work, home)
            final = audio_sync.read_json_file(work / audio_sync.MANIFEST)
            self.assertEqual(len(final["entries"]), 80, result)
            self.assertIn(online, final["entries"])
            for key, original in locally_generated.items():
                self.assertEqual(
                    (work / audio_sync.AUDIO_PREFIX / (key + ".mp3")).read_bytes(),
                    original,
                )
            self.assertTrue(list((home / "yedekler").glob("*")))
            self.assertEqual(len(audio_sync.changes(work)), 80)

    def test_selected_batch_never_sends_unselected_audio(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t) / "repo"
            home = Path(t) / "home"
            keys = ["a" * 24, "b" * 24, "c" * 24]
            for key in keys:
                path = root / audio_sync.AUDIO_PREFIX / (key + ".mp3")
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(mp3_bytes("local"))
            local_manifest = make_manifest({
                key: entry(key, "Makale " + key[0]) for key in keys
            })
            write_json(root / audio_sync.MANIFEST, local_manifest)
            local_rules = {
                "version": 1, "global": [{"find": "SMARCA4", "say": "smark-a4"}],
                "global_speed": 1.0, "articles": {},
            }
            write_json(root / audio_sync.RULES, local_rules)
            remote = make_manifest({keys[0]: entry(keys[0], "Makale a")})
            captured = {}

            def fake_commit(_root, paths):
                captured["paths"] = list(paths)
                captured["manifest"] = audio_sync.read_json_file(root / audio_sync.MANIFEST)
                captured["rules"] = audio_sync.read_json_file(root / audio_sync.RULES)
                return True

            def fake_ref(_root, ref, path, default=None):
                return remote if path == audio_sync.MANIFEST else {
                    "version": 1, "global": [], "global_speed": 1.0, "articles": {},
                }

            with patch.object(audio_sync, "sync"), \
                 patch.object(audio_sync, "ref_json", side_effect=fake_ref), \
                 patch.object(audio_sync, "_commit_and_push", side_effect=fake_commit):
                result = audio_sync.publish_selected_local_voices(root, home, [keys[1]])
            self.assertIn("1 MP3", result)
            self.assertEqual(set(captured["manifest"]["entries"]), {keys[0], keys[1]})
            self.assertEqual(captured["rules"]["global"], [])
            self.assertNotIn(audio_sync.AUDIO_PREFIX + keys[2] + ".mp3", captured["paths"])
            self.assertEqual(
                audio_sync.read_json_file(root / audio_sync.MANIFEST), local_manifest
            )
            self.assertEqual(audio_sync.read_json_file(root / audio_sync.RULES), local_rules)

    def test_web_selected_restores_original_local_mp3(self):
        with tempfile.TemporaryDirectory() as t:
            root, home = Path(t) / "repo", Path(t) / "home"
            key = "a" * 24
            local_entry = entry(key, "Makalem")
            live_entry = entry(key, "Makalem", "2026-10-18T12:00:00+00:00")
            local_data = mp3_bytes("localaudio")
            live_data = mp3_bytes("webvoice")
            local_file = root / audio_sync.AUDIO_PREFIX / (key + ".mp3")
            local_file.parent.mkdir(parents=True, exist_ok=True)
            local_file.write_bytes(local_data)
            write_json(root / audio_sync.MANIFEST, make_manifest({key: local_entry}))
            downloaded = home / "web_mp3" / (key + ".mp3")
            downloaded.parent.mkdir(parents=True)
            downloaded.write_bytes(live_data)
            original_manifest = (root / audio_sync.MANIFEST).read_bytes()
            seen = {}

            def fake_commit(_root, paths):
                seen["audio"] = local_file.read_bytes()
                seen["manifest"] = audio_sync.read_json_file(root / audio_sync.MANIFEST)
                seen["paths"] = list(paths)
                return True

            with patch.object(audio_sync, "sync"), \
                 patch.object(audio_sync, "ref_json", return_value=make_manifest({})), \
                 patch.object(audio_sync, "_commit_and_push", side_effect=fake_commit):
                audio_sync.publish_live_web_voice(root, home, key, live_entry, downloaded)
            self.assertEqual(seen["audio"], live_data)
            self.assertEqual(seen["manifest"]["entries"][key], live_entry)
            self.assertEqual(local_file.read_bytes(), local_data)
            self.assertEqual((root / audio_sync.MANIFEST).read_bytes(), original_manifest)


if __name__ == "__main__":
    unittest.main()
