// src/core/staging/types.ts

export interface StagingInput {
  /** invazyon_derinligi alanının seçilen seçeneğindeki pT değeri */
  pT?: string | null;
  lenfNoduToplam?: number | null;
  lenfNoduPozitif?: number | null;
  tumorDepoziti?: number | null;
  /** Uzak metastaz durumu: M0 (klinik/görüntüleme) veya M1a/M1b/M1c */
  metastazDurumu?: 'M0' | 'M1a' | 'M1b' | 'M1c' | null;
  /** Patolojik olarak doğrulanmış metastaz varlığı (pM1 için) */
  metastazPatolojikDogrulandi?: boolean | null;
}

export interface StagingResult {
  pT: string | null;
  pN: string | null;
  pM: string | null;
  evreGrubu: string | null;
  /** Rapora yazılacak tek satırlık özet, ör. "pT3 pN1b; M0 bilgisi mevcut — Anatomic evre grubu IIIB" */
  ozet: string | null;
  ajccBaski?: string;
  uyarilar: string[];
  eksikAlanlar: string[];
}

export type StagingFn = (input: StagingInput) => StagingResult;
