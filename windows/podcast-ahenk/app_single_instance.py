"""Cross-process guard for the Ahenk GUI and its scheduled worker.

Windows named mutex lifetime is tied to the process handle. A competing
process skips rather than racing on the same MP3s/Git working tree.
"""
from contextlib import contextmanager
import os


@contextmanager
def exclusive_archive(name="Local\\PodcastAhenk_AudioArchive_Worker_1"):
    if os.name == "nt":
        import ctypes
        from ctypes import wintypes

        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        create = kernel.CreateMutexW
        create.argtypes = (ctypes.c_void_p, wintypes.BOOL, wintypes.LPCWSTR)
        create.restype = wintypes.HANDLE
        close = kernel.CloseHandle
        close.argtypes = (wintypes.HANDLE,)
        close.restype = wintypes.BOOL

        handle = create(None, False, name)
        if not handle:
            raise OSError(ctypes.get_last_error(), "Ahenk çalışma kilidi açılamadı")
        already_open = ctypes.get_last_error() == 183  # ERROR_ALREADY_EXISTS
        try:
            yield not already_open
        finally:
            close(handle)
        return

    # Linux CI fallback; production runs on Windows.
    import fcntl
    from pathlib import Path
    import tempfile
    lock_file = Path(tempfile.gettempdir()) / "podcast-ahenk-local-worker.lock"
    with lock_file.open("a+b") as handle:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            acquired = True
        except BlockingIOError:
            acquired = False
        try:
            yield acquired
        finally:
            if acquired:
                fcntl.flock(handle, fcntl.LOCK_UN)
