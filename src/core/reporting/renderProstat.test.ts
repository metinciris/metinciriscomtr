import { describe, it, expect } from 'vitest';
import { renderProstatReport } from './render';
import prostatSchema from '../../data/report-schemas/prostat-igne-biyopsi.json';
import { ReportSchema } from '../../data/report-schemas/_schema';
import { HAZIR_SABLONLAR } from '../../components/Reporting/useKorSablonu';

describe('renderProstatReport - Prostat İğne Biyopsisi Rapor Üretimi', () => {
  const schema = prostatSchema as unknown as ReportSchema;

  it('hepsi benign korlar durumunda düzgün rapor ve özet üretir', () => {
    const values: Record<string, any> = {
      kor_sayisi: 12,
      yuzde_taban: '12kor',
    };
    for (let i = 1; i <= 12; i++) {
      values[`kor_${i}`] = { tani: 'benign' };
    }

    const res = renderProstatReport(schema, values, {
      sablon: HAZIR_SABLONLAR[0],
      benignKorlariGrupla: false,
    });

    expect(res.plainText).toContain('1- Sağ Taban Lateral: Benign prostat dokusu');
    expect(res.plainText).toContain('Prostat tümör pozitif kor / toplam kor: 0 / 12');
    expect(res.plainText).toContain('Tümör saptanmadı');
    expect(res.missingRequiredFields.length).toBe(0);
  });

  it('benign korlar gruplandığında 1,2,3... formatında birleştirir', () => {
    const values: Record<string, any> = {
      kor_sayisi: 12,
      yuzde_taban: '12kor',
    };
    for (let i = 1; i <= 12; i++) {
      if (i === 2) {
        values[`kor_${i}`] = {
          tani: 'tumor',
          primer_patern: 4,
          sekonder_patern: 3,
          tumor_yuzdesi: 40,
        };
      } else {
        values[`kor_${i}`] = { tani: 'benign' };
      }
    }

    const res = renderProstatReport(schema, values, {
      sablon: HAZIR_SABLONLAR[0],
      benignKorlariGrupla: true,
    });

    expect(res.plainText).toContain('2- Sağ Taban Medial: Prostat adenokarsinomu. Gleason skor: 4+3=7 (Grade Grup 3)');
    expect(res.plainText).toContain('1,3,4,5,6,7,8,9,10,11,12- Benign prostat dokusu');
    expect(res.plainText).toContain('Prostat tümör pozitif kor / toplam kor: 1 / 12');
    expect(res.plainText).toContain('Modifiye Gleason Sistemi: Gleason Skor 4+3=7, Grade Grup 3');
  });

  it('dinamik GRADE_GRUBU_KAYNAK sabitini rapora bağlar', () => {
    const values: Record<string, any> = {
      kor_sayisi: 12,
      yuzde_taban: '12kor',
      kor_1: { tani: 'tumor', primer_patern: 3, sekonder_patern: 4, tumor_yuzdesi: 20 },
    };

    const res = renderProstatReport(schema, values);
    expect(res.plainText).toContain('Derecelendirme Kaynağı: ISUP 2014 (doğrulanmadı)');
  });
});
