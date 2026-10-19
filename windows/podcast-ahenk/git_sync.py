"""Safe GitHub synchronization for the Windows Podcast Ahenk voice manager.

Never force-push, reset --hard, discard unknown changes, or upload arbitrary
files. Published audio is controlled by the manifest's (journal,title,PMID) key.
A three-way, per-entry manifest merge supports GitHub Actions + Windows updates.
"""
from datetime import datetime, timezone
from pathlib import Path
import json
import os
import re
import shutil
import subprocess
import tempfile
import uuid

AUDIO_PREFIX = "public/podcast-audio/"
MANIFEST = AUDIO_PREFIX + "manifest.json"
RULES = AUDIO_PREFIX + "pronunciation.json"
AUDIO_NAME = re.compile(r"public/podcast-audio/[a-f0-9]{24}[.]mp3\Z")
VALID_REMOTE = {
    "https://github.com/metinciris/metinciriscomtr.git",
    "https://github.com/metinciris/metinciriscomtr",
    "git@github.com:metinciris/metinciriscomtr.git",
    "git@github.com:metinciris/metinciriscomtr",
}
MISSING = object()


def git_result(root, *args, check=True, timeout=240):
    try:
        cp = subprocess.run(
            ["git", "-C", str(root), *args],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
            timeout=timeout, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError("Git komutu başlatılamadı veya zaman aşımı: " + str(exc)) from exc
    if check and cp.returncode:
        raise RuntimeError(
            "Git işlemi başarısız: " + " ".join(args[:4]) + "\n" +
            (cp.stderr or cp.stdout or "Ayrıntı yok")[-1300:]
        )
    return cp


def git(root, *args, check=True, timeout=240):
    # CRITICAL: never use str.strip(): Git porcelain starts with meaningful spaces.
    return git_result(root, *args, check=check, timeout=timeout).stdout.rstrip("\r\n")


def allowed(path):
    return path in {MANIFEST, RULES} or AUDIO_NAME.fullmatch(path) is not None


def check_repo(root):
    origin = git(root, "remote", "get-url", "origin").rstrip("/")
    if origin not in VALID_REMOTE:
        raise RuntimeError("Güvenlik: GitHub adresi beklenenden farklı: " + origin)
    branch = git(root, "branch", "--show-current")
    if branch != "main":
        raise RuntimeError("Güncelleme ve yayın yalnızca main dalında yapılır.")


def changes(root):
    """Map safe path to 2-character Git status. No path prefix gets truncated."""
    text = git(root, "status", "--porcelain=v1", "--untracked-files=all")
    entries = {}
    for line in text.splitlines():
        if len(line) < 4 or line[2] != " ":
            raise RuntimeError("Beklenmeyen Git durum satırı: " + line[:100])
        code, path = line[:2], line[3:]
        if " -> " in path or not allowed(path):
            raise RuntimeError("Podcast dışındaki yerel değişiklik: " + path)
        if code[0] not in {" ", "?"}:
            raise RuntimeError("Önceden Git'e hazırlanmış (staged) değişiklik var: " + path)
        if code[1] not in {" ", "M", "D", "?"}:
            raise RuntimeError("Desteklenmeyen Git değişikliği: " + code + " " + path)
        entries[path] = code
    return entries


def read_json_file(path, default=None):
    if not Path(path).is_file():
        return default
    result = json.loads(Path(path).read_text(encoding="utf-8-sig"))
    if not isinstance(result, dict) or result.get("version") != 1:
        raise RuntimeError("Geçersiz podcast JSON: " + str(path))
    return result


def ref_json(root, ref, path, default=None):
    cp = git_result(root, "show", f"{ref}:{path}", check=False)
    if cp.returncode:
        return default
    result = json.loads(cp.stdout)
    if not isinstance(result, dict) or result.get("version") != 1:
        raise RuntimeError("GitHub JSON sürümü desteklenmiyor: " + path)
    return result


def merge_keyed(base, local, remote, name):
    merged = {}
    for key in set(base) | set(local) | set(remote):
        b = base.get(key, MISSING)
        l = local.get(key, MISSING)
        r = remote.get(key, MISSING)
        if l == b:
            chosen = r
        elif r == b or l == r:
            chosen = l
        else:
            raise RuntimeError(
                f"GitHub ve bilgisayarda aynı {name} değişmiş: {key[:85]}. "
                "Otomatik üzerine yazılmadı."
            )
        if chosen is not MISSING:
            merged[key] = chosen
    return merged


def three_way_json(path, base, local, remote):
    if path == MANIFEST:
        for data in (base, local, remote):
            if not isinstance(data.get("entries"), dict):
                raise RuntimeError("Manifest entries alanı geçersiz.")
        entries = merge_keyed(
            base["entries"], local["entries"], remote["entries"], "MP3 başlığı"
        )
        return {
            **remote, "version": 1,
            "entries": entries,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    if path == RULES:
        # Whole-word pronunciation rules can conflict, whereas article-specific
        # edits are safely resolved independently.
        result = dict(remote)
        for scalar in ("global", "global_speed"):
            b = base.get(scalar, MISSING)
            l = local.get(scalar, MISSING)
            r = remote.get(scalar, MISSING)
            if l == b:
                chosen = r
            elif r == b or l == r:
                chosen = l
            else:
                raise RuntimeError(
                    f"Genel telaffuz alanı hem GitHub'da hem yerelde değişmiş: {scalar}. "
                    "Yerel kayıt korundu; elle inceleyin."
                )
            if chosen is not MISSING:
                result[scalar] = chosen
            else:
                result.pop(scalar, None)
        result["articles"] = merge_keyed(
            base.get("articles", {}), local.get("articles", {}),
            remote.get("articles", {}), "makale telaffuzu"
        )
        return result
    raise RuntimeError("Bilinmeyen JSON yolu: " + path)


def save_json(path, payload):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".ahenk-write-", suffix=".json", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(payload, file, ensure_ascii=False, indent=2)
            file.write("\n")
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def backup_files(root, home, paths):
    folder = Path(home) / "yedekler" / (
        datetime.now().strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:7]
    )
    folder.mkdir(parents=True, exist_ok=False)
    for relative in paths:
        item = Path(root) / relative
        if item.is_file():
            output = folder / relative
            output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, output)
    return folder


def remote_changed(root):
    return set(git(root, "diff", "--name-only", "HEAD", "refs/remotes/origin/main").splitlines())


def sync(root, home):
    """Fast-forward code and merge local approved audio without losing it."""
    root = Path(root)
    check_repo(root)
    dirty = changes(root)
    git(root, "fetch", "origin", "main")
    upstream = "refs/remotes/origin/main"
    if git_result(root, "merge-base", "--is-ancestor", "HEAD", upstream, check=False).returncode:
        raise RuntimeError("Yerel dal GitHub'dan ayrılmış. Zorla güncellenmez.")
    changed = remote_changed(root)
    collision = dirty.keys() & changed
    merged = {}
    for path in collision:
        if path in (MANIFEST, RULES):
            default = {"version": 1, "entries": {}} if path == MANIFEST else {
                "version": 1, "global": [], "articles": {}, "global_speed": 1.0
            }
            base = ref_json(root, "HEAD", path, default)
            remote = ref_json(root, upstream, path, default)
            local = read_json_file(root / path, default)
            merged[path] = three_way_json(path, base, local, remote)
        else:
            # Same filename but two distinct local/remote MP3s: never pick silently.
            remote_bytes = subprocess.run(
                ["git", "-C", str(root), "show", f"{upstream}:{path}"],
                capture_output=True, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
            )
            local_bytes = (root / path).read_bytes() if (root / path).is_file() else None
            if remote_bytes.returncode or local_bytes != remote_bytes.stdout:
                raise RuntimeError(
                    "Aynı MP3 hem bilgisayarda hem GitHub'da değişti: " + path +
                    "\nYerel ses korunuyor. Önce hangi sesin yayınlanacağını seçin."
                )

    backup = backup_files(root, home, dirty)
    originals = {}
    for path in dirty:
        file = root / path
        originals[path] = file.read_bytes() if file.is_file() else None
    try:
        for path, code in dirty.items():
            if code == "??":
                (root / path).unlink(missing_ok=True)
            else:
                git(root, "restore", "--worktree", "--", path)
        git(root, "merge", "--ff-only", upstream)
    except Exception:
        for path, contents in originals.items():
            destination = root / path
            if contents is None:
                destination.unlink(missing_ok=True)
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(contents)
        raise RuntimeError("Güncelleme uygulanamadı; yerel dosyalar yedekte ve yeniden yerine kondu.")
    for path, contents in originals.items():
        if path in merged:
            save_json(root / path, merged[path])
        elif contents is None:
            (root / path).unlink(missing_ok=True)
        else:
            destination = root / path
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(contents)
    return f"GitHub güncellendi. {len(dirty)} yerel ses/ayar dosyası korundu. Yedek: {backup}"


def assert_audio_valid(root, key, entry):
    if not isinstance(entry, dict):
        raise RuntimeError("Bu başlık için kabul edilmiş MP3 bulunamadı.")
    if not re.fullmatch(r"[a-f0-9]{24}", key):
        raise RuntimeError("Bilinmeyen ses anahtarı.")
    name = entry.get("file")
    if name != key + ".mp3":
        raise RuntimeError("MP3 adı ve başlığı eşleşmiyor.")
    path = Path(root) / AUDIO_PREFIX / name
    if not path.is_file() or path.stat().st_size <= 1024:
        raise RuntimeError("Bu başlığın geçerli MP3 dosyası bulunamadı.")
    return path


def _commit_and_push(root, paths):
    if git(root, "diff", "--cached", "--name-only"):
        raise RuntimeError("Git indexinde başka bekleyen değişiklik var.")
    for path in sorted(set(paths)):
        git(root, "add", "-A", "--", path)
    staged = git(root, "diff", "--cached", "--name-only").splitlines()
    if any(not allowed(p) for p in staged):
        raise RuntimeError("GitHub'a podcast dışı dosya gönderimi engellendi.")
    if not staged:
        return False
    parent = git(root, "rev-parse", "HEAD")
    git(root, "-c", "user.name=Podcast Ahenk Yöneticisi",
        "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com",
        "commit", "-m", "chore(podcast): publish approved Ahenk audio")
    try:
        git(root, "push", "origin", "HEAD:main", timeout=300)
    except Exception as exc:
        # Only undo this command's own commit, without changing any user files.
        if git(root, "rev-parse", "HEAD^") == parent:
            git(root, "reset", "--mixed", parent)
        raise RuntimeError(
            "GitHub gönderimi tamamlanmadı; yerel MP3'ler korunuyor. "
            "GitHub Actions başka ses eklediyse yeniden deneyin.\n" + str(exc)
        ) from exc
    return True


def publish(root, home, selected_key=None):
    root = Path(root)
    sync(root, home)
    local = read_json_file(root / MANIFEST)
    if local is None:
        raise RuntimeError("Manifest dosyası yok.")
    if selected_key is not None:
        if selected_key not in local.get("entries", {}):
            raise RuntimeError("Seçili başlığın onaylı MP3 kaydı bulunamadı.")
        entry = local["entries"][selected_key]
        assert_audio_valid(root, selected_key, entry)
        remote = ref_json(root, "HEAD", MANIFEST, {"version": 1, "entries": {}})
        published = {
            **remote, "entries": {**remote.get("entries", {}), selected_key: entry},
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        manifest_path = root / MANIFEST
        original = manifest_path.read_bytes()
        backup_files(root, home, [MANIFEST])
        try:
            # Stage a manifest containing this article alone from local changes.
            save_json(manifest_path, published)
            sent = _commit_and_push(root, [MANIFEST, AUDIO_PREFIX + selected_key + ".mp3"])
        finally:
            manifest_path.write_bytes(original)
        if sent:
            return "Seçili MP3 GitHub'a gönderildi; web sitesi yayını başlayacak."
        return "Seçili MP3 zaten GitHub'daki kayıtla aynı."
    modified = changes(root)
    if not modified:
        return "GitHub'a gönderilecek yeni ses yok."
    # Bulk publishing includes all accepted local clips and pronunciation rules.
    for key, entry in local.get("entries", {}).items():
        if AUDIO_PREFIX + key + ".mp3" in modified:
            assert_audio_valid(root, key, entry)
    sent = _commit_and_push(root, list(modified))
    return ("Onaylı yerel sesler GitHub'a gönderildi; site güncellemesi başlayacak."
            if sent else "GitHub'da zaten güncel.")


def remote_manifest(root):
    return ref_json(root, "HEAD", MANIFEST, {"version": 1, "entries": {}})


def restore_site_voice(root, home, key):
    """Opt-in rollback of a local MP3 to its currently published Git version."""
    check_repo(root)
    remote = remote_manifest(root)
    item = remote.get("entries", {}).get(key)
    if not item:
        raise RuntimeError("Bu makalenin GitHub'da henüz yayımlanmış bir MP3'ü yok.")
    path = AUDIO_PREFIX + key + ".mp3"
    output = git_result(root, "show", "HEAD:" + path, check=False)
    if output.returncode:
        # Bytes are fetched via a binary invocation below.
        raise RuntimeError("GitHub'da bu MP3 dosyası bulunamadı.")
    cp = subprocess.run(["git", "-C", str(root), "show", "HEAD:" + path],
                        capture_output=True,
                        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    if cp.returncode or len(cp.stdout) <= 1024:
        raise RuntimeError("GitHub MP3 dosyası alınamadı.")
    backup = backup_files(root, home, [MANIFEST, path])
    (Path(root) / path).parent.mkdir(parents=True, exist_ok=True)
    (Path(root) / path).write_bytes(cp.stdout)
    local = read_json_file(Path(root) / MANIFEST)
    local["entries"][key] = item
    save_json(Path(root) / MANIFEST, local)
    return f"Bu makale için GitHub'daki ses geri getirildi. Önceki yerel MP3 yedekte: {backup}"
