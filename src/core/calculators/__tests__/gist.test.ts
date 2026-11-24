import { describe, it, expect } from 'vitest';
import { CAP_GIST_RISK_REFERENCE, generateGistReport, riskFrom, pTFromSize, gradeFromMitotic, toNumber, toMitosisCount, type GistData } from '../gist';

describe('CAP Not D, Tablo 1', () => {
  // Her grupta sütunlar: Mide / Duodenum / Jejunum–İleum / Rektum.
  // null, CAP tablosunda yerleşime özgü veri yetersiz demektir.
  const rows = [
    [5, 2, 'Yok', 'Yok', 'Yok', 'Yok'],
    [5, 2.01, 'Çok düşük', 'Düşük', 'Düşük', 'Düşük'],
    [5, 5, 'Çok düşük', 'Düşük', 'Düşük', 'Düşük'],
    [5, 5.01, 'Düşük', null, 'Orta', null],
    [5, 10, 'Düşük', null, 'Orta', null],
    [5, 10.01, 'Orta', 'Yüksek', 'Yüksek', 'Yüksek'],
    [6, 2, 'Yok', null, 'Yüksek', 'Yüksek'],
    [6, 2.01, 'Orta', 'Yüksek', 'Yüksek', 'Yüksek'],
    [6, 5, 'Orta', 'Yüksek', 'Yüksek', 'Yüksek'],
    [6, 5.01, 'Yüksek', null, 'Yüksek', null],
    [6, 10, 'Yüksek', null, 'Yüksek', null],
    [6, 10.01, 'Yüksek', 'Yüksek', 'Yüksek', 'Yüksek'],
  ] as const;
  const sites = ['Mide', 'Duodenum', 'Jejunum/İleum', 'Rektum'] as const;

  for (const [mitoses, size, ...expected] of rows) {
    sites.forEach((site, index) => {
      it(`${site}, ${size} cm, ${mitoses} mitoz`, () => {
        const category = expected[index];
        expect(riskFrom(size, mitoses, site)).toEqual({ kind: category === null ? 'insufficient' : 'direct', category });
      });
    });
  }

  it.each(['Kolon', 'Özofagus', 'Omentum', 'Mezenter', 'Retroperiton', 'Periton', 'Karaciğer', 'Pankreas'])(
    '%s: doğrudan satır yoksa jejunum/ileum ölçütü açıkça ayırt edilir',
    site => expect(riskFrom(7, 3, site)).toEqual({ kind: 'proxy', category: 'Orta' }),
  );

  it('eksik veya geçersiz veri ve neoadjuvan sonrası ölçümler kategori üretmez', () => {
    expect(riskFrom(undefined, 3, 'Mide')).toEqual({ kind: 'missing', category: null });
    expect(riskFrom(5, undefined, 'Mide')).toEqual({ kind: 'missing', category: null });
    expect(riskFrom(5, 3, ' ')).toEqual({ kind: 'missing', category: null });
    expect(riskFrom(5, 3, 'Bilinmiyor')).toEqual({ kind: 'invalid', category: null });
    expect(riskFrom(0, 3, 'Mide')).toEqual({ kind: 'invalid', category: null });
    expect(riskFrom(-2, 3, 'Mide')).toEqual({ kind: 'invalid', category: null });
    expect(riskFrom(Infinity, 3, 'Mide')).toEqual({ kind: 'invalid', category: null });
    expect(riskFrom(5, -1, 'Mide')).toEqual({ kind: 'invalid', category: null });
    expect(riskFrom(5, 5.1, 'Mide')).toEqual({ kind: 'invalid', category: null });
    expect(riskFrom(5, 0, 'Mide')).toEqual({ kind: 'direct', category: 'Çok düşük' });
    expect(riskFrom(7, 3, 'Mide', true)).toEqual({ kind: 'postTreatment', category: null });
  });

  it('önceki yerleşim yazımlarını doğru CAP satırına eşler', () => {
    expect(riskFrom(7, 3, 'Duedonum')).toEqual({ kind: 'insufficient', category: null });
    expect(riskFrom(7, 3, 'Jejenum/İleum')).toEqual({ kind: 'direct', category: 'Orta' });
  });
});

describe('Risk girdileri', () => {
  it('ondalık cm ve sıfır mitozu korur; birimli, kısmi veya kesirli girdi varsaymaz', () => {
    expect(toNumber(' 5,01 ')).toBe(5.01);
    expect(toNumber('7cm')).toBeUndefined();
    expect(toNumber('3.2.1')).toBeUndefined();
    expect(toMitosisCount('0')).toBe(0);
    expect(toMitosisCount('5,1')).toBeUndefined();
    expect(toMitosisCount('6abc')).toBeUndefined();
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
      `Risk değerlendirmesi (${CAP_GIST_RISK_REFERENCE}): Neoadjuvan tedavi sonrası ölçümlerden otomatik kategori atanmadı.`,
      'pT kategori: ypT2', 'SDHB: İntakt', 'Ki-67: %0',
    ]);
  });

  it('mide 7 cm ve 11 cm örneklerini üst kategoriye çıkarmaz', () => {
    const reports = [7, 11].map(enBuyukCm => generateGistReport({
      ...emptyReportData, enBuyukCm, mitozNum: 3, yerlesim: 'Mide',
    }));
    expect(reports[0]).toContain(`Risk değerlendirmesi (${CAP_GIST_RISK_REFERENCE}): Düşük`);
    expect(reports[1]).toContain(`Risk değerlendirmesi (${CAP_GIST_RISK_REFERENCE}): Orta`);
  });

  it('boyutu eşik ötesine yuvarlamadan bildirir, proxy sonucu ayrı etiketler', () => {
    const report = generateGistReport({
      ...emptyReportData, enBuyukCm: 5.01, mitozNum: 3, yerlesim: 'Kolon',
    });
    expect(report).toContain('En büyük tümör boyutu: 5,01 cm');
    expect(report).toContain('Orta | Yerleşim tabloda yok; jejunum/ileum ölçütleri kullanıldı, yerleşime özgü sonuç değildir.');
  });

  it('yetersiz veri ve Yok kategorisi için ayrı klinik açıklamalar verir', () => {
    const insufficient = generateGistReport({ ...emptyReportData, enBuyukCm: 7, mitozNum: 3, yerlesim: 'Rektum' });
    const none = generateGistReport({ ...emptyReportData, enBuyukCm: 2, mitozNum: 3, yerlesim: 'Mide' });
    expect(insufficient).toContain('tabloda veri yetersiz; otomatik kategori atanmadı');
    expect(insufficient).not.toMatch(/: (Yok|Çok düşük|Düşük|Orta|Yüksek)(?:$| \|)/);
    expect(none).toContain('Yok | Tablo kategorisidir; bireysel riskin sıfır olduğunu göstermez.');
  });

  it('boyut ve mitoz girilse de bilinmeyen yerleşim ve tedaviyi varsaymaz', () => {
    expect(generateGistReport({ ...emptyReportData, enBuyukCm: 3, mitozNum: 4 }))
      .toBe('En büyük tümör boyutu: 3,0 cm\nMitotik oran: 4 mitoz/5mm²\nHistolojik Grade: G1; low grade');
  });
});
