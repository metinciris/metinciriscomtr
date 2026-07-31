import { describe, it, expect } from 'vitest';
import { getStomachFeatureText, generateBiopsyReport } from '../endoscopy';
import { BiopsyLocation, type Biopsy } from '../../../types/endoskopi';

describe('getStomachFeatureText', () => {
  it('bilinen anahtar kelimeler için Türkçe açıklama döndürür', () => {
    expect(getStomachFeatureText('foveolarHyperplasia')).toBe('Foveolar hiperplazi vardır');
    expect(getStomachFeatureText('lymphoidFollicle')).toBe('Lenfoid folikül vardır');
    expect(getStomachFeatureText('superficialUlcer')).toBe('Yüzeyel ülser vardır');
  });

  it('bilinmeyen anahtar kelime için boş string döndürür', () => {
    expect(getStomachFeatureText('unknownFeature')).toBe('');
  });
});

describe('generateBiopsyReport', () => {
  const baseBiopsy = {
    id: 'b1',
    location: BiopsyLocation.Mide,
    subLocation: 'Antrum',
    customDiagnosis: 'Kronik aktif gastrit',
    customNotes: [],
    findings: {
      inflammation: '+',
      activation: 'yok',
      atrophy: 'yok',
      intestinalMetaplasia: 'yok',
      hp: 'yok',
    },
  } as unknown as Biopsy;

  it('mide biyopsisi rapor metni oluşturur', () => {
    const report = generateBiopsyReport(baseBiopsy, 0, 1, 1);
    expect(report).toContain('1- Mide, Antrum, endoskopik biyopsi: Kronik aktif gastrit');
  });

  it('birden fazla biyopsi olduğunda sayısal sıra (1/2) eklenir', () => {
    const report = generateBiopsyReport(baseBiopsy, 0, 1, 2);
    expect(report).toContain('Mide, Antrum (1/2)');
  });

  it('aktif alan eşleştiğinde <mark> etiketi eklenir', () => {
    const report = generateBiopsyReport(baseBiopsy, 0, 1, 1, 'b1-diagnosis');
    expect(report).toContain('<mark>');
  });
});
