"""Tkinter regression: selecting/filtering 120 articles must never wait on Git.

Requires Windows graphical Tk. No network or GitHub credentials are used.
"""
import sys
from pathlib import Path
from unittest.mock import patch
import tkinter as tk

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import simple_manager as app_module


def main():
    root = tk.Tk()
    root.withdraw()
    try:
        app = app_module.AhenkManager(root)
        app.articles = [
            {
                "journal": "Diagnostic Pathology",
                "title": f"Makale {i}: Windows Ahenk filtre ve dinleme kontrolü",
                "pmid": str(124000 + i),
            }
            for i in range(120)
        ]
        # All of these fake titles have no MP3. There is no network or
        # remote Git call needed to populate all 120 entries.
        with patch.object(app_module.git_sync, "git_result",
                          side_effect=AssertionError("Git called from Tk")), \
             patch.object(app_module.online_audio, "_read_https",
                          side_effect=AssertionError("Network called from Tk")):
            app._rebuild()
            assert len(app.catalog) == 120
            app.filter.set("pc_missing")
            app._render()
            assert len(app.table.get_children()) >= 110
            key = app.table.get_children()[0]
            app.table.selection_set(key)
            app._select_article()
            app.editor.delete("1.0", "end")
            app.editor.insert("1.0", "Sesli okunacak özel metin")
            app.filter.set("web_missing")
            app._render()
            app.filter.set("all")
            app._render()
            assert app.drafts.get(key, (None,))[0] == "Sesli okunacak özel metin"
            assert app.count_labels["all"].get().endswith("120")
        print("Simple Ahenk GUI: 120 articles filtered without blocking Git or HTTP")
    finally:
        root.destroy()


if __name__ == "__main__":
    main()
