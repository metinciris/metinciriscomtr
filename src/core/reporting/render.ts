// src/core/reporting/render.ts
import { ReportSchema, FieldDefinition, VisibilityCondition } from '../../data/report-schemas/_schema';
import { StagingResult } from '../staging/types';

export interface RenderResult {
  plainText: string;
  htmlText: string;
  missingRequiredFields: string[];
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

export function renderReport(
  schema: ReportSchema,
  values: Record<string, any>,
  stagingResult?: StagingResult | null,
): RenderResult {
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
