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


def merge_keyed(base, local, remote, name, prefer_local=None):
    merged = {}
    prefer_local = set(prefer_local or [])
    for key in set(base) | set(local) | set(remote):
        b = base.get(key, MISSING)
        l = local.get(key, MISSING)
        r = remote.get(key, MISSING)
        if key in prefer_local:
            chosen = l
        elif l == b:
            chosen = r
        elif r == b or l == r:
            chosen = l
        else:
            # Keep the user's local approved recording/draft. The opposite
            # version still exists in immutable Git history and on the website;
            # routine synchronization does NOT publish this choice.
            chosen = l
        if chosen is not MISSING:
            merged[key] = chosen
    return merged

def three_way_json(path, base, local, remote, selected_key=None):
    if path == MANIFEST:
        for data in (base, local, remote):
            if not isinstance(data.get("entries"), dict):
                raise RuntimeError("Manifest entries alanı geçersiz.")
        entries = merge_keyed(
            base["entries"], local["entries"], remote["entries"], "MP3 başlığı",
            [selected_key] if selected_key else None
        )
        return {
            **remote, "version": 1,
            "entries": entries,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    if path == RULES:
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
                # Do not discard the local user's corrections; remote remains
                # available from Git history and on the deployed website.
                chosen = l
            if chosen is not MISSING:
                result[scalar] = chosen
            else:
                result.pop(scalar, None)
        # Publication selects only this article; normal sync merges all
        # disjoint per-article edits, without silently changing general rules.
        preferred = None
        if selected_key:
            identity_key = next((key for key in local.get("articles", {})
                                 if selected_key in key), None)
            if identity_key:
                preferred = [identity_key]
        result["articles"] = merge_keyed(
            base.get("articles", {}), local.get("articles", {}),
            remote.get("articles", {}), "makale telaffuzu", preferred
        )
        return result
    raise RuntimeError("Bilinmeyen JSON yolu: " + path)


def pronunciation_identity(entry):
    """Same key as podcast_audio_pronunciation.identity."""
    pmid = str(entry.get("pmid") or "").strip()
    pmid = re.sub(r"\.0+$", "", pmid) if re.fullmatch(r"[0-9]+\.0+", pmid) else pmid
    return json.dumps([entry["journal"].strip(), entry["title"].strip(), pmid],
                      ensure_ascii=False, separators=(",", ":"))

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


def sync(root, home, selected_key=None):
    """Fast-forward GitHub code and import voices, retaining local accepted MP3s.

    Same-file collisions are merged per article for JSON. An MP3 collision is
    resolved in favor of the local file only when the user explicitly chooses
    to publish that article (selected_key), never in a routine refresh.
    """
    root = Path(root)
    check_repo(root)
    dirty = changes(root)
    git(root, "fetch", "origin", "main")
    upstream = "refs/remotes/origin/main"
    if git_result(root, "merge-base", "--is-ancestor", "HEAD", upstream, check=False).returncode:
        raise RuntimeError("Yerel dal GitHub'dan ayrılmış. Zorla güncellenmez.")
    if git(root, "rev-parse", "HEAD") == git(root, "rev-parse", upstream):
        return "GitHub güncel. Yerel MP3'ler ve telaffuzlar korundu."

    changed = remote_changed(root)
    collision = dirty.keys() & changed
    merged = {}
    for path in collision:
        if path in (MANIFEST, RULES):
            default = ({"version": 1, "entries": {}} if path == MANIFEST else
                       {"version": 1, "global": [], "articles": {}, "global_speed": 1.0})
            merged[path] = three_way_json(
                path, ref_json(root, "HEAD", path, default),
                read_json_file(root / path, default),
                ref_json(root, upstream, path, default),
                selected_key=selected_key,
            )
        else:
            # Preserve any locally generated MP3 in normal refresh too. The
            # GitHub rendition remains retrievable after the fast-forward and
            # the actual deployed website is independently playable.
            continue

    backup = backup_files(root, home, dirty) if dirty else None
    try:
        for path, code in dirty.items():
            dest = root / path
            if code == "??":
                dest.unlink(missing_ok=True)
            else:
                git(root, "restore", "--worktree", "--", path)
        git(root, "merge", "--ff-only", upstream)
    except Exception as exc:
        for path, code in dirty.items():
            dest = root / path
            copy = backup / path
            if copy.is_file():
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(copy, dest)
            elif code == "??":
                dest.unlink(missing_ok=True)
        raise RuntimeError(
            "GitHub güncellemesi tamamlanamadı; yerel dosyalar yedekten korundu.\n" +
            str(exc)
        ) from exc
    for path, code in dirty.items():
        dest = root / path
        if path in merged:
            save_json(dest, merged[path])
        elif (backup / path).is_file():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(backup / path, dest)
        elif code in (" D", "D "):
            dest.unlink(missing_ok=True)
    return (
        f"GitHub sesleri indirildi, {len(dirty)} yerel dosya korundu."
        + (f" Yedek: {backup}" if backup else "")
    )

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
    sync(root, home, selected_key=selected_key)
    local = read_json_file(root / MANIFEST)
    if local is None:
        raise RuntimeError("Podcast manifest dosyası bulunamadı.")

    if selected_key is not None:
        entry = local.get("entries", {}).get(selected_key)
        assert_audio_valid(root, selected_key, entry)
        # Only the explicitly chosen title is published. Other unapproved
        # local entries remain in the user's working copy.
        remote = ref_json(root, "HEAD", MANIFEST, {"version": 1, "entries": {}})
        approved = {
            **remote,
            "entries": {**remote.get("entries", {}), selected_key: entry},
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        chosen_rules = None
        rule_path = root / RULES
        original_rules = rule_path.read_bytes() if rule_path.is_file() else None
        local_rules = read_json_file(rule_path, {
            "version": 1, "global": [], "articles": {}, "global_speed": 1.0
        })
        remote_rules = ref_json(root, "HEAD", RULES, {
            "version": 1, "global": [], "articles": {}, "global_speed": 1.0
        })
        # Article pronunciation travels with its approved MP3; general rules
        # and other article drafts remain unpublished until "Send all".
        identity = pronunciation_identity(entry)
        rule_entries = dict(remote_rules.get("articles", {}))
        if identity in local_rules.get("articles", {}):
            rule_entries[identity] = local_rules["articles"][identity]
        else:
            rule_entries.pop(identity, None)
        chosen_rules = {**remote_rules, "articles": rule_entries}

        manifest_path = root / MANIFEST
        original_manifest = manifest_path.read_bytes()
        backup_files(root, home, [MANIFEST, RULES])
        try:
            save_json(manifest_path, approved)
            save_json(rule_path, chosen_rules)
            sent = _commit_and_push(
                root, [MANIFEST, RULES, AUDIO_PREFIX + selected_key + ".mp3"]
            )
        finally:
            manifest_path.write_bytes(original_manifest)
            if original_rules is None:
                rule_path.unlink(missing_ok=True)
            else:
                rule_path.write_bytes(original_rules)
        return (
            "Seçilen MP3 GitHub'a gönderildi. Site dağıtımı tamamlanınca yayında olacak."
            if sent else "Seçili ses zaten GitHub'daki sürümle aynı."
        )

    modified = changes(root)
    if not modified:
        return "GitHub'a gönderilecek yeni yerel ses bulunamadı."
    for path in modified:
        if AUDIO_NAME.fullmatch(path):
            key = Path(path).stem
            assert_audio_valid(root, key, local.get("entries", {}).get(key))
    sent = _commit_and_push(root, list(modified))
    return (
        "Tüm yerel onaylı MP3 ve telaffuz değişiklikleri GitHub'a gönderildi."
        if sent else "GitHub zaten güncel."
    )

def publish_live_web_voice(root, home, key, live_entry, downloaded_mp3):
    """Re-publish the ACTUAL site audio selected by the user.

    The file is deliberately read from the isolated web download cache. Existing
    local generated MP3 and manifest are restored after the commit, even on
    push failure, so unapproved local alternatives are never lost.
    """
    root = Path(root)
    if not re.fullmatch(r"[a-f0-9]{24}", key):
        raise RuntimeError("Geçersiz makale ses anahtarı.")
    if not isinstance(live_entry, dict) or live_entry.get("file") != key + ".mp3":
        raise RuntimeError("Sitedeki seçili sesin manifest kaydı doğrulanamadı.")
    for field in ("title", "journal"):
        if not isinstance(live_entry.get(field), str) or not live_entry[field]:
            raise RuntimeError("Sitedeki sesin makale bilgisi eksik: " + field)
    source = Path(downloaded_mp3)
    if not source.is_file() or source.stat().st_size <= 1024:
        raise RuntimeError("Web MP3'ü bilgisayara geçerli biçimde indirilemedi.")
    if source.stat().st_size > 24 * 1024 * 1024:
        raise RuntimeError("Web MP3'ü beklenenden büyük.")
    with source.open("rb") as audio_file:
        header = audio_file.read(3)
    if not (header == b"ID3" or (header[:1] == b"\xff" and
                                  len(header) >= 2 and header[1] & 0xe0 == 0xe0)):
        raise RuntimeError("Web dosyası MP3 formatında değil.")

    sync(root, home, selected_key=key)
    # Record the original local alternative before modifying either file.
    mp3_name = AUDIO_PREFIX + key + ".mp3"
    mp3_target = root / mp3_name
    manifest_target = root / MANIFEST
    current = read_json_file(manifest_target, {"version": 1, "entries": {}})
    local_entry = current.get("entries", {}).get(key)
    if local_entry and (local_entry.get("title") != live_entry["title"] or
                        local_entry.get("journal") != live_entry["journal"]):
        raise RuntimeError("Web ile yerel makale eşleşmiyor. Ses değiştirilmedi.")
    before = {}
    for path in (mp3_name, MANIFEST):
        file = root / path
        before[path] = file.read_bytes() if file.is_file() else None
    backup_files(root, home, (mp3_name, MANIFEST))
    remote = ref_json(root, "HEAD", MANIFEST, {"version": 1, "entries": {}})
    chosen = {
        **remote,
        "entries": {**remote.get("entries", {}), key: live_entry},
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        # All modifications are limited to the user's chosen MP3 and manifest.
        # No unapproved pronunciation rules or other local MP3s are staged.
        mp3_target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, mp3_target)
        save_json(manifest_target, chosen)
        sent = _commit_and_push(root, (mp3_name, MANIFEST))
    finally:
        for path, original in before.items():
            destination = root / path
            if original is None:
                destination.unlink(missing_ok=True)
            else:
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(original)
    return ("Web'de dinlediğiniz orijinal MP3 GitHub'a yeniden seçildi. Dağıtım başlayacak."
            if sent else "Web'deki ses zaten GitHub'da seçili; değiştirilmedi.")


def publish_selected_local_voices(root, home, keys, reject_existing=False):
    """Only explicitly selected local MP3s are sent, preserving other drafts."""
    root = Path(root)
    keys = list(dict.fromkeys(keys))
    if not keys or len(keys) > 150:
        raise RuntimeError("En az bir, en fazla 150 makale seçin.")
    for key in keys:
        if not re.fullmatch(r"[a-f0-9]{24}", key):
            raise RuntimeError("Geçersiz seçili makale: " + str(key))
    sync(root, home)
    local = read_json_file(root / MANIFEST)
    if local is None:
        raise RuntimeError("Yerel MP3 manifesti bulunamadı.")
    for key in keys:
        assert_audio_valid(root, key, local.get("entries", {}).get(key))
    remote = ref_json(root, "HEAD", MANIFEST, {"version": 1, "entries": {}})
    if reject_existing:
        # The scheduled PC job uses this opt-in fail-closed guard. If another
        # GitHub Action/PC has published one of the same article keys during
        # synthesis, do NOT overwrite that newly published rendition.
        collisions = [key for key in keys if key in remote.get("entries", {})]
        if collisions:
            raise RuntimeError(
                "Otomatik yayin durduruldu: GitHub bu sirada "
                f"{len(collisions)} makaleye ses eklemis. Mevcut WEB/GitHub "
                "kayitlari korunuyor; sonraki gun yeniden kontrol edilecek."
            )
    result_entries = dict(remote.get("entries", {}))
    for key in keys:
        result_entries[key] = local["entries"][key]
    # Only selected recordings should modify the remote manifest.
    chosen_manifest = dict(remote)
    chosen_manifest["entries"] = result_entries
    if result_entries != remote.get("entries", {}):
        chosen_manifest["generated_at"] = datetime.now(timezone.utc).isoformat()

    rule_path = root / RULES
    before_rules = rule_path.read_bytes() if rule_path.is_file() else None
    local_rules = read_json_file(
        rule_path, {"version": 1, "global": [], "articles": {}, "global_speed": 1.0}
    )
    remote_rules = ref_json(
        root, "HEAD", RULES, {"version": 1, "global": [], "articles": {}, "global_speed": 1.0}
    )
    merged_rules = dict(remote_rules)
    selected_rules = dict(remote_rules.get("articles", {}))
    for key in keys:
        identity = pronunciation_identity(local["entries"][key])
        if identity in local_rules.get("articles", {}):
            selected_rules[identity] = local_rules["articles"][identity]
        else:
            selected_rules.pop(identity, None)
    merged_rules["articles"] = selected_rules

    manifest_target = root / MANIFEST
    originals = {
        MANIFEST: manifest_target.read_bytes() if manifest_target.is_file() else None,
        RULES: before_rules,
    }
    backup_files(root, home, originals.keys())
    try:
        save_json(manifest_target, chosen_manifest)
        save_json(rule_path, merged_rules)
        sent = _commit_and_push(
            root, [MANIFEST, RULES] +
            [AUDIO_PREFIX + key + ".mp3" for key in keys]
        )
    finally:
        for path, data in originals.items():
            target = root / path
            if data is None:
                target.unlink(missing_ok=True)
            else:
                target.write_bytes(data)
    if sent:
        return f"Seçilen {len(keys)} MP3 GitHub'a gönderildi. Web yayını hazırlanıyor."
    return "Seçili MP3'ler zaten GitHub'daki seslerle aynı."


def remote_manifest(root):
    return ref_json(root, "HEAD", MANIFEST, {"version": 1, "entries": {}})


def restore_site_voice(root, home, key):
    """Opt-in rollback to the exact GitHub-committed MP3, never automatic."""
    root = Path(root)
    check_repo(root)
    remote = remote_manifest(root)
    item = remote.get("entries", {}).get(key)
    if not item:
        raise RuntimeError("Bu makalenin GitHub'da yayımlanmış bir MP3'ü yok.")
    path = AUDIO_PREFIX + key + ".mp3"
    cp = subprocess.run(
        ["git", "-C", str(root), "show", "HEAD:" + path],
        capture_output=True, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
    )
    if cp.returncode or len(cp.stdout) <= 1024:
        raise RuntimeError("GitHub MP3 dosyası alınamadı.")
    backup = backup_files(root, home, [MANIFEST, path])
    dest = root / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(cp.stdout)
    local = read_json_file(root / MANIFEST)
    local["entries"][key] = item
    save_json(root / MANIFEST, local)
    return f"GitHub'daki MP3 yerel klasöre geri alındı. Eski dosyanız yedekte: {backup}"
