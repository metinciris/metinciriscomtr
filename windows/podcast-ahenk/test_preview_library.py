"""Regression for Ahenk per-article audio archives, pronunciation and fast playback.

No real FFplay, Windows Media Player, speaker device or TTS model required.
"""
from pathlib import Path
import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import audio_playback
import preview_library


KEY = "a" * 24


class PreviewArchiveTest(unittest.TestCase):
    def test_preview_history_persists_without_touching_accepted_mp3(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            source = home / ("a" * 24 + ".mp3")
            source.write_bytes(b"ID3" + b"X" * 2096)
            old_audio = source.read_bytes()
            for idx in range(3):
                trial = home / (KEY + "_" + f"{idx:032x}" + "_deneme.mp3")
                trial.write_bytes(b"ID3" + bytes([65 + idx]) * 2300)
                os.utime(trial, (1000000 + idx * 10, 1000000 + idx * 10))
                preview_library.save_record(
                    home, KEY, trial,
                    {"text": f"SMARCA4 yeni ses {idx}", "speed": 0.95},
                    f"matching-signature-{idx}",
                )
            results = preview_library.previews_for_article(home, KEY, limit=9)
            self.assertEqual(len(results), 3)
            self.assertEqual(results[0]["record"]["profile"]["text"], "SMARCA4 yeni ses 2")
            self.assertEqual(results[2]["record"]["profile"]["text"], "SMARCA4 yeni ses 0")
            self.assertEqual(source.read_bytes(), old_audio)
            self.assertEqual(len(preview_library.recent_previews(home)), 3)
            self.assertFalse(preview_library.previews_for_article(home, "b" * 24))

    def test_only_actual_pronunciation_matches_are_visible(self):
        rules = {"version": 1, "global": [
            {"find": "SMARCA4", "say": "smark-a4", "whole_word": True},
            {"find": "NUTM1", "say": "nat-em-bir", "whole_word": True},
            {"find": "ERG", "say": "e-er-ge", "whole_word": True},
            {"find": "karsinom", "say": "kanser", "whole_word": True},
        ]}
        matched = preview_library.applicable_rules(
            "smarca4 eksikliği olan tümörde ERG pozitif", rules
        )
        self.assertEqual([x["find"] for x in matched], ["SMARCA4", "ERG"])
        self.assertFalse(
            preview_library.applicable_rules("SMARCA42 ve ERG1", rules)
        )
        self.assertEqual(
            [x["find"] for x in preview_library.applicable_rules(
                "NUTM1-füzyon ve karsinom", rules
            )],
            ["NUTM1", "karsinom"],
        )

    def test_preview_missing_profile_can_be_listened_to_but_not_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            file = folder / (KEY + "_deneme.mp3")
            file.write_bytes(b"ID3" + b"X" * 2024)
            result = preview_library.previews_for_article(folder, KEY)
            self.assertEqual(len(result), 1)
            self.assertIsNone(result[0]["record"])

    def test_reject_unexpected_metadata_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            file = folder / (KEY + "_" + "f" * 32 + "_deneme.mp3")
            file.write_bytes(b"ID3" + b"X" * 2024)
            with self.assertRaises(ValueError):
                preview_library.save_record(
                    folder, "b" * 24, file, {"text": "deneme", "speed": 1.0}, "x"
                )


class FastPlaybackTest(unittest.TestCase):
    def test_ffplay_is_reused_and_previous_voice_stopped(self):
        with tempfile.TemporaryDirectory() as directory:
            audio = Path(directory) / "speech.mp3"
            audio.write_bytes(b"ID3" + b"X" * 2024)
            player = audio_playback.FastMP3Player()
            first = MagicMock()
            first.poll.return_value = None
            second = MagicMock()
            with patch.object(
                audio_playback.FastMP3Player, "_find_ffplay",
                return_value="C:/Tools/ffplay.exe"
            ), patch.object(
                audio_playback.subprocess, "Popen", side_effect=[first, second]
            ) as popen:
                self.assertEqual(player.play(audio), "hızlı oynatıcı")
                self.assertEqual(player.play(audio), "hızlı oynatıcı")
            first.terminate.assert_called_once()
            self.assertEqual(popen.call_count, 2)
            self.assertIn("-nodisp", popen.call_args.args[0])
            self.assertIn("-autoexit", popen.call_args.args[0])

    def test_missing_mp3_is_reported_without_launch(self):
        with tempfile.TemporaryDirectory() as directory:
            player = audio_playback.FastMP3Player()
            with self.assertRaises(RuntimeError):
                player.play(Path(directory) / "missing.mp3")


if __name__ == "__main__":
    unittest.main()
