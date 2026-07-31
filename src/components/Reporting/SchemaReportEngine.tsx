// src/components/Reporting/SchemaReportEngine.tsx
import React, { useMemo } from 'react';
import { ReportSchema } from '../../data/report-schemas/_schema';
import { useReportState } from './useReportState';
import { FieldRenderer } from './FieldRenderer';
import { ReportOutput } from './ReportOutput';
import { renderReport, evaluateVisibility } from '../../core/reporting/render';
import { deriveColorectalStage } from '../../core/staging/colorectal';
import { StagingFn } from '../../core/staging/types';

const STAGING_REGISTRY: Record<string, StagingFn> = {
  colorectal: deriveColorectalStage,
};

interface SchemaReportEngineProps {
  schema: ReportSchema;
}

export const SchemaReportEngine: React.FC<SchemaReportEngineProps> = ({ schema }) => {
  const {
    values,
    updateValue,
    hasSavedDraft,
    loadDraft,
    clearDraft,
  } = useReportState(schema.id);

  // Compute Staging if system registered
  const stagingResult = useMemo(() => {
    if (!schema.evrelemeSistemi) return null;
    const stagingFn = STAGING_REGISTRY[schema.evrelemeSistemi];
    if (!stagingFn) return null;

    // Extract pT option metadata if available
    let pTVal: string | null = null;
    schema.bolumler.forEach((sec) => {
      sec.alanlar.forEach((field) => {
        if (field.evrelemeRolu === 'pT') {
          const selectedOptionVal = values[field.id];
          const selectedOption = field.secenekler?.find((opt) => opt.deger === selectedOptionVal);
          if (selectedOption?.pT) {
            pTVal = selectedOption.pT;
          }
        }
      });
    });

    return stagingFn({
      pT: pTVal,
      lenfNoduToplam: values['ln_toplam'] != null ? Number(values['ln_toplam']) : null,
      lenfNoduPozitif: values['ln_pozitif'] != null ? Number(values['ln_pozitif']) : null,
      tumorDepoziti: values['tumor_depoziti'] != null ? Number(values['tumor_depoziti']) : null,
      metastazDurumu: values['metastaz_durumu'] ?? null,
      metastazPatolojikDogrulandi: values['metastaz_patolojik_dogrulandi'] ?? false,
    });
  }, [schema, values]);

  // Render report text
  const renderResult = useMemo(() => {
    return renderReport(schema, values, stagingResult);
  }, [schema, values, stagingResult]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Draft Found Banner */}
      {hasSavedDraft && (
        <div className="bg-sky-950/80 border border-sky-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center space-x-3 text-sky-200 text-sm">
            <span className="text-xl">💾</span>
            <div>
              <p className="font-semibold">Kaydedilmiş taslak bulundu</p>
              <p className="text-xs text-sky-300/80">Kaldığınız yerden devam edebilir veya sıfırlayabilirsiniz.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDraft}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
            >
              Devam Et
            </button>
            <button
              onClick={clearDraft}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all"
            >
              Sıfırla
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-100">{schema.baslik}</h1>
        {schema.kaynak && (
          <p className="text-sm text-slate-200 font-medium mt-1">
            Kaynak: <span className="text-sky-400 font-semibold">{schema.kaynak}</span>
            {schema.surum && <span className="ml-2 bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-200 font-mono">v{schema.surum}</span>}
          </p>
        )}
      </div>

      {/* Grid Layout: Form vs Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {schema.bolumler.map((section) => {
            if (!evaluateVisibility(section.gorunurKosul, values)) return null;

            return (
              <div
                key={section.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm"
              >
                <h2 className="text-base font-semibold text-sky-400 border-b border-slate-800 pb-2">
                  {section.baslik}
                </h2>
                <div className="grid grid-cols-1 gap-4 pt-1">
                  {section.alanlar.map((field) => {
                    if (!evaluateVisibility(field.gorunurKosul, values)) return null;
                    return (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        value={values[field.id]}
                        onChange={(val) => updateValue(field.id, val)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Output & Preview Column */}
        <div className="lg:col-span-5">
          <ReportOutput
            renderResult={renderResult}
            stagingResult={stagingResult}
            onClearForm={clearDraft}
          />
        </div>
      </div>
    </div>
  );
};
