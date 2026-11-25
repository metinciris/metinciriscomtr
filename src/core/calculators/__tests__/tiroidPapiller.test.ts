import { describe, expect, it } from 'vitest';
import {
  createEmptyLymphNode,
  createEmptyTumor,
  generateThyroidReport,
  requiresMarginsLine,
  syncTumorDerivedFields,
  type ThyroidReportState,
  type Tumor,
} from '../tiroidPapiller';

const ptc = (id = 1, size: Tumor['size'] = 15): Tumor => ({
  ...createEmptyTumor(id), subtypes: ['Klasik papiller karsinom'], size,
});
const niftp = (id = 2, size: Tumor['size'] = 22): Tumor => ({
  ...createEmptyTumor(id), subtypes: ['NIFTP'], size,
});
const report = (overrides: Partial<ThyroidReportState> = {}) => generateThyroidReport({
  specimenType: '', tumors: [createEmptyTumor(1)], lymphNodes: [], backgroundThyroid: [], freeNote: '', ...overrides,
});

describe('tiroid papiller karsinom raporu', () => {
  it('açılış/sıfırlama taslağı ile yalnızca materyal seçimi kopyalanacak rapor üretmez', () => {
    expect(report()).toBe('');
    expect(report({ specimenType: 'Total Tiroidektomi' })).toBe('');
  });

  it('boş veya tanısı seçilmemiş odak ikinci karsinom sayılmaz', () => {
    expect(report({ tumors: [ptc(), createEmptyTumor(2), { ...createEmptyTumor(3), location: 'Sol lob', size: 6 }] }))
      .toBe(report({ tumors: [ptc()] }));
  });

  it('bir papiller karsinom ve bir NIFTP ayrı gösterilir, multifokal karsinom değildir', () => {
    const text = report({ tumors: [ptc(1, 6), niftp()] });
    expect(text).toContain('Tiroid papiller mikrokarsinom.');
    expect(text).toContain('NIFTP odakları:');
    expect(text).toContain('Çap: 22 mm.');
    expect(text).not.toMatch(/multifokal/i);
  });

  it('iki karsinom ve bir NIFTP yalnızca iki karsinom odağı sayar', () => {
    const text = report({ tumors: [niftp(3), ptc(1), ptc(2, 5)] });
    expect(text).toContain('Papiller karsinom 2 odaklıdır');
    expect(text).not.toContain('3 odaklıdır');
  });

  it('yalnız NIFTP ve çoğul NIFTP karsinom tanısı üretmez', () => {
    const text = report({ tumors: [niftp(1, 4), niftp(2, 8)] });
    expect(text).toContain('2. NIFTP odağı');
    expect(text).not.toMatch(/karsinom/i);
  });

  it.each(['', 0, -1, NaN, Infinity])('geçerli çap yoksa (%s) odak mikrokarsinom değildir', size => {
    const text = report({ tumors: [ptc(1, 6), ptc(2, size)] });
    expect(text).toMatch(/^Tiroid papiller karsinom\./);
    expect(text).toContain('2. Odak: Tiroid papiller karsinom');
  });

  it('10 mm sınırını geçerli ölçümlerde korur', () => {
    expect(report({ tumors: [ptc(1, 10)] })).toContain('papiller mikrokarsinom');
    expect(report({ tumors: [ptc(1, 10.1)] })).not.toContain('mikrokarsinom');
  });

  it('kapsül yapışıklığı sınır alanını açabilir ama negatif bulgu yazmaz', () => {
    const tumor = { ...ptc(), capsuleEtOptions: ['Tiroid kapsülüne yapışıktır'] };
    expect(requiresMarginsLine(tumor)).toBe(true);
    syncTumorDerivedFields(tumor);
    expect(tumor.includeMarginsLine).toBe(true);
    expect(report({ tumors: [tumor] })).toContain('Tiroid kapsülüne yapışıktır.');
    expect(report({ tumors: [tumor] })).not.toMatch(/Cerrahi sınırlarda|Tiroid dışı invazyon yoktur/);
    expect(report({ tumors: [{ ...tumor, marginsTumorPresent: false }] })).toContain('Cerrahi sınırlarda tümör yoktur.');
  });

  it('boş negatif alanları yazmaz, açıkça seçilen negatifleri ve sıfır mitozu korur', () => {
    const omitted = report({ tumors: [ptc()] });
    expect(omitted).not.toMatch(/enkapsülasyon|invazyon|mitotik|nekroz|guatr/i);
    const text = report({ tumors: [{ ...ptc(), perineuralInvasion: false, lvInvasion: 'yoktur',
      necrosis: false, mitoticActivity: '0', capsuleEtOptions: ['Tiroid dışı invazyon yoktur'] }] });
    expect(text).toContain('Perinöral invazyon yoktur.');
    expect(text).toContain('invazyon: yoktur.');
    expect(text).toContain('Nekroz yoktur.');
    expect(text).toContain('Mitotik aktivite: 0 mitoz/2 mm².');
    expect(text).toContain('Tiroid dışı invazyon yoktur.');
  });

  it('geçersiz lenf nodu sayıları ve boş değerler 0/0 veya negatif sonuç üretmez', () => {
    const ln = createEmptyLymphNode(1);
    expect(report({ lymphNodes: [ln, { ...ln, id: 2, total: 4 }, { ...ln, id: 3, total: 0, metastatic: 0 },
      { ...ln, id: 4, total: 2, metastatic: 3 }, { ...ln, id: 5, total: 2, metastatic: 1.5 },
      { ...ln, id: 6, total: 2, metastatic: -1 }] })).toBe('');
    expect(report({ lymphNodes: [{ ...ln, total: 4, metastatic: 0 }] })).toContain('Metastaz yoktur (0/4).');
  });

  it('ENE yalnızca açıkça seçildiyse eklenir, geçerli metastaz sayısını etkilemez', () => {
    const ln = { ...createEmptyLymphNode(1), total: 4, metastatic: 1 };
    expect(report({ lymphNodes: [ln] })).toContain('(1/4)');
    expect(report({ lymphNodes: [ln] })).not.toContain('ENE');
    expect(report({ lymphNodes: [{ ...ln, ene: false }] })).toContain('Ekstranodal yayılım (ENE) yoktur.');
  });

  it('pozitif cerrahi sınır açıklamasını ve açıkça seçilen parankim bulgusunu korur', () => {
    const text = report({
      tumors: [{ ...ptc(), includeMarginsLine: true, marginsTumorPresent: true, marginsNote: 'Arka sınır' }],
      backgroundThyroid: ['Nodüler guatr'],
    });
    expect(text).toContain('Cerrahi sınırlarda tümör VARDIR.');
    expect(text).toContain('Cerrahi sınır açıklaması: Arka sınır.');
    expect(text).toContain('Nodüler guatr');
  });
});
