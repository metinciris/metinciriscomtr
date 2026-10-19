"""Regression tests: pythonw.exe sets stdout/stderr to None on Windows."""
import sys
import tempfile
import unittest
from pathlib import Path

from stdio_guard import ensure_stdio


class StdioRegression(unittest.TestCase):
    def test_missing_streams_receive_writable_file(self):
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        with tempfile.TemporaryDirectory() as folder:
            try:
                sys.stdout = None
                sys.stderr = None
                log = ensure_stdio(folder)
                self.assertIsNotNone(sys.stdout)
                self.assertIsNotNone(sys.stderr)
                self.assertTrue(callable(sys.stderr.write))
                print("AHENK_TEST_STDOUT", flush=True)
                sys.stderr.write("AHENK_TEST_STDERR\n")
                sys.stderr.flush()
            finally:
                if sys.stdout is not original_stdout:
                    sys.stdout.close()
                sys.stdout = original_stdout
                sys.stderr = original_stderr
            self.assertTrue(Path(log).is_file())
            self.assertIn("AHENK_TEST_STDOUT", Path(log).read_text(encoding="utf-8"))
            self.assertIn("AHENK_TEST_STDERR", Path(log).read_text(encoding="utf-8"))

    def test_console_stdio_is_not_overwritten(self):
        before_stdout = sys.stdout
        before_stderr = sys.stderr
        with tempfile.TemporaryDirectory() as folder:
            ensure_stdio(folder)
        self.assertIs(sys.stdout, before_stdout)
        self.assertIs(sys.stderr, before_stderr)


if __name__ == "__main__":
    unittest.main()
