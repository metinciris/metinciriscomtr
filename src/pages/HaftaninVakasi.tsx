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
        imagePlaceholder: 'https://placehold.co/800x400/e2e8f0/1e293b?text=Vaka+Görseli', // Placeholder until real image is provided
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                            <div className="text-white">
                                <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-widest text-sm mb-1">
                                    <Microscope size={18} />
                                    Klinik Öykü
                                </div>
                                <p className="text-lg md:text-2xl font-light leading-snug">
                                    {currentCase.history}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Interaction Section */}
                    <div className="p-6 md:p-10">
                        <div className="flex flex-col items-center justify-center text-center space-y-6">

                            {!isRevealed ? (
                                <div className="space-y-6 py-8">
                                    <div className="p-6 bg-purple-50 rounded-full inline-block mb-4">
                                        <AlertCircle size={48} className="text-purple-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800">Tanınız Nedir?</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        Görüntüyü ve klinik öyküyü inceledikten sonra cevabınızı kontrol etmek için butona tıklayın.
                                    </p>
                                    <button
                                        onClick={() => setIsRevealed(true)}
                                        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-purple-600 font-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600"
                                    >
                                        <Eye className="mr-2 h-5 w-5" />
                                        Tanıyı Göster
                                        <div className="absolute -inset-3 rounded-lg bg-purple-400 opacity-20 group-hover:opacity-40 blur transition duration-200" />
                                    </button>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full text-left bg-green-50/50 border border-green-100 p-6 md:p-8"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                                        <div className="flex-1">
                                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 font-bold text-xs uppercase tracking-wide mb-3 rounded-full">
                                                Doğru Tanı
                                            </span>
                                            <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                                                {currentCase.diagnosis}
                                            </h2>
                                            <div className="prose prose-purple text-gray-700 mb-6">
                                                <p className="whitespace-pre-line leading-relaxed">
                                                    {currentCase.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            <a
                                                href={currentCase.slideUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center px-6 py-4 bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg group"
                                            >
                                                Sanal Mikroskoba Git
                                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                            </a>
                                            <p className="text-xs text-center text-gray-500 mt-2">
                                                Tam ekran görüntüleme için
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
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
