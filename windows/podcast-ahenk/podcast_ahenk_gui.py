#!/usr/bin/env python3
"""Podcast Ahenk Ses Yoneticisi (Windows 10/11, Python 3.11+).

Small Tkinter front-end for the existing website Ahenk renderer. All GitHub
writes require a click and confirmation. No credentials are stored by the app.
"""
from datetime import datetime, timezone
from pathlib import Path
from tkinter import messagebox, scrolledtext, ttk
import copy
import json
import os
import queue
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import tkinter as tk
import traceback
import webbrowser

import git_sync
import online_audio

ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))
sys.dont_write_bytecode = True  # no Python cache files inside the Git working tree
from scripts import render_podcast_audio as engine
from scripts import podcast_audio_pronunciation as pron

APP_HOME = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / "PodcastAhenk"
APP_HOME.mkdir(parents=True, exist_ok=True)
from stdio_guard import ensure_stdio
ENGINE_LOG = ensure_stdio(APP_HOME)
PREVIEWS = APP_HOME / "on_dinleme"
PREVIEWS.mkdir(parents=True, exist_ok=True)
CACHE = APP_HOME / "makale_onbellek.json"
AUDIO = ROOT / "public" / "podcast-audio"
RULES = AUDIO / "pronunciation.json"
TRUSTED_REPO = "https://github.com/metinciris/metinciriscomtr.git"
MAX_BATCH = 8


def run(cmd, timeout=180):
    try:
        p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=timeout,
                           creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    except FileNotFoundError as error:
        raise RuntimeError("Eksik program: " + cmd[0]) from error
    if p.returncode:
        raise RuntimeError("Islem basarisiz: " + " ".join(cmd[:3]) + "\n" +
                           (p.stderr or p.stdout)[-1400:])
    return p.stdout.strip()


def write_manifest(data):
    AUDIO.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=AUDIO,
                                     prefix=".manifest-", suffix=".json", delete=False) as f:
        tmp = Path(f.name)
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, AUDIO / "manifest.json")


class App:
    def __init__(self, root):
        self.root = root
        root.title("Podcast Ahenk Ses Yoneticisi · 1.0")
        root.geometry("1100x780")
        root.minsize(900, 650)
        self.events = queue.Queue()
        self.running = False
        self.stop_event = threading.Event()
        self.articles = []
        self.by_key = {}
        self.current = None
        self.editor_key = None
        self.editor_drafts = {}
        self.preview = None
        self.tts = None
        self.rules = pron.load(RULES)
        self.manifest = engine.load_manifest()
        self.web_manifest = online_audio.load_cached_manifest(APP_HOME)
        self.web_checked = "Önbellek" if self.web_manifest.get("entries") else "Henüz denetlenmedi"
        self.github_manifest = git_sync.ref_json(
            ROOT, "HEAD", git_sync.MANIFEST, {"version": 1, "entries": {}}
        )
        self.filter = tk.StringVar()
        self.state_filter = tk.StringVar(value="Tümü")
        self.journal = tk.StringVar(value="Tum dergiler")
        self.batch = tk.StringVar(value="8")
        self.speed = tk.StringVar(value="1.00")
        self.global_speed = tk.StringVar(value=f"{self.rules.get('global_speed', 1.0):.2f}")
        self.whole_word = tk.BooleanVar(value=True)
        self.status = tk.StringVar(value="Makaleleri Guncelle: en guncel basliklari getirir.")
        self.make_ui()
        self.load_cache()
        self.draw()
        root.after(100, self.process_events)
        root.after(350, self.refresh_web)

    def make_ui(self):
        """Compact two-pane workflow: select title -> improve -> listen -> accept."""
        self.root.configure(bg="#f3f6fa")
        self.root.title("Podcast Ahenk | Web ve Yerel Ses Yöneticisi 1.2")
        self.root.geometry("1220x800")
        self.root.minsize(980, 650)

        style = ttk.Style(self.root)
        if "clam" in style.theme_names():
            style.theme_use("clam")
        style.configure("Root.TFrame", background="#f3f6fa")
        style.configure("Panel.TFrame", background="#ffffff")
        style.configure("Panel.TLabel", background="#ffffff", foreground="#18324d")
        style.configure("Muted.TLabel", background="#ffffff", foreground="#617285")
        style.configure("Root.TLabel", background="#f3f6fa", foreground="#314c64")
        style.configure("TButton", font=("Segoe UI", 9), padding=(10, 7))
        style.configure("Accent.TButton", foreground="#ffffff", background="#137c82",
                        font=("Segoe UI Semibold", 9), padding=(12, 9))
        style.map("Accent.TButton", background=[("active", "#0f666b")])
        style.configure("TNotebook", background="#ffffff", borderwidth=0)
        style.configure("TNotebook.Tab", font=("Segoe UI", 9), padding=(12, 8))
        style.configure("Treeview", rowheight=30, font=("Segoe UI", 9),
                        borderwidth=0, background="#ffffff", fieldbackground="#ffffff",
                        foreground="#18324d")
        style.configure("Treeview.Heading", font=("Segoe UI Semibold", 9),
                        padding=(5, 9), background="#e9eff5", foreground="#18324d")

        outer = ttk.Frame(self.root, padding=12, style="Root.TFrame")
        outer.pack(fill="both", expand=True)
        header = tk.Frame(outer, bg="#18324d", padx=18, pady=12)
        header.pack(fill="x")
        tk.Label(header, text="PODCAST   /   AHENK SES YÖNETİCİSİ",
                 bg="#18324d", fg="#ffffff", font=("Segoe UI Semibold", 17)).pack(anchor="w")
        tk.Label(header, text="Web'deki sesi gör  →  istersen yenisini üret  →  karşılaştır  →  istediğin sesi yayınla",
                 bg="#18324d", fg="#cbd9e4", font=("Segoe UI", 10)).pack(anchor="w", pady=(3, 0))

        top_actions = ttk.Frame(outer, style="Root.TFrame")
        top_actions.pack(fill="x", pady=(10, 6))
        for title, command in [
            ("↻ Web seslerini yenile", self.refresh_web),
            ("↓ GitHub seslerini indir", self.pull),
            ("Makaleleri yenile", self.scan),
            ("Test sesi", self.test_sound),
            ("Log ve klasörler", self.open_logs),
            ("Web sitesi", self.open_site),
        ]:
            ttk.Button(top_actions, text=title, command=command).pack(side="left", padx=(0, 6))

        summary_frame = ttk.Frame(outer, style="Panel.TFrame", padding=(12, 8))
        summary_frame.pack(fill="x", pady=(0, 9))
        self.summary = tk.StringVar(value="Makale listesi yükleniyor…")
        self.model_status = tk.StringVar(value="Ahenk modeli: Henüz yüklenmedi")
        ttk.Label(summary_frame, textvariable=self.summary, style="Panel.TLabel",
                  font=("Segoe UI Semibold", 10)).pack(side="left")
        self.web_summary = tk.StringVar(value="Web: kontrol ediliyor…")
        ttk.Label(summary_frame, textvariable=self.web_summary,
                  style="Panel.TLabel").pack(side="left", padx=(22, 0))
        ttk.Label(summary_frame, textvariable=self.model_status,
                  style="Muted.TLabel").pack(side="right")

        body = ttk.Panedwindow(outer, orient="horizontal")
        body.pack(fill="both", expand=True)
        left = ttk.Frame(body, style="Panel.TFrame", padding=10)
        right = ttk.Frame(body, style="Panel.TFrame", padding=10)
        body.add(left, weight=5)
        body.add(right, weight=6)

        ttk.Label(left, text="MAKALELER", style="Panel.TLabel",
                  font=("Segoe UI Semibold", 11)).pack(anchor="w")
        ttk.Label(left, text="Web (yayındaki) ve yerel MP3'leri aynı listede karşılaştırın.",
                  style="Muted.TLabel", wraplength=470).pack(anchor="w", pady=(0, 10))
        filters = ttk.Frame(left, style="Panel.TFrame")
        filters.pack(fill="x", pady=(0, 7))
        self.journal_list = ttk.Combobox(filters, state="readonly", width=17, textvariable=self.journal)
        self.journal_list.pack(side="left", padx=(0, 5))
        self.journal_list.bind("<<ComboboxSelected>>", lambda _e: self.draw())
        self.state_list = ttk.Combobox(
            filters, state="readonly", width=15, textvariable=self.state_filter,
            values=["Tümü", "Web'de var", "Web'de yok", "Yerel yeni", "Yerel hazır",
                    "Yerel eksik", "Yenilenecek"]
        )
        self.state_list.pack(side="left", padx=(0, 5))
        self.state_list.bind("<<ComboboxSelected>>", lambda _e: self.draw())
        search = ttk.Entry(filters, textvariable=self.filter, width=10)
        search.pack(side="left", fill="x", expand=True)
        self.filter.trace_add("write", lambda *_: self.draw())
        ttk.Label(left, text="Web = şu anda sitede oynayan MP3 · Yerel yeni = henüz yayınlanmayan ses",
                  style="Muted.TLabel", wraplength=460).pack(anchor="w", pady=(0, 8))

        table_frame = ttk.Frame(left, style="Panel.TFrame")
        table_frame.pack(fill="both", expand=True)
        self.table = ttk.Treeview(table_frame,
                                  columns=("web", "local", "journal", "title", "pmid"),
                                  show="headings", selectmode="browse")
        for name, label, size, stretch in [
            ("web", "Web", 70, False),
            ("local", "Yerel", 105, False),
            ("journal", "Dergi", 112, False),
            ("title", "Makale başlığı", 295, True),
            ("pmid", "PMID", 0, False)
        ]:
            self.table.heading(name, text=label)
            self.table.column(name, width=size, minwidth=size, stretch=stretch)
        self.table["displaycolumns"] = ("web", "local", "journal", "title")
        self.table.tag_configure("ready", foreground="#117854")
        self.table.tag_configure("new", foreground="#1a6596")
        self.table.tag_configure("stale", foreground="#a66313")
        self.table.tag_configure("missing", foreground="#56677b")
        scrollbar = ttk.Scrollbar(table_frame, command=self.table.yview, orient="vertical")
        self.table.configure(yscrollcommand=scrollbar.set)
        self.table.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        self.table.bind("<<TreeviewSelect>>", self.choose_article)

        notebook = ttk.Notebook(right)
        notebook.pack(fill="both", expand=True)
        article_tab = ttk.Frame(notebook, style="Panel.TFrame", padding=(10, 13))
        global_tab = ttk.Frame(notebook, style="Panel.TFrame", padding=(10, 13))
        batch_tab = ttk.Frame(notebook, style="Panel.TFrame", padding=(10, 13))
        log_tab = ttk.Frame(notebook, style="Panel.TFrame", padding=(10, 13))
        notebook.add(article_tab, text="Seçili okuma")
        notebook.add(global_tab, text="Genel düzeltmeler")
        notebook.add(batch_tab, text="Toplu üretim")
        notebook.add(log_tab, text="İşlem kayıtları")

        ttk.Label(article_tab, text="1  /  OKUMA METNİ",
                  style="Panel.TLabel", font=("Segoe UI Semibold", 11)).pack(anchor="w")
        self.selected_label = ttk.Label(article_tab, text="Soldan bir makale seçin.",
                                        style="Panel.TLabel", wraplength=530)
        self.selected_label.pack(anchor="w", pady=(6, 7))
        ttk.Label(article_tab, text="Yalnız seslendirilecek metni değiştirirsiniz. Sitedeki başlık değişmez.",
                  style="Muted.TLabel", wraplength=525).pack(anchor="w", pady=(0, 7))
        self.text = tk.Text(article_tab, height=6, wrap="word", undo=True,
                            font=("Segoe UI", 10), background="#fbfcff",
                            foreground="#19334b", relief="solid", borderwidth=1,
                            padx=9, pady=8, highlightthickness=0)
        self.text.pack(fill="both", expand=True)
        speed_row = ttk.Frame(article_tab, style="Panel.TFrame")
        speed_row.pack(fill="x", pady=8)
        ttk.Label(speed_row, text="Okuma hızı", style="Panel.TLabel").pack(side="left")
        self.speed_values = ["0.80", "0.85", "0.90", "0.95", "1.00", "1.05", "1.10", "1.15", "1.20"]
        ttk.Combobox(speed_row, width=6, state="readonly", textvariable=self.speed,
                     values=self.speed_values).pack(side="left", padx=7)
        ttk.Label(speed_row, text="0.80 yavaş    1.00 normal    1.20 hızlı",
                  style="Muted.TLabel").pack(side="left")
        ttk.Label(article_tab, text="2  /  ÖNCE DİNLEYİN, SONRA KABUL EDİN",
                  style="Panel.TLabel", font=("Segoe UI Semibold", 11)).pack(anchor="w", pady=(9, 6))
        play_row = ttk.Frame(article_tab, style="Panel.TFrame")
        play_row.pack(fill="x")
        self.btn_old = ttk.Button(play_row, text="Önceki MP3'ü dinle", command=self.listen_old)
        self.btn_old.pack(side="left", padx=(0, 7))
        self.btn_preview = ttk.Button(play_row, text="Yeni okumayı üret ve dinle",
                                      command=self.preview_audio, style="Accent.TButton")
        self.btn_preview.pack(side="left")
        accept_row = ttk.Frame(article_tab, style="Panel.TFrame")
        accept_row.pack(fill="x", pady=(10, 4))
        self.btn_accept = ttk.Button(accept_row, text="Beğendim, yerel MP3'ü değiştir",
                                     command=self.accept, state="disabled")
        self.btn_accept.pack(side="left", padx=(0, 7))
        ttk.Button(accept_row, text="Metin ayarını kaydet", command=self.save_override).pack(side="left")
        ttk.Button(article_tab, text="Bu makaleyi varsayılana döndür",
                   command=self.reset_override).pack(anchor="w", pady=5)
        self.selection_status = tk.StringVar(value="Yeni ses için önce bir makale seçin.")
        ttk.Label(article_tab, textvariable=self.selection_status, wraplength=530,
                  style="Muted.TLabel").pack(anchor="w", pady=(4, 0))

        ttk.Label(global_tab, text="GENEL TELAFFUZ SÖZLÜĞÜ",
                  font=("Segoe UI Semibold", 11), style="Panel.TLabel").pack(anchor="w")
        ttk.Label(global_tab, text="Bir terimi tüm başlıklarda aynı şekilde okutun. Örnek: SMARCA4  →  smark-a4",
                  style="Muted.TLabel", wraplength=510).pack(anchor="w", pady=7)
        ttk.Label(global_tab, text="Yazılı terim", style="Panel.TLabel").pack(anchor="w")
        self.find = ttk.Entry(global_tab)
        self.find.pack(fill="x", pady=(2, 8))
        ttk.Label(global_tab, text="Sesli okunacak karşılığı", style="Panel.TLabel").pack(anchor="w")
        self.say = ttk.Entry(global_tab)
        self.say.pack(fill="x", pady=(2, 8))
        tools_row = ttk.Frame(global_tab, style="Panel.TFrame")
        tools_row.pack(fill="x", pady=5)
        ttk.Checkbutton(tools_row, text="Yalnız tam terimde uygula", variable=self.whole_word).pack(side="left")
        ttk.Button(tools_row, text="Kural ekle", command=self.add_rule,
                   style="Accent.TButton").pack(side="left", padx=5)
        ttk.Button(tools_row, text="Seçili kuralı sil", command=self.remove_rule).pack(side="left")
        self.rule_table = ttk.Treeview(global_tab, columns=("find", "say", "whole"),
                                       show="headings", height=6, selectmode="browse")
        for name, label, size in [
            ("find", "Bul", 120), ("say", "Böyle oku", 240), ("whole", "Tam terim", 85)
        ]:
            self.rule_table.heading(name, text=label)
            self.rule_table.column(name, width=size, stretch=(name == "say"))
        self.rule_table.pack(fill="both", expand=True, pady=7)
        global_speed_row = ttk.Frame(global_tab, style="Panel.TFrame")
        global_speed_row.pack(fill="x", pady=(7, 0))
        ttk.Label(global_speed_row, text="Genel hız", style="Panel.TLabel").pack(side="left")
        ttk.Combobox(global_speed_row, values=self.speed_values, state="readonly", width=6,
                     textvariable=self.global_speed).pack(side="left", padx=7)
        ttk.Button(global_speed_row, text="Hızı kaydet", command=self.save_global_speed).pack(side="left")
        ttk.Label(global_tab, text="Not: Düzeltmeler kaydedilir. Mevcut MP3'ler ayrıca yeniden üretilince değişir.",
                  wraplength=510, style="Muted.TLabel").pack(anchor="w", pady=8)

        ttk.Label(batch_tab, text="TOPLU SES ÜRETİMİ",
                  font=("Segoe UI Semibold", 11), style="Panel.TLabel").pack(anchor="w")
        ttk.Label(batch_tab,
                  text="Önce eksik sesler hazırlanır. 150 günü geçen veya telaffuzu değişen kayıtlar sonra yenilenir. "
                       "Hazır MP3'ler gerekmedikçe yeniden üretilmez.",
                  style="Muted.TLabel", wraplength=520).pack(anchor="w", pady=(8, 20))
        run_row = ttk.Frame(batch_tab, style="Panel.TFrame")
        run_row.pack(fill="x")
        ttk.Label(run_row, text="Bir çalışmada", style="Panel.TLabel").pack(side="left")
        ttk.Combobox(run_row, width=9, state="readonly", values=["1", "8", "24", "Tumu"],
                     textvariable=self.batch).pack(side="left", padx=8)
        ttk.Label(run_row, text="kayıt hazırla", style="Panel.TLabel").pack(side="left")
        ttk.Button(batch_tab, text="Eksik veya eski MP3'leri üret",
                   command=self.batch_generate, style="Accent.TButton").pack(anchor="w", pady=(17, 7))
        ttk.Button(batch_tab, text="Mevcut partiden sonra durdur",
                   command=self.stop_event.set).pack(anchor="w", pady=6)
        ttk.Label(batch_tab, text="Her 8 kayıtta güvenli kayıt yapılır. GitHub'a göndermek ayrı onay gerektirir.",
                  style="Muted.TLabel", wraplength=510).pack(anchor="w", pady=12)

        ttk.Label(log_tab, text="İŞLEM / HATA KAYITLARI",
                  font=("Segoe UI Semibold", 11), style="Panel.TLabel").pack(anchor="w")
        ttk.Label(log_tab, text="Bir hata olursa ayrıntılı hata kaydı bilgisayarda tutulur.",
                  style="Muted.TLabel").pack(anchor="w", pady=6)
        self.log = scrolledtext.ScrolledText(log_tab, state="disabled", font=("Consolas", 9),
                                             wrap="word", borderwidth=0,
                                             background="#f6f8fb", foreground="#23405b")
        self.log.pack(fill="both", expand=True)
        ttk.Button(log_tab, text="Hata kayıt klasörünü aç", command=self.open_logs).pack(anchor="w", pady=8)

        footer = ttk.Frame(outer, style="Root.TFrame")
        footer.pack(fill="x", pady=(8, 0))
        self.progress = ttk.Progressbar(footer, orient="horizontal", length=140, mode="indeterminate")
        self.progress.pack(side="left", padx=(0, 10))
        ttk.Label(footer, textvariable=self.status, style="Root.TLabel",
                  font=("Segoe UI", 9)).pack(side="left", fill="x", expand=True)
        self.redraw_rules()

    def note(self, msg):
        self.log.configure(state="normal")
        self.log.insert("end", datetime.now().strftime("%H:%M:%S") + "  " + str(msg) + "\n")
        self.log.see("end")
        self.log.configure(state="disabled")
        self.status.set(str(msg))

    def open_logs(self):
        try:
            os.startfile(str(APP_HOME))
        except OSError as exc:
            messagebox.showerror("Klasör açılamadı", str(exc))

    def task(self, label, work, on_done=None):
        if self.running:
            messagebox.showinfo("İşlem devam ediyor", "Önce mevcut işlemin bitmesini bekleyin.")
            return
        self.running = True
        self.stop_event.clear()
        self.status.set(label)
        self.progress.start(12)

        def run_worker():
            try:
                result = work()
                self.events.put(("done", result, on_done))
            except Exception as error:
                self.events.put(("error", (str(error), traceback.format_exc()), None))
            finally:
                self.events.put(("free", None, None))
        threading.Thread(target=run_worker, daemon=True).start()

    def show_task_error(self, error, detail):
        path = APP_HOME / "ahenk_hata.log"
        with path.open("a", encoding="utf-8") as file:
            file.write("\n" + datetime.now().isoformat() + "\n" + detail + "\n")
        self.note("HATA: " + error)
        messagebox.showerror(
            "Ahenk işlemi tamamlanamadı",
            error[:750] + "\n\nAyrıntılı kayıt:\n" + str(path) +
            "\n\nKayıtlar sekmesinden hata klasörünü açabilirsiniz.",
        )

    def process_events(self):
        try:
            while True:
                kind, data, callback = self.events.get_nowait()
                try:
                    if kind == "log":
                        self.note(data)
                    elif kind == "model":
                        self.model_status.set(data)
                    elif kind == "done":
                        if callback:
                            callback(data)
                        else:
                            self.note(str(data))
                    elif kind == "error":
                        self.show_task_error(data[0], data[1])
                    elif kind == "free":
                        self.running = False
                        self.progress.stop()
                except Exception as callback_error:
                    self.show_task_error(str(callback_error), traceback.format_exc())
        except queue.Empty:
            pass
        self.root.after(100, self.process_events)

    def load_cache(self):
        try:
            if CACHE.is_file():
                self.articles = json.loads(CACHE.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            self.articles = []

    def reload(self):
        self.rules = pron.load(RULES)
        self.manifest = engine.load_manifest()
        self.global_speed.set(f"{self.rules.get('global_speed', 1.0):.2f}")
        self.redraw_rules()
        self.draw()

    def candidate(self, article):
        key = engine.key_for(article["journal"], article["title"], article["pmid"])
        return engine.catalog([article])[key]

    def draw(self):
        previously_selected = self.current
        self.by_key = {}
        self.table.delete(*self.table.get_children())
        vals = ["Tum dergiler"] + sorted({a["journal"] for a in self.articles})
        self.journal_list["values"] = vals
        if self.journal.get() not in vals:
            self.journal.set(vals[0])
        catalog = engine.catalog(self.articles) if self.articles else {}
        ready = missing = due = 0
        current_time = datetime.now(timezone.utc)
        for article in self.articles:
            key = engine.key_for(article["journal"], article["title"], article["pmid"])
            candidate = catalog[key]
            prev = self.manifest["entries"].get(key)
            if engine.fresh(prev, candidate, current_time):
                state, tag = "✓ Hazır", "ready"
                ready += 1
            elif engine.playable(prev, candidate):
                state, tag = "↻ Yenilenecek", "stale"
                due += 1
            else:
                state, tag = "• Eksik", "missing"
                missing += 1
            if self.journal.get() != "Tum dergiler" and article["journal"] != self.journal.get():
                continue
            if self.filter.get().casefold() not in (
                article["journal"] + article["title"] + article["pmid"]
            ).casefold():
                continue
            self.by_key[key] = article
            self.table.insert("", "end", iid=key,
                              values=(state, article["journal"], article["title"], article["pmid"]),
                              tags=(tag,))
        self.summary.set(f"{len(self.articles)} başlık     ✓ {ready} hazır     • {missing} eksik     ↻ {due} yenilenecek")
        if previously_selected in self.by_key:
            self.table.selection_set(previously_selected)
        elif self.by_key:
            self.table.selection_set(next(iter(self.by_key)))
        else:
            self.current = None
            self.editor_key = None
            self.selected_label.configure(text="Aramanıza uygun makale bulunamadı.")
            self.selection_status.set("Bir makale seçmek için filtreyi değiştirin.")
            self.btn_accept.configure(state="disabled")
            self.btn_old.configure(state="disabled")
        if self.table.selection():
            self.choose_article()

    def choose_article(self, _event=None):
        selection = self.table.selection()
        if not selection:
            return
        key = selection[0]
        article = self.by_key.get(key)
        if article is None:
            return
        if self.editor_key and self.editor_key != key:
            self.editor_drafts[self.editor_key] = (
                self.text.get("1.0", "end-1c"), self.speed.get()
            )
        self.current = key
        self.selected_label.configure(text=article["journal"] + "  ·  " + article["title"])
        if self.editor_key != key:
            override = self.rules.get("articles", {}).get(pron.identity(article), {})
            draft = self.editor_drafts.get(key)
            initial_text = draft[0] if draft else override.get(
                "text", engine.spoken(article["title"])
            )
            initial_speed = draft[1] if draft else f"{override.get('speed', self.rules.get('global_speed', 1.0)):.2f}"
            self.text.delete("1.0", "end")
            self.text.insert("1.0", initial_text)
            self.speed.set(initial_speed)
            self.editor_key = key
            self.preview = None
        entry = self.manifest["entries"].get(key)
        is_old = engine.playable(entry, self.candidate(article))
        self.btn_old.configure(state="normal" if is_old else "disabled")
        can_accept = self.preview is not None and self.preview[0] == key
        self.btn_accept.configure(state="normal" if can_accept else "disabled")
        if can_accept:
            self.selection_status.set("Deneme MP3'ü hazır. Beğendiyseniz kabul edebilirsiniz.")
        else:
            self.selection_status.set("Metni düzenleyip 'Yeni okumayı üret ve dinle' düğmesine basın.")

    def selected(self):
        if self.current not in self.by_key:
            raise ValueError("Önce soldan bir makale seçin.")
        return self.by_key[self.current]

    def current_profile(self):
        text = self.text.get("1.0", "end-1c").strip()
        if not 1 <= len(text) <= 3000:
            raise ValueError("Okuma metni 1-3000 karakter olmali.")
        return {"text": text, "speed": float(self.speed.get())}

    def save_profile(self, profile):
        article = self.selected()
        new = copy.deepcopy(self.rules)
        key = pron.identity(article)
        if profile == {"text": engine.spoken(article["title"]),
                       "speed": new.get("global_speed", 1.0)}:
            new["articles"].pop(key, None)
        else:
            new["articles"][key] = profile
        pron.save(RULES, new)
        self.rules = new
        self.draw()

    def save_override(self):
        try:
            self.save_profile(self.current_profile())
            self.editor_drafts.pop(self.current, None)
            self.preview = None
            self.btn_accept.configure(state="disabled")
            self.selection_status.set("Metin kaydedildi. Değişikliği duymak için yeni MP3 üretin.")
            self.note("Makale düzeltmesi kaydedildi. Ses üretimi henüz yapılmadı.")
        except (ValueError, OSError) as e:
            messagebox.showerror("Kaydedilemedi", str(e))

    def reset_override(self):
        try:
            a = self.selected()
            self.rules.get("articles", {}).pop(pron.identity(a), None)
            pron.save(RULES, self.rules)
            self.editor_drafts.pop(self.current, None)
            self.editor_key = None
            self.preview = None
            self.draw()
            self.note("Bu makale için özel okuma kaldırıldı. Mevcut ses korunuyor.")
        except (ValueError, OSError) as e:
            messagebox.showerror("Hata", str(e))

    def redraw_rules(self):
        self.rule_table.delete(*self.rule_table.get_children())
        for i, item in enumerate(self.rules.get("global", [])):
            self.rule_table.insert("", "end", iid=str(i),
                                   values=(item["find"], item["say"],
                                           "Evet" if item.get("whole_word", True) else "Hayir"))

    def add_rule(self):
        src, dst = self.find.get().strip(), self.say.get().strip()
        if not src or not dst or src.casefold() == dst.casefold():
            messagebox.showwarning("Eksik kural", "Farkli metin ve soylenecek karsiligini girin.")
            return
        new = copy.deepcopy(self.rules)
        new["global"].append({"find": src, "say": dst, "whole_word": bool(self.whole_word.get())})
        try:
            pron.save(RULES, new)
            self.rules = new
            self.redraw_rules()
            self.draw()
            self.preview = None
            self.note("Genel kural eklendi: " + src + " -> " + dst)
        except (OSError, ValueError) as e:
            messagebox.showerror("Hata", str(e))

    def remove_rule(self):
        selection = self.rule_table.selection()
        if not selection:
            return
        new = copy.deepcopy(self.rules)
        new["global"].pop(int(selection[0]))
        pron.save(RULES, new)
        self.rules = new
        self.redraw_rules()
        self.draw()
        self.preview = None
        self.note("Genel kural silindi.")

    def save_global_speed(self):
        try:
            new = copy.deepcopy(self.rules)
            new["global_speed"] = float(self.global_speed.get())
            pron.save(RULES, new)
            self.rules = new
            self.draw()
            self.preview = None
            self.note("Yeni genel okuma hizi kaydedildi.")
        except (ValueError, OSError) as e:
            messagebox.showerror("Hata", str(e))

    def scan(self):
        def work():
            articles = engine.load_sheet()
            if len(articles) < engine.MIN_EXPECTED_ARTICLES:
                raise RuntimeError("Google Sheets eksik; onceki veriler korunuyor.")
            CACHE.write_text(json.dumps(articles, ensure_ascii=False), encoding="utf-8")
            return articles
        self.task("Google Sheets taraniyor...", work, self.scanned)

    def scanned(self, articles):
        self.articles = articles
        self.reload()
        self.note(f"{len(articles)} makale guncellendi.")

    def pull(self):
        self.task("GitHub guvenli guncelleniyor...", pull_clean,
                  lambda msg: (self.reload(), self.note(msg)))

    def install(self):
        def work():
            if not shutil.which("ffmpeg"):
                raise RuntimeError("FFmpeg eksik. PowerShell: winget install -e --id Gyan.FFmpeg")
            self.events.put(("log", "Ahenk Python kutuphaneleri kuruluyor...", None))
            run([sys.executable, "-m", "pip", "install", "-r",
                 str(ROOT / "scripts" / "podcast-audio-requirements.txt")], timeout=2700)
            return "Ahenk kutuphaneleri hazir. Model ilk okumada indirilir."
        self.task("Ses motoru kuruluyor...", work)

    def test_sound(self):
        """Render a short audible probe without touching any published MP3."""
        def work():
            if not shutil.which("ffmpeg"):
                raise RuntimeError("FFmpeg bulunamadı. Kurun: winget install -e --id Gyan.FFmpeg")
            audio = PREVIEWS / "ahenk_test_ses_hazir.mp3"
            self.events.put(("log", "Kısa test sesi üretiliyor: Ses hazır", None))
            engine.render_clip(self.get_tts(), "Ses hazır", audio, speed=1.0)
            return audio

        def on_done(path):
            self.note("Ahenk çalışıyor: test MP3 başarıyla üretildi.")
            try:
                os.startfile(str(path))
            except OSError as exc:
                self.note("Test MP3 oluşturuldu, oynatıcı açılmadı: " + str(exc))
        self.task("Ahenk kısa test sesi hazırlanıyor...", work, on_done)

    def get_tts(self):
        if self.tts is None:
            self.events.put(("model", "Ahenk: model yükleniyor / indiriliyor…", None))
            self.events.put(("log", "Ahenk modeli hazırlanıyor. İlk indirme birkaç dakika sürebilir.", None))
            try:
                # pythonw.exe starts without stdout/stderr. stdio_guard restores
                # writable file-backed handles for Hugging Face/EMA/PyTorch.
                ensure_stdio(APP_HOME)
                self.tts = engine.create_tts()
            except Exception:
                self.events.put(("model", "Ahenk: yükleme hatası · İşlem kayıtlarına bakın", None))
                raise
            self.events.put(("model", "Ahenk modeli: Hazır ✓", None))
            self.events.put(("log", "Ahenk model dosyaları yüklendi. Ses hazırlanabilir.", None))
        return self.tts

    def listen_old(self):
        try:
            a = self.selected()
            entry = self.manifest["entries"].get(self.current)
            if not engine.playable(entry, self.candidate(a)):
                raise RuntimeError("Eski MP3 kaydi bulunamadi.")
            os.startfile(str(AUDIO / entry["file"]))
        except (RuntimeError, ValueError, OSError) as e:
            messagebox.showerror("Dinlenemedi", str(e))

    def preview_audio(self):
        try:
            article = self.selected()
            profile = self.current_profile()
            key = self.current
            rules = copy.deepcopy(self.rules)
            rules["articles"][pron.identity(article)] = profile
            spoken, speed = pron.speech(article, rules, engine.spoken(article["title"]))
            mark = pron.signature(spoken, speed)
            path = PREVIEWS / (key + ".mp3")
        except (ValueError, KeyError) as e:
            messagebox.showerror("Hata", str(e))
            return
        def work():
            if not shutil.which("ffmpeg"):
                raise RuntimeError("FFmpeg bulunamadı. Kurun: winget install -e --id Gyan.FFmpeg")
            pending = path.with_suffix(".pending")
            try:
                engine.render_clip(self.get_tts(), spoken, pending, speed=speed)
                os.replace(pending, path)
            finally:
                pending.unlink(missing_ok=True)
            return (key, str(path), profile, mark)
        self.task("Yeni okuma olusturuluyor...", work, self.preview_done)

    def preview_done(self, data):
        self.preview = data
        self.note("Deneme MP3'ü üretildi. Dinleyin, beğenirseniz kabul edin.")
        if data[0] == self.current:
            self.btn_accept.configure(state="normal")
            self.selection_status.set("Ön dinleme hazır. 'Beğendim' düğmesiyle yerel arşive alabilirsiniz.")
            try:
                os.startfile(data[1])
            except OSError as exc:
                self.note("MP3 üretildi fakat varsayılan ses oynatıcı açılmadı: " + str(exc))

    def accept(self):
        try:
            article = self.selected()
            profile = self.current_profile()
            temp_rules = copy.deepcopy(self.rules)
            temp_rules["articles"][pron.identity(article)] = profile
            text, speed = pron.speech(article, temp_rules, engine.spoken(article["title"]))
            if not self.preview or self.preview[0] != self.current or self.preview[2] != profile or self.preview[3] != pron.signature(text, speed):
                raise RuntimeError("Bu metin ve hiz icin once on dinleme yapin.")
            src = Path(self.preview[1])
            if not src.is_file() or src.stat().st_size < 1024:
                raise RuntimeError("On dinleme MP3 kaydi gecersiz.")
            if not messagebox.askyesno("Yeni sesi kabul et",
                                       "Eski MP3 yerelde degistirilecek; GitHub'a henuz gonderilmeyecek. Devam?"):
                return
            self.save_profile(profile)
            candidate = self.candidate(article)
            AUDIO.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(dir=AUDIO, prefix=".accept-",
                                             suffix=".mp3", delete=False) as f:
                scratch = Path(f.name)
            try:
                shutil.copy2(src, scratch)
                os.replace(scratch, AUDIO / candidate["file"])
            finally:
                scratch.unlink(missing_ok=True)
            manifest = engine.load_manifest()
            now = datetime.now(timezone.utc).isoformat()
            manifest["entries"][self.current] = {**candidate, "generated_at": now}
            manifest["generated_at"] = now
            write_manifest(manifest)
            self.preview = None
            self.editor_drafts.pop(self.current, None)
            self.reload()
            self.selection_status.set("Beğendiğiniz MP3 yerel arşive alındı. GitHub'a gönderebilirsiniz.")
            self.note("Yeni MP3 kabul edildi. Yayımlamak için GitHub'a gönderin.")
        except (ValueError, RuntimeError, OSError) as e:
            messagebox.showerror("Kabul edilemedi", str(e))

    def batch_generate(self):
        limit = 250 if self.batch.get() == "Tumu" else int(self.batch.get())
        if not messagebox.askyesno("Toplu Ahenk uretimi",
                                   f"En fazla {limit} ses islenecek. Her 8 seste kaydedilir; GitHub'a otomatik gonderilmez."):
            return
        def work():
            articles = engine.load_sheet()
            total = 0
            tts = None
            try:
                while total < limit and not self.stop_event.is_set():
                    engine.BATCH_SIZE = min(MAX_BATCH, limit - total)
                    plan = engine.plan_updates(articles, engine.load_manifest(), datetime.now(timezone.utc))
                    if not plan["has_changes"]:
                        break
                    if plan["selected"] and tts is None:
                        tts = self.get_tts()
                    def notify(key, article):
                        self.events.put(("log", "Üretiliyor: " + article["title"][:70], None))
                    engine.execute_plan(plan, tts=tts, on_prepared=notify)
                    total += len(plan["selected"])
                    self.events.put(("log", f"{total} MP3 başarıyla arşive kaydedildi.", None))
                    if not plan["selected"]:
                        break
            finally:
                engine.BATCH_SIZE = MAX_BATCH
            return f"{total} ses uretildi/yenilendi. GitHub'a Gonder ile yayinlayin."
        self.task("Toplu ses uretimi...", work,
                  lambda msg: (self.reload(), self.note(msg)))

    def push(self):
        if not messagebox.askyesno("GitHub'a gonder",
                                   "Yalniz hazir MP3, manifest ve pronunciation.json gonderilecek. Onayliyor musunuz?"):
            return
        self.task("GitHub'a gonderiliyor...", publish, self.note)


def main():
    root = tk.Tk()
    try:
        App(root)
    except Exception as e:
        path = APP_HOME / "startup-error.log"
        path.write_text(traceback.format_exc(), encoding="utf-8")
        messagebox.showerror("Ahenk baslatilamadi", f"{e}\n\nHata kaydi: {path}")
        root.destroy()
        return
    root.mainloop()


if __name__ == "__main__":
    main()
