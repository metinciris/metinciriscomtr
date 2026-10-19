"""Two-step Ahenk flow: never re-render local audio; upload status is truthful."""
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import two_step_audio as flow
from scripts import render_podcast_audio as engine


def article(title, number):
    return {"title": title, "journal": "Diagnostic Pathology", "pmid": str(number)}


class TwoStepAudioTests(unittest.TestCase):
    def setUp(self):
        self.articles = [
            article("Existing WEB audio research article", 100),
            article("Website missing but already on Windows", 101),
            article("Website missing and must be synthesized", 102),
        ]
        self.catalog = engine.catalog(self.articles)
        self.keys = list(self.catalog)
        first = self.catalog[self.keys[0]]
        self.web = {"version": 1, "entries": {
            self.keys[0]: {**first, "generated_at": "2026-10-19T10:00:00+00:00"},
        }}

    def test_prepares_only_missing_web_audio_without_re_rendering_pc(self):
        local = {self.keys[1]}
        plan = flow.plan(self.catalog, self.web, lambda key: key in local)
        self.assertEqual(plan["total_articles"], 3)
        self.assertEqual(plan["web_count"], 1)
        self.assertEqual(plan["web_missing"], self.keys[1:])
        self.assertEqual(plan["ready_pc"], [self.keys[1]])
        self.assertEqual(plan["generate_pc"], [self.keys[2]])
        self.assertNotIn(self.keys[0], plan["generate_pc"])

    def test_all_existing_audio_needs_no_synthesis(self):
        ready = set(self.keys[1:])
        plan = flow.plan(self.catalog, self.web, lambda key: key in ready)
        self.assertEqual(plan["generate_pc"], [])
        self.assertEqual(len(plan["ready_pc"]), 2)

    def test_mismatch_in_public_manifest_fails_closed(self):
        wrong = {"version": 1, "entries": {
            self.keys[0]: {"file": self.keys[0] + ".mp3",
                           "title": "Other patient paper", "journal": "Diagnostic Pathology",
                           "pmid": "100"}
        }}
        with self.assertRaisesRegex(RuntimeError, "WEB'deki makale eşleşmiyor"):
            flow.plan(self.catalog, wrong, lambda _key: True)

    def test_progress_persists_restarts_and_verifies_exact_deployed_entries(self):
        keys = self.keys[1:]
        pending = flow.new_progress(keys)
        pending["phase"] = "site_yayini_bekleniyor"
        pending["github_sent"] = keys[:]
        pending["expected"] = {
            keys[0]: {**self.catalog[keys[0]], "generated_at": "2026-10-19T10:01:00+00:00"},
            keys[1]: {**self.catalog[keys[1]], "generated_at": "2026-10-19T10:02:00+00:00"},
        }
        site = {"version": 1, "entries": {
            keys[0]: pending["expected"][keys[0]],
            keys[1]: {**pending["expected"][keys[1]],
                      "generated_at": "2026-10-19T09:59:00+00:00"},
        }}
        self.assertEqual(flow.verified_on_web(pending, site), [keys[0]])
        self.assertIn("GitHub: 2/2", flow.progress_label(pending))
        with tempfile.TemporaryDirectory() as directory:
            flow.save_progress(directory, pending)
            restored = flow.read_progress(directory)
            self.assertEqual(restored["expected"], pending["expected"])
            self.assertEqual(restored["github_sent"], pending["github_sent"])


if __name__ == "__main__":
    unittest.main()
