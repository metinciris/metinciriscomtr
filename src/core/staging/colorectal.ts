import { StagingInput, StagingResult } from './types';

/**
 * Kolorektal karsinom patolojik evreleme.
 *
 * ⚠️ Bu dosyadaki kurallar AJCC kolorektal protokolünden hatırlanarak yazılmıştır.
 *    Yayına almadan önce geçerli AJCC baskısıyla satır satır doğrulanmalıdır.
 *    Doğrulama sonrası AJCC_BASKI sabitini güncelleyin.
 */

export const AJCC_BASKI = '8 (doğrulanmadı)';

const T_DEGERLERI = ['T0', 'Tis', 'T1', 'T2', 'T3', 'T4a', 'T4b'] as const;

/** AJCC: N sınıflaması yalnızca nod sayısı ve tümör depozitine bağlıdır. */
export function derivePN(
  pozitif: number | null | undefined,
  depozit: number | null | undefined,
): string | null {
  if (pozitif == null) return null;
  if (pozitif < 0) return null;

  if (pozitif === 0) {
    // Nod negatif ama tümör depoziti varsa N1c
    return depozit != null && depozit > 0 ? 'N1c' : 'N0';
  }
  if (pozitif === 1) return 'N1a';
  if (pozitif <= 3) return 'N1b';
  if (pozitif <= 6) return 'N2a';
  return 'N2b';
}

/** N1 ailesi (N1a/N1b/N1c) tek grup olarak değerlendirilir. */
const isN1 = (n: string) => n === 'N1a' || n === 'N1b' || n === 'N1c';

export function deriveEvreGrubu(
  pT: string | null,
  pN: string | null,
  pM: string | null,
): string | null {
  if (!pT || !pN) return null;

  // M1 her şeyin önüne geçer
  if (pM === 'M1a') return 'IVA';
  if (pM === 'M1b') return 'IVB';
  if (pM === 'M1c') return 'IVC';

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

  if (toplam != null && pozitif != null && pozitif > toplam) {
    uyarilar.push(
      `Metastatik lenf nodu sayısı (${pozitif}) incelenen sayıdan (${toplam}) fazla — veri hatası.`,
    );
  }

  if (toplam != null && toplam < 12) {
    uyarilar.push(
      `Yalnızca ${toplam} lenf nodu incelendi. Yeterli evreleme için en az 12 nod önerilir.`,
    );
  }

  if (depozit != null && depozit > 0 && pozitif != null && pozitif > 0) {
    uyarilar.push(
      'Tümör depoziti mevcut ancak lenf nodu pozitif olduğu için N sınıflaması nod sayısına göre yapıldı (N1c uygulanmaz).',
    );
  }

  const pN = derivePN(pozitif, depozit);
  const pM = input.pM ?? 'M0';
  const evreGrubu = deriveEvreGrubu(pT, pN, pM);

  if (pT && pN && !evreGrubu) {
    uyarilar.push(`${pT} / ${pN} kombinasyonu için evre grubu türetilemedi — elle kontrol edin.`);
  }

  const ozet =
    pT && pN ? `${pT} ${pN} ${pM}${evreGrubu ? ` — Evre ${evreGrubu}` : ''}` : null;

  return { pT, pN, pM, evreGrubu, ozet, uyarilar, eksikAlanlar };
}
