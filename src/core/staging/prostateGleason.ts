/**
 * Prostat karsinomu Gleason skorlama ve Grade Group (ISUP) türetim mantığı.
 *
 * ⚠️ Bu dosyadaki kurallar ISUP 2014/2019 Grade Group sistemi hatırlanarak yazılmıştır.
 *    Yayına almadan önce güncel ISUP/WHO tablosuyla doğrulanmalıdır.
 *    Doğrulama sonrası GRADE_GRUBU_KAYNAK sabitini güncelleyin.
 */

export const GRADE_GRUBU_KAYNAK = 'ISUP 2014 (doğrulanmadı)';

export type GleasonPatern = 3 | 4 | 5;

export interface GleasonInput {
  primer: GleasonPatern;
  sekonder: GleasonPatern;
}

export interface GleasonSonuc {
  skorMetni: string; // "4+3=7"
  toplam: number; // 7
  gradeGrubu: 1 | 2 | 3 | 4 | 5;
  uyari: string | null; // ör. skor 5 iğne biyopside nadir uyarısı
}

export function deriveGleasonGrade(input: GleasonInput): GleasonSonuc {
  const { primer, sekonder } = input;

  if (![3, 4, 5].includes(primer) || ![3, 4, 5].includes(sekonder)) {
    throw new Error(
      `Geçersiz Gleason paterni: primer=${primer}, sekonder=${sekonder}. Patern 3, 4 veya 5 olmalıdır.`,
    );
  }

  const toplam = primer + sekonder;
  const skorMetni = `${primer}+${sekonder}=${toplam}`;

  let gradeGrubu: 1 | 2 | 3 | 4 | 5;

  if (toplam <= 6) {
    gradeGrubu = 1;
  } else if (toplam === 7) {
    gradeGrubu = primer === 3 ? 2 : 3;
  } else if (toplam === 8) {
    gradeGrubu = 4;
  } else {
    // 9 veya 10
    gradeGrubu = 5;
  }

  let uyari: string | null = null;
  if (primer === 5 || sekonder === 5) {
    uyari =
      'Patern 5 iğne biyopsilerinde nadir görülür; varlığı ve derecelendirmesi tekrar değerlendirilmelidir.';
  }

  return {
    skorMetni,
    toplam,
    gradeGrubu,
    uyari,
  };
}
