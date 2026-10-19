"""Read-only status and MP3 download from the *live* podcast website.

Website deployment may trail a GitHub push. Keep site audio separate from
the Git working tree, so listening to a public MP3 cannot replace a local edit.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import json
import os
import re
import tempfile

SITE_ORIGIN = "https://metinciris.com.tr"
MANIFEST_URL = SITE_ORIGIN + "/podcast-audio/manifest.json"
MAX_MANIFEST_BYTES = 4 * 1024 * 1024
MAX_MP3_BYTES = 24 * 1024 * 1024
KEY = re.compile(r"[a-f0-9]{24}\Z")


def _read_https(url, limit, timeout=25):
    request = Request(url, headers={
        "User-Agent": "PodcastAhenkSesYoneticisi/1.2",
        "Accept": "application/json, audio/mpeg, */*",
        "Cache-Control": "no-cache",
    })
    with urlopen(request, timeout=timeout) as stream:
        where = urlparse(stream.geturl())
        if where.scheme != "https" or where.hostname not in {
            "metinciris.com.tr", "www.metinciris.com.tr"
        }:
            raise RuntimeError("Beklenmeyen web sitesi yönlendirmesi engellendi.")
        raw = stream.read(limit + 1)
    if len(raw) > limit:
        raise RuntimeError("Web sitesi dosyası beklenenden büyük; işlem durduruldu.")
    return raw


def validate_manifest(data):
    if not isinstance(data, dict) or data.get("version") != 1:
        raise RuntimeError("Web sitesinin ses manifesti geçersiz.")
    items = data.get("entries")
    if not isinstance(items, dict):
        raise RuntimeError("Web sitesinin ses kayıtları okunamadı.")
    result = {}
    for key, entry in items.items():
        if not isinstance(key, str) or not KEY.fullmatch(key):
            continue
        if (not isinstance(entry, dict) or entry.get("file") != key + ".mp3"
                or not isinstance(entry.get("title"), str)
                or not isinstance(entry.get("journal"), str)):
            continue
        result[key] = entry
    return {"version": 1, "generated_at": data.get("generated_at", ""), "entries": result}


def fetch_manifest():
    return validate_manifest(json.loads(
        _read_https(MANIFEST_URL, MAX_MANIFEST_BYTES, timeout=20).decode("utf-8-sig")
    ))


def cache_manifest(home, manifest):
    validate_manifest(manifest)
    folder = Path(home)
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / "web_manifest_cache.json"
    _atomic_bytes(target, (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    return target


def load_cached_manifest(home):
    path = Path(home) / "web_manifest_cache.json"
    if not path.is_file():
        return {"version": 1, "entries": {}}
    try:
        return validate_manifest(json.loads(path.read_text(encoding="utf-8-sig")))
    except (OSError, ValueError, TypeError):
        return {"version": 1, "entries": {}}


def _atomic_bytes(target, body):
    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(dir=target.parent, prefix=".ahenk-download-", suffix=".part")
    try:
        with os.fdopen(fd, "wb") as out:
            out.write(body)
            out.flush()
        os.replace(temp, target)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def web_clip_path(home, key):
    if not isinstance(key, str) or not KEY.fullmatch(key):
        raise ValueError("Geçersiz podcast ses anahtarı.")
    return Path(home) / "web_mp3" / (key + ".mp3")


def download_clip(home, key, manifest, force=False):
    manifest = validate_manifest(manifest)
    if key not in manifest["entries"]:
        raise RuntimeError("Bu makalenin web sitesinde yayımlanmış MP3'ü yok.")
    target = web_clip_path(home, key)
    # Online manifest generated_at marks only full-manifest changes, not each clip.
    # Cache using the exact entry metadata; a title's new generated_at invalidates it.
    stamp = target.with_suffix(".entry.json")
    metadata = manifest["entries"][key]
    if not force and target.is_file() and target.stat().st_size > 1024:
        try:
            if json.loads(stamp.read_text(encoding="utf-8")) == metadata:
                return target
        except (OSError, ValueError):
            pass
    raw = _read_https(SITE_ORIGIN + "/podcast-audio/" + key + ".mp3", MAX_MP3_BYTES, timeout=60)
    if len(raw) <= 1024 or not (raw.startswith(b"ID3") or
                                (raw[0] == 0xFF and raw[1] & 0xE0 == 0xE0)):
        raise RuntimeError("Web sitesi geçerli MP3 ses verisi döndürmedi.")
    _atomic_bytes(target, raw)
    _atomic_bytes(stamp, json.dumps(metadata, ensure_ascii=False).encode("utf-8"))
    return target
