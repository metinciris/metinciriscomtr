"""No-download tests for automatic user-local Ahenk TTS startup setup."""
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import audio_runtime


class AutoRuntimeTests(unittest.TestCase):
    def test_already_ready_never_runs_pip(self):
        messages = []
        with tempfile.TemporaryDirectory() as temp, \
             patch.object(audio_runtime, "module_available", return_value=True), \
             patch.object(audio_runtime, "ffmpeg_executable", return_value="C:/Tools/ffmpeg.exe"), \
             patch.object(audio_runtime, "_install",
                          side_effect=AssertionError("Existing model was reinstalled")), \
             patch.dict(audio_runtime.os.environ, {}, clear=True):
            self.assertEqual(
                audio_runtime.ensure_runtime(temp, messages.append),
                "C:/Tools/ffmpeg.exe"
            )
            self.assertEqual(
                audio_runtime.os.environ["AHENK_FFMPEG_EXE"],
                "C:/Tools/ffmpeg.exe"
            )
            self.assertIn("hazır", messages[-1])

    def test_only_missing_ffmpeg_installs_in_venv_no_admin(self):
        installed = {"ffmpeg": False}
        calls = []
        def locate():
            return "C:/venv/ffmpeg.exe" if installed["ffmpeg"] else None
        def fake_install(args, timeout, report):
            calls.append(args)
            installed["ffmpeg"] = True
        with tempfile.TemporaryDirectory() as temp, \
             patch.object(audio_runtime, "module_available", return_value=True), \
             patch.object(audio_runtime, "ffmpeg_executable", side_effect=locate), \
             patch.object(audio_runtime, "_install", side_effect=fake_install), \
             patch.dict(audio_runtime.os.environ, {}, clear=True):
            result = audio_runtime.ensure_runtime(temp)
            self.assertEqual(result, "C:/venv/ffmpeg.exe")
            self.assertEqual(calls, [["imageio-ffmpeg>=0.6,<1"]])

    def test_missing_model_packages_install_once_and_are_verified(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            req = root / "scripts" / "podcast-audio-requirements.txt"
            req.parent.mkdir()
            req.write_text("torch==2.11.0\n", encoding="utf-8")
            installed = set(audio_runtime.REQUIRED_MODULES) - {"torch"}
            calls = []
            def available(module):
                return module in installed
            def fake_install(args, timeout, report):
                calls.append(args)
                installed.add("torch")
            with patch.object(audio_runtime, "module_available", side_effect=available), \
                 patch.object(audio_runtime, "_install", side_effect=fake_install), \
                 patch.object(audio_runtime, "ffmpeg_executable", return_value="C:/ffmpeg.exe"):
                audio_runtime.ensure_runtime(root)
            self.assertEqual(calls, [["-r", str(req)]])

    def test_no_missing_packages_never_accesses_network(self):
        with tempfile.TemporaryDirectory() as temp:
            with patch.object(audio_runtime, "module_available", return_value=True), \
                 patch.object(audio_runtime, "ffmpeg_executable", return_value="ffmpeg.exe"), \
                 patch.object(audio_runtime.subprocess, "run",
                              side_effect=AssertionError("Pip should not start")):
                audio_runtime.ensure_runtime(temp)


if __name__ == "__main__":
    unittest.main()
