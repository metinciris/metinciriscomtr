import { describe, it, expect } from 'vitest';
import { generateGistReport, riskFrom, pTFromSize, gradeFromMitotic, type GistData } from '../gist';

/**
 * Referans: Miettinen & Lasota, Semin Diagn Pathol 2006 — mNIH risk tablosu
 * Yerleşim × Boyut × Mitoz kombinasyonlarından türetildi
 */
describe('riskFrom', () => {
  // --- Mide yerleşimi ---
  it('Mide, ≤2cm, mitoz≤5 → Çok düşük', () => {
    expect(riskFrom(1.5, 3, 'Mide')).toBe('Çok düşük');
  });

  it('Mide, 2-5cm, mitoz≤5 → Düşük', () => {
    expect(riskFrom(3, 4, 'Mide')).toBe('Düşük');
  });

  it('Mide, 5-10cm, mitoz≤5 → Orta', () => {
    expect(riskFrom(7, 2, 'Mide')).toBe('Orta');
  });

  it('Mide, >10cm, mitoz≤5 → Yüksek', () => {
    expect(riskFrom(12, 3, 'Mide')).toBe('Yüksek');
  });

  it('Mide, ≤2cm, mitoz>5 → Orta', () => {
    expect(riskFrom(1.5, 6, 'Mide')).toBe('Orta');
  });

  it('Mide, >2cm, mitoz>5 → Yüksek', () => {
    expect(riskFrom(6, 10, 'Mide')).toBe('Yüksek');
  });

  // --- İnce bağırsak yerleşimi ---
  it('Jejenum/İleum, ≤2cm, mitoz≤5 → Düşük', () => {
    expect(riskFrom(1.5, 3, 'Jejenum/İleum')).toBe('Düşük');
  });

  it('Jejenum/İleum, herhangi boyut, mitoz>5 → Yüksek', () => {
    expect(riskFrom(3, 7, 'Jejenum/İleum')).toBe('Yüksek');
  });

  // --- Eksik veri ---
  it('Boyut tanımsız → Belirsiz', () => {
    expect(riskFrom(undefined, 3, 'Mide')).toBe('Belirsiz');
  });

  it('Mitoz tanımsız → Belirsiz', () => {
    expect(riskFrom(5, undefined, 'Mide')).toBe('Belirsiz');
  });

  it('Yerleşim boş → Belirsiz', () => {
    expect(riskFrom(5, 3, '')).toBe('Belirsiz');
  });
});

describe('pTFromSize', () => {
  it('0 cm → pT0', () => expect(pTFromSize(0, false)).toBe('pT0'));
  it('≤2cm → pT1', () => expect(pTFromSize(1.5, false)).toBe('pT1'));
  it('≤5cm → pT2', () => expect(pTFromSize(3, false)).toBe('pT2'));
  it('≤10cm → pT3', () => expect(pTFromSize(8, false)).toBe('pT3'));
  it('>10cm → pT4', () => expect(pTFromSize(15, false)).toBe('pT4'));
  it('neoadjuvan → ypT prefix', () => expect(pTFromSize(3, true)).toBe('ypT2'));
  it('tanımsız boyut → boş string', () => expect(pTFromSize(undefined, false)).toBe(''));
  it('tanımsız tedavi durumu → evre öneki tahmin edilmez', () => expect(pTFromSize(3, undefined)).toBe(''));
});

describe('gradeFromMitotic', () => {
  it('mitoz=0 → G1; low grade', () => expect(gradeFromMitotic(0)).toBe('G1; low grade'));
  it('mitoz=5 → G1; low grade', () => expect(gradeFromMitotic(5)).toBe('G1; low grade'));
  it('mitoz=6 → G2; high grade', () => expect(gradeFromMitotic(6)).toBe('G2; high grade'));
  it('mitoz=20 → G2; high grade', () => expect(gradeFromMitotic(20)).toBe('G2; high grade'));
  it('tanımsız → boş string', () => expect(gradeFromMitotic(undefined)).toBe(''));
});

const emptyReportData: GistData = {
  histoTip: '', enBuyukCm: undefined, lx: undefined, wx: undefined, hx: undefined,
  sinir: '', odak: '', yerlesim: '', mitozNum: undefined, nekrozVar: undefined,
  nekrozYuzde: undefined, neoTedaviVar: undefined, canliTumorYuzde: undefined,
  cerrahiMetin: '', nodDurumu: '', cd117: '', dog1: '', sdha: '', sdhb: '',
  braf: '', cd34: '', sma: '', desmin: '', s100: '', ki67: '',
};

describe('generateGistReport', () => {
  it('girilmemiş ve yalnızca boşluk içeren bulguları yazmaz', () => {
    expect(generateGistReport({
      ...emptyReportData, cerrahiMetin: ' \n ', nodDurumu: '  ', ki67: '  ', cd117: '  ',
    })).toBe('');
  });

  it('seçilen tek boyayı yazar; diğer İHK veya klinik bulguları varsaymaz', () => {
    expect(generateGistReport({ ...emptyReportData, dog1: 'Negatif' })).toBe('DOG1 (ANO1): Negatif');
  });

  it('açıkça seçilen olumsuz bulguları korur; gizli yüzdeleri raporlamaz', () => {
    expect(generateGistReport({
      ...emptyReportData, nekrozVar: false, nekrozYuzde: 15,
      neoTedaviVar: false, canliTumorYuzde: 20, cd117: 'Negatif',
    })).toBe('Nekroz: Yok\nNeoadjuvan tedavi: Yok\nC-KİT (CD117): Negatif');
  });

  it('açıkça girilen sıfırı ve seçilen bulguları korur', () => {
    const report = generateGistReport({
      ...emptyReportData, histoTip: 'Gastrointestinal Stromal Tümör, mikst',
      enBuyukCm: 3, yerlesim: 'Mide', mitozNum: 0, nekrozVar: true, nekrozYuzde: 5,
      neoTedaviVar: true, canliTumorYuzde: 0, cerrahiMetin: ' Negatif. ', sdhb: 'İntakt', ki67: '0',
    });
    expect(report.split('\n')).toEqual([
      'Histolojik Tip: Gastrointestinal Stromal Tümör, mikst',
      'En büyük tümör boyutu: 3,0 cm', 'Tümör yerleşimi: Mide', 'Mitotik oran: 0 mitoz/5mm²',
      'Nekroz: Var (%5)', 'Neoadjuvan tedavi vardır. Canlı tümör yüzdesi: %0.',
      'Cerrahi sınırlar: Negatif.', 'Histolojik Grade: G1; low grade',
      'Risk değerlendirmesi: Düşük', 'pT kategori: ypT2', 'SDHB: İntakt', 'Ki-67: %0',
    ]);
  });

  it('boyut ve mitoz girilse de bilinmeyen yerleşim ve tedaviyi varsaymaz', () => {
    expect(generateGistReport({ ...emptyReportData, enBuyukCm: 3, mitozNum: 4 }))
      .toBe('En büyük tümör boyutu: 3,0 cm\nMitotik oran: 4 mitoz/5mm²\nHistolojik Grade: G1; low grade');
  });
});
