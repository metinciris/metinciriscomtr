"""Windows pythonw.exe standard stream repair for Ahenk and its libraries.

On Windows, pythonw.exe normally supplies sys.stdout = sys.stderr = None.
Several ML/Hugging Face/PyTorch progress loggers expect writable streams.
Restoring a real, line-buffered file also keeps crash details inspectable.
"""
import atexit
from pathlib import Path
import sys

_OWNED_STREAMS = []


def ensure_stdio(log_dir):
    """Provide a persistent text stream only for missing/broken stdio.

    Return the log file Path; do not change working console streams.
    """
    directory = Path(log_dir)
    directory.mkdir(parents=True, exist_ok=True)
    log = directory / "ahenk_motor.log"
    missing = []
    for name in ("stdout", "stderr"):
        stream = getattr(sys, name, None)
        if stream is None or getattr(stream, "closed", False) or not callable(getattr(stream, "write", None)):
            missing.append(name)
    if missing:
        stream = open(log, "a", encoding="utf-8", buffering=1)
        _OWNED_STREAMS.append(stream)
        atexit.register(stream.close)
        for name in missing:
            setattr(sys, name, stream)
        print("[Podcast Ahenk] pythonw standard streams redirected to", log, flush=True)
    return log
