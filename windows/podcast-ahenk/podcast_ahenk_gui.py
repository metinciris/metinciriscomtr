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
        self.publish_choice = tk.StringVar(value="")
        self.choice_key = None
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
                                  show="headings", selectmode="extended")
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
        audio_tab = ttk.Frame(notebook, style="Panel.TFrame", padding=(12, 12))
        edit_tab = ttk.Frame(notebook, style="Panel.TFrame", padding=(12, 12))
        batch_tab = ttk.Frame(notebook, style="Panel.TFrame", padding=(12, 12))
        global_tab = ttk.Frame(notebook, style="Panel.TFrame", padding=(12, 12))
        log_tab = ttk.Frame(notebook, style="Panel.TFrame", padding=(12, 12))
        notebook.add(audio_tab, text="Sesler ve WEB yayını")
        notebook.add(edit_tab, text="Okumayı iyileştir")
        notebook.add(batch_tab, text="Toplu üretim")
        notebook.add(global_tab, text="Terim sözlüğü")
        notebook.add(log_tab, text="Kayıtlar")

        ttk.Label(audio_tab, text="BU MAKALENİN SESLERİ",
                  style="Panel.TLabel", font=("Segoe UI Semibold", 12)).pack(anchor="w")
        self.selected_label = ttk.Label(audio_tab, text="Soldan bir makale seçin.",
                                        style="Panel.TLabel", wraplength=530)
        self.selected_label.pack(anchor="w", pady=(7, 6))
        ttk.Label(audio_tab,
                  text="Her iki sesi dinleyin, yayına gidecek olanı kutusundan işaretleyin.",
                  style="Muted.TLabel", wraplength=520).pack(anchor="w", pady=(0, 12))

        voices = ttk.Frame(audio_tab, style="Panel.TFrame")
        voices.pack(fill="x", pady=(0, 8))
        voices.columnconfigure(0, weight=1)
        voices.columnconfigure(1, weight=1)
        left_voice = tk.Frame(voices, bg="#ebf5fc", highlightbackground="#accfe5",
                              highlightthickness=1, padx=11, pady=12)
        left_voice.grid(row=0, column=0, sticky="nsew", padx=(0, 7))
        right_voice = tk.Frame(voices, bg="#e9f5f0", highlightbackground="#aad5c1",
                               highlightthickness=1, padx=11, pady=12)
        right_voice.grid(row=0, column=1, sticky="nsew", padx=(7, 0))

        self.radio_web = tk.Radiobutton(
            left_voice, text="WEB / Şu an yayında",
            variable=self.publish_choice, value="web", command=self.choice_changed,
            bg="#ebf5fc", activebackground="#ebf5fc", fg="#214b6a",
            font=("Segoe UI Semibold", 10), anchor="w", state="disabled",
        )
        self.radio_web.pack(fill="x", anchor="w")
        self.web_card_status = tk.StringVar(value="Web sesleri kontrol ediliyor...")
        tk.Label(left_voice, textvariable=self.web_card_status,
                 bg="#ebf5fc", fg="#47627c", wraplength=210, justify="left",
                 font=("Segoe UI", 9), height=3).pack(fill="x", anchor="w", pady=(7, 9))
        self.btn_web = ttk.Button(left_voice, text="▶ WEB sesini dinle",
                                  command=self.listen_web, state="disabled")
        self.btn_web.pack(fill="x")

        self.radio_local = tk.Radiobutton(
            right_voice, text="BİLGİSAYAR / Yeni ses",
            variable=self.publish_choice, value="local", command=self.choice_changed,
            bg="#e9f5f0", activebackground="#e9f5f0", fg="#215843",
            font=("Segoe UI Semibold", 10), anchor="w", state="disabled",
        )
        self.radio_local.pack(fill="x", anchor="w")
        self.local_card_status = tk.StringVar(value="Bilgisayardaki MP3 kontrol ediliyor...")
        tk.Label(right_voice, textvariable=self.local_card_status,
                 bg="#e9f5f0", fg="#3d6754", wraplength=210, justify="left",
                 font=("Segoe UI", 9), height=3).pack(fill="x", anchor="w", pady=(7, 9))
        self.btn_old = ttk.Button(right_voice, text="▶ YEREL sesimi dinle",
                                  command=self.listen_old, state="disabled")
        self.btn_old.pack(fill="x")

        self.publish_choice_status = tk.StringVar(value="Yayına gidecek sesi seçmediniz.")
        ttk.Label(audio_tab, textvariable=self.publish_choice_status,
                  style="Panel.TLabel", wraplength=530,
                  font=("Segoe UI Semibold", 9)).pack(anchor="w", pady=(10, 6))
        self.btn_publish = ttk.Button(
            audio_tab, text="Seçtiğim sesi WEB'de yayımla / koru",
            command=self.publish_chosen_voice, style="Accent.TButton", state="disabled"
        )
        self.btn_publish.pack(fill="x", pady=(0, 9))
        ttk.Label(audio_tab,
                  text="GitHub'a gönderimden sonra site dağıtımı tamamlanınca dinlenen ses güncellenir. "
                       "Yukarıdaki WEB kutusu, sitenin mevcut durumunu gösterir.",
                  style="Muted.TLabel", wraplength=530).pack(anchor="w", pady=(0, 9))
        self.online_details = tk.StringVar(value="Web, yerel ve GitHub bilgileri burada görünecek.")
        ttk.Label(audio_tab, textvariable=self.online_details,
                  style="Muted.TLabel", wraplength=530).pack(anchor="w", pady=(6, 10))
        self.btn_restore = ttk.Button(
            audio_tab, text="GitHub'daki MP3'ü bilgisayara geri getir (yedekli)",
            command=self.restore_online, state="disabled"
        )
        self.btn_restore.pack(anchor="w")
        ttk.Button(audio_tab, text="↓ WEB'deki MP3'ü indirip klasörü aç",
                   command=self.save_web_voice).pack(anchor="w", pady=(9, 0))
        ttk.Label(audio_tab,
                  text="Yeni okuma üretmek için üstteki 'Okumayı iyileştir' sekmesini açın.",
                  style="Muted.TLabel", wraplength=520).pack(anchor="w", pady=(15, 0))
        self.selection_status = tk.StringVar(value="Soldan bir makale seçin.")
        ttk.Label(audio_tab, textvariable=self.selection_status,
                  style="Muted.TLabel", wraplength=530).pack(anchor="w", pady=(6, 0))

        ttk.Label(edit_tab, text="MAKALEYE ÖZEL OKUMA DÜZELTMESİ",
                  style="Panel.TLabel", font=("Segoe UI Semibold", 11)).pack(anchor="w")
        ttk.Label(edit_tab, text="Yalnız seslendirilen metni değiştirirsiniz; makale başlığı aynı kalır.",
                  style="Muted.TLabel", wraplength=520).pack(anchor="w", pady=(8, 9))
        self.text = tk.Text(edit_tab, height=8, wrap="word", undo=True,
                            font=("Segoe UI", 10), background="#fbfcff",
                            foreground="#19334b", relief="solid", borderwidth=1,
                            padx=9, pady=8, highlightthickness=0)
        self.text.pack(fill="both", expand=True)
        speed_row = ttk.Frame(edit_tab, style="Panel.TFrame")
        speed_row.pack(fill="x", pady=(11, 8))
        ttk.Label(speed_row, text="Okuma hızı", style="Panel.TLabel").pack(side="left")
        self.speed_values = ["0.80", "0.85", "0.90", "0.95", "1.00",
                             "1.05", "1.10", "1.15", "1.20"]
        ttk.Combobox(speed_row, width=6, state="readonly",
                     textvariable=self.speed, values=self.speed_values).pack(side="left", padx=7)
        ttk.Label(speed_row, text="0.80 yavaş  ·  1.00 normal  ·  1.20 hızlı",
                  style="Muted.TLabel").pack(side="left")
        self.btn_preview = ttk.Button(
            edit_tab, text="Yeni okumayı üret ve dinle",
            command=self.preview_audio, style="Accent.TButton"
        )
        self.btn_preview.pack(anchor="w", pady=(9, 7))
        self.btn_accept = ttk.Button(
            edit_tab, text="Beğendim · Yerel MP3'ü bu sesle değiştir",
            command=self.accept, state="disabled"
        )
        self.btn_accept.pack(anchor="w", pady=(6, 5))
        ttk.Button(edit_tab, text="Okuma metnini ve hızı kaydet",
                   command=self.save_override).pack(anchor="w", pady=(6, 5))
        ttk.Label(edit_tab,
                  text="Onaylamadan önce deneme MP3'ü mevcut yerel veya web sesini değiştirmez.",
                  style="Muted.TLabel", wraplength=520).pack(anchor="w", pady=(10, 0))

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
        ttk.Button(batch_tab, text="Soldaki listeden seçtiğim makaleleri üret",
                   command=self.generate_checked).pack(anchor="w", pady=(5, 7))
        ttk.Label(batch_tab, text="Birden çok başlık: solda Ctrl veya Shift ile seçin. "
                                  "Yalnız eksik veya yeniden üretilecekleri işler.",
                  style="Muted.TLabel", wraplength=510).pack(anchor="w", pady=(0, 7))
        ttk.Button(batch_tab, text="Mevcut partiden sonra durdur",
                   command=self.stop_event.set).pack(anchor="w", pady=6)
        ttk.Label(batch_tab, text="Her 8 kayıt yerel arşive kaydedilir; otomatik yayımlanmaz. "
                                  "Yeni sesleri soldaki 'Yerel yeni' filtresinden inceleyebilirsiniz.",
                  style="Muted.TLabel", wraplength=510).pack(anchor="w", pady=12)
        ttk.Button(batch_tab, text="Tüm yerel hazır MP3'leri GitHub'a gönder",
                   command=self.push, style="Accent.TButton").pack(anchor="w", pady=(6, 5))
        ttk.Button(batch_tab, text="Web'de hangi MP3'lerin bulunduğunu yenile",
                   command=self.refresh_web).pack(anchor="w", pady=5)

        ttk.Label(log_tab, text="İŞLEM / HATA KAYITLARI",
                  font=("Segoe UI Semibold", 11), style="Panel.TLabel").pack(anchor="w")
        ttk.Label(log_tab, text="Bir hata olursa ayrıntılı hata kaydı bilgisayarda tutulur.",
                  style="Muted.TLabel").pack(anchor="w", pady=6)
        self.log = scrolledtext.ScrolledText(log_tab, state="disabled", font=("Consolas", 9),
                                             wrap="word", borderwidth=0,
                                             background="#f6f8fb", foreground="#23405b")
        self.log.pack(fill="both", expand=True)
        log_actions = ttk.Frame(log_tab, style="Panel.TFrame")
        log_actions.pack(fill="x", pady=8)
        ttk.Button(log_actions, text="Log klasörünü aç", command=self.open_logs).pack(side="left", padx=(0, 5))
        ttk.Button(log_actions, text="Hata raporunu kopyala", command=self.copy_logs).pack(side="left", padx=(0, 5))
        ttk.Button(log_actions, text="Kaydedilen MP3'leri aç", command=self.open_audio_folder).pack(side="left")

        footer = ttk.Frame(outer, style="Root.TFrame")
        footer.pack(fill="x", pady=(8, 0))
        self.progress = ttk.Progressbar(footer, orient="horizontal", length=140, mode="indeterminate")
        self.progress.pack(side="left", padx=(0, 10))
        ttk.Label(footer, textvariable=self.status, style="Root.TLabel",
                  font=("Segoe UI", 9)).pack(side="left", fill="x", expand=True)
        shortcut_bar = ttk.Frame(outer, style="Root.TFrame")
        shortcut_bar.pack(fill="x", pady=(7, 0))
        ttk.Label(shortcut_bar, text="HIZLI ERİŞİM:", style="Root.TLabel").pack(side="left", padx=(0, 7))
        for label, callback in [
            ("Logları aç", self.open_logs),
            ("MP3 klasörü", self.open_audio_folder),
            ("Web sesleri", self.open_web_audio_folder),
            ("Web sitesi", self.open_site),
            ("GitHub kodları", self.open_github),
            ("Kullanım rehberi", self.open_guide),
        ]:
            ttk.Button(shortcut_bar, text=label, command=callback).pack(side="left", padx=(0, 5))
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
        """Compare what is live on the site with generated local audio."""
        previously_selected = self.current
        self.by_key = {}
        self.table.delete(*self.table.get_children())
        journals = ["Tum dergiler"] + sorted({a["journal"] for a in self.articles})
        self.journal_list["values"] = journals
        if self.journal.get() not in journals:
            self.journal.set(journals[0])

        catalog = engine.catalog(self.articles) if self.articles else {}
        on_web = self.web_manifest.get("entries", {})
        on_github = self.github_manifest.get("entries", {})
        try:
            dirty = git_sync.changes(ROOT)
        except (RuntimeError, OSError):
            dirty = {}
        totals = {"web": 0, "new": 0, "ready": 0, "due": 0, "missing": 0}
        now = datetime.now(timezone.utc)
        for article in self.articles:
            key = engine.key_for(article["journal"], article["title"], article["pmid"])
            candidate = catalog[key]
            local = self.manifest["entries"].get(key)
            web = on_web.get(key)
            hosted = on_github.get(key)
            web_exists = isinstance(web, dict) and web.get("file") == key + ".mp3"
            local_exists = engine.playable(local, candidate)
            local_new = local_exists and (
                git_sync.AUDIO_PREFIX + key + ".mp3" in dirty or local != hosted
            )
            if web_exists:
                totals["web"] += 1
            if local_new:
                local_label, tag = "Yeni / bekliyor", "new"
                totals["new"] += 1
            elif engine.fresh(local, candidate, now):
                local_label, tag = "Hazır", "ready"
                totals["ready"] += 1
            elif local_exists:
                local_label, tag = "Yenilenecek", "stale"
                totals["due"] += 1
            else:
                local_label, tag = "Eksik", "missing"
                totals["missing"] += 1

            wanted = self.state_filter.get()
            if wanted == "Web'de var" and not web_exists:
                continue
            if wanted == "Web'de yok" and web_exists:
                continue
            if wanted == "Yerel yeni" and not local_new:
                continue
            if wanted == "Yerel hazır" and not local_exists:
                continue
            if wanted == "Yerel eksik" and local_exists:
                continue
            if wanted == "Yenilenecek" and tag != "stale":
                continue
            if self.journal.get() != "Tum dergiler" and article["journal"] != self.journal.get():
                continue
            if self.filter.get().casefold() not in (
                article["journal"] + article["title"] + article["pmid"]
            ).casefold():
                continue
            self.by_key[key] = article
            self.table.insert("", "end", iid=key,
                              values=("✓ Yayında" if web_exists else "— Yok",
                                      local_label, article["journal"],
                                      article["title"], article["pmid"]),
                              tags=(tag,))

        self.summary.set(
            f"{len(self.articles)} makale  ·  Web {totals['web']}  ·  "
            f"Yerel yeni {totals['new']}  ·  "
            f"Hazır {totals['ready']}  ·  "
            f"Yenilenecek {totals['due']}  ·  Eksik {totals['missing']}"
        )
        self.web_summary.set(
            f"Web kaynağı: {self.web_checked} ({len(on_web)} MP3)"
        )
        if previously_selected in self.by_key:
            self.table.selection_set(previously_selected)
        elif self.by_key:
            self.table.selection_set(next(iter(self.by_key)))
        else:
            self.current = None
            self.editor_key = None
            self.selected_label.configure(text="Bu filtreye uygun makale bulunamadı.")
            self.selection_status.set("Sol taraftaki filtreyi değiştirin.")
            self.online_details.set("Web ve yerel ses seçimi için bir başlık seçin.")
            self.publish_choice.set("")
            self.choice_key = None
            self.web_card_status.set("Başlık seçilmedi")
            self.local_card_status.set("Başlık seçilmedi")
            self.publish_choice_status.set("Yayına gidecek ses seçilmedi.")
            self.radio_web.configure(state="disabled")
            self.radio_local.configure(state="disabled")
            for btn in (self.btn_accept, self.btn_old,
                        self.btn_web, self.btn_publish, self.btn_restore):
                btn.configure(state="disabled")
        if self.table.selection():
            self.choose_article()

    def choose_article(self, _event=None):
        selection = self.table.selection()
        if not selection:
            return
        focused = self.table.focus()
        key = focused if focused in selection else selection[0]
        article = self.by_key.get(key)
        if article is None:
            return
        if self.editor_key and self.editor_key != key:
            self.editor_drafts[self.editor_key] = (
                self.text.get("1.0", "end-1c"), self.speed.get()
            )
        self.current = key
        if self.choice_key != key:
            self.publish_choice.set("")
            self.choice_key = key
        self.selected_label.configure(text=article["journal"] + " · " + article["title"])
        if self.editor_key != key:
            override = self.rules.get("articles", {}).get(pron.identity(article), {})
            draft = self.editor_drafts.get(key)
            default_text = engine.spoken(article["title"])
            initial_text = draft[0] if draft else override.get("text", default_text)
            initial_speed = (draft[1] if draft else
                             f"{override.get('speed', self.rules.get('global_speed', 1.0)):.2f}")
            self.text.delete("1.0", "end")
            self.text.insert("1.0", initial_text)
            self.speed.set(initial_speed)
            self.editor_key = key
            self.preview = None
        entry = self.manifest["entries"].get(key)
        old_available = engine.playable(entry, self.candidate(article))
        web_entry = self.web_manifest.get("entries", {}).get(key)
        site_available = isinstance(web_entry, dict) and web_entry.get("file") == key + ".mp3"
        github_available = key in self.github_manifest.get("entries", {})
        self.btn_old.configure(state="normal" if old_available else "disabled")
        self.btn_web.configure(state="normal" if site_available else "disabled")
        self.btn_restore.configure(state="normal" if github_available else "disabled")
        self.radio_web.configure(state="normal" if site_available else "disabled")
        self.radio_local.configure(state="normal" if old_available else "disabled")
        if not site_available and self.publish_choice.get() == "web":
            self.publish_choice.set("")
        if not old_available and self.publish_choice.get() == "local":
            self.publish_choice.set("")
        can_accept = self.preview is not None and self.preview[0] == key
        self.btn_accept.configure(state="normal" if can_accept else "disabled")
        web_stamp = str(web_entry.get("generated_at", ""))[:16].replace("T", " ") if site_available else "—"
        local_stamp = str(entry.get("generated_at", ""))[:16].replace("T", " ") if entry else "—"
        self.online_details.set(
            f"WEB: {'✓ Sitede yayında' if site_available else 'MP3 henüz yok'} "
            f"({web_stamp})   |   "
            f"YEREL: {'✓ MP3 var' if old_available else 'MP3 yok'} ({local_stamp})\n"
            f"GITHUB: {'✓ Kayıtlı' if github_available else 'henüz gönderilmemiş'}   "
            f"·   PMID: {article['pmid']}"
        )
        self.web_card_status.set(
            ("✓ Web'de yayında\nOluşturulma: " + web_stamp) if site_available
            else "Henüz web MP3'ü yok\nYerel sesi üretebilirsiniz."
        )
        self.local_card_status.set(
            ("✓ MP3 mevcut\nOluşturulma: " + local_stamp) if old_available
            else "Bu bilgisayarda MP3 yok\nToplu veya tekli üretilebilir."
        )
        self.choice_changed()
        if can_accept:
            self.selection_status.set("Yeni MP3 hazır. Beğendiyseniz kabul edip web'e gönderebilirsiniz.")
        elif old_available:
            self.selection_status.set("Yerel MP3'ü web'dekiyle dinleyerek karşılaştırın veya yayımlayın.")
        else:
            self.selection_status.set("Yerel ses yok. Ahenk ile üretip beğenirseniz yayımlayın.")

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

    def open_site(self):
        webbrowser.open("https://metinciris.com.tr/podcast/")

    def open_github(self):
        webbrowser.open("https://github.com/metinciris/metinciriscomtr/tree/main/windows/podcast-ahenk")

    def open_guide(self):
        webbrowser.open("https://github.com/metinciris/metinciriscomtr/blob/main/windows/podcast-ahenk/README.md")

    def open_audio_folder(self):
        AUDIO.mkdir(parents=True, exist_ok=True)
        try:
            os.startfile(str(AUDIO))
        except OSError as error:
            messagebox.showerror("MP3 klasörü açılamadı", str(error))

    def open_web_audio_folder(self):
        folder = APP_HOME / "web_mp3"
        folder.mkdir(parents=True, exist_ok=True)
        try:
            os.startfile(str(folder))
        except OSError as error:
            messagebox.showerror("Web ses klasörü açılamadı", str(error))

    def copy_logs(self):
        pieces = []
        for filename in ("ahenk_hata.log", "ahenk_motor.log", "startup-error.log"):
            path = APP_HOME / filename
            if path.is_file():
                try:
                    pieces.append(filename + "\n" + path.read_text(
                        encoding="utf-8", errors="replace"
                    )[-4500:])
                except OSError:
                    pass
        if not pieces:
            pieces.append(self.log.get("1.0", "end-1c")[-5000:])
        self.root.clipboard_clear()
        self.root.clipboard_append("\n\n".join(pieces))
        self.note("Hata raporu panoya kopyalandı. Sohbete Ctrl+V ile yapıştırabilirsiniz.")

    def refresh_web(self):
        """Actual live site, not just GitHub's future deployment manifest."""
        def work():
            manifest = online_audio.fetch_manifest()
            online_audio.cache_manifest(APP_HOME, manifest)
            return manifest

        def done(manifest):
            self.web_manifest = manifest
            self.web_checked = "Şimdi / web sitesi"
            self.draw()
            self.note(f"Web sitesindeki {len(manifest['entries'])} yayımlanmış MP3 görüldü.")
        self.task("Web sitesindeki hazır MP3 listesi okunuyor...", work, done)

    def pull(self):
        """Update app code + download GitHub MP3s without overwriting local edits."""
        def work():
            message = git_sync.sync(ROOT, APP_HOME)
            github = git_sync.remote_manifest(ROOT)
            try:
                web = online_audio.fetch_manifest()
                online_audio.cache_manifest(APP_HOME, web)
                online_error = None
            except (OSError, RuntimeError, ValueError) as error:
                web = None
                online_error = str(error)
            return message, github, web, online_error

        def done(result):
            message, github, web, online_error = result
            self.github_manifest = github
            if web is not None:
                self.web_manifest = web
                self.web_checked = "Şimdi / web sitesi"
            self.reload()
            self.note(message)
            if online_error:
                self.note("GitHub güncellendi, fakat web sitesi geçici olarak okunamadı: " + online_error)
        self.task("GitHub'dan hazır MP3'ler ve güncel kod indiriliyor...", work, done)

    def listen_web(self):
        try:
            key = self.current
            self.selected()
            manifest = copy.deepcopy(self.web_manifest)
            if key not in manifest.get("entries", {}):
                raise RuntimeError("Web sitesinde bu makalenin hazır MP3 kaydı yok.")
        except (ValueError, RuntimeError) as error:
            messagebox.showinfo("Web'de MP3 yok", str(error))
            return

        def work():
            return online_audio.download_clip(APP_HOME, key, manifest)

        def done(path):
            self.note("Web'de yayımlanan MP3 indirildi; bilgisayardaki yeni sesiniz değişmedi.")
            try:
                os.startfile(str(path))
            except OSError as error:
                self.note("İndirilen MP3 açılamadı: " + str(error))
        self.task("Web sitesindeki yayımlanmış ses indiriliyor...", work, done)

    def restore_online(self):
        try:
            key = self.current
            self.selected()
            if not messagebox.askyesno(
                "GitHub sesine geri dön",
                "Seçili makalenin yerel MP3'ü GitHub'daki yayıma hazırlanmış "
                "sürümle değişecek. Yerel ses yedeklenir. Devam?"
            ):
                return
        except ValueError as error:
            messagebox.showerror("Başlık seçin", str(error))
            return
        self.task(
            "GitHub sesinin yerel arşive yedeği alınıp geri getiriliyor...",
            lambda: git_sync.restore_site_voice(ROOT, APP_HOME, key),
            lambda message: (self.reload(), self.note(message)),
        )

    def publish_selected(self):
        try:
            article = self.selected()
            key = self.current
            local = self.manifest.get("entries", {}).get(key)
            git_sync.assert_audio_valid(ROOT, key, local)
            if not messagebox.askyesno(
                "Seçili sesi web sitesinde yayımla",
                article["title"][:180] +
                "\n\nBu yerel MP3 GitHub'a gönderilecek. Web sitesi dağıtımı "
                "tamamlanınca bu ses oynatılacak. Diğer yerel yeni MP3'ler gönderilmeyecek.\n\nDevam?"
            ):
                return
        except (RuntimeError, ValueError) as error:
            messagebox.showerror("Yayımlanacak ses yok", str(error))
            return

        def work():
            msg = git_sync.publish(ROOT, APP_HOME, selected_key=key)
            return msg, git_sync.remote_manifest(ROOT)

        def done(data):
            msg, github = data
            self.github_manifest = github
            self.reload()
            self.note(msg + " Sitedeki yeni sürüm biraz sonra Web yenile ile görünür.")
        self.task("Seçili MP3 GitHub'a gönderiliyor...", work, done)

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

    def generate_checked(self):
        """Produce only the selected article titles, in safe eight-title groups."""
        keys = tuple(self.table.selection())
        if not keys:
            messagebox.showinfo("Başlık seçin", "Önce soldaki listeden bir veya birkaç makale seçin.")
            return
        if not messagebox.askyesno(
            "Seçilen başlıkları üret",
            f"{len(keys)} başlık seçildi. Eksik veya yenilenmesi gereken MP3'ler üretilip "
            "yerel arşive kaydedilecek.\n\nWeb sitesindeki sesler değiştirilmez. Devam?"
        ):
            return

        def work():
            articles = engine.load_sheet()
            by_key = engine.catalog(articles)
            candidates = [key for key in keys if key in by_key]
            count = 0
            tts = None
            try:
                while candidates and not self.stop_event.is_set():
                    manifest = engine.load_manifest()
                    engine.BATCH_SIZE = 8
                    plan = engine.plan_updates(articles, manifest, datetime.now(timezone.utc))
                    due = [k for k in candidates if not engine.fresh(
                        manifest["entries"].get(k), by_key[k], datetime.now(timezone.utc)
                    )]
                    selected = due[:8]
                    if not selected:
                        break
                    plan["selected"] = selected
                    tts = tts or self.get_tts()
                    engine.execute_plan(
                        plan, tts=tts,
                        on_prepared=lambda _k, item: self.events.put(
                            ("log", "Hazırlanan: " + item["title"][:80], None)
                        ),
                    )
                    count += len(selected)
                    candidates = [k for k in candidates if k not in selected]
            finally:
                engine.BATCH_SIZE = MAX_BATCH
            return f"{count} seçili MP3 yerel arşive kaydedildi. Yayına almak için makaleyi seçip gönderin."
        self.task("Seçilen makaleler Ahenk ile hazırlanıyor...", work,
                  lambda msg: (self.reload(), self.note(msg)))

    def batch_generate(self):
        limit = 250 if self.batch.get() == "Tumu" else int(self.batch.get())
        if not messagebox.askyesno(
            "Toplu Ahenk üretimi",
            f"En fazla {limit} ses üretilecek. 8'erli partiler hâlinde yerelde kaydedilecek.\n"
            "Mevcut web MP3'leri değişmeyecek; yayımlama ayrı onay gerektirir. Devam?"
        ):
            return

        def work():
            articles = engine.load_sheet()
            count = 0
            tts = None
            try:
                while count < limit and not self.stop_event.is_set():
                    engine.BATCH_SIZE = min(MAX_BATCH, limit - count)
                    plan = engine.plan_updates(articles, engine.load_manifest(),
                                               datetime.now(timezone.utc))
                    if not plan["has_changes"]:
                        break
                    if plan["selected"]:
                        tts = tts or self.get_tts()
                    engine.execute_plan(
                        plan, tts=tts,
                        on_prepared=lambda _k, item: self.events.put(
                            ("log", "Hazırlanan: " + item["title"][:80], None)
                        ),
                    )
                    count += len(plan["selected"])
                    self.events.put(("log", f"Yerel arşive kaydedilen: {count} MP3", None))
                    if not plan["selected"]:
                        break
            finally:
                engine.BATCH_SIZE = MAX_BATCH
            return (f"{count} MP3 hazırlandı. Soldaki 'Yerel yeni' filtresinden "
                    "gözden geçirip web'de yayımlayabilirsiniz.")
        self.task("Eksik ve eski MP3'ler topluca hazırlanıyor...", work,
                  lambda msg: (self.reload(), self.note(msg)))

    def push(self):
        try:
            dirty = git_sync.changes(ROOT)
        except (RuntimeError, OSError) as error:
            messagebox.showerror("GitHub denetimi", str(error))
            return
        if not dirty:
            messagebox.showinfo("GitHub güncel", "Gönderilecek yerel MP3 veya telaffuz değişikliği yok.")
            return
        if not messagebox.askyesno(
            "Tüm yerel değişiklikleri yayımla",
            f"{len(dirty)} yerel MP3/ayar dosyası GitHub'a gönderilecek.\n\n"
            "Bu işlem çevrimiçi sitede mevcut sesleri değiştirebilir. "
            "Yalnız tek makaleyi yayımlamak için 'Seçili MP3'ü WEB'de yayımla' "
            "düğmesini kullanabilirsiniz.\n\nDevam edilsin mi?"
        ):
            return

        def work():
            msg = git_sync.publish(ROOT, APP_HOME)
            return msg, git_sync.remote_manifest(ROOT)

        def done(data):
            msg, github = data
            self.github_manifest = github
            self.reload()
            self.note(msg + " Web sayfasında görünmesi dağıtımın tamamlanmasına bağlı.")
        self.task("Onaylı yerel MP3'ler GitHub'a gönderiliyor...", work, done)


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
