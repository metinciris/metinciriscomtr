#!/usr/bin/env python3
"""Incrementally pre-render Ahenk Cep MP3s for all active podcast titles.

A standard-library-only preflight runs BEFORE installing any TTS dependencies.
Each scheduled run renders at most five missing/expired titles. Existing clips
remain available and retired titles are deleted only after safe planning.
"""
import argparse
from collections import OrderedDict, deque
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
BATCH_SIZE = 5
MIN_EXPECTED_ARTICLES = 20
MP3_NAME = re.compile(r'^[a-f0-9]{24}[.]mp3MAX_AGE_DAYS = 90
AUDIO_DIR = Path("public/podcast-audio")
MANIFEST_PATH = AUDIO_DIR / "manifest.json"
MODEL_REVISION = "ahenk-cep-tr-2026-10-18"
PRONUNCIATION_REVISION = "tr-v1"


def spoken(text):
    out = re.sub(r"\bH\s*&\s*E\b", "Hematoksilen Eozin", text, flags=re.I)
    for n in ("53", "16", "40", "63", "57"):
        out = re.sub(r"\bp\s*-?\s*" + n + r"\b", "pe " + n, out, flags=re.I)
    return re.sub(r"\bEwing\b", "Yuing", out, flags=re.I)


def normalize_pmid(value):
    """Google Sheets often gives a numeric PMID as 42874744.0, not 42874744."""
    raw = str(value if value is not None else "").strip()
    return re.sub(r"\.0+$", "", raw) if re.fullmatch(r"[0-9]+\.0+", raw) else raw


def key_for(journal, title, pmid):
    payload = json.dumps([journal, title, normalize_pmid(pmid)], ensure_ascii=False, separators=(",", ":"))
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
            articles.append({"title": title, "journal": journal, "pmid": normalize_pmid(value(5))})
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


def catalog(articles):
    """Every currently listed title is eligible; preserve insertion order."""
    entries = OrderedDict()
    for article in articles:
        key = key_for(article["journal"], article["title"], article["pmid"])
        if key in entries:
            continue
        entries[key] = {
            "title": article["title"],
            "journal": article["journal"],
            "pmid": article["pmid"],
            "fingerprint": fingerprint(spoken(article["title"])),
            "file": key + ".mp3",
        }
    return entries


def playable(previous, candidate):
    if not isinstance(previous, dict):
        return False
    name = previous.get("file")
    if not isinstance(name, str) or not MP3_NAME.fullmatch(name):
        return False
    if name != candidate["file"] or (
        previous.get("title") != candidate["title"]
        or previous.get("journal") != candidate["journal"]
        or normalize_pmid(previous.get("pmid")) != candidate["pmid"]
    ):
        return False
    path = AUDIO_DIR / name
    return path.is_file() and path.stat().st_size > 1024


def fresh(previous, candidate, now):
    if not playable(previous, candidate):
        return False
    if previous.get("fingerprint") != candidate["fingerprint"]:
        return False
    try:
        t = datetime.fromisoformat(previous["generated_at"])
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        age = now - t.astimezone(timezone.utc)
        return timedelta(0) <= age < timedelta(days=MAX_AGE_DAYS)
    except (KeyError, TypeError, ValueError):
        return False


def round_robin_journals(entries, pending_keys, limit):
    """Make progress across journals, not only the first source rows."""
    groups = OrderedDict()
    for key in pending_keys:
        groups.setdefault(entries[key]["journal"], deque()).append(key)
    selected = []
    while len(selected) < limit and any(groups.values()):
        for queue in groups.values():
            if queue and len(selected) < limit:
                selected.append(queue.popleft())
    return selected


def plan_updates(articles, manifest, now):
    if len(articles) < MIN_EXPECTED_ARTICLES:
        raise RuntimeError(
            f"Only {len(articles)} articles returned from Sheets; "
            "refusing to delete audio on potentially incomplete source data"
        )
    entries = catalog(articles)
    old = manifest["entries"]
    keys = set(entries)
    still_listed = len(set(old) & keys)
    if len(old) >= 20 and still_listed * 2 < len(old):
        raise RuntimeError(
            "Over half of cached titles disappeared from Sheets; "
            "refusing bulk deletion without source review"
        )

    missing = []
    due_for_refresh = []
    for key, article in entries.items():
        previous = old.get(key)
        if not playable(previous, article):
            missing.append(key)
        elif not fresh(previous, article, now):
            due_for_refresh.append(key)

    selection = round_robin_journals(entries, missing, BATCH_SIZE)
    if len(selection) < BATCH_SIZE:
        selection += round_robin_journals(
            entries, due_for_refresh, BATCH_SIZE - len(selection)
        )
    removed = [key for key in old if key not in keys]

    active_files = {
        article["file"] for key, article in entries.items()
        if playable(old.get(key), article)
    }
    orphans = sorted(
        p.name for p in AUDIO_DIR.glob("*.mp3")
        if MP3_NAME.fullmatch(p.name) and p.name not in active_files
    )
    return {
        "version": 1,
        "candidates": entries,
        "selected": selection,
        "removed": removed,
        "orphans": orphans,
        "total": len(entries),
        "ready": sum(playable(old.get(key), article)
                     for key, article in entries.items()),
        "missing": len(missing),
        "refresh": len(due_for_refresh),
        "has_changes": bool(selection or removed or orphans),
    }


def execute_plan(plan):
    """Stage the entire small batch before replacing or deleting live files."""
    if plan.get("version") != 1:
        raise RuntimeError("Unknown generation plan")
    selected = plan["selected"]
    candidates = plan["candidates"]
    if (len(selected) > BATCH_SIZE or len(set(selected)) != len(selected)
            or any(key not in candidates for key in selected)):
        raise RuntimeError("Unsafe batch or unknown audio key")

    previous = load_manifest()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc)
    # Do not lose previously cached clips while the backlog is being filled.
    entries = {
        key: dict(previous["entries"][key])
        for key, article in candidates.items()
        if playable(previous["entries"].get(key), article)
    }

    tts = create_tts() if selected else None
    with tempfile.TemporaryDirectory(prefix=".podcast-staging-", dir=AUDIO_DIR) as staging:
        staged = []
        for key in selected:
            article = candidates[key]
            destination = Path(staging) / article["file"]
            render_clip(tts, spoken(article["title"]), destination)
            staged.append((key, destination))
            print("Prepared", key, article["journal"], flush=True)

        for key, file in staged:
            article = candidates[key]
            os.replace(file, AUDIO_DIR / article["file"])
            entries[key] = {**article, "generated_at": now.isoformat()}

    if entries != previous["entries"]:
        updated = {
            "version": 1,
            "generated_at": now.isoformat(),
            "entries": entries,
        }
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", prefix=".manifest-",
            suffix=".json", dir=AUDIO_DIR, delete=False
        ) as file:
            temporary = file.name
            json.dump(updated, file, ensure_ascii=False, indent=2)
            file.write("\n")
        os.replace(temporary, MANIFEST_PATH)

    # Retired titles and orphan files are removed only after successful
    # source validation and successful synthesis of *all* selected clips.
    keep = {entry["file"] for entry in entries.values()}
    for file in AUDIO_DIR.glob("*.mp3"):
        if MP3_NAME.fullmatch(file.name) and file.name not in keep:
            file.unlink()
            print("Removed obsolete", file.name, flush=True)
    print(f"Available ready MP3: {len(entries)} / {len(candidates)}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--plan", action="store_true")
    mode.add_argument("--execute", action="store_true")
    parser.add_argument("--plan-file", type=Path, required=True)
    parser.add_argument("--github-output")
    args = parser.parse_args()

    if args.plan:
        now = datetime.now(timezone.utc)
        # A failed Google Sheets request must NOT change/delete old audio.
        articles = load_sheet()
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        plan = plan_updates(articles, load_manifest(), now)
        args.plan_file.write_text(
            json.dumps(plan, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        line = (
            f"Podcast {plan['ready']}/{plan['total']} ready; "
            f"{len(plan['selected'])} selected for this batch; "
            f"{plan['missing']} missing, {plan['refresh']} due, "
            f"{len(plan['removed'])} retired."
        )
        print(line, flush=True)
        if args.github_output:
            with open(args.github_output, "a", encoding="utf-8") as f:
                f.write(
                    f"needs_model={'true' if plan['selected'] else 'false'}\n"
                    f"has_changes={'true' if plan['has_changes'] else 'false'}\n"
                )
        if summary := os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(summary, "a", encoding="utf-8") as f:
                f.write("### Ahenk podcast hazır sesler\n\n" + line + "\n\n")
                f.write("Model yalnızca gerektiğinde kurulur; "
                        "hazır kayıtlar korunur.\n")
    else:
        plan = json.loads(args.plan_file.read_text(encoding="utf-8"))
        if plan["has_changes"]:
            execute_plan(plan)
        else:
            print("No audio changes; skipping model and deployment.", flush=True)


if __name__ == "__main__":
    main()
)
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


def normalize_pmid(value):
    """Google Sheets often gives a numeric PMID as 42874744.0, not 42874744."""
    raw = str(value if value is not None else "").strip()
    return re.sub(r"\.0+$", "", raw) if re.fullmatch(r"[0-9]+\.0+", raw) else raw


def key_for(journal, title, pmid):
    payload = json.dumps([journal, title, normalize_pmid(pmid)], ensure_ascii=False, separators=(",", ":"))
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
            articles.append({"title": title, "journal": journal, "pmid": normalize_pmid(value(5))})
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


def catalog(articles):
    """Every currently listed title is eligible; preserve insertion order."""
    entries = OrderedDict()
    for article in articles:
        key = key_for(article["journal"], article["title"], article["pmid"])
        if key in entries:
            continue
        entries[key] = {
            "title": article["title"],
            "journal": article["journal"],
            "pmid": article["pmid"],
            "fingerprint": fingerprint(spoken(article["title"])),
            "file": key + ".mp3",
        }
    return entries


def playable(previous, candidate):
    if not isinstance(previous, dict):
        return False
    name = previous.get("file")
    if not isinstance(name, str) or not MP3_NAME.fullmatch(name):
        return False
    if name != candidate["file"] or (
        previous.get("title") != candidate["title"]
        or previous.get("journal") != candidate["journal"]
        or normalize_pmid(previous.get("pmid")) != candidate["pmid"]
    ):
        return False
    path = AUDIO_DIR / name
    return path.is_file() and path.stat().st_size > 1024


def fresh(previous, candidate, now):
    if not playable(previous, candidate):
        return False
    if previous.get("fingerprint") != candidate["fingerprint"]:
        return False
    try:
        t = datetime.fromisoformat(previous["generated_at"])
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)
        age = now - t.astimezone(timezone.utc)
        return timedelta(0) <= age < timedelta(days=MAX_AGE_DAYS)
    except (KeyError, TypeError, ValueError):
        return False


def round_robin_journals(entries, pending_keys, limit):
    """Make progress across journals, not only the first source rows."""
    groups = OrderedDict()
    for key in pending_keys:
        groups.setdefault(entries[key]["journal"], deque()).append(key)
    selected = []
    while len(selected) < limit and any(groups.values()):
        for queue in groups.values():
            if queue and len(selected) < limit:
                selected.append(queue.popleft())
    return selected


def plan_updates(articles, manifest, now):
    if len(articles) < MIN_EXPECTED_ARTICLES:
        raise RuntimeError(
            f"Only {len(articles)} articles returned from Sheets; "
            "refusing to delete audio on potentially incomplete source data"
        )
    entries = catalog(articles)
    old = manifest["entries"]
    keys = set(entries)
    still_listed = len(set(old) & keys)
    if len(old) >= 20 and still_listed * 2 < len(old):
        raise RuntimeError(
            "Over half of cached titles disappeared from Sheets; "
            "refusing bulk deletion without source review"
        )

    missing = []
    due_for_refresh = []
    for key, article in entries.items():
        previous = old.get(key)
        if not playable(previous, article):
            missing.append(key)
        elif not fresh(previous, article, now):
            due_for_refresh.append(key)

    selection = round_robin_journals(entries, missing, BATCH_SIZE)
    if len(selection) < BATCH_SIZE:
        selection += round_robin_journals(
            entries, due_for_refresh, BATCH_SIZE - len(selection)
        )
    removed = [key for key in old if key not in keys]

    active_files = {
        article["file"] for key, article in entries.items()
        if playable(old.get(key), article)
    }
    orphans = sorted(
        p.name for p in AUDIO_DIR.glob("*.mp3")
        if MP3_NAME.fullmatch(p.name) and p.name not in active_files
    )
    return {
        "version": 1,
        "candidates": entries,
        "selected": selection,
        "removed": removed,
        "orphans": orphans,
        "total": len(entries),
        "ready": sum(playable(old.get(key), article)
                     for key, article in entries.items()),
        "missing": len(missing),
        "refresh": len(due_for_refresh),
        "has_changes": bool(selection or removed or orphans),
    }


def execute_plan(plan):
    """Stage the entire small batch before replacing or deleting live files."""
    if plan.get("version") != 1:
        raise RuntimeError("Unknown generation plan")
    selected = plan["selected"]
    candidates = plan["candidates"]
    if (len(selected) > BATCH_SIZE or len(set(selected)) != len(selected)
            or any(key not in candidates for key in selected)):
        raise RuntimeError("Unsafe batch or unknown audio key")

    previous = load_manifest()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc)
    # Do not lose previously cached clips while the backlog is being filled.
    entries = {
        key: dict(previous["entries"][key])
        for key, article in candidates.items()
        if playable(previous["entries"].get(key), article)
    }

    tts = create_tts() if selected else None
    with tempfile.TemporaryDirectory(prefix=".podcast-staging-", dir=AUDIO_DIR) as staging:
        staged = []
        for key in selected:
            article = candidates[key]
            destination = Path(staging) / article["file"]
            render_clip(tts, spoken(article["title"]), destination)
            staged.append((key, destination))
            print("Prepared", key, article["journal"], flush=True)

        for key, file in staged:
            article = candidates[key]
            os.replace(file, AUDIO_DIR / article["file"])
            entries[key] = {**article, "generated_at": now.isoformat()}

    if entries != previous["entries"]:
        updated = {
            "version": 1,
            "generated_at": now.isoformat(),
            "entries": entries,
        }
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", prefix=".manifest-",
            suffix=".json", dir=AUDIO_DIR, delete=False
        ) as file:
            temporary = file.name
            json.dump(updated, file, ensure_ascii=False, indent=2)
            file.write("\n")
        os.replace(temporary, MANIFEST_PATH)

    # Retired titles and orphan files are removed only after successful
    # source validation and successful synthesis of *all* selected clips.
    keep = {entry["file"] for entry in entries.values()}
    for file in AUDIO_DIR.glob("*.mp3"):
        if MP3_NAME.fullmatch(file.name) and file.name not in keep:
            file.unlink()
            print("Removed obsolete", file.name, flush=True)
    print(f"Available ready MP3: {len(entries)} / {len(candidates)}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--plan", action="store_true")
    mode.add_argument("--execute", action="store_true")
    parser.add_argument("--plan-file", type=Path, required=True)
    parser.add_argument("--github-output")
    args = parser.parse_args()

    if args.plan:
        now = datetime.now(timezone.utc)
        # A failed Google Sheets request must NOT change/delete old audio.
        articles = load_sheet()
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        plan = plan_updates(articles, load_manifest(), now)
        args.plan_file.write_text(
            json.dumps(plan, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        line = (
            f"Podcast {plan['ready']}/{plan['total']} ready; "
            f"{len(plan['selected'])} selected for this batch; "
            f"{plan['missing']} missing, {plan['refresh']} due, "
            f"{len(plan['removed'])} retired."
        )
        print(line, flush=True)
        if args.github_output:
            with open(args.github_output, "a", encoding="utf-8") as f:
                f.write(
                    f"needs_model={'true' if plan['selected'] else 'false'}\n"
                    f"has_changes={'true' if plan['has_changes'] else 'false'}\n"
                )
        if summary := os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(summary, "a", encoding="utf-8") as f:
                f.write("### Ahenk podcast hazır sesler\n\n" + line + "\n\n")
                f.write("Model yalnızca gerektiğinde kurulur; "
                        "hazır kayıtlar korunur.\n")
    else:
        plan = json.loads(args.plan_file.read_text(encoding="utf-8"))
        if plan["has_changes"]:
            execute_plan(plan)
        else:
            print("No audio changes; skipping model and deployment.", flush=True)


if __name__ == "__main__":
    main()
