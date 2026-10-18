"""Shared, stdlib-only pronunciation profiles for the Podcast Ahenk renderer.

Configuration lives next to the committed MP3 manifest. Literal replacement
rules (not user-supplied regexes) and per-title spoken text are intentionally
separate from the source article titles. Never edits Google Sheets content.
"""
import json
import os
from pathlib import Path
import re
import tempfile

DEFAULT_PATH = Path('public/podcast-audio/pronunciation.json')
SPEED_MIN, SPEED_MAX = 0.80, 1.20


def empty_rules():
    return {'version': 1, 'global': [], 'articles': {}, 'global_speed': 1.0}


def identity(article):
    pmid = str(article.get('pmid') or '').strip()
    if re.fullmatch(r'[0-9]+\.0+', pmid):
        pmid = pmid.split('.')[0]
    return json.dumps([str(article['journal']).strip(), str(article['title']).strip(), pmid],
                      ensure_ascii=False, separators=(',', ':'))


def _valid_speed(value):
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not SPEED_MIN <= value <= SPEED_MAX:
        raise ValueError('Okuma hızı 0.80 ile 1.20 arasında olmalıdır.')
    return round(float(value), 2)


def validate(raw):
    if not isinstance(raw, dict) or raw.get('version') != 1:
        raise ValueError('Desteklenmeyen telaffuz dosyası sürümü.')
    rules = raw.get('global', [])
    articles = raw.get('articles', {})
    if not isinstance(rules, list) or len(rules) > 500 or not isinstance(articles, dict):
        raise ValueError('Telaffuz kuralları hatalı.')
    for rule in rules:
        if not isinstance(rule, dict) or not isinstance(rule.get('find'), str) or not isinstance(rule.get('say'), str):
            raise ValueError('Genel telaffuz kuralı hatalı.')
        if not 1 <= len(rule['find'].strip()) <= 120 or len(rule['say']) > 400:
            raise ValueError('Genel telaffuz kuralı fazla uzun ya da boş.')
        if not isinstance(rule.get('whole_word', True), bool):
            raise ValueError('Sözcük sınırı ayarı hatalı.')
    for key, item in articles.items():
        if not isinstance(key, str) or not isinstance(item, dict):
            raise ValueError('Makale telaffuz kaydı hatalı.')
        if 'text' in item and (not isinstance(item['text'], str) or not 1 <= len(item['text'].strip()) <= 3000):
            raise ValueError('Makale okuma metni boş ya da aşırı uzun.')
        if 'speed' in item:
            _valid_speed(item['speed'])
    if 'global_speed' in raw:
        _valid_speed(raw['global_speed'])
    return raw


def load(path=DEFAULT_PATH):
    path = Path(path)
    if not path.is_file():
        return empty_rules()
    return validate(json.loads(path.read_text(encoding='utf-8-sig')))


def save(path, rules):
    validate(rules)
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=path.parent,
                                     prefix='.pron-', suffix='.json', delete=False) as file:
        name = file.name
        json.dump(rules, file, ensure_ascii=False, indent=2)
        file.write('\n')
    os.replace(name, path)


def speech(article, rules, default_spoken):
    """Return (spoken_text, speed); applying global rules to per-title text too."""
    validate(rules)
    current = rules.get('articles', {}).get(identity(article), {})
    text = current.get('text', default_spoken)
    for rule in rules.get('global', []):
        pattern = re.escape(rule['find'])
        if rule.get('whole_word', True):
            pattern = r'(?<!\w)' + pattern + r'(?!\w)'
        text = re.sub(pattern, lambda _match, replacement=rule['say']: replacement,
                      text, flags=re.IGNORECASE)
    speed = _valid_speed(current.get('speed', rules.get('global_speed', 1.0)))
    return text, speed


def signature(text, speed):
    """Keep prior fingerprints unchanged when speed is normal (1.0)."""
    return text if speed == 1.0 else text + '\x00speed=' + f'{speed:.2f}'
