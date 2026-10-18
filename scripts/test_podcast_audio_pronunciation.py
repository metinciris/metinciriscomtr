import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from scripts import podcast_audio_pronunciation as pron
from scripts import render_podcast_audio as engine


class PronunciationTests(unittest.TestCase):
    def article(self):
        return {"journal": "Modern Pathology", "title": "Ewing p53 lezyonu",
                "pmid": "42874744"}

    def test_global_rule_and_specific_override(self):
        article = self.article()
        rules = pron.empty_rules()
        rules["global"] = [{"find": "Ewing", "say": "Yuing", "whole_word": True}]
        text, speed = pron.speech(article, rules, "Ewing p53 lezyonu")
        self.assertEqual((text, speed), ("Yuing p53 lezyonu", 1.0))
        rules["articles"][pron.identity(article)] = {"text": "Ewing, yavas okuyunuz", "speed": 0.9}
        text, speed = pron.speech(article, rules, "Ewing p53 lezyonu")
        self.assertEqual((text, speed), ("Yuing, yavas okuyunuz", 0.9))

    def test_identity_normalizes_sheet_numeric_pmid(self):
        article = self.article()
        other = {**article, "pmid": 42874744.0}
        self.assertEqual(pron.identity(article), pron.identity(other))

    def test_literal_rule_is_not_regex(self):
        article = self.article()
        rules = pron.empty_rules()
        rules["global"] = [{"find": "p.53", "say": "pe 53", "whole_word": False}]
        text, _ = pron.speech(article, rules, "p.53 pX53")
        self.assertEqual(text, "pe 53 pX53")

    def test_rule_validation_rejects_invalid_speed(self):
        rules = pron.empty_rules()
        rules["global_speed"] = 1.8
        with self.assertRaises(ValueError):
            pron.validate(rules)

    def test_default_speed_retains_existing_fingerprint(self):
        article = self.article()
        with patch.object(engine.pron, "load", return_value=pron.empty_rules()):
            candidate = next(iter(engine.catalog([article]).values()))
        self.assertEqual(candidate["fingerprint"],
                         engine.fingerprint(engine.spoken(article["title"])))

    def test_custom_speed_and_rules_are_used_by_generator(self):
        rules = pron.empty_rules()
        articles = [
            {"journal": f"Journal {i}", "title": f"Patoloji arastirma ozeti {i} kanser biyolojisi",
             "pmid": str(100000 + i)}
            for i in range(20)
        ]
        special = articles[0]
        rules["articles"][pron.identity(special)] = {
            "text": "Ozel yavas okuma.", "speed": 0.9
        }
        captures = []
        with tempfile.TemporaryDirectory() as d, patch.object(engine, "AUDIO_DIR", Path(d)), \
                patch.object(engine, "MANIFEST_PATH", Path(d) / "manifest.json"), \
                patch.object(engine.pron, "load", return_value=rules), \
                patch.object(engine, "render_clip") as render:
            render.side_effect = lambda _tts, text, dest, speed: (
                captures.append((text, speed)), Path(dest).write_bytes(b"ID3" + b"x" * 2048)
            )
            manifest = {"version": 1, "entries": {}}
            plan = engine.plan_updates(articles, manifest, datetime.now(timezone.utc))
            self.assertIn(engine.key_for(special["journal"], special["title"], special["pmid"]),
                          plan["selected"])
            engine.execute_plan(plan, tts=object())
            self.assertIn(("Ozel yavas okuma.", 0.9), captures)
            self.assertEqual(len(engine.load_manifest()["entries"]), 8)


if __name__ == "__main__":
    unittest.main()
