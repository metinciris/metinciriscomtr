"""Safe, persistent per-article Ahenk preview list and relevant pronunciations.

The preview history is kept separately from approved PC audio and WEB audio.
A preview is never considered accepted or published merely because it exists.
"""
from datetime import datetime
from pathlib import Path
import json
import os
import re
import tempfile


KEY = re.compile(r"[0-9a-f]{24}\Z")
SAFE_NEW_CLIP = re.compile(r"([0-9a-f]{24})_([0-9a-f]{32})_deneme\.mp3\Z")


def _valid_audio(path):
    try:
        if not path.is_file() or path.stat().st_size <= 1024:
            return False
        with path.open("rb") as audio:
            head = audio.read(3)
        return head == b"ID3" or (
            len(head) >= 2 and head[0] == 255 and head[1] & 0xe0 == 0xe0
        )
    except OSError:
        return False


def save_record(folder, key, mp3, profile, signature):
    """Save exact recording inputs atomically, after MP3 synthesis completed."""
    folder = Path(folder)
    mp3 = Path(mp3)
    if not KEY.fullmatch(key) or mp3.parent.resolve() != folder.resolve():
        raise ValueError("Deneme kaydının yolu geçersiz.")
    if not SAFE_NEW_CLIP.fullmatch(mp3.name) or not mp3.name.startswith(key + "_"):
        raise ValueError("Beklenmeyen deneme MP3 adı.")
    if not _valid_audio(mp3):
        raise RuntimeError("Deneme MP3'ü henüz hazır değil.")
    if (not isinstance(profile, dict) or
            not isinstance(profile.get("text"), str) or
            not 1 <= len(profile["text"].strip()) <= 3000 or
            not isinstance(profile.get("speed"), (int, float)) or
            isinstance(profile["speed"], bool) or
            not 0.80 <= profile["speed"] <= 1.20 or
            not isinstance(signature, str)):
        raise ValueError("Deneme sesinin okuma ayarları geçersiz.")
    data = {
        "version": 1, "key": key, "file": mp3.name,
        "profile": profile, "signature": signature,
        "created_at": datetime.fromtimestamp(mp3.stat().st_mtime).astimezone().isoformat(),
    }
    sidecar = mp3.with_suffix(".json")
    fd, name = tempfile.mkstemp(
        dir=folder, prefix=".ahenk-preview-", suffix=".json"
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(data, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
        os.replace(name, sidecar)
    finally:
        if os.path.exists(name):
            os.unlink(name)
    return data


def previews_for_article(folder, key, limit=12):
    """Return recently created MP3s for this article only, newest first."""
    if not KEY.fullmatch(str(key)):
        return []
    folder = Path(folder)
    files = list(folder.glob(key + "_*_deneme.mp3"))
    legacy = folder / (key + "_deneme.mp3")
    if legacy.exists():
        files.append(legacy)
    candidates = [file for file in files if file.is_file()]
    candidates.sort(key=lambda file: file.stat().st_mtime, reverse=True)
    output = []
    for file in candidates[:max(0, min(100, limit))]:
        if not _valid_audio(file):
            continue
        record = None
        sidecar = file.with_suffix(".json")
        if SAFE_NEW_CLIP.fullmatch(file.name) and sidecar.is_file():
            try:
                candidate = json.loads(sidecar.read_text(encoding="utf-8-sig"))
                profile = candidate.get("profile")
                if (candidate.get("version") == 1 and candidate.get("key") == key and
                    candidate.get("file") == file.name and
                    isinstance(candidate.get("signature"), str) and
                    isinstance(profile, dict) and isinstance(profile.get("text"), str) and
                    1 <= len(profile["text"].strip()) <= 3000 and
                    isinstance(profile.get("speed"), (int, float)) and
                    not isinstance(profile["speed"], bool) and
                    0.80 <= profile["speed"] <= 1.20):
                    record = candidate
            except (OSError, ValueError, TypeError, AttributeError):
                pass
        output.append({
            "path": file,
            "created": datetime.fromtimestamp(file.stat().st_mtime).strftime("%d.%m %H:%M:%S"),
            "bytes": file.stat().st_size,
            "record": record,
        })
    return output


def recent_previews(folder, limit=40):
    """Return recent previews across all articles for a small browse window."""
    folder = Path(folder)
    recent = []
    for file in folder.glob("*_deneme.mp3"):
        match = SAFE_NEW_CLIP.fullmatch(file.name)
        if match:
            recent.append((file.stat().st_mtime, match.group(1), file))
    recent.sort(key=lambda entry: entry[0], reverse=True)
    return recent[:max(0, min(limit, 100))]


def applicable_rules(text, rules):
    """Mirror the sequential replacement and whole_word semantics of speech()."""
    output = []
    current = str(text)
    for rule in rules.get("global", []):
        find = rule.get("find") if isinstance(rule, dict) else None
        say = rule.get("say") if isinstance(rule, dict) else None
        if not isinstance(find, str) or not find or not isinstance(say, str):
            continue
        pattern = re.escape(find)
        if rule.get("whole_word", True):
            pattern = r"(?<!\w)" + pattern + r"(?!\w)"
        if re.search(pattern, current, flags=re.IGNORECASE):
            output.append(rule)
            current = re.sub(
                pattern,
                lambda _match, replacement=say: replacement,
                current, flags=re.IGNORECASE,
            )
    return output
