"""Windows regression for stage 2: 8+4 approved uploads and truthful WEB status.

No real GitHub remote or website is accessed. Actual Git commit/push and
preservation are tested separately by test_git_sync.py in the same workflow.
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
import two_step_audio as flow
from scripts import render_podcast_audio as engine


def make_clip(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"ID3" + b"x" * 1900)


class TwoStepPublishTest(unittest.TestCase):
    def test_upload_only_12_web_missing_out_of_24_and_verify_later(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo, home = Path(tmp) / "repo", Path(tmp) / "home"
            home.mkdir()
            audio = repo / "public" / "podcast-audio"
            audio.mkdir(parents=True)
            articles = [{
                "journal": "Diagnostic Pathology",
                "title": f"Makale {i:02d} ileri tanisal patoloji yontemleri",
                "pmid": str(100000 + i),
            } for i in range(24)]
            catalog = engine.catalog(articles)
            keys = list(catalog)
            first_half, second_half = keys[:12], keys[12:]
            entries = {
                key: {**catalog[key], "generated_at": "2026-10-19T12:00:00+00:00"}
                for key in keys
            }
            web = {"version": 1, "entries": {key: entries[key] for key in first_half}}
            remote = {"version": 1, "entries": {key: entries[key] for key in first_half}}
            local = {"version": 1, "entries": entries}
            for key in second_half:
                make_clip(audio / (key + ".mp3"))
            (audio / "manifest.json").write_text(
                json.dumps(local, ensure_ascii=False), encoding="utf-8"
            )
            batches = []

            def fake_upload(_root, _home, selected):
                batches.append(list(selected))
                for key in selected:
                    remote["entries"][key] = entries[key]
                return "Seçili MP3'ler GitHub'a gönderildi."

            window = tk.Tk()
            window.withdraw()
            try:
                with patch.object(ui, "ROOT", repo), \
                     patch.object(ui.base, "ROOT", repo), \
                     patch.object(ui, "HOME", home), \
                     patch.object(ui.base, "HOME", home), \
                     patch.object(ui, "CACHE", home / "makaleler.json"), \
                     patch.object(ui, "ERROR_LOG", home / "hata.log"), \
                     patch.object(engine, "AUDIO_DIR", audio), \
                     patch.object(engine, "MANIFEST_PATH", audio / "manifest.json"), \
                     patch.object(engine, "load_sheet", return_value=articles), \
                     patch.object(ui.online_audio, "fetch_manifest", return_value=web), \
                     patch.object(ui.TwoStepManager, "_startup", lambda _self: None), \
                     patch.object(ui.TwoStepManager, "_resume_watch", lambda _self: None), \
                     patch.object(ui.TwoStepManager, "_start_watch", lambda _self: None), \
                     patch.object(ui.messagebox, "askyesno", return_value=True), \
                     patch.object(ui.git_sync, "publish_selected_local_voices",
                                  side_effect=fake_upload), \
                     patch.object(ui.git_sync, "remote_manifest", side_effect=lambda _root: remote):
                    app = ui.TwoStepManager(window)
                    app.articles = articles
                    app._rebuild()
                    app.upload_web_missing()
                    end = time.monotonic() + 10
                    complete = False
                    while time.monotonic() < end:
                        window.update()
                        progress = flow.read_progress(home)
                        if progress and len(progress["github_sent"]) == 12 and not app.busy:
                            complete = True
                            break
                        time.sleep(0.02)
                    self.assertTrue(complete, "Stage 2 did not complete")
                    self.assertEqual(list(map(len, batches)), [8, 4])
                    self.assertEqual([k for group in batches for k in group], second_half)
                    progress = flow.read_progress(home)
                    self.assertEqual(progress["website_confirmed"], [])
                    self.assertEqual(progress["phase"], "site_yayini_bekleniyor")
                    self.assertIn("GitHub: 12/12", app.stage_counters.get())
                    self.assertIn("WEB'de yayına girdi: 0/12", app.stage_counters.get())
                    self.assertEqual(float(app.stage_bar["value"]), 100.0)
                    self.assertEqual(float(app.web_progress_bar["value"]), 0.0)
                    # GitHub push alone is NOT yet a live website release.
                    published = {"version": 1, "entries": dict(remote["entries"])}
                    app._watch_result((published, ""))
                    published_state = flow.read_progress(home)
                    self.assertEqual(len(published_state["website_confirmed"]), 12)
                    self.assertEqual(published_state["phase"], "tamamlandi")
                    self.assertIn("WEB'de yayına girdi: 12/12", app.stage_counters.get())
                    self.assertEqual(float(app.web_progress_bar["value"]), 100.0)
            finally:
                window.destroy()


if __name__ == "__main__":
    unittest.main()
