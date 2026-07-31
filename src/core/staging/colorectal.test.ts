import { describe, it, expect } from 'vitest';
import { derivePN, deriveEvreGrubu, deriveColorectalStage } from './colorectal';

/**
 * ⚠️ Aşağıdaki beklenen değerler AJCC kolorektal protokolünden hatırlanarak yazılmıştır.
 *    Her satırı kaynakla doğrulayın; doğruladığınız satırın sonuna // ✓ işareti koyun.
 *    Mümkünse kendi arşivinizden çıkmış, raporlanmış vakalarla değiştirin.
 */

describe('derivePN — nod sayısından N sınıflaması', () => {
  it('nod negatif, depozit yok → N0', () => {
    expect(derivePN(0, 0)).toBe('N0');
    expect(derivePN(0, null)).toBe('N0');
  });

  it('nod negatif ama tümör depoziti var → N1c', () => {
    expect(derivePN(0, 1)).toBe('N1c');
    expect(derivePN(0, 5)).toBe('N1c');
  });

  it('1 pozitif nod → N1a', () => {
    expect(derivePN(1, 0)).toBe('N1a');
  });

  it('2–3 pozitif nod → N1b', () => {
    expect(derivePN(2, 0)).toBe('N1b');
    expect(derivePN(3, 0)).toBe('N1b');
  });

  it('4–6 pozitif nod → N2a', () => {
    expect(derivePN(4, 0)).toBe('N2a');
    expect(derivePN(6, 0)).toBe('N2a');
  });

  it('7 ve üzeri pozitif nod → N2b', () => {
    expect(derivePN(7, 0)).toBe('N2b');
    expect(derivePN(23, 0)).toBe('N2b');
  });

  it('nod pozitifken depozit N sınıflamasını değiştirmez', () => {
    expect(derivePN(2, 4)).toBe('N1b');
  });

  it('veri yoksa null', () => {
    expect(derivePN(null, null)).toBeNull();
    expect(derivePN(undefined, 2)).toBeNull();
  });
});

describe('deriveEvreGrubu — nod negatif olgular', () => {
  it.each([
    ['Tis', 'N0', '0'],
    ['T1', 'N0', 'I'],
    ['T2', 'N0', 'I'],
    ['T3', 'N0', 'IIA'],
    ['T4a', 'N0', 'IIB'],
    ['T4b', 'N0', 'IIC'],
  ])('%s %s M0 → Evre %s', (t, n, beklenen) => {
    expect(deriveEvreGrubu(t, n, 'M0')).toBe(beklenen);
  });
});

describe('deriveEvreGrubu — nod pozitif olgular', () => {
  it.each([
    ['T1', 'N1a', 'IIIA'],
    ['T2', 'N1b', 'IIIA'],
    ['T1', 'N2a', 'IIIA'],
    ['T3', 'N1b', 'IIIB'],
    ['T4a', 'N1c', 'IIIB'],
    ['T2', 'N2a', 'IIIB'],
    ['T1', 'N2b', 'IIIB'],
    ['T4a', 'N2a', 'IIIC'],
    ['T3', 'N2b', 'IIIC'],
    ['T4b', 'N1a', 'IIIC'],
    ['T4b', 'N2b', 'IIIC'],
  ])('%s %s M0 → Evre %s', (t, n, beklenen) => {
    expect(deriveEvreGrubu(t, n, 'M0')).toBe(beklenen);
  });

  it('N1c, N1a/N1b ile aynı grupta değerlendirilir', () => {
    expect(deriveEvreGrubu('T3', 'N1c', 'M0')).toBe(deriveEvreGrubu('T3', 'N1a', 'M0'));
  });
});

describe('deriveEvreGrubu — uzak metastaz', () => {
  it('M1 her T ve N kombinasyonunu geçersiz kılar', () => {
    expect(deriveEvreGrubu('T1', 'N0', 'M1a')).toBe('IVA');
    expect(deriveEvreGrubu('T4b', 'N2b', 'M1b')).toBe('IVB');
    expect(deriveEvreGrubu('T2', 'N1a', 'M1c')).toBe('IVC');
  });
});

describe('deriveColorectalStage — uyarılar', () => {
  it('12 altı lenf nodunda uyarı verir', () => {
    const r = deriveColorectalStage({ pT: 'T3', lenfNoduToplam: 8, lenfNoduPozitif: 0 });
    expect(r.uyarilar.some((u) => u.includes('en az 12'))).toBe(true);
    expect(r.evreGrubu).toBe('IIA');
  });

  it('12 ve üzeri lenf nodunda uyarı vermez', () => {
    const r = deriveColorectalStage({ pT: 'T3', lenfNoduToplam: 16, lenfNoduPozitif: 0 });
    expect(r.uyarilar.some((u) => u.includes('en az 12'))).toBe(false);
  });

  it('pozitif nod sayısı toplamı aşarsa veri hatası uyarısı', () => {
    const r = deriveColorectalStage({ pT: 'T3', lenfNoduToplam: 5, lenfNoduPozitif: 9 });
    expect(r.uyarilar.some((u) => u.includes('veri hatası'))).toBe(true);
  });

  it('nod pozitifken depozit varsa N1c uygulanmadığını bildirir', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 20,
      lenfNoduPozitif: 2,
      tumorDepoziti: 3,
    });
    expect(r.pN).toBe('N1b');
    expect(r.uyarilar.some((u) => u.includes('N1c uygulanmaz'))).toBe(true);
  });

  it('eksik alanları listeler', () => {
    const r = deriveColorectalStage({});
    expect(r.eksikAlanlar).toContain('İnvazyon derinliği');
    expect(r.eksikAlanlar).toContain('İncelenen lenf nodu sayısı');
    expect(r.evreGrubu).toBeNull();
    expect(r.ozet).toBeNull();
  });
});

describe('deriveColorectalStage — özet satırı', () => {
  it('rapora yazılacak tek satırı üretir', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 18,
      lenfNoduPozitif: 2,
    });
    expect(r.ozet).toBe('T3 N1b M0 — Evre IIIB');
  });

  it('tam yanıtlı olguda evre türetmez, uyarı bırakır', () => {
    const r = deriveColorectalStage({ pT: 'T0', lenfNoduToplam: 15, lenfNoduPozitif: 0 });
    expect(r.evreGrubu).toBeNull();
    expect(r.uyarilar.length).toBeGreaterThan(0);
  });
});
