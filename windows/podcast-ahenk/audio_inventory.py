"""Non-destructive inventory of podcast audio on a Windows PC.

Source of identity is the current Google Sheets article catalog; the file name
is the 24-hex key. A downloaded MP3 never implies that its pronunciation has
been approved. Only explicit user actions can publish audio to the website.

Importantly, local MP3 files are not deleted because a manifest entry is lost.
"""
from datetime import datetime, timezone
from pathlib import Path
import json
import os

from scripts import render_podcast_audio as engine


def present(root, key):
    """A minimal physical-file check, independent of manifest bookkeeping."""
    path = Path(root) / "public" / "podcast-audio" / (key + ".mp3")
    if not path.is_file() or path.stat().st_size <= 1024:
        return False
    with path.open("rb") as stream:
        header = stream.read(3)
    return header == b"ID3" or (
        len(header) >= 2 and header[0] == 255 and (header[1] & 224) == 224
    )


def inventory(root, catalog, manifest, web_manifest):
    """Return row statuses and counts WITHOUT starting Git or contacting web."""
    loc = manifest.get("entries", {})
    web = web_manifest.get("entries", {})
    rows = {}
    counts = {
        "all": len(catalog), "web": 0, "web_missing": 0,
        "pc": 0, "pc_missing": 0, "unregistered": 0,
        "publish_ready": 0, "pc_pending": 0,
    }
    audio_dir = Path(root) / "public" / "podcast-audio"
    for key, candidate in catalog.items():
        available = present(root, key)
        entry = loc.get(key)
        registered = (
            available and isinstance(entry, dict) and
            entry.get("file") == key + ".mp3" and
            entry.get("title") == candidate["title"] and
            entry.get("journal") == candidate["journal"] and
            engine.normalize_pmid(entry.get("pmid")) == candidate["pmid"]
        )
        online = web.get(key)
        on_web = isinstance(online, dict) and online.get("file") == key + ".mp3"
        if on_web:
            counts["web"] += 1
        else:
            counts["web_missing"] += 1
        if available:
            counts["pc"] += 1
            if not registered:
                counts["unregistered"] += 1
        else:
            counts["pc_missing"] += 1
        # An already published identical version doesn't need a second push.
        # A recovered/unregistered PC MP3 still requires explicit listening
        # and user approval before upload.
        ready_for_web = available and (
            not on_web or not registered or
            entry.get("fingerprint") != online.get("fingerprint") or
            entry.get("generated_at") != online.get("generated_at")
        )
        if ready_for_web:
            counts["publish_ready"] += 1
        # A real MP3 exists locally, but the current website has no entry.
        # Its separate GitHub-upload status is managed by two_step_audio.
        pc_pending = available and not on_web
        if pc_pending:
            counts["pc_pending"] += 1
        rows[key] = {
            "candidate": candidate,
            "web": on_web,
            "pc": available,
            "publish_ready": ready_for_web,
            "pc_pending": pc_pending,
            "registered": registered,
            "web_entry": online if on_web else None,
            "local_entry": entry if registered else None,
            "file": audio_dir / (key + ".mp3"),
        }
    return rows, counts


def restore_missing_entries(root, catalog, keys, backup_dir):
    """Repair known MP3 filenames lacking a valid manifest entry.

    Only article keys supplied by the current Sheets catalog are allowed.
    Use MP3 mtime as an informational estimate, and mark the fingerprint as
    unknown, so this repair cannot falsely claim the audio matches new
    pronunciation rules. Never delete or re-synthesize any MP3.
    """
    root = Path(root)
    manifest_path = root / "public" / "podcast-audio" / "manifest.json"
    if manifest_path.is_file():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8-sig"))
    else:
        manifest = {"version": 1, "entries": {}}
    if manifest.get("version") != 1 or not isinstance(manifest.get("entries"), dict):
        raise RuntimeError("Yerel manifest bozuk; hiçbir MP3 silinmedi.")
    keys = tuple(dict.fromkeys(keys))
    repairs = []
    for key in keys:
        if key not in catalog:
            raise RuntimeError("Bu MP3 güncel makale listesinde bulunamadı: " + key)
        if not present(root, key):
            raise RuntimeError("Seçilen makaleye ait MP3 yok veya geçersiz: " + key)
        candidate = catalog[key]
        old = manifest["entries"].get(key)
        if isinstance(old, dict) and all([
            old.get("file") == candidate["file"],
            old.get("title") == candidate["title"],
            old.get("journal") == candidate["journal"],
            engine.normalize_pmid(old.get("pmid")) == candidate["pmid"],
        ]):
            continue
        path = root / "public" / "podcast-audio" / candidate["file"]
        estimate = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()
        repairs.append((key, {**candidate, "fingerprint": "unknown-recovered",
                              "generated_at": estimate}))
    if not repairs:
        return 0
    from git_sync import backup_files, save_json
    backup_files(root, backup_dir, ["public/podcast-audio/manifest.json"])
    for key, reconstructed in repairs:
        manifest["entries"][key] = reconstructed
    manifest["generated_at"] = datetime.now(timezone.utc).isoformat()
    save_json(manifest_path, manifest)
    return len(repairs)
