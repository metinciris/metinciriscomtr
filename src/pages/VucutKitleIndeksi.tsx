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
    // Normal BMI 22 civarı. Genişlik çarpanı olarak kullanacağız.
    const bodyWidth = Math.min(Math.max((bmi / 22) * 60, 40), 120);

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
                        Boy ve kilo değerlerinizi girerek ideal kilonuzu ve sağlık durumunuzu kontrol edin.
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
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Boy (cm)</label>
                                    <span className="text-2xl font-black text-indigo-600">{height} <span className="text-sm font-medium text-slate-400">cm</span></span>
                                </div>
                                <input
                                    type="range"
                                    min="100"
                                    max="250"
                                    value={height}
                                    onChange={(e) => setHeight(parseInt(e.target.value))}
                                    className="w-full h-3 bg-indigo-100/50 rounded-lg appearance-none cursor-pointer accent-indigo-600 border border-indigo-50"
                                />
                                <div className="flex justify-between text-xs text-slate-400 font-medium">
                                    <span>100 cm</span>
                                    <span>175 cm</span>
                                    <span>250 cm</span>
                                </div>
                            </div>

                            {/* Weight Input */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Kilo (kg)</label>
                                    <span className="text-2xl font-black text-indigo-600">{weight} <span className="text-sm font-medium text-slate-400">kg</span></span>
                                </div>
                                <input
                                    type="range"
                                    min="30"
                                    max="250"
                                    value={weight}
                                    onChange={(e) => setWeight(parseInt(e.target.value))}
                                    className="w-full h-3 bg-indigo-100/50 rounded-lg appearance-none cursor-pointer accent-indigo-600 border border-indigo-50"
                                />
                                <div className="flex justify-between text-xs text-slate-400 font-medium">
                                    <span>30 kg</span>
                                    <span>140 kg</span>
                                    <span>250 kg</span>
                                </div>
                            </div>

                            {/* Result Summary */}
                            <div className="pt-6 border-t border-slate-50">
                                <div className="bg-slate-50 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">VKİ Sonucunuz</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-slate-800">{bmi.toFixed(1)}</span>
                                            <span className={`text-lg font-bold ${color}`}>{category}</span>
                                        </div>
                                    </div>
                                    <div className="absolute right-0 bottom-0 opacity-5 scale-150 transform translate-x-4 translate-y-4">
                                        <Calculator size={120} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Visual Representation */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-xl p-8 text-white flex flex-col items-center justify-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />

                        <div className="relative z-10 w-full flex flex-col items-center">
                            {/* Dynamic Body SVG */}
                            <div className="relative flex items-center justify-center h-64 w-full">
                                <motion.svg
                                    viewBox="0 0 200 400"
                                    className="h-full drop-shadow-2xl"
                                    initial={false}
                                >
                                    {/* Head */}
                                    <motion.circle
                                        cx="100"
                                        cy="60"
                                        r="40"
                                        fill="white"
                                        animate={{ r: 35 + (bmi > 30 ? (bmi - 30) / 2 : 0) }}
                                    />
                                    {/* Neck */}
                                    <rect x="90" y="95" width="20" height="15" fill="white" fillOpacity="0.8" />

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
                                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                    />

                                    {/* Left Arm */}
                                    <motion.path
                                        d={`M ${100 - bodyWidth / 2} 120 L ${100 - bodyWidth / 2 - 30} 240`}
                                        stroke="white"
                                        strokeWidth="15"
                                        strokeLinecap="round"
                                        animate={{ d: `M ${100 - bodyWidth / 2} 120 L ${100 - bodyWidth / 2 - 30 - (bmi > 30 ? (bmi - 30) / 2 : 0)} 240` }}
                                    />

                                    {/* Right Arm */}
                                    <motion.path
                                        d={`M ${100 + bodyWidth / 2} 120 L ${100 + bodyWidth / 2 + 30} 240`}
                                        stroke="white"
                                        strokeWidth="15"
                                        strokeLinecap="round"
                                        animate={{ d: `M ${100 + bodyWidth / 2} 120 L ${100 + bodyWidth / 2 + 30 + (bmi > 30 ? (bmi - 30) / 2 : 0)} 240` }}
                                    />

                                    {/* Left Leg */}
                                    <motion.path
                                        d={`M ${100 - bodyWidth / 4} 250 L ${100 - bodyWidth / 4 - 10} 380`}
                                        stroke="white"
                                        strokeWidth="20"
                                        strokeLinecap="round"
                                        animate={{ d: `M ${100 - bodyWidth / 4} 250 L ${100 - bodyWidth / 4 - 10} 380` }}
                                    />

                                    {/* Right Leg */}
                                    <motion.path
                                        d={`M ${100 + bodyWidth / 4} 250 L ${100 + bodyWidth / 4 + 10} 380`}
                                        stroke="white"
                                        strokeWidth="20"
                                        strokeLinecap="round"
                                        animate={{ d: `M ${100 + bodyWidth / 4} 250 L ${100 + bodyWidth / 4 + 10} 380` }}
                                    />
                                </motion.svg>
                            </div>

                            <div className="mt-8 text-center">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={category}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full font-bold text-lg"
                                    >
                                        {category}
                                    </motion.div>
                                </AnimatePresence>
                                <p className="mt-4 text-white/70 text-sm max-w-[250px]">
                                    {category === 'Normal Kilolu' ? 'Harika! Sağlıklı bir kilodasınız. Dengeli beslenmeye devam edin.' :
                                        category === 'Zayıf' ? 'Vücut direncinizin düşmemesi için yeterli protein ve kalori almalısınız.' :
                                            'Sağlığınız için ideal kilonuza ulaşmanız ve fiziksel aktiviteyi artırmanız önerilir.'}
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
