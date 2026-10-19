"""Windows Tk regression: fast playback, visible PC clip list and term matches.

Mock the speaker, WEB request and neural model. Use isolated temp MP3 files.
"""
import json
from contextlib import ExitStack
from pathlib import Path
import sys
import tempfile
import time
import tkinter as tk
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import audio_playback
import simple_manager as base
import two_step_manager as app_module
import online_audio
from scripts import render_podcast_audio as engine


def wait_for(root, condition, seconds=7):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        root.update()
        if condition():
            return
        time.sleep(0.015)
    raise AssertionError("Timed out waiting for audio UI event")


class FastPCListTest(unittest.TestCase):
    def test_audio_buttons_work_while_busy_and_generated_trial_appears(self):
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp) / "home"
            root_path = Path(temp) / "repo"
            home.mkdir()
            audio_dir = root_path / "public" / "podcast-audio"
            audio_dir.mkdir(parents=True)
            previews = home / "on_dinleme"
            previews.mkdir()
            rules_path = audio_dir / "pronunciation.json"
            rules_path.write_text(json.dumps({
                "version": 1, "global_speed": 1.0,
                "global": [
                    {"find": "SMARCA4", "say": "smark-a4", "whole_word": True},
                    {"find": "NUTM1", "say": "nat-em-bir", "whole_word": True},
                ], "articles": {},
            }), encoding="utf-8")
            article = {
                "journal": "Diagnostic Pathology",
                "title": "SMARCA4 kaybı ve yeni tümör tanısı",
                "pmid": "77701",
            }
            candidate = engine.catalog([article])
            key = next(iter(candidate))
            accepted = audio_dir / (key + ".mp3")
            accepted.write_bytes(b"ID3" + b"K" * 4000)
            entry = {**candidate[key], "generated_at": "2026-10-19T14:00:00+00:00"}
            (audio_dir / "manifest.json").write_text(
                json.dumps({"version": 1, "entries": {key: entry}}),
                encoding="utf-8"
            )
            web_cache = home / "web_mp3"
            web_cache.mkdir()
            web_mp3 = web_cache / (key + ".mp3")
            web_mp3.write_bytes(b"ID3" + b"W" * 2400)
            web_mp3.with_suffix(".entry.json").write_text(
                json.dumps(entry), encoding="utf-8"
            )

            played = []
            def fake_play(_player, path):
                played.append(Path(path))
                return "hızlı test oynatıcısı"

            def fake_render(_tts, spoken, output, speed=1.0):
                Path(output).write_bytes(b"ID3" + b"T" * 2800)

            tk_root = tk.Tk()
            tk_root.withdraw()
            try:
                # ExitStack avoids Python's compile-time 20-nested-with limit.
                with ExitStack() as stack:
                    simple_patches = [
                        (app_module, "ROOT", root_path),
                        (base, "ROOT", root_path),
                        (app_module, "HOME", home),
                        (base, "HOME", home),
                        (app_module, "CACHE", home / "cache.json"),
                        (base, "CACHE", home / "cache.json"),
                        (app_module, "ERROR_LOG", home / "errors.log"),
                        (base, "EVENT_LOG", home / "events.log"),
                        (base, "AUDIO", audio_dir),
                        (base, "RULES", rules_path),
                        (base, "PREVIEWS", previews),
                        (engine, "AUDIO_DIR", audio_dir),
                        (engine, "MANIFEST_PATH", audio_dir / "manifest.json"),
                        (app_module.TwoStepManager, "_startup", lambda _self: None),
                        (app_module.TwoStepManager, "_resume_watch", lambda _self: None),
                        (app_module.TwoStepManager, "_start_engine_automatically", lambda _self: None),
                        (app_module.TwoStepManager, "_tts", lambda _self: object()),
                        (app_module.shutil, "which", lambda _name: "ffmpeg.exe"),
                        (audio_playback.FastMP3Player, "play", fake_play),
                    ]
                    for target, attr, value in simple_patches:
                        stack.enter_context(patch.object(target, attr, value))
                    stack.enter_context(
                        patch.object(engine, "render_clip", side_effect=fake_render)
                    )
                    stack.enter_context(
                        patch.object(
                            app_module.online_audio, "_read_https",
                            side_effect=AssertionError("Unexpected WEB request")
                        )
                    )
                    app = app_module.TwoStepManager(tk_root)
                    app.articles = [article]
                    app.web_manifest = {"version": 1, "entries": {key: entry}}
                    app.web_confirmed = True
                    app._rebuild()
                    self.assertEqual(app.filter.get(), "all")
                    self.assertEqual(app.current, key)
                    self.assertIn("SMARCA4 → smark-a4", app.dictionary_summary.get())
                    self.assertNotIn("NUTM1", app.dictionary_summary.get())
                    self.assertEqual(list(app._clip_rows), ["accepted"])

                    # Busy state must not block PC/WEB audio playback.
                    app.busy = True
                    app.btn_listen_pc.invoke()
                    wait_for(tk_root, lambda: len(played) == 1)
                    self.assertEqual(played[0], accepted)
                    app.btn_listen_web.invoke()
                    wait_for(tk_root, lambda: len(played) == 2)
                    self.assertEqual(played[1], web_mp3)
                    app.busy = False

                    # Each preview appears as a NEW list row immediately.
                    app.editor.delete("1.0", "end")
                    app.editor.insert("1.0", "SMARCA4 ve NUTM1 füzyon tanısı")
                    app._refresh_relevant_terms()
                    self.assertIn("NUTM1 → nat-em-bir", app.dictionary_summary.get())
                    app.btn_preview.invoke()
                    wait_for(
                        tk_root, lambda: not app.busy and
                        len(app.clip_tree.get_children()) == 2
                    )
                    self.assertEqual(len(app._clip_rows), 2)
                    self.assertTrue(any(v["kind"] == "trial"
                                        for v in app._clip_rows.values()))
                    self.assertEqual(str(app.btn_accept["state"]), "normal")
                    self.assertEqual(len(list(previews.glob("*_deneme.json"))), 1)
                    self.assertEqual(accepted.read_bytes(), b"ID3" + b"K" * 4000)

                    # A user's later editor changes cannot silently accept
                    # a trial synthesized with a different reading.
                    app.editor.delete("1.0", "end")
                    app.editor.insert("1.0", "Başka bir metin")
                    app._refresh_relevant_terms()
                    self.assertEqual(str(app.btn_accept["state"]), "disabled")
                    self.assertEqual(str(app.btn_load_recording["state"]), "normal")
                    app.btn_load_recording.invoke()
                    self.assertEqual(str(app.btn_accept["state"]), "normal")
                    self.assertEqual(str(app.btn_load_recording["state"]), "disabled")
                    self.assertIn("SMARCA4", app.editor.get("1.0", "end-1c"))

                    # History survives an article refresh without overwriting.
                    app._rebuild()
                    self.assertEqual(len(app.clip_tree.get_children()), 2)
            finally:
                tk_root.destroy()


if __name__ == "__main__":
    unittest.main()
