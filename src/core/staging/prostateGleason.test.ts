import { describe, it, expect } from 'vitest';
import { deriveGleasonGrade, GRADE_GRUBU_KAYNAK, GleasonPatern } from './prostateGleason';

describe('deriveGleasonGrade - 3x3 Gleason ve Grade Group matrisi', () => {
  it('GRADE_GRUBU_KAYNAK doğrulama öncesi taslak olarak baslamalidir', () => {
    expect(GRADE_GRUBU_KAYNAK).toContain('doğrulanmadı');
  });

  it.each([
    [3, 3, 6, 1, '3+3=6', false],
    [3, 4, 7, 2, '3+4=7', false],
    [4, 3, 7, 3, '4+3=7', false],
    [3, 5, 8, 4, '3+5=8', true],
    [5, 3, 8, 4, '5+3=8', true],
    [4, 4, 8, 4, '4+4=8', false],
    [4, 5, 9, 5, '4+5=9', true],
    [5, 4, 9, 5, '5+4=9', true],
    [5, 5, 10, 5, '5+5=10', true],
  ])(
    'primer %i + sekonder %i -> toplam %i, Grade Grubu %i (%s)',
    (primer, sekonder, beklenenToplam, beklenenGG, beklenenMetin, uyariBekleniyor) => {
      const res = deriveGleasonGrade({
        primer: primer as GleasonPatern,
        sekonder: sekonder as GleasonPatern,
      });

      expect(res.toplam).toBe(beklenenToplam);
      expect(res.gradeGrubu).toBe(beklenenGG);
      expect(res.skorMetni).toBe(beklenenMetin);

      if (uyariBekleniyor) {
        expect(res.uyari).not.toBeNull();
        expect(res.uyari).toContain('5');
      } else {
        expect(res.uyari).toBeNull();
      }
    },
  );

  it('gecersiz patern girdilerinde hata firlatmalidir', () => {
    expect(() =>
      deriveGleasonGrade({ primer: 2 as any, sekonder: 4 as any }),
    ).toThrow();
    expect(() =>
      deriveGleasonGrade({ primer: 4 as any, sekonder: 6 as any }),
    ).toThrow();
  });
});
