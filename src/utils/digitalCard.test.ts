import { describe, expect, it } from 'vitest';
import { buildDigitalCardVCard, DIGITAL_CARD_URL, escapeVCardText } from './digitalCard';

describe('dijital akademik kartvizit', () => {
  it('vCard 3.0 ve CRLF satır sonları üretir', () => {
    const card = buildDigitalCardVCard();
    expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
    expect(card.endsWith('END:VCARD\r\n')).toBe(true);
    expect(card.replace(/\r\n/g, '')).not.toContain('\n');
    expect(card).toContain('FN:Prof. Dr. İbrahim Metin Çiriş');
    expect(card).toContain('URL:' + DIGITAL_CARD_URL);
  });

  it('yalnızca açık iş numarasını ve kurumsal e-postaları kullanır', () => {
    const card = buildDigitalCardVCard();
    expect(card).toContain('TEL;TYPE=WORK,VOICE:+902462119292');
    expect(card).toContain('EMAIL;TYPE=INTERNET,WORK:metin@metinciris.com.tr');
    expect(card).toContain('EMAIL;TYPE=INTERNET,WORK:ibrahimciris@sdu.edu.tr');
    expect(card).not.toContain('TYPE=CELL');
  });

  it('özel karakterleri vCard uyumlu kaçırır', () => {
    expect(escapeVCardText('A,B;C\\D\nE')).toBe('A\\,B\\;C\\\\D\\nE');
  });
});
