import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Info, CheckCircle2, AlertCircle } from 'lucide-react';

export function VucutKitleIndeksi() {
    const [weight, setWeight] = useState(80);
    const [height, setHeight] = useState(175);
    const [bmi, setBmi] = useState(0);
    const [category, setCategory] = useState('');
    const [color, setColor] = useState('');

    useEffect(() => {
        const heightInMeters = height / 100;
        const calculatedBmi = weight / (heightInMeters * heightInMeters);
        setBmi(calculatedBmi);

        if (calculatedBmi < 18.5) {
            setCategory('Zayıf');
            setColor('text-blue-500');
        } else if (calculatedBmi >= 18.5 && calculatedBmi < 25) {
            setCategory('Normal Kilolu');
            setColor('text-green-500');
        } else if (calculatedBmi >= 25 && calculatedBmi < 30) {
            setCategory('Fazla Kilolu');
            setColor('text-yellow-500');
        } else if (calculatedBmi >= 30 && calculatedBmi < 35) {
            setCategory('I. Derece Obez');
            setColor('text-orange-500');
        } else if (calculatedBmi >= 35 && calculatedBmi < 40) {
            setCategory('II. Derece Obez');
            setColor('text-red-500');
        } else {
            setCategory('III. Derece Obez (Morbid)');
            setColor('text-red-700');
        }
    }, [weight, height]);

    // Vücut şeklini BMI'ye göre hesapla
    // Normal BMI 22.5 civarı.
    const getBodyWidth = () => {
        if (bmi < 18.5) return 30 + (bmi / 18.5) * 20; // 30-50 arası (Zayıf)
        if (bmi < 25) return 50 + ((bmi - 18.5) / 6.5) * 15; // 50-65 arası (Normal)
        if (bmi < 30) return 65 + ((bmi - 25) / 5) * 20; // 65-85 arası (Fazla Kilolu)
        return Math.min(85 + ((bmi - 30) / 10) * 35, 130); // 85-130 arası (Obez)
    };

    const bodyWidth = getBodyWidth();

    // Dinamik arka plan renkleri
    const getBgGradient = () => {
        if (bmi < 18.5) return 'from-cyan-500 to-blue-600';
        if (bmi < 25) return 'from-emerald-500 to-green-600';
        if (bmi < 30) return 'from-amber-400 to-orange-500';
        if (bmi < 35) return 'from-orange-500 to-red-600';
        return 'from-red-600 to-rose-800';
    };

    return (
        <PageContainer>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-700 rounded-2xl mb-4"
                    >
                        <Calculator className="w-8 h-8" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-black text-slate-800 mb-2"
                    >
                        Vücut Kitle İndeksi (VKİ)
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500"
                    >
                        İdeal kilonuzu ve sağlık durumunuzu kontrol edin.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100"
                    >
                        <div className="space-y-8">
                            {/* Height Input */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-6">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Boy</label>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-indigo-600">{height}</span>
                                        <span className="text-sm font-bold text-slate-400">cm</span>
                                    </div>
                                </div>
                                <div className="relative pt-2 pb-6 px-1">
                                    {/* Ruler Markings */}
                                    <div className="absolute top-0 left-0 w-full h-full flex justify-between px-1 pointer-events-none">
                                        {[...Array(11)].map((_, i) => (
                                            <div key={i} className={`w-0.5 ${i % 5 === 0 ? 'h-4 bg-slate-300' : 'h-2 bg-slate-200'} rounded-full`} />
                                        ))}
                                    </div>
                                    <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-300 rounded-full -translate-y-1/2" />
                                    <input
                                        type="range"
                                        min="100"
                                        max="220"
                                        value={height}
                                        onChange={(e) => setHeight(parseInt(e.target.value))}
                                        className="relative z-10 w-full h-6 bg-transparent appearance-none cursor-pointer
                                                   [&::-webkit-slider-runnable-track]:bg-transparent
                                                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:bg-white 
                                                   [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:rounded-full 
                                                   [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:relative"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1 px-1">
                                    <span>100 cm</span>
                                    <span>İdeal (175)</span>
                                    <span>220 cm</span>
                                </div>
                            </div>

                            {/* Weight Input */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-6">
                                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Kilo</label>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-indigo-600">{weight}</span>
                                        <span className="text-sm font-bold text-slate-400">kg</span>
                                    </div>
                                </div>
                                <div className="relative pt-2 pb-6 px-1">
                                    {/* Ruler Markings */}
                                    <div className="absolute top-0 left-0 w-full h-full flex justify-between px-1 pointer-events-none">
                                        {[...Array(11)].map((_, i) => (
                                            <div key={i} className={`w-0.5 ${i % 5 === 0 ? 'h-4 bg-slate-300' : 'h-2 bg-slate-200'} rounded-full`} />
                                        ))}
                                    </div>
                                    <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 rounded-full -translate-y-1/2" />
                                    <input
                                        type="range"
                                        min="30"
                                        max="250"
                                        value={weight}
                                        onChange={(e) => setWeight(parseInt(e.target.value))}
                                        className="relative z-10 w-full h-6 bg-transparent appearance-none cursor-pointer
                                                   [&::-webkit-slider-runnable-track]:bg-transparent
                                                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:bg-white 
                                                   [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:rounded-full 
                                                   [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:relative"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1 px-1">
                                    <span>30 kg</span>
                                    <span>Ortalama (80)</span>
                                    <span>250 kg</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                <div className="bg-slate-50 rounded-3xl p-8 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Beden Kitle İndeksiniz</p>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-6xl font-black text-slate-800 tracking-tighter">{bmi.toFixed(1)}</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${color.replace('text-', 'bg-')}`} />
                                                <span className={`text-xl font-black ${color} tracking-tight uppercase`}>{category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 scale-150 transform">
                                        <Calculator size={200} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Visual Representation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className={`bg-gradient-to-br ${getBgGradient()} rounded-3xl shadow-2xl p-8 text-white flex flex-col items-center justify-between relative overflow-hidden transition-colors duration-700`}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />

                        <div className="w-full flex justify-between items-center relative z-10 mb-4 opacity-50 text-[10px] font-black uppercase tracking-[0.3em]">
                            <span>Anatomik Simülasyon</span>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            </div>
                        </div>

                        <div className="relative z-10 w-full flex flex-col items-center flex-grow justify-center">
                            {/* Dynamic Body SVG */}
                            <div className="relative flex items-center justify-center h-80 w-full">
                                <motion.svg
                                    viewBox="0 0 200 400"
                                    className="h-full drop-shadow-2xl"
                                    initial={false}
                                >
                                    {/* Head */}
                                    <motion.circle
                                        cx="100"
                                        cy="60"
                                        r="35"
                                        fill="white"
                                        animate={{
                                            r: 32 + (bmi > 30 ? (bmi - 30) / 4 : 0),
                                            cy: 60 - (bmi < 18.5 ? 2 : 0)
                                        }}
                                    />
                                    {/* Neck */}
                                    <rect x="92" y="90" width="16" height="15" fill="white" fillOpacity="0.8" />

                                    {/* Torso & Body */}
                                    <motion.path
                                        d={`
                      M ${100 - bodyWidth / 2} 110
                      L ${100 + bodyWidth / 2} 110
                      L ${100 + bodyWidth / 1.5} 250
                      L ${100 - bodyWidth / 1.5} 250
                      Z
                    `}
                                        fill="white"
                                        animate={{
                                            d: `
                        M ${100 - bodyWidth / 2} 110
                        L ${100 + bodyWidth / 2} 110
                        L ${100 + bodyWidth / 1.5} 250
                        L ${100 - bodyWidth / 1.5} 250
                        Z
                      `
                                        }}
                                        transition={{ type: "spring", stiffness: 80, damping: 20 }}
                                    />

                                    {/* Left Arm */}
                                    <motion.path
                                        d={`M ${100 - bodyWidth / 2} 115 L ${100 - bodyWidth / 2 - 25} 230`}
                                        stroke="white"
                                        strokeWidth={12 + (bmi > 30 ? (bmi - 30) / 3 : 0)}
                                        strokeLinecap="round"
                                        animate={{
                                            d: `M ${100 - bodyWidth / 2} 115 L ${100 - bodyWidth / 2 - 25 - (bmi > 30 ? (bmi - 30) / 5 : 0)} 230`,
                                            strokeWidth: 10 + (bmi / 10)
                                        }}
                                    />

                                    {/* Right Arm */}
                                    <motion.path
                                        d={`M ${100 + bodyWidth / 2} 115 L ${100 + bodyWidth / 2 + 25} 230`}
                                        stroke="white"
                                        strokeWidth={12 + (bmi > 30 ? (bmi - 30) / 3 : 0)}
                                        strokeLinecap="round"
                                        animate={{
                                            d: `M ${100 + bodyWidth / 2} 115 L ${100 + bodyWidth / 2 + 25 + (bmi > 30 ? (bmi - 30) / 5 : 0)} 230`,
                                            strokeWidth: 10 + (bmi / 10)
                                        }}
                                    />

                                    {/* Left Leg */}
                                    <motion.path
                                        d={`M ${100 - bodyWidth / 4} 240 L ${100 - bodyWidth / 4 - 8} 380`}
                                        stroke="white"
                                        strokeWidth={18 + (bmi > 30 ? (bmi - 30) / 4 : 0)}
                                        strokeLinecap="round"
                                        animate={{
                                            d: `M ${100 - bodyWidth / 4} 240 L ${100 - bodyWidth / 4 - 8} 380`,
                                            strokeWidth: 14 + (bmi / 8)
                                        }}
                                    />

                                    {/* Right Leg */}
                                    <motion.path
                                        d={`M ${100 + bodyWidth / 4} 240 L ${100 + bodyWidth / 4 + 8} 380`}
                                        stroke="white"
                                        strokeWidth={18 + (bmi > 30 ? (bmi - 30) / 4 : 0)}
                                        strokeLinecap="round"
                                        animate={{
                                            d: `M ${100 + bodyWidth / 4} 240 L ${100 + bodyWidth / 4 + 8} 380`,
                                            strokeWidth: 14 + (bmi / 8)
                                        }}
                                    />
                                </motion.svg>
                            </div>

                            <div className="mt-8 text-center">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={category}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="px-8 py-3 bg-white text-slate-800 rounded-2xl font-black text-xl shadow-xl uppercase tracking-tighter"
                                    >
                                        {category}
                                    </motion.div>
                                </AnimatePresence>
                                <p className="mt-6 text-white font-medium text-sm max-w-[280px] leading-relaxed opacity-90">
                                    {category === 'Normal Kilolu' ? 'Mükemmel uyum! Formunuzu korumaya odaklanın.' :
                                        category === 'Zayıf' ? 'Vücut kitle indeksiniz düşük. Beslenmenize dikkat etmelisiniz.' :
                                            'Sağlığınız için hedeflerinizi belirlemenin tam zamanı.'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Info className="text-indigo-600 w-6 h-6" />
                        <h2 className="text-xl font-bold text-slate-800">VKİ Hakkında Bilmeniz Gerekenler</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-green-600 font-bold">
                                <CheckCircle2 size={18} />
                                <span>Normal: 18.5 - 24.9</span>
                            </div>
                            <p className="text-sm text-slate-500 italic">Hastalık risklerinin en az olduğu, ideal sağlık durumuna işaret eder.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-yellow-600 font-bold">
                                <AlertCircle size={18} />
                                <span>Kilolu: 25 - 29.9</span>
                            </div>
                            <p className="text-sm text-slate-500 italic">Metabolik risklerin başladığı, dengeli beslenme ve sporun gerektiği dönem.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-red-600 font-bold">
                                <AlertCircle size={18} />
                                <span>Obezite: 30+</span>
                            </div>
                            <p className="text-sm text-slate-500 italic">Sağlık risklerinin ciddi boyutlara ulaştığı, tıbbi takip gerektiren durum.</p>
                        </div>
                    </div>
                </motion.div>

                {/* FAQ Style */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <h3 className="font-black text-indigo-900 mb-3 uppercase tracking-tight">VKİ Nedir?</h3>
                        <p className="text-indigo-800/70 text-sm leading-relaxed">
                            Vücut Kitle İndeksi, yetişkin bir bireyin ağırlığının (kg), boyunun (m) karesine bölünmesiyle hesaplanan bir değerdir. Vücuttaki tahmini yağ oranını gösterir.
                        </p>
                    </div>
                    <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <h3 className="font-black text-indigo-900 mb-3 uppercase tracking-tight">Hesaplama Güvenilir mi?</h3>
                        <p className="text-indigo-800/70 text-sm leading-relaxed">
                            VKİ; yaş, cinsiyet, kas kütlesi ve vücut yapısını (kemik yoğunluğu) hesaba katmaz. Sporcularda ve yaşlılarda tek başına bir kriter olarak kullanılmamalıdır.
                        </p>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
