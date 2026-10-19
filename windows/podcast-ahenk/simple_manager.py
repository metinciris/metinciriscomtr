#!/usr/bin/env python3
"""Podcast Ahenk v1.3 - a single-screen Windows audio publishing console.

No network or Git call is made in Tk's event loop. File downloads, git sync,
TTS creation, audio playback and GitHub publication all run in workers.
The site and the local archive remain separate until explicit user approval.
"""
import copy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import queue
import shutil
import sys
import tempfile
import threading
import tkinter as tk
from tkinter import messagebox, ttk
import traceback
import webbrowser

ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))
sys.dont_write_bytecode = True

import audio_inventory
import git_sync
import online_audio
from stdio_guard import ensure_stdio
from scripts import render_podcast_audio as engine
from scripts import podcast_audio_pronunciation as pron

HOME = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / "PodcastAhenk"
HOME.mkdir(parents=True, exist_ok=True)
ensure_stdio(HOME)
AUDIO = ROOT / "public" / "podcast-audio"
RULES = AUDIO / "pronunciation.json"
CACHE = HOME / "makale_onbellek.json"
PREVIEWS = HOME / "on_dinleme"
PREVIEWS.mkdir(parents=True, exist_ok=True)
ERROR_LOG = HOME / "ahenk_hata.log"
EVENT_LOG = HOME / "ahenk_islem.log"
BATCH_SIZE = 8
FILTERS = [
    ("Hepsi", "all"),
    ("WEB'de olanlar", "web"),
    ("WEB'de olmayanlar", "web_missing"),
    ("PC'de olanlar", "pc"),
    ("PC'de olmayanlar", "pc_missing"),
    ("Yüklemeye hazır", "publish_ready"),
]


class AhenkManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Podcast Ahenk - Basit Ses Yoneticisi v1.3")
        self.root.geometry("1260x830")
        self.root.minsize(1020, 675)
        self.events = queue.Queue()
        self.busy = False
        self.stopping = threading.Event()
        self.tts = None
        self.current = None
        self.preview = None
        self.drafts = {}
        self.picked = set()
        self.web_confirmed = False
        self.rules = pron.load(RULES)
        self.manifest = engine.load_manifest()
        self.web_manifest = online_audio.load_cached_manifest(HOME)
        self.articles = self._read_cache()
        self.catalog = engine.catalog(self.articles) if self.articles else {}
        self.rows = {}
        self.totals = {}
        self.filter = tk.StringVar(value="all")
        self.journal_filter = tk.StringVar(value="Tüm dergiler")
        self.speed = tk.StringVar(value="1.00")
        self.choice = tk.StringVar(value="")
        self.status = tk.StringVar(value="Ahenk başlatıldı. Sesler hazırlanıyor...")
        self.selected_count = tk.StringVar(value="0 makale seçildi")
        self.web_status = tk.StringVar(value="WEB: kontrol bekleniyor")
        self.pc_status = tk.StringVar(value="PC: kontrol bekleniyor")
        self.choice_label = tk.StringVar(value="Önce WEB veya PC sesini seçin.")
        self._build()
        self._rebuild()
        root.after(100, self._drain)
        root.after(300, self._startup)

    @staticmethod
    def _read_cache():
        try:
            data = json.loads(CACHE.read_text(encoding="utf-8"))
            return data if isinstance(data, list) else []
        except (OSError, ValueError, TypeError):
            return []

    def _build(self):
        style = ttk.Style(self.root)
        if "clam" in style.theme_names():
            style.theme_use("clam")
        style.configure("TButton", font=("Segoe UI", 9), padding=(8, 7))
        style.configure("Go.TButton", font=("Segoe UI Semibold", 10),
                        foreground="white", background="#127d81", padding=(12, 10))
        style.map("Go.TButton", background=[("active", "#0d6165")])
        style.configure("Treeview", rowheight=28, font=("Segoe UI", 9))
        style.configure("Treeview.Heading", font=("Segoe UI Semibold", 9))
        style.configure("TNotebook.Tab", font=("Segoe UI", 9), padding=8)

        header = tk.Frame(self.root, bg="#1b3450", padx=18, pady=11)
        header.pack(fill="x")
        tk.Label(header, bg="#1b3450", fg="#ffffff",
                 text="PODCAST AHENK   |   SES MERKEZİ",
                 font=("Segoe UI Semibold", 17)).pack(anchor="w")
        tk.Label(header, bg="#1b3450", fg="#ccdce9",
                 text="Önce seslerin nerede olduğunu görün. PC'deki sesi dinleyin, düzenleyin ve seçerek WEB'e gönderin.",
                 font=("Segoe UI", 10)).pack(anchor="w", pady=(2, 0))

        summary = ttk.Frame(self.root, padding=(12, 8))
        summary.pack(fill="x")
        self.count_labels = {}
        for key, label in [
            ("all", "Toplam"), ("web", "WEB'de var"),
            ("web_missing", "WEB'de yok"), ("pc", "PC'de var"),
            ("pc_missing", "PC'de yok"), ("publish_ready", "Yüklemeye hazır")
        ]:
            var = tk.StringVar(value=label + ": -")
            self.count_labels[key] = var
            ttk.Label(summary, textvariable=var,
                      font=("Segoe UI Semibold", 9)).pack(side="left", padx=(0, 17))

        toolbar = ttk.Frame(self.root, padding=(12, 3))
        toolbar.pack(fill="x")
        for label, fn in [
            ("↻ WEB durumunu yenile", self.refresh_web),
            ("↓ GitHub seslerini indir / eşitle", self.sync_github),
            ("↻ 120 makaleyi güncelle", self.refresh_articles),
            ("📂 MP3 klasörü", self.open_audio_folder),
            ("📝 Loglar", self.open_log),
            ("🌐 Web sitesi", lambda: webbrowser.open("https://metinciris.com.tr/podcast")),
        ]:
            ttk.Button(toolbar, text=label, command=fn).pack(side="left", padx=(0, 6))

        filter_bar = ttk.Frame(self.root, padding=(12, 7))
        filter_bar.pack(fill="x")
        ttk.Label(filter_bar, text="GÖSTER:", font=("Segoe UI Semibold", 9)).pack(side="left", padx=(0, 10))
        for label, name in FILTERS:
            ttk.Radiobutton(filter_bar, text=label, variable=self.filter,
                            value=name, command=self._render).pack(side="left", padx=(0, 10))
        ttk.Label(filter_bar, text="Dergi").pack(side="left", padx=(12, 5))
        self.journals = ttk.Combobox(filter_bar, width=18, state="readonly",
                                     textvariable=self.journal_filter)
        self.journals.pack(side="left")
        self.journals.bind("<<ComboboxSelected>>", lambda _e: self._render())

        body = ttk.Panedwindow(self.root, orient="horizontal")
        body.pack(fill="both", expand=True, padx=12, pady=(0, 8))
        left = ttk.Frame(body, padding=7)
        right = ttk.Frame(body, padding=9)
        body.add(left, weight=7)
        body.add(right, weight=6)

        controls = ttk.Frame(left)
        controls.pack(fill="x", pady=(0, 8))
        ttk.Label(controls, text="Birden fazla seçim için kutulara tıklayın.").pack(side="left")
        ttk.Button(controls, text="Görünenleri seç", command=self.pick_visible).pack(side="right", padx=(4, 0))
        ttk.Button(controls, text="Seçimi temizle", command=self.clear_picks).pack(side="right")
        ttk.Label(left, textvariable=self.selected_count,
                  font=("Segoe UI Semibold", 9)).pack(anchor="w", pady=(0, 5))

        table_box = ttk.Frame(left)
        table_box.pack(fill="both", expand=True)
        self.table = ttk.Treeview(
            table_box, columns=("check", "web", "pc", "journal", "title"),
            show="headings", selectmode="browse"
        )
        for key, title, width in [
            ("check", "Seç", 48), ("web", "WEB", 85),
            ("pc", "PC", 84), ("journal", "Dergi", 137),
            ("title", "Makale başlığı", 360)
        ]:
            self.table.heading(key, text=title)
            self.table.column(key, width=width, minwidth=width,
                              stretch=(key == "title"))
        self.table.tag_configure("local", foreground="#14734b")
        self.table.tag_configure("only_web", foreground="#446e9d")
        self.table.tag_configure("missing", foreground="#707e8b")
        self.table.pack(side="left", fill="both", expand=True)
        scrollbar = ttk.Scrollbar(table_box, command=self.table.yview)
        scrollbar.pack(side="right", fill="y")
        self.table.configure(yscrollcommand=scrollbar.set)
        self.table.bind("<<TreeviewSelect>>", self._select_article)
        self.table.bind("<Button-1>", self._tree_click, add=True)

        selected_actions = ttk.Frame(left)
        selected_actions.pack(fill="x", pady=(9, 4))
        ttk.Button(
            selected_actions, text="▶ PC'de olmayan sesleri otomatik üret",
            command=self.generate_missing, style="Go.TButton"
        ).pack(fill="x", pady=(0, 6))
        ttk.Button(
            selected_actions, text="↑ İşaretlediğim PC seslerini WEB'e gönder",
            command=self.publish_picked, style="Go.TButton"
        ).pack(fill="x", pady=(0, 6))
        row = ttk.Frame(selected_actions)
        row.pack(fill="x")
        ttk.Button(row, text="İşaretlilerin eksik seslerini üret",
                   command=self.generate_picked).pack(side="left")
        ttk.Button(row, text="İşlemi durdur (parti sonunda)",
                   command=self.stopping.set).pack(side="right")

        ttk.Label(right, text="SEÇİLİ MAKALE",
                  font=("Segoe UI Semibold", 11)).pack(anchor="w")
        self.article_name = tk.StringVar(value="Soldaki makalelerden birini seçin.")
        ttk.Label(right, textvariable=self.article_name,
                  wraplength=480, font=("Segoe UI", 10)).pack(anchor="w", pady=(5, 12))

        cards = ttk.Frame(right)
        cards.pack(fill="x")
        cards.columnconfigure(0, weight=1)
        cards.columnconfigure(1, weight=1)
        web_panel = tk.Frame(cards, bg="#ecf4fa", padx=11, pady=11,
                              highlightbackground="#c5d9ea", highlightthickness=1)
        pc_panel = tk.Frame(cards, bg="#eaf6f0", padx=11, pady=11,
                             highlightbackground="#bfdccd", highlightthickness=1)
        web_panel.grid(row=0, column=0, sticky="nsew", padx=(0, 5))
        pc_panel.grid(row=0, column=1, sticky="nsew", padx=(5, 0))
        self.web_radio = tk.Radiobutton(
            web_panel, text="WEB · Şu an yayında", variable=self.choice,
            value="web", command=self._choice_changed, bg="#ecf4fa",
            activebackground="#ecf4fa", font=("Segoe UI Semibold", 10),
            anchor="w", state="disabled",
        )
        self.web_radio.pack(fill="x")
        tk.Label(web_panel, textvariable=self.web_status,
                 bg="#ecf4fa", wraplength=205, justify="left",
                 fg="#355673", height=3).pack(fill="x", pady=8)
        self.btn_listen_web = ttk.Button(
            web_panel, text="▶ Dinle / indir", command=self.listen_web, state="disabled"
        )
        self.btn_listen_web.pack(fill="x")

        self.pc_radio = tk.Radiobutton(
            pc_panel, text="PC · Sizin sesiniz", variable=self.choice,
            value="pc", command=self._choice_changed, bg="#eaf6f0",
            activebackground="#eaf6f0", font=("Segoe UI Semibold", 10),
            anchor="w", state="disabled",
        )
        self.pc_radio.pack(fill="x")
        tk.Label(pc_panel, textvariable=self.pc_status,
                 bg="#eaf6f0", wraplength=205, justify="left",
                 fg="#315d47", height=3).pack(fill="x", pady=8)
        self.btn_listen_pc = ttk.Button(
            pc_panel, text="▶ Dinle", command=self.listen_pc, state="disabled"
        )
        self.btn_listen_pc.pack(fill="x")

        ttk.Label(right, text="OKUMAYI DÜZENLE",
                  font=("Segoe UI Semibold", 11)).pack(anchor="w", pady=(16, 5))
        self.editor = tk.Text(
            right, wrap="word", height=5, undo=True,
            font=("Segoe UI", 10), background="#fbfcff",
            foreground="#18354c", padx=9, pady=8
        )
        self.editor.pack(fill="both", expand=True)
        settings = ttk.Frame(right)
        settings.pack(fill="x", pady=(8, 5))
        ttk.Label(settings, text="Hız:").pack(side="left")
        ttk.Combobox(
            settings, state="readonly", width=6, textvariable=self.speed,
            values=["0.80", "0.85", "0.90", "0.95", "1.00",
                    "1.05", "1.10", "1.15", "1.20"]
        ).pack(side="left", padx=(5, 12))
        ttk.Button(settings, text="Terim sözlüğü", command=self.open_dictionary).pack(side="left")
        ttk.Button(settings, text="Metni kaydet", command=self.save_text).pack(side="right")
        audition = ttk.Frame(right)
        audition.pack(fill="x", pady=(5, 8))
        ttk.Button(
            audition, text="Yeni sesi üret ve dinle",
            command=self.preview_sound
        ).pack(side="left", fill="x", expand=True, padx=(0, 5))
        self.btn_accept = ttk.Button(
            audition, text="✓ Beğendim, PC sesim olsun",
            command=self.accept_sound, state="disabled"
        )
        self.btn_accept.pack(side="left", fill="x", expand=True, padx=(5, 0))

        ttk.Separator(right, orient="horizontal").pack(fill="x", pady=(5, 10))
        ttk.Label(right, textvariable=self.choice_label,
                  font=("Segoe UI Semibold", 9), wraplength=480).pack(anchor="w")
        self.btn_publish_one = ttk.Button(
            right, text="↑ Seçtiğim PC sesini WEB'e gönder",
            command=self.publish_current, style="Go.TButton", state="disabled"
        )
        self.btn_publish_one.pack(fill="x", pady=(8, 5))
        ttk.Label(right, text="WEB seçiliyse mevcut yayın korunur. PC seçiliyse yalnız bu ses gönderilir.",
                  wraplength=470, foreground="#60778a").pack(anchor="w")

        bottom = ttk.Frame(self.root, padding=(12, 4))
        bottom.pack(fill="x")
        self.progress = ttk.Progressbar(bottom, orient="horizontal",
                                        mode="indeterminate", length=135)
        self.progress.pack(side="left", padx=(0, 12))
        ttk.Label(bottom, textvariable=self.status,
                  font=("Segoe UI", 9)).pack(side="left", fill="x", expand=True)

    def _startup(self):
        if not self.articles:
            self.refresh_articles()
        else:
            self.refresh_web()

    def _rebuild(self):
        self.manifest = engine.load_manifest()
        self.catalog = engine.catalog(self.articles) if self.articles else {}
        self.rows, self.totals = audio_inventory.inventory(
            ROOT, self.catalog, self.manifest, self.web_manifest
        )
        self._render()

    def _render(self):
        # A filter change must never silently discard an unsaved correction.
        self._save_draft()
        old = self.current
        self.table.delete(*self.table.get_children())
        self.picked.intersection_update(self.rows.keys())
        journals = ["Tüm dergiler"] + sorted({
            c["journal"] for c in self.catalog.values()
        })
        self.journals["values"] = journals
        if self.journal_filter.get() not in journals:
            self.journal_filter.set("Tüm dergiler")
        visible = []
        for key, row in self.rows.items():
            if self.filter.get() != "all" and not (
                (self.filter.get() == "web" and row["web"])
                or (self.filter.get() == "web_missing" and not row["web"])
                or (self.filter.get() == "pc" and row["pc"])
                or (self.filter.get() == "pc_pending" and row["pc_pending"])
                or (self.filter.get() == "pc_missing" and not row["pc"])
                or (self.filter.get() == "publish_ready" and row["publish_ready"])
            ):
                continue
            c = row["candidate"]
            if self.journal_filter.get() != "Tüm dergiler" and c["journal"] != self.journal_filter.get():
                continue
            tag = "local" if row["pc"] else ("only_web" if row["web"] else "missing")
            self.table.insert("", "end", iid=key, tags=(tag,),
                              values=("☑" if key in self.picked else "☐",
                                      "✓ Var" if row["web"] else "— Yok",
                                      ("✓ Var" if row["registered"] else "Kayıtsız")
                                      if row["pc"] else "— Yok",
                                      c["journal"], c["title"]))
            visible.append(key)
        for label, key in [
            ("Toplam", "all"), ("WEB'de var", "web"),
            ("WEB'de yok", "web_missing"), ("PC'de var", "pc"),
            ("PC'de yok", "pc_missing"), ("Yüklemeye hazır", "publish_ready")
        ]:
            self.count_labels[key].set(f"{label}: {self.totals.get(key, 0)}")
        self._update_picked_label()
        if old in visible:
            self.table.selection_set(old)
            self.table.focus(old)
        elif visible:
            self.table.selection_set(visible[0])
            self.table.focus(visible[0])
        else:
            self.current = None
            self.article_name.set("Bu bölümde makale yok.")
            self.web_status.set("— Yok")
            self.pc_status.set("— Yok")
            self.choice.set("")
            self.btn_publish_one.configure(state="disabled")
        if self.table.selection():
            self._select_article()

    def _tree_click(self, event):
        if self.table.identify_region(event.x, event.y) != "cell":
            return
        if self.table.identify_column(event.x) != "#1":
            return
        key = self.table.identify_row(event.y)
        if key not in self.rows:
            return "break"
        if key in self.picked:
            self.picked.remove(key)
        else:
            self.picked.add(key)
        self.table.set(key, "check", "☑" if key in self.picked else "☐")
        self.table.selection_set(key)
        self.table.focus(key)
        self._update_picked_label()
        self._select_article()
        return "break"

    def _update_picked_label(self):
        self.selected_count.set(f"{len(self.picked)} makale işaretli")

    def pick_visible(self):
        self.picked.update(self.table.get_children())
        for key in self.table.get_children():
            self.table.set(key, "check", "☑")
        self._update_picked_label()

    def clear_picks(self):
        self.picked.clear()
        for key in self.table.get_children():
            self.table.set(key, "check", "☐")
        self._update_picked_label()

    def _save_draft(self):
        if self.current in self.rows:
            self.drafts[self.current] = (
                self.editor.get("1.0", "end-1c"), self.speed.get()
            )

    def _select_article(self, _event=None):
        chosen = self.table.selection()
        if not chosen:
            return
        key = chosen[0]
        if key not in self.rows:
            return
        if key != self.current:
            self._save_draft()
            self.current = key
            self.preview = None
            self.choice.set("")
            rule = self.rules.get("articles", {}).get(
                pron.identity(self.article_for(key)), {}
            )
            draft = self.drafts.get(key)
            text = draft[0] if draft else rule.get(
                "text", engine.spoken(self.article_for(key)["title"])
            )
            speed = draft[1] if draft else (
                f"{rule.get('speed', self.rules.get('global_speed', 1.0)):.2f}"
            )
            self.editor.delete("1.0", "end")
            self.editor.insert("1.0", text)
            self.speed.set(speed)
        self.article_name.set(
            self.rows[key]["candidate"]["journal"] + "  ·  " +
            self.rows[key]["candidate"]["title"]
        )
        row = self.rows[key]
        web_entry = row["web_entry"]
        pc_entry = row["local_entry"]
        web_stamp = str(web_entry.get("generated_at", ""))[:16].replace("T", " ") if web_entry else "—"
        pc_stamp = str(pc_entry.get("generated_at", ""))[:16].replace("T", " ") if pc_entry else "—"
        self.web_status.set(
            ("✓ Yayında\n" if self.web_confirmed else "≈ Son bilinen kayıt\n") +
            "Tarih: " + web_stamp if row["web"] else "WEB'de ses yok\nPC'den yükleyebilirsiniz"
        )
        self.pc_status.set(
            ("✓ Yerel MP3 mevcut\n" + "Tarih: " + pc_stamp)
            if row["registered"] else
            ("✓ Dosya var · kayıt eksik\nGönderirken yedekli onarılır"
             if row["pc"] else "Bilgisayarda ses yok\nOtomatik oluşturabilirsiniz")
        )
        self.btn_listen_web.configure(state="normal" if row["web"] else "disabled")
        self.btn_listen_pc.configure(state="normal" if row["pc"] else "disabled")
        self.web_radio.configure(state="normal" if row["web"] else "disabled")
        self.pc_radio.configure(state="normal" if row["pc"] else "disabled")
        self.btn_accept.configure(
            state="normal" if self.preview and self.preview["key"] == key else "disabled"
        )
        self._choice_changed()

    def article_for(self, key):
        return {
            "journal": self.catalog[key]["journal"],
            "title": self.catalog[key]["title"],
            "pmid": self.catalog[key]["pmid"],
        }

    def _choice_changed(self):
        key = self.current
        choice = self.choice.get()
        row = self.rows.get(key)
        if choice == "pc" and row and row["pc"]:
            self.choice_label.set("SEÇİM: Bu bilgisayarda üretilmiş ses WEB'e gidecek.")
            self.btn_publish_one.configure(state="normal")
        elif choice == "web" and row and row["web"]:
            self.choice_label.set("SEÇİM: WEB'deki mevcut ses korunacak. Gönderim gerekmez.")
            self.btn_publish_one.configure(state="disabled")
        else:
            self.choice_label.set("Yayına göndermek için PC kutusundaki seçeneği işaretleyin.")
            self.btn_publish_one.configure(state="disabled")

    def _note(self, msg):
        self.status.set(str(msg))
        with EVENT_LOG.open("a", encoding="utf-8") as file:
            file.write(datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "  " +
                       str(msg) + "\n")

    def _task(self, label, work, done=None):
        if self.busy:
            self._note("Başka işlem sürüyor. Makaleleri seçmeye ve filtrelemeye devam edebilirsiniz.")
            return
        self.busy = True
        self.stopping.clear()
        self._note(label)
        self.progress.start(12)

        def runner():
            try:
                result = work()
                self.events.put(("done", result, done))
            except Exception as exc:
                self.events.put(("error", (str(exc), traceback.format_exc()), None))
            finally:
                self.events.put(("idle", None, None))
        threading.Thread(target=runner, daemon=True).start()

    def _drain(self):
        try:
            while True:
                kind, payload, callback = self.events.get_nowait()
                try:
                    if kind == "note":
                        self._note(payload)
                    elif kind == "done":
                        if callback:
                            callback(payload)
                        else:
                            self._note(str(payload))
                    elif kind == "error":
                        text, stack = payload
                        with ERROR_LOG.open("a", encoding="utf-8") as file:
                            file.write("\n" + datetime.now().isoformat() +
                                       "\n" + stack + "\n")
                        self._note("HATA: " + text)
                        messagebox.showerror(
                            "Ahenk işlemi tamamlanamadı",
                            text[:900] + "\n\nAyrıntı: " + str(ERROR_LOG)
                        )
                    elif kind == "idle":
                        self.busy = False
                        self.progress.stop()
                except Exception:
                    with ERROR_LOG.open("a", encoding="utf-8") as file:
                        file.write(traceback.format_exc() + "\n")
        except queue.Empty:
            pass
        self.root.after(100, self._drain)

    def _worker_log(self, msg):
        self.events.put(("note", msg, None))

    def _refresh_local(self):
        self.rules = pron.load(RULES)
        self._rebuild()

    def refresh_articles(self):
        def work():
            articles = engine.load_sheet()
            if len(articles) < engine.MIN_EXPECTED_ARTICLES:
                raise RuntimeError("Google Sheets eksik liste döndürdü. Eski liste korundu.")
            with tempfile.NamedTemporaryFile(
                mode="w", encoding="utf-8", dir=HOME, prefix="ahenk-articles-",
                suffix=".json", delete=False
            ) as f:
                temp = Path(f.name)
                json.dump(articles, f, ensure_ascii=False)
            os.replace(temp, CACHE)
            return articles

        def done(articles):
            self._save_draft()
            self.articles = articles
            self._rebuild()
            self._note(f"{len(articles)} makale listesi yenilendi.")
            self.root.after(180, self.refresh_web)
        self._task("Makale listesi güncelleniyor (arka planda)...", work, done)

    def refresh_web(self):
        def work():
            manifest = online_audio.fetch_manifest()
            online_audio.cache_manifest(HOME, manifest)
            return manifest

        def done(manifest):
            self._save_draft()
            self.web_manifest = manifest
            self.web_confirmed = True
            self._rebuild()
            self._note(f"WEB: {len(manifest['entries'])} yayındaki MP3 kontrol edildi.")
        self._task("Web sitesi MP3 listesi okunuyor...", work, done)

    def sync_github(self):
        if not messagebox.askyesno(
            "GitHub seslerini indir",
            "GitHub'daki hazır sesler alınacak. Yerel MP3'ler ve telaffuz "
            "düzeltmeleri yedeklenerek korunacak. Devam?"
        ):
            return

        def work():
            msg = git_sync.sync(ROOT, HOME)
            return msg

        def done(msg):
            self._save_draft()
            self._refresh_local()
            self._note(msg + " Yeni program kodları varsa uygulamayı yeniden açın.")
        self._task("GitHub ile senkronize ediliyor. Seçimler serbest...", work, done)

    def open_audio_folder(self):
        self._open_folder(AUDIO)

    def _open_folder(self, path):
        try:
            Path(path).mkdir(parents=True, exist_ok=True)
            os.startfile(str(path))
        except (OSError, AttributeError) as exc:
            messagebox.showerror("Klasör açılamadı", str(exc))

    def open_log(self):
        popup = tk.Toplevel(self.root)
        popup.title("Podcast Ahenk - Kolay işlem/hata kayıtları")
        popup.geometry("910x590")
        frame = ttk.Frame(popup, padding=10)
        frame.pack(fill="both", expand=True)
        actions = ttk.Frame(frame)
        actions.pack(fill="x")
        ttk.Button(actions, text="Log klasörünü aç",
                   command=lambda: self._open_folder(HOME)).pack(side="left", padx=(0, 6))
        ttk.Button(actions, text="MP3 klasörünü aç",
                   command=self.open_audio_folder).pack(side="left", padx=(0, 6))
        ttk.Button(actions, text="WEB MP3 klasörünü aç",
                   command=lambda: self._open_folder(HOME / "web_mp3")).pack(side="left")
        box = tk.Text(frame, wrap="word", font=("Consolas", 9))
        box.pack(fill="both", expand=True, pady=9)
        for path in (EVENT_LOG, ERROR_LOG, HOME / "ahenk_motor.log"):
            box.insert("end", "\n" + "=" * 70 + "\n" + path.name + "\n")
            try:
                box.insert("end", path.read_text(encoding="utf-8")[-16000:])
            except OSError:
                box.insert("end", "(henüz kayıt yok)\n")
        box.see("end")
        box.configure(state="disabled")

    def listen_web(self):
        if self.current not in self.rows or not self.rows[self.current]["web"]:
            return
        key = self.current

        def work():
            manifest = online_audio.fetch_manifest()
            if key not in manifest["entries"]:
                raise RuntimeError("Web sitesinde bu MP3 artık yayında değil.")
            path = online_audio.download_clip(HOME, key, manifest)
            # Launch the OS player in the worker; never block Tk selection.
            os.startfile(str(path))
            return manifest

        def done(manifest):
            self.web_manifest = manifest
            self.web_confirmed = True
            self._rebuild()
            self._note("WEB MP3 dinlemek için açıldı. Ses ayrı klasöre indirildi.")
        self._task("WEB'deki MP3 indiriliyor / oynatıcı açılıyor...", work, done)

    def listen_pc(self):
        if self.current not in self.rows or not self.rows[self.current]["pc"]:
            return
        key = self.current

        def work():
            path = AUDIO / (key + ".mp3")
            os.startfile(str(path))
            return "PC MP3 dinlemek için açıldı."
        self._task("Bilgisayar MP3'ü açılıyor...", work)

    def _tts(self):
        if self.tts is None:
            self._worker_log("Ahenk modeli yükleniyor, hazır olana kadar bekleyin...")
            ensure_stdio(HOME)
            self.tts = engine.create_tts()
            self._worker_log("Ahenk modeli hazır.")
        return self.tts

    def _generate(self, keys=None):
        """Produce only files that are physically missing; never overwrite audio."""
        def work():
            articles = engine.load_sheet()
            if len(articles) < engine.MIN_EXPECTED_ARTICLES:
                raise RuntimeError("Kaynak makale listesi eksik. Sesler değiştirilmedi.")
            catalog = engine.catalog(articles)
            # First rescue existing MP3s whose manifest was lost; this repair
            # does not approve a changed pronunciation fingerprint.
            physical = [key for key in catalog if audio_inventory.present(ROOT, key)]
            repaired = audio_inventory.restore_missing_entries(
                ROOT, catalog, physical, HOME
            )
            if repaired:
                self._worker_log(f"{repaired} mevcut MP3'ün eksik manifest kaydı yedekli onarıldı.")
            targets = (
                [key for key in catalog if not audio_inventory.present(ROOT, key)]
                if keys is None else
                [key for key in keys
                 if key in catalog and not audio_inventory.present(ROOT, key)]
            )
            total = len(targets)
            done_count = 0
            model = None
            while targets and not self.stopping.is_set():
                chosen = targets[:BATCH_SIZE]
                targets = targets[BATCH_SIZE:]
                model = model or self._tts()
                plan = {"version": 1, "candidates": catalog, "selected": chosen}
                engine.execute_plan(plan, tts=model, preserve_local=True)
                done_count += len(chosen)
                self._worker_log(f"{done_count}/{total} yeni ses hazırlandı; 8'li güvenli kayıt yapıldı.")
            return articles, repaired, done_count, total

        def done(result):
            articles, repaired, done_count, total = result
            self._save_draft()
            self.articles = articles
            CACHE.write_text(json.dumps(articles, ensure_ascii=False), encoding="utf-8")
            self._refresh_local()
            self._note(
                f"{done_count}/{total} eksik MP3 üretildi. "
                f"{repaired} kayıp manifest kaydı onarıldı. "
                "WEB'e kendiliğinden yüklenmedi."
            )

        self._task("Eksik sesler 8'li partilerle üretiliyor...", work, done)

    def generate_missing(self):
        count = sum(not row["pc"] for row in self.rows.values())
        if not count:
            messagebox.showinfo("Eksik ses yok", "Tüm makalelerin PC MP3'ü var.")
            return
        if messagebox.askyesno(
            "Eksik MP3'leri otomatik tamamla",
            f"PC'de bulunmayan {count} başlık için Ahenk sesi üretilecek.\n"
            "Var olan MP3'ler değiştirilmeyecek ve GitHub'a gönderilmeyecek.\nDevam?"
        ):
            self._generate()

    def generate_picked(self):
        if not self.picked:
            messagebox.showinfo("Makale seçin", "Soldaki Seç kutularını işaretleyin.")
            return
        keys = tuple(key for key in self.picked if key in self.rows and
                     not self.rows[key]["pc"])
        if not keys:
            messagebox.showinfo("Eksik ses yok", "İşaretlediğiniz makalelerin MP3'leri zaten var.")
            return
        if messagebox.askyesno(
            "Seçili makalelerin eksik seslerini üret",
            f"{len(keys)} seçili eksik MP3 oluşturulacak; mevcut sesler korunacak. Devam?"
        ):
            self._generate(keys)

    def _publish(self, keys):
        keys = tuple(dict.fromkeys(keys))
        if not keys:
            messagebox.showinfo("Ses seçin", "Önce WEB'e gidecek PC seslerini seçin.")
            return
        missing = [key for key in keys if not self.rows.get(key, {}).get("pc")]
        if missing:
            messagebox.showwarning(
                "Yerel MP3 eksik",
                f"{len(missing)} seçili makalenin bilgisayarda MP3'ü yok. "
                "Önce otomatik üretin."
            )
            return
        names = [self.catalog[k]["title"][:65] for k in keys[:4]]
        preview = "\n".join("- " + name for name in names)
        if len(keys) > 4:
            preview += f"\n...ve {len(keys) - 4} başlık daha"
        if not messagebox.askyesno(
            "WEB'e gönderilecek sesleri ONAYLA",
            f"PC'deki {len(keys)} MP3'ü GitHub'a göndereceksiniz.\n"
            "Var olan web sesleri bu seslerle değişebilir.\n"
            "Seçilmeyen PC kayıtları korunacak.\n\n" + preview +
            "\n\nBu sesleri WEB'de yayımlamak istiyor musunuz?"
        ):
            return

        def work():
            repaired = audio_inventory.restore_missing_entries(
                ROOT, self.catalog, keys, HOME
            )
            self._worker_log(
                f"{len(keys)} seçili ses: {repaired} manifest kaydı kurtarıldı."
            )
            finished = 0
            for start in range(0, len(keys), BATCH_SIZE):
                if self.stopping.is_set():
                    break
                chunk = keys[start:start + BATCH_SIZE]
                message = git_sync.publish_selected_local_voices(ROOT, HOME, chunk)
                finished += len(chunk)
                self._worker_log(f"{finished}/{len(keys)} seçili MP3 GitHub'a işlendi: {message}")
            return finished, len(keys)

        def done(result):
            uploaded, requested = result
            self._save_draft()
            self._refresh_local()
            self._note(
                f"{uploaded}/{requested} ses GitHub'a gönderildi. "
                "WEB listesini yenileyin; site yayını birkaç dakika gecikebilir."
            )
        self._task("Seçili MP3'ler GitHub'a gönderiliyor...", work, done)

    def publish_picked(self):
        self._publish([k for k in self.catalog if k in self.picked])

    def publish_current(self):
        if self.current in self.rows and self.choice.get() == "pc":
            self._publish([self.current])
        else:
            messagebox.showinfo("WEB korunuyor", "PC sesini seçmeden yeni yayın yapılmaz.")

    def _profile(self):
        if self.current not in self.rows:
            raise RuntimeError("Önce bir makale seçin.")
        text = self.editor.get("1.0", "end-1c").strip()
        if not 1 <= len(text) <= 3000:
            raise RuntimeError("Okuma metni 1 ile 3000 karakter arasında olmalıdır.")
        return {"text": text, "speed": float(self.speed.get())}

    def _write_profile(self, key, profile):
        rules = pron.load(RULES)
        new = copy.deepcopy(rules)
        new.setdefault("articles", {})[pron.identity(self.article_for(key))] = profile
        pron.save(RULES, new)
        return new

    def save_text(self):
        try:
            profile = self._profile()
            key = self.current
            git_sync.backup_files(ROOT, HOME, [git_sync.RULES])
            self.rules = self._write_profile(key, profile)
            self.drafts.pop(key, None)
            self.preview = None
            self.btn_accept.configure(state="disabled")
            self._rebuild()
            self._note("Okuma metni kaydedildi. MP3'ü değiştirmek için yeni deneme üretin.")
        except (OSError, ValueError, RuntimeError) as exc:
            messagebox.showerror("Metin kaydedilemedi", str(exc))

    def preview_sound(self):
        try:
            profile = self._profile()
            key = self.current
            article = self.article_for(key)
            rules = copy.deepcopy(self.rules)
            rules.setdefault("articles", {})[pron.identity(article)] = profile
            text, speed = pron.speech(article, rules, engine.spoken(article["title"]))
            signature = pron.signature(text, speed)
        except (ValueError, RuntimeError) as exc:
            messagebox.showwarning("Okuma metni", str(exc))
            return

        def work():
            if not shutil.which("ffmpeg"):
                raise RuntimeError("FFmpeg yok. PowerShell: winget install -e --id Gyan.FFmpeg")
            path = PREVIEWS / (key + "_deneme.mp3")
            engine.render_clip(self._tts(), text, path, speed=speed)
            os.startfile(str(path))
            return {"key": key, "path": path,
                    "profile": profile, "signature": signature}

        def done(preview):
            self.preview = preview
            self.btn_accept.configure(
                state="normal" if self.current == preview["key"] else "disabled"
            )
            self._note("Deneme sesi hazır. Beğenirseniz PC sesiniz olarak kabul edin.")
        self._task("Ahenk deneme MP3'ü hazırlanıyor...", work, done)

    def accept_sound(self):
        try:
            profile = self._profile()
            key = self.current
            article = self.article_for(key)
            rules = copy.deepcopy(self.rules)
            rules.setdefault("articles", {})[pron.identity(article)] = profile
            text, speed = pron.speech(article, rules, engine.spoken(article["title"]))
            match = (
                self.preview and self.preview["key"] == key and
                self.preview["profile"] == profile and
                self.preview["signature"] == pron.signature(text, speed) and
                Path(self.preview["path"]).is_file()
            )
            if not match:
                raise RuntimeError("Bu metni önce deneme olarak üretip dinleyin.")
            if not messagebox.askyesno(
                "Dinlediğiniz MP3'ü kabul edin",
                "Eski yerel MP3 yedeklenecek ve yerine yeni ses konacak. "
                "WEB'deki ses değişmeyecek. Devam?"
            ):
                return
            audio_file = Path(self.preview["path"])
        except (RuntimeError, ValueError) as exc:
            messagebox.showwarning("Ön dinleme gerekli", str(exc))
            return

        def work():
            git_sync.backup_files(
                ROOT, HOME, [git_sync.MANIFEST, git_sync.RULES,
                              git_sync.AUDIO_PREFIX + key + ".mp3"]
            )
            new_rules = self._write_profile(key, profile)
            candidate = engine.catalog([article])[key]
            AUDIO.mkdir(parents=True, exist_ok=True)
            target = AUDIO / candidate["file"]
            with tempfile.NamedTemporaryFile(
                dir=AUDIO, prefix=".ahenk-accept-", suffix=".mp3", delete=False
            ) as file:
                temp = Path(file.name)
            try:
                shutil.copy2(audio_file, temp)
                os.replace(temp, target)
            finally:
                temp.unlink(missing_ok=True)
            manifest = engine.load_manifest()
            manifest["entries"][key] = {
                **candidate, "generated_at": datetime.now(timezone.utc).isoformat()
            }
            manifest["generated_at"] = datetime.now(timezone.utc).isoformat()
            git_sync.save_json(AUDIO / "manifest.json", manifest)
            return new_rules

        def done(rules):
            self.rules = rules
            self.drafts.pop(key, None)
            self.preview = None
            self.choice.set("pc")
            self._rebuild()
            self._note("Beğenilen MP3 PC'de kaydedildi. İsterseniz WEB'e gönderin.")
        self._task("Beğendiğiniz ses güvenli biçimde PC'ye kaydediliyor...", work, done)

    def open_dictionary(self):
        window = tk.Toplevel(self.root)
        window.title("Podcast Ahenk - Genel terim sözlüğü")
        window.geometry("600x440")
        frame = ttk.Frame(window, padding=12)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="Tüm makalelerin seslendirmesine uygulanacak terimler",
                  font=("Segoe UI Semibold", 10)).pack(anchor="w", pady=(0, 8))
        items = tk.Listbox(frame, font=("Segoe UI", 10))
        items.pack(fill="both", expand=True)
        entries = ttk.Frame(frame)
        entries.pack(fill="x", pady=8)
        ttk.Label(entries, text="Terim").grid(row=0, column=0, sticky="w")
        ttk.Label(entries, text="Okunuşu").grid(row=0, column=1, sticky="w")
        find = ttk.Entry(entries, width=28)
        say = ttk.Entry(entries, width=32)
        find.grid(row=1, column=0, padx=(0, 12))
        say.grid(row=1, column=1)
        buttons = ttk.Frame(frame)
        buttons.pack(fill="x")
        def redraw():
            items.delete(0, "end")
            for rule in self.rules.get("global", []):
                items.insert("end", rule["find"] + "   →   " + rule["say"])
        def save_rule():
            name, reading = find.get().strip(), say.get().strip()
            if not name or not reading or name.casefold() == reading.casefold():
                messagebox.showwarning("Kural", "Terim ve farklı bir okunuş girin.", parent=window)
                return
            rules = copy.deepcopy(self.rules)
            rules.setdefault("global", []).append({
                "find": name, "say": reading, "whole_word": True
            })
            try:
                git_sync.backup_files(ROOT, HOME, [git_sync.RULES])
                pron.save(RULES, rules)
                self.rules = rules
                self._rebuild()
                redraw()
                self._note("Genel telaffuz kuralı kaydedildi.")
            except (OSError, ValueError) as exc:
                messagebox.showerror("Kural kaydedilemedi", str(exc), parent=window)
        def delete_rule():
            sel = items.curselection()
            if not sel:
                return
            rules = copy.deepcopy(self.rules)
            rules["global"].pop(sel[0])
            git_sync.backup_files(ROOT, HOME, [git_sync.RULES])
            pron.save(RULES, rules)
            self.rules = rules
            self._rebuild()
            redraw()
        ttk.Button(buttons, text="Kural ekle", command=save_rule).pack(side="left")
        ttk.Button(buttons, text="Seçili kuralı sil", command=delete_rule).pack(side="left", padx=7)
        redraw()


def main():
    root = tk.Tk()
    try:
        AhenkManager(root)
    except Exception as exc:
        with ERROR_LOG.open("a", encoding="utf-8") as file:
            file.write("\n" + datetime.now().isoformat() + "\n" +
                       traceback.format_exc() + "\n")
        messagebox.showerror(
            "Podcast Ahenk başlatılamadı", str(exc) + "\n\n" + str(ERROR_LOG)
        )
        root.destroy()
        return
    root.mainloop()


if __name__ == "__main__":
    main()
