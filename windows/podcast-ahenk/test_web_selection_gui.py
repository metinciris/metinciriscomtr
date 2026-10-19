"""Windows: visible per-article WEB selection of accepted versus trial MP3.

No real GitHub credentials, FFmpeg, TTS or web requests are used. All data
reside under a throwaway temporary directory.
"""
from contextlib import ExitStack
import json
from pathlib import Path
import sys
import tempfile
import time
import tkinter as tk
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import simple_manager as base
import two_step_manager as ui
import preview_library
import two_step_audio as flow
from scripts import render_podcast_audio as engine
from scripts import podcast_audio_pronunciation as pron


class SingleClipUIRegression(unittest.TestCase):
    def test_visible_buttons_publish_selected_trial_and_approved_pc_separately(self):
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp) / "home"
            repo = Path(temp) / "repo"
            home.mkdir()
            audio = repo / "public" / "podcast-audio"
            audio.mkdir(parents=True)
            previews = home / "on_dinleme"
            previews.mkdir()
            article = {
                "journal": "Modern Pathology",
                "title": "CCL5 ve GLUT1 kolorektal kanser araştırması",
                "pmid": "887766",
            }
            key = engine.key_for(
                article["journal"], article["title"], article["pmid"]
            )
            candidate = {
                **article, "file": key + ".mp3",
                "fingerprint": "old-local",
            }
            local_entry = {**candidate, "generated_at": "2026-10-19T09:00:00+00:00"}
            remote_entry = {**candidate, "fingerprint": "new-trial",
                            "generated_at": "2026-10-19T13:00:00+00:00"}
            accepted = audio / (key + ".mp3")
            accepted.write_bytes(b"ID3" + b"C" * 2048)
            (audio / "manifest.json").write_text(
                json.dumps({"version": 1, "entries": {key: local_entry}}),
                encoding="utf-8",
            )
            rules_file = audio / "pronunciation.json"
            rules_file.write_text(json.dumps(pron.empty_rules()), encoding="utf-8")
            profile = {"text": article["title"], "speed": 1.0}
            trial = previews / (key + "_" + "a" * 32 + "_deneme.mp3")
            trial.write_bytes(b"ID3" + b"T" * 2500)
            preview_library.save_record(previews, key, trial, profile, "trial")
            actions = []
            confirmations = []

            def fake_trial(*args):
                actions.append(("trial", args))
                return {"sent": True, "message": "Seçilen deneme WEB'e gönderildi"}

            def fake_local(*args):
                actions.append(("accepted", args))
                return "Kabul edilen PC sesi WEB'e gönderildi"

            web = {"version": 1, "entries": {key: local_entry}}
            remote = {"version": 1, "entries": {key: remote_entry}}
            window = tk.Tk()
            window.withdraw()
            try:
                with ExitStack() as stack:
                    for owner, attr, value in [
                        (ui, "ROOT", repo),
                        (base, "ROOT", repo),
                        (ui, "HOME", home),
                        (base, "HOME", home),
                        (ui, "CACHE", home / "cache.json"),
                        (base, "CACHE", home / "cache.json"),
                        (ui, "ERROR_LOG", home / "errors.log"),
                        (base, "EVENT_LOG", home / "events.log"),
                        (base, "AUDIO", audio),
                        (base, "RULES", rules_file),
                        (base, "PREVIEWS", previews),
                        (engine, "AUDIO_DIR", audio),
                        (engine, "MANIFEST_PATH", audio / "manifest.json"),
                        (ui.TwoStepManager, "_startup", lambda _self: None),
                        (ui.TwoStepManager, "_resume_watch", lambda _self: None),
                        (ui.TwoStepManager, "_start_engine_automatically",
                         lambda _self: None),
                        (ui.TwoStepManager, "_start_watch", lambda _self: None),
                        (ui.selected_web_audio, "publish_trial", fake_trial),
                        (ui.git_sync, "publish_selected_local_voices", fake_local),
                        (ui.git_sync, "remote_manifest", lambda _root: remote),
                        (ui.online_audio, "fetch_manifest", lambda: web),
                        (ui.messagebox, "askyesno",
                         lambda title, body: confirmations.append(body) or True),
                    ]:
                        stack.enter_context(patch.object(owner, attr, value))

                    app = ui.TwoStepManager(window)
                    app.articles = [article]
                    app.web_manifest = web
                    app.web_confirmed = True
                    app._rebuild()
                    window.update_idletasks()

                    # Primary buttons physically precede WEB/PC audio boxes
                    # so they remain visible on a short Windows display.
                    self.assertIsNotNone(app.btn_preview)
                    self.assertIsNotNone(app.btn_publish_one)
                    # Withdrawn Windows Tk roots report identical rooty
                    # coordinates for children. Check actual widget order.
                    right = app.btn_publish_one.master.master
                    clips_box = app.clip_tree.master.master
                    self.assertLess(
                        right.winfo_children().index(app.btn_publish_one.master),
                        right.winfo_children().index(clips_box),
                    )
                    self.assertEqual(app.current, key)
                    self.assertIn("WEB", app.btn_publish_one.cget("text"))
                    self.assertEqual(str(app.btn_publish_one["state"]), "normal")

                    trial_row = next(
                        iid for iid, meta in app._clip_rows.items()
                        if meta["kind"] == "trial"
                    )
                    app.clip_tree.selection_set(trial_row)
                    app._choose_pc_recording()
                    self.assertIn("Yeni deneme", app.web_choice_label.get())
                    self.assertEqual(str(app.btn_publish_one["state"]), "normal")
                    app.btn_publish_one.invoke()

                    end = time.monotonic() + 8
                    while time.monotonic() < end:
                        window.update()
                        if not app.busy and len(actions) >= 1:
                            break
                        time.sleep(0.02)
                    self.assertTrue(actions)
                    self.assertEqual(actions[0][0], "trial")
                    self.assertEqual(actions[0][1][3], trial)
                    self.assertIn("DEĞİŞTİRİLECEK", confirmations[0])
                    self.assertTrue(accepted.is_file())
                    progress = flow.read_progress(home)
                    self.assertIn(key, progress["github_sent"])
                    self.assertEqual(progress["website_confirmed"], [],
                                     "GitHub push is not a WEB deployment")

                    app.clip_tree.selection_set("accepted")
                    app._choose_pc_recording()
                    self.assertIn("kabul edilmiş", app.web_choice_label.get())
                    app.btn_publish_one.invoke()
                    end = time.monotonic() + 8
                    while time.monotonic() < end:
                        window.update()
                        if not app.busy and len(actions) >= 2:
                            break
                        time.sleep(0.02)
                    self.assertEqual([action[0] for action in actions],
                                     ["trial", "accepted"])
                    self.assertEqual(actions[1][1][2], [key])
                    self.assertIn("DEĞİŞTİRİLECEK", confirmations[1])

                    # Choosing WEB explicitly must NOT publish the PC version.
                    app.choice.set("web")
                    app._choice_changed()
                    self.assertEqual(str(app.btn_publish_one["state"]), "disabled")
            finally:
                window.destroy()


if __name__ == "__main__":
    unittest.main()
