"""GitHub metadata-only transport for automatic Ahenk audio publishing.

The user's original Windows repository and MP3 files are never synchronized or
checked out by automatic mode. We clone a disposable, partial sparse checkout
containing only JSON metadata. Only explicitly generated local MP3s get copied
into the temporary checkout when they are about to be published.
"""
from contextlib import contextmanager
import hashlib
import os
from pathlib import Path
import re
import subprocess
import tempfile

import git_sync

JSON_SPARSE = (
    "/public/podcast-audio/manifest.json",
    "/public/podcast-audio/pronunciation.json",
)


def _sha256(path):
    result = hashlib.sha256()
    with Path(path).open("rb") as source:
        for block in iter(lambda: source.read(1048576), b""):
            result.update(block)
    return result.hexdigest()


@contextmanager
def metadata_checkout(source_root, home):
    """Get only manuscript metadata, not the 119+ existing WEB MP3s.

    The source tree is read-only during this operation. A scratch Git checkout
    is removed at exit, including after errors or unsuccessful pushes.
    """
    source_root = Path(source_root)
    home = Path(home)
    git_sync.check_repo(source_root)
    remote_url = git_sync.git(source_root, "remote", "get-url", "origin").rstrip("/")
    if remote_url not in git_sync.VALID_REMOTE:
        raise RuntimeError("GitHub adresi doğrulanamadı; sesler değiştirilmedi.")
    home.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ahenk-meta-", dir=home,
                                     ignore_cleanup_errors=True) as temp:
        checkout = Path(temp) / "repo"
        try:
            result = subprocess.run(
                ["git", "clone", "--quiet", "--filter=blob:none", "--sparse",
                 "--depth=1", "--single-branch", "--no-tags", "--branch", "main",
                 remote_url, str(checkout)],
                capture_output=True, text=True, encoding="utf-8", errors="replace",
                timeout=240,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise RuntimeError("GitHub metadata indirme hatası: " + str(exc)) from exc
        if result.returncode:
            raise RuntimeError(
                "GitHub metadata indirilemedi: " +
                (result.stderr or result.stdout or "Bilinmeyen hata")[-1100:]
            )
        git_sync.git(checkout, "sparse-checkout", "set", "--no-cone", *JSON_SPARSE)
        git_sync.check_repo(checkout)
        # This is the contract: never check out existing WEB audio, even
        # temporarily, to calculate missing article counts.
        if list((checkout / git_sync.AUDIO_PREFIX).glob("*.mp3")):
            raise RuntimeError("Güvenlik: metadata deposu istenmeyen MP3 içeriyor.")
        if git_sync.read_json_file(checkout / git_sync.MANIFEST) is None:
            raise RuntimeError("GitHub manifesti eksik; otomatik ses üretimi durduruldu.")
        yield checkout


def refresh_metadata(checkout):
    """Recheck current main without materializing excluded audio blobs."""
    git_sync.check_repo(checkout)
    if git_sync.git(checkout, "status", "--porcelain", "--untracked-files=all"):
        raise RuntimeError("Metadata çalışma deposu değişmiş; güvenli güncelleme yapılmadı.")
    git_sync.git(checkout, "fetch", "--filter=blob:none", "origin", "main")
    git_sync.git(checkout, "merge", "--ff-only", "refs/remotes/origin/main")
    if list((Path(checkout) / git_sync.AUDIO_PREFIX).glob("*.mp3")):
        raise RuntimeError("Metadata güncellemesi MP3 dosyası indirdi; işlem durduruldu.")


def publish_missing(source_root, checkout, keys):
    """Push only selected missing local MP3s via the sparse temporary checkout.

    Raises on a collision if Actions already published any requested key.
    Uploaded audio metadata never overwrites an existing WEB recording.
    """
    source_root, checkout = Path(source_root), Path(checkout)
    keys = list(dict.fromkeys(keys))
    if not keys:
        return 0
    if len(keys) > 150 or any(not re.fullmatch(r"[a-f0-9]{24}", k) for k in keys):
        raise RuntimeError("Geçersiz veya fazla sayıda ses dosyası gönderimi.")
    refresh_metadata(checkout)
    remote = git_sync.remote_manifest(checkout)
    if any(key in remote.get("entries", {}) for key in keys):
        raise RuntimeError(
            "GitHub Actions bu sırada bazı sesleri yayımladı. "
            "Üzerlerine yazılmadı; sonraki çalışmada yeniden kontrol edilecek."
        )
    local = git_sync.read_json_file(source_root / git_sync.MANIFEST)
    if not local:
        raise RuntimeError("Yerel MP3 manifesti okunamadı; yayın durduruldu.")
    for key in keys:
        entry = local.get("entries", {}).get(key)
        if not isinstance(entry, dict) or entry.get("fingerprint") == "unknown-recovered":
            raise RuntimeError("Onaysız veya kurtarılmış bir MP3 otomatik gönderilemez.")
        git_sync.assert_audio_valid(source_root, key, entry)

    remote_rules = git_sync.read_json_file(
        checkout / git_sync.RULES,
        {"version": 1, "global": [], "global_speed": 1.0, "articles": {}},
    )
    local_rules = git_sync.read_json_file(
        source_root / git_sync.RULES,
        {"version": 1, "global": [], "global_speed": 1.0, "articles": {}},
    )
    chosen_rules = dict(remote_rules)
    chosen_articles = dict(remote_rules.get("articles", {}))
    for key in keys:
        ident = git_sync.pronunciation_identity(local["entries"][key])
        if ident in local_rules.get("articles", {}):
            chosen_articles[ident] = local_rules["articles"][ident]
        else:
            chosen_articles.pop(ident, None)
    chosen_rules["articles"] = chosen_articles
    chosen_manifest = dict(remote)
    chosen_manifest["entries"] = {
        **remote.get("entries", {}),
        **{key: local["entries"][key] for key in keys},
    }

    git_sync.save_json(checkout / git_sync.MANIFEST, chosen_manifest)
    git_sync.save_json(checkout / git_sync.RULES, chosen_rules)
    allowed = {git_sync.MANIFEST, git_sync.RULES}
    for key in keys:
        relative = git_sync.AUDIO_PREFIX + key + ".mp3"
        original = source_root / relative
        target = checkout / relative
        git_sync.atomic_copy(original, target)
        if _sha256(target) != _sha256(original):
            raise RuntimeError("Kopyalanan MP3 değişmiş; GitHub gönderimi iptal edildi.")
        git_sync.git(checkout, "add", "--sparse", "-A", "--", relative)
        allowed.add(relative)
    git_sync.git(checkout, "add", "-A", "--", git_sync.MANIFEST, git_sync.RULES)
    staged = set(git_sync.git(checkout, "diff", "--cached", "--name-only").splitlines())
    if not staged or not staged.issubset(allowed):
        raise RuntimeError("Yalnız seçilen MP3'ler gönderilebilir; işlem iptal edildi.")

    git_sync.git(
        checkout, "-c", "user.name=Podcast Ahenk Yöneticisi",
        "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com",
        "commit", "-m", "chore(podcast): publish missing Ahenk audio from PC",
    )
    try:
        git_sync.git(checkout, "push", "origin", "HEAD:main", timeout=300)
    except Exception as exc:
        raise RuntimeError(
            "GitHub gönderimi başka bir yayınla çakıştı veya bağlantı kesildi. "
            "PC'deki MP3'ler korundu. Yeniden kontrol edilerek tekrar denenebilir. "
            + str(exc)
        ) from exc
    return len(keys)
