"""Two-stage website-missing audio workflow (stdlib only).

Stage 1: Keep existing local MP3s and synthesize only missing ones.
Stage 2: Publish only titles absent from the LIVE website and track deployment.

All selectors derive from the current Sheets catalog and the actual website
manifest. A cached web manifest must never authorize publishing.
"""
from datetime import datetime, timezone
from pathlib import Path
import json
import os
import tempfile


STATE_NAME = "web_yayin_durumu.json"


def missing_on_web(catalog, manifest):
    """Validate identity on collision and return only titles not on website."""
    entries = manifest.get("entries")
    if manifest.get("version") != 1 or not isinstance(entries, dict):
        raise RuntimeError("WEB'deki manifest doğrulanamadı; işlem durduruldu.")
    missing = []
    for key, candidate in catalog.items():
        item = entries.get(key)
        if item is None:
            missing.append(key)
            continue
        if not isinstance(item, dict) or (
            item.get("file") != candidate.get("file") or
            item.get("title") != candidate.get("title") or
            item.get("journal") != candidate.get("journal") or
            str(item.get("pmid") or "").removesuffix(".0") != str(candidate.get("pmid") or "")
        ):
            raise RuntimeError("WEB'deki makale eşleşmiyor: " + candidate["title"][:90])
    return missing


def plan(catalog, manifest, is_local):
    keys = missing_on_web(catalog, manifest)
    missing_pc = [key for key in keys if not is_local(key)]
    local_ready = [key for key in keys if is_local(key)]
    return {
        "total_articles": len(catalog),
        "web_count": len(catalog) - len(keys),
        "web_missing": keys,
        "ready_pc": local_ready,
        "generate_pc": missing_pc,
    }


def new_progress(keys):
    keys = list(dict.fromkeys(keys))
    return {
        "version": 1,
        "started": datetime.now(timezone.utc).isoformat(),
        "phase": "hazırlanıyor",
        "target_keys": keys,
        "github_sent": [],
        "website_confirmed": [],
        "expected": {},
        "last_error": "",
    }


def state_path(home):
    return Path(home) / STATE_NAME


def save_progress(home, progress):
    path = state_path(home)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(dir=path.parent, prefix=".web-progress-", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(progress, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)
    return path


def read_progress(home):
    path = state_path(home)
    try:
        raw = json.loads(path.read_text(encoding="utf-8-sig"))
        if not isinstance(raw, dict) or raw.get("version") != 1:
            return None
        keys = raw.get("target_keys")
        sent = raw.get("github_sent")
        expected = raw.get("expected")
        if not isinstance(keys, list) or not isinstance(sent, list) or not isinstance(expected, dict):
            return None
        if len(keys) > 500 or any(not isinstance(k, str) for k in keys + sent):
            return None
        return raw
    except (OSError, ValueError, TypeError):
        return None


def verified_on_web(progress, live_manifest):
    """Require the exact manifest entry, not just the presence of a key."""
    entries = live_manifest.get("entries", {})
    expected = progress.get("expected", {})
    sent = progress.get("github_sent", [])
    return [key for key in sent
            if key in expected and entries.get(key) == expected[key]]


def progress_label(progress):
    expected = progress.get("target_keys", [])
    sent = progress.get("github_sent", [])
    published = progress.get("website_confirmed", [])
    return (f"GitHub: {len(sent)}/{len(expected)} gönderildi    •    "
            f"WEB'de doğrulandı: {len(published)}/{len(expected)}")
