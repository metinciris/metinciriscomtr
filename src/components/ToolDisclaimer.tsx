/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Info } from 'lucide-react';

export interface ToolDisclaimerProps {
  /** Tool version, e.g. "1.0" */
  version?: string;
  /** Last scientific review date, e.g. "Temmuz 2026" */
  lastReviewDate?: string;
  /** Reference guideline or source */
  reference?: string;
  /** Intended use description */
  intendedUse?: string;
  /** Limitations */
  limitations?: string;
}

/**
 * Reusable disclaimer box for clinical/pathology tools.
 * Displays version, review date, reference guideline, intended use, and limitations
 * in a compact, non-intrusive info box.
 */
export function ToolDisclaimer({
  version,
  lastReviewDate,
  reference,
  intendedUse,
  limitations,
}: ToolDisclaimerProps) {
  const items = [
    version && { label: 'Sürüm', value: version },
    lastReviewDate && { label: 'Son gözden geçirme', value: lastReviewDate },
    reference && { label: 'Dayanak', value: reference },
    intendedUse && { label: 'Kullanım amacı', value: intendedUse },
    limitations && { label: 'Sınırlamalar', value: limitations },
  ].filter(Boolean) as { label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 text-sm text-slate-700 mt-6"
      role="note"
      aria-label="Araç bilgi kutusu"
    >
      <div className="flex items-start gap-2 mb-2">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" aria-hidden="true" />
        <span className="font-semibold text-blue-700">Araç Bilgisi</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 ml-6">
        {items.map(({ label, value }) => (
          <React.Fragment key={label}>
            <dt className="font-medium text-slate-500">{label}:</dt>
            <dd className="m-0">{value}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}
