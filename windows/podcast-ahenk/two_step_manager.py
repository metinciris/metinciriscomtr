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
import threading
import time
import tkinter as tk
from tkinter import messagebox, ttk
import traceback
import webbrowser

import simple_manager as base
import two_step_audio as flow
import online_audio
import audio_inventory
import git_sync
from scripts import render_podcast_audio as engine


HOME = base.HOME
ROOT = base.ROOT
CACHE = base.CACHE
ERROR_LOG = base.ERROR_LOG
BATCH = 8


class TwoStepManager(base.AhenkManager):
    def __init__(self, root):
        self.publish_progress = flow.read_progress(HOME)
        self.web_watch_active = False
        self.web_watch_checks = 0
        self.web_watch_started = 0.0
        self.web_watch_busy = False
        super().__init__(root)
        if self.publish_progress:
            self._set_progress(self.publish_progress)
        root.after(900, self._resume_watch)

    def _build(self):
        self.root.title("Podcast Ahenk | İki Adımda Web Sesleri 1.4")
        self.root.geometry("1250x790")
        self.root.minsize(980, 680)
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
        tk.Label(header, text="İki adım: Önce eksikleri hazırla, sonra yükle. WEB'deki mevcut sesler değiştirilmez.",
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

        status_box = ttk.Frame(self.root, padding=(13, 4))
        status_box.pack(fill="x")
        self.stage_description = tk.StringVar(value="Hazır. Web'deki eksikleri denetlemek için 1. adıma basın.")
        self.stage_counters = tk.StringVar(value="Hazırlama: —    |    GitHub: —    |    WEB yayını: —")
        ttk.Label(status_box, textvariable=self.stage_description,
                  font=("Segoe UI Semibold", 10)).pack(anchor="w")
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

        summary = ttk.Frame(self.root, padding=(12, 2))
        summary.pack(fill="x")
        self.count_labels = {}
        for key, label in [
            ("all", "Toplam"), ("web", "WEB'de var"),
            ("web_missing", "WEB'de eksik"), ("pc", "PC'de hazır"),
            ("pc_missing", "PC'de yok"), ("publish_ready", "Yayın adayı")
        ]:
            self.count_labels[key] = tk.StringVar(value=label + ": —")
            ttk.Label(summary, textvariable=self.count_labels[key],
                      font=("Segoe UI Semibold", 9)).pack(side="left", padx=(0, 17))

        toolbar = ttk.Frame(self.root, padding=(12, 6))
        toolbar.pack(fill="x")
        for label, method in [
            ("↻ WEB durumunu kontrol et", self.refresh_web),
            ("📁 Yerel MP3", self.open_audio_folder),
            ("📝 Log / Hata", self.open_log),
            ("🌐 Web sitesi", lambda: webbrowser.open("https://metinciris.com.tr/podcast")),
        ]:
            ttk.Button(toolbar, text=label, command=method).pack(side="left", padx=(0, 6))
        ttk.Button(toolbar, text="Durdur (parti sonrası)",
                   command=self.stopping.set).pack(side="right")

        filter_bar = ttk.Frame(self.root, padding=(12, 4))
        filter_bar.pack(fill="x")
        ttk.Label(filter_bar, text="GÖSTER:", font=("Segoe UI Semibold", 9)).pack(side="left")
        for title, value in [
            ("Web'de eksik", "web_missing"), ("Hepsi", "all"),
            ("PC'de hazır", "pc"), ("PC'de eksik", "pc_missing"),
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
                  wraplength=475).pack(anchor="w", pady=(6, 10))
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

        details = ttk.LabelFrame(right, text="Dilerseniz okuma metnini düzeltin", padding=9)
        details.pack(fill="both", expand=True, pady=(12, 0))
        self.editor = tk.Text(details, wrap="word", undo=True, height=4,
                              background="#fbfcff", font=("Segoe UI", 9), padx=7, pady=6)
        self.editor.pack(fill="both", expand=True)
        options = ttk.Frame(details)
        options.pack(fill="x", pady=(6, 0))
        ttk.Label(options, text="Hız").pack(side="left")
        self.speed = tk.StringVar(value="1.00")
        ttk.Combobox(options, width=6, state="readonly", textvariable=self.speed,
                     values=["0.80", "0.85", "0.90", "0.95", "1.00",
                             "1.05", "1.10", "1.15", "1.20"]).pack(side="left", padx=6)
        ttk.Button(options, text="Terim sözlüğü", command=self.open_dictionary).pack(side="left")
        ttk.Button(options, text="Metni kaydet", command=self.save_text).pack(side="right")
        actions = ttk.Frame(details)
        actions.pack(fill="x", pady=(8, 0))
        ttk.Button(actions, text="Yeni okumayı üret ve dinle",
                   command=self.preview_sound).pack(side="left", padx=(0, 5))
        self.btn_accept = ttk.Button(
            actions, text="Beğendim, PC'ye kaydet",
            command=self.accept_sound, state="disabled"
        )
        self.btn_accept.pack(side="left")
        self.choice_label = tk.StringVar(value="")
        self.btn_publish_one = ttk.Button(
            details, text="Yalnız bu PC sesini yayımla",
            command=self.publish_current, state="disabled"
        )
        # Keep single-clip action accessible but visually subordinate.
        self.btn_publish_one.pack(anchor="e", pady=(8, 0))

        bottom = ttk.Frame(self.root, padding=(12, 3))
        bottom.pack(fill="x")
        self.progress = ttk.Progressbar(bottom, mode="indeterminate", length=135)
        self.progress.pack(side="left", padx=(0, 10))
        ttk.Label(bottom, textvariable=self.status).pack(side="left", fill="x", expand=True)

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
    root = tk.Tk()
    try:
        TwoStepManager(root)
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
