#!/usr/bin/env python3
"""Pre-render a small podcast audio pilot; fail closed on source/model errors.

Source: same Google Sheets gviz data as src/pages/Podcast.tsx.
Only the first PILOT_COUNT titles get pre-rendered. Missing/expired clips are
removed only after successful source retrieval and successful synthesis.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen

SHEET_ID = "148p3M41R52gVVjtLSF2Qh8rJvBPEWJ7SV4lgSBQYwLc"
GID = "1109640564"
RANGE = "A1:F132"
JOURNAL_ROWS = {0, 11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 121}
PILOT_COUNT = 5
MAX_AGE_DAYS = 90
AUDIO_DIR = Path("public/podcast-audio")
MANIFEST_PATH = AUDIO_DIR / "manifest.json"
MODEL_REVISION = "ahenk-cep-tr-2026-10-18"
PRONUNCIATION_REVISION = "tr-v1"


def spoken(text):
    out = re.sub(r"\bH\s*&\s*E\b", "Hematoksilen Eozin", text, flags=re.I)
    for n in ("53", "16", "40", "63", "57"):
        out = re.sub(r"\bp\s*-?\s*" + n + r"\b", "pe " + n, out, flags=re.I)
    return re.sub(r"\bEwing\b", "Yuing", out, flags=re.I)


def key_for(journal, title, pmid):
    payload = json.dumps([journal, title, pmid], ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


def fingerprint(text):
    return hashlib.sha256(
        (MODEL_REVISION + "|" + PRONUNCIATION_REVISION + "|" + text).encode("utf-8")
    ).hexdigest()


def collect_articles(data):
    rows = data["table"]["rows"]
    journal = ""
    articles = []
    for i, row in enumerate(rows):
        c = row.get("c") or []
        def value(j):
            if j >= len(c) or not c[j]:
                return ""
            return str(c[j].get("v") or "").strip()
        title = value(0)
        if i in JOURNAL_ROWS:
            journal = title
        elif len(title) > 10:
            articles.append({"title": title, "journal": journal, "pmid": value(5)})
    if not articles:
        raise RuntimeError("No podcast articles returned; cache preserved")
    return articles


def load_sheet():
    url = ("https://docs.google.com/spreadsheets/d/" + SHEET_ID
           + "/gviz/tq?tqx=out:json&gid=" + GID + "&range=" + RANGE + "&headers=0")
    with urlopen(url, timeout=35) as response:
        raw = response.read().decode("utf-8")
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end < start:
        raise RuntimeError("Unexpected Google Sheets response; cache preserved")
    data = json.loads(raw[start:end + 1])
    return collect_articles(data)


def load_manifest():
    if not MANIFEST_PATH.is_file():
        return {"version": 1, "entries": {}}
    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if data.get("version") != 1 or not isinstance(data.get("entries"), dict):
        raise RuntimeError("Unexpected manifest format; refusing cleanup")
    return data


def create_tts():
    from huggingface_hub import snapshot_download
    import sys
    model_dir = snapshot_download(
        "ozgurguler/ahenk-cep-tr",
        allow_patterns=["student.pt", "decoder.pt", "ahenk_cep.py"],
    )
    sys.path.insert(0, model_dir)
    from ahenk_cep import AhenkCep
    return AhenkCep(str(Path(model_dir) / "student.pt"),
                    str(Path(model_dir) / "decoder.pt"))


def render_clip(tts, text, destination):
    import numpy as np
    import soundfile as sf
    audio, sample_rate = tts.say(text, style="neutral", steps=16, speed=1.0, seed=0)
    if len(audio) < sample_rate // 4 or not np.isfinite(audio).all():
        raise RuntimeError("Model produced invalid audio; cache preserved")
    with tempfile.TemporaryDirectory() as tempdir:
        wav = Path(tempdir) / "audio.wav"
        mp3 = Path(tempdir) / "audio.mp3"
        sf.write(wav, audio, sample_rate)
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
             "-i", str(wav), "-vn", "-codec:a", "libmp3lame",
             "-qscale:a", "4", str(mp3)],
            check=True,
        )
        if mp3.stat().st_size < 1024:
            raise RuntimeError("Unexpectedly short MP3")
        os.replace(mp3, destination)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    articles = load_sheet()
    old = load_manifest()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    selected = articles[:PILOT_COUNT]
    candidates = {}
    for article in selected:
        key = key_for(article["journal"], article["title"], article["pmid"])
        text = spoken(article["title"])
        candidates[key] = {
            "title": article["title"], "journal": article["journal"],
            "pmid": article["pmid"], "fingerprint": fingerprint(text),
            "file": key + ".mp3",
        }
    if args.dry_run:
        print(json.dumps({"selected": len(candidates), "titles": [e["title"] for e in candidates.values()]},
                         ensure_ascii=False, indent=2))
        return
    pending = []
    for key, entry in candidates.items():
        previous = old["entries"].get(key, {})
        path = AUDIO_DIR / entry["file"]
        try:
            timestamp = datetime.fromisoformat(previous["generated_at"])
            valid_age = now - timestamp < timedelta(days=MAX_AGE_DAYS)
        except (KeyError, ValueError, TypeError):
            valid_age = False
        if path.is_file() and path.stat().st_size > 1024 and valid_age and previous.get("fingerprint") == entry["fingerprint"]:
            entry["generated_at"] = previous["generated_at"]
        else:
            pending.append((key, entry))
    print(f"Podcast audio: {len(candidates)} selected, {len(pending)} to generate.", flush=True)
    tts = create_tts() if pending else None
    with tempfile.TemporaryDirectory(dir=AUDIO_DIR) as staging:
        staged = []
        for key, entry in pending:
            path = Path(staging) / entry["file"]
            render_clip(tts, spoken(entry["title"]), path)
            entry["generated_at"] = now.isoformat()
            staged.append((path, AUDIO_DIR / entry["file"]))
            print("Prepared", key, flush=True)
        # Commit only after every clip is valid.
        for source, destination in staged:
            os.replace(source, destination)
    updated = {"version": 1, "generated_at": now.isoformat(), "entries": candidates}
    temp_manifest = AUDIO_DIR / "manifest.json.tmp"
    temp_manifest.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temp_manifest, MANIFEST_PATH)
    # Delete all audio files that are no longer present in the selected source list.
    keep = {entry["file"] for entry in candidates.values()}
    for file in AUDIO_DIR.glob("*.mp3"):
        if file.name not in keep:
            file.unlink()
            print("Removed obsolete", file.name)
    print("Podcast audio manifest refreshed.", flush=True)


if __name__ == "__main__":
    main()
