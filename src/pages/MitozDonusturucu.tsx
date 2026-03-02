import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Microscope, Calculator, Info, Save, RotateCcw, ChevronRight } from 'lucide-react';

// ────────────────────────────────────────────────────────────
//  Constants & Types
// ────────────────────────────────────────────────────────────
const QUICK_FN = [18, 20, 22, 23, 25, 26.5];
const OBJECTIVES = [40, 60, 100];
const TARGET_AREAS = [1, 2, 5]; // mm2

// ────────────────────────────────────────────────────────────
//  Component
// ────────────────────────────────────────────────────────────
export function MitozDonusturucu() {
    // State with LocalStorage persistence
    const [fieldNumber, setFieldNumber] = useState<number>(() => {
        const saved = localStorage.getItem('mitoz_fn');
        return saved ? parseFloat(saved) : 22;
    });
    const [objective, setObjective] = useState<number>(() => {
        const saved = localStorage.getItem('mitoz_obj');
        return saved ? parseInt(saved) : 40;
    });
    const [totalMitoses, setTotalMitoses] = useState<string>('');
    const [fieldsCounted, setFieldsCounted] = useState<string>('');

    // Persist settings
    useEffect(() => {
        localStorage.setItem('mitoz_fn', fieldNumber.toString());
        localStorage.setItem('mitoz_obj', objective.toString());
    }, [fieldNumber, objective]);

    // ── Calculations ──
    // d = FN / Objective (mm)
    const diameter = fieldNumber / objective;
    const radius = diameter / 2;
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

                {/* ── Header ── */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-800 p-8 md:p-12 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xl">
                                    <Microscope size={32} />
                                </div>
                                <span className="px-4 py-1.5 bg-black/20 rounded-full text-xs font-bold tracking-widest uppercase">Patoloji Araçları</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Mitoz Dönüştürücü</h1>
                            <p className="text-emerald-50/70 mt-3 text-lg font-medium">HPF (High Power Field) ⟷ mm² Alan Dönüşümü</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
                            <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Görüş Alanı Çapı</div>
                            <div className="text-4xl font-mono font-black">{diameter.toFixed(3)} <span className="text-xl font-normal opacity-50">mm</span></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ── Left: Settings ── */}
                    <div className="lg:col-span-4 space-y-6">
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-6 text-gray-900 font-black uppercase tracking-widest text-sm">
                                <SettingsIcon /> Mikroskop Ayarları
                            </div>

                            <div className="space-y-6">
                                {/* Field Number */}
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">Field Number (FN)</label>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {QUICK_FN.map(fn => (
                                            <button
                                                key={fn}
                                                onClick={() => setFieldNumber(fn)}
                                                className={`py-2 rounded-xl text-xs font-black transition-all ${fieldNumber === fn ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                {fn}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number" step="0.1" value={fieldNumber}
                                        onChange={e => setFieldNumber(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Objective */}
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest">Objektif</label>
                                    <div className="flex gap-2 mb-3">
                                        {OBJECTIVES.map(obj => (
                                            <button
                                                key={obj}
                                                onClick={() => setObjective(obj)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${objective === obj ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                {obj}x
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number" value={objective}
                                        onChange={e => setObjective(parseInt(e.target.value) || 1)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <Info size={20} className="text-amber-500 shrink-0" />
                                <p className="text-amber-800/80 text-xs leading-relaxed">
                                    WHO kriterlerine göre mitoz sayımları <b>mm²</b> birimi ile verilmelidir. Bu ayarlar tarayıcıya otomatik kaydedilir.
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* ── Center: Calculator ── */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1mm2, 2mm2, 5mm2 HPF Count */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {TARGET_AREAS.map(area => (
                                <div key={area} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center">
                                    <div className="text-emerald-600 font-black text-3xl mb-1">{area} <span className="text-lg">mm²</span></div>
                                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-3">İçin Gereken Alan</div>
                                    <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl font-mono font-black text-xl">
                                        {getHpfForArea(area).toFixed(1)} <span className="text-xs opacity-60">HPF</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Conversion Tool */}
                        <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2 text-gray-900 font-black uppercase tracking-widest text-sm">
                                    <Calculator size={18} className="text-emerald-600" /> Dönüştürücü
                                </div>
                                <button onClick={reset} className="p-2 text-gray-300 hover:text-emerald-600 transition-colors">
                                    <RotateCcw size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest italic">Sayılan Mitoz Sayısı</label>
                                        <input
                                            type="number" value={totalMitoses}
                                            onChange={e => setTotalMitoses(e.target.value)}
                                            placeholder="Örn: 15"
                                            className="w-full bg-transparent border-b-2 border-gray-100 py-4 text-4xl font-black text-gray-900 outline-none focus:border-emerald-500 transition-all placeholder:text-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest italic">Sayılan Alan (HPF)</label>
                                        <input
                                            type="number" value={fieldsCounted}
                                            onChange={e => setFieldsCounted(e.target.value)}
                                            placeholder="Örn: 10"
                                            className="w-full bg-transparent border-b-2 border-gray-100 py-4 text-4xl font-black text-gray-900 outline-none focus:border-emerald-500 transition-all placeholder:text-gray-100"
                                        />
                                    </div>
                                </div>

                                <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white flex flex-col items-center justify-center text-center shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                    <div className="text-emerald-200/60 text-xs font-black uppercase tracking-[0.2em] mb-4">Mitoz Yoğunluğu</div>
                                    <div className="text-7xl font-mono font-black mb-2 tracking-tighter transition-transform group-hover:scale-110 duration-500">
                                        {isFinite(mitosesPerMm2) ? mitosesPerMm2.toFixed(2) : '0.00'}
                                    </div>
                                    <div className="text-2xl font-bold opacity-80">mitoz / mm²</div>

                                    <div className="mt-8 pt-8 border-t border-white/10 w-full text-xs text-emerald-200/50 flex items-center justify-center gap-2">
                                        <ChevronRight size={14} /> 1 HPF = {hpfArea.toFixed(4)} mm²
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* ── Formulas & Help ── */}
                <div className="bg-gray-50 rounded-[2.5rem] p-10 md:p-14 border border-gray-100">
                    <h3 className="text-gray-900 font-black text-xl mb-8 flex items-center gap-3">
                        <Info size={24} className="text-emerald-600" /> Hesaplama Detayları
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <FormulaCard
                            title="Görüş Alanı Çapı"
                            formula="Diameter = FN / Magnification"
                            description="Field Number'ın objektif büyütmesine oranıdır."
                        />
                        <FormulaCard
                            title="HPF Alanı"
                            formula="Area = π × (Diameter / 2)²"
                            description="Bir görüş alanının mm² cinsinden toplam yüzey alanıdır."
                        />
                        <FormulaCard
                            title="Yoğunluk"
                            formula="Density = Mitoses / (HPF × Area)"
                            description="Birim alan (mm²) başına düşen ortalama mitoz sayısı."
                        />
                    </div>
                </div>

            </div>
        </PageContainer>
    );
}

function SettingsIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function FormulaCard({ title, formula, description }: { title: string; formula: string; description: string }) {
    return (
        <div className="space-y-3">
            <h4 className="text-gray-900 font-bold text-sm tracking-tight">{title}</h4>
            <div className="bg-white px-4 py-3 rounded-xl font-mono text-emerald-600 text-xs border border-emerald-50">
                {formula}
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
        </div>
    );
}
