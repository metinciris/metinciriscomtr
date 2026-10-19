"""Automatic, non-admin Podcast Ahenk voice-engine setup on Windows.

The background startup worker checks the existing virtualenv. Heavy PyTorch
dependencies are installed ONLY when missing, and MP3 conversion falls back
to the imageio-ffmpeg wheel if a system FFmpeg executable is unavailable.

The original two-stage GitHub publishing workflow does not depend on TTS.
"""
import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import sys


REQUIRED_MODULES = (
    "torch", "ema_lightning", "numpy", "soundfile",
    "huggingface_hub", "trnorm",
)


def module_available(name):
    try:
        return importlib.util.find_spec(name) is not None
    except (ImportError, AttributeError, ValueError):
        return False


def _install(args, timeout, report):
    report("Ahenk ses motorunun eksik bileşenleri otomatik kuruluyor…")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--disable-pip-version-check",
             *args],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding="utf-8", errors="replace",
            timeout=timeout, creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError("Ses motoru kurulumu tamamlanamadı: " + str(exc)) from exc
    if result.returncode:
        raise RuntimeError(
            "Ses motoru kurulamadı (pip): " +
            (result.stderr or result.stdout or "bilinmeyen hata")[-1400:]
        )


def ffmpeg_executable():
    """Path to a usable MP3 encoder; no shell, PATH or admin change required."""
    override = os.environ.get("AHENK_FFMPEG_EXE")
    if override and Path(override).is_file():
        return override
    installed = shutil.which("ffmpeg")
    if installed:
        return installed
    if module_available("imageio_ffmpeg"):
        import imageio_ffmpeg
        binary = imageio_ffmpeg.get_ffmpeg_exe()
        if binary and Path(binary).is_file():
            return binary
    return None


def ensure_runtime(root, report=lambda _message: None):
    """Idempotent startup check; safe for a background worker.

    Call once at application start, and again before first synthesis if setup
    was still in progress. This function never changes a WEB or PC MP3.
    """
    requirements = Path(root) / "scripts" / "podcast-audio-requirements.txt"
    missing = [name for name in REQUIRED_MODULES if not module_available(name)]
    if missing:
        if not requirements.is_file():
            raise RuntimeError("Ahenk requirements dosyası bulunamadı.")
        report("Ahenk kütüphaneleri eksik: " + ", ".join(missing))
        _install(["-r", str(requirements)], timeout=2700, report=report)
        missing_after = [name for name in REQUIRED_MODULES if not module_available(name)]
        if missing_after:
            raise RuntimeError("Kurulum sonrası eksik Ahenk modülleri: " +
                               ", ".join(missing_after))
    binary = ffmpeg_executable()
    if not binary:
        report("FFmpeg sistemde yok; Python sanal ortamına kuruluyor…")
        _install(["imageio-ffmpeg>=0.6,<1"], timeout=900, report=report)
        binary = ffmpeg_executable()
    if not binary:
        raise RuntimeError("FFmpeg ses dönüştürücü otomatik kurulumdan sonra bulunamadı.")
    os.environ["AHENK_FFMPEG_EXE"] = str(binary)
    report("Ahenk ses motorunun bileşenleri hazır.")
    return str(binary)
