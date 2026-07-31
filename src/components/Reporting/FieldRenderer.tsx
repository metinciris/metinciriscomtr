// src/components/Reporting/FieldRenderer.tsx
import React from 'react';
import { FieldDefinition, VisibilityCondition } from '../../data/report-schemas/_schema';

interface FieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  allValues?: Record<string, any>;
  onBatchChange?: (updates: Record<string, any>) => void;
}

export function evaluateVisibilityLocal(
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

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  allValues = {},
  onBatchChange,
}) => {
  const inputId = `field-${field.id}`;

  if (field.tip === 'tekrarliGrup') {
    let sayi = 12;
    if ('sabit' in field.sayiKaynagi) {
      sayi = field.sayiKaynagi.sabit;
    } else if ('alan' in field.sayiKaynagi) {
      const v = allValues[field.sayiKaynagi.alan];
      sayi = v != null && !isNaN(Number(v)) ? Number(v) : 12;
    }

    const indisler = Array.from({ length: sayi }, (_, i) => i + 1);

    return (
      <div className="space-y-4 pt-2">
        {indisler.map((index) => {
          const ogeBaslik = field.ogeEtiketi.replace('{index}', String(index));
          const groupValuesKey = `kor_${index}`;
          const currentGroupVals = allValues[groupValuesKey] || {};

          return (
            <div
              key={index}
              className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-sm text-sky-950">{ogeBaslik}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field.altAlanlar.map((altField) => {
                  if (!evaluateVisibilityLocal(altField.gorunurKosul, currentGroupVals)) {
                    return null;
                  }
                  const altValue = currentGroupVals[altField.id];
                  return (
                    <FieldRenderer
                      key={altField.id}
                      field={altField}
                      value={altValue}
                      onChange={(val) => {
                        const updatedGroup = {
                          ...currentGroupVals,
                          [altField.id]: val,
                        };
                        if (onBatchChange) {
                          onBatchChange({ [groupValuesKey]: updatedGroup });
                        } else {
                          onChange({
                            ...(value || {}),
                            [groupValuesKey]: updatedGroup,
                          });
                        }
                      }}
                      allValues={allValues}
                      onBatchChange={onBatchChange}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

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

