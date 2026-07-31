import { describe, it, expect } from 'vitest';
import { generateTiiabReport, generateSuggestedDiagnosis, Sample } from '../tiiab';

describe('TİİAB (Bethesda 2023) Raporlama Motoru', () => {
  it('Yetersiz hücresellikte Bethesda Kategori 1 tanısı önermelidir', () => {
    const sample: Sample = {
      id: 1,
      type: 'thyroid',
      selectedFeatures: ['inadequate-cellularity'],
      customInputs: {},
      diagnosis: '',
    };
    const suggested = generateSuggestedDiagnosis(sample);
    expect(suggested).toBe('Tanısal Olmayan / Yetersiz (Bethesda Kategori 1)');
  });

  it('Bol kolloid varlığında hücresellik az olsa bile Bethesda Kategori 2 önermelidir', () => {
    const sample: Sample = {
      id: 1,
      type: 'thyroid',
      selectedFeatures: ['inadequate-cellularity', 'adequate-colloid'],
      customInputs: {},
      diagnosis: '',
    };
    const suggested = generateSuggestedDiagnosis(sample);
    expect(suggested).toBe('Benign (Bethesda Kategori 2)');
  });

  it('Nükleer yarıklar ve psödoinklüzyonlar varlığında Bethesda Kategori 6 (Malign) önermelidir', () => {
    const sample: Sample = {
      id: 1,
      type: 'thyroid',
      selectedFeatures: ['adequate-cellularity', 'papillary-structures', 'nuclear-grooves', 'nuclear-inclusions'],
      customInputs: {},
      diagnosis: '',
    };
    const suggested = generateSuggestedDiagnosis(sample);
    expect(suggested).toBe('Malign (Bethesda Kategori 6)');
  });

  it('Önemi Belirsiz Atipi (Bethesda Kategori 3) için alt tip detayını rapora eklemelidir', () => {
    const samples: Sample[] = [
      {
        id: 1,
        type: 'thyroid',
        selectedFeatures: ['adequate-cellularity'],
        customInputs: {},
        diagnosis: 'Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3)',
        bethesda3Type: 'nuclear',
      },
    ];
    const report = generateTiiabReport(samples);
    expect(report).toContain('Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3) (Nükleer atipi)');
  });

  it('Birden fazla biyopsi örneğinde rapor başlıklarını doğru numaralandırmalıdır', () => {
    const samples: Sample[] = [
      {
        id: 1,
        type: 'thyroid',
        selectedFeatures: ['adequate-cellularity', 'adequate-colloid'],
        customInputs: {},
        diagnosis: 'Benign (Bethesda Kategori 2)',
      },
      {
        id: 2,
        type: 'thyroid',
        selectedFeatures: ['inadequate-cellularity'],
        customInputs: {},
        diagnosis: 'Tanısal Olmayan / Yetersiz (Bethesda Kategori 1)',
      },
    ];
    const report = generateTiiabReport(samples);
    expect(report).toContain('1- (Örnek NO:1) Tiroid');
    expect(report).toContain('2- (Örnek NO:2) Tiroid');
  });
});
