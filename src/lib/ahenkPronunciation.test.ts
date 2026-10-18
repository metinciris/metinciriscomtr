import { describe, expect, it } from 'vitest';
import { prepareAhenkText } from './ahenkPronunciation';

describe('Ahenk medical title pronunciation', () => {
  it('does not change already-translated medical headlines without confirmed fixes', () => {
    const title = 'HER2, NTRK1 ve Ki-67 için yeni patoloji bulguları';
    expect(prepareAhenkText(title)).toBe(title);
  });

  it('preserves Turkish characters and punctuation', () => {
    const title = 'İmmünohistokimya: %50 ve 14.10.2026';
    expect(prepareAhenkText(title)).toBe(title);
  });
});
