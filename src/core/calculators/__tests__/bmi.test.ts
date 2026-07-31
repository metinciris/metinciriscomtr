import { describe, it, expect } from 'vitest';
import { calculateBMI } from '../bmi';

/**
 * Referans: WHO VKİ sınıflandırması
 * <18.5: Zayıf | 18.5-24.9: Normal | 25-29.9: Fazla Kilolu
 * 30-34.9: I.Derece Obez | 35-39.9: II.Derece Obez | ≥40: III.Derece Obez
 */
describe('calculateBMI', () => {
  it('VKİ < 18.5 → Zayıf', () => {
    // 50 kg, 175 cm → VKİ = 50/(1.75²) ≈ 16.33
    const { bmi, category } = calculateBMI(50, 175);
    expect(bmi).toBeCloseTo(16.33, 1);
    expect(category).toBe('Zayıf');
  });

  it('VKİ 18.5-24.9 → Normal Kilolu', () => {
    // 70 kg, 175 cm → VKİ = 70/3.0625 ≈ 22.86
    const { bmi, category } = calculateBMI(70, 175);
    expect(bmi).toBeCloseTo(22.86, 1);
    expect(category).toBe('Normal Kilolu');
  });

  it('VKİ sınırında ≥18.5 → Normal Kilolu', () => {
    // 57 kg, 175 cm → VKİ = 57/3.0625 ≈ 18.61 (kesin sınır üstü)
    const { bmi, category } = calculateBMI(57, 175);
    expect(bmi).toBeGreaterThanOrEqual(18.5);
    expect(category).toBe('Normal Kilolu');
  });

  it('VKİ 25-29.9 → Fazla Kilolu', () => {
    // 85 kg, 175 cm → VKİ ≈ 27.76
    const { bmi, category } = calculateBMI(85, 175);
    expect(bmi).toBeCloseTo(27.76, 1);
    expect(category).toBe('Fazla Kilolu');
  });

  it('VKİ 30-34.9 → I. Derece Obez', () => {
    // 100 kg, 175 cm → VKİ ≈ 32.65
    const { bmi, category } = calculateBMI(100, 175);
    expect(bmi).toBeCloseTo(32.65, 1);
    expect(category).toBe('I. Derece Obez');
  });

  it('VKİ 35-39.9 → II. Derece Obez', () => {
    // 115 kg, 175 cm → VKİ ≈ 37.55
    const { bmi, category } = calculateBMI(115, 175);
    expect(bmi).toBeCloseTo(37.55, 1);
    expect(category).toBe('II. Derece Obez');
  });

  it('VKİ ≥ 40 → III. Derece Obez (Morbid)', () => {
    // 130 kg, 175 cm → VKİ ≈ 42.45
    const { bmi, category } = calculateBMI(130, 175);
    expect(bmi).toBeCloseTo(42.45, 1);
    expect(category).toBe('III. Derece Obez (Morbid)');
  });

  it('boy cm olarak doğru hesaplanıyor (100 cm birim test)', () => {
    // 70 kg, 170 cm → VKİ = 70/(1.70²) ≈ 24.22
    const { bmi } = calculateBMI(70, 170);
    expect(bmi).toBeCloseTo(24.22, 1);
  });
});
