import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { Microscope, ArrowRight, Eye, AlertCircle } from 'lucide-react';

export function HaftaninVakasi() {
    const [isRevealed, setIsRevealed] = useState(false);

    // Mock Data - Case 07 from User's Gallery
    const currentCase = {
        id: 'case-07',
        title: 'Haftanın Vakası #1',
        history: 'Tiroidde nodül saptanan hastadan yapılan rezeksiyon materyali.',
        imagePlaceholder: 'https://raw.githubusercontent.com/metinciris/galeri/main/images/07.jpg', // Attempting to use likely path, fallback to placeholder if needed
        diagnosis: 'Cribriform-morular Thyroid Carcinoma',
        description: `Tiroidin oldukça nadir görülen bir tümörüdür. 
    Tanısal İpuçları:
    - Belirgin papiller yapıların yokluğu.
    - Karakteristik kribriform (elek benzeri) ve morular (topluluk oluşturan) büyüme paterni.
    - İmmünohistokimyasal olarak Tiroglobulin negatifliği (önemli bir tuzak!).
    - Beta-katenin ile nükleer ve sitoplazmik pozitiflik (Wnt yolağı aktivasyonu).
    - Sıklıkla FAP (Familyal Adenomatöz Polipozis) ile ilişkilidir.`,
        slideUrl: 'https://metinciris.github.io/gallery-07/',
    };

    return (
        <PageContainer>
            <div className="max-w-4xl mx-auto pb-20">
                {/* Header */}
                <div className="mb-8 border-b-4 border-purple-600 pb-4">
                    <h1 className="text-4xl md:text-5xl font-light text-gray-800">
                        Haftanın <span className="font-bold text-purple-700">Vakası</span>
                    </h1>
                    <p className="text-xl text-gray-500 mt-2 font-light">
                        Kendinizi test edin, tanıyı tahmin edin.
                    </p>
                </div>

                {/* Case Card */}
                <div className="bg-white shadow-xl border border-gray-100 overflow-hidden">
                    {/* Image Section */}
                    <div className="relative h-64 md:h-96 bg-gray-200 flex items-center justify-center overflow-hidden group">
                        <img
                            src={currentCase.imagePlaceholder}
                            alt="Case Preview"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Overlay Removed */}
                    </div>

                    {/* Clinical History Section - Now Below Image */}
                    <div className="bg-purple-900 text-white p-6 md:p-8">
                        <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm mb-3 text-purple-300">
                            <Microscope size={18} />
                            Klinik Öykü
                        </div>
                        <p className="text-xl md:text-2xl font-light leading-relaxed">
                            {currentCase.history}
                        </p>
                    </div>

                    {/* Interaction Section */}
                    {/* Interaction Section */}
                    <div className="p-6 md:p-10 bg-gray-50">
                        <div className="flex flex-col items-center justify-center text-center space-y-8">

                            {/* Action Buttons Row */}
                            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto justify-center items-center">
                                {/* Always visible Virtual Slide Link */}
                                <a
                                    href={currentCase.slideUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg rounded-lg group w-full md:w-auto"
                                >
                                    <Microscope className="mr-2 h-5 w-5" />
                                    Sanal Mikroskoba Git
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </a>

                                {/* Reveal Button */}
                                {!isRevealed && (
                                    <button
                                        onClick={() => setIsRevealed(true)}
                                        className="flex items-center justify-center px-8 py-4 bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg rounded-lg w-full md:w-auto"
                                    >
                                        <Eye className="mr-2 h-5 w-5" />
                                        Cevabı Merak Ediyorsanız Tıklayın
                                    </button>
                                )}
                            </div>

                            {!isRevealed && (
                                <p className="text-gray-500 text-sm max-w-md mx-auto italic">
                                    Önce sanal mikroskopta vakayı değerlendirmeniz önerilir.
                                </p>
                            )}

                            {/* Diagnosis Section (Revealed) */}
                            <AnimatePresence>
                                {isRevealed && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="w-full text-left bg-green-50 border border-green-200 p-6 md:p-8 rounded-xl shadow-inner mt-6"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 font-bold text-xs uppercase tracking-wide mb-3 rounded-full">
                                                    Doğru Tanı
                                                </span>
                                                <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                                                    {currentCase.diagnosis}
                                                </h2>
                                                <div className="prose prose-purple text-gray-700">
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
                </div>

                {/* Navigation / Footer hints */}
                {isRevealed && (
                    <div className="mt-8 text-center">
                        <p className="text-gray-400 italic">
                            Gelecek hafta yeni bir vaka ile görüşmek üzere...
                        </p>
                    </div>
                )}

            </div>
        </PageContainer>
    );
}
