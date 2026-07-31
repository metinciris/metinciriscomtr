import { describe, it, expect } from 'vitest';
import {
  derivePN,
  deriveEvreGrubu,
  deriveColorectalStage,
} from './colorectal';

/**
 * Kolorektal karsinom için otomatik sınıflandırma testleri.
 *
 * Bu dosya herhangi bir protokol metnini veya evreleme tablosunu
 * yeniden yayımlamaz. Yalnızca uygulamanın karar mantığını sınayan,
 * bağımsız hazırlanmış örnek senaryolar içerir.
 *
 * Evre gruplaması:
 * - AJCC TNM 8. baskı mantığıyla kullanılmalıdır.
 * - Uzak metastaz durumu klinik/patolojik kaynaklardan ayrıca sağlanmalıdır.
 * - Patoloji raporunda pM0 atanmaz.
 */

describe('derivePN — bölgesel lenf nodu sınıflaması', () => {
  it('incelenmiş nodların tamamı negatif ve depozit yoksa N0', () => {
    expect(
      derivePN({
        lenfNoduToplam: 18,
        lenfNoduPozitif: 0,
        tumorDepoziti: 0,
      }),
    ).toBe('N0');
  });

  it('nodlar negatif ve en az bir tümör depoziti varsa N1c', () => {
    expect(
      derivePN({
        lenfNoduToplam: 18,
        lenfNoduPozitif: 0,
        tumorDepoziti: 1,
      }),
    ).toBe('N1c');

    expect(
      derivePN({
        lenfNoduToplam: 12,
        lenfNoduPozitif: 0,
        tumorDepoziti: 5,
      }),
    ).toBe('N1c');
  });

  it('bir pozitif nod varsa N1a', () => {
    expect(
      derivePN({
        lenfNoduToplam: 15,
        lenfNoduPozitif: 1,
        tumorDepoziti: 0,
      }),
    ).toBe('N1a');
  });

  it('iki veya üç pozitif nod varsa N1b', () => {
    expect(
      derivePN({
        lenfNoduToplam: 15,
        lenfNoduPozitif: 2,
        tumorDepoziti: 0,
      }),
    ).toBe('N1b');

    expect(
      derivePN({
        lenfNoduToplam: 15,
        lenfNoduPozitif: 3,
        tumorDepoziti: 0,
      }),
    ).toBe('N1b');
  });

  it('dört ile altı pozitif nod varsa N2a', () => {
    expect(
      derivePN({
        lenfNoduToplam: 18,
        lenfNoduPozitif: 4,
        tumorDepoziti: 0,
      }),
    ).toBe('N2a');

    expect(
      derivePN({
        lenfNoduToplam: 18,
        lenfNoduPozitif: 6,
        tumorDepoziti: 0,
      }),
    ).toBe('N2a');
  });

  it('yedi veya daha fazla pozitif nod varsa N2b', () => {
    expect(
      derivePN({
        lenfNoduToplam: 20,
        lenfNoduPozitif: 7,
        tumorDepoziti: 0,
      }),
    ).toBe('N2b');

    expect(
      derivePN({
        lenfNoduToplam: 30,
        lenfNoduPozitif: 23,
        tumorDepoziti: 0,
      }),
    ).toBe('N2b');
  });

  it('pozitif nod bulunan olguda depozit varlığı N1c oluşturmaz', () => {
    expect(
      derivePN({
        lenfNoduToplam: 20,
        lenfNoduPozitif: 2,
        tumorDepoziti: 4,
      }),
    ).toBe('N1b');
  });

  it('hiç nod incelenmemişse pN kategorisi atanmaz', () => {
    expect(
      derivePN({
        lenfNoduToplam: 0,
        lenfNoduPozitif: 0,
        tumorDepoziti: 0,
      }),
    ).toBeNull();
  });

  it('toplam nod sayısı bilinmiyorsa pN kategorisi atanmaz', () => {
    expect(
      derivePN({
        lenfNoduToplam: null,
        lenfNoduPozitif: 0,
        tumorDepoziti: 0,
      }),
    ).toBeNull();
  });

  it('depozit durumu bilinmiyorsa nod-negatif olguda N0 veya N1c seçmez', () => {
    expect(
      derivePN({
        lenfNoduToplam: 18,
        lenfNoduPozitif: 0,
        tumorDepoziti: null,
      }),
    ).toBeNull();
  });

  it('pozitif nod sayısı bilinmiyorsa pN kategorisi atanmaz', () => {
    expect(
      derivePN({
        lenfNoduToplam: 18,
        lenfNoduPozitif: null,
        tumorDepoziti: 2,
      }),
    ).toBeNull();
  });
});

describe('deriveEvreGrubu — M0 olduğu ayrıca bilinen nod-negatif olgular', () => {
  it.each([
    ['Tis', 'N0', '0'],
    ['T1', 'N0', 'I'],
    ['T2', 'N0', 'I'],
    ['T3', 'N0', 'IIA'],
    ['T4a', 'N0', 'IIB'],
    ['T4b', 'N0', 'IIC'],
  ])('%s %s, M0 → Evre %s', (t, n, beklenen) => {
    expect(deriveEvreGrubu(t, n, 'M0')).toBe(beklenen);
  });
});

describe('deriveEvreGrubu — M0 olduğu ayrıca bilinen nod-pozitif olgular', () => {
  it.each([
    ['T1', 'N1a', 'IIIA'],
    ['T2', 'N1b', 'IIIA'],
    ['T1', 'N2a', 'IIIA'],

    ['T3', 'N1b', 'IIIB'],
    ['T4a', 'N1c', 'IIIB'],
    ['T2', 'N2a', 'IIIB'],
    ['T3', 'N2a', 'IIIB'],
    ['T1', 'N2b', 'IIIB'],
    ['T2', 'N2b', 'IIIB'],

    ['T4a', 'N2a', 'IIIC'],
    ['T3', 'N2b', 'IIIC'],
    ['T4a', 'N2b', 'IIIC'],
    ['T4b', 'N1a', 'IIIC'],
    ['T4b', 'N1c', 'IIIC'],
    ['T4b', 'N2a', 'IIIC'],
    ['T4b', 'N2b', 'IIIC'],
  ])('%s %s, M0 → Evre %s', (t, n, beklenen) => {
    expect(deriveEvreGrubu(t, n, 'M0')).toBe(beklenen);
  });

  it('N1c, evre gruplamasında N1 kategorisi içinde değerlendirilir', () => {
    expect(deriveEvreGrubu('T3', 'N1c', 'M0')).toBe('IIIB');
    expect(deriveEvreGrubu('T4b', 'N1c', 'M0')).toBe('IIIC');
  });
});

describe('deriveEvreGrubu — uzak metastaz', () => {
  it('M1 alt kategorisi evre IV grubunu belirler', () => {
    expect(deriveEvreGrubu('T1', 'N0', 'M1a')).toBe('IVA');
    expect(deriveEvreGrubu('T4b', 'N2b', 'M1b')).toBe('IVB');
    expect(deriveEvreGrubu('T2', 'N1a', 'M1c')).toBe('IVC');
  });

  it('M durumu bilinmiyorsa evre grubu türetmez', () => {
    expect(deriveEvreGrubu('T3', 'N1b', null)).toBeNull();
    expect(deriveEvreGrubu('T3', 'N1b', undefined)).toBeNull();
  });
});

describe('deriveColorectalStage — veri doğrulama ve uyarılar', () => {
  it('12’den az nod incelendiğinde kalite uyarısı verir', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 8,
      lenfNoduPozitif: 0,
      tumorDepoziti: 0,
      metastazDurumu: 'M0',
    });

    expect(
      r.uyarilar.some((u) => u.includes('12')),
    ).toBe(true);

    expect(r.pN).toBe('N0');
    expect(r.evreGrubu).toBe('IIA');
  });

  it('12 veya daha fazla nod incelendiğinde nod sayısı uyarısı vermez', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 16,
      lenfNoduPozitif: 0,
      tumorDepoziti: 0,
      metastazDurumu: 'M0',
    });

    expect(
      r.uyarilar.some((u) => u.includes('12')),
    ).toBe(false);
  });

  it('pozitif nod sayısı toplam nod sayısını aşarsa veri hatası verir', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 5,
      lenfNoduPozitif: 9,
      tumorDepoziti: 0,
      metastazDurumu: 'M0',
    });

    expect(
      r.uyarilar.some((u) =>
        u.toLocaleLowerCase('tr-TR').includes('veri hatası'),
      ),
    ).toBe(true);

    expect(r.pN).toBeNull();
    expect(r.evreGrubu).toBeNull();
  });

  it('pozitif nod ve depozit birlikteyse pN pozitif nod sayısından türetilir', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 20,
      lenfNoduPozitif: 2,
      tumorDepoziti: 3,
      metastazDurumu: 'M0',
    });

    expect(r.pN).toBe('N1b');

    expect(
      r.uyarilar.some((u) => u.includes('N1c uygulanmaz')),
    ).toBe(true);
  });

  it('nod negatifken depozit durumu bilinmiyorsa pN türetmez', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 20,
      lenfNoduPozitif: 0,
      tumorDepoziti: null,
      metastazDurumu: 'M0',
    });

    expect(r.pN).toBeNull();
    expect(r.evreGrubu).toBeNull();
  });

  it('hiç nod bulunmamışsa N0 atamaz', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 0,
      lenfNoduPozitif: 0,
      tumorDepoziti: 0,
      metastazDurumu: 'M0',
    });

    expect(r.pN).toBeNull();
    expect(r.evreGrubu).toBeNull();

    expect(
      r.uyarilar.some((u) =>
        u.toLocaleLowerCase('tr-TR').includes('lenf nodu'),
      ),
    ).toBe(true);
  });

  it('eksik temel alanları listeler', () => {
    const r = deriveColorectalStage({});

    expect(r.eksikAlanlar).toContain('İnvazyon derinliği');
    expect(r.eksikAlanlar).toContain('İncelenen lenf nodu sayısı');
    expect(r.eksikAlanlar).toContain('Uzak metastaz durumu');
    expect(r.evreGrubu).toBeNull();
    expect(r.ozet).toBeNull();
  });
});

describe('deriveColorectalStage — özet satırı', () => {
  it('M0 bilgisi ayrıca sağlanmışsa evre grubunu gösterir', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 18,
      lenfNoduPozitif: 2,
      tumorDepoziti: 0,
      metastazDurumu: 'M0',
    });

    expect(r.ozet).toBe(
      'pT3 pN1b; M0 bilgisi mevcut — Anatomic evre grubu IIIB',
    );
  });

  it('M durumu bilinmiyorsa yalnızca patolojik T ve N bilgisini özetler', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 18,
      lenfNoduPozitif: 2,
      tumorDepoziti: 0,
    });

    expect(r.pN).toBe('N1b');
    expect(r.evreGrubu).toBeNull();
    expect(r.ozet).toBe('pT3 pN1b');
  });

  it('patolojik olarak doğrulanmış M1 kategorisini gösterebilir', () => {
    const r = deriveColorectalStage({
      pT: 'T3',
      lenfNoduToplam: 18,
      lenfNoduPozitif: 2,
      tumorDepoziti: 0,
      metastazDurumu: 'M1a',
      metastazPatolojikDogrulandi: true,
    });

    expect(r.evreGrubu).toBe('IVA');
    expect(r.ozet).toBe('pT3 pN1b pM1a — Anatomic evre grubu IVA');
  });

  it('T0 olguda otomatik evre grubu oluşturmaz', () => {
    const r = deriveColorectalStage({
      pT: 'T0',
      lenfNoduToplam: 15,
      lenfNoduPozitif: 0,
      tumorDepoziti: 0,
      metastazDurumu: 'M0',
    });

    expect(r.evreGrubu).toBeNull();
    expect(r.uyarilar.length).toBeGreaterThan(0);
  });
});
