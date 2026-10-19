"""Regression: publish ONE selected preview to a temporary Git bare remote.

No user files, GitHub account or network are touched. The published trial must
replace the WEB version without replacing the PC-accepted local recording.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import git_sync
import preview_library
import selected_web_audio
from scripts import render_podcast_audio as engine
from scripts import podcast_audio_pronunciation as pron


def git(*arguments):
    result = subprocess.run(
        ["git", *map(str, arguments)], capture_output=True,
        text=True, encoding="utf-8", errors="replace",
    )
    if result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return result.stdout.strip()


class SelectedPreviewWebTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        base = Path(tmp.name)
        self.home = base / "PodcastAhenk"
        self.home.mkdir()
        self.remote = base / "origin.git"
        self.root = base / "work"
        git("init", "--bare", "--initial-branch=main", self.remote)
        git("clone", self.remote, self.root)
        git("-C", self.root, "config", "user.email", "test@example.invalid")
        git("-C", self.root, "config", "user.name", "Ahenk Test")

        self.article = {
            "journal": "Diagnostic Pathology",
            "title": "SMARCA4 füzyon patolojisi üzerine çalışmada NUTM1",
            "pmid": "9876543",
        }
        self.key = engine.key_for(**{
            "journal": self.article["journal"],
            "title": self.article["title"],
            "pmid": self.article["pmid"],
        })
        self.candidate = {
            **self.article,
            "file": self.key + ".mp3",
            "fingerprint": "old-recording-fingerprint",
        }
        self.audio = self.root / git_sync.AUDIO_PREFIX / (self.key + ".mp3")
        self.audio.parent.mkdir(parents=True, exist_ok=True)
        self.old_pc_bytes = b"ID3" + b"accepted-PC-original" * 170
        self.old_web_bytes = self.old_pc_bytes
        self.audio.write_bytes(self.old_pc_bytes)
        self.manifest_path = self.root / git_sync.MANIFEST
        self.rules_path = self.root / git_sync.RULES
        self.old_entry = {**self.candidate, "generated_at": "2026-10-19T07:45:00+00:00"}
        self.initial_manifest = {
            "version": 1, "generated_at": "2026-10-19T07:45:00+00:00",
            "entries": {self.key: self.old_entry},
        }
        self.initial_rules = pron.empty_rules()
        self.manifest_path.write_text(json.dumps(self.initial_manifest), encoding="utf-8")
        self.rules_path.write_text(json.dumps(self.initial_rules), encoding="utf-8")
        git("-C", self.root, "add", ".")
        git("-C", self.root, "commit", "-m", "Initial public WEB MP3")
        git("-C", self.root, "push", "-u", "origin", "main")

        # A recent local-only rule: this must NOT alter other WEB article rules.
        local_rules = pron.empty_rules()
        local_rules["global"] = [{
            "find": "SMARCA4", "say": "smark-a4", "whole_word": True,
        }]
        self.rules_path.write_text(json.dumps(local_rules), encoding="utf-8")
        audition_dir = self.home / "on_dinleme"
        audition_dir.mkdir()
        self.preview = audition_dir / (
            self.key + "_" + "4" * 32 + "_deneme.mp3"
        )
        self.trial_bytes = b"ID3" + b"new-trial-MP3-voice" * 160
        self.preview.write_bytes(self.trial_bytes)
        self.profile = {"text": self.article["title"], "speed": 0.95}
        temporary_rules = {
            **local_rules, "articles": {
                pron.identity(self.article): dict(self.profile)
            }
        }
        speech, speed = pron.speech(
            self.article, temporary_rules, engine.spoken(self.article["title"])
        )
        self.signature = pron.signature(speech, speed)
        preview_library.save_record(
            audition_dir, self.key, self.preview, self.profile, self.signature
        )

    def test_publish_preview_only_changes_remote_pc_bytes_remain(self):
        old_manifest_bytes = self.manifest_path.read_bytes()
        old_rules_bytes = self.rules_path.read_bytes()
        with patch.object(git_sync, "check_repo"):
            published = selected_web_audio.publish_trial(
                self.root, self.home, self.key, self.preview, self.candidate
            )
        self.assertTrue(published["sent"])
        self.assertEqual(self.audio.read_bytes(), self.old_pc_bytes)
        self.assertEqual(self.manifest_path.read_bytes(), old_manifest_bytes)
        self.assertEqual(self.rules_path.read_bytes(), old_rules_bytes)
        self.assertEqual(self.preview.read_bytes(), self.trial_bytes)
        self.assertTrue(list((self.home / "yedekler").glob("*")))

        committed_mp3 = subprocess.run(
            ["git", "-C", str(self.root), "show",
             "origin/main:" + git_sync.AUDIO_PREFIX + self.key + ".mp3"],
            capture_output=True, check=True
        ).stdout
        self.assertEqual(committed_mp3, self.trial_bytes)
        web_manifest = git_sync.ref_json(self.root, "origin/main", git_sync.MANIFEST)
        self.assertNotEqual(
            web_manifest["entries"][self.key]["fingerprint"],
            self.old_entry["fingerprint"]
        )
        self.assertEqual(
            web_manifest["entries"][self.key]["fingerprint"],
            engine.fingerprint(self.signature)
        )
        web_rules = git_sync.ref_json(self.root, "origin/main", git_sync.RULES)
        self.assertEqual(web_rules["global"], [],
                         "Never upload local global rules for other articles")
        article_web_profile = web_rules["articles"][pron.identity(self.article)]
        remote_speech, remote_speed = pron.speech(
            self.article, web_rules, engine.spoken(self.article["title"])
        )
        self.assertEqual(
            pron.signature(remote_speech, remote_speed), self.signature
        )
        self.assertIn("smark-a4", article_web_profile["text"])

    def test_git_push_failure_restores_old_local_mp3_and_manifest(self):
        old_manifest = self.manifest_path.read_bytes()
        old_rules = self.rules_path.read_bytes()
        with patch.object(git_sync, "check_repo"), \
             patch.object(git_sync, "_commit_and_push",
                          side_effect=RuntimeError("Simulated GitHub permission failure")):
            with self.assertRaisesRegex(RuntimeError, "Simulated"):
                selected_web_audio.publish_trial(
                    self.root, self.home, self.key, self.preview, self.candidate
                )
        self.assertEqual(self.audio.read_bytes(), self.old_pc_bytes)
        self.assertEqual(self.manifest_path.read_bytes(), old_manifest)
        self.assertEqual(self.rules_path.read_bytes(), old_rules)
        self.assertEqual(self.preview.read_bytes(), self.trial_bytes)

    def test_missing_or_wrong_sidecar_never_publishes(self):
        self.preview.with_suffix(".json").unlink()
        with self.assertRaisesRegex(RuntimeError, "ayarları yok"):
            selected_web_audio.publish_trial(
                self.root, self.home, self.key, self.preview, self.candidate
            )
        self.assertEqual(self.audio.read_bytes(), self.old_pc_bytes)
        self.assertEqual(
            git_sync.ref_json(self.root, "HEAD", git_sync.MANIFEST)["entries"][self.key],
            self.old_entry,
        )


if __name__ == "__main__":
    unittest.main()
