import { describe, it, expect } from 'vitest';
import { calculateRCBValue } from '../rcb';

/**
 * Referans: Symmans WF et al. J Clin Oncol 2007;25:4414-4422
 * RCB sınıf eşikleri: <1.36 = Class I, 1.36-3.28 = Class II, ≥3.28 = Class III
 */
describe('calculateRCBValue', () => {
  it('patolojik tam yanıt (pCR) → rcb=0, Class I', () => {
    const result = calculateRCBValue({
      d1: 0, d2: 0, c: 0, pis: 0, pn: 0, dmet: 0,
    });
    expect(result.rcb).toBe(0);
    expect(result.category).toBe('Class I (Minimal tümör yükü)');
  });

  it('RCB < 1.36 → Class I (minimal)', () => {
    // Küçük tümör, düşük selülarite, LN negatif
    const result = calculateRCBValue({
      d1: 5, d2: 4, c: 5, pis: 50, pn: 0, dmet: 0,
    });
    expect(result.rcb).toBeLessThan(1.36);
    expect(result.category).toBe('Class I (Minimal tümör yükü)');
  });

  it('RCB 1.36-3.28 → Class II (orta)', () => {
    // Orta büyüklükte tümör, orta selülarite
    const result = calculateRCBValue({
      d1: 20, d2: 15, c: 20, pis: 10, pn: 1, dmet: 5,
    });
    expect(result.rcb).toBeGreaterThanOrEqual(1.36);
    expect(result.rcb).toBeLessThan(3.28);
    expect(result.category).toBe('Class II (Orta derecede yük)');
  });

  it('RCB ≥ 3.28 → Class III (yaygın)', () => {
    // Büyük tümör, yüksek selülarite, çoklu LN metastaz
    const result = calculateRCBValue({
      d1: 50, d2: 40, c: 80, pis: 5, pn: 4, dmet: 20,
    });
    expect(result.rcb).toBeGreaterThanOrEqual(3.28);
    expect(result.category).toBe('Class III (Yaygın tümör yükü)');
  });

  it('in situ bileşen %100 → invaziv tümör yok → Class I', () => {
    // pis=100 means finv=0, term1=0
    const result = calculateRCBValue({
      d1: 30, d2: 25, c: 100, pis: 100, pn: 0, dmet: 0,
    });
    expect(result.rcb).toBe(0);
    expect(result.category).toBe('Class I (Minimal tümör yükü)');
  });

  it('lenf nodu pozitif olmaksızın büyük tümör → Class II veya III', () => {
    const result = calculateRCBValue({
      d1: 40, d2: 35, c: 60, pis: 0, pn: 0, dmet: 0,
    });
    expect(result.rcb).toBeGreaterThan(0);
    expect(['Class II (Orta derecede yük)', 'Class III (Yaygın tümör yükü)']).toContain(result.category);
  });

  it('rcb değeri details içinde formatlanmış olarak yer alıyor', () => {
    const result = calculateRCBValue({
      d1: 20, d2: 20, c: 30, pis: 0, pn: 2, dmet: 10,
    });
    expect(result.details).toContain(result.rcb.toFixed(3));
    expect(result.details).toContain(result.category);
  });
});
