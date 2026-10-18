import unittest

from scripts.render_podcast_audio import collect_articles, key_for, normalize_pmid, spoken


class PodcastAudioPreparationTests(unittest.TestCase):
    def test_numeric_sheet_pmid_is_canonical(self):
        sheet = {"table": {"rows": [
            {"c": [{"v": "Modern Pathology"}]},
            {"c": [{"v": "MAP2K1 mutasyonlu melanositik tümörler"}, None, None, None, None,
                   {"v": 42874744.0}]},
        ]}}
        self.assertEqual(collect_articles(sheet)[0]["pmid"], "42874744")

    def test_hash_does_not_depend_on_pmid_float_representation(self):
        first = key_for("Modern Pathology", "MAP2K1 melanositik tümörler", "42874744.0")
        second = key_for("Modern Pathology", "MAP2K1 melanositik tümörler", "42874744")
        self.assertEqual(first, second)

    def test_safe_pmid_normalization(self):
        self.assertEqual(normalize_pmid("42874744.00"), "42874744")
        self.assertEqual(normalize_pmid(42874744.0), "42874744")
        self.assertEqual(normalize_pmid(""), "")

    def test_spoken_only_pathology_rules_unchanged(self):
        self.assertEqual(spoken("H&E p53 Ewing"), "Hematoksilen Eozin pe 53 Yuing")


if __name__ == "__main__":
    unittest.main()
