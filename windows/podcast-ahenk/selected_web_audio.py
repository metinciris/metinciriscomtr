"""Publish one explicitly selected Ahenk trial as the WEB version.

Never overwrite the accepted PC recording or expose other local drafts. This
is a temporary, backed-up Git staging operation; the preview itself lives in
the AppData audition folder and remains available after publication.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import shutil
import tempfile

import git_sync
import preview_library
from scripts import render_podcast_audio as engine
from scripts import podcast_audio_pronunciation as pron


def _validate_trial(home, key, preview, candidate):
    """Use ONLY a valid recorded Ahenk trial belonging to that article."""
    if not isinstance(key, str) or not re.fullmatch(r"[a-f0-9]{24}", key):
        raise RuntimeError("Seçilen makalenin ses anahtarı geçersiz.")
    if not isinstance(candidate, dict) or candidate.get("file") != key + ".mp3":
        raise RuntimeError("Seçilen makalenin kimliği doğrulanamadı.")
    if engine.key_for(
        candidate.get("journal", ""), candidate.get("title", ""),
        candidate.get("pmid", "")
    ) != key:
        raise RuntimeError("Seçilen MP3 ile makale kimliği uyuşmuyor.")
    if not isinstance(preview, dict):
        raise RuntimeError("Yeni sesin deneme kaydı bulunamadı.")
    file = Path(preview.get("path", ""))
    audition_folder = Path(home) / "on_dinleme"
    if file.parent.resolve() != audition_folder.resolve():
        raise RuntimeError("Seçilen ses Ahenk deneme klasörüne ait değil.")
    matched = preview_library.SAFE_NEW_CLIP.fullmatch(file.name)
    if not matched or matched.group(1) != key or not preview_library._valid_audio(file):
        raise RuntimeError("Seçilen deneme MP3'ü güvenli veya geçerli değil.")
    if file.stat().st_size > 24 * 1024 * 1024:
        raise RuntimeError("Seçilen MP3 boyutu güvenlik sınırını aşıyor.")
    sidecar = file.with_suffix(".json")
    if not sidecar.is_file():
        raise RuntimeError(
            "Eski denemenin okuma ayarları yok; yeni ses üretip tekrar deneyin."
        )
    try:
        record = json.loads(sidecar.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as exc:
        raise RuntimeError("Deneme MP3 bilgileri okunamadı.") from exc
    if record.get("key") != key or record.get("file") != file.name:
        raise RuntimeError("Deneme sesinin makale bilgisi eşleşmiyor.")
    if not isinstance(record.get("signature"), str) or not isinstance(
        record.get("profile"), dict
    ):
        raise RuntimeError("Denemenin seslendirme ayarları eksik.")
    profile = record["profile"]
    if (not isinstance(profile.get("text"), str) or
        not 1 <= len(profile["text"].strip()) <= 3000 or
        isinstance(profile.get("speed"), bool) or
        not isinstance(profile.get("speed"), (float, int)) or
        not 0.80 <= float(profile["speed"]) <= 1.20):
        raise RuntimeError("Denemenin metin veya hız bilgisi geçersiz.")
    return file, record


def publish_trial(root, home, key, preview_path, candidate):
    """Upload precisely the preview selected by the user (including WEB replacement).

    GitHub 'main' must be fast-forwardable. Originals are backed up and restored
    byte-for-byte on both success and failure. The remote article's metadata
    and pronunciation profile are updated together, without other local drafts.
    """
    root = Path(root)
    home = Path(home)
    source, record = _validate_trial(home, key, {"path": preview_path}, candidate)

    # Protect source from unexpected changes while source code fetches happen.
    git_sync.sync(root, home, selected_key=key)
    rules_path = root / git_sync.RULES
    local_rules = pron.load(rules_path)
    chosen_rules = dict(local_rules)
    articles = dict(local_rules.get("articles", {}))
    identity = pron.identity(candidate)
    articles[identity] = dict(record["profile"])
    chosen_rules["articles"] = articles
    pron.validate(chosen_rules)
    spoken, speed = pron.speech(
        candidate, chosen_rules, engine.spoken(candidate["title"])
    )
    if pron.signature(spoken, speed) != record["signature"]:
        raise RuntimeError(
            "Deneme üretildikten sonra terim sözlüğü değişmiş. "
            "Bu sesi güvenle yayımlamak için yeniden üretin."
        )

    remote_manifest = git_sync.ref_json(
        root, "HEAD", git_sync.MANIFEST, {"version": 1, "entries": {}}
    )
    remote_rules = git_sync.ref_json(
        root, "HEAD", git_sync.RULES, pron.empty_rules()
    )
    # A local-only global rule must not be silently published for EVERY title.
    # Until the glossary is intentionally synchronized, refuse the upload.
    if remote_rules.get("global", []) != local_rules.get("global", []):
        raise RuntimeError(
            "PC ve GitHub genel terim sözlükleri farklı. "
            "Önce sözlüğü eşitleyin; mevcut MP3'ler korunuyor."
        )
    previous_web = remote_manifest.get("entries", {}).get(key)
    if previous_web and any(
        previous_web.get(field) != candidate.get(field)
        for field in ("title", "journal", "pmid", "file")
    ):
        raise RuntimeError(
            "GitHub'da bu anahtara farklı makale bağlı; ses değiştirilmedi."
        )

    time_now = datetime.now(timezone.utc).isoformat()
    new_entry = {
        **candidate,
        "fingerprint": engine.fingerprint(record["signature"]),
        "generated_at": time_now,
    }
    merged_manifest = {
        **remote_manifest,
        "entries": {**remote_manifest.get("entries", {}), key: new_entry},
        "generated_at": time_now,
    }
    new_remote_rules = {
        **remote_rules,
        "articles": {
            **remote_rules.get("articles", {}),
            identity: dict(record["profile"]),
        },
    }

    mp3_relative = git_sync.AUDIO_PREFIX + key + ".mp3"
    selected_paths = (mp3_relative, git_sync.MANIFEST, git_sync.RULES)
    originals = {}
    for relative in selected_paths:
        target = root / relative
        originals[relative] = target.read_bytes() if target.is_file() else None
    git_sync.backup_files(root, home, selected_paths)

    # Stage only the selected audio and the two JSON files; no other change
    # may reach GitHub. All local bytes are restored after the push finishes.
    try:
        target = root / mp3_relative
        target.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            dir=target.parent, suffix=".mp3", prefix=".ahenk-web-choice-",
            delete=False
        ) as handle:
            staged = Path(handle.name)
        try:
            shutil.copyfile(source, staged)
            os.replace(staged, target)
        finally:
            staged.unlink(missing_ok=True)
        git_sync.save_json(root / git_sync.MANIFEST, merged_manifest)
        git_sync.save_json(root / git_sync.RULES, new_remote_rules)
        sent = git_sync._commit_and_push(root, selected_paths)
    finally:
        for relative, old in originals.items():
            dest = root / relative
            if old is None:
                dest.unlink(missing_ok=True)
            else:
                dest.parent.mkdir(parents=True, exist_ok=True)
                # Atomic replacement also minimizes the time a local player
                # might hold the accepted recording open.
                with tempfile.NamedTemporaryFile(
                    dir=dest.parent, prefix=".ahenk-local-restore-",
                    suffix=dest.suffix, delete=False
                ) as handle:
                    tmp = Path(handle.name)
                    handle.write(old)
                try:
                    os.replace(tmp, dest)
                finally:
                    tmp.unlink(missing_ok=True)
    return {
        "sent": bool(sent),
        "entry": new_entry,
        "message": (
            "Seçilen deneme GitHub'a yüklendi. WEB yayını doğrulanacak."
            if sent else "Seçilen deneme zaten GitHub'daki sürümle aynı."
        ),
    }
