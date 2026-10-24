#!/usr/bin/env python3
"""Recover an interrupted local podcast manifest, never deleting any MP3.
Back up damaged bytes before repair. Unverified local voices require review.
Stdlib only; can run before installing or updating the desktop app.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import uuid

MANIFEST = Path("public/podcast-audio/manifest.json")
MP3 = re.compile(r"[0-9a-f]{24}[.]mp3\Z")


def parse(raw):
    try:
        data = json.loads(raw.decode("utf-8-sig") if isinstance(raw, bytes) else raw)
    except (TypeError, ValueError, UnicodeError):
        return None
    return data if isinstance(data, dict) and data.get("version") == 1 and isinstance(data.get("entries"), dict) else None


def norm(value):
    value = str(value if value is not None else "").strip()
    return value.split(".")[0] if re.fullmatch(r"[0-9]+[.]0+", value) else value


def identity(raw, key):
    if not isinstance(raw, dict):
        return None
    try:
        title, journal = raw["title"], raw["journal"]
        if not isinstance(title, str) or not isinstance(journal, str) or not title or not journal:
            return None
        item = {"title": title, "journal": journal, "pmid": norm(raw.get("pmid")),
                "file": key + ".mp3"}
        source = json.dumps([journal, title, item["pmid"]], ensure_ascii=False, separators=(",", ":"))
        if hashlib.sha256(source.encode("utf-8")).hexdigest()[:24] != key:
            return None
        return item if raw.get("file", key + ".mp3") == item["file"] else None
    except (KeyError, TypeError):
        return None


def git(root, *args):
    try:
        p = subprocess.run(["git", "-C", str(root), *args], capture_output=True,
                           timeout=20, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        return p.stdout.strip() if p.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def local_catalog(home):
    try:
        data = json.loads((home / "makale_onbellek.json").read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        return {}
    if not isinstance(data, list) or len(data) > 500:
        return {}
    result = {}
    for raw in data:
        if not isinstance(raw, dict):
            continue
        title, journal = raw.get("title"), raw.get("journal")
        if not isinstance(title, str) or not isinstance(journal, str):
            continue
        pmid = norm(raw.get("pmid"))
        source = json.dumps([journal, title, pmid], ensure_ascii=False, separators=(",", ":"))
        key = hashlib.sha256(source.encode("utf-8")).hexdigest()[:24]
        item = identity({**raw, "pmid": pmid}, key)
        if item is not None:
            result[key] = item
    return result


def readable_audio(path):
    try:
        if path.stat().st_size <= 1024:
            return False
        with path.open("rb") as stream:
            head = stream.read(3)
        return head == b"ID3" or (len(head) >= 2 and head[0] == 255 and (head[1] & 224) == 224)
    except OSError:
        return False


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".ahenk-repair-")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as out:
            json.dump(value, out, ensure_ascii=False, indent=2)
            out.write("\n")
            out.flush()
            os.fsync(out.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def recover_if_invalid(root, home):
    root, home = Path(root), Path(home)
    target = root / MANIFEST
    original = target.read_bytes() if target.is_file() else None
    if original is not None and parse(original) is not None:
        return {"repaired": False, "reason": "valid"}
    local_mp3s = list(target.parent.glob("*.mp3")) if target.parent.is_dir() else []
    if original is None and not local_mp3s:
        return {"repaired": False, "reason": "new-install"}

    backup_dir = home / "kurtarma"
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup = ""
    if original is not None:
        backup_file = backup_dir / (
            "manifest_bozuk_" + datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            + "_" + uuid.uuid4().hex[:8] + ".json"
        )
        with backup_file.open("xb") as out:
            out.write(original)
            out.flush()
            os.fsync(out.fileno())
        backup = str(backup_file)

    head_bytes = git(root, "show", "HEAD:" + MANIFEST.as_posix())
    head = parse(head_bytes) if head_bytes is not None else None
    head = head or {"version": 1, "entries": {}}
    snapshots = []
    folder = home / "yedekler"
    if folder.is_dir():
        for path in folder.glob("*/public/podcast-audio/manifest.json"):
            try:
                item = parse(path.read_bytes())
                if item:
                    snapshots.append((path.stat().st_mtime, item))
            except OSError:
                continue
    snapshots.sort(key=lambda pair: pair[0], reverse=True)
    saved = [x[1] for x in snapshots[:120]]
    catalog = local_catalog(home)
    entries = {key: dict(item) for key, item in head["entries"].items()
               if isinstance(key, str) and identity(item, key)}
    matched, unverified, unmatched = 0, 0, 0
    for path in local_mp3s:
        if not MP3.fullmatch(path.name) or not readable_audio(path):
            unmatched += 1
            continue
        key = path.stem
        last = next((s["entries"].get(key) for s in saved if identity(s["entries"].get(key), key)), None)
        original_entry = head["entries"].get(key)
        meta = catalog.get(key) or identity(last, key) or identity(original_entry, key)
        if meta is None:
            unmatched += 1
            continue
        local_hash = git(root, "hash-object", str(path))
        head_hash = git(root, "rev-parse", "HEAD:" + (MANIFEST.parent / path.name).as_posix())
        if identity(original_entry, key) and local_hash and local_hash == head_hash:
            entries[key] = dict(original_entry)
        else:
            # Unknown local editing history: preserve audio but DO NOT
            # automatically publish it as an approved pronunciation.
            entries[key] = {
                **meta, "fingerprint": "unknown-recovered",
                "generated_at": datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()
            }
            unverified += 1
        matched += 1
    atomic_json(target, {
        "version": 1, "generated_at": datetime.now(timezone.utc).isoformat(),
        "entries": entries
    })
    return {"repaired": True, "backup": backup, "entries": len(entries),
            "local_mp3s": len(local_mp3s), "matched_mp3s": matched,
            "needs_review": unverified, "unmatched_mp3s_kept": unmatched}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--home", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(recover_if_invalid(args.root, args.home), ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
