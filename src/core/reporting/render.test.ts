import { describe, it, expect } from 'vitest';
import { renderReport, evaluateVisibility, formatFieldValueLabel } from './render';
import { ReportSchema } from '../../data/report-schemas/_schema';

const mockSchema: ReportSchema = {
  id: 'test-schema',
  baslik: 'Test Raporu',
  bolumler: [
    {
      id: 'sec1',
      baslik: 'Birinci Bölüm',
      alanlar: [
        {
          id: 'alan1',
          etiket: 'Alan One',
          tip: 'select',
          zorunlu: true,
          raporSatiri: 'Alan One: {deger}',
          secenekler: [
            { deger: 'opt1', etiket: 'Seçenek 1' },
            { deger: 'opt2', etiket: 'Seçenek 2' },
          ],
        },
        {
          id: 'alan2',
          etiket: 'Alan Two (Optional)',
          tip: 'text',
          raporSatiri: 'Alan Two: {deger}',
        },
        {
          id: 'alan3',
          etiket: 'Alan Three (Conditional)',
          tip: 'boolean',
          gorunurKosul: { alan: 'alan1', operator: 'esittir', deger: 'opt2' },
          raporSatiri: 'Alan Three: var',
        },
      ],
    },
  ],
};

describe('evaluateVisibility', () => {
  it('evaluates esittir operator correctly', () => {
    expect(evaluateVisibility({ alan: 'foo', operator: 'esittir', deger: 'bar' }, { foo: 'bar' })).toBe(true);
    expect(evaluateVisibility({ alan: 'foo', operator: 'esittir', deger: 'bar' }, { foo: 'baz' })).toBe(false);
  });

  it('evaluates esitDegil operator correctly', () => {
    expect(evaluateVisibility({ alan: 'foo', operator: 'esitDegil', deger: 'bar' }, { foo: 'baz' })).toBe(true);
    expect(evaluateVisibility({ alan: 'foo', operator: 'esitDegil', deger: 'bar' }, { foo: 'bar' })).toBe(false);
  });
});

describe('formatFieldValueLabel', () => {
  it('formats select labels correctly', () => {
    const field = mockSchema.bolumler[0].alanlar[0];
    expect(formatFieldValueLabel(field, 'opt1')).toBe('Seçenek 1');
  });

  it('returns null for empty values', () => {
    const field = mockSchema.bolumler[0].alanlar[1];
    expect(formatFieldValueLabel(field, '')).toBeNull();
    expect(formatFieldValueLabel(field, null)).toBeNull();
  });
});

describe('renderReport', () => {
  it('renders required missing fields as [BELİRTİLMEDİ] and lists them', () => {
    const res = renderReport(mockSchema, {});
    expect(res.missingRequiredFields).toContain('Alan One');
    expect(res.plainText).toContain('Alan One: [BELİRTİLMEDİ]');
  });

  it('silently omits optional empty fields', () => {
    const res = renderReport(mockSchema, { alan1: 'opt1' });
    expect(res.plainText).toContain('Alan One: Seçenek 1');
    expect(res.plainText).not.toContain('Alan Two');
  });

  it('hides conditional fields when condition is not met', () => {
    const res = renderReport(mockSchema, { alan1: 'opt1', alan3: true });
    expect(res.plainText).not.toContain('Alan Three');
  });

  it('shows conditional fields when condition is met', () => {
    const res = renderReport(mockSchema, { alan1: 'opt2', alan3: true });
    expect(res.plainText).toContain('Alan Three');
  });
});
