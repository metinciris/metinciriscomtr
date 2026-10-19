"""Windows Ahenk preview regression: unique files and player-independent approval.

Run with python.exe on a Windows GitHub Actions runner with Tkinter.
No real Ahenk model, FFmpeg invocation or GitHub network is needed.
"""
import json
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
import two_step_manager as ui
from scripts import render_podcast_audio as engine


def await_idle(root, app, timeout=9):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        root.update()
        if not app.busy:
            return
        time.sleep(0.025)
    raise AssertionError("Preview worker did not become idle")


class PreviewRegressions(unittest.TestCase):
    def test_retry_unique_path_and_player_failure_still_allows_acceptance(self):
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp) / "home"
            repo = Path(temp) / "repo"
            home.mkdir()
            audio = repo / "public" / "podcast-audio"
            audio.mkdir(parents=True)
            preview_dir = home / "on_dinleme"
            preview_dir.mkdir(parents=True)
            rules = audio / "pronunciation.json"
            manifest = audio / "manifest.json"
            manifest.write_text('{"version": 1, "entries": {}}', encoding="utf-8")
            item = {
                "journal": "Diagnostic Pathology",
                "title": "Patoloji Ahenk örnek başlığı",
                "pmid": "991002",
            }
            catalog = engine.catalog([item])
            key = next(iter(catalog))
            rendered = []

            def render(_tts, text, destination, speed=1.0):
                # Windows players could lock an already existing filename.
                self.assertFalse(destination.exists(), "An earlier audition was overwritten")
                destination.write_bytes(b"ID3" + b"A" * 2000)
                rendered.append((text, destination, speed))

            root = tk.Tk()
            root.withdraw()
            try:
                with patch.object(ui, "ROOT", repo), \
                     patch.object(ui, "HOME", home), \
                     patch.object(ui, "CACHE", home / "cache.json"), \
                     patch.object(ui, "ERROR_LOG", home / "error.log"), \
                     patch.object(base, "ROOT", repo), \
                     patch.object(base, "HOME", home), \
                     patch.object(base, "CACHE", home / "cache.json"), \
                     patch.object(base, "AUDIO", audio), \
                     patch.object(base, "RULES", rules), \
                     patch.object(base, "PREVIEWS", preview_dir), \
                     patch.object(base, "EVENT_LOG", home / "events.log"), \
                     patch.object(engine, "AUDIO_DIR", audio), \
                     patch.object(engine, "MANIFEST_PATH", manifest), \
                     patch.object(ui.TwoStepManager, "_startup", lambda _self: None), \
                     patch.multiple(ui.TwoStepManager, _resume_watch=lambda _self: None, _start_engine_automatically=lambda _self: None), \
                     patch.object(ui.TwoStepManager, "_tts", return_value=object()), \
                     patch.object(ui.shutil, "which", return_value="ffmpeg.exe"), \
                     patch.object(engine, "render_clip", side_effect=render), \
                     patch.object(audio_playback.FastMP3Player, "play",
                                  return_value="hızlı test"):
                    app = ui.TwoStepManager(root)
                    app.articles = [item]
                    app._rebuild()
                    self.assertEqual(app.current, key)
                    # All-site-published case: once a voice is on WEB, default
                    # 'WEB'de eksik' view would otherwise contain zero rows.
                    app.web_manifest = {"version": 1, "entries": {
                        key: {**catalog[key], "generated_at": "2026-10-19T12:00:00+00:00"},
                    }}
                    app.filter.set("web_missing")
                    app._rebuild()
                    self.assertEqual(app.filter.get(), "all")
                    self.assertEqual(app.current, key)
                    app.editor.delete("1.0", "end")
                    app.editor.insert("1.0", "Merhaba! Özel okuma denemesi.")
                    app.speed.set("0.95")
                    app.preview_sound()
                    await_idle(root, app)
                    first = app.preview
                    self.assertIsNotNone(first)
                    self.assertTrue(first["path"].is_file())
                    self.assertIn("Yeni ses PC sesleri listesine eklendi",
                                  app.preview_feedback.get())
                    self.assertEqual(len(app.clip_tree.get_children()), 1)
                    self.assertEqual(str(app.btn_accept["state"]), "normal")
                    self.assertEqual(str(app.btn_replay["state"]), "normal")
                    self.assertEqual(rendered[0][2], 0.95)
                    self.assertNotIn(key, engine.load_manifest()["entries"])

                    # Same selected title remains opened. Second preview must
                    # use a different file, because first may be player-locked.
                    app.preview_sound()
                    await_idle(root, app)
                    second = app.preview
                    self.assertNotEqual(first["path"], second["path"])
                    self.assertTrue(first["path"].is_file())
                    self.assertTrue(second["path"].is_file())
                    self.assertIn("Yeni ses PC sesleri listesine eklendi",
                                  app.preview_feedback.get())
                    self.assertEqual(len(app.clip_tree.get_children()), 2)
                    self.assertEqual(len(rendered), 2)
                    self.assertEqual(str(app.btn_accept["state"]), "normal")
                    self.assertFalse((audio / (key + ".mp3")).exists(),
                                     "Preview must not replace the accepted PC MP3")
                    self.assertEqual(len(list(preview_dir.glob("*_deneme.mp3"))), 2)
                    self.assertEqual(len(list(preview_dir.glob("*_deneme.json"))), 2)
            finally:
                root.destroy()

    def test_busy_click_reports_reason_without_creating_audio(self):
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp) / "home"
            repo = Path(temp) / "repo"
            home.mkdir()
            (repo / "public" / "podcast-audio").mkdir(parents=True)
            messages = []
            window = tk.Tk()
            window.withdraw()
            try:
                with patch.object(ui, "ROOT", repo), \
                     patch.object(ui, "HOME", home), \
                     patch.object(ui, "CACHE", home / "cache.json"), \
                     patch.object(ui, "ERROR_LOG", home / "error.log"), \
                     patch.object(base, "ROOT", repo), \
                     patch.object(base, "HOME", home), \
                     patch.object(base, "CACHE", home / "cache.json"), \
                     patch.object(base, "AUDIO", repo / "public" / "podcast-audio"), \
                     patch.object(base, "RULES", repo / "public" / "podcast-audio" / "pronunciation.json"), \
                     patch.object(ui.TwoStepManager, "_startup", lambda _self: None), \
                     patch.multiple(ui.TwoStepManager, _resume_watch=lambda _self: None, _start_engine_automatically=lambda _self: None), \
                     patch.object(ui.messagebox, "showinfo",
                                  side_effect=lambda title, msg: messages.append((title, msg))):
                    app = ui.TwoStepManager(window)
                    app.busy = True
                    app.preview_sound()
                    self.assertEqual(len(messages), 1)
                    self.assertIn("işlem", messages[0][0].lower())
                    app.busy = False
            finally:
                window.destroy()


if __name__ == "__main__":
    unittest.main()
