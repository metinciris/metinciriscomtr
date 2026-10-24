#!/usr/bin/env python3
"""Podcast Ahenk v1.4 - TWO-STEP website audio manager for Windows.

1. Prepare every article that is missing on the LIVE website, reusing local MP3.
2. Publish those locally ready tracks and display GitHub/deployment progress.

All HTTP, Git, TTS and MP3 operations run outside the Tk event loop.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import tempfile
import shutil
import subprocess
import sys
import threading
import time
import uuid
import tkinter as tk
from tkinter import messagebox, ttk
import traceback
import webbrowser

import simple_manager as base
import two_step_audio as flow
import online_audio
import audio_inventory
import git_sync
import audio_playback
import preview_library
import audio_runtime
import gunluk_otomatik as daily_worker
import selected_web_audio
from scripts import render_podcast_audio as engine


HOME = base.HOME
ROOT = base.ROOT
CACHE = base.CACHE
ERROR_LOG = base.ERROR_LOG
BATCH = 8
AUTO_SETTINGS = "acilis_otomatik.json"


def read_auto_setting(home):
    try:
        data = json.loads((Path(home) / AUTO_SETTINGS).read_text(encoding="utf-8-sig"))
    except (OSError, ValueError, TypeError):
        return True
    return data.get("enabled", True) is not False if isinstance(data, dict) else True


def write_auto_setting(home, enabled):
    path = Path(home) / AUTO_SETTINGS
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(dir=path.parent, prefix=".ahenk-auto-", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump({"version": 1, "enabled": bool(enabled)}, stream)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


class TwoStepManager(base.AhenkManager):
    def __init__(self, root):
        self.publish_progress = flow.read_progress(HOME)
        self.web_watch_active = False
        self.web_watch_checks = 0
        self.web_watch_started = 0.0
        self.web_watch_busy = False
        self.fast_player = audio_playback.FastMP3Player()
        self._play_seq = 0
        self._clip_rows = {}
        self._clips_building = False
        self._term_after = None
        self._engine_lock = threading.Lock()
        self._tts_lock = threading.Lock()
        self._engine_ready = False
        self._engine_error = None
        self._auto_start_requested = False
        self._auto_running = False
        super().__init__(root)
        root.protocol("WM_DELETE_WINDOW", self._close_window)
        root.after(450, self._start_engine_automatically)
        if self.publish_progress:
            self._set_progress(self.publish_progress)
        root.after(900, self._resume_watch)

    def _build(self):
        self.root.title("Podcast Ahenk | Seçilen Sesi WEB'e Gönder + Yeni Okuma 1.6")
        self.root.geometry("1320x885")
        self.root.minsize(1010, 715)
        style = ttk.Style(self.root)
        if "clam" in style.theme_names():
            style.theme_use("clam")
        style.configure("TButton", font=("Segoe UI", 9), padding=(9, 6))
        style.configure("Primary.TButton", font=("Segoe UI Semibold", 12),
                        foreground="#ffffff", background="#127d83", padding=(13, 14))
        style.map("Primary.TButton", background=[("active", "#10676b")])
        style.configure("Secondary.TButton", font=("Segoe UI Semibold", 12),
                        foreground="#ffffff", background="#255c87", padding=(13, 14))
        style.map("Secondary.TButton", background=[("active", "#194969")])
        style.configure("Treeview", rowheight=30, font=("Segoe UI", 9))
        style.configure("Treeview.Heading", font=("Segoe UI Semibold", 9))

        header = tk.Frame(self.root, bg="#1b344f", padx=18, pady=10)
        header.pack(fill="x")
        tk.Label(header, text="PODCAST AHENK  ·  WEB SESLERİ",
                 bg="#1b344f", fg="white",
                 font=("Segoe UI Semibold", 17)).pack(anchor="w")
        tk.Label(header, text="Açılışta otomatik hazırla + gönder · WEB'deki mevcut sesler korunur.",
                 bg="#1b344f", fg="#d9e5ef",
                 font=("Segoe UI", 10)).pack(anchor="w", pady=(2, 0))

        operations = ttk.Frame(self.root, padding=(12, 11))
        operations.pack(fill="x")
        operations.columnconfigure(0, weight=1)
        operations.columnconfigure(1, weight=1)
        self.step_one = ttk.Button(
            operations, text="1  WEB'DE EKSİK TÜM SESLERİ HAZIRLA",
            command=self.prepare_web_missing, style="Primary.TButton"
        )
        self.step_one.grid(row=0, column=0, sticky="ew", padx=(0, 7))
        self.step_two = ttk.Button(
            operations, text="2  HAZIR SESLERİ WEB'E YÜKLE",
            command=self.upload_web_missing, style="Secondary.TButton"
        )
        self.step_two.grid(row=0, column=1, sticky="ew", padx=(7, 0))

        auto_controls = ttk.Frame(self.root, padding=(12, 0))
        auto_controls.pack(fill="x")
        self.auto_start_enabled = tk.BooleanVar(value=read_auto_setting(HOME))
        ttk.Checkbutton(
            auto_controls,
            text="Program açılınca WEB'deki eksikleri otomatik hazırla ve gönder",
            variable=self.auto_start_enabled,
            command=self._auto_setting_changed,
        ).pack(side="left")
        self.btn_auto_run = ttk.Button(
            auto_controls, text="↻ Şimdi otomatik tamamla",
            command=self.run_automatic_workflow,
        )
        self.btn_auto_run.pack(side="right")
        self.auto_state = tk.StringVar(value="Otomatik mod: hazır.")
        ttk.Label(auto_controls, textvariable=self.auto_state,
                  foreground="#346781").pack(side="right", padx=(0, 14))

        status_box = ttk.Frame(self.root, padding=(13, 4))
        status_box.pack(fill="x")
        self.stage_description = tk.StringVar(value="Hazır. Web'deki eksikleri denetlemek için 1. adıma basın.")
        self.stage_counters = tk.StringVar(value="Hazırlama: —    |    GitHub: —    |    WEB yayını: —")
        ttk.Label(status_box, textvariable=self.stage_description,
                  font=("Segoe UI Semibold", 10), wraplength=1100).pack(anchor="w")
        ttk.Label(status_box, textvariable=self.stage_counters,
                  font=("Segoe UI", 9)).pack(anchor="w", pady=(4, 5))
        bars = ttk.Frame(status_box)
        bars.pack(fill="x", pady=(0, 8))
        bars.columnconfigure(0, weight=1)
        bars.columnconfigure(1, weight=1)
        ttk.Label(bars, text="Hazırlama / GitHub gönderimi",
                  foreground="#506c82").grid(row=0, column=0, sticky="w")
        ttk.Label(bars, text="WEB'de doğrulanan yayın",
                  foreground="#506c82").grid(row=0, column=1, sticky="w", padx=(13, 0))
        self.stage_bar = ttk.Progressbar(bars, maximum=100, mode="determinate")
        self.stage_bar.grid(row=1, column=0, sticky="ew", pady=(4, 0))
        self.web_progress_bar = ttk.Progressbar(bars, maximum=100, mode="determinate")
        self.web_progress_bar.grid(row=1, column=1, sticky="ew", padx=(13, 0), pady=(4, 0))
        self.stage_bar["value"] = 0
        self.web_progress_bar["value"] = 0

        event_row = ttk.Frame(status_box)
        event_row.pack(fill="x", pady=(2, 5))
        self.auto_events = tk.Text(
            event_row, height=3, wrap="word", background="#f3f8fb",
            foreground="#324d63", relief="flat", font=("Segoe UI", 9),
            padx=8, pady=4, state="disabled",
        )
        self.auto_events.pack(side="left", fill="x", expand=True)
        event_scroll = ttk.Scrollbar(event_row, command=self.auto_events.yview)
        event_scroll.pack(side="right", fill="y")
        self.auto_events.configure(yscrollcommand=event_scroll.set)
        self._append_auto_event("Otomatik mod hazır. Mevcut sesler korunacak.")

        summary = ttk.Frame(self.root, padding=(12, 2))
        summary.pack(fill="x")
        self.count_labels = {}
        for key, label in [
            ("all", "Toplam"), ("web", "WEB'de var"),
            ("web_missing", "WEB'de eksik"), ("pc", "PC'de hazır"),
            ("pc_pending", "PC hazır / WEB'de yok"),
            ("pc_missing", "PC'de yok")
        ]:
            self.count_labels[key] = tk.StringVar(value=label + ": —")
            ttk.Label(summary, textvariable=self.count_labels[key],
                      font=("Segoe UI Semibold", 9)).pack(side="left", padx=(0, 12))
        # The shared list renderer still updates publish_ready. Keep its
        # backing variable, but prioritize the clearer PC/WEB distinction
        # instead of showing a redundant eighth summary number.
        self.count_labels["publish_ready"] = tk.StringVar(value="")

        waiting_line = ttk.Frame(self.root, padding=(12, 5))
        waiting_line.pack(fill="x")
        self.pending_notice = tk.StringVar(
            value="PC'de hazırlanmış ancak WEB'de görünmeyen MP3'ler denetleniyor…"
        )
        ttk.Label(waiting_line, textvariable=self.pending_notice,
                  font=("Segoe UI Semibold", 9)).pack(side="left", fill="x", expand=True)
        self.btn_pending = ttk.Button(
            waiting_line, text="Hazır, WEB'de olmayan sesleri göster",
            command=self.show_pc_pending
        )
        self.btn_pending.pack(side="right")

        toolbar = ttk.Frame(self.root, padding=(12, 6))
        toolbar.pack(fill="x")
        for label, method in [
            ("↻ WEB durumunu kontrol et", self.refresh_web),
            ("📁 Yerel MP3", self.open_audio_folder),
            ("📝 Log / Hata", self.open_log),
            ("♫ Son üretilenler", self.open_recent_recordings),
            ("📖 Terim sözlüğü", self.open_dictionary),
            ("🌐 Web sitesi", lambda: webbrowser.open("https://metinciris.com.tr/podcast")),
        ]:
            ttk.Button(toolbar, text=label, command=method).pack(side="left", padx=(0, 6))
        ttk.Button(toolbar, text="Durdur (parti sonrası)",
                   command=self._request_stop).pack(side="right")
        self.engine_display = tk.StringVar(value="Ses motoru: açılışta kontrol ediliyor…")
        ttk.Label(toolbar, textvariable=self.engine_display,
                  foreground="#3b6477").pack(side="right", padx=(0, 12))

        filter_bar = ttk.Frame(self.root, padding=(12, 4))
        filter_bar.pack(fill="x")
        ttk.Label(filter_bar, text="GÖSTER:", font=("Segoe UI Semibold", 9)).pack(side="left")
        for title, value in [
            ("WEB'de eksik", "web_missing"),
            ("Üretildi, WEB'de yok", "pc_pending"),
            ("Hepsi", "all"), ("PC'de hazır", "pc"),
            ("PC'de eksik", "pc_missing"),
        ]:
            ttk.Radiobutton(filter_bar, text=title, variable=self.filter,
                            value=value, command=self._render).pack(side="left", padx=(9, 3))
        self.filter.set("web_missing")
        ttk.Label(filter_bar, text="Dergi:", font=("Segoe UI", 9)).pack(side="left", padx=(16, 4))
        self.journals = ttk.Combobox(filter_bar, width=20,
                                     textvariable=self.journal_filter, state="readonly")
        self.journals.pack(side="left")
        self.journals.bind("<<ComboboxSelected>>", lambda _e: self._render())

        panes = ttk.Panedwindow(self.root, orient="horizontal")
        panes.pack(fill="both", expand=True, padx=12, pady=(4, 9))
        left, right = ttk.Frame(panes, padding=6), ttk.Frame(panes, padding=6)
        panes.add(left, weight=6)
        panes.add(right, weight=5)
        ttk.Label(left, text="MAKALELER  ·  Web ve PC ses durumu",
                  font=("Segoe UI Semibold", 10)).pack(anchor="w", pady=(0, 7))

        table_holder = ttk.Frame(left)
        table_holder.pack(fill="both", expand=True)
        self.table = ttk.Treeview(
            table_holder, columns=("check", "web", "pc", "journal", "title"),
            show="headings", selectmode="browse"
        )
        self.table["displaycolumns"] = ("web", "pc", "journal", "title")
        for key, label, size in [
            ("check", "Seç", 40), ("web", "WEB", 78), ("pc", "PC", 90),
            ("journal", "Dergi", 150), ("title", "Makale başlığı", 340)
        ]:
            self.table.heading(key, text=label)
            self.table.column(key, width=size, minwidth=size, stretch=key == "title")
        self.table.tag_configure("local", foreground="#14734b")
        self.table.tag_configure("only_web", foreground="#346d9e")
        self.table.tag_configure("missing", foreground="#708090")
        scrollbar = ttk.Scrollbar(table_holder, command=self.table.yview)
        self.table.configure(yscrollcommand=scrollbar.set)
        self.table.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        self.table.bind("<<TreeviewSelect>>", self._select_article)
        self.selected_count = tk.StringVar(value="")
        ttk.Label(left, text="Sitede zaten olan sesler 2. adımda tekrar gönderilmez.",
                  foreground="#53697a").pack(anchor="w", pady=(8, 0))

        ttk.Label(right, text="SEÇİLİ MAKALE · İSTEĞE BAĞLI DİNLEME / DÜZELTME",
                  font=("Segoe UI Semibold", 10)).pack(anchor="w")
        self.article_name = tk.StringVar(value="Bir başlık seçin.")
        ttk.Label(right, textvariable=self.article_name,
                  wraplength=475).pack(anchor="w", pady=(6, 6))

        # These are the two per-article actions users need immediately. In
        # v1.5 they were BELOW the editor and disappeared on 900px displays.
        selected_actions = ttk.Frame(right)
        selected_actions.pack(fill="x", pady=(2, 6))
        selected_actions.columnconfigure(0, weight=1)
        selected_actions.columnconfigure(1, weight=1)
        self.btn_preview = ttk.Button(
            selected_actions, text="🎙 YENİ SES ÜRET",
            command=self.preview_sound, style="Primary.TButton"
        )
        self.btn_preview.grid(row=0, column=0, sticky="ew", padx=(0, 5))
        self.btn_publish_one = ttk.Button(
            selected_actions, text="⬆ SEÇİLİ SESİ WEB'E GÖNDER",
            command=self.publish_current, state="disabled",
            style="Secondary.TButton"
        )
        self.btn_publish_one.grid(row=0, column=1, sticky="ew", padx=(5, 0))
        self.web_choice_label = tk.StringVar(
            value="WEB'e göndermek için aşağıdaki PC ses listesinden bir kayıt seçin."
        )
        ttk.Label(
            right, textvariable=self.web_choice_label,
            foreground="#49677e", wraplength=490
        ).pack(anchor="w", pady=(0, 6))
        clips = ttk.Frame(right)
        clips.pack(fill="x")
        clips.columnconfigure(0, weight=1)
        clips.columnconfigure(1, weight=1)
        web_box = tk.Frame(clips, bg="#eaf3fa", padx=9, pady=8)
        pc_box = tk.Frame(clips, bg="#e6f5ed", padx=9, pady=8)
        web_box.grid(row=0, column=0, sticky="nsew", padx=(0, 5))
        pc_box.grid(row=0, column=1, sticky="nsew", padx=(5, 0))
        self.web_radio = tk.Radiobutton(
            web_box, text="WEB'deki ses", variable=self.choice, value="web",
            command=self._choice_changed, bg="#eaf3fa",
            activebackground="#eaf3fa", state="disabled"
        )
        self.web_radio.pack(anchor="w")
        self.web_status = tk.StringVar(value="WEB kontrol bekleniyor.")
        tk.Label(web_box, textvariable=self.web_status, bg="#eaf3fa",
                 wraplength=190, height=3, justify="left").pack(fill="x")
        self.btn_listen_web = ttk.Button(
            web_box, text="▶ WEB dinle", command=self.listen_web, state="disabled"
        )
        self.btn_listen_web.pack(fill="x")
        self.pc_radio = tk.Radiobutton(
            pc_box, text="PC'deki ses", variable=self.choice, value="pc",
            command=self._choice_changed, bg="#e6f5ed",
            activebackground="#e6f5ed", state="disabled"
        )
        self.pc_radio.pack(anchor="w")
        self.pc_status = tk.StringVar(value="PC kontrol bekleniyor.")
        tk.Label(pc_box, textvariable=self.pc_status, bg="#e6f5ed",
                 wraplength=190, height=3, justify="left").pack(fill="x")
        self.btn_listen_pc = ttk.Button(
            pc_box, text="▶ PC dinle", command=self.listen_pc, state="disabled"
        )
        self.btn_listen_pc.pack(fill="x")

        clips_list_box = ttk.LabelFrame(
            right, text="BU MAKALENİN PC SESLERİ · Kabul edilen + yeni denemeler",
            padding=(8, 6)
        )
        clips_list_box.pack(fill="x", pady=(9, 0))
        list_row = ttk.Frame(clips_list_box)
        list_row.pack(fill="x")
        self.clip_tree = ttk.Treeview(
            list_row, columns=("kind", "time", "size"),
            show="headings", selectmode="browse", height=3
        )
        for column, heading, width in [
            ("kind", "Ses kaydı", 190),
            ("time", "Oluşturulma", 130),
            ("size", "Boyut", 65),
        ]:
            self.clip_tree.heading(column, text=heading)
            self.clip_tree.column(
                column, width=width, minwidth=45,
                stretch=(column == "kind")
            )
        self.clip_tree.pack(side="left", fill="x", expand=True)
        clips_scroll = ttk.Scrollbar(
            list_row, orient="vertical", command=self.clip_tree.yview
        )
        clips_scroll.pack(side="right", fill="y")
        self.clip_tree.configure(yscrollcommand=clips_scroll.set)
        self.clip_tree.bind("<<TreeviewSelect>>", self._choose_pc_recording)
        self.clip_tree.bind("<Double-1>", self.listen_selected_recording)
        clip_buttons = ttk.Frame(clips_list_box)
        clip_buttons.pack(fill="x", pady=(5, 0))
        self.btn_listen_recording = ttk.Button(
            clip_buttons, text="▶ Seçili sesi dinle",
            command=self.listen_selected_recording, state="disabled"
        )
        self.btn_listen_recording.pack(side="left", padx=(0, 5))
        self.btn_load_recording = ttk.Button(
            clip_buttons, text="Denemenin metnini aç",
            command=self.load_recording_profile, state="disabled"
        )
        self.btn_load_recording.pack(side="left", padx=(0, 5))
        ttk.Button(
            clip_buttons, text="■ Durdur", command=self.stop_audio
        ).pack(side="left", padx=(0, 5))
        ttk.Button(
            clip_buttons, text="Deneme klasörü",
            command=lambda: self._open_folder(base.PREVIEWS)
        ).pack(side="right")

        accepted_actions = ttk.Frame(clips_list_box)
        accepted_actions.pack(fill="x", pady=(6, 0))
        self.btn_accept = ttk.Button(
            accepted_actions, text="✓ Seçili denemeyi PC'ye kabul et",
            command=self.accept_sound, state="disabled"
        )
        self.btn_accept.pack(side="left", padx=(0, 7))
        self.btn_replay = ttk.Button(
            accepted_actions, text="▶ Denemeyi tekrar dinle",
            command=self.replay_preview, state="disabled"
        )
        self.btn_replay.pack(side="left")
        self.play_feedback = tk.StringVar(value="Dinlemek istediğiniz sesi seçin.")
        ttk.Label(
            clips_list_box, textvariable=self.play_feedback,
            foreground="#52718c", wraplength=480
        ).pack(anchor="w", pady=(5, 0))

        dictionary = ttk.LabelFrame(
            right, text="BU OKUMADA GEÇEN TERİMLER", padding=(9, 5)
        )
        dictionary.pack(fill="x", pady=(9, 0))
        self.dictionary_summary = tk.StringVar(
            value="Telaffuz kuralları listeleniyor…"
        )
        ttk.Label(dictionary, textvariable=self.dictionary_summary,
                  wraplength=375, foreground="#37546c").pack(
                      side="left", fill="x", expand=True
                  )
        self.btn_dictionary = ttk.Button(
            dictionary, text="Gör / düzenle", command=self.open_dictionary
        )
        self.btn_dictionary.pack(side="right", padx=(7, 0))

        details = ttk.LabelFrame(right, text="Dilerseniz okuma metnini düzeltin", padding=9)
        details.pack(fill="both", expand=True, pady=(9, 0))
        self.editor = tk.Text(details, wrap="word", undo=True, height=4,
                              background="#fbfcff", font=("Segoe UI", 9), padx=7, pady=6)
        self.editor.pack(fill="both", expand=True)
        self.editor.bind("<KeyRelease>", self._on_editor_change, add=True)
        self.editor.bind("<<Paste>>", self._on_editor_change, add=True)
        self.editor.bind("<<Cut>>", self._on_editor_change, add=True)
        options = ttk.Frame(details)
        options.pack(fill="x", pady=(6, 0))
        ttk.Label(options, text="Hız").pack(side="left")
        self.speed = tk.StringVar(value="1.00")
        ttk.Combobox(options, width=6, state="readonly", textvariable=self.speed,
                     values=["0.80", "0.85", "0.90", "0.95", "1.00",
                             "1.05", "1.10", "1.15", "1.20"]).pack(side="left", padx=6)
        ttk.Button(options, text="Terim sözlüğü", command=self.open_dictionary).pack(side="left")
        ttk.Button(options, text="Metni kaydet", command=self.save_text).pack(side="right")
        self.preview_feedback = tk.StringVar(
            value="Yeni ses üretme düğmesi seçili makalenin hemen üstünde. "
                  "Üretilen MP3 aşağıdaki PC sesleri listesine eklenir."
        )
        ttk.Label(details, textvariable=self.preview_feedback,
                  wraplength=480, foreground="#476579").pack(anchor="w", pady=(7, 0))
        self.choice_label = tk.StringVar(value="")

        bottom = ttk.Frame(self.root, padding=(12, 3))
        bottom.pack(fill="x")
        self.progress = ttk.Progressbar(bottom, mode="indeterminate", length=135)
        self.progress.pack(side="left", padx=(0, 10))
        ttk.Label(bottom, textvariable=self.status).pack(side="left", fill="x", expand=True)

    def _append_auto_event(self, message):
        """UI-thread-only event log with a visible rolling history."""
        stamp = datetime.now().strftime("%H:%M:%S")
        self.auto_events.configure(state="normal")
        self.auto_events.insert("end", f"{stamp}  {message}\n")
        lines = int(self.auto_events.index("end-1c").split(".")[0])
        if lines > 100:
            self.auto_events.delete("1.0", f"{lines - 85}.0")
        self.auto_events.see("end")
        self.auto_events.configure(state="disabled")

    def _auto_setting_changed(self):
        enabled = self.auto_start_enabled.get()
        try:
            write_auto_setting(HOME, enabled)
        except OSError as exc:
            self._note("Otomatik açılış tercihi kaydedilemedi: " + str(exc))
            self._append_auto_event("Ayar kaydedilemedi: " + str(exc))
            return
        if not enabled:
            self._auto_start_requested = False
        self.auto_state.set("Açılışta otomatik açık." if enabled else "Açılışta otomatik kapalı.")
        self._append_auto_event(
            "Sonraki açılışta otomatik işlem " +
            ("açık." if enabled else "kapalı.")
        )

    def _request_stop(self):
        self.stopping.set()
        self._append_auto_event("Durdurma istendi; işlem sekizli partiden sonra duracak.")

    def enable_startup_autorun(self):
        """Called only by main() so UI unit tests stay fully manual."""
        if not self.auto_start_enabled.get():
            self.auto_state.set("Otomatik açılış kapalı. İstenirse elle başlatın.")
            return
        self._auto_start_requested = True
        self.auto_state.set("Açılışta otomatik kontrol başlayacak.")
        self.root.after(950, self._try_launch_autorun)

    def _startup(self):
        if self._auto_start_requested:
            self._note("Otomatik WEB ve makale kontrolü başlayacak.")
            return
        return super()._startup()

    def _try_launch_autorun(self):
        if not self._auto_start_requested or not self.auto_start_enabled.get():
            return
        if self.busy:
            self.root.after(1100, self._try_launch_autorun)
            return
        self._auto_start_requested = False
        self.run_automatic_workflow()

    def _auto_progress(self, event):
        phase = event.get("phase", "")
        current = int(event.get("current") or 0)
        total = int(event.get("total") or 0)
        message = str(event.get("message") or "")
        previous = float(self.stage_bar["value"])
        if phase == "generating":
            percent = 16 + 64 * current / max(1, total)
        elif phase == "engine":
            percent = 14
        elif phase == "planned":
            percent = 12
        elif phase == "sync":
            percent = 84 if previous >= 20 else 8
        elif phase == "uploading":
            percent = 88
        elif phase in ("uploaded", "complete", "waiting"):
            percent = 100
        elif phase == "stopping":
            percent = min(83, previous)
        else:
            percent = 5
        counter = None
        if phase in ("generating", "engine", "stopping"):
            counter = f"Yeni MP3: {current}/{total} · GitHub yüklemesi sırada"
        elif phase == "uploading":
            counter = f"GitHub'a gönderiliyor: {total} MP3 · WEB yayını sonra doğrulanacak"
        self._stage("OTOMATİK · " + message, percent, counter)
        self.auto_state.set("Çalışıyor · " + phase)
        self._append_auto_event(message)

    def run_automatic_workflow(self):
        """Complete only genuinely missing audio, with one GitHub push."""
        if self.busy or self._auto_running:
            self._append_auto_event("Başka işlem sürüyor; ikinci iş başlatılmadı.")
            return
        self._auto_running = True
        self.btn_auto_run.configure(state="disabled")
        self.web_progress_bar["value"] = 0
        self._stage("OTOMATİK · WEB ve GitHub sesleri kontrol ediliyor…", 0,
                    "Eksik yoksa Ahenk modeli yüklenmeyecek.")
        self._append_auto_event("Eksik sesleri hazırlama ve WEB'e gönderme başladı.")
        self.auto_state.set("Otomatik işlem çalışıyor.")

        def on_progress(event):
            # Worker may only emit events, never interact with Tk directly.
            self.events.put(("done", event, self._auto_progress))

        def work():
            try:
                return True, daily_worker.run_once(
                    progress=on_progress, stopping=self.stopping
                )
            except Exception as exc:
                return False, (str(exc), traceback.format_exc())

        def done(payload):
            self._auto_running = False
            self.btn_auto_run.configure(state="normal")
            ok, data = payload
            if not ok:
                error, stack = data
                with ERROR_LOG.open("a", encoding="utf-8") as file:
                    file.write("\n" + datetime.now().isoformat() + "\n" + stack + "\n")
                self.auto_state.set("İşlem başarısız · Log / Hata")
                self._stage("OTOMATİK HATA · " + error[:160], None,
                            "Yerel MP3'ler korundu · Tekrar deneyebilirsiniz")
                self._append_auto_event("HATA: " + error)
                self._note("Otomatik işlem tamamlanamadı: " + error)
                return
            self._auto_completed(data)

        self._task("WEB'deki eksikler otomatik tamamlanıyor...", work, done)

    def _auto_completed(self, result):
        articles = result.get("_articles")
        live = result.get("_website")
        if isinstance(articles, list):
            self.articles = articles
            CACHE.parent.mkdir(parents=True, exist_ok=True)
            fd, temp = tempfile.mkstemp(prefix=".ahenk-auto-articles-", dir=CACHE.parent)
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as file:
                    json.dump(articles, file, ensure_ascii=False)
                    file.flush()
                    os.fsync(file.fileno())
                os.replace(temp, CACHE)
            finally:
                if os.path.exists(temp):
                    os.unlink(temp)
        if isinstance(live, dict):
            self.web_manifest = live
            self.web_confirmed = True
            online_audio.cache_manifest(HOME, live)
        self._rebuild()
        produced = int(result.get("generated", 0))
        uploaded = int(result.get("uploaded", 0))
        skipped = len(result.get("skipped", []))
        phase = result.get("status", "")
        self.auto_state.set("Tamamlandı" if phase == "complete" else "İşlem sonucu hazır")
        summary = (
            f"{produced} yeni MP3 · GitHub'a {uploaded} gönderildi · "
            f"Kontrol gereken: {skipped} · "
            f"WEB'de mevcut: {result.get('listed', 0) - result.get('web_missing', 0)}"
        )
        if result.get("stopped"):
            summary = "DURDURULDU · " + summary
        self._stage("OTOMATİK SONUÇ · " + summary, 100,
                    f"Yeni: {produced} | GitHub: {uploaded} | Kontrol: {skipped}")
        if phase == "complete":
            # WEB bar should not remain at zero when everything is live.
            self.web_progress_bar["value"] = 100
        elif not uploaded:
            listed = int(result.get("listed", 0))
            visible = listed - int(result.get("web_missing", 0))
            self.web_progress_bar["value"] = 100 * visible / max(1, listed)
        self._append_auto_event("SONUÇ: " + summary)
        self._note(summary)

        keys = result.get("uploaded_keys", [])
        if keys:
            local_entries = engine.load_manifest().get("entries", {})
            expected = {key: local_entries[key] for key in keys if key in local_entries}
            if len(expected) != len(keys):
                self._append_auto_event(
                    "Yükleme kontrolü: Yerel kayıt sayısı farklı; dosyaları gözden geçirin."
                )
                return
            state = flow.new_progress(keys)
            state["github_sent"] = list(keys)
            state["expected"] = expected
            state["website_confirmed"] = flow.verified_on_web(state, self.web_manifest)
            state["phase"] = (
                "tamamlandi" if len(state["website_confirmed"]) == len(keys)
                else "site_yayini_bekleniyor"
            )
            flow.save_progress(HOME, state)
            self.publish_progress = state
            self._set_progress(state)
            if state["phase"] != "tamamlandi":
                self._append_auto_event("GitHub tamamlandı · WEB yayını izleniyor.")
                self._start_watch()
        elif phase == "waiting_for_deploy":
            self._append_auto_event("GitHub hazır; WEB dağıtımı bekleniyor.")
            self._resume_watch()

    def _ensure_engine_dependencies(self):
        """Run exactly one setup job even if first TTS click overlaps startup."""
        with self._engine_lock:
            if self._engine_ready:
                return
            audio_runtime.ensure_runtime(ROOT, report=self._worker_log)
            self._engine_ready = True
            self._engine_error = None

    def _tts(self):
        """Initialize the Ahenk model once, using the auto-installed runtime."""
        with self._tts_lock:
            self._ensure_engine_dependencies()
            return super()._tts()

    def _start_engine_automatically(self):
        """Install missing packages on startup without confirmation or Tk stalls.

        Playing existing MP3s and publishing ready audio still work during
        first-time setup. No system-wide pip or administrator rights needed.
        """
        if self._auto_start_requested:
            self.engine_display.set("Ahenk: yalnız eksik ses varsa hazırlanacak.")
            return
        self.engine_display.set("Ses motoru: eksikler otomatik denetleniyor…")

        def work():
            try:
                self._ensure_engine_dependencies()
                result = ("ready", "Ses motoru hazır ✓")
            except Exception as exc:
                self._engine_error = str(exc)
                result = ("error", "Ses motoru kurulamadı · Log / Hata'ya bakın")
                self._worker_log("Ahenk otomatik kurulum hatası: " + str(exc))
                with ERROR_LOG.open("a", encoding="utf-8") as handle:
                    handle.write(datetime.now().isoformat() + "\n" +
                                 traceback.format_exc() + "\n")
            self.events.put(("done", result, self._engine_setup_finished))

        threading.Thread(target=work, daemon=True).start()

    def _engine_setup_finished(self, result):
        _state, label = result
        self.engine_display.set(label)
        if _state == "ready":
            self._note("Ahenk ses motoru otomatik kontrol edildi ve hazır.")

    def open_recent_recordings(self):
        """All recent draft MP3s; double-click jumps to the chosen article."""
        recordings = [
            (stamp, key, file)
            for stamp, key, file in preview_library.recent_previews(
                base.PREVIEWS, limit=45
            ) if key in self.catalog
        ]
        popup = tk.Toplevel(self.root)
        popup.title("Ahenk · Son üretilen ses denemeleri")
        popup.geometry("850x480")
        pane = ttk.Frame(popup, padding=12)
        pane.pack(fill="both", expand=True)
        ttk.Label(
            pane, text=f"Son üretilen {len(recordings)} MP3 denemesi",
            font=("Segoe UI Semibold", 11)
        ).pack(anchor="w", pady=(0, 7))
        ttk.Label(
            pane, text="Bu kayıtlar denemedir. Onay verilmedikçe PC'nin kabul "
                       "edilmiş sesi veya WEB yayını değişmez."
        ).pack(anchor="w", pady=(0, 8))
        table = ttk.Treeview(
            pane, columns=("when", "title", "journal"),
            show="headings", height=12, selectmode="browse"
        )
        for name, label, width in [
            ("when", "Oluşturulma", 143),
            ("title", "Makale", 480),
            ("journal", "Dergi", 160),
        ]:
            table.heading(name, text=label)
            table.column(name, width=width, minwidth=85,
                         stretch=(name == "title"))
        table.pack(fill="both", expand=True)
        mapping = {}
        for idx, (stamp, key, file) in enumerate(recordings):
            candidate = self.catalog[key]
            iid = str(idx)
            mapping[iid] = (key, file)
            table.insert(
                "", "end", iid=iid,
                values=(
                    datetime.fromtimestamp(stamp).strftime("%d.%m %H:%M:%S"),
                    candidate["title"], candidate["journal"]
                )
            )
        if recordings:
            table.selection_set("0")

        def choose(_event=None):
            selected = table.selection()
            if not selected:
                return
            key, file = mapping[selected[0]]
            self.filter.set("all")
            self.journal_filter.set("Tüm dergiler")
            self._render()
            if key in self.table.get_children():
                self.table.selection_set(key)
                self.table.focus(key)
                self.table.see(key)
                self._select_article()
                self._refresh_recordings(select_preview=file)
            popup.destroy()

        table.bind("<Double-1>", choose)
        ttk.Button(
            pane, text="Seçili makaleyi ve ses listesini aç", command=choose
        ).pack(anchor="e", pady=(8, 0))

    def _close_window(self):
        if self._auto_running:
            messagebox.showinfo(
                "Otomatik işlem sürüyor",
                "Sesleri korumak için işlem sırasında kapanış engellendi. "
                "Önce Durdur (parti sonrası) düğmesini kullanın."
            )
            return
        self._play_seq += 1
        try:
            self.fast_player.stop()
        finally:
            self.root.destroy()

    def _audio_play(self, path_or_loader, label):
        """Start play immediately from Tk; slow codecs/downloads work off-thread.

        A new click cancels a previous pending WEB download's audio *playback*
        even though the downloaded cache can still finish in the background.
        This is entirely independent of the GitHub/TTS busy flag.
        """
        self._play_seq += 1
        request = self._play_seq
        self.play_feedback.set(label + ": açılıyor…")

        def work():
            try:
                source = (
                    path_or_loader() if callable(path_or_loader)
                    else path_or_loader
                )
                if request != self._play_seq:
                    return
                mode = self.fast_player.play(source)
                self.events.put((
                    "done", (request, label + " çalıyor · " + mode),
                    self._audio_result,
                ))
            except Exception as exc:
                self.events.put((
                    "done", (request, label + " açılamadı: " + str(exc)),
                    self._audio_result,
                ))
        threading.Thread(target=work, daemon=True).start()

    def _audio_result(self, result):
        request, status = result
        if request != self._play_seq:
            return
        self.play_feedback.set(status)
        if "açılamadı:" in status:
            self._note(status)

    def stop_audio(self):
        self._play_seq += 1
        self.play_feedback.set("Ses durduruluyor…")

        def work():
            self.fast_player.stop()
            self.events.put(("done", "Ses durduruldu.", self.play_feedback.set))
        threading.Thread(target=work, daemon=True).start()

    def listen_pc(self):
        """Play approved PC MP3 without Windows Media Player startup blocking."""
        key = self.current
        if key not in self.rows or not self.rows[key]["pc"]:
            self.play_feedback.set("Seçili makalenin PC'de kabul edilmiş MP3'ü yok.")
            return
        self._audio_play(
            ROOT / "public" / "podcast-audio" / (key + ".mp3"),
            "PC'de kabul edilen ses"
        )

    def listen_web(self):
        """Use already cached WEB MP3; only uncached clips download in a thread."""
        key = self.current
        row = self.rows.get(key)
        if not row or not row.get("web"):
            self.play_feedback.set("Bu makale henüz WEB'de yayımlanmamış.")
            return
        entry = row.get("web_entry")
        if not isinstance(entry, dict):
            self.play_feedback.set("WEB'deki ses bilgisi bulunamadı.")
            return
        manifest = {"version": 1, "entries": {key: entry}}

        def load():
            # Check stamp only, never fetch the entire WEB manifest for each
            # audio click. The upper 'WEB durumunu kontrol et' is authoritative.
            return online_audio.download_clip(HOME, key, manifest)

        cached = online_audio.web_clip_path(HOME, key)
        stamp = cached.with_suffix(".entry.json")
        if cached.is_file() and cached.stat().st_size > 1024:
            try:
                if json.loads(stamp.read_text(encoding="utf-8")) == entry:
                    self._audio_play(cached, "WEB sesi (önbellek)")
                    return
            except (OSError, ValueError):
                pass
        self.play_feedback.set("WEB MP3 indiriliyor; makale seçmeye devam edebilirsiniz…")
        self._audio_play(load, "WEB sesi")

    def _refresh_recordings(self, select_preview=None):
        """Show accepted audio plus newly generated trials for this article."""
        if not hasattr(self, "clip_tree") or self._clips_building:
            return
        key = self.current
        prior = self.clip_tree.selection()
        prior = prior[0] if prior else None
        self._clips_building = True
        try:
            self.clip_tree.delete(*self.clip_tree.get_children())
            self._clip_rows = {}
            if key not in self.rows:
                self.btn_listen_recording.configure(state="disabled")
                self.btn_load_recording.configure(state="disabled")
                return
            approved = self.rows[key].get("pc")
            if approved:
                audio = ROOT / "public" / "podcast-audio" / (key + ".mp3")
                try:
                    audio_stats = audio.stat()
                except OSError:
                    audio_stats = None
                if audio_stats is not None:
                    date = datetime.fromtimestamp(audio_stats.st_mtime).strftime(
                        "%d.%m %H:%M:%S"
                    )
                    self._clip_rows["accepted"] = {
                        "kind": "accepted", "path": audio, "record": None,
                    }
                    self.clip_tree.insert(
                        "", "end", iid="accepted",
                        values=("✓ PC · kabul edilmiş MP3", date,
                                f"{audio_stats.st_size / 1024:.0f} KB")
                    )
            for index, item in enumerate(
                preview_library.previews_for_article(base.PREVIEWS, key, limit=14)
            ):
                entry_id = "trial:" + str(index)
                self._clip_rows[entry_id] = {
                    "kind": "trial", "path": item["path"],
                    "record": item["record"],
                }
                label = ("★ Yeni deneme" if index == 0 else f"Deneme #{index + 1}")
                if not item["record"]:
                    label += " (eski)"
                self.clip_tree.insert(
                    "", "end", iid=entry_id,
                    values=(label, item["created"],
                            f"{item['bytes'] / 1024:.0f} KB")
                )
            chosen = None
            if select_preview:
                chosen = next(
                    (iid for iid, data in self._clip_rows.items()
                     if data["path"] == Path(select_preview)), None
                )
            if chosen is None and self.preview is not None:
                chosen = next(
                    (iid for iid, data in self._clip_rows.items()
                     if data["path"] == Path(self.preview.get("path", ""))), None
                )
            if chosen is None and self.preview is not None and prior in self._clip_rows:
                chosen = prior
            if chosen is None:
                chosen = "accepted" if "accepted" in self._clip_rows else (
                    next(iter(self._clip_rows), None)
                )
            if chosen:
                self.clip_tree.selection_set(chosen)
                self.clip_tree.focus(chosen)
                self.clip_tree.see(chosen)
            self.btn_listen_recording.configure(
                state="normal" if chosen else "disabled"
            )
        finally:
            self._clips_building = False
        self._choose_pc_recording()

    def _selected_recording(self):
        if not hasattr(self, "clip_tree"):
            return None
        selection = self.clip_tree.selection()
        return self._clip_rows.get(selection[0]) if selection else None

    def _choice_changed(self):
        """Mini PC-audio list is the explicit source of a WEB upload."""
        if not hasattr(self, "btn_publish_one"):
            return
        row = self._selected_recording()
        if self.choice.get() == "web":
            self.btn_publish_one.configure(state="disabled")
            self.web_choice_label.set(
                "WEB'deki ses seçildi; mevcut WEB yayını korunacak. "
                "Başka sürüm yüklemek için aşağıdaki PC listesinden seçim yapın."
            )
            return
        if self.current not in self.rows or row is None:
            self.btn_publish_one.configure(state="disabled")
            self.web_choice_label.set(
                "WEB'e göndermek için aşağıdaki PC ses listesinden bir kayıt seçin."
            )
            return
        kind = row["kind"]
        if kind == "accepted" and self.rows[self.current]["pc"]:
            self.web_choice_label.set(
                "WEB için seçili: ✓ PC'de kabul edilmiş MP3. "
                "Gerekirse WEB'deki mevcut ses değiştirilecek."
            )
            self.btn_publish_one.configure(state="normal")
        elif kind == "trial" and row.get("record"):
            self.web_choice_label.set(
                "WEB için seçili: ★ Yeni deneme. Bu ses doğrudan WEB'e gider; "
                "PC'de kabul edilmiş MP3 korunur."
            )
            self.btn_publish_one.configure(state="normal")
        else:
            self.web_choice_label.set(
                "Bu eski denemenin okuma bilgileri yok. "
                "WEB'e göndermek için yeni deneme üretin."
            )
            self.btn_publish_one.configure(state="disabled")

    def _profile_matches_preview(self, clip):
        try:
            profile = self._profile()
            if profile != clip.get("profile") or clip.get("key") != self.current:
                return False
            article = self.article_for(self.current)
            rules = base.copy.deepcopy(self.rules)
            rules.setdefault("articles", {})[base.pron.identity(article)] = profile
            speech, speed = base.pron.speech(
                article, rules, engine.spoken(article["title"])
            )
            return clip.get("signature") == base.pron.signature(speech, speed)
        except (ValueError, RuntimeError, KeyError, TypeError):
            return False

    def _choose_pc_recording(self, _event=None):
        if self._clips_building:
            return
        row = self._selected_recording()
        if not row:
            self.btn_listen_recording.configure(state="disabled")
            self.btn_load_recording.configure(state="disabled")
            self.btn_accept.configure(state="disabled")
            self.choice.set("")
            self._choice_changed()
            return
        self.choice.set("pc")
        self.btn_listen_recording.configure(state="normal")
        if row["kind"] == "trial" and row.get("record"):
            meta = row["record"]
            self.preview = {
                "key": self.current, "path": row["path"],
                "profile": meta["profile"], "signature": meta["signature"],
            }
            same = self._profile_matches_preview(self.preview)
            self.btn_accept.configure(state="normal" if same else "disabled")
            self.btn_load_recording.configure(
                state="disabled" if same else "normal"
            )
            if not same:
                self.preview_feedback.set(
                    "Bu denemenin metni/hızı farklı. "
                    "'Denemenin metnini aç' ile eski ayarları getirebilirsiniz."
                )
        else:
            self.preview = None
            self.btn_accept.configure(state="disabled")
            self.btn_load_recording.configure(state="disabled")
        self._choice_changed()

    def listen_selected_recording(self, _event=None):
        row = self._selected_recording()
        if not row:
            self.play_feedback.set("Önce listeden bir MP3 seçin.")
            return
        self._audio_play(
            row["path"],
            "Yeni deneme" if row["kind"] == "trial" else "PC'deki ses"
        )

    def load_recording_profile(self):
        row = self._selected_recording()
        if not row or row["kind"] != "trial" or not row["record"]:
            self.play_feedback.set(
                "Bu sesin kaydedilmiş metni yok. Yeni bir deneme oluşturabilirsiniz."
            )
            return
        profile = row["record"]["profile"]
        self.editor.delete("1.0", "end")
        self.editor.insert("1.0", profile["text"])
        self.speed.set(f"{profile['speed']:.2f}")
        self.drafts[self.current] = (profile["text"], self.speed.get())
        self._choose_pc_recording()
        self._refresh_relevant_terms()
        self.preview_feedback.set(
            "Bu denemenin eski metni/hızı açıldı. Sesinizi dinledikten "
            "sonra beğenirseniz PC'ye kaydedebilirsiniz."
        )

    def _on_editor_change(self, _event=None):
        """Immediately reflect only words relevant to the current reading."""
        if self._term_after:
            self.root.after_cancel(self._term_after)
        self._term_after = self.root.after(120, self._refresh_relevant_terms)

    def _refresh_relevant_terms(self):
        self._term_after = None
        if not hasattr(self, "dictionary_summary"):
            return
        key = self.current
        if key not in self.rows:
            self.dictionary_summary.set("Makale seçildiğinde uygulanacak kurallar gösterilir.")
            return
        text = self.editor.get("1.0", "end-1c")
        matched = preview_library.applicable_rules(text, self.rules)
        if matched:
            shown = [
                str(rule["find"]) + " → " + str(rule["say"])
                for rule in matched[:4]
            ]
            more = (f" · +{len(matched) - 4} kural" if len(matched) > 4 else "")
            self.dictionary_summary.set(
                "Bu okumada " + str(len(matched)) + " kural: "
                + "  •  ".join(shown) + more
            )
        else:
            self.dictionary_summary.set(
                "Bu makalenin okuma metninde eşleşen genel telaffuz kuralı yok."
            )
        if getattr(self, "preview", None) is not None and hasattr(
            self, "clip_tree"
        ):
            same = self._profile_matches_preview(self.preview)
            self.btn_accept.configure(state="normal" if same else "disabled")
            chosen = self._selected_recording()
            if chosen and chosen["kind"] == "trial" and chosen.get("record"):
                self.btn_load_recording.configure(
                    state="disabled" if same else "normal"
                )

    def show_pc_pending(self):
        """Show the prepared audio still absent from the real WEB listing."""
        self.filter.set("pc_pending")
        self._render()

    def _sent_but_not_live(self):
        """Identify only GitHub uploads recorded by this application.

        A PC file with no recorded GitHub upload is not assumed unpublished:
        GitHub Actions or an older version may have sent it already. The
        category is labelled 'Gönderim kaydı yok', not 'Gönderilmedi'.
        """
        progress = flow.read_progress(HOME) or self.publish_progress or {}
        sent = set(progress.get("github_sent", []))
        expected = progress.get("expected", {})
        if not isinstance(expected, dict):
            return set()
        return {
            key for key in sent
            if key in self.rows
            and self.rows[key].get("pc_pending")
            and expected.get(key) is not None
            and self.rows[key].get("local_entry") == expected[key]
        }

    def _render(self):
        super()._render()
        # The base UI is reused for filter/tree functionality, while this
        # view keeps WEB/GitHub/PC states distinct.
        if hasattr(self, "dictionary_summary"):
            self._refresh_relevant_terms()
        if hasattr(self, "pending_notice"):
            waiting = self.totals.get("pc_pending", 0)
            sent = self._sent_but_not_live()
            self.count_labels["pc_pending"].set(
                f"PC hazır / WEB'de yok: {waiting}"
            )
            self.pending_notice.set(
                f"Üretilmiş, WEB'de henüz yok: {waiting}  ·  "
                f"GitHub'a gönderildi, WEB bekleniyor: {len(sent)}  ·  "
                f"Gönderim kaydı bulunmayan: {max(0, waiting - len(sent))}"
            )
            for key in self.table.get_children():
                row = self.rows.get(key)
                if row and row.get("pc_pending"):
                    self.table.set(
                        key, "pc",
                        "GitHub ✓" if key in sent else "PC ✓"
                    )

    def _rebuild(self):
        # When ALL website sounds have been published, the default
        # WEB-missing filter becomes empty. Return to 'Hepsi' so users can
        # choose a published article for pronunciation corrections.
        super()._rebuild()
        if (self.filter.get() == "web_missing"
                and self.totals.get("all", 0) > 0
                and self.totals.get("web_missing") == 0):
            self.filter.set("all")
            self._render()
        # A successful acceptance removes self.preview via the inherited code.
        # Make sure the old one-click replay button cannot use stale data.
        if hasattr(self, "btn_replay"):
            valid = (self.preview is not None and self.current is not None
                     and self.preview.get("key") == self.current
                     and Path(self.preview.get("path", "")).is_file())
            self.btn_replay.configure(state="normal" if valid else "disabled")

    def _select_article(self, _event=None):
        previous = self.current
        super()._select_article(_event)
        if not hasattr(self, "preview_feedback"):
            return
        if previous != self.current:
            self._play_seq += 1  # A stale WEB download must not start later.
            self.preview_feedback.set(
                "Bu makaledeki PC kayıtlarını listeden dinleyebilir, "
                "yeni denemeler üretebilirsiniz."
            )
        self._refresh_recordings()
        self._refresh_relevant_terms()
        if hasattr(self, "btn_replay"):
            ready = (self.preview and self.preview.get("key") == self.current
                     and Path(self.preview.get("path", "")).is_file())
            self.btn_replay.configure(state="normal" if ready else "disabled")

    def preview_sound(self):
        """Generate a unique audition and put it in the visible article list.

        Playback is a separate thread and does not delay completion of the TTS
        task. A player failure must never discard the newly generated MP3.
        """
        if self.busy:
            messagebox.showinfo(
                "Önce işlem tamamlansın",
                "Web denetimi veya ses üretimi sürüyor. "
                "Tamamlandığında yeni okuma oluşturabilirsiniz."
            )
            return
        if self.current not in self.rows:
            messagebox.showinfo(
                "Önce makale seçin",
                "Sesini değiştireceğiniz makaleyi soldaki listeden seçin."
            )
            return
        try:
            profile = self._profile()
            key = self.current
            article = self.article_for(key)
            rules = base.copy.deepcopy(self.rules)
            rules.setdefault("articles", {})[base.pron.identity(article)] = profile
            speech, speed = base.pron.speech(
                article, rules, engine.spoken(article["title"])
            )
            signature = base.pron.signature(speech, speed)
        except (ValueError, RuntimeError) as exc:
            messagebox.showwarning("Okuma metni", str(exc))
            return

        # Unique files allow an older track to stay open while the next
        # recording is produced and provide an easy per-article history.
        trial = base.PREVIEWS / (key + "_" + uuid.uuid4().hex + "_deneme.mp3")
        self.preview_feedback.set(
            "Ahenk yeni sesi üretiyor. Bittiğinde PC sesleri listesine eklenecek."
        )
        self.btn_accept.configure(state="disabled")
        self.btn_replay.configure(state="disabled")
        self._refresh_relevant_terms()

        def work():
            if not shutil.which("ffmpeg"):
                raise RuntimeError(
                    "FFmpeg bulunamadı. PowerShell: winget install -e --id Gyan.FFmpeg"
                )
            engine.render_clip(self._tts(), speech, trial, speed=speed)
            preview_library.save_record(
                base.PREVIEWS, key, trial, profile, signature
            )
            return {
                "key": key, "path": trial,
                "profile": profile, "signature": signature,
            }

        def done(preview):
            if self.current != preview["key"]:
                self._note(
                    "Yeni ses hazır, fakat başka bir makaledesiniz. "
                    "O makaleye geri döndüğünüzde deneme listesinde görünecek."
                )
                return
            self.preview = preview
            self._refresh_recordings(select_preview=trial)
            self.btn_replay.configure(state="normal")
            self.preview_feedback.set(
                "Yeni ses PC sesleri listesine eklendi. Dinleyebilir, "
                "eski denemeleri seçebilir veya beğendiğiniz sürümü PC'ye kaydedebilirsiniz."
            )
            self._note("Yeni Ahenk ses denemesi hazır: " + trial.name)
            # The audio player is deliberately independent of the TTS/GitHub
            # busy state; do not wait for Windows' default MP3 app to launch.
            self._audio_play(trial, "Yeni ses denemesi")

        self._managed_task("Yeni Ahenk ses denemesi hazırlanıyor…", work, done)

    def replay_preview(self):
        preview = self.preview
        if not preview or preview.get("key") != self.current:
            chosen = self._selected_recording()
            if chosen and chosen["kind"] == "trial":
                self._audio_play(chosen["path"], "Seçili deneme")
                return
            messagebox.showinfo(
                "Önce bir ses seçin",
                "PC sesleri listesindeki bir denemeyi seçin veya yeni deneme üretin."
            )
            return
        path = Path(preview["path"])
        if not path.is_file():
            self.btn_replay.configure(state="disabled")
            self.play_feedback.set("Bu denemenin MP3 dosyası bulunamadı.")
            return
        self._audio_play(path, "Seçili deneme")

    def publish_current(self):
        """Upload the EXACT highlighted PC recording, even if WEB already has one.

        No accepted local audio is changed for a trial selection. On the WEB
        side an explicit confirmation always precedes replacing a live clip.
        """
        if self.busy:
            messagebox.showinfo(
                "Gönderim devam ediyor",
                "Devam eden GitHub/MP3 işlemi bitince seçili sesi WEB'e gönderebilirsiniz."
            )
            return
        key = self.current
        row = self._selected_recording()
        if (key not in self.rows or row is None or self.choice.get() == "web"):
            messagebox.showinfo(
                "Gönderilecek ses seçin",
                "Önce bu makalenin PC sesleri listesinden kabul edilmiş "
                "MP3'ü veya bir denemeyi işaretleyin."
            )
            return
        if row["kind"] == "trial" and not row.get("record"):
            messagebox.showwarning(
                "Eski deneme",
                "Bu eski denemenin telaffuz/metin kaydı bulunamadı. "
                "Önce yeni bir deneme üretip seçin."
            )
            return
        if not Path(row["path"]).is_file():
            messagebox.showwarning(
                "MP3 bulunamadı", "Seçilen MP3 kaybolmuş. Dosyaları yenileyin."
            )
            return
        candidate = dict(self.catalog[key])
        source = dict(row)
        is_trial = source["kind"] == "trial"
        description = "★ Yeni deneme" if is_trial else "✓ PC'de kabul edilmiş MP3"
        existing_web = bool(self.rows[key].get("web"))
        status = (
            "WEB'deki mevcut ses BU MP3 ile DEĞİŞTİRİLECEK."
            if existing_web else
            "WEB'de henüz olmayan ses ilk kez yayımlanacak."
        )
        if not messagebox.askyesno(
            "SEÇİLİ SESİ WEB'E GÖNDER — ONAY",
            f"Makale:\n{candidate['title'][:150]}\n\n"
            f"Seçilen ses: {description}\n"
            f"{status}\n\n"
            "Diğer makalelere ve PC'deki kabul edilmiş ses arşivine dokunulmaz.\n"
            "GitHub gönderimi ve site yayını durumunu ekranda görebilirsiniz.\n\n"
            "Bu MP3'ü WEB için yayımlamak istiyor musunuz?"
        ):
            return
        self._stage(
            f"Seçili {description} GitHub'a hazırlanıyor…", 0,
            "Gönderilecek makale: 1  |  WEB dağıtımı: bekleniyor"
        )
        self.web_progress_bar["value"] = 0

        def work():
            if is_trial:
                result = selected_web_audio.publish_trial(
                    ROOT, HOME, key, source["path"], candidate
                )
                message = result["message"]
            else:
                message = git_sync.publish_selected_local_voices(
                    ROOT, HOME, [key]
                )
            remote = git_sync.remote_manifest(ROOT)
            remote_entry = remote.get("entries", {}).get(key)
            if (not isinstance(remote_entry, dict) or
                    remote_entry.get("file") != key + ".mp3" or
                    any(remote_entry.get(field) != candidate.get(field)
                        for field in ("title", "journal", "pmid"))):
                raise RuntimeError(
                    "Gönderilen MP3'ün GitHub makale kaydı doğrulanamadı."
                )

            previous = flow.read_progress(HOME)
            if (previous and previous.get("phase") == "site_yayini_bekleniyor"
                    and previous.get("github_sent")):
                progress = previous
                if key not in progress["target_keys"]:
                    progress["target_keys"].append(key)
            else:
                progress = flow.new_progress([key])
            progress["expected"][key] = remote_entry
            if key not in progress["github_sent"]:
                progress["github_sent"].append(key)
            progress["phase"] = "site_yayini_bekleniyor"
            try:
                live = online_audio.fetch_manifest()
            except (OSError, RuntimeError, ValueError) as exc:
                live = None
                self._worker_log(
                    "GitHub gönderimi doğrulandı, ancak WEB henüz okunamadı: "
                    + str(exc)[:160]
                )
            if live is not None:
                progress["website_confirmed"] = flow.verified_on_web(
                    progress, live
                )
                if len(progress["website_confirmed"]) == len(progress["target_keys"]):
                    progress["phase"] = "tamamlandi"
            flow.save_progress(HOME, progress)
            return {"key": key, "progress": progress,
                    "web_manifest": live, "message": message}

        def done(result):
            progress = result["progress"]
            self.publish_progress = progress
            live = result["web_manifest"]
            if live is not None:
                self.web_manifest = live
                self.web_confirmed = True
                online_audio.cache_manifest(HOME, live)
            self._rebuild()
            self._set_progress(progress)
            self._note(result["message"])
            if progress["phase"] == "tamamlandi":
                self.play_feedback.set(
                    "Seçili ses WEB'de doğrulandı. Dinlemek için WEB dinle'ye basın."
                )
            else:
                self.play_feedback.set(
                    "Seçili ses GitHub'a gönderildi. WEB yayını kontrol ediliyor…"
                )
                self._start_watch()

        self._managed_task(
            "Seçili kayıt GitHub'a gönderiliyor; PC sesleriniz korunuyor…",
            work, done
        )

    def save_text(self):
        if self.busy:
            messagebox.showinfo("İşlem devam ediyor",
                                "Yayın işlemi sırasında okuma ayarı değiştirilemez.")
            return
        return super().save_text()

    def accept_sound(self):
        if self.busy:
            messagebox.showinfo("İşlem devam ediyor",
                                "Ses dosyası yüklemesi tamamlandıktan sonra kaydedilebilir.")
            return
        return super().accept_sound()

    def open_dictionary(self):
        if self.busy:
            messagebox.showinfo("İşlem devam ediyor",
                                "Telaffuz sözlüğünü yayın sonrasında düzenleyin.")
            return
        return super().open_dictionary()

    def _stage(self, label, percent=None, counter=None):
        """Main-thread only: update the prominent progress strip."""
        self.stage_description.set(str(label))
        if percent is not None:
            self.stage_bar["value"] = max(0, min(100, float(percent)))
        if counter is not None:
            self.stage_counters.set(str(counter))

    def _worker_stage(self, label, percent=None, counter=None):
        self.events.put(("done", (label, percent, counter),
                         lambda data: self._stage(*data)))

    def _managed_task(self, label, work, done):
        """Capture partial-upload failures without discarding progress."""
        def attempt():
            try:
                return True, work()
            except Exception as exc:
                return False, (str(exc), traceback.format_exc())

        def finished(payload):
            ok, result = payload
            if ok:
                done(result)
                return
            error, stack = result
            with ERROR_LOG.open("a", encoding="utf-8") as handle:
                handle.write("\n" + datetime.now().isoformat() + "\n" + stack + "\n")
            self._stage("İşlem durdu: " + error[:150])
            self._note("HATA: " + error)
            messagebox.showerror("Ahenk işlemi tamamlanamadı",
                                 error[:1000] + "\n\nYerel MP3'ler silinmedi.\nHata kaydı: " +
                                 str(ERROR_LOG))

        self._task(label, attempt, finished)

    def _validated_articles(self):
        articles = engine.load_sheet()
        lower_bound = max(engine.MIN_EXPECTED_ARTICLES, int(len(self.articles) * 0.8))
        if len(articles) < lower_bound:
            raise RuntimeError(
                f"Makale listesi beklenenden az ({len(articles)}). "
                f"En az {lower_bound} bekleniyor; işlem durduruldu."
            )
        return articles

    def prepare_web_missing(self):
        """Step 1: website manifest is authoritative, local MP3s reused."""
        if self.busy:
            self._note("Önce devam eden işlem tamamlansın.")
            return
        self.web_progress_bar["value"] = 0
        self._stage("1/2 · Web ve makale listeleri denetleniyor...", 0,
                    "Hazırlama başladı · Web'de olan sesler korunacak.")

        def work():
            website = online_audio.fetch_manifest()
            articles = self._validated_articles()
            catalog = engine.catalog(articles)
            plan = flow.plan(
                catalog, website,
                lambda key: audio_inventory.present(ROOT, key)
            )
            targets = plan["generate_pc"]
            total = len(plan["web_missing"])
            existing = len(plan["ready_pc"])
            self._worker_stage(
                f"WEB'de {total} ses eksik; bunların {existing} tanesi PC'de zaten hazır.",
                0 if targets else 100,
                f"Mevcut PC sesleri: {existing}/{total}  |  Üretilecek: {len(targets)}"
            )
            # Recover any accepted MP3 whose matching manifest entry disappeared.
            local_keys = plan["ready_pc"]
            repaired = audio_inventory.restore_missing_entries(
                ROOT, catalog, local_keys, HOME
            )
            tts = None
            created = 0
            for start in range(0, len(targets), BATCH):
                if self.stopping.is_set():
                    break
                chunk = targets[start:start + BATCH]
                if tts is None:
                    tts = self._tts()
                engine.execute_plan(
                    {"version": 1, "candidates": catalog, "selected": chunk},
                    tts=tts, preserve_local=True,
                )
                created += len(chunk)
                self._worker_stage(
                    f"Ses hazırlanıyor: {created}/{len(targets)} yeni MP3 · "
                    f"Toplam hazır {existing + created}/{total}",
                    100 * created / max(1, len(targets)),
                    f"PC'de hazır: {existing + created}/{total}  |  Yeni üretildi: {created}"
                )
            return {
                "articles": articles, "web": website,
                "total": total, "created": created,
                "ready": existing + created, "repaired": repaired,
                "stopped": self.stopping.is_set(),
            }

        def done(info):
            self.articles = info["articles"]
            CACHE.write_text(json.dumps(info["articles"], ensure_ascii=False),
                             encoding="utf-8")
            self.web_manifest = info["web"]
            self.web_confirmed = True
            online_audio.cache_manifest(HOME, info["web"])
            self._rebuild()
            label = (
                f"1. ADIM TAMAM: WEB'de eksik {info['total']} sesin "
                f"{info['ready']} tanesi PC'de hazır. "
                + (f"{info['created']} yeni üretildi."
                   if info["created"] else "Yeniden üretim gerekmedi.")
            )
            if info["stopped"]:
                label = "Hazırlama kullanıcı tarafından durduruldu. " + label
            self._stage(label, 100 if not info["stopped"] else None,
                        f"Hazır: {info['ready']}/{info['total']} · "
                        f"Yeni: {info['created']} · "
                        f"Kurtarılan kayıt: {info['repaired']}")
            self._note("1. adım bitti. Hazır sesleri WEB'e göndermek için 2. adıma basın.")

        self._managed_task("WEB'de eksik sesler hazırlanıyor...", work, done)

    def upload_web_missing(self):
        """Step 2: fresh preflight + explicit approval; no surprise publication."""
        if self.busy:
            self._note("Önce devam eden işlem tamamlansın.")
            return
        self._stage("2/2 · Gerçek WEB ve yerel MP3 durumu doğrulanıyor...", 0)

        def preflight():
            website = online_audio.fetch_manifest()
            articles = self._validated_articles()
            catalog = engine.catalog(articles)
            plan = flow.plan(catalog, website,
                             lambda key: audio_inventory.present(ROOT, key))
            return articles, website, catalog, plan

        def preflight_done(bundle):
            articles, website, catalog, plan = bundle
            self.articles = articles
            self.web_manifest = website
            self.web_confirmed = True
            online_audio.cache_manifest(HOME, website)
            self._rebuild()
            missing = len(plan["web_missing"])
            ready = len(plan["ready_pc"])
            if not missing:
                self._stage("Web'de eksik ses bulunamadı. Her şey yayında.", 100,
                            f"WEB yayını: {len(catalog)}/{len(catalog)}")
                self._note("Gönderilecek yeni ses yok.")
                return
            if plan["generate_pc"]:
                self._stage(
                    f"WEB'de eksik {missing} ses var; {len(plan['generate_pc'])} PC'de henüz hazır değil.",
                    0, "Önce 1. adıma basarak eksik sesleri üretin."
                )
                messagebox.showinfo(
                    "Önce sesleri hazırlayın",
                    f"WEB'de {missing} MP3 eksik; {ready} PC'de hazır, "
                    f"{len(plan['generate_pc'])} henüz PC'de yok.\n\n"
                    "Tüm eksikleri tek seferde göndermek için önce 1. adımı çalıştırın."
                )
                return
            if not messagebox.askyesno(
                "2. ADIM · WEB'E YÜKLEME ONAYI",
                f"WEB'de eksik {missing} makalenin MP3'ü PC'de hazır.\n\n"
                f"Bu {missing} ses 8'li partiler hâlinde GitHub'a gönderilecek. "
                "Sonrasında web sitesi yayını otomatik olarak güncellenecek.\n\n"
                "WEB'de hâlihazırda bulunan seslere dokunulmayacak.\n"
                "Göndermek istiyor musunuz?"
            ):
                self._stage("Yükleme iptal edildi. Yerel sesler korunuyor.")
                return
            # The preflight's _task is still marked busy until its queued
            # idle event is handled. Start upload on the NEXT Tk event turn.
            self.root.after(200, lambda: self._upload_approved(articles, catalog))

        self._managed_task("WEB ve yerel sesler karşılaştırılıyor...", preflight,
                           preflight_done)

    def _upload_approved(self, articles, catalog):
        """Run the approved upload in a background worker, with batch progress."""
        self.web_progress_bar["value"] = 0
        self._stage("2/2 · GitHub'a güvenli ses gönderimi başlıyor...", 0)

        def work():
            live = online_audio.fetch_manifest()
            current_plan = flow.plan(catalog, live,
                                     lambda key: audio_inventory.present(ROOT, key))
            if current_plan["generate_pc"]:
                raise RuntimeError(
                    "Yükleme başlamadan bazı MP3'ler eksildi. Önce 1. adımı tekrar çalıştırın."
                )
            keys = current_plan["web_missing"]
            progress = flow.new_progress(keys)
            progress["phase"] = "github_yukleniyor"
            flow.save_progress(HOME, progress)
            if not keys:
                return progress, live

            # Missing manifest metadata is repaired, never a reason to regenerate.
            count = audio_inventory.restore_missing_entries(
                ROOT, catalog, keys, HOME
            )
            if count:
                self._worker_stage(
                    f"Manifestte kaydı eksik {count} hazır MP3 kurtarıldı.", 0,
                    f"GitHub: 0/{len(keys)} · WEB'de doğrulanan: 0/{len(keys)}"
                )

            for start in range(0, len(keys), BATCH):
                if self.stopping.is_set():
                    progress["phase"] = "duraklatildi"
                    flow.save_progress(HOME, progress)
                    break
                chunk = keys[start:start + BATCH]
                self._worker_stage(
                    f"GitHub'a yükleniyor: {start + 1}–{start + len(chunk)} / {len(keys)}",
                    100 * start / len(keys),
                    flow.progress_label(progress)
                )
                git_sync.publish_selected_local_voices(ROOT, HOME, chunk)
                remote = git_sync.remote_manifest(ROOT).get("entries", {})
                local = engine.load_manifest().get("entries", {})
                for key in chunk:
                    if key not in remote or key not in local or remote[key] != local[key]:
                        raise RuntimeError(
                            "GitHub'a gönderilen ses doğrulanamadı: " + key
                        )
                    progress["expected"][key] = remote[key]
                    if key not in progress["github_sent"]:
                        progress["github_sent"].append(key)
                progress["phase"] = "github_yukleniyor"
                flow.save_progress(HOME, progress)
                self._worker_stage(
                    f"GitHub'a gönderilen ses: {len(progress['github_sent'])}/{len(keys)}",
                    100 * len(progress["github_sent"]) / len(keys),
                    flow.progress_label(progress)
                )
            try:
                current_site = online_audio.fetch_manifest()
            except (OSError, ValueError, RuntimeError):
                current_site = live
            progress["website_confirmed"] = flow.verified_on_web(progress, current_site)
            if len(progress["github_sent"]) == len(keys):
                progress["phase"] = (
                    "tamamlandi" if len(progress["website_confirmed"]) == len(keys)
                    else "site_yayini_bekleniyor"
                )
            flow.save_progress(HOME, progress)
            return progress, current_site

        def done(result):
            progress, live = result
            self.publish_progress = progress
            self.web_manifest = live
            self.web_confirmed = True
            self._rebuild()
            self._set_progress(progress)
            if progress.get("phase") == "tamamlandi":
                self._note("Gönderilen seslerin tümü web sitesinde doğrulandı.")
            else:
                self._note("GitHub gönderimi kaydedildi. WEB dağıtımını otomatik izleyeceğim.")
                self._start_watch()

        self._managed_task("GitHub'a sesler yükleniyor...", work, done)

    def _set_progress(self, progress):
        if not progress:
            return
        sent = len(progress.get("github_sent", []))
        total = len(progress.get("target_keys", []))
        verified = len(progress.get("website_confirmed", []))
        self.web_progress_bar["value"] = 100 * verified / max(1, total)
        phase = progress.get("phase")
        self.stage_counters.set(
            f"GitHub: {sent}/{total} gönderildi  |  "
            f"WEB'de yayına girdi: {verified}/{total}"
        )
        if phase == "tamamlandi":
            self._stage(f"YAYIN TAMAMLANDI: {verified}/{total} MP3 WEB'de doğrulandı.", 100)
        elif phase == "duraklatildi":
            self._stage(f"Yükleme duraklatıldı: GitHub {sent}/{total}. İkinci adıma tekrar basabilirsiniz.",
                        100 * sent / max(1, total))
        else:
            self._stage(
                f"GitHub'da {sent}/{total} hazır · "
                f"WEB yayını bekleniyor: {total - verified} ses.",
                100 * sent / max(1, total)
            )

    def _resume_watch(self):
        if self._auto_start_requested or self._auto_running:
            return
        progress = flow.read_progress(HOME)
        if progress and progress.get("phase") == "site_yayini_bekleniyor" and (
            len(progress.get("website_confirmed", [])) <
            len(progress.get("github_sent", []))
        ):
            self.publish_progress = progress
            self._start_watch()

    def _start_watch(self):
        if self.web_watch_active:
            return
        progress = flow.read_progress(HOME)
        if not progress or not progress.get("github_sent"):
            return
        self.web_watch_active = True
        self.web_watch_checks = 0
        self.web_watch_started = time.monotonic()
        self.root.after(3000, self._watch_tick)

    def _watch_tick(self):
        if not self.web_watch_active:
            return
        if self.web_watch_busy:
            return
        if self.busy:
            self.root.after(6000, self._watch_tick)
            return
        self.web_watch_busy = True

        def check():
            try:
                manifest = online_audio.fetch_manifest()
                self.events.put(("done", (manifest, ""), self._watch_result))
            except (RuntimeError, ValueError, OSError) as exc:
                self.events.put(("done", (None, str(exc)), self._watch_result))

        threading.Thread(target=check, daemon=True).start()

    def _watch_result(self, result):
        self.web_watch_busy = False
        live, error = result
        progress = flow.read_progress(HOME)
        if not progress:
            self.web_watch_active = False
            return
        if live is not None:
            verified = flow.verified_on_web(progress, live)
            progress["website_confirmed"] = verified
            if len(verified) == len(progress.get("target_keys", [])):
                progress["phase"] = "tamamlandi"
            else:
                progress["phase"] = "site_yayini_bekleniyor"
            flow.save_progress(HOME, progress)
            self.publish_progress = progress
            self.web_manifest = live
            self.web_confirmed = True
            self._rebuild()
            self._set_progress(progress)
        elif error:
            self._note("WEB yayını henüz sorgulanamadı: " + error[:120])

        if (progress.get("phase") == "tamamlandi" or
            time.monotonic() - self.web_watch_started > 600):
            self.web_watch_active = False
            if progress.get("phase") != "tamamlandi":
                self._note("WEB dağıtımı hâlâ bekleniyor. 'WEB durumunu kontrol et' ile yeniden bakın.")
            return
        self.web_watch_checks += 1
        self.root.after(15000, self._watch_tick)

    def refresh_web(self):
        """Manual website check also updates pending upload status."""
        def work():
            return online_audio.fetch_manifest()

        def done(live):
            online_audio.cache_manifest(HOME, live)
            self.web_manifest = live
            self.web_confirmed = True
            self._rebuild()
            progress = flow.read_progress(HOME)
            if progress and progress.get("github_sent"):
                progress["website_confirmed"] = flow.verified_on_web(progress, live)
                if len(progress["website_confirmed"]) == len(progress["target_keys"]):
                    progress["phase"] = "tamamlandi"
                flow.save_progress(HOME, progress)
                self.publish_progress = progress
                self._set_progress(progress)
            self._note(f"WEB kontrol edildi: {len(live['entries'])} hazır MP3.")

        self._managed_task("WEB'deki yayın kontrol ediliyor...", work, done)


def main():
    # A scheduled PC audio synthesis should never edit the local repository
    # concurrently with a visible user session.
    import app_single_instance
    with app_single_instance.exclusive_archive() as available:
        if not available:
            messagebox.showinfo(
                "Podcast Ahenk zaten çalışıyor",
                "Başka bir Ahenk penceresi veya günlük ses üretim görevi "
                "çalışıyor. MP3 dosyalarını korumak için ikinci işlem açılmadı."
            )
            return
        root = tk.Tk()
        try:
            manager = TwoStepManager(root)
            manager.enable_startup_autorun()
        except Exception as exc:
            with ERROR_LOG.open("a", encoding="utf-8") as handle:
                handle.write(datetime.now().isoformat() + "\n" +
                             traceback.format_exc() + "\n")
            messagebox.showerror("Ahenk açılamadı", str(exc) + "\n" + str(ERROR_LOG))
            root.destroy()
            return
        root.mainloop()


if __name__ == "__main__":
    main()
