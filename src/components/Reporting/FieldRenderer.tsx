// src/components/Reporting/FieldRenderer.tsx
import React from 'react';
import { FieldDefinition } from '../../data/report-schemas/_schema';

interface FieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, onChange }) => {
  const inputId = `field-${field.id}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-800">
          {field.etiket}
          {field.zorunlu && <span className="ml-1 text-amber-600 font-bold">*</span>}
        </label>
        {field.birim && (
          <span className="text-xs text-slate-500 font-mono font-medium">({field.birim})</span>
        )}
      </div>

      {field.yardim && (
        <p className="text-xs text-slate-500 italic mb-1">{field.yardim}</p>
      )}

      {field.tip === 'select' && (
        <select
          id={inputId}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
          className="w-full rounded-xl bg-slate-50 border border-slate-300 text-slate-900 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all shadow-sm"
        >
          <option value="">-- Seçiniz --</option>
          {field.secenekler?.map((opt) => (
            <option key={opt.deger} value={opt.deger}>
              {opt.etiket}
            </option>
          ))}
        </select>
      )}

      {field.tip === 'multiselect' && (
        <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
          {field.secenekler?.map((opt) => {
            const currentArray: string[] = Array.isArray(value) ? value : [];
            const isChecked = currentArray.includes(opt.deger);
            return (
              <label
                key={opt.deger}
                className="flex items-center space-x-2.5 text-sm text-slate-700 cursor-pointer hover:text-slate-950 font-medium transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...currentArray, opt.deger]);
                    } else {
                      onChange(currentArray.filter((v) => v !== opt.deger));
                    }
                  }}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>{opt.etiket}</span>
              </label>
            );
          })}
        </div>
      )}

      {field.tip === 'number' && (
        <input
          id={inputId}
          type="number"
          step={field.ondalik ? Math.pow(10, -field.ondalik) : '1'}
          min={field.min}
          max={field.max}
          placeholder={field.ornek || ''}
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? null : Number(val));
          }}
          className="w-full rounded-xl bg-slate-50 border border-slate-300 text-slate-900 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all shadow-sm"
        />
      )}

      {field.tip === 'text' && (
        <input
          id={inputId}
          type="text"
          placeholder={field.ornek || ''}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl bg-slate-50 border border-slate-300 text-slate-900 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all shadow-sm"
        />
      )}

      {field.tip === 'textarea' && (
        <textarea
          id={inputId}
          rows={field.satir || 3}
          placeholder={field.ornek || ''}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl bg-slate-50 border border-slate-300 text-slate-900 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all shadow-sm resize-y"
        />
      )}

      {field.tip === 'boolean' && (
        <label className="flex items-center space-x-3 text-sm text-slate-800 font-semibold cursor-pointer pt-1">
          <input
            id={inputId}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          <span>Evet / Mevcut</span>
        </label>
      )}
    </div>
  );
};
