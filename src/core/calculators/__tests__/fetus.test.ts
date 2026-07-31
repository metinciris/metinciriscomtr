import { describe, it, expect } from 'vitest';
import { calculateFetalOrganWeights, getFetalDataForWeek, FETAL_DATA } from '../fetus';

describe('calculateFetalOrganWeights', () => {
  it('1000g fetüs için organ ağırlıkları oranlara göre hesaplanır', () => {
    const weights = calculateFetalOrganWeights(1000);
    // Beyin %13 = 130g
    const brain = weights.find(w => w.name === 'Beyin');
    expect(brain?.weight).toBe('130.0');

    // Karaciğer %4 = 40g
    const liver = weights.find(w => w.name === 'Karaciğer');
    expect(liver?.weight).toBe('40.0');

    // Kalp %0.7 = 7g
    const heart = weights.find(w => w.name === 'Kalp');
    expect(heart?.weight).toBe('7.0');
  });

  it('7 organ kategorisi döndürür', () => {
    const weights = calculateFetalOrganWeights(500);
    expect(weights.length).toBe(7);
  });
});

describe('getFetalDataForWeek', () => {
  it('geçerli hafta için referans veriyi döndürür', () => {
    const week20 = getFetalDataForWeek(20);
    expect(week20).toBeDefined();
    expect(week20?.weight).toBe(331);
    expect(week20?.crl).toBe(17.1);
  });

  it('geçersiz hafta için undefined döndürür', () => {
    expect(getFetalDataForWeek(5)).toBeUndefined();
    expect(getFetalDataForWeek(45)).toBeUndefined();
  });

  it('FETAL_DATA tablosu 8-41 hafta arası veri içerir', () => {
    expect(FETAL_DATA.length).toBe(34);
    expect(FETAL_DATA[0].week).toBe(8);
    expect(FETAL_DATA[FETAL_DATA.length - 1].week).toBe(41);
  });
});
