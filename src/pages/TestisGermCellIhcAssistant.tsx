import React, { useState, useMemo, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  Copy, Check, ChevronDown, ChevronUp, Shield, AlertTriangle,
  X, Eye, Microscope
} from 'lucide-react';
import {
  type AntibodyDefinition,
  type SerumMarkers,
  type AgeRange,
  type MorphologyFlags,
  type TumorType,
  type CardOutput,
  MAIN_PANEL_ANTIBODIES,
  MIMIC_PANEL_ANTIBODIES,
  TUMOR_DEFINITIONS,
  AGE_RANGES,
  MORPHOLOGY_FLAGS,
  MEDICAL_DISCLAIMER,
  WEIGHT_DISCLAIMER,
  getScoreColor,
  CARD_COLORS,
  SERUM_INTERPRETATIONS,
} from '../data/testisGhtData';
import {
  calculateTumorScores,
  generateCombinationCards,
  generateMimicWarnings,
  generateNextMarkerSuggestions,
  buildIhcCopyText,
  buildSerumCopyText,
  buildInterpretationCopyText,
  type ScoreBreakdown,
} from '../data/testisGhtRules';

// ─── Types & constants ─────────────────────────────────────

type SerumKey = 'afp' | 'betaHcg' | 'ldh';
type HeImpressionKey =
  | 'unknown'
  | 'seminoma'
  | 'embryonal'
  | 'yolk_sac'
  | 'choriocarcinoma'
  | 'teratoma'
  | 'spermatocytic'
  | 'non_gct'
  | 'mixed_uncertain';


interface AntibodyGroupDefinition {
  id: string;
  title: string;
  markerIds: string[];
  description: string;
  bullets: string[];
  pitfall?: string;
}

interface DifferentialDefinition {
  id: string;
  title: string;
  markerIds: string[];
  heHint: string;
  minimalPanel: string[];
  pitfall: string;
  missingMarkerHint: string;
}

interface HeImpressionDefinition {
  id: HeImpressionKey;
  label: string;
  summary: string;
  minimalPanel: string[];
  pitfalls: string[];
  markerIds: string[];
}

interface ScenarioDefinition {
  id: string;
  label: string;
  note: string;
  heImpression: HeImpressionKey;
  ageRange: AgeRange;
  observedResults: Record<string, string>;
  morphologyFlags?: MorphologyFlags;
}

const allAntibodyDefinitions = [...MAIN_PANEL_ANTIBODIES, ...MIMIC_PANEL_ANTIBODIES];

const HE_IMPRESSIONS: HeImpressionDefinition[] = [
  {
    id: 'unknown',
    label: 'Girilmedi',
    summary: 'HE ön izlenimi girilmedi. İHK paternleri ve klinik bağlam birlikte değerlendirilebilir.',
    minimalPanel: ['SALL4', 'OCT3/4', 'CD117', 'CD30', 'GPC3', 'AFP'],
    pitfalls: ['Morfoloji olmadan geniş panel yerine en kritik ayrımı hedefleyen öncelikli boya yaklaşımı tercih edilmelidir.'],
    markerIds: ['SALL4', 'OCT4', 'CD117', 'CD30', 'GPC3', 'AFP'],
  },
  {
    id: 'seminoma',
    label: 'Seminom lehine',
    summary: 'HE seminom lehine ise İHK destekleyici ve ayırıcı tanı dışlayıcı amaçla kullanılmalıdır.',
    minimalPanel: ['SALL4', 'OCT3/4', 'CD117', 'SOX17 veya D2-40', 'CD30', 'SOX2'],
    pitfalls: ['İleri yaşta seminom benzeri tümörde lenfoma dışlanmalıdır.', 'AFP yüksekliği saf seminom ile uyumlu değildir.'],
    markerIds: ['SALL4', 'OCT4', 'CD117', 'SOX17', 'D2_40', 'CD30', 'SOX2', 'CD45_LCA', 'CD20', 'PAX5'],
  },
  {
    id: 'embryonal',
    label: 'Embriyonel karsinom lehine',
    summary: 'HE embriyonel karsinom lehine ise OCT3/4-CD30-SOX2-PanCK ekseni ve seminom/yolk sac ayrımı önemlidir.',
    minimalPanel: ['OCT3/4', 'CD30', 'SOX2', 'PanCK', 'CD117', 'SOX17', 'GPC3', 'AFP'],
    pitfalls: ['Seyrek CD30 pozitifliği tek başına yeterli değildir; patern ve morfoloji ile değerlendirilmelidir.'],
    markerIds: ['OCT4', 'CD30', 'SOX2', 'PanCK', 'CD117', 'SOX17', 'GPC3', 'AFP'],
  },
  {
    id: 'yolk_sac',
    label: 'Yolk sac tümör lehine',
    summary: 'HE yolk sac lehine ise GPC3/AFP desteği, OCT3/4-CD30-SOX2 negatifliği ve serum AFP korelasyonu önemlidir.',
    minimalPanel: ['SALL4', 'GPC3', 'AFP', 'PanCK', 'OCT3/4', 'CD30', 'SOX2'],
    pitfalls: ['AFP negatifliği yolk sac tümörü dışlamaz; GPC3 ve morfoloji ile korelasyon gerekir.'],
    markerIds: ['SALL4', 'GPC3', 'AFP', 'PanCK', 'OCT4', 'CD30', 'SOX2'],
  },
  {
    id: 'choriocarcinoma',
    label: 'Koryokarsinom/trofoblastik komponent lehine',
    summary: 'Trofoblastik komponent kuşkusunda yaygın beta-hCG paterni, GATA3/p63/inhibin ve hemoraji-nekroz/bifazik morfoloji birlikte değerlendirilir.',
    minimalPanel: ['beta-hCG patern detayı', 'GATA3', 'p63', 'İnhibin', 'PanCK'],
    pitfalls: ['Seminomda yalnız sinsityotrofoblastik dev hücrelerde beta-hCG pozitifliği koryokarsinom anlamına gelmez.'],
    markerIds: ['betaHCG', 'GATA3', 'p63', 'Inhibin', 'PanCK'],
  },
  {
    id: 'teratoma',
    label: 'Teratom lehine',
    summary: 'Teratom sabit İHK profiliyle tanınmaz; matür/immatür somatik dokuların morfolojik gösterilmesi, yaş, GCNIS ve 12p/i12p bilgisi önemlidir.',
    minimalPanel: ['Morfoloji', 'Yaş', 'GCNIS', '12p/i12p', 'Eşlik eden GHT komponentleri', 'Somatik malign komponent için hedefli İHK'],
    pitfalls: ['Erişkin saf matür teratomda prepubertal tip yorumu dikkatli yapılmalıdır.'],
    markerIds: ['PanCK', 'EMA', 'SOX2', 'CDX2', 'SATB2', 'PAX8', 'Desmin', 'Myogenin', 'MyoD1', 'MDM2', 'CDK4'],
  },
  {
    id: 'spermatocytic',
    label: 'Spermatositik tümör lehine',
    summary: 'Spermatositik tümör yorumu ileri yaş, GCNIS yokluğu, OCT3/4-CD30-AFP-GPC3 negatifliği ve CD117/SALL4 değişkenliği ile anlam kazanır.',
    minimalPanel: ['OCT3/4', 'CD30', 'GPC3', 'AFP', 'CD117', 'SALL4', 'GCNIS durumu'],
    pitfalls: ['İleri yaşta lenfoma ayırıcı tanıda kalmalıdır.'],
    markerIds: ['OCT4', 'CD30', 'GPC3', 'AFP', 'CD117', 'SALL4', 'CD45_LCA', 'CD20', 'PAX5'],
  },
  {
    id: 'non_gct',
    label: 'Lenfoma/metastaz/GHT dışı kuşku',
    summary: 'GHT dışı kuşkuda germ hücre markerlarının negatifliği, CD45/CD20/PAX5, SF1/inhibin/calretinin ve PanCK/EMA-organ spesifik panel birlikte değerlendirilir.',
    minimalPanel: ['CD45', 'CD20', 'PAX5', 'SF1', 'İnhibin', 'Calretinin', 'PanCK', 'EMA', 'NKX3.1/PAX8/TTF-1/CDX2/SATB2'],
    pitfalls: ['Germ markerları negatif olguda düşük GHT skorları mimik uyarısını gölgelememelidir.'],
    markerIds: ['CD45_LCA', 'CD20', 'PAX5', 'SF1', 'Inhibin', 'Calretinin', 'PanCK', 'EMA', 'NKX3_1', 'PAX8', 'TTF1', 'CDX2', 'SATB2'],
  },
  {
    id: 'mixed_uncertain',
    label: 'Kararsız / mikst alanlar var',
    summary: 'Mikst tümör kuşkusunda her morfolojik komponent alanı kendi sınırları içinde ayrı analiz edilmelidir.',
    minimalPanel: ['Alan bazlı SALL4/OCT3/4/CD30/CD117/GPC3/AFP/beta-hCG', 'Morfoloji ve serum korelasyonu'],
    pitfalls: ['Farklı alanların İHK paternleri tek bir ortalama profile indirgenmemelidir.'],
    markerIds: ['SALL4', 'OCT4', 'CD30', 'CD117', 'GPC3', 'AFP', 'betaHCG'],
  },
];


const SAMPLE_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'sample_seminoma',
    label: 'Seminom',
    note: 'Klasik seminom destek profili ve GCNIS ilişkili aks.',
    heImpression: 'seminoma',
    ageRange: '20-45',
    observedResults: {
      SALL4: 'diffuse_strong_nuclear',
      OCT4: 'diffuse_strong_nuclear',
      CD117: 'diffuse_membranous',
      D2_40: 'diffuse_membranous',
      SOX17: 'diffuse_nuclear',
      CD30: 'negative',
      SOX2: 'negative',
      AFP: 'negative',
      GPC3: 'negative',
    },
    morphologyFlags: { gcnisPresent: true },
  },
  {
    id: 'sample_embryonal',
    label: 'Embriyonel',
    note: 'OCT3/4-CD30-SOX2-PanCK ekseni.',
    heImpression: 'embryonal',
    ageRange: '20-45',
    observedResults: {
      SALL4: 'diffuse_strong_nuclear',
      OCT4: 'diffuse_strong_nuclear',
      CD30: 'diffuse_membranous_golgi',
      SOX2: 'diffuse_nuclear',
      PanCK: 'diffuse_positive',
      CD117: 'negative',
      SOX17: 'negative',
    },
  },
  {
    id: 'sample_yolk_sac',
    label: 'Yolk sac',
    note: 'GPC3/AFP pozitif, OCT3/4-CD30 negatif profil.',
    heImpression: 'yolk_sac',
    ageRange: '0-5',
    observedResults: {
      SALL4: 'diffuse_strong_nuclear',
      GPC3: 'diffuse_positive',
      AFP: 'diffuse_positive',
      PanCK: 'diffuse_positive',
      OCT4: 'negative',
      CD30: 'negative',
    },
    morphologyFlags: { schillerDuvalPattern: true },
  },
  {
    id: 'sample_lymphoma',
    label: 'Lenfoma mimiki',
    note: 'CD45 ve B hücre belirteci pozitif, germ marker negatif.',
    heImpression: 'non_gct',
    ageRange: '>60',
    observedResults: {
      CD45_LCA: 'diffuse_strong',
      CD20: 'diffuse_strong',
      PAX5: 'diffuse_strong',
      SALL4: 'negative',
    },
  },
  {
    id: 'sample_metastasis',
    label: 'Metastaz',
    note: 'Diffüz PanCK/EMA pozitif, germ marker negatif.',
    heImpression: 'non_gct',
    ageRange: '>60',
    observedResults: {
      PanCK: 'diffuse_positive',
      EMA: 'diffuse_positive',
      SALL4: 'negative',
      OCT4: 'negative',
      CD30: 'negative',
      GPC3: 'negative',
      AFP: 'negative',
    },
    morphologyFlags: { advancedAgeAtypicalClinical: true },
  },
  {
    id: 'sample_spermatocytic',
    label: 'Spermatositik',
    note: 'İleri yaş, GCNIS yokluğu ve OCT3/4 negatifliği bağlamı.',
    heImpression: 'spermatocytic',
    ageRange: '46-60',
    observedResults: {
      CD117: 'diffuse_membranous',
      OCT4: 'negative',
      CD30: 'negative',
      GPC3: 'negative',
      AFP: 'negative',
      SOX2: 'negative',
      SALL4: 'focal_weak_nuclear',
    },
    morphologyFlags: { gcnisAbsent: true },
  },
  {
    id: 'sample_seminoma_hcg_pitfall',
    label: 'Seminom + hCG pitfall',
    note: 'Seminom profili içinde yalnız sinsityotrofoblastik dev hücrelerde beta-hCG pozitifliği.',
    heImpression: 'seminoma',
    ageRange: '20-45',
    observedResults: {
      SALL4: 'diffuse_strong_nuclear',
      OCT4: 'diffuse_strong_nuclear',
      CD117: 'diffuse_membranous',
      SOX17: 'diffuse_nuclear',
      D2_40: 'diffuse_membranous',
      betaHCG: 'syncytial_only',
      CD30: 'negative',
      SOX2: 'negative',
      AFP: 'negative',
      GPC3: 'negative',
    },
    morphologyFlags: { gcnisPresent: true, syncytiotrophoblasticGiantCells: true },
  },
  {
    id: 'sample_yolk_sac_afp_negative',
    label: 'Yolk sac AFP−',
    note: 'GPC3 pozitif, AFP negatif; AFP negatifliğinin dışlayıcı olmadığı örnek.',
    heImpression: 'yolk_sac',
    ageRange: '20-45',
    observedResults: {
      SALL4: 'diffuse_strong_nuclear',
      GPC3: 'diffuse_positive',
      PanCK: 'diffuse_positive',
      AFP: 'negative',
      OCT4: 'negative',
      CD30: 'negative',
      SOX2: 'negative',
    },
    morphologyFlags: { schillerDuvalPattern: true },
  },
  {
    id: 'sample_choriocarcinoma',
    label: 'Koryo/trofoblastik',
    note: 'Yaygın beta-hCG ve trofoblastik destek markerları.',
    heImpression: 'choriocarcinoma',
    ageRange: '20-45',
    observedResults: {
      betaHCG: 'widespread_trophoblastic',
      GATA3: 'diffuse_nuclear',
      p63: 'focal_nuclear',
      Inhibin: 'syncytiotrophoblastic_only',
      PanCK: 'diffuse_positive',
      SALL4: 'focal_weak_nuclear',
      OCT4: 'negative',
      CD30: 'negative',
      AFP: 'negative',
    },
    morphologyFlags: { hemorrhageNecrosisDominant: true, biphasicTrophoblasticPattern: true },
  },
  {
    id: 'sample_sex_cord',
    label: 'Sex-cord stromal',
    note: 'SF1 nükleer pozitifliği ve inhibin/calretinin desteği; germ marker negatif.',
    heImpression: 'non_gct',
    ageRange: '46-60',
    observedResults: {
      SF1: 'diffuse_nuclear',
      Inhibin: 'widespread_tumor',
      Calretinin: 'diffuse_positive',
      SALL4: 'negative',
      OCT4: 'negative',
      CD30: 'negative',
      GPC3: 'negative',
      AFP: 'negative',
    },
  },
  {
    id: 'sample_melanoma_mimic',
    label: 'Melanom mimiki',
    note: 'SOX10/S100 ve melanotik markerlar pozitif, germ marker negatif.',
    heImpression: 'non_gct',
    ageRange: '>60',
    observedResults: {
      SOX10: 'diffuse_strong',
      S100: 'diffuse_strong',
      HMB45: 'positive',
      MelanA: 'positive',
      SALL4: 'negative',
      OCT4: 'negative',
      CD30: 'negative',
      GPC3: 'negative',
      AFP: 'negative',
    },
  },
  {
    id: 'sample_teratoma_somatic',
    label: 'Teratom/somatik komponent',
    note: 'Teratomda İHK tanı koydurucu değil; somatik komponent karakterizasyonu örneği.',
    heImpression: 'teratoma',
    ageRange: '20-45',
    observedResults: {
      PanCK: 'diffuse_positive',
      EMA: 'focal_positive',
      SALL4: 'negative',
      OCT4: 'negative',
      CD30: 'negative',
      GPC3: 'negative',
      AFP: 'negative',
    },
    morphologyFlags: { matureSomaticComponent: true, somaticTypeMalignancySuspicion: true, associatedNonTeratomatousGct: true },
  },
];

const ANTIBODY_GROUPS: AntibodyGroupDefinition[] = [
  {
    id: 'first_lineage',
    title: 'Germ hücre kökeni ve ilk yönlendirme',
    markerIds: ['SALL4', 'OCT4', 'CD117', 'CD30'],
    description: 'Bu grup ilk soruyu cevaplar: lezyon germ hücreli tümör profiline giriyor mu ve ilk yön seminom/embriyonel/yolk sac ekseninde nereye kayıyor?',
    bullets: [
      'SALL4 germ hücre kökenini destekler; yalnız uygun nükleer boyanma anlamlıdır.',
      'OCT3/4 seminom ve embriyonel karsinom tarafını açar; yolk sac/koryo/teratom/spermatositik tümörde beklenmez.',
      'CD117 seminom/GCNIS ve spermatositik tümörde destekleyici olabilir.',
      'CD30 embriyonel karsinom yönünü güçlendirir; seyrek pozitif hücre tek başına yeterli değildir.',
    ],
    pitfall: 'SALL4 negatifse GHT dışı mimikler ve metastaz güvenlik paneli daha görünür düşünülmelidir.',
  },
  {
    id: 'seminoma_ec',
    title: 'Seminom ↔ Embriyonel karsinom ayrımı',
    markerIds: ['SOX17', 'SOX2', 'D2_40', 'PanCK'],
    description: 'OCT3/4 pozitif tümörde en sık gereken ayrımı hedefler: seminom mu, embriyonel karsinom mu?',
    bullets: [
      'Seminom lehine: SOX17+, CD117+, D2-40+, CD30−, SOX2−.',
      'Embriyonel lehine: SOX2+, CD30+, PanCK+, CD117 genellikle negatif/zayıf, SOX17−.',
      'OCT3/4 ikisinde de pozitif olabileceği için tek başına ayırıcı değildir.',
    ],
    pitfall: 'SOX17/SOX2 birlikteliğinde boyanan alanlar morfoloji ile ayrı ayrı kontrol edilmelidir.',
  },
  {
    id: 'ec_yolk',
    title: 'Embriyonel karsinom ↔ Yolk sac tümör ayrımı',
    markerIds: ['GPC3', 'AFP'],
    description: 'SALL4 ve PanCK pozitif tümörlerde embriyonel karsinom ile yolk sac tümör ayrımına odaklanır.',
    bullets: [
      'Embriyonel lehine: OCT3/4+, CD30+, SOX2+, PanCK+.',
      'Yolk sac lehine: GPC3+, AFP değişken+, OCT3/4−, CD30−, SOX2−.',
      'SALL4 ve PanCK iki tarafta da pozitif olabileceği için tek başına ayırıcı değildir.',
    ],
    pitfall: 'AFP negatifliği yolk sac tümörü dışlamaz; GPC3 pozitifliği ve uygun morfoloji varsa yolk sac yönü devam eder.',
  },
  {
    id: 'yolk_chorio',
    title: 'Yolk sac ↔ Trofoblastik/koryokarsinom ayrımı',
    markerIds: ['betaHCG', 'GATA3', 'p63', 'Inhibin'],
    description: 'GPC3/AFP ekseni ile beta-hCG/GATA3/p63/inhibin eksenini ayırır.',
    bullets: [
      'Yolk sac yönü: GPC3+, AFP değişken+, PanCK+, OCT3/4−.',
      'Trofoblastik/koryo yönü: yaygın beta-hCG+, GATA3+, p63/inhibin desteği, hemoraji/nekroz ve bifazik patern.',
    ],
    pitfall: 'Seminomdaki sinsityotrofoblastik dev hücre beta-hCG pozitifliği tek başına koryokarsinom değildir.',
  },
  {
    id: 'seminoma_safety',
    title: 'Seminom benzeri tümörde güvenlik kontrolü',
    markerIds: ['SF1', 'Calretinin', 'EMA'],
    description: 'Seminom benzeri görünümde spermatositik tümör, lenfoma, sex-cord stromal tümör ve metastaz güvenlik kontrolünü hatırlatır.',
    bullets: [
      'Seminom lehine: SALL4+, OCT3/4+, CD117+, SOX17/D2-40+, GCNIS desteği.',
      'Spermatositik lehine: ileri yaş, GCNIS yokluğu, OCT3/4−, CD30−, GPC3/AFP−, CD117 değişken+.',
      'Lenfoma lehine: CD45+, CD20/PAX5+, germ markerları negatif.',
      'Sex-cord stromal yönü: SF1 nükleer+, inhibin/calretinin+, germ markerları negatif.',
    ],
    pitfall: 'İleri yaşta seminom benzeri tümörde CD45/CD20/PAX5 çalışılmamışsa lenfoma dışlanmamış olabilir.',
  },
  {
    id: 'teratoma_somatic',
    title: 'Teratom / somatik komponent değerlendirmesi',
    markerIds: [],
    description: 'Teratom sabit İHK profiliyle tanınmaz; bu bölüm morfoloji, yaş, GCNIS, 12p/i12p ve somatik komponent bilgisini öne çıkarır.',
    bullets: [
      'Prepubertal tip lehine: çocuk yaş, GCNIS yokluğu, 12p gain/i12p yokluğu, genellikle benign davranış.',
      'Postpubertal tip lehine: erişkin/postpubertal hasta, GCNIS ilişkisi, 12p gain/i12p desteği, metastatik potansiyel.',
      'Somatik tip malign transformasyonda İHK malign komponentin tipini belirlemek için hedefli seçilir.',
    ],
    pitfall: 'Erişkin saf matür teratomda prepubertal tip yorumu dikkatli yapılmalıdır.',
  },
  {
    id: 'mimic_safety',
    title: 'GHT dışı mimikler / metastaz güvenlik paneli',
    markerIds: MIMIC_PANEL_ANTIBODIES.map((ab) => ab.id),
    description: 'Bu grup “bu gerçekten germ hücreli tümör mü?” sorusunu güvenlik açısından kontrol eder.',
    bullets: [
      'Lenfoma/lösemi: CD45, CD20, PAX5, CD3, CD79a.',
      'Metastatik karsinom / somatik tip malignite: PanCK/EMA diffüz+, germ markerları negatif, organ-spesifik panel.',
      'Melanom: SOX10/S100 ve HMB45/Melan-A.',
      'Paratestiküler sarkom: Desmin, Myogenin, MyoD1, SMA, MDM2/CDK4, ERG/CD31.',
    ],
    pitfall: 'Güçlü GHT dışı uyarı varsa düşük/orta GHT uyumları yorum metnini gölgelememelidir.',
  },
];

const DIFFERENTIALS: DifferentialDefinition[] = [
  {
    id: 'seminoma_ec',
    title: 'Seminom ↔ Embriyonel',
    markerIds: ['OCT4', 'CD117', 'SOX17', 'D2_40', 'CD30', 'SOX2', 'PanCK'],
    heHint: 'Seminomda şeffaf sitoplazmalı tabakalar ve lenfoid stroma; embriyonel karsinomda daha belirgin atipi, solid/glandüler/papiller patern ve nekroz görülebilir.',
    minimalPanel: ['OCT3/4 ortak olabilir', 'Seminom: CD117, SOX17, D2-40', 'Embriyonel: CD30, SOX2, PanCK'],
    pitfall: 'OCT3/4 tek başına ayırıcı değildir; SOX17/SOX2 ve CD117/CD30 karşıtlığı daha değerlidir.',
    missingMarkerHint: 'SOX17, SOX2, CD30 veya CD117 eksikse ayrım için önerilir.',
  },
  {
    id: 'ec_yolk',
    title: 'Embriyonel ↔ Yolk sac',
    markerIds: ['OCT4', 'CD30', 'SOX2', 'GPC3', 'AFP', 'SALL4', 'PanCK'],
    heHint: 'Embriyonel karsinomda solid/glandüler/papiller patern ve nekroz; yolk sac tümörde mikrokistik/retiküler patern, Schiller-Duval benzeri yapılar ve hyalin globüller destekleyicidir.',
    minimalPanel: ['Embriyonel: OCT3/4, CD30, SOX2', 'Yolk sac: GPC3, AFP', 'Ortak: SALL4, PanCK'],
    pitfall: 'AFP negatifliği yolk sac tümörü dışlamaz; GPC3 pozitifliği ve uygun morfoloji varsa yolk sac yönü devam eder.',
    missingMarkerHint: 'GPC3 veya AFP çalışılmadıysa önerilir; OCT3/4/CD30/SOX2 negatifliği yolk sac lehine yardımcıdır.',
  },
  {
    id: 'yolk_chorio',
    title: 'Yolk sac ↔ Koryo',
    markerIds: ['GPC3', 'AFP', 'betaHCG', 'GATA3', 'p63', 'Inhibin', 'PanCK'],
    heHint: 'Yolk sac tümörde retiküler/mikrokistik alanlar; koryokarsinomda hemoraji-nekroz ve bifazik trofoblastik popülasyon aranır.',
    minimalPanel: ['Yolk sac: GPC3, AFP', 'Trofoblastik/koryo: yaygın beta-hCG, GATA3, p63, inhibin', 'Ortak: PanCK'],
    pitfall: 'Seminomda sadece sinsityotrofoblastik dev hücrelerde beta-hCG pozitifliği koryokarsinom değildir.',
    missingMarkerHint: 'beta-hCG patern detayı, GATA3, p63 ve inhibin eksikse önerilebilir.',
  },
  {
    id: 'seminoma_lymphoma',
    title: 'Seminom ↔ Lenfoma',
    markerIds: ['SALL4', 'OCT4', 'CD117', 'SOX17', 'D2_40', 'CD45_LCA', 'CD20', 'PAX5', 'CD3'],
    heHint: 'İleri yaşta solid/seminom benzeri görünümde lenfoma klinik olarak kritik mimiktir; bilateralite ve diffüz infiltratif büyüme uyarıcıdır.',
    minimalPanel: ['Seminom: SALL4, OCT3/4, CD117/SOX17/D2-40', 'Lenfoma: CD45, CD20, PAX5, CD3'],
    pitfall: 'Lenfoma dışlanmadan ileri yaş seminom benzeri tümör germ hücreli tümör lehine yorumlanmamalıdır.',
    missingMarkerHint: 'CD45/CD20/PAX5 eksikse özellikle >60 yaşta önerilir.',
  },
  {
    id: 'seminoma_spermatocytic',
    title: 'Seminom ↔ Spermatositik',
    markerIds: ['OCT4', 'CD117', 'SALL4', 'CD30', 'GPC3', 'AFP', 'D2_40', 'SOX17'],
    heHint: 'Spermatositik tümör genellikle ileri yaşta, GCNIS yokluğu ve OCT3/4 negatifliği ile desteklenir.',
    minimalPanel: ['Seminom: OCT3/4, CD117, SOX17/D2-40', 'Spermatositik: OCT3/4−, CD30−, GPC3/AFP−, CD117 değişken+', 'GCNIS durumu'],
    pitfall: 'Spermatositik tümör yorumu yaş ve GCNIS yokluğu olmadan yalnız negatif markerlarla yükselmemelidir.',
    missingMarkerHint: 'GCNIS durumu, OCT3/4, CD30, GPC3, AFP ve CD117 tamamlanabilir.',
  },
  {
    id: 'gct_sexcord',
    title: 'GHT ↔ Sex-cord stromal',
    markerIds: ['SALL4', 'OCT4', 'CD30', 'GPC3', 'AFP', 'SF1', 'Inhibin', 'Calretinin', 'MelanA'],
    heHint: 'Germ markerları negatif ve sex-cord stromal morfoloji/klinik varsa SF1 ekseni önemlidir.',
    minimalPanel: ['GHT dışlama: SALL4, OCT3/4, CD30, GPC3/AFP', 'Sex-cord: SF1, inhibin, calretinin, Melan-A'],
    pitfall: 'SF1 nükleer pozitifliği GHT skorundan çok sex-cord stromal tümör uyarısı üretmelidir.',
    missingMarkerHint: 'SF1 pozitifse inhibin/calretinin/Melan-A ve retikülin paterni düşünülebilir.',
  },
  {
    id: 'gct_metastasis',
    title: 'GHT ↔ Metastaz',
    markerIds: ['SALL4', 'OCT4', 'CD30', 'GPC3', 'AFP', 'PanCK', 'EMA', 'NKX3_1', 'PSA', 'PSAP', 'PSMA', 'PAX8', 'CAIX', 'TTF1', 'NapsinA', 'CDX2', 'SATB2', 'GATA3', 'p40', 'CK5_6', 'Uroplakin'],
    heHint: 'İleri yaş, bilinen malignite öyküsü, GCNIS yokluğu, germ marker negatifliği, PanCK/EMA diffüz pozitifliği ve bilateral/paratestiküler/infiltratif büyüme metastazı düşündürür.',
    minimalPanel: ['Germ markerlar: SALL4, OCT3/4, CD30, GPC3/AFP', 'Epitelyal: PanCK, EMA', 'Primer: NKX3.1/PSA/PSMA, PAX8/CAIX, TTF-1/Napsin A, CDX2/SATB2, GATA3/p40/Uroplakin'],
    pitfall: 'PanCK/EMA pozitifliği tek başına primeri belirlemez; organ-spesifik panel klinik bilgiyle seçilmelidir.',
    missingMarkerHint: 'PanCK/EMA pozitif ve germ markerları negatifse primer odak paneli önerilir.',
  },
  {
    id: 'teratoma_type',
    title: 'Teratom tipi',
    markerIds: ['PanCK', 'EMA', 'SOX2'],
    heHint: 'Matür veya immatür somatik doku komponentleri; epitel, kıkırdak, nöral doku, skuamöz/glandüler yapılar aranır.',
    minimalPanel: ['İHK değil; yaş, GCNIS, 12p/i12p ve eşlik eden GHT komponenti değerlendirilir.'],
    pitfall: 'Erişkin saf matür teratomda prepubertal tip yorumu dikkatli yapılmalıdır; GCNIS, 12p/i12p ve klinik korelasyon gerekir.',
    missingMarkerHint: '12p/i12p, GCNIS durumu ve eşlik eden non-teratom GHT komponenti bilgisi değerlidir.',
  },
  {
    id: 'teratoma_somatic_malignancy',
    title: 'Teratom ↔ Somatik malign transformasyon',
    markerIds: ['PanCK', 'EMA', 'p40', 'CDX2', 'SATB2', 'PAX8', 'TTF1', 'Desmin', 'Myogenin', 'MyoD1', 'MDM2', 'CDK4'],
    heHint: 'Teratom içinde belirgin malign epitelyal, mezenkimal, nöroektodermal veya sarkomatöz komponent kuşkusu.',
    minimalPanel: ['Morfolojiye göre hedefli marker seç: PanCK/EMA, p40, CDX2/SATB2, PAX8, TTF-1, Desmin/Myogenin/MyoD1, MDM2/CDK4'],
    pitfall: 'İHK teratom tanısı koymak için değil, somatik malign komponentin tipini belirlemek için kullanılır.',
    missingMarkerHint: 'Şüpheli somatik komponentin morfolojisine göre hedefli panel seçilmelidir.',
  },
];

// ─── Inline style constants ────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
  overflow: 'hidden',
  marginBottom: '14px',
};

const panelHeaderStyle: React.CSSProperties = {
  padding: '12px 14px',
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  fontSize: '13px',
  fontWeight: 800,
  color: '#0f172a',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.45px',
  color: '#64748b',
  marginBottom: '5px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  borderRadius: '8px',
  border: '1px solid #dbe3ef',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  color: '#0f172a',
  outline: 'none',
  fontFamily: 'inherit',
};

// ─── Utility helpers ───────────────────────────────────────

function getAntibodyById(id: string): AntibodyDefinition | undefined {
  return allAntibodyDefinitions.find((ab) => ab.id === id);
}

function getHeDefinition(id: HeImpressionKey): HeImpressionDefinition {
  return HE_IMPRESSIONS.find((x) => x.id === id) || HE_IMPRESSIONS[0];
}

function getDifferential(id: string | null): DifferentialDefinition | undefined {
  if (!id) return undefined;
  return DIFFERENTIALS.find((x) => x.id === id);
}

function getGroup(id: string | null): AntibodyGroupDefinition | undefined {
  if (!id) return undefined;
  return ANTIBODY_GROUPS.find((x) => x.id === id);
}

function serumStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'normal': return 'Normal';
    case 'mild_high': return 'Hafif yüksek';
    case 'significant_high': return 'Anlamlı yüksek';
    case 'very_high': return 'Çok yüksek';
    default: return 'Girilmedi';
  }
}

function morphologyCount(flags: MorphologyFlags): number {
  return Object.values(flags).filter(Boolean).length;
}

function enteredAntibodyCount(results: Record<string, string>, ids?: string[]): number {
  const keys = ids ?? Object.keys(results);
  return keys.filter((id) => results[id] && results[id] !== 'not_done').length;
}

function isSuspiciousOptionKey(key: string): boolean {
  return key.includes('suspicious') || key.includes('smudge') || key.includes('nonspecific') || key === 'suspicious';
}

function optionSortWeight(opt: AntibodyDefinition['options'][number]): number {
  if (opt.key === 'negative') return 1;
  if (opt.isWrongPattern || isSuspiciousOptionKey(opt.key)) return 2;
  if (opt.isPositive) return 10 + Math.round((opt.patternCoefficient ?? 0) * 10);
  return 5;
}

function getResultTone(opt?: AntibodyDefinition['options'][number] | null): { bg: string; border: string; text: string } {
  if (!opt) return { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' };
  if (opt.key === 'negative') return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' };
  if (opt.isWrongPattern) return { bg: '#f5f3ff', border: '#c4b5fd', text: '#5b21b6' };
  if (isSuspiciousOptionKey(opt.key)) return { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' };
  if (opt.isPositive && (opt.patternCoefficient ?? 0) >= 1) return { bg: '#78350f', border: '#78350f', text: '#fff7ed' };
  if (opt.isPositive && (opt.patternCoefficient ?? 0) >= 0.7) return { bg: '#b45309', border: '#92400e', text: '#fff7ed' };
  if (opt.isPositive) return { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' };
  return { bg: '#ffffff', border: '#e2e8f0', text: '#334155' };
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* no-op */ }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '7px 10px', borderRadius: '8px', fontSize: '11px',
        fontWeight: 700, cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
        backgroundColor: copied ? '#dcfce7' : '#f8fafc',
        color: copied ? '#166534' : '#475569',
        borderColor: copied ? '#86efac' : '#e2e8f0',
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Kopyalandı' : label}
    </button>
  );
}

function MiniPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={cardStyle}>
      <div style={panelHeaderStyle}>{title}</div>
      <div style={{ padding: '13px 14px' }}>{children}</div>
    </div>
  );
}



type MarkerTone = 'positive' | 'negative' | 'warning' | 'neutral' | 'mimic';

function MarkerBadge({ label, tone = 'neutral', title }: { label: string; tone?: MarkerTone; title?: string }) {
  const palette: Record<MarkerTone, { bg: string; border: string; text: string }> = {
    positive: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
    negative: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' },
    warning: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
    neutral: { bg: '#f8fafc', border: '#cbd5e1', text: '#475569' },
    mimic: { bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' },
  };
  const colors = palette[tone];
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '4px 7px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 900,
      backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
      lineHeight: 1.1, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function BadgeList({ label, items, tone }: { label: string; items: string[]; tone: MarkerTone }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {items.map((item) => <MarkerBadge key={item} label={item} tone={tone} />)}
      </div>
    </div>
  );
}

function expectedTone(expected: string): MarkerTone {
  const lower = expected.toLocaleLowerCase('tr-TR');
  if (lower.includes('beklenmez') || lower.includes('negatif')) return 'negative';
  if (lower.includes('olabilir') || lower.includes('değişken')) return 'neutral';
  return 'positive';
}

function heBadgeSets(he: HeImpressionDefinition): { positive: string[]; negative: string[]; safety: string[] } {
  switch (he.id) {
    case 'seminoma':
      return { positive: ['SALL4+', 'OCT3/4+', 'CD117+', 'SOX17+', 'D2-40+'], negative: ['CD30−', 'SOX2−', 'AFP/GPC3−'], safety: ['İleri yaşta CD45', 'CD20/PAX5'] };
    case 'embryonal':
      return { positive: ['OCT3/4+', 'CD30+', 'SOX2+', 'PanCK+'], negative: ['CD117−/zayıf', 'SOX17−'], safety: ['GPC3/AFP ile YST ayrımı'] };
    case 'yolk_sac':
      return { positive: ['SALL4+', 'GPC3+', 'AFP değişken+', 'PanCK+'], negative: ['OCT3/4−', 'CD30−', 'SOX2−'], safety: ['Serum AFP korelasyonu'] };
    case 'choriocarcinoma':
      return { positive: ['Yaygın β-hCG+', 'GATA3+', 'p63+', 'İnhibin+'], negative: ['OCT3/4−'], safety: ['Hemoraji/nekroz', 'Bifazik patern'] };
    case 'teratoma':
      return { positive: ['Matür/immatür somatik doku', '12p/i12p bağlamı'], negative: ['Sabit İHK profili yok'], safety: ['Somatik malign transformasyon'] };
    case 'spermatocytic':
      return { positive: ['CD117 olabilir', 'SALL4 değişken/zayıf'], negative: ['OCT3/4−', 'CD30−', 'GPC3/AFP−'], safety: ['İleri yaş', 'GCNIS yok', 'Lenfoma dışla'] };
    case 'non_gct':
      return { positive: ['CD45/CD20/PAX5', 'SF1/İnhibin', 'PanCK/EMA'], negative: ['SALL4−', 'OCT3/4−'], safety: ['Organ spesifik panel'] };
    case 'mixed_uncertain':
      return { positive: ['Alan bazlı SALL4', 'OCT3/4', 'CD30', 'GPC3/AFP'], negative: [], safety: ['Komponentleri ayrı gir'] };
    default:
      return { positive: he.minimalPanel, negative: [], safety: [] };
  }
}

function HeImpressionCard({ heDef }: { heDef: HeImpressionDefinition }) {
  const sets = heBadgeSets(heDef);
  return (
    <>
      <BadgeList label="Öncelikli boyalar / bulgular" items={sets.positive} tone="positive" />
      {!!sets.negative.length && <BadgeList label="Dışlama / beklenen negatifler" items={sets.negative} tone="negative" />}
      {!!sets.safety.length && <BadgeList label="Güvenlik / bağlam" items={sets.safety} tone="mimic" />}
    </>
  );
}


function getTargetTumorForHe(he: HeImpressionKey): TumorType | null {
  switch (he) {
    case 'seminoma': return 'seminoma';
    case 'embryonal': return 'embryonal_carcinoma';
    case 'yolk_sac': return 'yolk_sac';
    case 'choriocarcinoma': return 'choriocarcinoma';
    case 'teratoma': return 'teratoma';
    case 'spermatocytic': return 'spermatocytic';
    default: return null;
  }
}

function getHeIhkRelation(
  he: HeImpressionKey,
  scores: Record<TumorType, ScoreBreakdown>,
  warnings: CardOutput[],
): { tone: MarkerTone; text: string } {
  if (he === 'unknown') return { tone: 'neutral', text: 'HE ön izlenimi girilmedi; İHK profili bağımsız yorumlanıyor.' };
  if (he === 'mixed_uncertain') return { tone: 'warning', text: 'Mikst/kararsız HE alanları varsa her morfolojik komponent ayrı ayrı girilmelidir.' };
  if (he === 'non_gct') {
    return warnings.some((w) => w.type === 'non_gct_warning')
      ? { tone: 'mimic', text: 'HE GHT dışı/mimik kuşkusu, mevcut güvenlik uyarılarıyla destekleniyor.' }
      : { tone: 'warning', text: 'HE GHT dışı/mimik kuşkusu var; güvenlik paneli ve klinik bağlamla korelasyon önerilir.' };
  }

  const target = getTargetTumorForHe(he);
  if (!target) return { tone: 'neutral', text: 'HE–İHK ilişkisi değerlendirilemedi.' };
  const targetScore = scores[target]?.overall ?? 0;
  const topOther = Object.entries(scores)
    .filter(([id]) => id !== 'gcnis' && id !== target)
    .sort(([, a], [, b]) => b.overall - a.overall)[0];
  const topOtherScore = topOther?.[1]?.overall ?? 0;

  if (targetScore >= 70) return { tone: 'positive', text: 'HE ön izlenimi, girilen İHK profiliyle güçlü şekilde destekleniyor.' };
  if (targetScore >= 50) return { tone: 'neutral', text: 'HE ön izlenimi ile İHK profili kısmen uyumlu; eksik marker ve morfoloji korelasyonu önerilir.' };
  if (topOtherScore >= 60) return { tone: 'warning', text: 'HE ön izlenimi ile İHK profilinde çelişki olabilir; farklı komponent veya mimik olasılığı gözden geçirilmelidir.' };
  return { tone: 'neutral', text: 'HE ön izlenimi için yeterli İHK desteği henüz oluşmamış.' };
}

function getDataSufficiency(
  enteredCount: number,
  ageRange: AgeRange,
  serumMarkers: SerumMarkers,
  morphologyFlags: MorphologyFlags,
  heImpression: HeImpressionKey,
): { tone: MarkerTone; label: string; text: string } {
  const contextCount =
    (ageRange !== 'unknown' ? 1 : 0) +
    (heImpression !== 'unknown' ? 1 : 0) +
    (Object.values(morphologyFlags).some(Boolean) ? 1 : 0) +
    ([serumMarkers.afp.status, serumMarkers.betaHcg.status, serumMarkers.ldh.status].some((s) => s !== 'unknown') ? 1 : 0);

  if (enteredCount >= 6 && contextCount >= 2) {
    return { tone: 'positive', label: 'İyi', text: 'Hedefli İHK ve klinik/serum-morfoloji bağlamı birlikte girilmiş.' };
  }
  if (enteredCount >= 3 || (enteredCount >= 2 && contextCount >= 1)) {
    return { tone: 'neutral', label: 'Orta', text: 'İlk profil yorumu yapılabilir; eksik kritik markerlar sağ panelde kontrol edilmelidir.' };
  }
  return { tone: 'warning', label: 'Düşük', text: 'Az sayıda veri girilmiş; tek boya veya sınırlı bilgiyle güçlü yorumdan kaçınılmalıdır.' };
}

function getAmbiguityText(sortedComponents: { id: TumorType; name: string; breakdown: ScoreBreakdown }[]): string | null {
  const first = sortedComponents[0];
  const second = sortedComponents[1];
  if (!first || !second) return null;
  if ((first.breakdown.overall ?? 0) >= 50 && (second.breakdown.overall ?? 0) >= 50 && Math.abs(first.breakdown.overall - second.breakdown.overall) <= 12) {
    return `${first.name} ve ${second.name} profilleri birbirine yakın. Mikst tümör, farklı morfolojik alanlar veya eksik kritik marker açısından alan bazlı değerlendirme önerilir.`;
  }
  return null;
}

function makeConciseInterpretation(
  scores: Record<TumorType, ScoreBreakdown>,
  cards: CardOutput[],
  ageRange: AgeRange,
): string {
  const parts: string[] = [];
  const nonGctWarning = cards.find((c) => c.type === 'non_gct_warning');
  if (nonGctWarning) parts.push(nonGctWarning.text);

  const top = (Object.entries(scores) as [TumorType, ScoreBreakdown][])
    .filter(([id]) => id !== 'gcnis')
    .sort(([, a], [, b]) => b.overall - a.overall)[0];

  if (top && top[1].overall >= (nonGctWarning ? 75 : 50)) {
    const tumor = TUMOR_DEFINITIONS.find((t) => t.id === top[0]);
    if (tumor) parts.push(`İmmün profil ${tumor.name} profili ile ${top[1].overall >= 80 ? 'güçlü uyumludur' : 'uyumlu olabilir'}.`);
  }
  if (!nonGctWarning && (scores.gcnis?.overall ?? 0) >= 50) {
    parts.push('GCNIS ilişkili profil açısından destekleyici bulgular mevcuttur.');
  }
  parts.push(ageRange === 'unknown' ? 'Klinik/serum verisi girilmemiştir.' : 'Klinik/serum ve morfoloji bağlamı ile korelasyon önerilir.');
  return parts.join(' ');
}

function CompactSignalCard({ title, text, tone }: { title: string; text: string; tone: MarkerTone }) {
  return (
    <div style={{ padding: '8px 9px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', marginBottom: '7px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <MarkerBadge label={title} tone={tone} />
      </div>
      <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

function CardDisplay({ card }: { card: CardOutput }) {
  const colors = CARD_COLORS[card.type];
  return (
    <div style={{
      padding: '11px 12px', borderRadius: '10px', marginBottom: '8px',
      backgroundColor: colors.bg, borderLeft: `4px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>{colors.icon}</span>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>{card.title}</div>
          <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.55 }}>{card.text}</div>
          {!!card.suggestions?.length && (
            <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {card.suggestions.map((s, i) => (
                <span key={i} style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.7)', color: '#475569' }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  tumorId,
  name,
  breakdown,
  isSelected,
  onClick,
}: {
  tumorId: string;
  name: string;
  breakdown: ScoreBreakdown;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = getScoreColor(breakdown.overall);
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        padding: '9px 10px', borderRadius: '10px', marginBottom: '7px',
        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{name}</span>
        <span style={{ fontSize: '10px', fontWeight: 800, color: colors.text, backgroundColor: colors.bg, border: `1px solid ${colors.border}`, padding: '1px 6px', borderRadius: '999px' }}>{Math.round(breakdown.overall)}%</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, breakdown.overall))}%`, backgroundColor: colors.border, transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
        <span>İHK %{Math.round(breakdown.ihc)}</span>
        <span>{breakdown.clinicalActive ? `Klinik/serum %${Math.round(breakdown.clinical)}` : 'Klinik/serum yok'}</span>
      </div>
    </button>
  );
}

function AntibodyRow({
  antibody,
  selectedKey,
  onSelect,
  onClear,
  onNameClick,
  isHighlighted,
  referenceExpected,
  isEditing,
  onEditToggle,
}: {
  antibody: AntibodyDefinition;
  selectedKey: string | undefined;
  onSelect: (antibodyId: string, optionKey: string) => void;
  onClear: (antibodyId: string) => void;
  onNameClick: (antibodyId: string) => void;
  isHighlighted: boolean;
  referenceExpected?: string;
  isEditing: boolean;
  onEditToggle: (antibodyId: string) => void;
}) {
  const selectedOption = selectedKey ? antibody.options.find((o) => o.key === selectedKey) : undefined;
  const visibleOptions = antibody.options.filter((opt) => opt.key !== 'not_done').sort((a, b) => optionSortWeight(a) - optionSortWeight(b));
  const tone = getResultTone(selectedOption);
  const showSummary = !!selectedOption && !isEditing;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '132px minmax(0,1fr)', gap: '8px',
      padding: '7px 10px', borderBottom: '1px solid #edf2f7', alignItems: 'center',
      backgroundColor: isHighlighted ? '#fff7ed' : '#ffffff',
      boxShadow: isHighlighted ? 'inset 3px 0 0 #f59e0b' : 'none',
    }}>
      <button
        onClick={() => onNameClick(antibody.id)}
        style={{
          background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
          color: '#312e81', fontWeight: 800, fontSize: '12px', padding: 0, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0,
        }}
        title={`${antibody.name} bilgi kartı`}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{antibody.name}</span>
        {antibody.isNuclearMarker && <span style={{ fontSize: '9px', color: '#7c3aed', backgroundColor: '#ede9fe', borderRadius: '4px', padding: '1px 4px' }}>NÜK</span>}
      </button>

      <div>
        {showSummary ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => onEditToggle(antibody.id)}
              style={{
                flex: 1, border: `1px solid ${tone.border}`, backgroundColor: tone.bg, color: tone.text,
                borderRadius: '8px', padding: '6px 9px', fontSize: '11px', fontWeight: 800,
                textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0,
              }}
            >
              {selectedOption.label}
            </button>
            <button
              onClick={() => onClear(antibody.id)}
              style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', borderRadius: '8px', width: '26px', height: '26px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              title="Bu antikoru temizle"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {visibleOptions.map((opt) => {
              const optTone = getResultTone(opt);
              const isSelected = selectedKey === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => onSelect(antibody.id, opt.key)}
                  style={{
                    border: `1px solid ${isSelected ? optTone.border : '#e2e8f0'}`,
                    backgroundColor: isSelected ? optTone.bg : '#ffffff',
                    color: isSelected ? optTone.text : '#475569',
                    padding: '5px 8px', borderRadius: '7px', fontSize: '10px',
                    fontWeight: isSelected ? 800 : 600, cursor: 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {opt.label.replace(' pozitif', ' +')}
                </button>
              );
            })}
          </div>
        )}
        {referenceExpected && (
          <div style={{ marginTop: '3px', fontSize: '9px', color: '#0369a1' }}>Referans beklenti: {referenceExpected}</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export function TestisGermCellIhcAssistant() {
  const [observedResults, setObservedResults] = useState<Record<string, string>>({});
  const [serumMarkers, setSerumMarkers] = useState<SerumMarkers>({
    afp: { value: '', unit: 'ng/mL', status: 'unknown' },
    betaHcg: { value: '', unit: 'mIU/mL', status: 'unknown' },
    ldh: { value: '', unit: 'xULN', status: 'unknown' },
  });
  const [ageRange, setAgeRange] = useState<AgeRange>('unknown');
  const [morphologyFlags, setMorphologyFlags] = useState<MorphologyFlags>({});
  const [heImpression, setHeImpression] = useState<HeImpressionKey>('unknown');
  const [selectedTumorReference, setSelectedTumorReference] = useState<TumorType | null>(null);
  const [selectedAntibodyInfo, setSelectedAntibodyInfo] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedDifferentialId, setSelectedDifferentialId] = useState<string | null>(null);
  const [showMimicPanel, setShowMimicPanel] = useState(false);
  const [showMorphologyPanel, setShowMorphologyPanel] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(['first_lineage', 'seminoma_ec', 'ec_yolk', 'yolk_chorio', 'seminoma_safety', 'teratoma_somatic']));
  const [editingRows, setEditingRows] = useState<Set<string>>(() => new Set());
  const [copyMode, setCopyMode] = useState<'short' | 'detailed'>('short');

  const handleAntibodySelect = useCallback((antibodyId: string, optionKey: string) => {
    setObservedResults((prev) => ({ ...prev, [antibodyId]: optionKey }));
    setEditingRows((prev) => {
      const next = new Set(prev);
      next.delete(antibodyId);
      return next;
    });
  }, []);

  const handleAntibodyClear = useCallback((antibodyId: string) => {
    setObservedResults((prev) => {
      const next = { ...prev };
      delete next[antibodyId];
      return next;
    });
    setEditingRows((prev) => {
      const next = new Set(prev);
      next.delete(antibodyId);
      return next;
    });
  }, []);

  const handleEditToggle = useCallback((antibodyId: string) => {
    setEditingRows((prev) => {
      const next = new Set(prev);
      if (next.has(antibodyId)) next.delete(antibodyId);
      else next.add(antibodyId);
      return next;
    });
  }, []);

  const handleAntibodyInfoClick = useCallback((antibodyId: string) => {
    setSelectedAntibodyInfo(antibodyId);
    setSelectedTumorReference(null);
    setSelectedGroupId(null);
    setSelectedDifferentialId(null);
  }, []);

  const handleTumorClick = useCallback((tumorId: TumorType) => {
    setSelectedTumorReference((prev) => prev === tumorId ? null : tumorId);
    setSelectedAntibodyInfo(null);
    setSelectedGroupId(null);
    setSelectedDifferentialId(null);
  }, []);

  const handleGroupHeaderClick = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedAntibodyInfo(null);
    setSelectedTumorReference(null);
    setSelectedDifferentialId(null);
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleDifferentialClick = useCallback((diffId: string) => {
    setSelectedDifferentialId(diffId);
    setSelectedAntibodyInfo(null);
    setSelectedTumorReference(null);
    setSelectedGroupId(null);
  }, []);

  const handleHeChange = useCallback((value: HeImpressionKey) => {
    setHeImpression(value);
    setSelectedDifferentialId(null);
    setSelectedAntibodyInfo(null);
    setSelectedTumorReference(null);
    setSelectedGroupId(null);
  }, []);

  const handleSerumChange = useCallback((marker: SerumKey, field: string, value: string) => {
    setSerumMarkers((prev) => ({ ...prev, [marker]: { ...prev[marker], [field]: value } }));
  }, []);

  const handleGcnisStatusChange = useCallback((value: string) => {
    setMorphologyFlags((prev) => ({
      ...prev,
      gcnisPresent: value === 'present',
      gcnisAbsent: value === 'absent',
      gcnisNotEvaluable: value === 'not_evaluable',
    }));
  }, []);

  const handleMorphologyChange = useCallback((key: keyof MorphologyFlags) => {
    setMorphologyFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleLoadScenario = useCallback((scenario: ScenarioDefinition) => {
    setObservedResults(scenario.observedResults);
    setSerumMarkers({
      afp: { value: '', unit: 'ng/mL', status: 'unknown' },
      betaHcg: { value: '', unit: 'mIU/mL', status: 'unknown' },
      ldh: { value: '', unit: 'xULN', status: 'unknown' },
    });
    setAgeRange(scenario.ageRange);
    setMorphologyFlags(scenario.morphologyFlags ?? {});
    setHeImpression(scenario.heImpression);
    setSelectedTumorReference(null);
    setSelectedAntibodyInfo(null);
    setSelectedGroupId(null);
    setSelectedDifferentialId(null);
    setEditingRows(new Set());
    setShowMimicPanel(scenario.heImpression === 'non_gct');
  }, []);

  const scores = useMemo(() =>
    calculateTumorScores(observedResults, serumMarkers, ageRange, morphologyFlags),
    [observedResults, serumMarkers, ageRange, morphologyFlags]
  );

  const combinationCards = useMemo(() =>
    generateCombinationCards(observedResults, serumMarkers, ageRange, morphologyFlags, scores),
    [observedResults, serumMarkers, ageRange, morphologyFlags, scores]
  );

  const mimicWarnings = useMemo(() =>
    generateMimicWarnings(observedResults, serumMarkers, ageRange, morphologyFlags, scores),
    [observedResults, serumMarkers, ageRange, morphologyFlags, scores]
  );

  const nextSuggestions = useMemo(() =>
    generateNextMarkerSuggestions(observedResults, scores, ageRange, morphologyFlags),
    [observedResults, scores, ageRange, morphologyFlags]
  );

  const allAntibodies = useMemo(() => [...MAIN_PANEL_ANTIBODIES, ...MIMIC_PANEL_ANTIBODIES], []);
  const ihcCopyText = useMemo(() => buildIhcCopyText(observedResults, allAntibodies), [observedResults, allAntibodies]);
  const serumCopyText = useMemo(() => buildSerumCopyText(serumMarkers), [serumMarkers]);
  const allCards = useMemo(() => [...combinationCards, ...mimicWarnings], [combinationCards, mimicWarnings]);
  const interpretationCopyText = useMemo(() => buildInterpretationCopyText(allCards, scores, ageRange), [allCards, scores, ageRange]);
  const shortInterpretationText = useMemo(() => {
    const clean = interpretationCopyText.trim();
    if (!clean) return '';
    const sentences = clean.split(/(?<=\.)\s+/).filter(Boolean);
    return sentences.slice(0, 2).join(' ');
  }, [interpretationCopyText]);
  const selectedInterpretationText = copyMode === 'short' ? shortInterpretationText : interpretationCopyText;
  const fullCopyText = useMemo(() => `${ihcCopyText}\n\n${serumCopyText}\n\n${selectedInterpretationText}`, [ihcCopyText, serumCopyText, selectedInterpretationText]);

  const enteredCount = useMemo(() => enteredAntibodyCount(observedResults), [observedResults]);
  const morphCount = morphologyCount(morphologyFlags);
  const heDef = getHeDefinition(heImpression);
  const selectedDiff = getDifferential(selectedDifferentialId);
  const selectedGroup = getGroup(selectedGroupId);
  const selectedAntibodyDef = selectedAntibodyInfo ? getAntibodyById(selectedAntibodyInfo) : undefined;
  const selectedTumorDef = selectedTumorReference ? TUMOR_DEFINITIONS.find((t) => t.id === selectedTumorReference) : undefined;

  const highlightedMarkers = useMemo(() => {
    const ids = new Set<string>();
    if (selectedDiff) selectedDiff.markerIds.forEach((id) => ids.add(id));
    else if (heImpression !== 'unknown') heDef.markerIds.forEach((id) => ids.add(id));
    else if (selectedGroup) selectedGroup.markerIds.forEach((id) => ids.add(id));
    return ids;
  }, [selectedDiff, heImpression, heDef.markerIds, selectedGroup]);

  const getRefExpected = useCallback((antibodyId: string): string | undefined => {
    if (!selectedTumorReference) return undefined;
    const tumor = TUMOR_DEFINITIONS.find((t) => t.id === selectedTumorReference);
    const entry = tumor?.referenceProfile.expectedMarkers[antibodyId];
    return entry?.expected;
  }, [selectedTumorReference]);

  const sortedComponents = useMemo(() =>
    TUMOR_DEFINITIONS
      .filter((t) => t.id !== 'gcnis')
      .map((t) => ({ id: t.id, name: t.name, breakdown: scores[t.id] }))
      .sort((a, b) => (b.breakdown?.overall ?? 0) - (a.breakdown?.overall ?? 0)),
    [scores]
  );

  const topThree = sortedComponents.slice(0, 3);
  const gcnisScore = scores.gcnis;

  const activeCriticalCards = [...mimicWarnings, ...combinationCards.filter((c) => c.type === 'conflict' || c.type === 'pitfall')];
  const heIhkRelation = getHeIhkRelation(heImpression, scores, mimicWarnings);
  const sufficiency = getDataSufficiency(enteredCount, ageRange, serumMarkers, morphologyFlags, heImpression);
  const ambiguityText = getAmbiguityText(sortedComponents);

  const gcnisStatus = morphologyFlags.gcnisPresent
    ? 'present'
    : morphologyFlags.gcnisAbsent
      ? 'absent'
      : morphologyFlags.gcnisNotEvaluable
        ? 'not_evaluable'
        : 'unknown';

  const renderLeftPanel = () => {
    if (selectedAntibodyDef) {
      const info = selectedAntibodyDef.infoCard;
      return (
        <MiniPanel title={`${selectedAntibodyDef.name} — antikor bilgisi`}>
          <InfoBlock label="Doğru boyanma paterni" text={info.stainingPattern} />
          <InfoBlock label="Neyi / hangi komponenti destekler?" text={info.mainUse} />
          {!!info.expectedPositive.length && <BadgeList label="Pozitif beklenenler" items={info.expectedPositive} tone="positive" />}
          {!!info.expectedNegative.length && <BadgeList label="Beklenen negatifler" items={info.expectedNegative} tone="negative" />}
          {info.pitfall && <WarningText text={info.pitfall} />}
        </MiniPanel>
      );
    }

    if (selectedTumorDef) {
      return (
        <MiniPanel title={`${selectedTumorDef.name} — referans profil`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {Object.entries(selectedTumorDef.referenceProfile.expectedMarkers).map(([marker, info]) => (
              <MarkerBadge key={marker} label={`${marker}: ${info.expected}`} tone={expectedTone(info.expected)} title={info.note} />
            ))}
          </div>
          {selectedTumorDef.referenceProfile.notes.map((n, i) => <InfoBlock key={i} label={`Not ${i + 1}`} text={n} />)}
          {selectedTumorDef.referenceProfile.pitfalls.map((p, i) => <WarningText key={i} text={p} />)}
        </MiniPanel>
      );
    }

    if (selectedDiff) {
      return (
        <MiniPanel title={`${selectedDiff.title} — sık ayrım`}>
          <InfoBlock label="HE ipucu" text={selectedDiff.heHint} />
          <BadgeList label="Öncelikli boya yaklaşımı" items={selectedDiff.minimalPanel} tone="neutral" />
          <WarningText text={selectedDiff.pitfall} />
          <InfoBlock label="Eksikse önerilen marker" text={selectedDiff.missingMarkerHint} />
        </MiniPanel>
      );
    }

    if (selectedGroup) {
      return (
        <MiniPanel title={selectedGroup.title}>
          <InfoBlock label="Bu grup neyi çözer?" text={selectedGroup.description} />
          <InfoList label="Pratik okuma" items={selectedGroup.bullets} />
          {selectedGroup.pitfall && <WarningText text={selectedGroup.pitfall} />}
        </MiniPanel>
      );
    }

    if (heImpression !== 'unknown') {
      return (
        <MiniPanel title={`${heDef.label} — HE ön izlenim kartı`}>
          <InfoBlock label="Yaklaşım" text={heDef.summary} />
          <HeImpressionCard heDef={heDef} />
          <InfoList label="Pitfall" items={heDef.pitfalls} warning />
        </MiniPanel>
      );
    }

    return (
      <MiniPanel title="Yardım / Sistem Uyarıları">
        <InfoBlock label="Kullanım" text="HE ön izlenimini seçin, sık ayrım çiplerinden birini açın ve yalnız gerekli antikor paternlerini girin. Skorlar tanı değil, profil uyumu üretir." />
        <InfoList label="Güvenlik" items={[MEDICAL_DISCLAIMER, WEIGHT_DISCLAIMER, 'Mikst tümörde farklı morfolojik komponentler ayrı ayrı değerlendirilmelidir.', 'İHK; morfoloji, serum markerları, yaş, GCNIS ve klinik bilgi ile birlikte yorumlanmalıdır.']} warning />
      </MiniPanel>
    );
  };

  return (
    <PageContainer>
      <div style={{ minHeight: '100vh', padding: '8px 0 28px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1680px', margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 55%, #115e59 100%)',
            borderRadius: '16px', padding: '20px 22px', marginBottom: '12px',
            boxShadow: '0 4px 12px rgba(13,148,136,0.22)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={21} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontSize: '23px', fontWeight: 900, color: '#ffffff', margin: 0 }}>Testis GHT İHK Uyum Yardımcısı</h1>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.78)', margin: '3px 0 0' }}>HE ön izlenimi, öncelikli boyaları ve İHK patern uyumunu birlikte gösterir; tanı koymaz.</p>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '12px 14px', marginBottom: '12px' }}>
            <div className="testis-clinical-strip">
              <div>
                <label style={labelStyle}>HE ön izlenim</label>
                <select value={heImpression} onChange={(e) => handleHeChange(e.target.value as HeImpressionKey)} style={inputStyle}>
                  {HE_IMPRESSIONS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Yaş</label>
                <select value={ageRange} onChange={(e) => setAgeRange(e.target.value as AgeRange)} style={inputStyle}>
                  {AGE_RANGES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </div>
              {(['afp', 'betaHcg', 'ldh'] as const).map((marker) => (
                <div key={marker}>
                  <label style={labelStyle}>{marker === 'afp' ? 'AFP' : marker === 'betaHcg' ? 'β-hCG' : 'LDH'}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 98px', gap: '5px' }}>
                    <input
                      value={serumMarkers[marker].value}
                      onChange={(e) => handleSerumChange(marker, 'value', e.target.value)}
                      placeholder="Değer"
                      inputMode="decimal"
                      style={inputStyle}
                    />
                    <select value={serumMarkers[marker].status} onChange={(e) => handleSerumChange(marker, 'status', e.target.value)} style={inputStyle}>
                      <option value="unknown">Girilmedi</option>
                      <option value="normal">Normal</option>
                      <option value="mild_high">Hafif</option>
                      <option value="significant_high">Anlamlı</option>
                      <option value="very_high">Çok yüksek</option>
                    </select>
                  </div>
                </div>
              ))}
              <div>
                <label style={labelStyle}>GCNIS</label>
                <select value={gcnisStatus} onChange={(e) => handleGcnisStatusChange(e.target.value)} style={inputStyle}>
                  <option value="unknown">Girilmedi</option>
                  <option value="present">Var</option>
                  <option value="absent">Yok</option>
                  <option value="not_evaluable">Değerlendirilemedi</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Özet</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  <button onClick={() => setShowMorphologyPanel((p) => !p)} style={stripButtonStyle(showMorphologyPanel)}><Eye size={12} /> Morfoloji: {morphCount}</button>
                  <button onClick={() => setShowMimicPanel((p) => !p)} style={stripButtonStyle(showMimicPanel)}><AlertTriangle size={12} /> Mimik: {showMimicPanel ? 'Açık' : 'Kapalı'}</button>
                  <span style={{ ...pillStyle, backgroundColor: '#eff6ff', color: '#1e40af' }}><Microscope size={12} /> İHK: {enteredCount}</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span><strong>HE:</strong> {heDef.label}</span>
              <span>|</span>
              <span><strong>AFP:</strong> {serumStatusLabel(serumMarkers.afp.status)}</span>
              <span><strong>β-hCG:</strong> {serumStatusLabel(serumMarkers.betaHcg.status)}</span>
              <span><strong>LDH:</strong> {serumStatusLabel(serumMarkers.ldh.status)}</span>
            </div>
            {showMorphologyPanel && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '5px' }}>
                {MORPHOLOGY_FLAGS.map((flag) => (
                  <label key={flag.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#334155', padding: '5px 7px', borderRadius: '8px', border: morphologyFlags[flag.key] ? '1px solid #99f6e4' : '1px solid #edf2f7', backgroundColor: morphologyFlags[flag.key] ? '#f0fdfa' : '#ffffff' }}>
                    <input type="checkbox" checked={!!morphologyFlags[flag.key]} onChange={() => handleMorphologyChange(flag.key)} style={{ accentColor: '#0d9488' }} />
                    {flag.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...cardStyle, padding: '10px 12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.45px' }}>Demo / test profilleri</div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Eğitim/test amaçlıdır; tıklanınca mevcut girişleri değiştirir</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {SAMPLE_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleLoadScenario(scenario)}
                  title={scenario.note}
                  style={{
                    border: '1px solid #dbe3ef', backgroundColor: '#ffffff', color: '#334155',
                    borderRadius: '999px', padding: '7px 10px', fontSize: '11px', fontWeight: 900,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Demo: {scenario.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '10px 12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.45px' }}>Sık ayrımlar</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {DIFFERENTIALS.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => handleDifferentialClick(diff.id)}
                  style={{
                    border: selectedDifferentialId === diff.id ? '1px solid #0d9488' : '1px solid #dbe3ef',
                    backgroundColor: selectedDifferentialId === diff.id ? '#ccfbf1' : '#ffffff',
                    color: selectedDifferentialId === diff.id ? '#0f766e' : '#475569',
                    borderRadius: '999px', padding: '6px 10px', fontSize: '11px', fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {diff.title}
                </button>
              ))}
            </div>
          </div>

          <div className="testis-ght-layout-pro">
            <aside className="testis-left-rail">
              <div className="testis-left-sticky">
                <div className="rail-header">Akıllı Bilgi Paneli</div>
                <div className="rail-scroll">
                  {renderLeftPanel()}
                  {(combinationCards.length > 0 || mimicWarnings.length > 0) && (
                    <MiniPanel title="Aktif akıllı kartlar">
                      {[...mimicWarnings, ...combinationCards].slice(0, 5).map((card) => <CardDisplay key={card.id} card={card} />)}
                    </MiniPanel>
                  )}
                </div>
              </div>
            </aside>

            <main>
              <div style={cardStyle}>
                <div style={panelHeaderStyle}>
                  <span>Antikor giriş barları</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{enteredCount} sonuç girildi</span>
                </div>
                {ANTIBODY_GROUPS.map((group) => {
                  if (group.id === 'mimic_safety' && !showMimicPanel) {
                    return (
                      <div key={group.id} style={{ padding: '10px 12px', borderTop: '1px solid #edf2f7' }}>
                        <button onClick={() => setShowMimicPanel(true)} style={{ width: '100%', border: '1px dashed #f9a8d4', background: '#fdf2f8', color: '#831843', borderRadius: '10px', padding: '10px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Mimik / metastaz güvenlik panelini aç
                        </button>
                      </div>
                    );
                  }

                  const expanded = expandedGroups.has(group.id);
                  const groupEntered = enteredAntibodyCount(observedResults, group.markerIds);
                  return (
                    <section key={group.id}>
                      <button
                        onClick={() => handleGroupHeaderClick(group.id)}
                        style={{
                          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          border: 'none', borderTop: '1px solid #e2e8f0', background: selectedGroupId === group.id ? '#ecfeff' : '#f8fafc',
                          padding: '10px 12px', cursor: 'pointer', fontFamily: 'inherit', color: '#0f172a',
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 900 }}>{group.title}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#64748b' }}>
                          {group.markerIds.length ? `${groupEntered}/${group.markerIds.length} girildi` : 'morfoloji/klinik'}
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </button>
                      {expanded && (
                        <div>
                          {group.markerIds.length === 0 ? (
                            <div style={{ padding: '11px 12px', fontSize: '11px', color: '#475569', backgroundColor: '#fff' }}>
                              {group.description} Morfoloji/klinik kutucuklarını klinik şeritten işaretleyin.
                            </div>
                          ) : group.markerIds.map((id) => {
                            const ab = getAntibodyById(id);
                            if (!ab) return null;
                            return (
                              <AntibodyRow
                                key={ab.id}
                                antibody={ab}
                                selectedKey={observedResults[ab.id]}
                                onSelect={handleAntibodySelect}
                                onClear={handleAntibodyClear}
                                onNameClick={handleAntibodyInfoClick}
                                isHighlighted={highlightedMarkers.has(ab.id)}
                                referenceExpected={getRefExpected(ab.id)}
                                isEditing={editingRows.has(ab.id)}
                                onEditToggle={handleEditToggle}
                              />
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

            </main>

            <aside className="testis-right-column">
              <div className="right-column-header">Profil Uyumu ve Rapor</div>
              <MiniPanel title="Profil uyumu ve rapor özeti">
                <div style={{ display: 'grid', gap: '7px', marginBottom: '10px' }}>
                  <div style={summaryLineStyle}><span>HE ön izlenim</span><strong>{heDef.label}</strong></div>
                  <div style={summaryLineStyle}><span>Girilen İHK</span><strong>{enteredCount}</strong></div>
                  {gcnisScore && <div style={summaryLineStyle}><span>GCNIS destek skoru</span><strong>{Math.round(gcnisScore.overall)}%</strong></div>}
                </div>
                <CompactSignalCard title="HE–İHK ilişkisi" text={heIhkRelation.text} tone={heIhkRelation.tone} />
                <CompactSignalCard title={`Veri yeterliliği: ${sufficiency.label}`} text={sufficiency.text} tone={sufficiency.tone} />
                {ambiguityText && <CompactSignalCard title="Belirsiz / mikst uyarısı" text={ambiguityText} tone="warning" />}
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#475569', margin: '9px 0 6px' }}>En güçlü 3 profil</div>
                {topThree.map((item) => (
                  <ScoreBar
                    key={item.id}
                    tumorId={item.id}
                    name={item.name}
                    breakdown={item.breakdown}
                    isSelected={selectedTumorReference === item.id}
                    onClick={() => handleTumorClick(item.id as TumorType)}
                  />
                ))}
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#475569', margin: '12px 0 6px' }}>Tüm komponent skorları</div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  {sortedComponents.map((item) => {
                    const colors = getScoreColor(item.breakdown.overall);
                    return (
                      <button key={item.id} onClick={() => handleTumorClick(item.id as TumorType)} style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '8px', padding: '5px 7px', display: 'flex', justifyContent: 'space-between', fontFamily: 'inherit', cursor: 'pointer', fontSize: '11px', color: '#334155' }}>
                        <span>{item.name}</span>
                        <strong style={{ color: colors.text }}>{Math.round(item.breakdown.overall)}%</strong>
                      </button>
                    );
                  })}
                </div>
              </MiniPanel>

              {activeCriticalCards.length > 0 && (
                <MiniPanel title="Uyarı rozetleri">
                  {activeCriticalCards.slice(0, 4).map((card) => <CardDisplay key={card.id} card={card} />)}
                </MiniPanel>
              )}

              {nextSuggestions.length > 0 && (
                <MiniPanel title="Eksik / yararlı marker önerileri">
                  {nextSuggestions.slice(0, 4).map((card) => <CardDisplay key={card.id} card={card} />)}
                </MiniPanel>
              )}

              <MiniPanel title="Kopyalanabilir metinler">
                <CopyTextBlock title="İHK sonucu" text={ihcCopyText || 'Henüz İHK sonucu girilmemiştir.'} label="Kopyala: İHK" />
                <CopyTextBlock title="Serum sonucu" text={serumCopyText} label="Kopyala: Serum" />
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <button onClick={() => setCopyMode('short')} style={toggleButtonStyle(copyMode === 'short')}>Kısa yorum</button>
                  <button onClick={() => setCopyMode('detailed')} style={toggleButtonStyle(copyMode === 'detailed')}>Detaylı yorum</button>
                </div>
                <CopyTextBlock title={copyMode === 'short' ? 'Kısa uyum / uyarı yorumu' : 'Detaylı uyum / uyarı yorumu'} text={selectedInterpretationText || 'Yeterli veri girilmemiştir.'} label="Kopyala: Yorum" />
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
                  <CopyButton text={fullCopyText} label="Hepsini kopyala" />
                </div>
              </MiniPanel>
            </aside>
          </div>
        </div>
      </div>

      <style>{`
        .testis-clinical-strip {
          display: grid;
          grid-template-columns: minmax(210px, 1.5fr) 110px repeat(3, minmax(170px, 1fr)) 125px minmax(220px, 1.2fr);
          gap: 8px;
          align-items: end;
        }
        .testis-ght-layout-pro {
          display: grid;
          grid-template-columns: 330px minmax(0, 1fr) 360px;
          gap: 14px;
          align-items: start;
        }
        .testis-left-rail {
          min-width: 0;
          align-self: start;
          position: relative;
          z-index: 5;
        }
        .testis-left-sticky {
          display: block;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(15,23,42,0.05);
          overflow: visible;
        }
        .rail-header, .right-column-header {
          padding: 12px 14px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.2px;
          z-index: 10;
        }
        .rail-header {
          position: sticky;
          top: calc(var(--site-header-height, 72px) + 8px);
          border-top-left-radius: 14px;
          border-top-right-radius: 14px;
        }
        .rail-scroll {
          overflow: visible;
          padding: 10px;
        }
        .testis-right-column {
          min-width: 0;
          align-self: stretch;
        }
        .right-column-header {
          position: sticky;
          top: 12px;
          margin-bottom: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        @media (max-width: 1320px) {
          .testis-clinical-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 1040px) {
          .testis-ght-layout-pro { grid-template-columns: 1fr; }
          .testis-left-rail { position: static; z-index: auto; }
          .testis-left-sticky { overflow: visible; }
          .rail-header { position: static; }
          .rail-scroll { overflow: visible; padding: 0; }
          .right-column-header { position: static; }
        }
        @media (max-width: 720px) {
          .testis-clinical-strip { grid-template-columns: 1fr; }
        }
      `}</style>
    </PageContainer>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: '9px' }}>
      <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}

function InfoList({ label, items, warning }: { label: string; items: string[]; warning?: boolean }) {
  return (
    <div style={{ marginBottom: '9px' }}>
      <div style={{ fontSize: '10px', fontWeight: 900, color: warning ? '#b45309' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'grid', gap: '4px' }}>
        {items.map((item, index) => (
          <div key={index} style={{ fontSize: '11px', color: '#334155', lineHeight: 1.45, padding: '5px 7px', borderRadius: '7px', backgroundColor: warning ? '#fffbeb' : '#f8fafc', border: warning ? '1px solid #fde68a' : '1px solid #edf2f7' }}>{item}</div>
        ))}
      </div>
    </div>
  );
}

function WarningText({ text }: { text: string }) {
  return (
    <div style={{ fontSize: '11px', color: '#854d0e', lineHeight: 1.5, padding: '8px 9px', borderRadius: '8px', backgroundColor: '#fef9c3', border: '1px solid #fde68a', marginTop: '6px' }}>
      ⚠️ {text}
    </div>
  );
}

function CopyTextBlock({ title, text, label }: { title: string; text: string; label: string }) {
  return (
    <div style={{ marginBottom: '11px' }}>
      <div style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>{title}</div>
      <div style={{ maxHeight: '110px', overflow: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', fontSize: '11px', color: '#334155', lineHeight: 1.55, marginBottom: '6px' }}>{text}</div>
      <CopyButton text={text} label={label} />
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '6px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 800,
};

function stripButtonStyle(active: boolean): React.CSSProperties {
  return {
    ...pillStyle,
    border: '1px solid',
    borderColor: active ? '#0d9488' : '#dbe3ef',
    backgroundColor: active ? '#ccfbf1' : '#ffffff',
    color: active ? '#0f766e' : '#475569',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}

function toggleButtonStyle(active: boolean): React.CSSProperties {
  return {
    border: '1px solid',
    borderColor: active ? '#0d9488' : '#e2e8f0',
    backgroundColor: active ? '#ccfbf1' : '#ffffff',
    color: active ? '#0f766e' : '#475569',
    borderRadius: '999px',
    padding: '6px 9px',
    fontSize: '11px',
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}

const summaryLineStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', gap: '8px',
  padding: '6px 8px', borderRadius: '8px', backgroundColor: '#f8fafc',
  border: '1px solid #edf2f7', fontSize: '11px', color: '#475569',
};
