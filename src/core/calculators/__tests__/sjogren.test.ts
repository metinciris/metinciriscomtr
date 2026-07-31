import { describe, it, expect } from 'vitest';
import { generateSjogrenReport, type SjogrenInputs } from '../sjogren';

/**
 * Referans: Shiboski CH et al. ACR-EULAR 2016 kriterleri
 * Fokus skoru ≥1/4mm² → Sjögren sendromu için pozitif
 */

const defaultInputs: SjogrenInputs = {
  stains: [],
  yeterlilik: 'yeterli',
  izlenenMm2: '8',
  fokus: 'yok',
  fibrozis: 'yok',
  yaglanma: 'yok',
  otherFindings: {
    enYogun: false,
    plazmaNadir: false,
    plazmaTopluluk: false,
    onkositik: false,
    devKonfluen: false,
    germinal: false,
    mukozal: false,
  },
  customOther: '',
};

describe('generateSjogrenReport — tanı metni', () => {
  it('yeterli doku, fokus yok, fibrozis yok → Normal görünümlü minör tükrük bezi', () => {
    const report = generateSjogrenReport({ ...defaultInputs, fokus: 'yok', fibrozis: 'yok' });
    expect(report).toContain('Normal görünümlü minör tükrük bezi');
  });

  it('yeterli doku, fokus<1, fibrozis yok → Bir fokusdan az inflamasyon', () => {
    const report = generateSjogrenReport({ ...defaultInputs, fokus: 'az', fibrozis: 'yok' });
    expect(report).toContain('Bir fokusdan az');
  });

  it('yeterli doku, 1 fokus, fibrozis yok → Bir fokus', () => {
    const report = generateSjogrenReport({ ...defaultInputs, fokus: 'bir', fibrozis: 'yok' });
    expect(report).toContain('Fokal lenfositik inflamasyon (Bir fokus)');
    expect(report).toContain('fibrozis yok');
  });

  it('yeterli doku, 2+ fokus, fibrozis yok → İki veya daha fazla fokus', () => {
    const report = generateSjogrenReport({ ...defaultInputs, fokus: 'iki', fibrozis: 'yok' });
    expect(report).toContain('İki veya daha fazla fokus lenfositik inflamasyon');
  });

  it('yeterli doku, 4 fokus, belirgin fibrozis → fibrozis de belirtiliyor', () => {
    const report = generateSjogrenReport({ ...defaultInputs, fokus: 'dort', fibrozis: 'belirgin' });
    expect(report).toContain('İki veya daha fazla fokus lenfositik inflamasyon');
    expect(report).toContain('belirgin fibrozis');
  });

  it('yetersiz doku → Nondiagnostik', () => {
    const report = generateSjogrenReport({ ...defaultInputs, yeterlilik: 'yetersiz' });
    expect(report).toContain('Nondiagnostik');
  });

  it('glandüler doku yok → Nondiagnostik', () => {
    const report = generateSjogrenReport({ ...defaultInputs, yeterlilik: 'yok' });
    expect(report).toContain('Nondiagnostik');
  });

  it('germinal merkez bulgusu raporda yer alıyor', () => {
    const report = generateSjogrenReport({
      ...defaultInputs,
      fokus: 'iki',
      otherFindings: { ...defaultInputs.otherFindings, germinal: true },
    });
    expect(report).toContain('Germinal merkez');
  });

  it('boyama bilgisi raporda yer alıyor', () => {
    const report = generateSjogrenReport({
      ...defaultInputs,
      stains: ['HE', 'PAS'],
    });
    expect(report).toContain('HE');
    expect(report).toContain('PAS');
  });

  it('yeterlilik tipi raporda yansıyor', () => {
    const report = generateSjogrenReport({ ...defaultInputs, yeterlilik: 'sinirli' });
    expect(report).toContain('sınırlı yeterli');
  });
});
