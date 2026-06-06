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

export interface ScoreBreakdown {
  ihc: number;
  clinical: number;
  clinicalActive: boolean;
  overall: number;
}

function applySpermatocyticPostProcessing(
  ihcVal: number,
  clinVal: number,
  overallVal: number,
  observedResults: Record<string, string>,
  serumMarkers: SerumMarkers,
  ageRange: AgeRange,
  morphologyFlags: MorphologyFlags,
  ihcScores: Record<string, number>,
): { ihc: number; clinical: number; overall: number } {
  let ihc = ihcVal;
  let clinical = clinVal;
  let overall = overallVal;

  const sall4Pos = isPositive(observedResults, 'SALL4');
  const sall4DiffuseStrong = observedResults['SALL4'] === 'diffuse_strong_nuclear';
  const cd117Pos = isPositive(observedResults, 'CD117');
  
  const oct4Positive = isPositive(observedResults, 'OCT4');
  const cd30Positive = isPositive(observedResults, 'CD30');
  const sox2Positive = isPositive(observedResults, 'SOX2');
  const gpc3Positive = isPositive(observedResults, 'GPC3');
  const afpPositive = isPositive(observedResults, 'AFP');
  const betaHcgDiffuse = observedResults['betaHCG'] === 'widespread_trophoblastic';
  const panCkDiffuse = observedResults['PanCK'] === 'diffuse_positive' || isPositive(observedResults, 'PanCK');

  const youngAge = ageRange === '0-5' || ageRange === '6-12' || ageRange === '13-19';
  const adultButNotOlder = ageRange === '20-45';
  const gcnisPresent = morphologyFlags.gcnisPresent === true;
  const gcnisAbsent = morphologyFlags.gcnisAbsent === true;

  // 1. Negative-only scoring issue (Point 3)
  // If neither SALL4 nor CD117 are positive, IHC score should be capped at 40% (negative marker uyumu max 40%)
  if (!sall4Pos && !cd117Pos) {
    ihc = Math.min(ihc, 40);
  }

  // If SALL4 is diffuse strong, it shouldn't support spermatocytic strongly (especially if CD117 is negative)
  if (sall4DiffuseStrong) {
    if (!cd117Pos) {
      ihc = Math.min(ihc, 30); // Cap heavily if SALL4 is diffuse strong but CD117 is negative
    } else {
      ihc = Math.min(ihc, 60); // Even if CD117 is positive, cap it since diffuse strong SALL4 is atypical for spermatocytic
    }
  }

  // Recalculate overall score with the capped/modified IHC and Clinical values
  // (using the same blending logic as calculateTumorScores)
  const clinicalActive = ageRange !== 'unknown' || 
    (serumMarkers.afp?.status !== 'unknown' && serumMarkers.afp?.status !== undefined) ||
    (serumMarkers.betaHcg?.status !== 'unknown' && serumMarkers.betaHcg?.status !== undefined) ||
    (serumMarkers.ldh?.status !== 'unknown' && serumMarkers.ldh?.status !== undefined) ||
    Object.values(morphologyFlags).some((val) => val === true);

  if (clinicalActive) {
    const hasResults = Object.keys(observedResults).some(
      (k) => observedResults[k] && observedResults[k] !== 'not_done'
    );
    if (!hasResults) {
      overall = clinical;
    } else {
      if (clinical < 50) {
        overall = Math.round(ihc * (clinical / 50));
      } else {
        overall = Math.round(ihc + (100 - ihc) * ((clinical - 50) / 50));
      }
    }
  } else {
    overall = ihc;
  }

  // 2. Score caps (Point 6)
  if (oct4Positive) overall = Math.min(overall, 25);
  if (cd30Positive && sox2Positive) overall = Math.min(overall, 25);
  if (gpc3Positive || afpPositive) overall = Math.min(overall, 40);
  if (betaHcgDiffuse) overall = Math.min(overall, 35);
  if (panCkDiffuse) overall = Math.min(overall, 45);
  if (gcnisPresent) overall = Math.min(overall, 35);
  if (youngAge) overall = Math.min(overall, 40);
  if (adultButNotOlder && !gcnisAbsent) overall = Math.min(overall, 60);
  if (ageRange === 'unknown' && !gcnisAbsent) overall = Math.min(overall, 65);

  // 3. Classic profiles dominance penalties (Point 5)
  // Seminom profile: SALL4+, OCT3/4+, CD117+, SOX17+ veya D2-40+
  const sox17Pos = isPositive(observedResults, 'SOX17');
  const d240Pos = isPositive(observedResults, 'D2_40');
  const isSeminomaProfile = sall4Pos && oct4Positive && (cd117Pos || sox17Pos || d240Pos);
  if (isSeminomaProfile) {
    overall = Math.min(overall, 25);
  }

  // Embriyonel karsinom profile: OCT3/4+, CD30+, SOX2+, PanCK+
  const panckPos = isPositive(observedResults, 'PanCK');
  const isEmbryonalProfile = oct4Positive && cd30Positive && sox2Positive && panckPos;
  if (isEmbryonalProfile) {
    overall = Math.min(overall, 20);
  }

  // Yolk sac profile: SALL4+, GPC3+, AFP+ veya serum AFP yüksek, OCT3/4-
  const afpHigh = serumMarkers.afp.status === 'significant_high' || serumMarkers.afp.status === 'very_high';
  const isYolkSacProfile = sall4Pos && (gpc3Positive || afpPositive || afpHigh) && !oct4Positive;
  if (isYolkSacProfile) {
    overall = Math.min(overall, 35);
  }

  // Koryokarsinom/trofoblastik profile: Yaygın beta-hCG+, GATA3+, p63/inhibin+, hemoraji-nekroz/bifazik patern
  const gata3Pos = isPositive(observedResults, 'GATA3');
  const p63Pos = isPositive(observedResults, 'p63');
  const inhibinPos = isPositive(observedResults, 'Inhibin');
  const isChorioProfile = betaHcgDiffuse && (gata3Pos || p63Pos || inhibinPos) &&
    (morphologyFlags.hemorrhageNecrosisDominant || morphologyFlags.biphasicTrophoblasticPattern);
  if (isChorioProfile) {
    overall = Math.min(overall, 20);
  }

  // 4. Minimum context requirement (Point 7)
  let metConditionsCount = 0;
  if (ageRange === '46-60' || ageRange === '>60') metConditionsCount++;
  if (morphologyFlags.gcnisAbsent === true) metConditionsCount++;
  if (observedResults['OCT4'] === 'negative') metConditionsCount++;
  if (observedResults['CD30'] === 'negative') metConditionsCount++;
  if (observedResults['GPC3'] === 'negative' && observedResults['AFP'] === 'negative') metConditionsCount++;
  if (cd117Pos || (sall4Pos && !sall4DiffuseStrong)) metConditionsCount++;
  
  // Classic profiles not strong
  const otherClassicStrong = (
    (ihcScores['seminoma'] ?? 0) >= 70 ||
    (ihcScores['embryonal_carcinoma'] ?? 0) >= 70 ||
    (ihcScores['yolk_sac'] ?? 0) >= 70 ||
    (ihcScores['choriocarcinoma'] ?? 0) >= 70
  );
  if (!otherClassicStrong) metConditionsCount++;

  if (metConditionsCount < 2) {
    overall = Math.min(overall, 59);
  }

  return { ihc, clinical, overall };
}

export function calculateTumorScores(
  observedResults: Record<string, string>,
  serumMarkers: SerumMarkers,
  ageRange: AgeRange,
  morphologyFlags: MorphologyFlags,
): Record<TumorType, ScoreBreakdown> {
  const tumorTypes = allTumorTypes();
  const allAntibodies = [...MAIN_PANEL_ANTIBODIES, ...MIMIC_PANEL_ANTIBODIES];

  // Check if clinical context is active
  const hasAge = ageRange !== 'unknown';
  const hasSerum =
    (serumMarkers.afp?.status !== 'unknown' && serumMarkers.afp?.status !== undefined) ||
    (serumMarkers.betaHcg?.status !== 'unknown' && serumMarkers.betaHcg?.status !== undefined) ||
    (serumMarkers.ldh?.status !== 'unknown' && serumMarkers.ldh?.status !== undefined);
  const hasMorphology = Object.values(morphologyFlags).some((val) => val === true);
  const clinicalActive = hasAge || hasSerum || hasMorphology;

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
        continue;
      }

      if (
        ((option as unknown) as Record<string, unknown>).isSuspicious === true ||
        option.key === 'suspicious' ||
        option.key === 'smudge' ||
        option.key === 'nonspecific'
      ) {
        rawScores[tumor] += weight * 0.1;
        continue;
      }

      if (option.isPositive) {
        if (weight >= 50) {
          rawScores[tumor] += weight * patternCoefficient;
        } else if (weight < 20) {
          rawScores[tumor] -= (100 - weight) * 0.3 * patternCoefficient;
        } else {
          rawScores[tumor] += weight * patternCoefficient * 0.5;
        }
      } else {
        if (weight >= 50) {
          rawScores[tumor] -= weight * 0.4;
        } else if (weight < 20) {
          rawScores[tumor] += (100 - weight) * 0.15;
        } else {
          rawScores[tumor] -= weight * 0.15;
        }
      }
    }
  }

  // Floor raw scores at 0 before normalisation
  for (const tumor of tumorTypes) {
    if (rawScores[tumor] < 0) rawScores[tumor] = 0;
  }

  // ---------- Base IHC score ----------
  const ihcScores: Record<string, number> = {};
  for (const tumor of tumorTypes) {
    const maxVal = theoreticalMax[tumor];
    if (maxVal <= 0) {
      ihcScores[tumor] = 0;
    } else {
      ihcScores[tumor] = Math.min(100, Math.max(0, Math.round((rawScores[tumor] / maxVal) * 100)));
    }
  }

  // ---------- Clinical & Serum score ----------
  const clinicalScores: Record<string, number> = {};

  if (clinicalActive) {
    const afpStatus = serumMarkers.afp?.status;
    const hcgStatus = serumMarkers.betaHcg?.status;
    const ldhStatus = serumMarkers.ldh?.status;

    for (const tumor of tumorTypes) {
      let score = 50; // Baseline neutral score

      // GCNIS present/absent checks (highly diagnostic)
      if (tumor === 'gcnis') {
        if (morphologyFlags.gcnisPresent) score += 50;
        if (morphologyFlags.gcnisAbsent) score -= 80;
        if (ageRange === '0-5') score -= 20;
      }

      // Schiller-Duval / mikrokistik-retiküler patern yolk sac tümör komponenti lehine güçlü morfolojik destek sağlar; İHK, serum markerları ve klinik bilgi ile korelasyon önerilir.
      if (tumor === 'yolk_sac' && morphologyFlags.schillerDuvalPattern) {
        score = 100; // Güçlü morfolojik destek
      } else {
        // Other clinical adjustments
        if (tumor === 'yolk_sac') {
          if (afpStatus === 'significant_high' || afpStatus === 'very_high') score += 40;
          else if (afpStatus === 'mild_high') score += 20;
          else if (afpStatus === 'normal') score -= 15;

          if (ageRange === '0-5') score += 25;
          else if (ageRange === '6-12') score += 15;
          else if (ageRange === '>60') score -= 20;
        }

        if (tumor === 'seminoma') {
          if (afpStatus === 'significant_high' || afpStatus === 'very_high') score -= 45; // Never AFP high in pure seminoma
          else if (afpStatus === 'normal') score += 10;

          if (ageRange === '0-5' || ageRange === '6-12') score -= 40;
          else if (ageRange === '20-45') score += 20;
          else if (ageRange === '46-60') score += 5;
          else if (ageRange === '>60') score -= 10;

          if (morphologyFlags.prominentLymphoidStroma) score += 15;
          if (morphologyFlags.clearCytoplasmSheets) score += 20;
        }

        if (tumor === 'embryonal_carcinoma') {
          if (ageRange === '0-5' || ageRange === '6-12') score -= 40;
          else if (ageRange === '20-45') score += 20;
          else if (ageRange === '46-60') score += 5;
          else if (ageRange === '>60') score -= 15;

          if (morphologyFlags.gcnisPresent) score += 10;
          if (morphologyFlags.prominentLymphoidStroma) score -= 10;
        }

        if (tumor === 'choriocarcinoma') {
          if (hcgStatus === 'significant_high' || hcgStatus === 'very_high') score += 40;
          else if (hcgStatus === 'mild_high') score += 20;

          if (ageRange === '0-5' || ageRange === '6-12') score -= 45;
          else if (ageRange === '20-45') score += 20;
          else if (ageRange === '46-60') score += 0;
          else if (ageRange === '>60') score -= 15;

          if (morphologyFlags.hemorrhageNecrosisDominant) score += 15;
          if (morphologyFlags.syncytiotrophoblasticGiantCells) score += 10;
          if (morphologyFlags.biphasicTrophoblasticPattern) score += 25;
        }

        if (tumor === 'teratoma') {
          if (ageRange === '0-5') score += 25;
          else if (ageRange === '6-12') score += 15;
          else if (ageRange === '20-45') score += 10;
          else if (ageRange === '46-60') score += 0;
          else if (ageRange === '>60') score -= 10;

          if (morphologyFlags.matureSomaticComponent) score += 35;
          if (morphologyFlags.immatureSomaticNeuroectodermal) score += 20;
          if (morphologyFlags.somaticTypeMalignancySuspicion || morphologyFlags.immatureSomaticMalignancy) score += 20;
          if (morphologyFlags.twelvepGainPositive) score += 20;
          if (morphologyFlags.associatedNonTeratomatousGct) score += 15;
          if (morphologyFlags.metastaticTeratoma) score += 15;
          if (ageRange === '0-5' && morphologyFlags.twelvepGainNegative) score += 15;
        }

        if (tumor === 'spermatocytic') {
          // Yaş etkisi
          if (ageRange === '0-5' || ageRange === '6-12') {
            score -= 50;
          } else if (ageRange === '13-19') {
            score -= 35;
          } else if (ageRange === '20-45') {
            score -= 15;
          } else if (ageRange === '46-60') {
            score += 20;
          } else if (ageRange === '>60') {
            score += 35;
          } else if (ageRange === 'unknown') {
            score -= 5;
          }

          // GCNIS ilişkisi
          if (morphologyFlags.gcnisPresent) {
            score -= 50;
          } else if (morphologyFlags.gcnisAbsent) {
            score += 20;
          }
        }
      }

      clinicalScores[tumor] = Math.min(100, Math.max(0, score));
    }
  } else {
    for (const tumor of tumorTypes) {
      clinicalScores[tumor] = 0;
    }
  }

  // ---------- Compile final breakdown ----------
  const hasResults = Object.keys(observedResults).some(
    (k) => observedResults[k] && observedResults[k] !== 'not_done'
  );

  const result = {} as Record<TumorType, ScoreBreakdown>;
  for (const tumor of tumorTypes) {
    const ihcVal = ihcScores[tumor] ?? 0;
    const clinVal = clinicalScores[tumor] ?? 0;
    let overall = ihcVal;

    if (clinicalActive) {
      if (!hasResults) {
        overall = clinVal;
      } else {
        if (clinVal < 50) {
          overall = Math.round(ihcVal * (clinVal / 50));
        } else {
          overall = Math.round(ihcVal + (100 - ihcVal) * ((clinVal - 50) / 50));
        }
      }
    }

    let finalIhc = ihcVal;
    let finalClinical = clinVal;
    let finalOverall = overall;

    if (tumor === 'spermatocytic') {
      const processed = applySpermatocyticPostProcessing(
        ihcVal,
        clinVal,
        overall,
        observedResults,
        serumMarkers,
        ageRange,
        morphologyFlags,
        ihcScores
      );
      finalIhc = processed.ihc;
      finalClinical = processed.clinical;
      finalOverall = processed.overall;
    }

    result[tumor] = {
      ihc: finalIhc,
      clinical: finalClinical,
      clinicalActive,
      overall: finalOverall,
    };
  }
  return result;
}

// ─── 2. generateCombinationCards ───────────────────────────

export function generateCombinationCards(
  observedResults: Record<string, string>,
  serumMarkers: SerumMarkers,
  ageRange: AgeRange,
  morphologyFlags: MorphologyFlags,
  scores: Record<TumorType, ScoreBreakdown>,
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
  if (scores.seminoma.ihc >= 40 && scores.embryonal_carcinoma.ihc >= 40) {
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

  // --- Schiller-Duval morphology check ---
  if (morphologyFlags.schillerDuvalPattern) {
    cards.push({
      id: 'morphology_schiller_duval',
      title: 'Schiller-Duval / mikrokistik-retiküler patern',
      text: 'Schiller-Duval / mikrokistik-retiküler patern yolk sac tümör komponenti lehine güçlü morfolojik destek sağlar; İHK, serum markerları ve klinik bilgi ile korelasyon önerilir.',
      type: 'supportive',
      priority: 95,
    });
  }

  // --- Prepubertal age context card ---
  if (ageRange === '0-5' || ageRange === '6-12') {
    cards.push({
      id: 'prepubertal_age_context',
      title: 'Prepubertal Yaş Bağlamı',
      text: 'Prepubertal yaş, yolk sac tümör / prepubertal tip teratom açısından destekleyici klinik bağlam sağlayabilir; klasik GCNIS ilişkili postpubertal seminom için tek başına destekleyici kabul edilmemelidir.',
      type: 'supportive',
      priority: 82,
    });
  }

  // --- Teratoma type / somatic component context ---
  if (
    morphologyFlags.matureSomaticComponent ||
    morphologyFlags.immatureSomaticNeuroectodermal ||
    morphologyFlags.twelvepGainPositive ||
    morphologyFlags.twelvepGainNegative ||
    morphologyFlags.associatedNonTeratomatousGct ||
    morphologyFlags.metastaticTeratoma
  ) {
    cards.push({
      id: 'teratoma_type_context',
      title: 'Teratom tipi / somatik komponent bağlamı',
      text: 'Teratom sabit bir İHK profiliyle tanınmaz; matür/immatür somatik doku komponentlerinin morfolojik gösterilmesi, yaş, GCNIS ve 12p/i12p bilgisi ile birlikte değerlendirilmelidir.',
      type: 'supportive',
      priority: 78,
      suggestions: [
        'Prepubertal tip: çocuk yaş, GCNIS yokluğu, 12p gain/i12p yokluğu',
        'Postpubertal tip: erişkin yaş, GCNIS ilişkisi, 12p gain/i12p desteği, eşlik eden GHT komponenti',
      ],
    });
  }

  if (morphologyFlags.somaticTypeMalignancySuspicion || morphologyFlags.immatureSomaticMalignancy) {
    cards.push({
      id: 'teratoma_somatic_malignancy_context',
      title: 'Somatik tip malign transformasyon uyarısı',
      text: 'Teratom içinde belirgin malign epitelyal, mezenkimal, nöroektodermal veya sarkomatöz komponent kuşkusu varsa İHK teratom tanısı için değil, somatik malign komponentin tipini belirlemek için hedefli kullanılmalıdır.',
      type: 'pitfall',
      priority: 83,
      suggestions: [
        'Epitelyal: PanCK, EMA, p40, CK7/CK20',
        'GİS: CDX2, SATB2, CK20',
        'Renal/Müllerian: PAX8, CAIX',
        'Mezenkimal: Desmin, Myogenin, MyoD1, SMA, MDM2, CDK4',
      ],
    });
  }

  // --- Card 4: Yolk sac tumor profile ---
  const afpPositiveOrSerumHigh =
    isPositive(observedResults, 'AFP') ||
    serumMarkers.afp.status === 'significant_high' ||
    serumMarkers.afp.status === 'very_high' ||
    serumMarkers.afp.status === 'mild_high';

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
    scores.seminoma.ihc >= 60 &&
    observedResults['betaHCG'] === 'syncytial_only' &&
    isNegative(observedResults, 'AFP') &&
    isNegative(observedResults, 'GPC3')
  ) {
    cards.push({
      id: 'combo_bhcg_seminoma_pitfall',
      title: 'beta-hCG seminom pitfall uyarısı',
      text: 'beta-hCG pozitifliği yalnızca sinsityotrofoblastik dev hücrelerde ise koryokarsinom lehine yorumlanmamalıdır.',
      type: 'pitfall',
      priority: 80,
    });
  }

  // --- Card 8: AFP elevation + seminoma conflict ---
  if (
    scores.seminoma.ihc >= 60 &&
    (serumMarkers.afp.status === 'significant_high' || serumMarkers.afp.status === 'very_high')
  ) {
    cards.push({
      id: 'combo_afp_seminoma_conflict',
      title: 'AFP yüksekliği – Seminom profili çelişkisi',
      text: 'AFP yüksekliği mevcutsa saf seminom ile uyumsuz kabul edilerek nonseminomatöz komponent açısından korelasyon önerilir.',
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
      text: 'OCT3/4, CD30, GPC3 ve AFP negatifliği ile spermatositik tümör profili düşünülebilir. Bu profil, klinik yaş ve GCNIS yokluğu ile desteklenirse anlamlıdır; ileri yaş ve OCT3/4 negatifliği ile birlikte değerlendirilmelidir. Lenfoma da ayırıcı tanıda tutulmalıdır.',
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
        text: 'Bu belirteç için uygun nükleer boyanma pozitif kabul edilmelidir. Sitoplazmik/zemin boyanma profil uyumu pozitifliği olarak skorlanmamalıdır.',
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
  scores: Record<TumorType, ScoreBreakdown>,
): CardOutput[] {
  const cards: CardOutput[] = [];

  const germMarkersNegative =
    isNegativeOrNotDone(observedResults, 'SALL4') &&
    isNegativeOrNotDone(observedResults, 'OCT4') &&
    isNegativeOrNotDone(observedResults, 'CD30') &&
    isNegativeOrNotDone(observedResults, 'GPC3') &&
    isNegativeOrNotDone(observedResults, 'AFP');

  // --- 1. Lymphoma warning ---
  const cd45Positive = isPositive(observedResults, 'CD45_LCA');
  const cd20Positive = isPositive(observedResults, 'CD20');
  const pax5Positive = isPositive(observedResults, 'PAX5');
  const bCellMarkerPositive = cd20Positive || pax5Positive;

  const germCellNotSupported =
    (isNegativeOrNotDone(observedResults, 'SALL4') &&
      isNegativeOrNotDone(observedResults, 'OCT4')) ||
    ((scores.seminoma?.overall ?? 0) < 50 &&
      (scores.embryonal_carcinoma?.overall ?? 0) < 50 &&
      (scores.yolk_sac?.overall ?? 0) < 50 &&
      (scores.choriocarcinoma?.overall ?? 0) < 50);

  if (cd45Positive && bCellMarkerPositive && germCellNotSupported) {
    const bCellText =
      cd20Positive && pax5Positive
        ? 'CD20/PAX5 B hücre belirteci'
        : cd20Positive
          ? 'CD20 B hücre belirteci'
          : 'PAX5 B hücre belirteci';

    cards.push({
      id: 'mimic_lymphoma',
      title: 'Lenfoma (Mimik Uyarısı)',
      text: `GHT dışı/mimik uyarısı: CD45 pozitifliği ile ${bCellText} desteği, germ hücre belirteçlerinin negatif veya destekleyici olmaması ile birlikte testiküler lenfoma/hematolenfoid süreç açısından güçlü uyarı oluşturur. Seminom benzeri görünüm varsa lenfoma dışlanmadan germ hücreli tümör lehine yorum yapılmamalıdır.`,
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
      title: 'Sex-Cord Stromal Tümör (Mimik Uyarısı)',
      text: 'Germ hücre belirteçleri negatifken SF1 nükleer pozitifliği ve inhibin/calretinin desteği varsa Leydig/Sertoli hücreli tümörler veya sex-cord stromal tümörler yönünden değerlendirme önerilir.',
      type: 'non_gct_warning',
      priority: 90,
    });
  }

  // --- 3. Metastatic carcinoma warning ---
  const panckDiffuse = observedResults['PanCK'] === 'diffuse_positive';
  const epithelialMimicClinicalBoost =
    morphologyFlags.advancedAgeAtypicalClinical ||
    morphologyFlags.extraTesticularPrimaryHistory ||
    ageRange === '>60';

  if (
    panckDiffuse &&
    isPositive(observedResults, 'EMA') &&
    isNegative(observedResults, 'SALL4') &&
    isNegative(observedResults, 'OCT4') &&
    isNegative(observedResults, 'CD30') &&
    isNegative(observedResults, 'GPC3') &&
    isNegative(observedResults, 'AFP')
  ) {
    cards.push({
      id: 'mimic_metastatic_carcinoma',
      title: 'Metastatik Karsinom / Somatik Tip Malignite (Mimik Uyarısı)',
      text: epithelialMimicClinicalBoost
        ? 'Diffüz PanCK/EMA pozitifliği ve germ hücre belirteçlerinin negatifliği, ileri yaş veya primer öykü ile birlikte germ hücreli tümör dışı epitelyal malignite / metastatik karsinom veya teratom zemininde somatik tip malignite açısından güçlü uyarı oluşturur.'
        : 'Diffüz PanCK/EMA pozitifliği ve germ hücre belirteçlerinin negatifliği, germ hücreli tümör dışı epitelyal malignite / metastatik karsinom veya teratom zemininde somatik tip malignite açısından korelasyon gerektirir.',
      type: 'non_gct_warning',
      priority: 88,
      suggestions: [
        'Prostat: NKX3.1, PSA, PSAP, PSMA',
        'Renal: PAX8, CAIX, CD10, RCC marker',
        'Ürotelyal: GATA3, p63/p40, uroplakin',
        'Akciğer adenokarsinomu: TTF-1, Napsin A, CK7',
        'Akciğer skuamöz: p40, p63, CK5/6',
        'Kolorektal: CDX2, SATB2, CK20, CK7/CK20',
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
      title: 'Melanom (Mimik Uyarısı)',
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
      title: 'Paratestiküler Sarkom / Mezenkimal Tümör (Mimik Uyarısı)',
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
  scores: Record<TumorType, ScoreBreakdown>,
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
    scores.seminoma.ihc >= 30 &&
    scores.embryonal_carcinoma.ihc >= 30 &&
    Math.abs(scores.seminoma.ihc - scores.embryonal_carcinoma.ihc) <= 20
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
    scores.yolk_sac.ihc >= 30 &&
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
  if (scores.choriocarcinoma.ihc >= 30) {
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
    scores.seminoma?.ihc ?? 0,
    scores.embryonal_carcinoma?.ihc ?? 0,
    scores.yolk_sac?.ihc ?? 0,
    scores.choriocarcinoma?.ihc ?? 0,
    scores.teratoma?.ihc ?? 0,
    scores.spermatocytic?.ihc ?? 0,
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
        `${abName} için sitoplazmik/yanlış patern tarzı boyanma izlenmiş olup profil uyumu için nükleer pozitiflik olarak değerlendirilmemelidir.`,
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
    (serumMarkers.afp.status === 'unknown' || !serumMarkers.afp.status) &&
    (serumMarkers.betaHcg.status === 'unknown' || !serumMarkers.betaHcg.status) &&
    (serumMarkers.ldh.status === 'unknown' || !serumMarkers.ldh.status);

  if (allUnknown) {
    return 'Serum marker bilgisi girilmemiştir.';
  }

  return `Serum belirteçlerinde AFP ${serumStatusToTr(serumMarkers.afp.status)}, beta-hCG ${serumStatusToTr(serumMarkers.betaHcg.status)}, LDH ${serumStatusToTr(serumMarkers.ldh.status)} olarak değerlendirilmiştir.`;
}

/** Build interpretation copy text from scored cards. */
export function buildInterpretationCopyText(
  cards: CardOutput[],
  scores: Record<TumorType, ScoreBreakdown>,
  ageRange?: AgeRange,
): string {
  const parts: string[] = [];

  // 1. Prioritize GHT dışı / Mimik Uyarıları (Sorun 3 & 4)
  const nonGctWarnings = cards.filter((c) => c.type === 'non_gct_warning');
  for (const card of nonGctWarnings) {
    parts.push(card.text);
  }

  // 2. GCNIS (Sorun 6)
  const hasGcnisSupport = scores.gcnis && scores.gcnis.overall >= 50;

  // 3. GHT Component Profiles
  const componentThreshold = nonGctWarnings.length > 0 ? 75 : 50;
  const componentLimit = nonGctWarnings.length > 0 ? 1 : 2;

  // Exclude GCNIS from main components list and filter out low-scoring profiles
  const sortedTumors = (Object.entries(scores) as [TumorType, ScoreBreakdown][])
    .filter(([id, v]) => id !== 'gcnis' && v.overall >= componentThreshold)
    .sort(([, a], [, b]) => b.overall - a.overall)
    .slice(0, componentLimit);

  if (sortedTumors.length > 0) {
    for (const [tumor, breakdown] of sortedTumors) {
      const def = TUMOR_DEFINITIONS.find((t) => t.id === tumor);
      const label = def?.name ?? tumor;

      if (tumor === 'spermatocytic') {
        parts.push(`İmmün profil spermatositik tümör profili ile uyumlu olabilir. Bu yorum ileri yaş, GCNIS yokluğu ve OCT3/4/CD30/AFP/GPC3 negatifliği ile birlikte değerlendirildiğinde anlamlıdır. Lenfoma da ayırıcı tanıda tutulmalıdır.`);
      } else {
        let uyumLevel: string;
        if (breakdown.overall >= 75) {
          uyumLevel = 'güçlü uyumludur';
        } else {
          uyumLevel = 'uyumludur';
        }

        const formattedLabel = label.toLowerCase();
        const suffixWord = formattedLabel.includes('komponent') ? 'profili' : 'komponenti';
        parts.push(`İmmün profil ${formattedLabel} ${suffixWord} ile ${uyumLevel}.`);
      }
    }
  } else if (nonGctWarnings.length === 0) {
    // Eğer hiçbir GHT profili >= 50 değilse ve mimik uyarısı yoksa
    parts.push(`Girilen İHK profili belirgin bir germ hücreli tümör komponenti ile güçlü uyum göstermemektedir; morfoloji ve mimik paneli ile korelasyon önerilir.`);
  }

  // GCNIS support as a separate statement (Sorun 6)
  if (hasGcnisSupport && nonGctWarnings.length === 0) {
    parts.push(`GCNIS ilişkili profil açısından destekleyici bulgular mevcuttur.`);
  }

  // 4. Clinical context details (Sorun 1 & 2 & 7)
  const clinicalActive = scores.seminoma ? scores.seminoma.clinicalActive : false;
  if (!clinicalActive) {
    parts.push(`Klinik/serum verisi girilmemiştir.`);
  } else {
    const hasYolkSacMatch = sortedTumors.some(([t]) => t === 'yolk_sac');
    const isPrepubertal = ageRange === '0-5' || ageRange === '6-12';
    if (hasYolkSacMatch && isPrepubertal) {
      parts.push(`Prepubertal yaş girilmişse bu yaş grubu yolk sac tümör / prepubertal tip tümörler açısından destekleyici klinik bağlam sağlayabilir. Klinik/serum korelasyonu önerilir.`);
    }
  }

  // 5. Critical warnings (conflict, pitfall) - but avoid duplication if already pushed
  const otherCriticalCards = cards.filter(
    (c) => c.type === 'conflict' || c.type === 'pitfall'
  );
  for (const card of otherCriticalCards.slice(0, 2)) {
    if (!parts.includes(card.text)) {
      parts.push(card.text);
    }
  }

  return parts.join(' ');
}
 
