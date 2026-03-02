import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Microscope, Calculator, Info, RotateCcw, ChevronRight, Settings } from 'lucide-react';

// ────────────────────────────────────────────────────────────
//  Constants & Types
// ────────────────────────────────────────────────────────────
const RANGE_1 = [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.69]; // Standard Ranges
const RANGE_2 = [0.15, 0.16, 0.17, 0.18, 0.19, 0.20]; // 60x Ranges
const TARGET_AREAS = [1, 2, 5]; // mm2

// ────────────────────────────────────────────────────────────
//  Component
// ────────────────────────────────────────────────────────────
export function MitozDonusturucu() {
    // State with LocalStorage persistence
    const [fieldDiameter, setFieldDiameter] = useState<number>(() => {
        const saved = localStorage.getItem('mitoz_diameter');
        return saved ? parseFloat(saved) : 0.55;
    });
    const [totalMitoses, setTotalMitoses] = useState<string>('');
    const [fieldsCounted, setFieldsCounted] = useState<string>('');

    // Persist settings
    useEffect(() => {
        localStorage.setItem('mitoz_diameter', fieldDiameter.toString());
    }, [fieldDiameter]);

    // ── Calculations ──
    const radius = fieldDiameter / 2;
    // Area of one HPF (mm2) = PI * r^2
    const hpfArea = Math.PI * Math.pow(radius, 2);

    // HPF needed for X mm2 = X / hpfArea
    const getHpfForArea = (targetArea: number) => targetArea / hpfArea;

    // Mitoses per mm2 = Total / (Fields * Area)
    const mitosesPerMm2 = (parseFloat(totalMitoses) || 0) / ((parseFloat(fieldsCounted) || 1) * hpfArea);

    const reset = () => {
        setTotalMitoses('');
        setFieldsCounted('');
    };

    return (
        <PageContainer>
            <div className="max-w-4xl mx-auto space-y-8">

                {/* ── Header & Main Input (TOP) ── */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-800 p-8 md:p-12 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl">
                                        <Microscope size={32} />
                                    </div>
                                    <span className="px-4 py-1.5 bg-black/20 rounded-full text-xs font-bold tracking-widest uppercase">Patoloji Araçları</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Mitoz Dönüştürücü</h1>
                                <p className="text-emerald-50/70 text-lg font-medium italic">"Field Diameter" (Çap) Odaklı Hesaplama</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/20 flex flex-col items-center min-w-[240px]">
                                <div className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Mevcut Çap (Diameter)</div>
                                <div className="flex items-end gap-2">
                                    <input
                                        type="number" step="0.01" value={fieldDiameter}
                                        onChange={e => setFieldDiameter(parseFloat(e.target.value) || 0)}
                                        className="bg-transparent border-b-2 border-white/30 text-5xl font-mono font-black text-white w-32 text-center outline-none focus:border-white transition-all"
                                    />
                                    <span className="text-xl font-bold opacity-50 mb-2">mm</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Selection Ranges */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Standard Range */}
                            <div className="bg-black/10 rounded-3xl p-6 border border-white/5">
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ChevronRight size={12} /> HIZLI SEÇİM (0.40 - 0.69 mm)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {RANGE_1.map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setFieldDiameter(val)}
                                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${fieldDiameter === val ? 'bg-white text-emerald-800 shadow-xl scale-110' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                        >
                                            {val.toFixed(2)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 60x Range */}
                            <div className="bg-black/10 rounded-3xl p-6 border border-white/5">
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ChevronRight size={12} /> 60X OBJEKTİF (0.15 - 0.20 mm)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {RANGE_2.map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setFieldDiameter(val)}
                                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${fieldDiameter === val ? 'bg-white text-emerald-800 shadow-xl scale-110' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                        >
                                            {val.toFixed(2)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ── Left: Calculator & Results ── */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* HPF Results */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {TARGET_AREAS.map(area => (
                                <div key={area} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center group transition-all hover:translate-y-[-4px]">
                                    <div className="text-emerald-600 font-black text-3xl mb-1">{area} <span className="text-lg">mm²</span></div>
                                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-3">İçin Gereken Alan</div>
                                    <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl font-mono font-black text-xl w-full text-center">
                                        {getHpfForArea(area).toFixed(1)} <span className="text-xs opacity-60">HPF</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Conversion Form */}
                        <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2 text-gray-900 font-black uppercase tracking-widest text-sm">
                                    <Calculator size={18} className="text-emerald-600" /> Hesaplayıcı
                                </div>
                                <button onClick={reset} className="p-3 bg-gray-50 text-gray-300 hover:text-emerald-600 rounded-full transition-all hover:rotate-[-90deg]">
                                    <RotateCcw size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-gray-400 text-[10px] font-bold mb-3 uppercase tracking-[0.2em] italic">Toplam Mitoz</label>
                                        <input
                                            type="number" value={totalMitoses}
                                            onChange={e => setTotalMitoses(e.target.value)}
                                            placeholder="Örn: 24"
                                            className="w-full bg-transparent border-b-2 border-gray-100 py-4 text-5xl font-black text-gray-900 outline-none focus:border-emerald-500 transition-all placeholder:text-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-[10px] font-bold mb-3 uppercase tracking-[0.2em] italic">Taranan Alan (HPF)</label>
                                        <input
                                            type="number" value={fieldsCounted}
                                            onChange={e => setFieldsCounted(e.target.value)}
                                            placeholder="Örn: 10"
                                            className="w-full bg-transparent border-b-2 border-gray-100 py-4 text-5xl font-black text-gray-900 outline-none focus:border-emerald-500 transition-all placeholder:text-gray-100"
                                        />
                                    </div>
                                </div>

                                <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white flex flex-col items-center justify-center text-center shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                    <div className="text-emerald-200/60 text-xs font-black uppercase tracking-[0.2em] mb-4">Mitoz Yoğunluğu</div>
                                    <div className="text-7xl font-mono font-black mb-2 tracking-tighter transition-transform group-hover:scale-110 duration-500">
                                        {isFinite(mitosesPerMm2) ? mitosesPerMm2.toFixed(3) : '0.000'}
                                    </div>
                                    <div className="text-2xl font-bold opacity-80">mitoz / mm²</div>

                                    <div className="mt-8 pt-8 border-t border-white/10 w-full text-[10px] text-emerald-200/50 flex items-center justify-center gap-2">
                                        <Info size={14} /> 1 HPF Alanı = {hpfArea.toFixed(4)} mm²
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ── Right: Formulas ── */}
                    <div className="lg:col-span-4 space-y-6">
                        <section className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-xl">
                            <h3 className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-2">
                                <Settings size={18} /> Matematiksel Model
                            </h3>
                            <div className="space-y-10">
                                <FormulaCardDark
                                    title="HPF Alanı (mm²)"
                                    formula="π × (Diameter / 2)²"
                                    desc="Mikroskop görüş alanının toplam dairesel alanı."
                                />
                                <FormulaCardDark
                                    title="Görünüm Katsayısı"
                                    formula="1 / HPF Area"
                                    desc="1 mm² alan elde etmek için taranması gereken HPF sayısı."
                                />
                                <FormulaCardDark
                                    title="Nihai Yoğunluk"
                                    formula="Mitoses / (HPF × Area)"
                                    desc="WHO raporlama standardına göre mm² başına düşen değer."
                                />
                            </div>
                        </section>

                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-4">
                            <Info size={24} className="text-emerald-600 shrink-0 mt-1" />
                            <p className="text-emerald-900/70 text-sm leading-relaxed font-medium">
                                <b>Önemli:</b> Mikroskobunuzun çapını bilmiyorsanız, <b>FN / Objektif Büyütmesi</b> (örn: 22 / 40 = 0.55 mm) formülüyle hesaplayıp çap alanına girebilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </PageContainer>
    );
}

function FormulaCardDark({ title, formula, desc }: { title: string; formula: string; desc: string }) {
    return (
        <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-tight opacity-70">{title}</h4>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl font-mono text-emerald-400 text-sm">
                {formula}
            </div>
            <p className="text-white/40 text-[10px] leading-relaxed">{desc}</p>
        </div>
    );
}
