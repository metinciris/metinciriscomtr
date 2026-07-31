// src/core/reporting/render.ts
import { ReportSchema, FieldDefinition, VisibilityCondition } from '../../data/report-schemas/_schema';
import { StagingResult } from '../staging/types';
import { deriveGleasonGrade, GRADE_GRUBU_KAYNAK, GleasonPatern } from '../staging/prostateGleason';
import { KorSablonu } from '../../components/Reporting/useKorSablonu';

export interface RenderResult {
  plainText: string;
  htmlText: string;
  missingRequiredFields: string[];
}

export interface RenderOptions {
  benignKorlariGrupla?: boolean;
  sablon?: KorSablonu;
}

export function evaluateVisibility(
  condition: VisibilityCondition | null | undefined,
  values: Record<string, any>,
): boolean {
  if (!condition) return true;

  const targetValue = values[condition.alan];
  const expectedValue = condition.deger;

  switch (condition.operator) {
    case 'esittir':
      return targetValue === expectedValue;
    case 'esitDegil':
      return targetValue !== expectedValue && targetValue != null && targetValue !== '';
    case 'iceriyor':
      if (Array.isArray(targetValue)) {
        return targetValue.includes(expectedValue as string);
      }
      if (typeof targetValue === 'string') {
        return targetValue.includes(expectedValue as string);
      }
      return false;
    case 'buyuktur':
      return Number(targetValue) > Number(expectedValue);
    default:
      return true;
  }
}

export function formatFieldValueLabel(
  field: FieldDefinition,
  val: any,
): string | null {
  if (val == null || val === '' || (Array.isArray(val) && val.length === 0)) {
    return null;
  }

  if (field.tip === 'tekrarliGrup') {
    return null;
  }

  if (field.tip === 'boolean') {
    return val ? 'mevcut' : null;
  }

  if (field.tip === 'select') {
    const opt = field.secenekler?.find((s) => s.deger === val);
    return opt ? opt.etiket : String(val);
  }

  if (field.tip === 'multiselect') {
    if (!Array.isArray(val)) return String(val);
    const labels = val
      .map((v) => field.secenekler?.find((s) => s.deger === v)?.etiket || v)
      .join(', ');
    return labels.length > 0 ? labels : null;
  }

  return String(val);
}

export function renderProstatReport(
  schema: ReportSchema,
  values: Record<string, any>,
  options?: RenderOptions,
): RenderResult {
  const plainLines: string[] = [];
  const htmlSections: string[] = [];
  const missingRequiredFields: string[] = [];

  const korSayisi = values['kor_sayisi'] ? Number(values['kor_sayisi']) : 12;
  const yuzdeTaban = values['yuzde_taban'] === 'toplamkor' ? korSayisi : 12;
  const benignGrupla = !!options?.benignKorlariGrupla;
  const sablon = options?.sablon;

  plainLines.push(`*** PROSTAT İĞNE BİYOPSİSİ PATOLOJİ RAPORU ***\r\n`);
  htmlSections.push(
    `<h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">Prostat İğne Biyopsisi Patoloji Raporu</h2>`,
  );

  // Kor Bilgileri Toplama
  let pozitifKorSayisi = 0;
  let toplamTumorYuzdesiSum = 0;
  let enYuksekTutulum = 0;
  let enYuksekGleasonGG = 0;
  let enYuksekGleasonSkorMetni = '';
  let enYuksekGleasonToplam = 0;
  const uyarilarSet = new Set<string>();

  const korDetaylari: Array<{
    no: number;
    konumMetni: string;
    tani: string;
    isTumor: boolean;
    isBenignLike: boolean;
    satirPlainText: string;
    satirHtmlText: string;
  }> = [];

  const benignNoList: number[] = [];

  for (let i = 1; i <= korSayisi; i++) {
    const kVals = values[`kor_${i}`] || {};
    const taniVal = kVals['tani'];

    let konumMetni = `${i}. Kor`;
    if (sablon?.yerlesim[i]) {
      const y = sablon.yerlesim[i];
      const tarafStr = y.taraf === 'sag' ? 'Sağ' : 'Sol';
      const bolgeStr =
        y.bolge === 'taban' ? 'Taban' : y.bolge === 'orta' ? 'Orta' : 'Apeks';
      const konumStr = y.konum ? (y.konum === 'lateral' ? 'Lateral' : 'Medial') : '';
      konumMetni = `${i}- ${tarafStr} ${bolgeStr}${konumStr ? ` ${konumStr}` : ''}`;
    } else {
      konumMetni = `${i}- Kor ${i}`;
    }

    if (!taniVal) {
      missingRequiredFields.push(`${i}. Kor Tanısı`);
      const ptLine = `${konumMetni}: [BELİRTİLMEDİ]`;
      korDetaylari.push({
        no: i,
        konumMetni,
        tani: '[BELİRTİLMEDİ]',
        isTumor: false,
        isBenignLike: false,
        satirPlainText: ptLine,
        satirHtmlText: `<li><strong>${konumMetni}:</strong> <span style="color: #d97706; font-weight: bold;">[BELİRTİLMEDİ]</span></li>`,
      });
      continue;
    }

    if (taniVal && taniVal.includes('+')) {
      pozitifKorSayisi++;
      const parts = taniVal.split('+');
      const pPat = Number(parts[0]);
      const sPat = Number(parts[1]);
      const tumorPct = kVals['tumor_yuzdesi'] != null ? Number(kVals['tumor_yuzdesi']) : 0;
      const pat4Pct = kVals['patern4_yuzdesi'] != null ? Number(kVals['patern4_yuzdesi']) : null;
      const pat5Pct = kVals['patern5_yuzdesi'] != null ? Number(kVals['patern5_yuzdesi']) : null;
      const pni = !!kVals['perinoral_invazyon'];
      const krib = !!kVals['kribriform_intraduktal'];
      const ekHedef = !!kVals['ek_hedef_kor'];

      toplamTumorYuzdesiSum += tumorPct;
      if (tumorPct > enYuksekTutulum) {
        enYuksekTutulum = tumorPct;
      }

      let gleasonStr = '';
      if (!isNaN(pPat) && !isNaN(sPat)) {
        try {
          const gRes = deriveGleasonGrade({
            primer: pPat as GleasonPatern,
            sekonder: sPat as GleasonPatern,
          });
          gleasonStr = `Gleason skor: ${gRes.skorMetni} (Grade Grup ${gRes.gradeGrubu})`;
          if (gRes.uyari) uyarilarSet.add(gRes.uyari);

          if (
            gRes.gradeGrubu > enYuksekGleasonGG ||
            (gRes.gradeGrubu === enYuksekGleasonGG && gRes.toplam > enYuksekGleasonToplam)
          ) {
            enYuksekGleasonGG = gRes.gradeGrubu;
            enYuksekGleasonSkorMetni = gRes.skorMetni;
            enYuksekGleasonToplam = gRes.toplam;
          }
        } catch {
          gleasonStr = `Gleason skor: ${pPat}+${sPat}`;
        }
      }

      const parcalar: string[] = ['Prostat adenokarsinomu'];
      if (gleasonStr) parcalar.push(gleasonStr);
      if (pat4Pct != null) parcalar.push(`Patern 4 yüzdesi: %${pat4Pct}`);
      if (pat5Pct != null) parcalar.push(`Patern 5 yüzdesi: %${pat5Pct}`);
      if (tumorPct > 0) parcalar.push(`Tümör yüzdesi: %${tumorPct}`);
      if (pni) parcalar.push('Perinöral invazyon: mevcut');
      if (krib) parcalar.push('Kribriform patern/intraduktal karsinom: mevcut');
      if (ekHedef) parcalar.push('(Ek/hedef kor)');

      const detayStr = parcalar.join('. ') + '.';
      const ptLine = `${konumMetni}: ${detayStr}`;
      const htLine = `<li><strong>${konumMetni}:</strong> ${detayStr}</li>`;

      korDetaylari.push({
        no: i,
        konumMetni,
        tani: 'Prostat adenokarsinomu',
        isTumor: true,
        isBenignLike: false,
        satirPlainText: ptLine,
        satirHtmlText: htLine,
      });
    } else {
      let taniEtiket = 'Benign prostat dokusu';
      if (taniVal === 'doku_yok') taniEtiket = 'Doku izlenmedi';
      if (taniVal === 'fibromuskuler') taniEtiket = 'Gland içermeyen fibromusküler doku';
      if (taniVal === 'atrofik_inflamatuvar') taniEtiket = 'Atrofik-inflamatuvar benign';
      if (taniVal === 'asap') taniEtiket = 'ASAP (Atipik küçük asiner proliferasyon)';

      const isBenignStandard = taniVal === 'benign';
      if (isBenignStandard && benignGrupla) {
        benignNoList.push(i);
      }

      const ptLine = `${konumMetni}: ${taniEtiket}`;
      const htLine = `<li><strong>${konumMetni}:</strong> ${taniEtiket}</li>`;

      korDetaylari.push({
        no: i,
        konumMetni,
        tani: taniEtiket,
        isTumor: false,
        isBenignLike: isBenignStandard,
        satirPlainText: ptLine,
        satirHtmlText: htLine,
      });
    }
  }

  // Kor Bulguları Bölümü Yazma
  plainLines.push(`[KOR BAZLI BULGULAR]`);
  const htmlKorLines: string[] = [];

  if (benignGrupla && benignNoList.length > 0) {
    const basilacakKorlar = korDetaylari.filter((k) => !k.isBenignLike);
    basilacakKorlar.forEach((k) => {
      plainLines.push(k.satirPlainText);
      htmlKorLines.push(k.satirHtmlText);
    });

    const gruplanmisStr = `${benignNoList.join(',')}- Benign prostat dokusu`;
    plainLines.push(gruplanmisStr);
    htmlKorLines.push(`<li><strong>${gruplanmisStr}</strong></li>`);
  } else {
    korDetaylari.forEach((k) => {
      plainLines.push(k.satirPlainText);
      htmlKorLines.push(k.satirHtmlText);
    });
  }

  htmlSections.push(`
    <div style="margin-top: 12px;">
      <h3 style="color: #1e40af; margin-bottom: 4px; font-size: 1.1em;">Kor Bazlı Bulgular</h3>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
        ${htmlKorLines.join('')}
      </ul>
    </div>
  `);

  // İstatistikler ve Özet Bölümü
  const ortalamaTumorYuzdesi =
    korSayisi > 0 ? (toplamTumorYuzdesiSum / korSayisi).toFixed(1) : '0';

  plainLines.push(`\r\n[ÖZET İSTATİSTİKLER VE DERECE]`);
  plainLines.push(`Prostat tümör pozitif kor / toplam kor: ${pozitifKorSayisi} / ${yuzdeTaban}`);
  plainLines.push(`En yüksek kor tutulumu: %${enYuksekTutulum}`);
  plainLines.push(`Tüm korlar üzerinden ortalama tümör yüzdesi: %${ortalamaTumorYuzdesi}`);

  let gleasonOzetStr = 'Tümör saptanmadı (Gleason derecelendirmesi yapılmadı)';
  if (pozitifKorSayisi > 0 && enYuksekGleasonGG > 0) {
    gleasonOzetStr = `Gleason Skor ${enYuksekGleasonSkorMetni}, Grade Grup ${enYuksekGleasonGG}`;
  }

  plainLines.push(`Modifiye Gleason Sistemi: ${gleasonOzetStr}`);
  plainLines.push(`Derecelendirme Kaynağı: ${GRADE_GRUBU_KAYNAK}`);

  const uyarilarArr = Array.from(uyarilarSet);
  if (uyarilarArr.length > 0) {
    plainLines.push(`Uyarılar/Klinik Notlar: ${uyarilarArr.join('; ')}`);
  }

  htmlSections.push(`
    <div style="margin-top: 16px; padding: 14px; background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 8px;">
      <h3 style="color: #0369a1; margin-top: 0; margin-bottom: 8px;">Özet İstatistikler ve Derecelendirme</h3>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.6; color: #0f172a;">
        <li><strong>Prostat tümör pozitif kor / toplam kor:</strong> ${pozitifKorSayisi} / ${yuzdeTaban}</li>
        <li><strong>En yüksek kor tutulumu:</strong> %${enYuksekTutulum}</li>
        <li><strong>Ortalama tümör yüzdesi:</strong> %${ortalamaTumorYuzdesi}</li>
        <li><strong>Modifiye Gleason Sistemi:</strong> <span style="color: #1e3a8a; font-weight: bold;">${gleasonOzetStr}</span></li>
        <li><em style="color: #64748b; font-size: 0.85em;">Kaynak: ${GRADE_GRUBU_KAYNAK}</em></li>
      </ul>
      ${
        uyarilarArr.length > 0
          ? `<p style="font-size: 0.85em; color: #b45309; margin-top: 8px; font-weight: bold;">Uyarı: ${uyarilarArr.join(
              '; ',
            )}</p>`
          : ''
      }
    </div>
  `);

  // Ek Genel Bulgular Bölümü (EPE, PNI, LVI)
  const epeVal = values['epe'];
  const pniGenelVal = values['pni_genel'];
  const lviVal = values['lvi'];

  if (epeVal || pniGenelVal || lviVal) {
    plainLines.push(`\r\n[EK BULGULAR]`);
    const htmlEkLines: string[] = [];

    if (epeVal) {
      const epeStr = epeVal === 'var' ? 'Mevcut' : epeVal === 'supheli' ? 'Şüpheli' : 'Saptanmadı';
      plainLines.push(`Ekstraprostatik ekstansiyon: ${epeStr}`);
      htmlEkLines.push(`<li><strong>Ekstraprostatik ekstansiyon:</strong> ${epeStr}</li>`);
    }
    if (pniGenelVal) {
      const pniStr = pniGenelVal === 'var' ? 'Mevcut' : 'Saptanmadı';
      plainLines.push(`Perinöral invazyon (genel): ${pniStr}`);
      htmlEkLines.push(`<li><strong>Perinöral invazyon (genel):</strong> ${pniStr}</li>`);
    }
    if (lviVal) {
      const lviStr = lviVal === 'var' ? 'Mevcut' : 'Saptanmadı';
      plainLines.push(`Lenfovasküler invazyon: ${lviStr}`);
      htmlEkLines.push(`<li><strong>Lenfovasküler invazyon:</strong> ${lviStr}</li>`);
    }

    htmlSections.push(`
      <div style="margin-top: 12px;">
        <h3 style="color: #1e40af; margin-bottom: 4px; font-size: 1.1em;">Ek Genel Bulgular</h3>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
          ${htmlEkLines.join('')}
        </ul>
      </div>
    `);
  }

  return {
    plainText: plainLines.join('\r\n'),
    htmlText: `<!DOCTYPE html><html><body><div style="font-family: Arial, sans-serif; max-width: 800px; color: #1e293b;">${htmlSections.join(
      '',
    )}</div></body></html>`,
    missingRequiredFields,
  };
}

export function renderReport(
  schema: ReportSchema,
  values: Record<string, any>,
  stagingResult?: StagingResult | null,
  options?: RenderOptions,
): RenderResult {
  if (schema.id === 'prostat-igne-biyopsi') {
    return renderProstatReport(schema, values, options);
  }

  const plainLines: string[] = [];
  const htmlSections: string[] = [];
  const missingRequiredFields: string[] = [];

  plainLines.push(`*** ${schema.baslik.toUpperCase()} PATOLOJİ RAPORU ***\r\n`);
  htmlSections.push(`<h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">${schema.baslik} Patoloji Raporu</h2>`);

  schema.bolumler.forEach((section) => {
    // Check section visibility
    if (!evaluateVisibility(section.gorunurKosul, values)) return;

    const sectionPlainLines: string[] = [];
    const sectionHtmlLines: string[] = [];

    section.alanlar.forEach((field) => {
      if (field.tip === 'tekrarliGrup') return;

      // Check field visibility
      if (!evaluateVisibility(field.gorunurKosul, values)) return;

      const val = values[field.id];
      const valLabel = formatFieldValueLabel(field, val);

      if (valLabel == null) {
        if (field.zorunlu) {
          missingRequiredFields.push(field.etiket);
          const line = `${field.etiket}: [BELİRTİLMEDİ]`;
          sectionPlainLines.push(line);
          sectionHtmlLines.push(`<li><strong>${field.etiket}:</strong> <span style="color: #d97706; font-weight: bold;">[BELİRTİLMEDİ]</span></li>`);
        }
        // Silent omission if optional and empty
        return;
      }

      let lineText = '';
      if (field.raporSatiri) {
        lineText = field.raporSatiri.replace('{deger}', valLabel);
      } else {
        lineText = `${field.etiket}: ${valLabel}`;
      }

      sectionPlainLines.push(lineText);
      sectionHtmlLines.push(`<li><strong>${field.etiket}:</strong> ${valLabel}</li>`);
    });

    if (sectionPlainLines.length > 0) {
      plainLines.push(`\r\n[${section.baslik.toUpperCase()}]`);
      plainLines.push(...sectionPlainLines);

      htmlSections.push(`
        <div style="margin-top: 12px;">
          <h3 style="color: #1e40af; margin-bottom: 4px; font-size: 1.1em;">${section.baslik}</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
            ${sectionHtmlLines.join('')}
          </ul>
        </div>
      `);
    }
  });

  // Append Staging Result if present
  if (stagingResult && (stagingResult.ozet || stagingResult.uyarilar.length > 0)) {
    const baskiStr = stagingResult.ajccBaski ? `AJCC ${stagingResult.ajccBaski}` : 'AJCC';
    plainLines.push(`\r\n[PATOLOJİK EVRELEME (${baskiStr})]`);
    if (stagingResult.ozet) {
      plainLines.push(`Evre Özeti: ${stagingResult.ozet}`);
    }
    if (stagingResult.uyarilar.length > 0) {
      plainLines.push(`Notlar/Uyarılar: ${stagingResult.uyarilar.join('; ')}`);
    }

    htmlSections.push(`
      <div style="margin-top: 16px; padding: 12px; background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px;">
        <h3 style="color: #0369a1; margin-top: 0; margin-bottom: 6px;">Patolojik Evreleme (${baskiStr})</h3>
        ${stagingResult.ozet ? `<p style="font-weight: bold; margin: 4px 0; color: #0f172a;">${stagingResult.ozet}</p>` : ''}
        ${stagingResult.uyarilar.length > 0 ? `<p style="font-size: 0.9em; color: #475569; margin: 4px 0;"><em>Notlar: ${stagingResult.uyarilar.join('; ')}</em></p>` : ''}
      </div>
    `);
  }

  return {
    plainText: plainLines.join('\r\n'),
    htmlText: `<!DOCTYPE html><html><body><div style="font-family: Arial, sans-serif; max-width: 800px; color: #1e293b;">${htmlSections.join('')}</div></body></html>`,
    missingRequiredFields,
  };
}

