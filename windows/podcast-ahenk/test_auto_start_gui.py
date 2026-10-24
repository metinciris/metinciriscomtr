"""Windows Tk test: opening Ahenk automatically finishes WEB missing audio.

Real GitHub credentials, network, TTS and user MP3s are NEVER touched.
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


def wait_for(root, predicate, seconds=6):
    stop = time.monotonic() + seconds
    while time.monotonic() < stop:
        root.update()
        if predicate():
            return
        time.sleep(0.015)
    raise AssertionError("Automatic Ahenk GUI did not finish")


class AutoStartGuiTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.dir = Path(self.temp.name)
        self.home = self.dir / "home"
        self.home.mkdir()
        self.repo = self.dir / "repo"
        self.audio = self.repo / "public" / "podcast-audio"
        self.audio.mkdir(parents=True)
        self.cache = self.home / "makale_onbellek.json"
        self.article = {
            "title": "Patolojide ayrintili molekuler tanisal gelismeler",
            "journal": "Modern Pathology", "pmid": "42300701",
        }
        self.articles = [self.article]
        self.catalog = engine.catalog(self.articles)
        key = next(iter(self.catalog))
        self.site = {
            "version": 1,
            "entries": {key: {**self.catalog[key], "generated_at": "2026-10-24"}},
        }
        (self.audio / "manifest.json").write_text(
            json.dumps({"version": 1, "entries": {}}), encoding="utf-8"
        )

    def make_app(self, root, calls):
        patches = [
            patch.object(ui, "ROOT", self.repo),
            patch.object(ui.base, "ROOT", self.repo),
            patch.object(ui, "HOME", self.home),
            patch.object(ui.base, "HOME", self.home),
            patch.object(ui, "CACHE", self.cache),
            patch.object(ui.base, "CACHE", self.cache),
            patch.object(ui, "ERROR_LOG", self.home / "errors.log"),
            patch.object(ui.base, "EVENT_LOG", self.home / "events.log"),
            patch.object(ui.base, "AUDIO", self.audio),
            patch.object(engine, "AUDIO_DIR", self.audio),
            patch.object(engine, "MANIFEST_PATH", self.audio / "manifest.json"),
            patch.object(
                ui.audio_runtime, "ensure_runtime",
                side_effect=AssertionError("Automatic scan must not preload model")
            ),
            patch.object(
                ui.daily_worker, "run_once",
                side_effect=calls
            ),
            patch.object(
                ui.online_audio, "fetch_manifest",
                side_effect=AssertionError("No redundant WEBSITE request")
            ),
        ]
        for p in patches:
            p.__enter__()
            self.addCleanup(p.__exit__, None, None, None)
        return ui.TwoStepManager(root)

    def test_launch_default_runs_once_shows_progress_and_final_summary(self):
        calls = []

        def fake_run_once(progress=None, stopping=None):
            calls.append(True)
            progress({"phase": "checking", "message": "WEB taranıyor"})
            progress({"phase": "generating", "message": "Başlık 1 üretildi",
                      "current": 1, "total": 2})
            progress({"phase": "uploaded", "message": "GitHub gönderildi",
                      "current": 2, "total": 2})
            return {
                "status": "complete", "listed": 1, "web_missing": 0,
                "generated": 2, "uploaded": 0, "skipped": [],
                "_articles": self.articles, "_website": self.site,
            }

        root = tk.Tk()
        root.withdraw()
        try:
            app = self.make_app(root, fake_run_once)
            self.assertTrue(app.auto_start_enabled.get())
            app.enable_startup_autorun()
            wait_for(root, lambda: len(calls) == 1 and not app.busy)
            self.assertEqual(len(calls), 1)
            self.assertIn("2 yeni MP3", app.stage_description.get())
            self.assertIn("Başlık 1 üretildi", app.auto_events.get("1.0", "end"))
            self.assertIn("GitHub gönderildi", app.auto_events.get("1.0", "end"))
            self.assertEqual(app.auto_state.get(), "Tamamlandı")
            self.assertEqual(str(app.btn_auto_run["state"]), "normal")
            self.assertEqual(len(app.articles), 1)
            self.assertEqual(float(app.stage_bar["value"]), 100.0)
        finally:
            root.destroy()

    def test_persisted_disabled_setting_prevents_startup_automatic_run(self):
        ui.write_auto_setting(self.home, False)
        calls = []

        def unauthorized(*args, **kwargs):
            calls.append(True)
            raise AssertionError("Startup automatic run was disabled")

        root = tk.Tk()
        root.withdraw()
        try:
            with patch.object(ui.TwoStepManager, "_startup", lambda _self: None), \
                 patch.object(ui.TwoStepManager, "_start_engine_automatically",
                              lambda _self: None):
                app = self.make_app(root, unauthorized)
                self.assertFalse(app.auto_start_enabled.get())
                app.enable_startup_autorun()
                end = time.monotonic() + 1.1
                while time.monotonic() < end:
                    root.update()
                    time.sleep(0.02)
                self.assertEqual(calls, [])
                self.assertFalse(app._auto_running)
                app.auto_start_enabled.set(True)
                app._auto_setting_changed()
                self.assertTrue(ui.read_auto_setting(self.home))
                self.assertTrue((self.home / ui.AUTO_SETTINGS).is_file())
        finally:
            root.destroy()

    def test_scheduled_launch_option_and_single_finish_timer(self):
        self.assertFalse(ui.scheduled_launch_requested([]))
        self.assertTrue(ui.scheduled_launch_requested(["--scheduled"]))
        with self.assertRaises(ValueError):
            ui.scheduled_launch_requested(["--unexpected"])

        root = tk.Tk()
        root.withdraw()
        try:
            app = self.make_app(root, lambda **_kwargs: {})
            app._scheduled_mode = True
            with patch.object(root, "after", wraps=root.after) as after:
                app._scheduled_finish("Yeni: 0; GitHub: 0; tamamlandı")
                close_callbacks = [
                    args for args, _kwargs in
                    ((call.args, call.kwargs) for call in after.call_args_list)
                    if args and args[0] == ui.SCHEDULED_RESULT_VISIBLE_MS
                ]
            self.assertEqual(len(close_callbacks), 1)
            self.assertEqual(close_callbacks[0][1], root.destroy)
            log = self.home / ui.SCHEDULED_LAUNCH_LOG
            self.assertIn("tamamlandı", log.read_text(encoding="utf-8"))
        finally:
            root.destroy()

    def test_normal_desktop_launch_does_not_schedule_auto_close(self):
        root = tk.Tk()
        root.withdraw()
        try:
            app = self.make_app(root, lambda **_kwargs: {})
            self.assertFalse(app._scheduled_mode)
            with patch.object(root, "after", wraps=root.after) as after:
                app._scheduled_finish("Desktop session; stay open")
                self.assertFalse(
                    any(call.args and call.args[0] == ui.SCHEDULED_RESULT_VISIBLE_MS
                        for call in after.call_args_list)
                )
            self.assertFalse((self.home / ui.SCHEDULED_LAUNCH_LOG).exists())
        finally:
            root.destroy()

    def test_automatic_error_is_visible_and_does_not_block_with_dialog(self):
        def failing_job(progress=None, stopping=None):
            progress({"phase": "checking", "message": "WEB yanıtı bekleniyor"})
            raise RuntimeError("GitHub baglantisi gecici olarak kullanilamiyor")

        root = tk.Tk()
        root.withdraw()
        try:
            app = self.make_app(root, failing_job)
            with patch.object(ui.messagebox, "showerror",
                              side_effect=AssertionError("No modal dialog")):
                app.enable_startup_autorun()
                wait_for(
                    root,
                    lambda: not app.busy and
                    "OTOMATİK HATA" in app.stage_description.get(),
                )
            self.assertIn("GitHub baglantisi", app.stage_description.get())
            self.assertIn("HATA:", app.auto_events.get("1.0", "end"))
            self.assertTrue((self.home / "errors.log").exists())
            self.assertEqual(str(app.btn_auto_run["state"]), "normal")
        finally:
            root.destroy()


if __name__ == "__main__":
    unittest.main()
