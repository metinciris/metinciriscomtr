import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { Microscope, ArrowRight, Eye, AlertCircle } from 'lucide-react';

export function HaftaninVakasi() {
    const [isRevealed, setIsRevealed] = useState(false);

    // Mock Data - Case 22
    const currentCase = {
        id: 'case-22',
        title: 'Ayın Vakası',
        history: 'Tümöral olmayan tiroid dokusunda çok sayıda psammoma cisimciği mi görüyorsunuz?',
        imagePlaceholder: 'https://metinciris.github.io/gallery-22/thumbnail.jpg',
        diagnosis: 'Diffüz Sklerozan Papiller Tiroid Karsinomu',
        description: `Aslında Papiller Tiroid Karsinomunun Diffüz Sklerozan Varyantına (DSV) bakıyor olabilirsiniz.
    Bu nadir fakat kendine özgü alt tip şunlarla karakterizedir:
     🔹 Yaygın psammoma cisimcikleri
     🔹 Yoğun fibrozis
     🔹 Belirgin lenfositik infiltrasyon
     🔹 PTC'nin klasik nükleer özellikleri, sıklıkla silik ve diffüz`,
        slideUrl: 'https://metinciris.github.io/gallery-22/',
    };

    return (
        <PageContainer>
            <div className="max-w-4xl mx-auto pb-20">
                {/* Header */}
                <div className="mb-8 border-b-4 border-purple-600 pb-4">
                    <h1 className="text-4xl md:text-5xl font-light text-gray-800">
                        Ayın <span className="font-bold text-purple-700">Vakası</span>
                    </h1>
                    <p className="text-xl text-gray-500 mt-2 font-light">
                        Kendinizi test edin, tanıyı tahmin edin.
                    </p>
                </div>

                {/* Case Card */}
                <div className="bg-white shadow-xl border border-gray-100 overflow-hidden">
                    {/* Image Section - Full Visibility */}
                    <div className="relative bg-gray-200 flex items-center justify-center overflow-hidden group">
                        <img
                            src={currentCase.imagePlaceholder}
                            alt="Case Preview"
                            className="w-full h-auto max-h-[600px] object-contain transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Overlay Removed */}
                    </div>

                    {/* Clinical History Section - Now Below Image - Metro Style */}
                    <div
                        className="p-6 md:p-8"
                        style={{ backgroundColor: '#4B0082', color: '#ffffff' }}
                    >
                        <div className="flex items-center gap-3 font-bold uppercase tracking-widest text-sm mb-3" style={{ color: '#e9d5ff' }}>
                            <Microscope size={20} />
                            Klinik Öykü
                        </div>
                        <p className="text-xl md:text-3xl font-light leading-relaxed" style={{ color: '#ffffff' }}>
                            {currentCase.history}
                        </p>
                    </div>

                    {/* Interaction Section */}
                    <div className="p-8 md:p-12" style={{ backgroundColor: '#eeeeee' }}>
                        <div className="flex flex-col items-center justify-center space-y-10">

                            {/* Action Buttons - Metro Style: Flat, Bold, Sharp */}
                            <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto justify-center items-stretch">
                                {/* Sanal Mikroskop Button - Metro Blue */}
                                <a
                                    href={currentCase.slideUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center px-8 py-5 font-bold text-lg transition-all shadow-md active:scale-95 w-full md:w-auto min-w-[320px]"
                                    style={{ backgroundColor: '#0072C6', color: '#ffffff', textDecoration: 'none' }}
                                >
                                    <Microscope className="mr-3 h-6 w-6" />
                                    Sanal Mikroskoba Git
                                    <ArrowRight className="ml-3 h-5 w-5" />
                                </a>

                                {/* Reveal Button - Metro Purple */}
                                {!isRevealed && (
                                    <button
                                        onClick={() => setIsRevealed(true)}
                                        className="flex items-center justify-center px-8 py-5 font-bold text-lg transition-all shadow-md active:scale-95 w-full md:w-auto min-w-[320px]"
                                        style={{ backgroundColor: '#603cba', color: '#ffffff' }}
                                    >
                                        <Eye className="mr-3 h-6 w-6" />
                                        Cevabı Göster
                                    </button>
                                )}
                            </div>

                            {!isRevealed && (
                                <p className="text-gray-600 text-sm max-w-md mx-auto italic text-center border-t border-gray-300 pt-4">
                                    En iyi öğrenme deneyimi için lütfen önce vakayı sanal mikroskopta kendiniz değerlendirin.
                                </p>
                            )}

                            {/* Diagnosis Section (Revealed) */}
                            <AnimatePresence>
                                {isRevealed && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="w-full text-left bg-white border-l-8 border-[#008a00] p-8 shadow-xl mt-4"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <span
                                                    className="inline-block px-3 py-1 font-bold text-xs uppercase tracking-wide mb-4"
                                                    style={{ backgroundColor: '#008a00', color: '#ffffff' }}
                                                >
                                                    Doğru Tanı
                                                </span>
                                                <h2 className="text-4xl font-black text-gray-800 mb-6 leading-tight">
                                                    {currentCase.diagnosis}
                                                </h2>
                                                <div className="prose prose-lg text-gray-700 max-w-none">
                                                    <p className="whitespace-pre-line leading-relaxed">
                                                        {currentCase.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </div>

                    {/* Navigation / Footer hints */}
                    {isRevealed && (
                        <div className="mt-8 text-center pb-8">
                            <p className="text-gray-400 italic">
                                Gelecek hafta yeni bir vaka ile görüşmek üzere...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
