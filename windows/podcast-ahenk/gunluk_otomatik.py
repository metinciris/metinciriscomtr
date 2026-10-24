#!/usr/bin/env python3
"""12:30 Windows Task Scheduler podcast job, without opening the GUI.

Auto-publishing is strictly restricted to *missing* titles on both the LIVE
website and latest GitHub main. Existing WEB voices and local previews are
never overwritten, deleted or re-synthesized. One batch upload at the end.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys
import tempfile
import traceback

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).parent))
sys.dont_write_bytecode = True

import app_single_instance
import audio_inventory
import audio_runtime
import git_sync
import manifest_recovery
import online_audio
import two_step_audio
from scripts import render_podcast_audio as engine

HOME = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / "PodcastAhenk"
LOG = HOME / "gunluk_otomatik.log"
STATUS = HOME / "gunluk_otomatik_sonuc.json"
MIN_ARTICLES = 96  # Normally 12 pathology journals * 10 titles.
CHUNK_SIZE = 8
MAX_PER_RUN = 150


def now():
    return datetime.now(timezone.utc).isoformat()


def note(message):
    # Windows scheduled job logs UTF-8; interactive cp1252 test consoles may not.
    text = f"{now()} | {message}"
    encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
    safe = text.encode(encoding, errors="backslashreplace").decode(encoding)
    print(safe, flush=True)


def save_status(data):
    HOME.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(
        prefix=".ahenk-gunluk-", suffix=".json", dir=HOME
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(data, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
        os.replace(temp, STATUS)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def safe_catalog(articles):
    if len(articles) < MIN_ARTICLES:
        raise RuntimeError(
            f"Google Sheets {len(articles)} makale döndürdü; "
            f"en az {MIN_ARTICLES} bekleniyor. Sesler korunarak işlem durduruldu."
        )
    catalog = engine.catalog(articles)
    if len(catalog) < MIN_ARTICLES:
        raise RuntimeError(
            "Google Sheets'te yinelenen/eksik başlıklar var. "
            "Kaynak doğrulanamadığı için hiçbir ses değiştirilmedi."
        )
    return catalog


def truly_unpublished(catalog, live, remote):
    """Do not republish voices whose GitHub commit is awaiting Pages deploy."""
    missing_live = set(two_step_audio.missing_on_web(catalog, live))
    missing_remote = set(two_step_audio.missing_on_web(catalog, remote))
    return [key for key in catalog if key in missing_live and key in missing_remote]


def approved_pc_keys(catalog, keys, manifest):
    """Only already accepted MP3s with matching local manifest metadata."""
    entries = manifest.get("entries", {})
    approved, skipped = [], []
    for key in keys:
        candidate = catalog[key]
        item = entries.get(key)
        valid = (
            isinstance(item, dict)
            and item.get("file") == candidate["file"]
            and item.get("title") == candidate["title"]
            and item.get("journal") == candidate["journal"]
            and engine.normalize_pmid(item.get("pmid")) == candidate["pmid"]
            # Unverified local MP3 must be reviewed in the GUI first.
            and item.get("fingerprint") != "unknown-recovered"
        )
        if valid and audio_inventory.present(ROOT, key):
            approved.append(key)
        else:
            skipped.append(key)
    return approved, skipped


def run_once(progress=None, stopping=None):
    """Generate missing clips and publish once, reporting safe, UI-ready progress.

    `progress(event)` receives plain dictionaries from the worker thread. The
    Tk caller must queue them to the main thread, never modify widgets here.
    `stopping` is optional; stop is honored between eight-clip batches.
    """
    def report(phase, current=0, total=0, message=""):
        if progress is not None:
            progress({
                "phase": phase, "current": current, "total": total,
                "message": message,
            })

    report("checking", message="WEB ve güncel makale listesi kontrol ediliyor.")
    result = {
        "started": now(), "status": "running", "listed": 0,
        "web_missing": 0, "github_missing": 0, "generated": 0,
        "uploaded": 0, "skipped": [], "finished": None,
    }
    save_status(result)

    # LIVE website is authoritative; abort if it cannot be checked.
    live = online_audio.fetch_manifest()
    articles = engine.load_sheet()
    catalog = safe_catalog(articles)
    result["listed"] = len(catalog)
    live_missing = two_step_audio.missing_on_web(catalog, live)
    result["web_missing"] = len(live_missing)
    def completed():
        result["finished"] = now()
        save_status(result)
        # The window displays the fresh articles without a second Sheets fetch.
        # Private keys are never persisted to the scheduled-worker JSON report.
        return {**result, "_articles": articles, "_website": live}

    report("checking", len(catalog) - len(live_missing), len(catalog),
           f"{len(catalog)} başlık · WEB'de {len(live_missing)} eksik ses.")
    if not live_missing:
        note("WEB'deki tüm makalelerin sesleri hazır. Git veya TTS başlatılmadı.")
        result["status"] = "complete"
        report("complete", len(catalog), len(catalog), "Tüm sesler WEB'de hazır.")
        return completed()

    report("sync", message="GitHub arşivi güvenle eşitleniyor.")
    note(f"{len(catalog)} makale, WEB'de {len(live_missing)} eksik. GitHub eşitleniyor.")
    git_sync.sync(ROOT, HOME)
    remote = git_sync.remote_manifest(ROOT)
    missing = truly_unpublished(catalog, live, remote)[:MAX_PER_RUN]
    result["github_missing"] = len(missing)
    if not missing:
        note("Eksik MP3'ler GitHub'a önceden gönderilmiş; WEB yayını bekleniyor.")
        result["status"] = "waiting_for_deploy"
        report("waiting", message="Sesler GitHub'da hazır; WEB dağıtımı bekleniyor.")
        return completed()

    existing, unregistered = approved_pc_keys(
        catalog, missing, engine.load_manifest()
    )
    # An existing but invalid or unreadable local MP3 is NEVER replaced:
    # it may be a personal recording or locked by a player.
    need_generate = []
    blocked = []
    for key in unregistered:
        destination = ROOT / "public" / "podcast-audio" / (key + ".mp3")
        if destination.exists():
            blocked.append(key)
        else:
            need_generate.append(key)
    note(f"{len(existing)} onaylı PC sesi hazır; {len(need_generate)} üretilecek; "
         f"{len(blocked)} mevcut fakat okunamayan/kayıtsız MP3 korunacak.")
    result["skipped"] = blocked[:]
    result["ready_pc"] = len(existing)
    result["to_generate"] = len(need_generate)
    save_status(result)
    report(
        "planned", len(existing), len(missing),
        f"WEB'de {len(missing)} eksik · PC'de hazır {len(existing)} · "
        f"Yeni üretilecek {len(need_generate)} · Kontrol gerekli {len(blocked)}."
    )

    if need_generate and not (stopping is not None and stopping.is_set()):
        report("engine", 0, len(need_generate), "Ahenk motoru hazırlanıyor…")
        audio_runtime.ensure_runtime(ROOT, report=note)
        model = engine.create_tts()
        try:
            for start in range(0, len(need_generate), CHUNK_SIZE):
                if stopping is not None and stopping.is_set():
                    break
                chunk = need_generate[start:start + CHUNK_SIZE]
                staged = [0]
                def on_prepared(_key, article):
                    staged[0] += 1
                    report(
                        "generating", start + staged[0], len(need_generate),
                        "Ses hazırlanıyor: " + article["title"][:100]
                    )
                engine.execute_plan(
                    {"version": 1, "candidates": catalog, "selected": chunk},
                    tts=model, preserve_local=True, on_prepared=on_prepared,
                )
                result["generated"] += len(chunk)
                save_status(result)
                report(
                    "generating", result["generated"], len(need_generate),
                    f"{result['generated']}/{len(need_generate)} yeni MP3 hazırlandı."
                )
                note(f"MP3 üretildi: {result['generated']}/{len(need_generate)}")
        finally:
            del model
    result["stopped"] = bool(stopping is not None and stopping.is_set())
    if result["stopped"]:
        report("stopping", result["generated"], len(need_generate),
               "Durduruldu. Tamamlanan partiler korunup hazır sesler gönderilecek.")

    # A GitHub Actions run may have published some clips while TTS was busy.
    # Re-fetch main and recheck keys to ensure we do not overwrite those.
    report("sync", message="Yükleme öncesi GitHub yeniden kontrol ediliyor.")
    git_sync.sync(ROOT, HOME)
    latest_remote = git_sync.remote_manifest(ROOT)
    fresh_set = set(truly_unpublished(catalog, live, latest_remote))
    final_missing = [key for key in missing if key in fresh_set]
    upload, skipped = approved_pc_keys(
        catalog, final_missing, engine.load_manifest()
    )
    result["skipped"] = list(dict.fromkeys(result["skipped"] + skipped))
    if upload:
        report("uploading", 0, len(upload),
               f"{len(upload)} hazır ses GitHub'a tek toplu gönderimle yükleniyor…")
        note(f"GitHub'a TEK gönderim: {len(upload)} MP3. "
             "Web'deki mevcut kayıtların üzerine yazılmıyor.")
        git_sync.publish_selected_local_voices(ROOT, HOME, upload, reject_existing=True)
        result["uploaded"] = len(upload)
        result["uploaded_keys"] = upload
        result["status"] = "uploaded_waiting_for_deploy"
        report("uploaded", len(upload), len(upload),
               f"{len(upload)} MP3 GitHub'a gönderildi · WEB dağıtımı bekleniyor.")
    else:
        result["status"] = "skipped_unapproved_files" if result["skipped"] else "waiting_for_deploy"
        report("waiting", len(existing), len(missing),
               f"Yeni gönderim yok · Kontrol gerekli: {len(result['skipped'])}.")
    note(f"Görev tamam: yeni {result['generated']}, GitHub'a {result['uploaded']}, "
         f"atlanan {len(result['skipped'])}. Program kapanıyor.")
    return completed()


def main():
    HOME.mkdir(parents=True, exist_ok=True)
    # Daily job must never wait indefinitely for interactive credentials.
    os.environ["GIT_TERMINAL_PROMPT"] = "0"
    os.environ["GCM_INTERACTIVE"] = "never"

    if LOG.is_file() and LOG.stat().st_size > 4 * 1024 * 1024:
        try:
            LOG.replace(HOME / "gunluk_otomatik_eski.log")
        except OSError:
            pass
    original_out, original_err = sys.stdout, sys.stderr
    try:
        with LOG.open("a", encoding="utf-8", buffering=1) as stream:
            sys.stdout, sys.stderr = stream, stream
            note("=== Günlük Ahenk görevi başladı ===")
            try:
                with app_single_instance.exclusive_archive() as acquired:
                    if not acquired:
                        note("Program zaten açık veya başka günlük işlem sürüyor. "
                             "İşlem yapılmadan çıkılıyor.")
                        save_status({
                            "started": now(), "finished": now(),
                            "status": "skipped_busy",
                            "message": "Ahenk penceresi veya başka görev açık.",
                        })
                        return 0
                    os.chdir(ROOT)
                    recovery = manifest_recovery.recover_if_invalid(ROOT, HOME)
                    if recovery.get("repaired"):
                        note("Interrupted manifest recovered, MP3s preserved. "
                             "Unverified recordings will not be auto-uploaded.")
                    run_once()
                return 0
            except Exception as error:
                note("HATA: " + str(error))
                traceback.print_exc()
                old = {}
                try:
                    old = json.loads(STATUS.read_text(encoding="utf-8"))
                except (OSError, ValueError):
                    pass
                old.update({
                    "status": "error", "error": str(error)[:1200],
                    "finished": now(),
                })
                try:
                    save_status(old)
                except OSError:
                    traceback.print_exc()
                return 1
            finally:
                note("=== Günlük Ahenk görevi bitti ===")
    finally:
        sys.stdout, sys.stderr = original_out, original_err


if __name__ == "__main__":
    sys.exit(main())
