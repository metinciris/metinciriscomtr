// ─────────────────────────────────────────────────────────────
// Testis GHT IHC Assistant – Rules & Engine
// ─────────────────────────────────────────────────────────────

import {
  type TumorType,
  type AntibodyOption,
  type SerumMarkers,
  type AgeRange,
  type MorphologyFlags,
  type CardOutput,
  type CompatibilityMatrix,
  MAIN_PANEL_ANTIBODIES,
  MIMIC_PANEL_ANTIBODIES,
  COMPATIBILITY_MATRIX,
  TUMOR_DEFINITIONS,
  NUCLEAR_MARKERS,
} from './testisGhtData';

// ─── Helper utilities ──────────────────────────────────────

/** Resolve an antibody definition from either panel by id. */
function findAntibody(antibodyId: string) {
  const all = [...MAIN_PANEL_ANTIBODIES, ...MIMIC_PANEL_ANTIBODIES];
  return all.find((ab) => ab.id === antibodyId) ?? null;
}

/** Return the selected AntibodyOption object for a given antibody, or null. */
export function getSelectedOption(
  observedResults: Record<string, string>,
  antibodyId: string,
): AntibodyOption | null {
  const key = observedResults[antibodyId];
  if (!key) return null;
  const ab = findAntibody(antibodyId);
  if (!ab) return null;
  return ab.options.find((o) => o.key === key) ?? null;
}

/** True when the user picked an option whose `isPositive` flag is true. */
export function isPositive(
  observedResults: Record<string, string>,
  antibodyId: string,
): boolean {
  const opt = getSelectedOption(observedResults, antibodyId);
  return opt?.isPositive === true;
}

/** True when the selected key is literally 'negative'. */
export function isNegative(
  observedResults: Record<string, string>,
  antibodyId: string,
): boolean {
  return observedResults[antibodyId] === 'negative';
}

/** True when antibody has not been evaluated at all. */
export function isNotDone(
  observedResults: Record<string, string>,
  antibodyId: string,
): boolean {
  return (
    observedResults[antibodyId] === 'not_done' ||
    observedResults[antibodyId] === undefined
  );
}

/** True when the selected option carries `isWrongPattern`. */
export function isWrongPattern(
  observedResults: Record<string, string>,
  antibodyId: string,
): boolean {
  const opt = getSelectedOption(observedResults, antibodyId);
  return opt?.isWrongPattern === true;
}

/** Shorthand: negative OR not done. */
function isNegativeOrNotDone(
  observedResults: Record<string, string>,
  antibodyId: string,
): boolean {
  return isNegative(observedResults, antibodyId) || isNotDone(observedResults, antibodyId);
}

/** All tumour type keys from TUMOR_DEFINITIONS. */
function allTumorTypes(): TumorType[] {
  return TUMOR_DEFINITIONS.map((t) => t.id);
}

// ─── 1. calculateTumorScores ───────────────────────────────

export function calculateTumorScores(
  observedResults: Record<string, string>,
  serumMarkers: SerumMarkers,
  ageRange: AgeRange,
  morphologyFlags: MorphologyFlags,
): Record<TumorType, number> {
  const tumorTypes = allTumorTypes();
  const allAntibodies = [...MAIN_PANEL_ANTIBODIES, ...MIMIC_PANEL_ANTIBODIES];

  // ---------- Raw IHC scoring ----------
  const rawScores: Record<string, number> = {};
  const theoreticalMax: Record<string, number> = {};

  for (const tumor of tumorTypes) {
    rawScores[tumor] = 0;
    theoreticalMax[tumor] = 0;
  }

  // Build theoretical max per tumour (sum of all weights in matrix)
  for (const ab of allAntibodies) {
    const matrixRow = (COMPATIBILITY_MATRIX as CompatibilityMatrix)[ab.id];
    if (!matrixRow) continue;
    for (const tumor of tumorTypes) {
      const weight = matrixRow[tumor] ?? 0;
      theoreticalMax[tumor] += weight;
    }
  }

  // Score each antibody × tumour
  for (const ab of allAntibodies) {
    const selectedKey = observedResults[ab.id];
    if (!selectedKey || selectedKey === 'not_done') continue;

    const option = ab.options.find((o) => o.key === selectedKey);
    if (!option) continue;

    const matrixRow = (COMPATIBILITY_MATRIX as CompatibilityMatrix)[ab.id];
    if (!matrixRow) continue;

    for (const tumor of tumorTypes) {
      const weight = matrixRow[tumor] ?? 0;
      const patternCoefficient = option.patternCoefficient ?? 1;

      if (option.isWrongPattern) {
        // Wrong pattern → 0 contribution
        // (flag captured elsewhere for warnings)
        continue;
      }

      if (
        (option as Record<string, unknown>).isSuspicious === true ||
        option.key === 'suspicious' ||
        option.key === 'smudge' ||
        option.key === 'nonspecific'
      ) {
        // Suspicious / smudge / nonspecific
        rawScores[tumor] += weight * 0.1;
        continue;
      }

      if (option.isPositive) {
        // ---- POSITIVE result ----
        if (weight >= 50) {
          rawScores[tumor] += weight * patternCoefficient;
        } else if (weight < 20) {
          // Unexpected positive – penalise
          rawScores[tumor] -= (100 - weight) * 0.3 * patternCoefficient;
        } else {
          // 20–49 range – small contribution
          rawScores[tumor] += weight * patternCoefficient * 0.5;
        }
      } else {
        // ---- NEGATIVE-like result (negative, weak, etc.) ----
        if (weight >= 50) {
          // Expected positive absent → penalty
          rawScores[tumor] -= weight * 0.4;
        } else if (weight < 20) {
          // Expected negative confirmed → small bonus
          rawScores[tumor] += (100 - weight) * 0.15;
        } else {
          // 20–49 → small penalty
          rawScores[tumor] -= weight * 0.15;
        }
      }
    }
  }

  // Floor raw scores at 0 before normalisation
  for (const tumor of tumorTypes) {
    if (rawScores[tumor] < 0) rawScores[tumor] = 0;
  }

  // ---------- Normalise to 0–100 ----------
  const normalised: Record<string, number> = {};
  for (const tumor of tumorTypes) {
    const maxVal = theoreticalMax[tumor];
    if (maxVal <= 0) {
      normalised[tumor] = 0;
    } else {
      normalised[tumor] = Math.min(100, Math.max(0, (rawScores[tumor] / maxVal) * 100));
    }
  }

  // ---------- Serum marker adjustments ----------
  // AFP
  if (
    serumMarkers.afp === 'significant_high' ||
    serumMarkers.afp === 'very_high'
  ) {
    normalised['yolk_sac'] = (normalised['yolk_sac'] ?? 0) + 15;
    normalised['seminoma'] = (normalised['seminoma'] ?? 0) - 10;
  } else if (serumMarkers.afp === 'mild_high') {
    normalised['yolk_sac'] = (normalised['yolk_sac'] ?? 0) + 8;
  } else if (serumMarkers.afp === 'normal') {
    normalised['seminoma'] = (normalised['seminoma'] ?? 0) + 3;
  }

  // beta-hCG
  if (
    serumMarkers.betaHcg === 'significant_high' ||
    serumMarkers.betaHcg === 'very_high'
  ) {
    normalised['choriocarcinoma'] = (normalised['choriocarcinoma'] ?? 0) + 15;
  } else if (serumMarkers.betaHcg === 'mild_high') {
    normalised['choriocarcinoma'] = (normalised['choriocarcinoma'] ?? 0) + 8;
  }

  // LDH
  if (serumMarkers.ldh === 'very_high') {
    for (const tumor of tumorTypes) {
      normalised[tumor] = (normalised[tumor] ?? 0) + 2;
    }
  }

  // Re-clamp after serum
  for (const tumor of tumorTypes) {
    normalised[tumor] = Math.min(100, Math.max(0, normalised[tumor] ?? 0));
  }

  // ---------- Age adjustments ----------
  if (ageRange === '0-5') {
    normalised['yolk_sac'] = (normalised['yolk_sac'] ?? 0) + 5;
    normalised['teratoma'] = (normalised['teratoma'] ?? 0) + 5;
    normalised['seminoma'] = (normalised['seminoma'] ?? 0) - 5;
    normalised['gcnis'] = (normalised['gcnis'] ?? 0) - 5;
  } else if (ageRange === '6-12') {
    normalised['yolk_sac'] = (normalised['yolk_sac'] ?? 0) + 3;
    normalised['teratoma'] = (normalised['teratoma'] ?? 0) + 3;
  } else if (ageRange === '>60') {
    normalised['spermatocytic'] = (normalised['spermatocytic'] ?? 0) + 8;
    normalised['seminoma'] = (normalised['seminoma'] ?? 0) - 3;
  } else if (ageRange === '46-60') {
    normalised['spermatocytic'] = (normalised['spermatocytic'] ?? 0) + 5;
  }

  // ---------- Morphology adjustments ----------
  if (morphologyFlags.gcnisPresent) {
    normalised['gcnis'] = (normalised['gcnis'] ?? 0) + 5;
    normalised['seminoma'] = (normalised['seminoma'] ?? 0) + 3;
    normalised['embryonal_carcinoma'] = (normalised['embryonal_carcinoma'] ?? 0) + 2;
  }
  if (morphologyFlags.gcnisAbsent) {
    normalised['spermatocytic'] = (normalised['spermatocytic'] ?? 0) + 5;
    normalised['gcnis'] = (normalised['gcnis'] ?? 0) - 10;
  }
  if (morphologyFlags.schillerDuvalPattern) {
    normalised['yolk_sac'] = (normalised['yolk_sac'] ?? 0) + 5;
  }
  if (morphologyFlags.hemorrhageNecrosisDominant) {
    normalised['choriocarcinoma'] = (normalised['choriocarcinoma'] ?? 0) + 5;
  }
  if (morphologyFlags.syncytiotrophoblasticGiantCells) {
    normalised['choriocarcinoma'] = (normalised['choriocarcinoma'] ?? 0) + 3;
  }
  if (morphologyFlags.biphasicTrophoblasticPattern) {
    normalised['choriocarcinoma'] = (normalised['choriocarcinoma'] ?? 0) + 5;
  }
  if (morphologyFlags.matureSomaticComponent) {
    normalised['teratoma'] = (normalised['teratoma'] ?? 0) + 8;
  }
  if (morphologyFlags.clearCytoplasmSheets) {
    normalised['seminoma'] = (normalised['seminoma'] ?? 0) + 3;
  }

  // ---------- Final clamp ----------
  const result = {} as Record<TumorType, number>;
  for (const tumor of tumorTypes) {
    result[tumor] = Math.min(100, Math.max(0, Math.round(normalised[tumor] ?? 0)));
  }
  return result;
}

// ─── 2. generateCombinationCards ───────────────────────────

export function generateCombinationCards(
  observedResults: Record<string, string>,
  serumMarkers: SerumMarkers,
  ageRange: AgeRange,
  morphologyFlags: MorphologyFlags,
  scores: Record<TumorType, number>,
): CardOutput[] {
  const cards: CardOutput[] = [];

  // --- Card 1: Seminoma profile ---
  if (
    isPositive(observedResults, 'SALL4') &&
    isPositive(observedResults, 'OCT4') &&
    isPositive(observedResults, 'CD117') &&
    (isPositive(observedResults, 'SOX17') || isPositive(observedResults, 'D2_40')) &&
    isNegative(observedResults, 'CD30') &&
    isNegative(observedResults, 'SOX2') &&
    isNegative(observedResults, 'GPC3') &&
    isNegative(observedResults, 'AFP')
  ) {
    cards.push({
      id: 'combo_seminoma_profile',
      title: 'Seminom immün profili ile güçlü uyum',
      text: 'SALL4, OCT3/4, CD117 ve SOX17/D2-40 pozitifliği; CD30, SOX2, GPC3 ve AFP negatifliği seminom komponenti ile uyumlu immün profili destekler.',
      type: 'strong_match',
      priority: 90,
    });
  }

  // --- Card 2: Embryonal carcinoma profile ---
  if (
    isPositive(observedResults, 'SALL4') &&
    isPositive(observedResults, 'OCT4') &&
    isPositive(observedResults, 'CD30') &&
    isPositive(observedResults, 'SOX2') &&
    isPositive(observedResults, 'PanCK') &&
    (isNegative(observedResults, 'CD117') || observedResults['CD117'] === 'weak') &&
    isNegative(observedResults, 'SOX17')
  ) {
    cards.push({
      id: 'combo_embryonal_profile',
      title: 'Embriyonel karsinom immün profili ile uyum',
      text: 'OCT3/4 ve CD30 birlikteliği, özellikle SOX2 ve PanCK pozitifliği ile birlikte embriyonel karsinom komponentini destekler.',
      type: 'strong_match',
      priority: 88,
    });
  }

  // --- Card 3: Seminoma vs embryonal carcinoma differentiation ---
  if (scores.seminoma >= 40 && scores.embryonal_carcinoma >= 40) {
    let diffText: string;
    if (
      (isPositive(observedResults, 'CD117') || isPositive(observedResults, 'SOX17')) &&
      isNegative(observedResults, 'CD30') &&
      isNegative(observedResults, 'SOX2')
    ) {
      diffText =
        'CD117/SOX17 pozitifliği ve CD30/SOX2 negatifliği seminom lehine destekleyicidir.';
    } else if (
      (isPositive(observedResults, 'CD30') || isPositive(observedResults, 'SOX2')) &&
      isNegative(observedResults, 'CD117') &&
      isNegative(observedResults, 'SOX17')
    ) {
      diffText =
        'CD30/SOX2 pozitifliği ve CD117/SOX17 negatifliği embriyonel karsinom lehine destekleyicidir.';
    } else {
      diffText =
        'Her iki komponent profili kısmen uyumludur; morfolojik korelasyon ve ek belirteçler (SOX17, SOX2, CD117, CD30) önerilir.';
    }

    cards.push({
      id: 'combo_sem_vs_ec',
      title: 'Seminom / Embriyonel karsinom ayrımı',
      text: diffText,
      type: 'pitfall',
      priority: 85,
    });
  }

  // --- Card 4: Yolk sac tumor profile ---
  const afpPositiveOrSerumHigh =
    isPositive(observedResults, 'AFP') ||
    serumMarkers.afp === 'significant_high' ||
    serumMarkers.afp === 'very_high' ||
    serumMarkers.afp === 'mild_high';

  if (
    isPositive(observedResults, 'SALL4') &&
    (isPositive(observedResults, 'GPC3') || afpPositiveOrSerumHigh) &&
    isPositive(observedResults, 'PanCK') &&
    isNegative(observedResults, 'OCT4') &&
    isNegative(observedResults, 'CD30')
  ) {
    cards.push({
      id: 'combo_yolk_sac_profile',
      title: 'Yolk sac tümör profili ile uyum',
      text: 'SALL4, GPC3 ve/veya AFP pozitifliği; OCT3/4 ve CD30 negatifliği yolk sac tümör komponentini destekler. AFP negatifliği tek başına yolk sac tümörü dışlamaz.',
      type: 'strong_match',
      priority: 86,
    });
  }

  // --- Card 5: GPC3+ AFP- pattern ---
  if (
    isPositive(observedResults, 'GPC3') &&
    isPositive(observedResults, 'SALL4') &&
    isNegative(observedResults, 'AFP') &&
    isNegative(observedResults, 'OCT4')
  ) {
    cards.push({
      id: 'combo_gpc3_afp_neg',
      title: 'GPC3 pozitif / AFP negatif profil',
      text: 'GPC3 pozitifliği ve SALL4 pozitifliği yolk sac tümör komponentini destekleyebilir. AFP negatifliği tek başına yolk sac tümörü dışlamaz; morfoloji ile korelasyon gerekir.',
      type: 'supportive',
      priority: 70,
    });
  }

  // --- Card 6: Choriocarcinoma profile ---
  if (
    observedResults['betaHCG'] === 'widespread_trophoblastic' &&
    (isPositive(observedResults, 'GATA3') ||
      isPositive(observedResults, 'p63') ||
      isPositive(observedResults, 'Inhibin')) &&
    isPositive(observedResults, 'PanCK') &&
    (morphologyFlags.hemorrhageNecrosisDominant ||
      morphologyFlags.biphasicTrophoblasticPattern)
  ) {
    cards.push({
      id: 'combo_choriocarcinoma',
      title: 'Koryokarsinom / trofoblastik komponent profili',
      text: 'Yaygın beta-hCG pozitifliği, GATA3/p63/inhibin desteği ve uygun morfolojik patern varsa koryokarsinom/trofoblastik komponent düşünülebilir.',
      type: 'strong_match',
      priority: 84,
    });
  }

  // --- Card 7: beta-hCG seminoma pitfall ---
  if (
    scores.seminoma >= 60 &&
    observedResults['betaHCG'] === 'syncytial_only' &&
    isNegative(observedResults, 'AFP') &&
    isNegative(observedResults, 'GPC3')
  ) {
    cards.push({
      id: 'combo_bhcg_seminoma_pitfall',
      title: 'beta-hCG seminom pitfall uyarısı',
      text: 'Dikkat: beta-hCG pozitifliği seminomda sinsityotrofoblastik dev hücrelerde görülebilir. Pozitiflik yalnızca bu hücrelerde ise tek başına koryokarsinom lehine yorumlanmamalıdır.',
      type: 'pitfall',
      priority: 80,
    });
  }

  // --- Card 8: AFP elevation + seminoma conflict ---
  if (
    scores.seminoma >= 60 &&
    (serumMarkers.afp === 'significant_high' || serumMarkers.afp === 'very_high')
  ) {
    cards.push({
      id: 'combo_afp_seminoma_conflict',
      title: 'AFP yüksekliği – Seminom profili çelişkisi',
      text: 'Çelişki: AFP yüksekliği saf seminom ile uyumlu değildir. Nonseminomatöz komponent, özellikle yolk sac komponenti, örnekleme sorunu veya klinik/laboratuvar korelasyonu açısından yeniden değerlendirme önerilir.',
      type: 'conflict',
      priority: 92,
    });
  }

  // --- Card 9: Spermatocytic tumor ---
  if (
    isNegative(observedResults, 'OCT4') &&
    isNegative(observedResults, 'CD30') &&
    isNegative(observedResults, 'GPC3') &&
    isNegative(observedResults, 'AFP') &&
    (ageRange === '46-60' || ageRange === '>60') &&
    (morphologyFlags.gcnisAbsent || morphologyFlags.gcnisNotEvaluable)
  ) {
    cards.push({
      id: 'combo_spermatocytic',
      title: 'Spermatositik tümör profili',
      text: 'OCT3/4, CD30, GPC3 ve AFP negatifliği; CD117/SALL4 değişken pozitifliği ve GCNIS yokluğu ile birlikte spermatositik tümör profili düşünülebilir.',
      type: 'supportive',
      priority: 65,
    });
  }

  // --- Card 10: SOX2 + SOX17 both positive ---
  if (
    isPositive(observedResults, 'SOX17') &&
    isPositive(observedResults, 'SOX2') &&
    isPositive(observedResults, 'OCT4')
  ) {
    cards.push({
      id: 'combo_sox2_sox17_dual',
      title: 'SOX17 + SOX2 birlikte pozitiflik',
      text: 'SOX17 ve SOX2 birlikteliği farklı komponentlerin boyanması, tümör alanı karışıklığı veya nonspesifik boyanma nedeniyle olabilir. Boyanan alanlar morfoloji ile ayrı ayrı kontrol edilmelidir.',
      type: 'pitfall',
      priority: 75,
    });
  }

  // --- Nuclear marker wrong pattern cards ---
  for (const markerId of NUCLEAR_MARKERS) {
    if (isWrongPattern(observedResults, markerId)) {
      const ab = findAntibody(markerId);
      const markerName = ab?.infoCard?.copyName || ab?.name || markerId;
      cards.push({
        id: `wrong_pattern_${markerId}`,
        title: `${markerName} – Yanlış boyanma paterni`,
        text: 'Bu belirteç için uygun nükleer boyanma pozitif kabul edilmelidir. Sitoplazmik/zemin boyanma tanısal pozitiflik olarak skorlanmamalıdır.',
        type: 'pitfall',
        priority: 60,
      });
    }
  }

  // Sort by priority descending
  cards.sort((a, b) => b.priority - a.priority);
  return cards;
}

// ─── 3. generateMimicWarnings ──────────────────────────────

export function generateMimicWarnings(
  observedResults: Record<string, string>,
  serumMarkers: SerumMarkers,
  ageRange: AgeRange,
  morphologyFlags: MorphologyFlags,
  scores: Record<TumorType, number>,
): CardOutput[] {
  const cards: CardOutput[] = [];

  const germMarkersNegative =
    isNegativeOrNotDone(observedResults, 'SALL4') &&
    isNegativeOrNotDone(observedResults, 'OCT4') &&
    isNegativeOrNotDone(observedResults, 'CD30') &&
    isNegativeOrNotDone(observedResults, 'GPC3') &&
    isNegativeOrNotDone(observedResults, 'AFP');

  const coreGermNegative =
    isNegative(observedResults, 'SALL4') &&
    isNegative(observedResults, 'OCT4') &&
    isNegative(observedResults, 'CD117');

  // --- 1. Lymphoma warning ---
  const olderAge = ageRange === '46-60' || ageRange === '>60';
  const gcnisNotPresent =
    morphologyFlags.gcnisAbsent || morphologyFlags.gcnisNotEvaluable;
  const lymphoidPositive =
    isPositive(observedResults, 'CD45_LCA') ||
    isPositive(observedResults, 'CD20') ||
    isPositive(observedResults, 'PAX5');

  if (olderAge && gcnisNotPresent && coreGermNegative && lymphoidPositive) {
    cards.push({
      id: 'mimic_lymphoma',
      title: 'Lenfoma uyarısı',
      text: 'İleri yaş, GCNIS yokluğu ve germ hücre belirteçlerinin negatifliği ile birlikte CD45/CD20/PAX5 pozitifliği testiküler lenfoma lehine değerlendirilmelidir. Seminom benzeri solid görünümde lenfoma dışlanmadan seminom lehine yorum yapılmamalıdır.',
      type: 'non_gct_warning',
      priority: 95,
      suggestions: [
        'CD45, CD20, PAX5, CD3, CD79a, Ki-67, BCL6, MUM1, CD10, BCL2 ve MYC klinik bağlama göre düşünülebilir.',
      ],
    });
  }

  // Lymphoma exclusion suggestion for >60 when CD45 not done
  if (ageRange === '>60' && isNotDone(observedResults, 'CD45_LCA')) {
    cards.push({
      id: 'mimic_lymphoma_suggest',
      title: 'Lenfoma dışlama önerisi',
      text: 'İleri yaşta seminom benzeri tümörde lenfoma dışlanmamış olabilir. CD45/CD20/PAX5 paneli düşünülebilir.',
      type: 'suggested_panel',
      priority: 88,
    });
  }

  // --- 2. Sex-cord stromal tumor warning ---
  if (
    germMarkersNegative &&
    isPositive(observedResults, 'SF1') &&
    (isPositive(observedResults, 'Inhibin') ||
      isPositive(observedResults, 'Calretinin'))
  ) {
    cards.push({
      id: 'mimic_sex_cord',
      title: 'Sex-cord stromal tümör uyarısı',
      text: 'Germ hücre belirteçleri negatifken SF1 nükleer pozitifliği ve inhibin/calretinin desteği varsa Leydig/Sertoli hücreli tümörler veya sex-cord stromal tümörler yönünden değerlendirme önerilir.',
      type: 'non_gct_warning',
      priority: 90,
    });
  }

  // --- 3. Metastatic carcinoma warning ---
  const panckDiffuse =
    observedResults['PanCK'] === 'diffuse_positive' ||
    isPositive(observedResults, 'PanCK');
  if (
    panckDiffuse &&
    isPositive(observedResults, 'EMA') &&
    isNegative(observedResults, 'SALL4') &&
    isNegative(observedResults, 'OCT4') &&
    isNegative(observedResults, 'CD30') &&
    isNegative(observedResults, 'GPC3') &&
    isNegative(observedResults, 'AFP') &&
    (morphologyFlags.advancedAgeAtypicalClinical ||
      morphologyFlags.extraTesticularPrimaryHistory)
  ) {
    cards.push({
      id: 'mimic_metastatic_carcinoma',
      title: 'Metastatik karsinom / somatik tip malignite uyarısı',
      text: 'Diffüz PanCK/EMA pozitifliği ve germ hücre belirteçlerinin negatifliği, germ hücreli tümör dışı epitelyal malignite veya teratom zemininde somatik tip malignite açısından korele edilmelidir.',
      type: 'non_gct_warning',
      priority: 88,
      suggestions: [
        'Prostat: NKX3.1, PSA, PSAP',
        'Renal: PAX8, CAIX, CD10, RCC marker',
        'Ürotelyal: GATA3, p63/p40, uroplakin',
        'Akciğer adenokarsinomu: TTF-1, Napsin A',
        'Kolorektal: CDX2, SATB2, CK20',
        'Genel: CK7/CK20 paterni',
      ],
    });
  }

  // --- 4. Melanoma warning ---
  if (
    (isPositive(observedResults, 'SOX10') ||
      isPositive(observedResults, 'S100')) &&
    (isPositive(observedResults, 'HMB45') ||
      isPositive(observedResults, 'MelanA')) &&
    germMarkersNegative
  ) {
    cards.push({
      id: 'mimic_melanoma',
      title: 'Melanom uyarısı',
      text: 'Germ hücre ve epitelyal belirteçler negatifken SOX10/S100/HMB45/Melan-A pozitifliği melanom/metastatik melanom açısından değerlendirilmelidir.',
      type: 'non_gct_warning',
      priority: 87,
    });
  }

  // --- 5. Paratesticular sarcoma / mesenchymal ---
  const mesenchymalPositive =
    isPositive(observedResults, 'Desmin') ||
    isPositive(observedResults, 'Myogenin') ||
    isPositive(observedResults, 'MyoD1') ||
    isPositive(observedResults, 'SMA') ||
    isPositive(observedResults, 'hCaldesmon') ||
    isPositive(observedResults, 'MDM2') ||
    isPositive(observedResults, 'CDK4') ||
    isPositive(observedResults, 'ERG') ||
    isPositive(observedResults, 'CD31');

  if (
    morphologyFlags.paratesticular &&
    germMarkersNegative &&
    mesenchymalPositive
  ) {
    cards.push({
      id: 'mimic_paratesticular_sarcoma',
      title: 'Paratestiküler sarkom / mezenkimal tümör uyarısı',
      text: 'Germ hücre belirteçleri negatif ve mezenkimal markerlar pozitifse paratestiküler sarkom veya mezenkimal tümörler açısından lokalizasyon ve morfoloji ile korelasyon gerekir.',
      type: 'non_gct_warning',
      priority: 85,
    });
  }

  // Sort by priority descending
  cards.sort((a, b) => b.priority - a.priority);
  return cards;
}

// ─── 4. generateNextMarkerSuggestions ──────────────────────

export function generateNextMarkerSuggestions(
  observedResults: Record<string, string>,
  scores: Record<TumorType, number>,
  ageRange: AgeRange,
  morphologyFlags: MorphologyFlags,
): CardOutput[] {
  const cards: CardOutput[] = [];

  const germMarkersNegative =
    isNegativeOrNotDone(observedResults, 'SALL4') &&
    isNegativeOrNotDone(observedResults, 'OCT4') &&
    isNegativeOrNotDone(observedResults, 'CD30') &&
    isNegativeOrNotDone(observedResults, 'GPC3') &&
    isNegativeOrNotDone(observedResults, 'AFP');

  // Seminoma vs EC ambiguity
  if (
    scores.seminoma >= 30 &&
    scores.embryonal_carcinoma >= 30 &&
    Math.abs(scores.seminoma - scores.embryonal_carcinoma) <= 20
  ) {
    cards.push({
      id: 'suggest_sem_ec_diff',
      title: 'Seminom / Embriyonel karsinom ayrımı için önerilen panel',
      text: 'SOX17, SOX2, CD30 ve CD117 belirteçleri bu ayrımda yardımcı olabilir.',
      type: 'suggested_panel',
      priority: 80,
      suggestions: ['SOX17', 'SOX2', 'CD30', 'CD117'],
    });
  }

  // Yolk sac + AFP ambiguity
  if (
    scores.yolk_sac >= 30 &&
    (isNegative(observedResults, 'AFP') || isNotDone(observedResults, 'AFP'))
  ) {
    cards.push({
      id: 'suggest_yolk_sac',
      title: 'Yolk sac tümör değerlendirmesi için önerilen panel',
      text: 'GPC3, SALL4, PanCK ve serum AFP korelasyonu değerlendirilebilir.',
      type: 'suggested_panel',
      priority: 75,
      suggestions: ['GPC3', 'SALL4', 'PanCK', 'Serum AFP korelasyonu'],
    });
  }

  // Choriocarcinoma
  if (scores.choriocarcinoma >= 30) {
    cards.push({
      id: 'suggest_chorio',
      title: 'Koryokarsinom değerlendirmesi için önerilen panel',
      text: 'Beta-hCG patern detayı, GATA3, p63 ve inhibin değerlendirilebilir.',
      type: 'suggested_panel',
      priority: 72,
      suggestions: ['Beta-hCG patern detayı', 'GATA3', 'p63', 'Inhibin'],
    });
  }

  // Older age + low GCT scores → lymphoma exclusion
  const maxGctScore = Math.max(
    scores.seminoma ?? 0,
    scores.embryonal_carcinoma ?? 0,
    scores.yolk_sac ?? 0,
    scores.choriocarcinoma ?? 0,
    scores.teratoma ?? 0,
    scores.spermatocytic ?? 0,
  );
  if (ageRange === '>60' && maxGctScore < 60) {
    cards.push({
      id: 'suggest_lymphoma_panel',
      title: 'Lenfoma dışlama paneli önerisi',
      text: 'İleri yaşta GCT skorları düşükse CD45, CD20, PAX5 ve CD3 paneli değerlendirilebilir.',
      type: 'suggested_panel',
      priority: 85,
      suggestions: ['CD45', 'CD20', 'PAX5', 'CD3'],
    });
  }

  // Germ markers negative + PanCK/EMA positive → origin search
  if (
    germMarkersNegative &&
    (isPositive(observedResults, 'PanCK') || isPositive(observedResults, 'EMA'))
  ) {
    cards.push({
      id: 'suggest_origin_panel',
      title: 'Primer odak araştırması için önerilen panel',
      text: 'Germ hücre belirteçleri negatif ve epitelyal belirteçler pozitifse organ-spesifik belirteçler düşünülebilir.',
      type: 'suggested_panel',
      priority: 78,
      suggestions: [
        'PAX8',
        'NKX3.1',
        'TTF-1',
        'Napsin A',
        'CDX2',
        'SATB2',
        'GATA3',
        'CK7/CK20',
      ],
    });
  }

  // SF1 positive → sex-cord workup
  if (isPositive(observedResults, 'SF1')) {
    cards.push({
      id: 'suggest_sex_cord',
      title: 'Sex-cord stromal tümör paneli önerisi',
      text: 'SF1 pozitifliği varsa inhibin, calretinin ve Melan-A değerlendirilebilir.',
      type: 'suggested_panel',
      priority: 70,
      suggestions: ['Inhibin', 'Calretinin', 'Melan-A'],
    });
  }

  // SOX10/S100 positive → melanoma workup
  if (
    isPositive(observedResults, 'SOX10') ||
    isPositive(observedResults, 'S100')
  ) {
    cards.push({
      id: 'suggest_melanoma',
      title: 'Melanom paneli önerisi',
      text: 'SOX10/S100 pozitifliği varsa HMB45 ve Melan-A değerlendirilebilir.',
      type: 'suggested_panel',
      priority: 68,
      suggestions: ['HMB45', 'Melan-A'],
    });
  }

  // Paratesticular + germ negative → mesenchymal workup
  if (morphologyFlags.paratesticular && germMarkersNegative) {
    cards.push({
      id: 'suggest_mesenchymal',
      title: 'Paratestiküler mezenkimal panel önerisi',
      text: 'Paratestiküler lokalizasyon ve germ hücre belirteçleri negatifse mezenkimal belirteçler düşünülebilir.',
      type: 'suggested_panel',
      priority: 65,
      suggestions: [
        'Desmin',
        'Myogenin',
        'MyoD1',
        'SMA',
        'h-caldesmon',
        'MDM2',
        'CDK4',
        'ERG',
        'CD31',
      ],
    });
  }

  // Sort by priority descending
  cards.sort((a, b) => b.priority - a.priority);
  return cards;
}

// ─── 5. Copy text builders ─────────────────────────────────

/** Helper to extract pattern name for Turkish reports from option key. */
function getOptionPattern(key: string): string {
  switch (key) {
    case 'focal_weak_nuclear': return 'fokal/zayıf nükleer';
    case 'patchy_nuclear': return 'yamalı nükleer';
    case 'diffuse_strong_nuclear': return 'diffüz güçlü nükleer';
    case 'focal_weak_membranous': return 'fokal/zayıf membranöz';
    case 'diffuse_membranous': return 'diffüz membranöz';
    case 'cytoplasmic_suspicious': return 'sitoplazmik şüpheli';
    case 'sparse_cell': return 'seyrek hücre';
    case 'focal_positive': return 'fokal';
    case 'diffuse_membranous_golgi': return 'diffüz membranöz/Golgi';
    case 'patchy_positive': return 'yamalı';
    case 'diffuse_positive': return 'diffüz';
    case 'focal_membranous': return 'fokal membranöz';
    case 'focal_nuclear': return 'fokal nükleer';
    case 'diffuse_nuclear': return 'diffüz nükleer';
    case 'syncytiotrophoblastic_only': return 'sadece sinsityotrofoblastik hücrelerde';
    case 'widespread_tumor': return 'yaygın';
    case 'diffuse_strong': return 'diffüz güçlü';
    case 'syncytial_only': return 'sadece sinsityotrofoblastik dev hücrelerde';
    case 'widespread_trophoblastic': return 'yaygın trofoblastik komponentte';
    default: return '';
  }
}

/** Build a Turkish-language IHC summary suitable for pathology reports. */
export function buildIhcCopyText(
  observedResults: Record<string, string>,
  allAntibodies: typeof MAIN_PANEL_ANTIBODIES,
): string {
  const positiveItems: string[] = [];
  const negativeItems: string[] = [];
  const suspiciousNotes: string[] = [];
  const wrongPatternNotes: string[] = [];

  for (const ab of allAntibodies) {
    const selectedKey = observedResults[ab.id];
    if (!selectedKey || selectedKey === 'not_done') continue;

    const option = ab.options.find((o) => o.key === selectedKey);
    if (!option) continue;

    const abName = ab.infoCard?.copyName || ab.name;

    if (option.isWrongPattern) {
      wrongPatternNotes.push(
        `${abName} için sitoplazmik/yanlış patern tarzı boyanma izlenmiş olup tanısal nükleer pozitiflik olarak değerlendirilmemelidir.`,
      );
      continue;
    }

    if (option.isPositive) {
      const pattern = getOptionPattern(selectedKey);
      const patternNote = pattern ? ` (${pattern})` : '';
      positiveItems.push(`${abName}${patternNote} pozitif`);
    } else if (selectedKey === 'negative') {
      negativeItems.push(`${abName} negatif`);
    } else {
      // suspicious / smudge / non-specific etc.
      const note = option.label ?? selectedKey;
      suspiciousNotes.push(`${abName}: ${note}`);
    }
  }

  const parts: string[] = [];

  if (positiveItems.length > 0 || negativeItems.length > 0) {
    let mainSentence = 'İmmünohistokimyasal incelemede ';
    const segments: string[] = [];
    if (positiveItems.length > 0) {
      segments.push(positiveItems.join(', '));
    }
    if (negativeItems.length > 0) {
      segments.push(negativeItems.join(', '));
    }
    mainSentence += segments.join('; ') + '.';
    parts.push(mainSentence);
  }

  if (suspiciousNotes.length > 0) {
    parts.push(
      `Şüpheli/nonspesifik boyanma: ${suspiciousNotes.join('; ')}.`,
    );
  }

  for (const note of wrongPatternNotes) {
    parts.push(note);
  }

  return parts.join(' ');
}

/** Map serum status to Turkish text. */
const SERUM_STATUS_TR: Record<string, string> = {
  normal: 'normal',
  mild_high: 'hafif yüksek',
  significant_high: 'anlamlı yüksek',
  very_high: 'çok yüksek',
  unknown: 'bilgi girilmemiş',
};

function serumStatusToTr(status: string | undefined): string {
  if (!status) return 'bilgi girilmemiş';
  return SERUM_STATUS_TR[status] ?? 'bilgi girilmemiş';
}

/** Build Turkish-language serum marker summary. */
export function buildSerumCopyText(serumMarkers: SerumMarkers): string {
  const allUnknown =
    (serumMarkers.afp === 'unknown' || !serumMarkers.afp) &&
    (serumMarkers.betaHcg === 'unknown' || !serumMarkers.betaHcg) &&
    (serumMarkers.ldh === 'unknown' || !serumMarkers.ldh);

  if (allUnknown) {
    return 'Serum marker bilgisi girilmemiştir.';
  }

  return `Serum belirteçlerinde AFP ${serumStatusToTr(serumMarkers.afp)}, beta-hCG ${serumStatusToTr(serumMarkers.betaHcg)}, LDH ${serumStatusToTr(serumMarkers.ldh)} olarak değerlendirilmiştir.`;
}

/** Build interpretation copy text from scored cards. */
export function buildInterpretationCopyText(
  cards: CardOutput[],
  scores: Record<TumorType, number>,
): string {
  const parts: string[] = [];

  // Top scoring tumours (up to 3)
  const sortedTumors = (Object.entries(scores) as [TumorType, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  for (const [tumor, score] of sortedTumors) {
    const def = TUMOR_DEFINITIONS.find((t) => t.id === tumor);
    const label = def?.name ?? tumor;
    let uyumLevel: string;
    if (score >= 75) {
      uyumLevel = 'güçlü uyum';
    } else if (score >= 50) {
      uyumLevel = 'orta düzey uyum';
    } else if (score >= 30) {
      uyumLevel = 'zayıf uyum';
    } else {
      uyumLevel = 'düşük uyum';
    }
    parts.push(`İmmün profil ${label} komponenti ile ${uyumLevel} göstermektedir.`);
  }

  // Critical warnings (conflict, pitfall, non_gct_warning)
  const criticalCards = cards.filter(
    (c) =>
      c.type === 'conflict' ||
      c.type === 'pitfall' ||
      c.type === 'non_gct_warning',
  );
  for (const card of criticalCards.slice(0, 3)) {
    parts.push(card.text);
  }

  return parts.join(' ');
}
