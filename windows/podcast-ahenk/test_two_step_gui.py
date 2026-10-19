"""Windows UI regression: two buttons and stage 1 never re-render local MP3s.

Uses a disposable local audio folder and synthetic MP3 bytes, never GitHub
authentication or the actual Ahenk neural model.
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
import two_step_manager as ui
from scripts import render_podcast_audio as engine


def clip(path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"ID3" + b"x" * 1900)


def wait_until_idle(root, app, timeout=8):
    expiry = time.monotonic() + timeout
    while time.monotonic() < expiry:
        root.update()
        if not app.busy:
            return
        time.sleep(0.02)
    raise AssertionError("Two-step GUI did not become idle")


class TwoStepGuiSmoke(unittest.TestCase):
    def test_24_titles_stage1_generates_only_one_file_and_not_upload(self):
        with tempfile.TemporaryDirectory() as temp:
            root_path = Path(temp) / "repo"
            home = Path(temp) / "local"
            home.mkdir()
            audio = root_path / "public" / "podcast-audio"
            audio.mkdir(parents=True)
            articles = [
                {"journal": "Diagnostic Pathology",
                 "title": f"Makale {i:02d}: patolojide modern molekuler tanilama ve yontemler",
                 "pmid": str(100000 + i)}
                for i in range(24)
            ]
            catalog = engine.catalog(articles)
            keys = list(catalog)
            # First half already on live website; last 12 absent online.
            site = {"version": 1, "entries": {
                key: {**catalog[key], "generated_at": "2026-10-19T10:00:00+00:00"}
                for key in keys[:12]
            }}
            # 11 of the 12 missing web MP3s already exist on the Windows PC.
            last = keys[-1]
            existing_keys = keys[12:-1]
            before = {}
            for key in existing_keys:
                target = audio / (key + ".mp3")
                clip(target)
                before[key] = target.read_bytes()
            local = {"version": 1, "entries": {
                key: {**catalog[key], "generated_at": "2026-10-19T12:30:00+00:00"}
                for key in existing_keys
            }}
            (audio / "manifest.json").write_text(json.dumps(local), encoding="utf-8")

            def fake_render(_tts, _text, path, speed=1.0):
                clip(path)

            tk_root = tk.Tk()
            tk_root.withdraw()
            try:
                with patch.object(ui, "ROOT", root_path), \
                     patch.object(ui.base, "ROOT", root_path), \
                     patch.object(ui, "HOME", home), \
                     patch.object(ui.base, "HOME", home), \
                     patch.object(ui, "CACHE", home / "makale_onbellek.json"), \
                     patch.object(ui, "ERROR_LOG", home / "ahenk_hata.log"), \
                     patch.object(engine, "AUDIO_DIR", audio), \
                     patch.object(engine, "MANIFEST_PATH", audio / "manifest.json"), \
                     patch.object(engine, "load_sheet", return_value=articles), \
                     patch.object(ui.online_audio, "fetch_manifest", return_value=site), \
                     patch.object(ui.TwoStepManager, "_startup", lambda _self: None), \
                     patch.multiple(ui.TwoStepManager, _resume_watch=lambda _self: None, _start_engine_automatically=lambda _self: None), \
                     patch.object(ui.TwoStepManager, "_tts", return_value=object()), \
                     patch.object(engine, "render_clip", side_effect=fake_render) as render_mock, \
                     patch.object(ui.git_sync, "publish_selected_local_voices",
                                  side_effect=AssertionError("Stage 1 attempted GitHub upload")):
                    app = ui.TwoStepManager(tk_root)
                    app.articles = articles
                    app._rebuild()
                    self.assertIsNotNone(app.step_one)
                    self.assertIsNotNone(app.step_two)
                    self.assertEqual(app.filter.get(), "web_missing")
                    app.prepare_web_missing()
                    wait_until_idle(tk_root, app)
                    self.assertEqual(render_mock.call_count, 1)
                    self.assertTrue((audio / (last + ".mp3")).is_file())
                    for key, original in before.items():
                        self.assertEqual((audio / (key + ".mp3")).read_bytes(), original)
                    self.assertIn("12 tanesi PC'de hazır", app.stage_description.get())
                    self.assertEqual(app.totals["web"], 12)
                    self.assertEqual(app.totals["pc"], 12)
            finally:
                tk_root.destroy()


if __name__ == "__main__":
    unittest.main()
