// src/components/Reporting/ReportOutput.tsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { RenderResult } from '../../core/reporting/render';
import { StagingResult } from '../../core/staging/types';
import { ReportingDisclaimer } from '../ReportingDisclaimer';

interface ReportOutputProps {
  renderResult: RenderResult;
  stagingResult?: StagingResult | null;
  onClearForm?: () => void;
}

export const ReportOutput: React.FC<ReportOutputProps> = ({
  renderResult,
  stagingResult,
  onClearForm,
}) => {
  const [copying, setCopying] = useState(false);

  const handleCopyText = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(renderResult.plainText);
      toast.success('Rapor metni kopyalandı (Düz metin)');
    } catch {
      toast.error('Kopyalama başarısız oldu');
    } finally {
      setCopying(false);
    }
  };

  const handleCopyRichText = async () => {
    try {
      setCopying(true);
      if (navigator.clipboard && window.ClipboardItem) {
        const typeHtml = 'text/html';
        const typePlain = 'text/plain';
        const blobHtml = new Blob([renderResult.htmlText], { type: typeHtml });
        const blobPlain = new Blob([renderResult.plainText], { type: typePlain });
        const data = [
          new ClipboardItem({
            [typeHtml]: blobHtml,
            [typePlain]: blobPlain,
          }),
        ];
        await navigator.clipboard.write(data);
        toast.success('Zengin metin kopyalandı (Word uyumlu)');
      } else {
        await navigator.clipboard.writeText(renderResult.plainText);
        toast.success('Rapor metni kopyalandı');
      }
    } catch {
      // Fallback
      await navigator.clipboard.writeText(renderResult.plainText);
      toast.success('Düz metin kopyalandı');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="space-y-6 sticky top-6">
      {/* Warning Box for Missing Required Fields */}
      {renderResult.missingRequiredFields.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-4 text-amber-950 shadow-sm">
          <div className="flex items-start space-x-3">
            <span className="text-amber-600 text-xl font-bold">⚠️</span>
            <div>
              <p className="font-bold text-amber-950 text-sm">Zorunlu Alan Eksikleri</p>
              <p className="text-xs text-amber-900 font-medium mt-0.5">
                Aşağıdaki alanlar henüz doldurulmadı ve raporda <code className="bg-amber-200 text-amber-950 px-1 py-0.5 rounded font-bold">[BELİRTİLMEDİ]</code> olarak işaretlendi:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-amber-950 font-bold">
                {renderResult.missingRequiredFields.map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Staging Summary Card */}
      {stagingResult && (
        <div className="bg-slate-900/80 border border-sky-800/50 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2">
            Patolojik Evreleme ({stagingResult.ajccBaski ? `AJCC ${stagingResult.ajccBaski}` : 'AJCC'})
          </h4>
          {stagingResult.ozet ? (
            <div className="text-lg font-bold text-slate-100 bg-sky-950/50 px-3 py-2 rounded-lg border border-sky-900/60 text-sky-200">
              {stagingResult.ozet}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Evre hesaplanabilmesi için gerekli alanları doldurun.</p>
          )}

          {stagingResult.uyarilar.length > 0 && (
            <div className="mt-3 space-y-1">
              {stagingResult.uyarilar.map((warn, i) => (
                <p key={i} className="text-xs text-amber-400/90 flex items-start space-x-1.5">
                  <span>•</span>
                  <span>{warn}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Header & Copy Actions */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <span>Rapor Önizleme</span>
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              disabled={copying}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all flex items-center space-x-1.5"
              title="LIS veya Not Defteri için düz metin"
            >
              <span>📋</span>
              <span>Düz Metin</span>
            </button>
            <button
              onClick={handleCopyRichText}
              disabled={copying}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium shadow-md shadow-sky-600/20 transition-all flex items-center space-x-1.5"
              title="Word veya Zengin Metin Düzenleyiciler İçin"
            >
              <span>✨</span>
              <span>Word Biçimli</span>
            </button>
          </div>
        </div>

        {/* Output Text View */}
        <pre className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed max-h-[500px] overflow-y-auto selection:bg-sky-500 selection:text-white">
          {renderResult.plainText}
        </pre>

        {onClearForm && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClearForm}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Formu Temizle
            </button>
          </div>
        )}
      </div>

      {/* KVKK / Disclaimer */}
      <ReportingDisclaimer />
    </div>
  );
};
