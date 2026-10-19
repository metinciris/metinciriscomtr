"""Fast, reusable Windows MP3 playback for Podcast Ahenk.

Prefer ffplay (part of many FFmpeg distributions), then the Windows multimedia
MCI engine, and finally the configured external audio player. Calls to play()
must run in a background thread so Windows shell/codec startup never blocks Tk.
Playback never modifies or imports audio into the publishing archive.
"""
import ctypes
import os
from pathlib import Path
import shutil
import subprocess
import threading


class FastMP3Player:
    def __init__(self):
        self._lock = threading.RLock()
        self._process = None
        self._alias = None
        self._serial = 0

    @staticmethod
    def _mci(command):
        if os.name != "nt":
            return 1
        return ctypes.windll.winmm.mciSendStringW(command, None, 0, None)

    def _stop_locked(self):
        proc = self._process
        self._process = None
        if proc is not None:
            try:
                if proc.poll() is None:
                    proc.terminate()
            except (OSError, ValueError):
                pass
        alias = self._alias
        self._alias = None
        if alias:
            self._mci("stop " + alias)
            self._mci("close " + alias)

    def stop(self):
        with self._lock:
            self._stop_locked()

    @staticmethod
    def _find_ffplay():
        player = shutil.which("ffplay")
        if player:
            return player
        ffmpeg = shutil.which("ffmpeg")
        if ffmpeg:
            sibling = Path(ffmpeg).with_name("ffplay.exe")
            if sibling.is_file():
                return str(sibling)
        return None

    def play(self, audio_path):
        path = Path(audio_path)
        if not path.is_file() or path.stat().st_size <= 1024:
            raise RuntimeError("Dinlemek istediğiniz MP3 dosyası bulunamadı.")
        with self._lock:
            self._stop_locked()

            # ffplay runs without opening the full Windows Media Player UI,
            # and also plays when users have no default .mp3 association.
            player = self._find_ffplay()
            if player:
                try:
                    self._process = subprocess.Popen(
                        [player, "-hide_banner", "-nostats", "-loglevel", "error",
                         "-nodisp", "-autoexit", "-i", str(path)],
                        stdin=subprocess.DEVNULL,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                    )
                    return "hızlı oynatıcı"
                except OSError:
                    # Portable fallback on Windows, without changing the MP3.
                    self._process = None

            self._serial += 1
            alias = f"ahenkmp3{self._serial}"
            # mciSendStringW needs quotation marks for spaces in usernames or
            # the "PodcastAhenk" AppData folder.
            filename = str(path)
            if os.name == "nt" and '"' not in filename:
                if self._mci(f'open "{filename}" type mpegvideo alias {alias}') == 0:
                    if self._mci("play " + alias) == 0:
                        self._alias = alias
                        return "Windows hızlı ses motoru"
                    self._mci("close " + alias)

            # Last resort: Windows file association. Still invoked by caller
            # in a worker, never synchronously from the Tk button.
            if not hasattr(os, "startfile"):
                raise RuntimeError(
                    "Yerel oynatıcı yok. Windows'ta FFplay/FFmpeg kurulumunu kontrol edin."
                )
            os.startfile(str(path))
            return "Windows varsayılan oynatıcısı"
