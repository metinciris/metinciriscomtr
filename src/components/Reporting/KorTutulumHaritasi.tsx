import React, { useState } from 'react';
import { KorSablonu, KorKonum } from './useKorSablonu';

export interface KorVerisi {
  tumorVar: boolean;
  yuzde?: number;
  tani?: string;
}

export interface KorTutulumHaritasiProps {
  sablon: KorSablonu;
  korVerileri: Record<number, KorVerisi>;
}

// 4 sütun: Sağ Lat | Sağ Med | Sol Med | Sol Lat
// 3 satır: Taban | Orta | Apeks
const BOLGELER: Array<{ id: KorKonum['bolge']; etiket: string }> = [
  { id: 'taban', etiket: 'Taban' },
  { id: 'orta', etiket: 'Orta' },
  { id: 'apeks', etiket: 'Apeks' },
];

const SUTUNLAR: Array<{ taraf: 'sag' | 'sol'; konum: 'lateral' | 'medial'; etiket: string }> = [
  { taraf: 'sag', konum: 'lateral', etiket: 'Sağ Lat' },
  { taraf: 'sag', konum: 'medial', etiket: 'Sağ Med' },
  { taraf: 'sol', konum: 'medial', etiket: 'Sol Med' },
  { taraf: 'sol', konum: 'lateral', etiket: 'Sol Lat' },
];

export function getHucredekiKorlar(
  sablon: KorSablonu,
  taraf: 'sag' | 'sol',
  bolge: KorKonum['bolge'],
  konum: 'lateral' | 'medial',
): number[] {
  const korlar: number[] = [];
  Object.entries(sablon.yerlesim).forEach(([korNoStr, k]) => {
    const korNo = Number(korNoStr);
    if (k.taraf === taraf && k.bolge === bolge && (k.konum === konum || (!k.konum && konum === 'lateral'))) {
      korlar.push(korNo);
    }
  });
  return korlar;
}

export function getYuzdeRenk(yuzde?: number, tumorVar?: boolean): string {
  if (!tumorVar) return '#f8fafc'; // slate-50 (tümör yok)
  if (yuzde == null || yuzde === 0) return '#fef08a'; // yellow-200 (tümör var pero % bilinmiyor)
  if (yuzde <= 25) return '#fde047'; // yellow-300
  if (yuzde <= 50) return '#fb923c'; // orange-400
  if (yuzde <= 75) return '#f87171'; // red-400
  return '#dc2626'; // red-600
}

export function generateAsciiHarita(
  sablon: KorSablonu,
  korVerileri: Record<number, KorVerisi>,
): string {
  const lines: string[] = [];
  lines.push('+-------------------------------------------------------+');
  lines.push('|              PROSTAT KOR TUTULUM HARİTASI             |');
  lines.push('+------------------+------------------+-----------------+');
  lines.push('| BÖLGE            | SAĞ (Lat / Med)  | SOL (Med / Lat) |');
  lines.push('+------------------+------------------+-----------------+');

  BOLGELER.forEach(({ id: bolge, etiket }) => {
    const sagLatKorlar = getHucredekiKorlar(sablon, 'sag', bolge, 'lateral');
    const sagMedKorlar = getHucredekiKorlar(sablon, 'sag', bolge, 'medial');
    const solMedKorlar = getHucredekiKorlar(sablon, 'sol', bolge, 'medial');
    const solLatKorlar = getHucredekiKorlar(sablon, 'sol', bolge, 'lateral');

    const formatKorStr = (korlar: number[]) => {
      if (korlar.length === 0) return '-';
      return korlar
        .map((k) => {
          const v = korVerileri[k];
          if (!v || !v.tumorVar) return `[${k}]`;
          return `[${k}:+${v.yuzde != null ? `${v.yuzde}%` : ''}]`;
        })
        .join(' ');
    };

    const sagStr = `${formatKorStr(sagLatKorlar)} | ${formatKorStr(sagMedKorlar)}`.padEnd(16);
    const solStr = `${formatKorStr(solMedKorlar)} | ${formatKorStr(solLatKorlar)}`.padEnd(15);
    const bolgeStr = etiket.padEnd(16);

    lines.push(`| ${bolgeStr} | ${sagStr} | ${solStr} |`);
  });

  lines.push('+------------------+------------------+-----------------+');
  lines.push(' Lejant: [N] Benign/Negatif, [N:+%X] Tümör Pozitif (%X)');
  return lines.join('\n');
}

export const KorTutulumHaritasi: React.FC<KorTutulumHaritasiProps> = ({
  sablon,
  korVerileri,
}) => {
  const [gorunumMode, setGorunumMode] = useState<'svg' | 'ascii'>('svg');
  const [kopyalandi, setKopyalandi] = useState(false);

  const asciiText = generateAsciiHarita(sablon, korVerileri);

  const copyAscii = async () => {
    try {
      await navigator.clipboard.writeText(asciiText);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <span>📍 Kor Tutulum Haritası</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setGorunumMode('svg')}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
              gorunumMode === 'svg'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            Görsel (SVG)
          </button>
          <button
            type="button"
            onClick={() => setGorunumMode('ascii')}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
              gorunumMode === 'ascii'
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            Metin (ASCII)
          </button>
        </div>
      </div>

      {gorunumMode === 'svg' ? (
        <div className="space-y-3">
          <div className="overflow-x-auto flex justify-center p-2 bg-slate-50 rounded-xl border border-slate-200">
            <svg width="440" height="260" viewBox="0 0 440 260" className="max-w-full">
              {/* Header Titles */}
              <text x="110" y="20" textAnchor="middle" className="text-xs font-extrabold fill-slate-800">
                SAĞ LOB
              </text>
              <text x="330" y="20" textAnchor="middle" className="text-xs font-extrabold fill-slate-800">
                SOL LOB
              </text>

              {/* Column Headers */}
              {SUTUNLAR.map((s, idx) => (
                <text
                  key={idx}
                  x={50 + idx * 90 + 40}
                  y={40}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-slate-500"
                >
                  {s.etiket}
                </text>
              ))}

              {/* Grid Rows */}
              {BOLGELER.map((b, rIdx) => {
                const y = 50 + rIdx * 65;
                return (
                  <g key={b.id}>
                    {/* Row Header */}
                    <text
                      x="40"
                      y={y + 35}
                      textAnchor="end"
                      className="text-xs font-bold fill-slate-700"
                    >
                      {b.etiket}
                    </text>

                    {/* Columns */}
                    {SUTUNLAR.map((s, cIdx) => {
                      const x = 50 + cIdx * 90;
                      const korlar = getHucredekiKorlar(sablon, s.taraf, b.id, s.konum);

                      const enYuksekTumorluKor = korlar.reduce<{
                        tumorVar: boolean;
                        yuzde?: number;
                      }>(
                        (acc, kNo) => {
                          const v = korVerileri[kNo];
                          if (v?.tumorVar) {
                            return {
                              tumorVar: true,
                              yuzde: Math.max(acc.yuzde || 0, v.yuzde || 0),
                            };
                          }
                          return acc;
                        },
                        { tumorVar: false },
                      );

                      const fillColor = getYuzdeRenk(
                        enYuksekTumorluKor.yuzde,
                        enYuksekTumorluKor.tumorVar,
                      );

                      return (
                        <g key={cIdx} className="transition-all hover:opacity-90">
                          <rect
                            x={x}
                            y={y}
                            width="80"
                            height="55"
                            rx="8"
                            ry="8"
                            fill={fillColor}
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                          />

                          {korlar.length > 0 ? (
                            korlar.map((kNo, kIdx) => {
                              const v = korVerileri[kNo];
                              const offset = korlar.length === 1 ? 28 : (kIdx + 1) * (50 / (korlar.length + 1));
                              return (
                                <g key={kNo}>
                                  <text
                                    x={x + 40}
                                    y={y + offset}
                                    textAnchor="middle"
                                    className={`text-xs font-bold ${
                                      v?.tumorVar ? 'fill-slate-950 font-black' : 'fill-slate-700'
                                    }`}
                                  >
                                    Kor {kNo} {v?.tumorVar ? `(%${v.yuzde ?? '?'})` : ''}
                                  </text>
                                </g>
                              );
                            })
                          ) : (
                            <text
                              x={x + 40}
                              y={y + 32}
                              textAnchor="middle"
                              className="text-xs fill-slate-300 font-semibold"
                            >
                              -
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-slate-600 pt-1">
            <div className="flex items-center space-x-1">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 inline-block"></span>
              <span>Benign</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3.5 h-3.5 rounded bg-yellow-300 border border-yellow-400 inline-block"></span>
              <span>%1-25</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3.5 h-3.5 rounded bg-orange-400 border border-orange-500 inline-block"></span>
              <span>%26-50</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3.5 h-3.5 rounded bg-red-400 border border-red-500 inline-block"></span>
              <span>%51-75</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3.5 h-3.5 rounded bg-red-600 border border-red-700 inline-block"></span>
              <span>%76-100</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <pre className="p-4 rounded-xl bg-slate-900 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre leading-relaxed border border-slate-800">
            {asciiText}
          </pre>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={copyAscii}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shadow"
            >
              {kopyalandi ? '✓ Kopyalandı' : '📋 ASCII Tabloyu Kopyala'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
