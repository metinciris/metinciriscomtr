// =============================================================================
// Testis GHT (Germ Hücre Tümörü) IHC Asistanı – Veri Dosyası
// Tüm görüntüleme metinleri Türkçedir.
// =============================================================================

// ---------------------------------------------------------------------------
// 1. Types
// ---------------------------------------------------------------------------

export type StainingResult = string;

export interface AntibodyOption {
  key: string;
  label: string;
  isPositive: boolean;
  patternCoefficient: number;
  isWrongPattern?: boolean;
  isNuclearRequired?: boolean;
}

export interface AntibodyInfoCard {
  stainingPattern: string;
  mainUse: string;
  expectedPositive: string[];
  expectedNegative: string[];
  pitfall: string;
  copyName: string;
}

export interface AntibodyDefinition {
  id: string;
  name: string;
  aliases?: string[];
  panel: 'main' | 'mimic';
  isNuclearMarker: boolean;
  options: AntibodyOption[];
  infoCard: AntibodyInfoCard;
}

export type TumorType =
  | 'gcnis'
  | 'seminoma'
  | 'embryonal_carcinoma'
  | 'yolk_sac'
  | 'choriocarcinoma'
  | 'teratoma'
  | 'spermatocytic';

export interface TumorReferenceProfile {
  expectedMarkers: Record<string, { expected: string; note?: string }>;
  pitfalls: string[];
  notes: string[];
}

export interface TumorDefinition {
  id: TumorType;
  name: string;
  shortName: string;
  referenceProfile: TumorReferenceProfile;
}

export interface CompatibilityMatrix {
  [antibodyId: string]: {
    [tumorId: string]: number;
  };
}

export type SerumStatus =
  | 'unknown'
  | 'normal'
  | 'mild_high'
  | 'significant_high'
  | 'very_high';

export interface SerumMarker {
  value: string;
  unit: string;
  status: SerumStatus;
}

export interface SerumMarkers {
  afp: SerumMarker;
  betaHcg: SerumMarker;
  ldh: SerumMarker;
}

export type AgeRange =
  | 'unknown'
  | '0-5'
  | '6-12'
  | '13-19'
  | '20-45'
  | '46-60'
  | '>60';

export interface MorphologyFlags {
  gcnisPresent?: boolean;
  gcnisAbsent?: boolean;
  gcnisNotEvaluable?: boolean;
  prominentLymphoidStroma?: boolean;
  clearCytoplasmSheets?: boolean;
  schillerDuvalPattern?: boolean;
  hemorrhageNecrosisDominant?: boolean;
  syncytiotrophoblasticGiantCells?: boolean;
  biphasicTrophoblasticPattern?: boolean;
  matureSomaticComponent?: boolean;
  immatureSomaticMalignancy?: boolean;
  immatureSomaticNeuroectodermal?: boolean;
  somaticTypeMalignancySuspicion?: boolean;
  twelvepGainPositive?: boolean;
  twelvepGainNegative?: boolean;
  associatedNonTeratomatousGct?: boolean;
  metastaticTeratoma?: boolean;
  bilateralTestisMass?: boolean;
  paratesticular?: boolean;
  extraTesticularPrimaryHistory?: boolean;
  advancedAgeAtypicalClinical?: boolean;
}

export interface CardOutput {
  id?: string;
  type:
    | 'strong_match'
    | 'supportive'
    | 'pitfall'
    | 'conflict'
    | 'non_gct_warning'
    | 'suggested_panel';
  title: string;
  text: string;
  suggestions?: string[];
  priority: number;
}

// ---------------------------------------------------------------------------
// 2. AGE_RANGES
// ---------------------------------------------------------------------------

export const AGE_RANGES: { key: AgeRange; label: string }[] = [
  { key: 'unknown', label: 'Girilmedi' },
  { key: '0-5', label: '0–5 yaş' },
  { key: '6-12', label: '6–12 yaş' },
  { key: '13-19', label: '13–19 yaş' },
  { key: '20-45', label: '20–45 yaş' },
  { key: '46-60', label: '46–60 yaş' },
  { key: '>60', label: '>60 yaş' },
];

// ---------------------------------------------------------------------------
// 3. MORPHOLOGY_FLAGS
// ---------------------------------------------------------------------------

export const MORPHOLOGY_FLAGS: { key: keyof MorphologyFlags; label: string }[] =
  [
    { key: 'gcnisPresent', label: 'GCNIS var' },
    { key: 'gcnisAbsent', label: 'GCNIS yok' },
    { key: 'gcnisNotEvaluable', label: 'GCNIS değerlendirilemedi' },
    {
      key: 'prominentLymphoidStroma',
      label: 'Belirgin lenfoid stroma',
    },
    {
      key: 'clearCytoplasmSheets',
      label: 'Şeffaf sitoplazmalı tabakalar / seminom benzeri görünüm',
    },
    {
      key: 'schillerDuvalPattern',
      label: 'Schiller-Duval / mikrokistik / retiküler patern',
    },
    {
      key: 'hemorrhageNecrosisDominant',
      label: 'Hemoraji-nekroz baskın',
    },
    {
      key: 'syncytiotrophoblasticGiantCells',
      label: 'Sinsityotrofoblastik dev hücre var',
    },
    {
      key: 'biphasicTrophoblasticPattern',
      label: 'Yaygın trofoblastik bifazik patern',
    },
    {
      key: 'matureSomaticComponent',
      label: 'Matür somatik doku komponenti var',
    },
    {
      key: 'immatureSomaticMalignancy',
      label: 'İmmatür/somatik malign komponent kuşkusu',
    },
    {
      key: 'immatureSomaticNeuroectodermal',
      label: 'İmmatür somatik/nöroektodermal doku var',
    },
    {
      key: 'somaticTypeMalignancySuspicion',
      label: 'Somatik tip malignite kuşkusu var',
    },
    { key: 'twelvepGainPositive', label: '12p gain/i12p pozitif' },
    { key: 'twelvepGainNegative', label: '12p gain/i12p negatif' },
    {
      key: 'associatedNonTeratomatousGct',
      label: 'Eşlik eden non-teratom GHT komponenti var',
    },
    { key: 'metastaticTeratoma', label: 'Metastatik odakta teratom var' },
    { key: 'bilateralTestisMass', label: 'Bilateral testis kitlesi' },
    { key: 'paratesticular', label: 'Paratestiküler yerleşim' },
    {
      key: 'extraTesticularPrimaryHistory',
      label: 'Testis dışı primer malignite öyküsü var',
    },
    {
      key: 'advancedAgeAtypicalClinical',
      label: 'İleri yaş / atipik klinik',
    },
  ];

// ---------------------------------------------------------------------------
// 4. NUCLEAR_MARKERS
// ---------------------------------------------------------------------------

export const NUCLEAR_MARKERS: string[] = [
  'SALL4',
  'OCT4',
  'SOX17',
  'SOX2',
  'GATA3',
  'p63',
  'p40',
  'SF1',
  'PAX5',
  'CDX2',
  'SATB2',
  'TTF1',
  'Myogenin',
  'MyoD1',
  'NKX3_1',
];

// ---------------------------------------------------------------------------
// 5. MAIN_PANEL_ANTIBODIES
// ---------------------------------------------------------------------------

export const MAIN_PANEL_ANTIBODIES: AntibodyDefinition[] = [
  // 1 — SALL4
  {
    id: 'SALL4',
    name: 'SALL4',
    panel: 'main',
    isNuclearMarker: true,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_weak_nuclear', label: 'Fokal/zayıf nükleer pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'patchy_nuclear', label: 'Yamalı nükleer pozitif', isPositive: true, patternCoefficient: 0.70 },
      { key: 'diffuse_strong_nuclear', label: 'Diffüz güçlü nükleer pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'wrong_pattern', label: 'Sitoplazmik/yanlış patern', isPositive: false, patternCoefficient: 0, isWrongPattern: true },
    ],
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse:
        'Germ hücre kökeni için güçlü tarama belirteci. GCNIS, seminom, embriyonel karsinom, yolk sac tümörde beklenir. Sadece uygun nükleer boyanma skorlanmalıdır.',
      expectedPositive: ['GCNIS', 'Seminom', 'Embriyonel karsinom', 'Yolk sac tümör'],
      expectedNegative: [],
      pitfall:
        'Sitoplazmik boyanma pozitif sayılmamalıdır. Koryokarsinomda değişken, teratom ve spermatositik tümörde zayıf/değişken olabilir.',
      copyName: 'SALL4',
    },
  },

  // 2 — OCT3/4
  {
    id: 'OCT4',
    name: 'OCT3/4',
    aliases: ['OCT4', 'POU5F1'],
    panel: 'main',
    isNuclearMarker: true,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_weak_nuclear', label: 'Fokal/zayıf nükleer pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_strong_nuclear', label: 'Diffüz güçlü nükleer pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'wrong_pattern', label: 'Sitoplazmik/yanlış patern', isPositive: false, patternCoefficient: 0, isWrongPattern: true },
    ],
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse:
        'GCNIS, seminom ve embriyonel karsinomda güçlü nükleer pozitiflik beklenir. Yolk sac, koryokarsinom, teratom ve spermatositik tümörde beklenmez.',
      expectedPositive: ['GCNIS', 'Seminom', 'Embriyonel karsinom'],
      expectedNegative: ['Yolk sac tümör', 'Koryokarsinom', 'Teratom', 'Spermatositik tümör'],
      pitfall: 'Sitoplazmik boyanma pozitif sayılmamalıdır.',
      copyName: 'OCT3/4',
    },
  },

  // 3 — CD117 / c-KIT
  {
    id: 'CD117',
    name: 'CD117 / c-KIT',
    aliases: ['c-KIT', 'KIT'],
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_weak_membranous', label: 'Fokal/zayıf membranöz pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_membranous', label: 'Diffüz membranöz pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'cytoplasmic_suspicious', label: 'Sitoplazmik ağırlıklı/şüpheli', isPositive: true, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Membranöz',
      mainUse:
        'Seminom/GCNIS ve spermatositik tümörde membranöz pozitiflik olabilir. Embriyonel karsinom genellikle negatif/zayıftır.',
      expectedPositive: ['Seminom', 'GCNIS', 'Spermatositik tümör'],
      expectedNegative: ['Embriyonel karsinom'],
      pitfall: 'Tek başına karar verdirici değildir; diğer belirteçlerle birlikte yorumlanmalıdır.',
      copyName: 'CD117',
    },
  },

  // 4 — CD30
  {
    id: 'CD30',
    name: 'CD30',
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'sparse_cell', label: 'Seyrek hücre pozitif', isPositive: true, patternCoefficient: 0.25 },
      { key: 'focal_positive', label: 'Fokal pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_membranous_golgi', label: 'Diffüz membranöz/Golgi pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'suspicious_nonspecific', label: 'Şüpheli/nonspesifik', isPositive: false, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Membranöz / Golgi',
      mainUse:
        'Embriyonel karsinomda destekleyici belirteç. Membranöz/Golgi paterninde pozitiflik beklenir.',
      expectedPositive: ['Embriyonel karsinom'],
      expectedNegative: ['Seminom', 'Yolk sac tümör', 'Spermatositik tümör'],
      pitfall:
        'Seyrek pozitif hücre tek başına yeterli değildir. Lenfoma hücrelerinde de pozitif olabilir; morfoloji ile korelasyon gereklidir.',
      copyName: 'CD30',
    },
  },

  // 5 — Glypican-3
  {
    id: 'GPC3',
    name: 'Glypican-3',
    aliases: ['GPC3'],
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_positive', label: 'Fokal pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'patchy_positive', label: 'Yamalı pozitif', isPositive: true, patternCoefficient: 0.70 },
      { key: 'diffuse_positive', label: 'Diffüz pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'suspicious_nonspecific', label: 'Şüpheli/nonspesifik', isPositive: false, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Sitoplazmik / membranöz',
      mainUse:
        'Yolk sac tümörde destekleyici belirteç. Koryokarsinomda da pozitif olabilir.',
      expectedPositive: ['Yolk sac tümör'],
      expectedNegative: ['Seminom', 'Spermatositik tümör'],
      pitfall:
        'AFP negatif olsa bile GPC3 anlamlı olabilir. Hepatosellüler karsinomda da pozitiftir; metastaz ayrımında dikkat.',
      copyName: 'Glypican-3',
    },
  },

  // 6 — AFP
  {
    id: 'AFP',
    name: 'AFP',
    aliases: ['Alfa-fetoprotein'],
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_tumor_cell', label: 'Fokal tümör hücresi pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'patchy_tumor_cell', label: 'Yamalı tümör hücresi pozitif', isPositive: true, patternCoefficient: 0.70 },
      { key: 'diffuse_positive', label: 'Diffüz pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'smudgy_suspicious', label: 'Smudgy/sekresyon tarzı şüpheli', isPositive: false, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Sitoplazmik, fokal/yamalı olabilir',
      mainUse:
        'Yolk sac tümörü destekler. Serum AFP düzeyi ile birlikte değerlendirilmelidir.',
      expectedPositive: ['Yolk sac tümör'],
      expectedNegative: ['Seminom', 'Spermatositik tümör'],
      pitfall:
        'Smudgy/sekresyon tarzı boyanma dikkatle yorumlanmalıdır; negatiflik yolk sac tümörü dışlamaz.',
      copyName: 'AFP',
    },
  },

  // 7 — beta-hCG
  {
    id: 'betaHCG',
    name: 'beta-hCG',
    aliases: ['β-hCG', 'hCG'],
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'syncytial_only', label: 'Sadece sinsityotrofoblastik dev hücrelerde pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'widespread_trophoblastic', label: 'Yaygın trofoblastik komponentte pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'smudge_suspicious', label: 'Smudge/nonspesifik/şüpheli', isPositive: false, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse:
        'Trofoblastik komponent/koryokarsinomda destekleyici belirteç.',
      expectedPositive: ['Koryokarsinom'],
      expectedNegative: ['Yolk sac tümör', 'Spermatositik tümör'],
      pitfall:
        'Seminomda sinsityotrofoblastik dev hücrelerde pozitif olabilir; bu tek başına koryokarsinom anlamına gelmez.',
      copyName: 'beta-hCG',
    },
  },

  // 8 — D2-40 / Podoplanin
  {
    id: 'D2_40',
    name: 'D2-40 / Podoplanin',
    aliases: ['Podoplanin'],
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_membranous', label: 'Fokal membranöz pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_membranous', label: 'Diffüz membranöz pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'suspicious', label: 'Şüpheli', isPositive: false, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Membranöz',
      mainUse:
        'GCNIS ve seminomda membranöz pozitiflik beklenir. Embriyonel karsinom ve diğer non-seminomatöz GHT\'lerde genellikle negatiftir.',
      expectedPositive: ['GCNIS', 'Seminom'],
      expectedNegative: ['Embriyonel karsinom', 'Yolk sac tümör', 'Koryokarsinom', 'Spermatositik tümör'],
      pitfall:
        'Lenfatik endotel hücrelerinde de pozitiftir; tümör hücresindeki boyanma ile karıştırılmamalıdır.',
      copyName: 'D2-40',
    },
  },

  // 9 — SOX17
  {
    id: 'SOX17',
    name: 'SOX17',
    panel: 'main',
    isNuclearMarker: true,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_nuclear', label: 'Fokal nükleer pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_nuclear', label: 'Diffüz nükleer pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'wrong_pattern', label: 'Yanlış patern/şüpheli', isPositive: false, patternCoefficient: 0, isWrongPattern: true },
    ],
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse:
        'Seminomda destekleyici nükleer belirteç; embriyonel karsinomda beklenmez.',
      expectedPositive: ['GCNIS', 'Seminom'],
      expectedNegative: ['Embriyonel karsinom', 'Spermatositik tümör'],
      pitfall:
        'SOX17 pozitifliği seminomu destekler ancak tek başına yeterli değildir; OCT3/4 ve CD117 ile birlikte değerlendirilmelidir.',
      copyName: 'SOX17',
    },
  },

  // 10 — SOX2
  {
    id: 'SOX2',
    name: 'SOX2',
    panel: 'main',
    isNuclearMarker: true,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_nuclear', label: 'Fokal nükleer pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_nuclear', label: 'Diffüz nükleer pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'wrong_pattern', label: 'Yanlış patern/şüpheli', isPositive: false, patternCoefficient: 0, isWrongPattern: true },
    ],
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse:
        'Embriyonel karsinomda destekleyici nükleer belirteç; seminomda beklenmez.',
      expectedPositive: ['Embriyonel karsinom'],
      expectedNegative: ['Seminom', 'Spermatositik tümör'],
      pitfall:
        'Teratom komponentlerinde değişken olabilir. Tek başına embriyonel karsinom komponent profilini doğrulamak için yeterli olmayabilir; morfolojik korelasyon önerilir.',
      copyName: 'SOX2',
    },
  },

  // 11 — PanCK / AE1-AE3
  {
    id: 'PanCK',
    name: 'PanCK / AE1-AE3',
    aliases: ['AE1/AE3', 'Pan-sitokeratin'],
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_positive', label: 'Fokal pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_positive', label: 'Diffüz pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'suspicious_nonspecific', label: 'Şüpheli/nonspesifik', isPositive: false, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse:
        'Epitelyal diferansiyasyonu gösteren genel belirteç. Embriyonel karsinom, yolk sac tümör ve koryokarsinomda güçlü pozitiflik beklenir. Seminomda genellikle negatif veya fokal pozitiftir.',
      expectedPositive: ['Embriyonel karsinom', 'Yolk sac tümör', 'Koryokarsinom'],
      expectedNegative: ['Seminom'],
      pitfall:
        'Seminomda fokal/zayıf PanCK pozitifliği görülebilir; bu non-seminomatöz komponent anlamına gelmez.',
      copyName: 'PanCK',
    },
  },

  // 12 — GATA3
  {
    id: 'GATA3',
    name: 'GATA3',
    panel: 'main',
    isNuclearMarker: true,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_nuclear', label: 'Fokal nükleer pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_nuclear', label: 'Diffüz nükleer pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'wrong_pattern', label: 'Yanlış patern/şüpheli', isPositive: false, patternCoefficient: 0, isWrongPattern: true },
    ],
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse:
        'Trofoblastik diferansiyasyon belirteci. Koryokarsinomda nükleer pozitiflik destekleyicidir.',
      expectedPositive: ['Koryokarsinom'],
      expectedNegative: ['Seminom', 'Spermatositik tümör'],
      pitfall:
        'Meme ve ürotelyal karsinomda da pozitiftir; metastaz ayrımında dikkatli olunmalıdır.',
      copyName: 'GATA3',
    },
  },

  // 13 — p63
  {
    id: 'p63',
    name: 'p63',
    panel: 'main',
    isNuclearMarker: true,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_nuclear', label: 'Fokal nükleer pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_nuclear', label: 'Diffüz nükleer pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'wrong_pattern', label: 'Yanlış patern/şüpheli', isPositive: false, patternCoefficient: 0, isWrongPattern: true },
    ],
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse:
        'Koryokarsinomda sitotrofoblastik komponentte nükleer pozitiflik olabilir. Skuamöz diferansiyasyonda da pozitiftir.',
      expectedPositive: ['Koryokarsinom'],
      expectedNegative: ['Seminom', 'Spermatositik tümör'],
      pitfall:
        'Skuamöz hücreli karsinom metastazında da pozitiftir; GHT dışı tümör olasılığı yönünden de değerlendirilmelidir.',
      copyName: 'p63',
    },
  },

  // 14 — İnhibin
  {
    id: 'Inhibin',
    name: 'İnhibin',
    aliases: ['Inhibin'],
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'syncytiotrophoblastic_only', label: 'Sadece sinsityotrofoblastik hücrelerde pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'widespread_tumor', label: 'Yaygın tümör hücresi pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'suspicious', label: 'Şüpheli', isPositive: false, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse:
        'Seks kord-stromal tümörlerde ve trofoblastik komponentte pozitif olabilir. Koryokarsinomda sinsityotrofoblastik hücrelerde beklenir.',
      expectedPositive: ['Koryokarsinom'],
      expectedNegative: ['Seminom', 'Embriyonel karsinom', 'Yolk sac tümör', 'Spermatositik tümör'],
      pitfall:
        'Yaygın inhibin pozitifliği seks kord-stromal tümörü (Leydig, Sertoli) düşündürmelidir; GHT ile karıştırılmamalıdır.',
      copyName: 'İnhibin',
    },
  },

  // 15 — SF1
  {
    id: 'SF1',
    name: 'SF1',
    aliases: ['Steroidogenic Factor 1', 'NR5A1'],
    panel: 'main',
    isNuclearMarker: true,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_nuclear', label: 'Fokal nükleer pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_nuclear', label: 'Diffüz nükleer pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'wrong_pattern', label: 'Yanlış patern/şüpheli', isPositive: false, patternCoefficient: 0, isWrongPattern: true },
    ],
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse:
        'Seks kord-stromal tümör belirteci (Leydig, Sertoli hücreli tümör). GHT\'lerde beklenmez; pozitiflik GHT dışı tümörü düşündürür.',
      expectedPositive: [],
      expectedNegative: ['GCNIS', 'Seminom', 'Embriyonel karsinom', 'Yolk sac tümör', 'Koryokarsinom', 'Spermatositik tümör'],
      pitfall:
        'SF1 pozitifliği seks kord-stromal tümörü kuvvetle destekler; GHT profil uyumu sorgulanmalıdır.',
      copyName: 'SF1',
    },
  },

  // 16 — Calretinin
  {
    id: 'Calretinin',
    name: 'Calretinin',
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_positive', label: 'Fokal pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_positive', label: 'Diffüz pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'suspicious', label: 'Şüpheli', isPositive: false, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Nükleer ve sitoplazmik',
      mainUse:
        'Seks kord-stromal tümörler ve mezotelyomada pozitiftir. GHT\'lerde genellikle negatiftir; pozitiflik GHT dışı tümörü düşündürür.',
      expectedPositive: [],
      expectedNegative: ['GCNIS', 'Seminom', 'Embriyonel karsinom', 'Yolk sac tümör', 'Koryokarsinom', 'Spermatositik tümör'],
      pitfall:
        'Calretinin pozitifliği seks kord-stromal tümör veya mezotelyoma yönünde değerlendirilmelidir.',
      copyName: 'Calretinin',
    },
  },

  // 17 — EMA
  {
    id: 'EMA',
    name: 'EMA',
    aliases: ['MUC1'],
    panel: 'main',
    isNuclearMarker: false,
    options: [
      { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
      { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
      { key: 'focal_positive', label: 'Fokal pozitif', isPositive: true, patternCoefficient: 0.40 },
      { key: 'diffuse_positive', label: 'Diffüz pozitif', isPositive: true, patternCoefficient: 1.00 },
      { key: 'suspicious', label: 'Şüpheli', isPositive: false, patternCoefficient: 0.10 },
    ],
    infoCard: {
      stainingPattern: 'Membranöz',
      mainUse:
        'GHT\'lerde genellikle negatiftir. Pozitiflik karsinom metastazı veya teratom içindeki epitelyal komponent lehinedir.',
      expectedPositive: [],
      expectedNegative: ['GCNIS', 'Seminom', 'Embriyonel karsinom', 'Yolk sac tümör', 'Spermatositik tümör'],
      pitfall:
        'EMA pozitifliği GHT profil uyumunu sorgulatmalıdır; karsinom metastazı, lenfoma veya teratom matür komponenti düşünülmelidir.',
      copyName: 'EMA',
    },
  },
];

// ---------------------------------------------------------------------------
// 6. MIMIC_PANEL_ANTIBODIES
// ---------------------------------------------------------------------------

function mimicOptions(): AntibodyOption[] {
  return [
    { key: 'not_done', label: 'Çalışılmadı', isPositive: false, patternCoefficient: 0 },
    { key: 'negative', label: 'Negatif', isPositive: false, patternCoefficient: 0 },
    { key: 'positive', label: 'Pozitif', isPositive: true, patternCoefficient: 0.70 },
    { key: 'diffuse_strong', label: 'Diffüz güçlü pozitif', isPositive: true, patternCoefficient: 1.00 },
    { key: 'suspicious', label: 'Şüpheli', isPositive: false, patternCoefficient: 0.10 },
  ];
}

export const MIMIC_PANEL_ANTIBODIES: AntibodyDefinition[] = [
  // Lymphoma markers
  {
    id: 'CD45_LCA',
    name: 'CD45 / LCA',
    aliases: ['LCA'],
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Membranöz',
      mainUse: 'Lenfoma dışlama panelinin temel belirteci. Hematolenfoid hücrelerde pozitiftir.',
      expectedPositive: ['Lenfoma'],
      expectedNegative: ['GHT', 'Karsinom'],
      pitfall: 'GHT\'de pozitiflik lenfoma lehinedir; morfoloji ile korelasyon gereklidir.',
      copyName: 'CD45',
    },
  },
  {
    id: 'CD20',
    name: 'CD20',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Membranöz',
      mainUse: 'B hücreli lenfoma belirteci. Testis lenfomalarında (DLBCL) pozitiftir.',
      expectedPositive: ['B hücreli lenfoma'],
      expectedNegative: ['GHT'],
      pitfall: 'İleri yaş testis kitlelerinde lenfoma olasılığı (mimik uyarısı) dışlanmalıdır.',
      copyName: 'CD20',
    },
  },
  {
    id: 'PAX5',
    name: 'PAX5',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'B hücreli lenfoma belirteci. Nükleer pozitiflik B hücre kökenini destekler.',
      expectedPositive: ['B hücreli lenfoma'],
      expectedNegative: ['GHT'],
      pitfall: 'Klasik Hodgkin lenfomada zayıf pozitif olabilir.',
      copyName: 'PAX5',
    },
  },
  {
    id: 'CD3',
    name: 'CD3',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Membranöz / sitoplazmik',
      mainUse: 'T hücreli lenfoma belirteci. Seminomdaki reaktif T lenfositlerden ayırt edilmelidir.',
      expectedPositive: ['T hücreli lenfoma'],
      expectedNegative: ['GHT'],
      pitfall: 'Seminomun lenfoid stromasındaki reaktif T hücreleri pozitiftir; tümör hücresindeki boyanma değerlendirilmelidir.',
      copyName: 'CD3',
    },
  },
  {
    id: 'CD79a',
    name: 'CD79a',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Membranöz / sitoplazmik',
      mainUse: 'B hücreli lenfoma belirteci. CD20 ile birlikte kullanılır.',
      expectedPositive: ['B hücreli lenfoma'],
      expectedNegative: ['GHT'],
      pitfall: 'Plazma hücreli neoplazilerde de pozitiftir.',
      copyName: 'CD79a',
    },
  },

  // Melanoma markers
  {
    id: 'SOX10',
    name: 'SOX10',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Melanom ve periferik sinir kılıfı tümörlerinin belirteci.',
      expectedPositive: ['Melanom', 'Schwannom'],
      expectedNegative: ['GHT', 'Karsinom'],
      pitfall: 'Nöral krest kökenli tümörlerde de pozitiftir; melanom dışı tümörlerde dikkat.',
      copyName: 'SOX10',
    },
  },
  {
    id: 'S100',
    name: 'S100',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer ve sitoplazmik',
      mainUse: 'Melanom, nöral tümörler ve kıkırdak tümörlerinde pozitiftir.',
      expectedPositive: ['Melanom', 'Schwannom'],
      expectedNegative: ['GHT'],
      pitfall: 'Geniş bir tümör yelpazesinde pozitif olabilir; tek başına spesifik değildir.',
      copyName: 'S100',
    },
  },
  {
    id: 'HMB45',
    name: 'HMB45',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse: 'Melanom belirteci. Melanositik tümörlerde sitoplazmik pozitiflik beklenir.',
      expectedPositive: ['Melanom'],
      expectedNegative: ['GHT', 'Karsinom'],
      pitfall: 'PEComa ve anjiomyolipomda da pozitif olabilir.',
      copyName: 'HMB45',
    },
  },
  {
    id: 'MelanA',
    name: 'Melan-A',
    aliases: ['MART-1'],
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse: 'Melanom belirteci. Adrenokortikal tümörlerde de pozitif olabilir.',
      expectedPositive: ['Melanom'],
      expectedNegative: ['GHT', 'Karsinom'],
      pitfall: 'Steroid üreten tümörlerde (adrenal, seks kord-stromal) pozitif olabilir.',
      copyName: 'Melan-A',
    },
  },

  // Prostate metastasis
  {
    id: 'NKX3_1',
    name: 'NKX3.1',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Prostat karsinom belirteci. Testis metastazında prostat kökenini destekler.',
      expectedPositive: ['Prostat karsinomu'],
      expectedNegative: ['GHT'],
      pitfall: 'PSA ile birlikte değerlendirilmelidir. Nadir olgularda diğer tümörlerde de zayıf pozitif olabilir.',
      copyName: 'NKX3.1',
    },
  },
  {
    id: 'PSA',
    name: 'PSA',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse: 'Prostat karsinom belirteci. Testisteki kitlede prostat metastazını dışlamak için kullanılır.',
      expectedPositive: ['Prostat karsinomu'],
      expectedNegative: ['GHT'],
      pitfall: 'İleri evre prostat karsinomlarında PSA ekspresyonu kaybedilebilir.',
      copyName: 'PSA',
    },
  },


  {
    id: 'PSAP',
    name: 'PSAP',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse: 'Prostat kökenini destekleyen yardımcı belirteç. PSA/NKX3.1/PSMA ile birlikte yorumlanır.',
      expectedPositive: ['Prostat karsinomu'],
      expectedNegative: ['GHT'],
      pitfall: 'Tek başına spesifik değildir; organ-spesifik panel içinde değerlendirilmelidir.',
      copyName: 'PSAP',
    },
  },
  {
    id: 'PSMA',
    name: 'PSMA',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Membranöz / sitoplazmik',
      mainUse: 'Prostat karsinomu metastazı yönünde destekleyici belirteç.',
      expectedPositive: ['Prostat karsinomu'],
      expectedNegative: ['GHT'],
      pitfall: 'Neovasküler yapılarda ve bazı non-prostatik tümörlerde pozitiflik görülebilir.',
      copyName: 'PSMA',
    },
  },

  // Renal metastasis
  {
    id: 'PAX8',
    name: 'PAX8',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Renal, tiroid ve Müller kanal kökenli tümörlerin belirteci. Renal hücreli karsinom metastazını destekler.',
      expectedPositive: ['Renal hücreli karsinom', 'Tiroid karsinomu'],
      expectedNegative: ['GHT'],
      pitfall: 'Seminom ve yolk sac tümörde fokal/zayıf PAX8 pozitifliği bildirilmiştir; dikkatli yorumlanmalıdır.',
      copyName: 'PAX8',
    },
  },
  {
    id: 'CAIX',
    name: 'CAIX',
    aliases: ['CA9'],
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Membranöz',
      mainUse: 'Berrak hücreli renal hücreli karsinom belirteci.',
      expectedPositive: ['Berrak hücreli RCC'],
      expectedNegative: ['GHT'],
      pitfall: 'Hipoksik koşullarda diğer tümörlerde de pozitif olabilir.',
      copyName: 'CAIX',
    },
  },

  // Lung adenocarcinoma
  {
    id: 'TTF1',
    name: 'TTF-1',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Akciğer adenokarsinomu ve tiroid karsinomu belirteci.',
      expectedPositive: ['Akciğer adenokarsinomu', 'Tiroid karsinomu'],
      expectedNegative: ['GHT'],
      pitfall: 'Nöroendokrin tümörlerde de pozitif olabilir.',
      copyName: 'TTF-1',
    },
  },
  {
    id: 'NapsinA',
    name: 'Napsin A',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik granüler',
      mainUse: 'Akciğer adenokarsinomu belirteci. TTF-1 ile birlikte kullanılır.',
      expectedPositive: ['Akciğer adenokarsinomu'],
      expectedNegative: ['GHT'],
      pitfall: 'Renal hücreli karsinomda da pozitif olabilir; PAX8/CAIX ile ayırım gerekir.',
      copyName: 'Napsin A',
    },
  },

  // Colorectal
  {
    id: 'CDX2',
    name: 'CDX2',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Kolorektal karsinom belirteci. İntestinal diferansiyasyonu destekler.',
      expectedPositive: ['Kolorektal karsinom'],
      expectedNegative: ['GHT'],
      pitfall: 'Gastrik, pankreatik ve müsinöz over karsinomlarında da pozitif olabilir.',
      copyName: 'CDX2',
    },
  },
  {
    id: 'SATB2',
    name: 'SATB2',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Kolorektal karsinom belirteci. CDX2 ile birlikte kolorektal kökeni güçlü destekler.',
      expectedPositive: ['Kolorektal karsinom'],
      expectedNegative: ['GHT'],
      pitfall: 'Osteoblastik tümörlerde de pozitif olabilir.',
      copyName: 'SATB2',
    },
  },

  // Cytokeratin pattern
  {
    id: 'CK7',
    name: 'CK7',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse: 'Karsinom alt tipleme panelinde kullanılır. CK7+/CK20- patern akciğer, meme, over kökenini düşündürür.',
      expectedPositive: ['Akciğer karsinomu', 'Meme karsinomu', 'Over karsinomu'],
      expectedNegative: ['GHT'],
      pitfall: 'Embriyonel karsinomda fokal CK7 pozitifliği görülebilir.',
      copyName: 'CK7',
    },
  },
  {
    id: 'CK20',
    name: 'CK20',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse: 'Karsinom alt tipleme panelinde kullanılır. CK7-/CK20+ patern kolorektal kökeni düşündürür.',
      expectedPositive: ['Kolorektal karsinom', 'Merkel hücreli karsinom'],
      expectedNegative: ['GHT'],
      pitfall: 'Teratom matür komponentinde pozitif olabilir.',
      copyName: 'CK20',
    },
  },


  {
    id: 'p40',
    name: 'p40',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Skuamöz diferansiyasyon ve ürotelyal karsinom ayrımında p63 ile birlikte kullanılır.',
      expectedPositive: ['Skuamöz hücreli karsinom', 'Ürotelyal karsinom'],
      expectedNegative: ['GHT'],
      pitfall: 'Teratom içindeki skuamöz epitelde pozitif olabilir; morfoloji ve klinikle birlikte değerlendirilmelidir.',
      copyName: 'p40',
    },
  },
  {
    id: 'CK5_6',
    name: 'CK5/6',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik / membranöz',
      mainUse: 'Skuamöz veya bazal diferansiyasyon gösteren karsinomlarda destekleyici belirteç.',
      expectedPositive: ['Skuamöz hücreli karsinom', 'Ürotelyal karsinom'],
      expectedNegative: ['GHT'],
      pitfall: 'Tek başına primer odak belirlemez; p40/p63 ve klinik bilgi ile birlikte yorumlanmalıdır.',
      copyName: 'CK5/6',
    },
  },
  {
    id: 'Uroplakin',
    name: 'Uroplakin',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Membranöz / sitoplazmik',
      mainUse: 'Ürotelyal karsinom kökenini desteklemek için kullanılır.',
      expectedPositive: ['Ürotelyal karsinom'],
      expectedNegative: ['GHT'],
      pitfall: 'Duyarlılığı sınırlı olabilir; GATA3/p63/p40 ve klinik bilgi ile birlikte değerlendirilmelidir.',
      copyName: 'Uroplakin',
    },
  },

  // Rhabdomyosarcoma
  {
    id: 'Desmin',
    name: 'Desmin',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse: 'Kas diferansiyasyonu belirteci. Rabdomyosarkom, leiomyosarkom ve teratom kas komponenti.',
      expectedPositive: ['Rabdomyosarkom', 'Leiomyosarkom'],
      expectedNegative: ['GHT'],
      pitfall: 'Teratom içindeki kas komponentinde pozitif olabilir; GHT dışı tümörle karıştırılmamalıdır.',
      copyName: 'Desmin',
    },
  },
  {
    id: 'Myogenin',
    name: 'Myogenin',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Rabdomyosarkom profili için spesifik nükleer belirteç.',
      expectedPositive: ['Rabdomyosarkom'],
      expectedNegative: ['GHT', 'Leiomyosarkom'],
      pitfall: 'Paratestiküler rabdomyosarkom testis kitlesi olarak başvurabilir.',
      copyName: 'Myogenin',
    },
  },
  {
    id: 'MyoD1',
    name: 'MyoD1',
    panel: 'mimic',
    isNuclearMarker: true,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Rabdomyosarkom profili için nükleer belirteç. Myogenin ile birlikte kullanılır.',
      expectedPositive: ['Rabdomyosarkom'],
      expectedNegative: ['GHT', 'Leiomyosarkom'],
      pitfall: 'Myogenin\'den daha az spesifiktir; birlikte değerlendirilmelidir.',
      copyName: 'MyoD1',
    },
  },

  // Smooth muscle tumors
  {
    id: 'SMA',
    name: 'SMA',
    aliases: ['Düz kas aktin'],
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse: 'Düz kas diferansiyasyonu belirteci. Leiomyosarkom ve myofibroblastik tümörlerde beklenir.',
      expectedPositive: ['Leiomyosarkom', 'Miyofibroblastik tümör'],
      expectedNegative: ['GHT'],
      pitfall: 'Peritümöral stromal hücreler ve myofibroblastlarda pozitif olabilir; tümör hücresini ayırt edin.',
      copyName: 'SMA',
    },
  },
  {
    id: 'hCaldesmon',
    name: 'h-caldesmon',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Sitoplazmik',
      mainUse: 'Düz kas tümörlerinde destekleyici belirteç. Leiomyosarkomda SMA ile birlikte pozitiftir.',
      expectedPositive: ['Leiomyosarkom'],
      expectedNegative: ['GHT', 'Rabdomyosarkom'],
      pitfall: 'SMA\'dan daha spesifiktir ancak duyarlılığı daha düşüktür.',
      copyName: 'h-caldesmon',
    },
  },

  // Liposarcoma
  {
    id: 'MDM2',
    name: 'MDM2',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Atipik lipomatöz tümör / iyi diferansiye liposarkom belirteci. CDK4 ile birlikte amplifikasyon beklenir.',
      expectedPositive: ['İyi diferansiye liposarkom', 'Dediferansiye liposarkom'],
      expectedNegative: ['GHT', 'Lipom'],
      pitfall: 'İmmünohistokimya tek başına yeterli olmayabilir; FISH ile MDM2 amplifikasyonu doğrulanmalıdır.',
      copyName: 'MDM2',
    },
  },
  {
    id: 'CDK4',
    name: 'CDK4',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'MDM2 ile birlikte liposarkom profili için destekleyici belirteç.',
      expectedPositive: ['İyi diferansiye liposarkom', 'Dediferansiye liposarkom'],
      expectedNegative: ['GHT', 'Lipom'],
      pitfall: 'Nonspesifik nükleer boyanma görülebilir; MDM2 ile birlikte yorumlanmalıdır.',
      copyName: 'CDK4',
    },
  },

  // Vascular tumors
  {
    id: 'ERG',
    name: 'ERG',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Nükleer',
      mainUse: 'Vasküler tümör belirteci. Anjiosarkom ve hemanjiyomda pozitiftir. Prostat karsinomda da eksprese olabilir.',
      expectedPositive: ['Anjiosarkom', 'Hemanjiyom'],
      expectedNegative: ['GHT'],
      pitfall: 'TMPRSS2-ERG füzyonu olan prostat karsinomlarında da pozitiftir; vasküler tümör ile karıştırılmamalıdır.',
      copyName: 'ERG',
    },
  },
  {
    id: 'CD31',
    name: 'CD31',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Membranöz',
      mainUse: 'Vasküler endotelyal belirteç. Anjiosarkom profili için en spesifik vasküler belirteçtir.',
      expectedPositive: ['Anjiosarkom', 'Hemanjiyom'],
      expectedNegative: ['GHT', 'Karsinom'],
      pitfall: 'Megakaryositler ve trombositlerde de pozitiftir; tümör hücresindeki boyanma doğrulanmalıdır.',
      copyName: 'CD31',
    },
  },
  {
    id: 'CD34_mimic',
    name: 'CD34',
    panel: 'mimic',
    isNuclearMarker: false,
    options: mimicOptions(),
    infoCard: {
      stainingPattern: 'Membranöz',
      mainUse: 'Vasküler ve hematopoetik progenitör hücre belirteci. Soliter fibröz tümör ve DFSP\'de de pozitiftir.',
      expectedPositive: ['Anjiosarkom', 'Soliter fibröz tümör', 'DFSP'],
      expectedNegative: ['GHT'],
      pitfall: 'CD31\'den daha az spesifiktir; çeşitli mezenkimal tümörlerde pozitif olabilir.',
      copyName: 'CD34',
    },
  },
];

// ---------------------------------------------------------------------------
// 7. TUMOR_DEFINITIONS
// ---------------------------------------------------------------------------

export const TUMOR_DEFINITIONS: TumorDefinition[] = [
  {
    id: 'gcnis',
    name: 'GCNIS',
    shortName: 'GCNIS',
    referenceProfile: {
      expectedMarkers: {
        SALL4: { expected: 'Nükleer pozitif' },
        OCT4: { expected: 'Nükleer pozitif' },
        CD117: { expected: 'Olabilir', note: 'Membranöz pozitiflik görülebilir' },
        D2_40: { expected: 'Olabilir', note: 'Membranöz pozitiflik görülebilir' },
        SOX17: { expected: 'Olabilir', note: 'Nükleer pozitiflik görülebilir' },
        CD30: { expected: 'Beklenmez' },
        AFP: { expected: 'Beklenmez' },
        GPC3: { expected: 'Beklenmez' },
      },
      pitfalls: [
        'GCNIS spermatositik tümörde beklenmez.',
        'Prepubertal tip GHT\'lerde GCNIS aranmaz.',
      ],
      notes: [
        'GCNIS postpubertal GCNIS ilişkili GHT\'leri destekler; spermatositik tümör, prepubertal tip tümörler ve GHT dışı tümörlerde beklenmez.',
      ],
    },
  },
  {
    id: 'seminoma',
    name: 'Seminom',
    shortName: 'Sem',
    referenceProfile: {
      expectedMarkers: {
        SALL4: { expected: 'Diffüz nükleer pozitif' },
        OCT4: { expected: 'Diffüz nükleer pozitif' },
        CD117: { expected: 'Membranöz pozitif' },
        SOX17: { expected: 'Nükleer pozitif' },
        D2_40: { expected: 'Membranöz pozitif' },
        CD30: { expected: 'Negatif' },
        SOX2: { expected: 'Negatif' },
        AFP: { expected: 'Negatif' },
        GPC3: { expected: 'Negatif' },
      },
      pitfalls: [
        'beta-hCG yalnız sinsityotrofoblastik dev hücrelerde pozitif olabilir; bu tek başına koryokarsinom anlamına gelmez.',
        'AFP yüksekliği saf seminom ile uyumlu değildir; non-seminomatöz komponent araştırılmalıdır.',
        'İleri yaşta lenfoma dışlanmalıdır.',
      ],
      notes: [
        'Klasik seminom profili: SALL4+, OCT3/4+, CD117+, SOX17+, D2-40+, CD30-, SOX2-, AFP-, GPC3-.',
      ],
    },
  },
  {
    id: 'embryonal_carcinoma',
    name: 'Embriyonel karsinom',
    shortName: 'EK',
    referenceProfile: {
      expectedMarkers: {
        SALL4: { expected: 'Nükleer pozitif' },
        OCT4: { expected: 'Nükleer pozitif' },
        CD30: { expected: 'Pozitif', note: 'Membranöz/Golgi paterninde' },
        SOX2: { expected: 'Nükleer pozitif' },
        PanCK: { expected: 'Pozitif' },
        CD117: { expected: 'Genellikle negatif/zayıf' },
        SOX17: { expected: 'Negatif beklenir' },
      },
      pitfalls: [
        'CD30 pozitifliği lenfoma ile karışabilir; OCT3/4 ve PanCK ile desteklenmelidir.',
        'Seminomdan ayrımda SOX2+/SOX17- paterni önemlidir.',
      ],
      notes: [
        'Embriyonel karsinom: SALL4+, OCT3/4+, CD30+, SOX2+, PanCK+, CD117 genellikle negatif/zayıf, SOX17 negatif.',
      ],
    },
  },
  {
    id: 'yolk_sac',
    name: 'Yolk sac tümör',
    shortName: 'YST',
    referenceProfile: {
      expectedMarkers: {
        SALL4: { expected: 'Pozitif' },
        GPC3: { expected: 'Pozitif' },
        AFP: { expected: 'Fokal/yamalı/diffüz olabilir', note: 'Negatiflik dışlamaz' },
        PanCK: { expected: 'Pozitif' },
        OCT4: { expected: 'Negatif' },
        CD30: { expected: 'Negatif' },
      },
      pitfalls: [
        'AFP negatifliği yolk sac tümörü dışlamaz.',
        'Serum AFP düzeyi destekleyicidir.',
        'GPC3 AFP\'den daha duyarlıdır.',
      ],
      notes: [
        'Yolk sac tümör: SALL4+, GPC3+, AFP değişken, PanCK+, OCT3/4-, CD30-.',
      ],
    },
  },
  {
    id: 'choriocarcinoma',
    name: 'Koryokarsinom / trofoblastik komponent',
    shortName: 'Korio',
    referenceProfile: {
      expectedMarkers: {
        betaHCG: { expected: 'Yaygın trofoblastik komponentte pozitif' },
        GATA3: { expected: 'Olabilir', note: 'Trofoblastik diferansiyasyonu destekler' },
        p63: { expected: 'Olabilir', note: 'Sitotrofoblastik komponentte' },
        Inhibin: { expected: 'Olabilir', note: 'Sinsityotrofoblastik hücrelerde' },
        PanCK: { expected: 'Pozitif' },
      },
      pitfalls: [
        'Seminomdaki sinsityotrofoblastik dev hücre beta-hCG pozitifliği tek başına koryokarsinom değildir.',
        'Bifazik trofoblastik patern (sinsityo + sito) aranmalıdır.',
      ],
      notes: [
        'Koryokarsinom: beta-hCG yaygın trofoblastik pozitif, GATA3 olabilir, p63 sitotrofoblastta olabilir, inhibin sinsityotrofoblastta olabilir, PanCK+.',
      ],
    },
  },
  {
    id: 'teratoma',
    name: 'Teratom, postpubertal tip',
    shortName: 'Ter',
    referenceProfile: {
      expectedMarkers: {},
      pitfalls: [
        'Sabit tek bir İHK profili yoktur.',
        'İHK teratom tanısı koymak için değil; komponent karakterizasyonu, somatik tip malign transformasyon veya metastaz ayrımı için kullanılır.',
        'Erişkin saf matür teratomda prepubertal tip yorumu dikkatli yapılmalıdır; GCNIS, 12p/i12p ve klinik korelasyon gerekir.',
      ],
      notes: [
        'Komponent profil uyumu immünohistokimyadan çok morfolojik somatik doku komponentlerinin gösterilmesine dayanır.',
        'Prepubertal tip teratomda çocuk yaş, GCNIS yokluğu ve 12p gain/i12p yokluğu destekleyicidir.',
        'Postpubertal tip teratom erişkinde GCNIS ilişkili spektrum içinde değerlendirilir; 12p gain/i12p ve eşlik eden non-teratom GHT komponenti destekleyici olabilir.',
        'Somatik tip malign transformasyon kuşkusunda İHK hedefli olarak malign komponentin tipini belirlemek için kullanılır.',
      ],
    },
  },
  {
    id: 'spermatocytic',
    name: 'Spermatositik tümör',
    shortName: 'Sper',
    referenceProfile: {
      expectedMarkers: {
        OCT4: { expected: 'Negatif' },
        CD30: { expected: 'Negatif' },
        AFP: { expected: 'Negatif' },
        GPC3: { expected: 'Negatif' },
        SALL4: { expected: 'Değişken/zayıf olabilir' },
        CD117: { expected: 'Olabilir', note: 'Değişken membranöz pozitiflik' },
      },
      pitfalls: [
        'Seminomdan ayrımda GCNIS yokluğu, OCT3/4 negatifliği ve yaş önemlidir.',
        'İleri yaşta lenfoma olasılığı (mimik uyarısı) dışlanmalıdır.',
      ],
      notes: [
        'Spermatositik tümör: OCT3/4-, CD30-, AFP/GPC3-, SALL4 değişken/zayıf, CD117 olabilir.',
        'GCNIS yokluğu destekleyicidir.',
        'İleri yaş (>50) destekleyicidir.',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// 8. COMPATIBILITY_MATRIX
// ---------------------------------------------------------------------------

export const COMPATIBILITY_MATRIX: CompatibilityMatrix = {
  SALL4: {
    gcnis: 95,
    seminoma: 95,
    embryonal_carcinoma: 95,
    yolk_sac: 95,
    choriocarcinoma: 50,
    teratoma: 30,
    spermatocytic: 35,
  },
  OCT4: {
    gcnis: 95,
    seminoma: 95,
    embryonal_carcinoma: 95,
    yolk_sac: 0,
    choriocarcinoma: 0,
    teratoma: 0,
    spermatocytic: 0,
  },
  CD117: {
    gcnis: 90,
    seminoma: 90,
    embryonal_carcinoma: 10,
    yolk_sac: 0,
    choriocarcinoma: 0,
    teratoma: 20,
    spermatocytic: 60,
  },
  CD30: {
    gcnis: 0,
    seminoma: 0,
    embryonal_carcinoma: 95,
    yolk_sac: 0,
    choriocarcinoma: 10,
    teratoma: 0,
    spermatocytic: 0,
  },
  GPC3: {
    gcnis: 0,
    seminoma: 0,
    embryonal_carcinoma: 10,
    yolk_sac: 90,
    choriocarcinoma: 50,
    teratoma: 30,
    spermatocytic: 0,
  },
  AFP: {
    gcnis: 0,
    seminoma: 0,
    embryonal_carcinoma: 10,
    yolk_sac: 80,
    choriocarcinoma: 10,
    teratoma: 20,
    spermatocytic: 0,
  },
  betaHCG: {
    gcnis: 0,
    seminoma: 20,
    embryonal_carcinoma: 10,
    yolk_sac: 10,
    choriocarcinoma: 95,
    teratoma: 0,
    spermatocytic: 0,
  },
  D2_40: {
    gcnis: 70,
    seminoma: 85,
    embryonal_carcinoma: 10,
    yolk_sac: 0,
    choriocarcinoma: 0,
    teratoma: 0,
    spermatocytic: 0,
  },
  SOX17: {
    gcnis: 90,
    seminoma: 90,
    embryonal_carcinoma: 0,
    yolk_sac: 20,
    choriocarcinoma: 0,
    teratoma: 20,
    spermatocytic: 0,
  },
  SOX2: {
    gcnis: 0,
    seminoma: 0,
    embryonal_carcinoma: 90,
    yolk_sac: 10,
    choriocarcinoma: 0,
    teratoma: 40,
    spermatocytic: 0,
  },
  PanCK: {
    gcnis: 0,
    seminoma: 20,
    embryonal_carcinoma: 85,
    yolk_sac: 85,
    choriocarcinoma: 85,
    teratoma: 60,
    spermatocytic: 10,
  },
  GATA3: {
    gcnis: 0,
    seminoma: 10,
    embryonal_carcinoma: 10,
    yolk_sac: 10,
    choriocarcinoma: 80,
    teratoma: 10,
    spermatocytic: 0,
  },
  p63: {
    gcnis: 0,
    seminoma: 0,
    embryonal_carcinoma: 10,
    yolk_sac: 10,
    choriocarcinoma: 70,
    teratoma: 20,
    spermatocytic: 0,
  },
  Inhibin: {
    gcnis: 0,
    seminoma: 10,
    embryonal_carcinoma: 0,
    yolk_sac: 0,
    choriocarcinoma: 60,
    teratoma: 10,
    spermatocytic: 0,
  },
  SF1: {
    gcnis: 0,
    seminoma: 0,
    embryonal_carcinoma: 0,
    yolk_sac: 0,
    choriocarcinoma: 0,
    teratoma: 0,
    spermatocytic: 0,
  },
  Calretinin: {
    gcnis: 0,
    seminoma: 0,
    embryonal_carcinoma: 0,
    yolk_sac: 0,
    choriocarcinoma: 0,
    teratoma: 10,
    spermatocytic: 0,
  },
  EMA: {
    gcnis: 0,
    seminoma: 0,
    embryonal_carcinoma: 10,
    yolk_sac: 10,
    choriocarcinoma: 10,
    teratoma: 40,
    spermatocytic: 0,
  },
};

// ---------------------------------------------------------------------------
// 9. SERUM_THRESHOLDS
// ---------------------------------------------------------------------------

export const SERUM_THRESHOLDS = {
  afp: {
    mild_high: 1000,
    significant_high: 10000,
    very_high: Infinity,
  },
  betaHcg: {
    mild_high: 5000,
    significant_high: 50000,
    very_high: Infinity,
  },
  ldh: {
    mild_high: 1.5,
    significant_high: 10,
    very_high: Infinity,
  },
} as const;

// ---------------------------------------------------------------------------
// 10. SERUM_INTERPRETATIONS
// ---------------------------------------------------------------------------

export const SERUM_INTERPRETATIONS: Record<'afp' | 'betaHcg' | 'ldh', string> =
  {
    afp: 'Serum AFP yüksekliği yolk sac tümör komponentini kuvvetle düşündürür. Saf seminomda AFP yüksekliği beklenmez; yüksek AFP varlığında non-seminomatöz komponent araştırılmalıdır.',
    betaHcg:
      'Serum beta-hCG yüksekliği trofoblastik komponent (koryokarsinom) veya sinsityotrofoblastik dev hücreler ile ilişkili olabilir. Hafif yükseklik seminomda görülebilir; belirgin yükseklik koryokarsinom lehinedir.',
    ldh: 'Serum LDH yüksekliği tümör yükü ile orantılıdır ve evreleme/prognoz açısından değerlendirilmelidir. Spesifik bir tümör tipi göstermez.',
  };

// ---------------------------------------------------------------------------
// 11. MEDICAL_DISCLAIMER
// ---------------------------------------------------------------------------

export const MEDICAL_DISCLAIMER =
  'Bu araç tanı koymaz. İmmünohistokimyasal sonuçlar; morfoloji, serum markerları, yaş, klinik bilgi, GCNIS varlığı ve gerektiğinde moleküler/sitogenetik veriler ile birlikte değerlendirilmelidir.';

// ---------------------------------------------------------------------------
// 12. WEIGHT_DISCLAIMER
// ---------------------------------------------------------------------------

export const WEIGHT_DISCLAIMER =
  'Yüzdeler tanısal duyarlılık/özgüllük veya kesin tanı değildir; girilen sonucun ilgili komponent profiliyle beklenen uyum gücünü gösteren pratik uygulama ağırlıklarıdır.';

// ---------------------------------------------------------------------------
// 13. getScoreColor
// ---------------------------------------------------------------------------

export function getScoreColor(score: number): {
  bg: string;
  text: string;
  label: string;
  border: string;
} {
  if (score >= 80)
    return {
      bg: '#dcfce7',
      text: '#166534',
      label: 'Çok güçlü uyum',
      border: '#86efac',
    };
  if (score >= 60)
    return {
      bg: '#d1fae5',
      text: '#065f46',
      label: 'Uyumlu',
      border: '#6ee7b7',
    };
  if (score >= 40)
    return {
      bg: '#fef9c3',
      text: '#854d0e',
      label: 'Kısmi / destekleyici',
      border: '#fde047',
    };
  if (score >= 20)
    return {
      bg: '#fed7aa',
      text: '#9a3412',
      label: 'Zayıf',
      border: '#fdba74',
    };
  return {
    bg: '#fee2e2',
    text: '#991b1b',
    label: 'Uyumsuz / yetersiz',
    border: '#fca5a5',
  };
}

// ---------------------------------------------------------------------------
// 14. CARD_COLORS
// ---------------------------------------------------------------------------

export const CARD_COLORS: Record<
  CardOutput['type'],
  { bg: string; border: string; icon: string }
> = {
  strong_match: { bg: '#dcfce7', border: '#22c55e', icon: '✅' },
  supportive: { bg: '#ecfdf5', border: '#10b981', icon: '🟢' },
  pitfall: { bg: '#fef9c3', border: '#eab308', icon: '⚠️' },
  conflict: { bg: '#ffedd5', border: '#f97316', icon: '🔶' },
  non_gct_warning: { bg: '#fce7f3', border: '#ec4899', icon: '🔴' },
  suggested_panel: { bg: '#dbeafe', border: '#3b82f6', icon: '💡' },
};
