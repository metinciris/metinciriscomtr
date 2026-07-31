// src/core/staging/types.ts

export interface StagingInput {
  /** invazyon_derinligi alanının seçilen seçeneğindeki pT değeri */
  pT?: string | null;
  lenfNoduToplam?: number | null;
  lenfNoduPozitif?: number | null;
  tumorDepoziti?: number | null;
  /** Klinik olarak bilinen uzak metastaz; şemada yoksa null bırakılır */
  pM?: 'M0' | 'M1a' | 'M1b' | 'M1c' | null;
}

export interface StagingResult {
  pT: string | null;
  pN: string | null;
  pM: string | null;
  evreGrubu: string | null;
  /** Rapora yazılacak tek satırlık özet, ör. "pT3 pN1b pM0 — Evre IIIB" */
  ozet: string | null;
  ajccBaski?: string;
  uyarilar: string[];
  eksikAlanlar: string[];
}

export type StagingFn = (input: StagingInput) => StagingResult;
