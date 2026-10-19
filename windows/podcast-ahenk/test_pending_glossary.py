"""Windows Tk test: always-visible pronunciation terms and not-on-WEB MP3s.

All files live in a disposable folder. GitHub and the public site are not used.
"""
import json
from pathlib import Path
import sys
import tempfile
import tkinter as tk
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import simple_manager as base
import two_step_manager as ui
import two_step_audio as progress_tools
from scripts import render_podcast_audio as engine


class DictionaryAndPendingTests(unittest.TestCase):
    def test_visible_dictionary_and_pc_sounds_not_on_web(self):
        with tempfile.TemporaryDirectory() as td:
            home = Path(td) / "home"
            repo = Path(td) / "repo"
            home.mkdir()
            audio = repo / "public" / "podcast-audio"
            audio.mkdir(parents=True)

            articles = [
                {"journal": "Diagnostic Pathology", "title": "SMARCA4 in pathology", "pmid": "991001"},
                {"journal": "Diagnostic Pathology", "title": "Local recording waiting to upload", "pmid": "991002"},
                {"journal": "Diagnostic Pathology", "title": "Already sent to GitHub, WEB pending", "pmid": "991003"},
                {"journal": "Diagnostic Pathology", "title": "Not yet generated on the PC", "pmid": "991004"},
            ]
            catalog = engine.catalog(articles)
            keys = list(catalog)
            entries = {
                key: {**catalog[key], "generated_at": "2026-10-19T10:30:00+00:00"}
                for key in keys[:3]
            }
            site = {"version": 1, "entries": {keys[0]: entries[keys[0]]}}
            (audio / "manifest.json").write_text(
                json.dumps({"version": 1, "entries": entries}, ensure_ascii=False),
                encoding="utf-8"
            )
            dictionary = {
                "version": 1, "global": [
                    {"find": "SMARCA4", "say": "smark-a4", "whole_word": True},
                    {"find": "NUTM1", "say": "nat-em-bir", "whole_word": True},
                ], "articles": {}, "global_speed": 1.0,
            }
            (audio / "pronunciation.json").write_text(
                json.dumps(dictionary, ensure_ascii=False), encoding="utf-8"
            )
            for key in keys[:3]:
                (audio / (key + ".mp3")).write_bytes(b"ID3" + b"x" * 2048)

            sent = progress_tools.new_progress([keys[2]])
            sent["github_sent"] = [keys[2]]
            sent["expected"] = {keys[2]: entries[keys[2]]}
            sent["phase"] = "site_yayini_bekleniyor"
            progress_tools.save_progress(home, sent)

            window = tk.Tk()
            window.withdraw()
            try:
                with patch.object(ui, "ROOT", repo), \
                     patch.object(base, "ROOT", repo), \
                     patch.object(ui, "HOME", home), \
                     patch.object(base, "HOME", home), \
                     patch.object(ui, "CACHE", home / "cache.json"), \
                     patch.object(base, "CACHE", home / "cache.json"), \
                     patch.object(ui, "ERROR_LOG", home / "error.log"), \
                     patch.object(base, "RULES", audio / "pronunciation.json"), \
                     patch.object(base, "AUDIO", audio), \
                     patch.object(base, "PREVIEWS", home / "on_dinleme"), \
                     patch.object(engine, "AUDIO_DIR", audio), \
                     patch.object(engine, "MANIFEST_PATH", audio / "manifest.json"), \
                     patch.object(ui.TwoStepManager, "_startup", lambda _self: None), \
                     patch.object(ui.TwoStepManager, "_resume_watch", lambda _self: None):
                    app = ui.TwoStepManager(window)
                    app.articles = articles
                    app.web_manifest = site
                    app.web_confirmed = True
                    app._rebuild()

                    self.assertEqual(app.totals["pc_pending"], 2)
                    self.assertIn("PC hazır / WEB'de yok: 2",
                                  app.count_labels["pc_pending"].get())
                    self.assertIn("Gönderim kaydı bulunmayan: 1",
                                  app.pending_notice.get())
                    self.assertIn("GitHub'a gönderildi, WEB bekleniyor: 1",
                                  app.pending_notice.get())
                    self.assertIn("SMARCA4 → smark-a4",
                                  app.dictionary_summary.get())

                    # List only the two PC MP3s not yet seen at the website.
                    app.btn_pending.invoke()
                    visible = set(app.table.get_children())
                    self.assertEqual(visible, {keys[1], keys[2]})
                    self.assertEqual(app.table.set(keys[1], "pc"), "PC ✓")
                    self.assertEqual(app.table.set(keys[2], "pc"), "GitHub ✓")

                    # The actual glossary editor opens in one click, with
                    # the previously saved general pronunciation entries.
                    app.btn_dictionary.invoke()
                    popup = [
                        child for child in window.winfo_children()
                        if isinstance(child, tk.Toplevel)
                    ]
                    self.assertEqual(len(popup), 1)
                    popup[0].destroy()
            finally:
                window.destroy()


if __name__ == "__main__":
    unittest.main()
