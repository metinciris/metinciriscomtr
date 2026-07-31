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
        <div className="bg-sky-50 border border-sky-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3 text-sky-950 text-sm">
            <span className="text-xl">💾</span>
            <div>
              <p className="font-bold text-sky-950">Kaydedilmiş taslak bulundu</p>
              <p className="text-xs text-sky-900 font-medium">Kaldığınız yerden devam edebilir veya sıfırlayabilirsiniz.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadDraft}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow transition-all"
            >
              Devam Et
            </button>
            <button
              onClick={clearDraft}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-sm transition-all"
            >
              Sıfırla
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{schema.baslik}</h1>
        {schema.kaynak && (
          <div className="text-sm text-slate-700 font-medium mt-2 flex items-center space-x-2">
            <span className="text-slate-600 font-semibold">Kaynak:</span>
            <span className="bg-sky-100 border border-sky-300 text-sky-900 font-bold px-2.5 py-0.5 rounded-md text-xs">
              {schema.kaynak}
            </span>
            {schema.surum && (
              <span className="bg-slate-100 border border-slate-300 text-slate-800 font-mono font-bold px-2 py-0.5 rounded text-xs">
                v{schema.surum}
              </span>
            )}
          </div>
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
                className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm"
              >
                <h2 className="text-base font-bold text-sky-900 border-b border-slate-200 pb-2.5">
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
