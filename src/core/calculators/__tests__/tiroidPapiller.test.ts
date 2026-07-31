import { describe, it, expect } from 'vitest';
import { requiresMarginsLine, syncTumorDerivedFields, type Tumor } from '../tiroidPapiller';

/** Temel tümör taslağı */
function makeTumor(overrides: Partial<Tumor> = {}): Tumor {
  return {
    id: 1,
    location: 'Sağ lob',
    size: 10,
    sample: '',
    subtypes: ['Klasik papiller karsinom'],
    encapsulation: 'yoktur',
    capsuleEtOptions: ['Tiroid dışı invazyon yoktur'],
    strapMuscle: '',
    lvInvasion: 'yok',
    lymphaticInvasion: false,
    angioinvasion: false,
    perineuralInvasion: false,
    mitoticActivity: '0',
    necrosis: false,
    includeMarginsLine: false,
    marginsTumorPresent: false,
    marginsNote: '',
    ...overrides,
  };
}

describe('requiresMarginsLine', () => {
  it('tiroid dışı invazyon yok, çizgili kas yok → sınır satırı gerekmez', () => {
    const t = makeTumor({
      capsuleEtOptions: ['Tiroid dışı invazyon yoktur'],
      strapMuscle: '',
    });
    expect(requiresMarginsLine(t)).toBe(false);
  });

  it('tiroid dışı invazyon VAR → sınır satırı gerekir', () => {
    const t = makeTumor({
      capsuleEtOptions: ['Tiroid dışı invazyon vardır'],
      strapMuscle: '',
    });
    expect(requiresMarginsLine(t)).toBe(true);
  });

  it('kapsüle yapışıklık var → sınır satırı gerekir', () => {
    const t = makeTumor({
      capsuleEtOptions: ['Tiroid kapsülüne yapışıktır'],
    });
    expect(requiresMarginsLine(t)).toBe(true);
  });

  it('çizgili kas invazyonu dolu → sınır satırı gerekir', () => {
    const t = makeTumor({
      capsuleEtOptions: ['Tiroid dışı invazyon yoktur'],
      strapMuscle: 'Çizgili kas invazyonu VARDIR',
    });
    expect(requiresMarginsLine(t)).toBe(true);
  });
});

describe('syncTumorDerivedFields', () => {
  it('capsuleEtOptions boşsa varsayılan olarak yoktur ekleniyor', () => {
    const t = makeTumor({ capsuleEtOptions: [] });
    syncTumorDerivedFields(t);
    expect(t.capsuleEtOptions).toContain('Tiroid dışı invazyon yoktur');
  });

  it('tiroid dışı invazyon yoksa strapMuscle temizleniyor', () => {
    const t = makeTumor({
      capsuleEtOptions: ['Tiroid dışı invazyon yoktur'],
      strapMuscle: 'Çizgili kas invazyonu VARDIR',
    });
    syncTumorDerivedFields(t);
    expect(t.strapMuscle).toBe('');
  });

  it('tiroid dışı invazyon varsa cerrahi sınır satırı otomatik ekleniyor', () => {
    const t = makeTumor({
      capsuleEtOptions: ['Tiroid dışı invazyon vardır'],
      includeMarginsLine: false,
    });
    syncTumorDerivedFields(t);
    expect(t.includeMarginsLine).toBe(true);
  });

  it('kapsüle yapışıklık varsa cerrahi sınır satırı otomatik ekleniyor', () => {
    const t = makeTumor({
      capsuleEtOptions: ['Tiroid kapsülüne yapışıktır'],
      includeMarginsLine: false,
    });
    syncTumorDerivedFields(t);
    expect(t.includeMarginsLine).toBe(true);
  });
});
