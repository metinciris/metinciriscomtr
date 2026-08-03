import { StagingInput, StagingResult } from './types';

/**
 * Kolorektal karsinom patolojik evreleme (AJCC 8. Baskı).
 */

export const AJCC_BASKI = '8';

const T_DEGERLERI = ['T0', 'Tis', 'T1', 'T2', 'T3', 'T4a', 'T4b'] as const;

export type PNInput = {
  lenfNoduToplam: number | null | undefined;
  lenfNoduPozitif: number | null | undefined;
  tumorDepoziti: number | null | undefined;
};

/** AJCC: N sınıflaması nod sayısı, toplam incelenen nod ve tümör depozitine bağlıdır. */
export function derivePN({
  lenfNoduToplam,
  lenfNoduPozitif,
  tumorDepoziti,
}: PNInput): string | null {
  if (lenfNoduToplam == null || lenfNoduPozitif == null) {
    return null;
  }

  if (
    !Number.isInteger(lenfNoduToplam) ||
    !Number.isInteger(lenfNoduPozitif) ||
    lenfNoduToplam < 0 ||
    lenfNoduPozitif < 0 ||
    lenfNoduPozitif > lenfNoduToplam
  ) {
    return null;
  }

  if (tumorDepoziti != null) {
    if (!Number.isInteger(tumorDepoziti) || tumorDepoziti < 0) {
      return null;
    }
  }

  // Pozitif nod varsa, depozit durumundan bağımsız olarak N kategorisi nod sayısından belirlenir.
  if (lenfNoduPozitif > 0) {
    if (lenfNoduPozitif === 1) return 'N1a';
    if (lenfNoduPozitif <= 3) return 'N1b';
    if (lenfNoduPozitif <= 6) return 'N2a';
    return 'N2b';
  }

  // Bölgesel nod tutulumu olmaksızın tümör depoziti varlığı N1c olarak sınıflandırılır (AJCC 8 Note L).
  if (tumorDepoziti != null && tumorDepoziti > 0) {
    return 'N1c';
  }

  // Hiç bölgesel nod incelenmemişse ve depozit yoksa/bilinmiyorsa pN0 atanamaz.
  if (lenfNoduToplam === 0) {
    return null;
  }

  if (tumorDepoziti === 0) {
    return 'N0';
  }

  return null;
}

/** N1 ailesi (N1/N1a/N1b/N1c) tek grup olarak değerlendirilir. */
const isN1 = (n: string) => n === 'N1' || n === 'N1a' || n === 'N1b' || n === 'N1c';

export function deriveEvreGrubu(
  pT: string | null,
  pN: string | null,
  pM: string | null | undefined,
): string | null {
  // M1 her şeyin önüne geçer (Any T, Any N → Stage IV)
  if (pM === 'M1a') return 'IVA';
  if (pM === 'M1b') return 'IVB';
  if (pM === 'M1c') return 'IVC';
  if (pM === 'M1') return 'IV';

  if (!pT || !pN || !pM) return null;

  if (pM !== 'M0') return null;

  if (pT === 'T0') return null; // rezidü tümör yok — ypT0 yorumu ayrı ele alınır
  if (pT === 'Tis') return pN === 'N0' ? '0' : null;

  if (pN === 'N0') {
    if (pT === 'T1' || pT === 'T2') return 'I';
    if (pT === 'T3') return 'IIA';
    if (pT === 'T4a') return 'IIB';
    if (pT === 'T4b') return 'IIC';
    return null;
  }

  // T4b + herhangi bir N pozitifliği → IIIC
  if (pT === 'T4b') return 'IIIC';

  if (isN1(pN)) {
    if (pT === 'T1' || pT === 'T2') return 'IIIA';
    if (pT === 'T3' || pT === 'T4a') return 'IIIB';
    return null;
  }

  if (pN === 'N2a') {
    if (pT === 'T1') return 'IIIA';
    if (pT === 'T2' || pT === 'T3') return 'IIIB';
    if (pT === 'T4a') return 'IIIC';
    return null;
  }

  if (pN === 'N2b') {
    if (pT === 'T1' || pT === 'T2') return 'IIIB';
    if (pT === 'T3' || pT === 'T4a') return 'IIIC';
    return null;
  }

  if (pN === 'N2') {
    if (pT === 'T2') return 'IIIB';
    if (pT === 'T4a' || pT === 'T4b') return 'IIIC';
    return null;
  }

  return null;
}

export function deriveColorectalStage(input: StagingInput): StagingResult {
  const uyarilar: string[] = [];
  const eksikAlanlar: string[] = [];

  const pT = input.pT && (T_DEGERLERI as readonly string[]).includes(input.pT) ? input.pT : null;
  if (!pT) eksikAlanlar.push('İnvazyon derinliği');

  const toplam = input.lenfNoduToplam ?? null;
  const pozitif = input.lenfNoduPozitif ?? null;
  const depozit = input.tumorDepoziti ?? null;

  if (toplam == null) eksikAlanlar.push('İncelenen lenf nodu sayısı');
  if (pozitif == null) eksikAlanlar.push('Metastatik lenf nodu sayısı');
  if (input.metastazDurumu === undefined) eksikAlanlar.push('Uzak metastaz durumu');

  const pN = derivePN({ lenfNoduToplam: toplam, lenfNoduPozitif: pozitif, tumorDepoziti: depozit });

  if (toplam === 0 && pN !== 'N1c') {
    uyarilar.push('İncelenen lenf nodu bulunmadığı için pN sınıflaması (pN0) yapılamaz.');
  }

  if (toplam != null && pozitif != null && pozitif > toplam) {
    uyarilar.push(
      `Metastatik lenf nodu sayısı (${pozitif}) incelenen sayıdan (${toplam}) fazla — veri hatası.`,
    );
  }

  if (toplam != null && toplam > 0 && toplam < 12) {
    uyarilar.push(
      `Yalnızca ${toplam} lenf nodu incelendi. Yeterli evreleme için en az 12 nod önerilir.`,
    );
  }

  if (depozit != null && depozit > 0 && pozitif != null && pozitif > 0) {
    uyarilar.push(
      'Tümör depoziti mevcut ancak lenf nodu pozitif olduğu için N sınıflaması nod sayısına göre yapıldı (N1c uygulanmaz).',
    );
  }

  const metastazDurumu = input.metastazDurumu ?? null;
  const metastazPatolojikDogrulandi = !!input.metastazPatolojikDogrulandi;

  // Patolojide pM yalnızca doğrulanmış metastaz varlığında (M1x) pM olarak atanır
  let pM: string | null = null;
  if (metastazDurumu && metastazDurumu.startsWith('M1') && metastazPatolojikDogrulandi) {
    pM = metastazDurumu;
  }

  const evreGrubu = deriveEvreGrubu(pT, pN, metastazDurumu);

  if (pT && pN && metastazDurumu && !evreGrubu) {
    uyarilar.push(`${pT} / ${pN} / ${metastazDurumu} kombinasyonu için evre grubu türetilemedi — elle kontrol edin.`);
  }

  let ozet: string | null = null;
  if (evreGrubu || (pT && pN)) {
    if (pT && pN) {
      if (pM) {
        ozet = `p${pT} p${pN} p${pM}${evreGrubu ? ` — Anatomic evre grubu ${evreGrubu}` : ''}`;
      } else if (metastazDurumu === 'M0') {
        ozet = `p${pT} p${pN}; M0 bilgisi mevcut${evreGrubu ? ` — Anatomic evre grubu ${evreGrubu}` : ''}`;
      } else if (metastazDurumu) {
        ozet = `p${pT} p${pN}; ${metastazDurumu} bilgisi mevcut${evreGrubu ? ` — Anatomic evre grubu ${evreGrubu}` : ''}`;
      } else {
        ozet = `p${pT} p${pN}`;
      }
    } else {
      const parts: string[] = [];
      if (pT) parts.push(`p${pT}`);
      if (pN) parts.push(`p${pN}`);
      if (pM) {
        parts.push(`p${pM}`);
      } else if (metastazDurumu) {
        parts.push(`${metastazDurumu} bilgisi mevcut`);
      }
      ozet = `${parts.join(' ')}${evreGrubu ? ` — Anatomic evre grubu ${evreGrubu}` : ''}`;
    }
  }

  return { pT, pN, pM, evreGrubu, ozet, ajccBaski: AJCC_BASKI, uyarilar, eksikAlanlar };
}
