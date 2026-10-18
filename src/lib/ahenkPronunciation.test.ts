import { describe, expect, it } from 'vitest';
import { prepareAhenkText } from './ahenkPronunciation';

describe('Ahenk medical title pronunciation', () => {
  it('reads the user-requested H&E, p53 and Ewing corrections', () => {
    const title = 'H&E ile Ewing sarkomunda p53 değerlendirmesi';
    expect(prepareAhenkText(title)).toBe(
      'Hematoksilen Eozin ile Yuing sarkomunda pe 53 değerlendirmesi',
    );
  });

  it('handles spacing and case variants of the requested terms', () => {
    expect(prepareAhenkText('h & e, H&E, EWING ve P-53')).toBe(
      'Hematoksilen Eozin, Hematoksilen Eozin, Yuing ve pe 53',
    );
    expect(prepareAhenkText('Ewing-benzeri tümör')).toBe('Yuing-benzeri tümör');
  });

  it('reads commonly used p-series immunohistochemical markers as pe + number', () => {
    expect(prepareAhenkText('p16, p40, p63 ve p57')).toBe(
      'pe 16, pe 40, pe 63 ve pe 57',
    );
  });

  it('does not rewrite genes, partial identifiers or already-correct abbreviations', () => {
    const title = 'TP53, HER2, NTRK1, Ki-67, p534 ve Ewington';
    expect(prepareAhenkText(title)).toBe(title);
  });

  it('preserves Turkish characters, punctuation and unrelated medical headlines', () => {
    const title = 'İmmünohistokimya: %50 ve 14.10.2026';
    expect(prepareAhenkText(title)).toBe(title);
  });
});
