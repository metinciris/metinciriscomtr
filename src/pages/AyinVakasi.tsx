import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { motion, AnimatePresence } from 'motion/react';
import { Microscope, ArrowRight, Eye, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export function AyinVakasi() {
    const [isRevealed, setIsRevealed] = useState(false);

    // Case 41 - Enkapsüle papiller tiroid karsinomu
    const currentCase = {
        id: 'case-41',
        title: 'Ayın Vakası',
        tag: 'Tiroid Patolojisi',
        history: 'Tiroid patolojisinde tanıya giden ilk ipucu bazen nükleer ayrıntılar değil, mimaridir. Düşük büyütmede kapsül veya kist duvarına kalın bir sapla tutunan, yukarı doğru dallanarak genişleyen "ağaçsı" bir siluet gösteren bu vakayı sanal mikroskopta inceleyerek tanınızı tahmin edin.',
        diagnosis: 'Enkapsüle papiller tiroid karsinomu: Düşük büyütmede bir “ağaç” silueti',
        description: `Patolojide bazen tanıya giden ilk ipucu nükleer ayrıntılar değil, mimaridir.  
Bu olguda da düşük büyütmede dikkat çeken ilk şey, lezyonun genel siluetidir: kapsül ya da kist duvarına **kalın bir sapla tutunan**, yukarı doğru dallanarak genişleyen bir yapı. İlk bakışta bir **çınar ağacını** andırıyor. Siz bunu başka bir ağaç türüne benzetebilirsiniz; ama her hâlükârda, akılda kalıcı bir “ağaçsı” görünüm sunduğu açık.

## Neden dikkat çekici?

Enkapsüle papiller tiroid karsinomlarında çoğu zaman odak noktası kapsül, invazyon varlığı/yokluğu ve klasik papiller tiroid karsinomu nükleer özellikleridir. Ancak bazı olgularda düşük büyütmedeki genel organizasyon da oldukça öğretici olabilir.

Bu vakada:

- Lezyon belirgin şekilde **enkapsüle / sınırlı** izleniyor.
- Ana kitle, duvara ya da kapsüle **dar olmayan, kalın bir bağlantı alanı** ile oturuyor.
- Yukarı doğru uzanan papiller ve dallanan yapılar, adeta bir **gövde ve taç** oluşturuyor.
- Bu görünüm, lezyonun yalnızca mikroskobik değil, aynı zamanda **görsel hafızada da yer etmesini** sağlıyor.

## Mimari görünüm neden önemli?

Düşük büyütmede dikkatli bakmak, özellikle tiroid lezyonlarında çok değerlidir. Çünkü bazı lezyonlar daha ilk tarama anında:

- papiller mi,
- folliküler mi,
- kistik değişiklik gösteriyor mu,
- kapsülle ilişkisi nasıl,
- intrakistik/pedinküllü bir gelişim paterni var mı

gibi soruların önemli bir kısmını önümüze koyar.

Bu olguda “ağaç” benzeri görünüm, lezyonun:

- **ekzofitik / polipoid benzeri** bir büyüme karakteri taşıdığını,
- **papiller mimarinin baskın** olduğunu,
- ve lezyonun çevre duvarla ilişkisini tek bakışta göstermesi açısından  
öğretici bir örnek oluşturuyor.

## Tanısal açıdan akılda tutulabilecek noktalar

Bu tür bir olguda değerlendirirken klasik başlıklar yine önemini korur:

### 1. Enkapsülasyon
Lezyonun gerçekten iyi sınırlı ya da kapsüllü olup olmadığı dikkatle değerlendirilmelidir.

### 2. Kapsül invazyonu / damar invazyonu
Özellikle enkapsüle tiroid neoplazmlarında tanı ve biyolojik davranış açısından kritik basamaktır.

### 3. Nükleer özellikler
Papiller tiroid karsinomu lehine nükleer berraklaşma, nükleer çentiklenme, nükleer üst üste binme ve psödoinklüzyonlar aranmalıdır.

### 4. Papiller mimari
Papiller yapıların yaygınlığı, dallanma biçimi ve fibro-vasküler kor varlığı değerlendirilmelidir.

### 5. Eşlik eden kistik değişiklik
Bazı olgularda bu tip “saplı” ya da duvara oturan görünüm, kistik boşluk veya genişlemiş bir alanla ilişkili olabilir.

## Görsel hafızada kalan olgular neden değerli?

Patolojide bazı preparatlar yalnızca tanı koydurmaz; aynı zamanda öğretir.  
Bu vaka da onlardan biri. Çünkü:

> Bazen bir lezyonun mimarisi, kitabî bir tariften daha akılda kalıcıdır.

Bir “çınar ağacı” gibi görünen bu enkapsüle papiller tiroid karsinomu, düşük büyütmenin önemini ve mimarinin tanısal düşüncedeki yerini hatırlatıyor.

## Sanal mikroskop

Vakayı sanal mikroskop üzerinden incelemek için:  
[https://metinciris.github.io/gallery-41/](https://metinciris.github.io/gallery-41/)

## Kısa not

Bu tür olgular, tiroid patolojisinde yalnızca nükleer ayrıntılara değil, **genel doku mimarisine** de dikkat etmenin ne kadar öğretici olduğunu gösteriyor.  
Tarama büyütmesinde görülen sıra dışı ama anlamlı şekiller, bazen tanı sürecinin en akılda kalıcı parçaları oluyor.`,
        slides: [
            {
                label: 'Sanal Mikroskop Preparatı',
                url: 'https://metinciris.github.io/gallery-41/',
                thumbnail: 'https://raw.githubusercontent.com/metinciris/gallery-41/main/thumbnail.jpg'
            }
        ]
    };

    return (
        <PageContainer>
            <div className="max-w-4xl mx-auto pb-20">
                {/* Header */}
                <div className="mb-8 border-b-4 border-purple-600 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-light text-gray-800">
                            Ayın <span className="font-bold text-purple-700">Vakası</span>
                        </h1>
                        <p className="text-xl text-gray-500 mt-2 font-light">
                            Kendinizi test edin, tanıyı tahmin edin.
                        </p>
                    </div>
                    {currentCase.tag && (
                        <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-semibold w-fit">
                            <Tag size={16} />
                            <span>{currentCase.tag}</span>
                        </div>
                    )}
                </div>

                {/* Case Card */}
                <div className="bg-white shadow-xl border border-gray-100 overflow-hidden">
                    {/* Image Section - Vertical Stack */}
                    <div className="bg-gray-900 flex flex-col items-center justify-center overflow-hidden group relative">
                        {currentCase.slides.map((slide, idx) => (
                            <a
                                key={idx}
                                href={slide.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full relative block overflow-hidden group"
                            >
                                <img
                                    src={slide.thumbnail}
                                    alt={`${slide.label} thumbnail`}
                                    className="w-full h-auto max-h-[600px] object-contain transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white px-4 py-3 flex justify-between items-center">
                                    <span className="font-bold text-sm md:text-base flex items-center gap-2">
                                        <Microscope size={18} className="text-purple-400" />
                                        {slide.label}
                                    </span>
                                    <span className="text-xs bg-purple-600/90 text-white px-2.5 py-1 rounded font-medium group-hover:bg-purple-500 transition-colors">
                                        Sanal Mikroskopta Aç ↗
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Clinical History Section - Metro Style */}
                    <div
                        className="p-6 md:p-8"
                        style={{ backgroundColor: '#4B0082', color: '#ffffff' }}
                    >
                        <div className="flex items-center gap-3 font-bold uppercase tracking-widest text-sm mb-3" style={{ color: '#e9d5ff' }}>
                            <Microscope size={20} />
                            Vaka Bilgisi & Klinik İpucu
                        </div>
                        <p className="text-xl md:text-2xl font-light leading-relaxed" style={{ color: '#ffffff' }}>
                            {currentCase.history}
                        </p>
                    </div>

                    {/* Interaction Section */}
                    <div className="p-8 md:p-12" style={{ backgroundColor: '#f8fafc' }}>
                        <div className="flex flex-col items-center justify-center space-y-8">

                            {/* Action Buttons */}
                            <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto justify-center items-stretch">
                                {/* Sanal Mikroskop Button */}
                                {currentCase.slides.map((slide, idx) => (
                                    <a
                                        key={idx}
                                        href={slide.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center px-8 py-5 font-bold text-lg transition-all shadow-md active:scale-95 w-full md:w-auto min-w-[280px]"
                                        style={{ backgroundColor: '#0072C6', color: '#ffffff', textDecoration: 'none' }}
                                    >
                                        <Microscope className="mr-3 h-6 w-6" />
                                        Sanal Mikroskop İncele
                                        <ArrowRight className="ml-3 h-5 w-5" />
                                    </a>
                                ))}

                                {/* Reveal Button */}
                                {!isRevealed && (
                                    <button
                                        onClick={() => setIsRevealed(true)}
                                        className="flex items-center justify-center px-8 py-5 font-bold text-lg transition-all shadow-md active:scale-95 w-full md:w-auto min-w-[320px] cursor-pointer"
                                        style={{ backgroundColor: '#603cba', color: '#ffffff' }}
                                    >
                                        <Eye className="mr-3 h-6 w-6" />
                                        Cevabı ve Detayları Göster
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
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        className="w-full text-left bg-white border-l-8 border-emerald-600 p-6 md:p-12 shadow-2xl rounded-r-2xl mt-6"
                                    >
                                        <div className="flex flex-col gap-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-xs uppercase tracking-widest rounded-full bg-emerald-600 text-white shadow-sm">
                                                        ✓ Doğru Tanı
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                        • Patoloji Vaka Analizi
                                                    </span>
                                                </div>

                                                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tight border-b border-gray-100 pb-6">
                                                    {currentCase.diagnosis}
                                                </h2>

                                                <div className="prose-container max-w-none text-gray-800">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        rehypePlugins={[rehypeRaw]}
                                                        components={{
                                                            h1: ({ node, ...props }) => (
                                                                <h1 className="text-3xl font-extrabold text-gray-900 mt-8 mb-4 pb-3 border-b-2 border-purple-200" {...props} />
                                                            ),
                                                            h2: ({ node, ...props }) => (
                                                                <h2 className="text-2xl md:text-3xl font-bold text-purple-950 mt-10 mb-4 pb-2 border-b border-purple-100 flex items-center gap-2" {...props} />
                                                            ),
                                                            h3: ({ node, ...props }) => (
                                                                <h3 className="text-xl font-bold text-purple-900 mt-8 mb-3" {...props} />
                                                            ),
                                                            p: ({ node, ...props }) => (
                                                                <p className="text-base md:text-lg text-gray-700 leading-relaxed my-4 font-normal" {...props} />
                                                            ),
                                                            ul: ({ node, ...props }) => (
                                                                <ul className="my-5 space-y-3 pl-6 list-disc marker:text-purple-600 marker:text-lg" {...props} />
                                                            ),
                                                            ol: ({ node, ...props }) => (
                                                                <ol className="my-5 space-y-3 pl-6 list-decimal marker:text-purple-600 marker:font-bold" {...props} />
                                                            ),
                                                            li: ({ node, ...props }) => (
                                                                <li className="text-base md:text-lg text-gray-800 leading-relaxed pl-1" {...props} />
                                                            ),
                                                            blockquote: ({ node, ...props }) => (
                                                                <blockquote className="my-8 p-6 bg-gradient-to-r from-purple-50 via-purple-50/60 to-indigo-50/40 border-l-4 border-purple-600 rounded-r-2xl text-purple-950 font-medium italic text-lg md:text-xl shadow-xs" {...props} />
                                                            ),
                                                            strong: ({ node, ...props }) => (
                                                                <strong className="font-bold text-purple-950 bg-purple-100/70 px-1.5 py-0.5 rounded text-[0.95em]" {...props} />
                                                            ),
                                                            a: ({ node, href, children, ...props }) => (
                                                                <a
                                                                    href={href}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold underline underline-offset-4 decoration-purple-400 hover:decoration-purple-700 transition-colors"
                                                                    {...props}
                                                                >
                                                                    {children} ↗
                                                                </a>
                                                            )
                                                        }}
                                                    >
                                                        {currentCase.description}
                                                    </ReactMarkdown>
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
                            <p className="text-gray-500 italic">
                                Gelecek ay yeni bir vaka ile görüşmek üzere...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}


