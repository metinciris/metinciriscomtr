import React, { useState, useMemo } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Search, Book, HelpCircle, AlertTriangle, ArrowRight, Microscope, Info, ExternalLink } from 'lucide-react';

interface Term {
    word: string;
    definition: string;
    category?: string;
}

interface FAQ {
    question: string;
    answer: string;
}

export function PatolojiSozlugu() {
    const [searchQuery, setSearchQuery] = useState('');

    const terms: Term[] = useMemo(() => [
        {
            word: 'Adenokarşinom',
            definition: 'Salgı yapan bez yapılarından köken alan kötü huylu (kanser) tümör.',
            category: 'Tümör'
        },
        {
            word: 'Atipi',
            definition: 'Hücrelerin normal görünümlerinden farklılaşması. Kanser anlamına gelmez ancak takip gerektirebilir.',
            category: 'Hücre Yapısı'
        },
        {
            word: 'Benign',
            definition: 'İyi huylu. Yayılma eğilimi göstermeyen, genellikle sınırlı kalan kitle.',
            category: 'Genel'
        },
        {
            word: 'Biyopsi',
            definition: 'Tanı koymak amacıyla vücuttan alınan küçük doku örneği.',
            category: 'İşlem'
        },
        {
            word: 'Diferansiasyon',
            definition: 'Tümör hücrelerinin köken aldığı normal dokuya ne kadar benzediği. İyi diferansiye tümörler normal dokuya daha çok benzer.',
            category: 'Hücre Yapısı'
        },
        {
            word: 'Displazi',
            definition: 'Doku veya hücrelerin normal gelişim ve organizasyonunun bozulması. Kanser öncesi (pre-kanseröz) bir değişiklik olabilir.',
            category: 'Hücre Yapısı'
        },
        {
            word: 'Evre (Stage)',
            definition: 'Kanserin vücuttaki yaygınlık derecesi (tümör boyutu, lenf nodu tutulumu ve uzak sıçrama durumu).',
            category: 'Tanı'
        },
        {
            word: 'İn situ',
            definition: 'Kanserin henüz başladığı dokunun sınırları içinde kalması, derin dokulara yayılmaması.',
            category: 'Tümör'
        },
        {
            word: 'İnflamasyon',
            definition: 'Vücudun yaralanma veya enfeksiyona karşı verdiği iltihabi tepki (yangı).',
            category: 'Genel'
        },
        {
            word: 'İnvazyon',
            definition: 'Tümör hücrelerinin çevredeki normal dokuların içine doğru yayılması.',
            category: 'Tümör'
        },
        {
            word: 'Karsinom',
            definition: 'Vücudun iç veya dış yüzeylerini örten hücrelerden (epitel) gelişen kanser türü.',
            category: 'Tümör'
        },
        {
            word: 'Lezyon',
            definition: 'Doku üzerinde meydana gelen herhangi bir yapısal bozukluk veya hastalık bölgesi.',
            category: 'Genel'
        },
        {
            word: 'Malign',
            definition: 'Kötü huylu. Çevresine yayılma ve başka organlara sıçrama potansiyeli olan tümör.',
            category: 'Genel'
        },
        {
            word: 'Metaplazi',
            definition: 'Bir hücre tipinin yerini başka bir düzgün hücre tipine bırakması. Genellikle bir tahrişe yanıt olarak gelişir.',
            category: 'Hücre Yapısı'
        },
        {
            word: 'Metastaz',
            definition: 'Kanserin başladığı bölgeden vücudun başka bir bölgesine yayılması.',
            category: 'Tümör'
        },
        {
            word: 'Nekroz',
            definition: 'Hücre veya dokuların ölümü.',
            category: 'Genel'
        },
        {
            word: 'Neoplazi',
            definition: 'Kontrolsüz hücre çoğalması sonucu oluşan yeni doku oluşumu (kitle/tümör).',
            category: 'Tümör'
        },
        {
            word: 'Sitoloji',
            definition: 'Hücrelerin tek tek veya küçük gruplar halinde incelendiği bilim dalı (örneğin smear testi).',
            category: 'İşlem'
        }
    ].sort((a, b) => a.word.localeCompare(b.word, 'tr')), []);

    const faqs: FAQ[] = [
        {
            question: "Patoloji raporumda 'Atipi' yazıyor, bu kanser mi demek?",
            answer: "Hayır, atipi doğrudan kanser demek değildir. Sadece hücrelerin normalden biraz farklı göründüğünü ifade eder. Bu değişim bir iltihaba bağlı olabileceği gibi, daha yakından takip edilmesi gereken bir durumun habercisi de olabilir. Mutlaka doktorunuza danışmalısınız."
        },
        {
            question: "Sonuçların çıkması neden uzun sürüyor?",
            answer: "Doku örnekleri alındıktan sonra birçok kimyasal işlemden geçer, ardından ince kesitler alınarak boyanır. Bazı durumlarda kesin tanı için 'immünhistokimya' denilen ek boyamalar veya genetik testler gerekebilir. Bu işlemler titizlikle yapıldığı için birkaç gün veya daha uzun sürebilir."
        },
        {
            question: "Biyopsi yaptırmak kanserin yayılmasına neden olur mu?",
            answer: "Tıbbi çalışmalar, standart biyopsi işlemlerinin kanserin yayılmasına neden olmadığını göstermektedir. Aksine, doğru tanı ve uygun tedavi planı için biyopsi hayati önem taşır."
        },
        {
            question: "Raporumu aldım ama hiçbir şey anlamıyorum, ne yapmalıyım?",
            answer: "Patoloji raporları doktorlar arası iletişim için teknik bir dille yazılır. Raporunuzu yorumlayacak en doğru kişi, biyopsiyi isteyen ve fiziksel muayenenizi yapan klinik doktorunuzdur."
        }
    ];

    const filteredTerms = terms.filter(t =>
        t.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.definition.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PageContainer>
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8E44AD] via-[#9B59B6] to-[#A569BD] text-white p-10 md:p-14 mb-10 shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                    <Book size={300} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                            <Microscope className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase">Hasta Bilgilendirme</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                        Patoloji Sözlüğü
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl font-medium">
                        Patoloji raporlarında sık karşılaşılan terimlerin kısa açıklamaları ve merak edilen sorular.
                    </p>
                </div>
            </div>

            {/* Critical Disclaimer */}
            <div className="bg-amber-50 border-l-8 border-amber-500 p-8 rounded-2xl mb-12 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-amber-100 p-3 rounded-full flex-shrink-0">
                        <AlertTriangle className="text-amber-600 w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-amber-900 text-xl font-bold mb-2">Çok Önemli Not</h2>
                        <p className="text-amber-800 text-lg leading-relaxed">
                            Bu sözlükteki bilgiler sadece genel bilgilendirme amaçlıdır. Patoloji raporları bir bütündür ve tek bir kelime üzerinden yorumlanamaz.
                            <strong> Sonuçlarınızı mutlaka biyopsiyi alan ve tedavinizi planlayan doktorunuzla görüşmelisiniz.</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Dictionary Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Book className="text-[#8E44AD] w-8 h-8" />
                                <h2 className="text-2xl font-bold text-gray-800 m-0">Terimler Sözlüğü</h2>
                            </div>
                            <div className="text-sm text-gray-500 font-medium">
                                {filteredTerms.length} terim listeleniyor
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-8">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Terim veya açıklama ara..."
                                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8E44AD]/20 focus:border-[#8E44AD] transition-all text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Terms List */}
                        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredTerms.map((term, index) => (
                                <div
                                    key={index}
                                    className="p-6 rounded-2xl border border-gray-50 bg-white hover:bg-[#8E44AD]/5 hover:border-[#8E44AD]/20 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-xl font-bold text-[#8E44AD] m-0 group-hover:scale-[1.01] transition-transform">
                                            {term.word}
                                        </h3>
                                        {term.category && (
                                            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                                                {term.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 leading-relaxed m-0 text-lg italic">
                                        {term.definition}
                                    </p>
                                </div>
                            ))}
                            {filteredTerms.length === 0 && (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 text-lg">Eşleşen terim bulunamadı.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="lg:col-span-1">
                    <div className="bg-[#1e293b] rounded-3xl p-8 text-white shadow-xl sticky top-24">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                            <HelpCircle className="text-[#A569BD] w-8 h-8" />
                            <h2 className="text-2xl font-bold text-white m-0">Sık Sorulanlar</h2>
                        </div>

                        <div className="space-y-8">
                            {faqs.map((faq, index) => (
                                <div key={index} className="space-y-3">
                                    <h4 className="text-lg font-bold text-[#A569BD] flex items-start gap-2">
                                        <span className="opacity-50">Q:</span>
                                        {faq.question}
                                    </h4>
                                    <p className="text-slate-300 leading-relaxed text-base pl-6 relative">
                                        <span className="absolute left-0 top-0 opacity-20 text-2xl font-serif">"</span>
                                        {faq.answer}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
                            <h4 className="flex items-center gap-2 text-white mb-3">
                                <Info size={18} className="text-[#A569BD]" />
                                Hala Sorularınız mı Var?
                            </h4>
                            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                                Raporunuzla ilgili detaylı değerlendirme için klinik doktorunuzla randevu planlamayı unutmayın.
                            </p>
                            <button
                                onClick={() => window.location.hash = 'iletisim'}
                                className="w-full flex items-center justify-center gap-2 bg-[#8E44AD] hover:bg-[#9B59B6] text-white py-3 rounded-xl font-bold transition-all group"
                            >
                                <span>İletişim</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => window.location.hash = 'biyopsi-sonucu'}
                    className="flex items-center justify-between p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8E44AD]/30 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                            < Microscope size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">Biyopsi Sonucu</h3>
                            <p className="text-gray-500 m-0">Rapor sorgulama sayfası</p>
                        </div>
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-[#8E44AD] group-hover:translate-x-1 transition-all" />
                </button>

                <a
                    href="https://enabiz.gov.tr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#0078D4]/30 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-4 rounded-2xl text-[#0078D4] group-hover:scale-110 transition-transform">
                            <ExternalLink size={28} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">E-Nabız Portalı</h3>
                            <p className="text-gray-500 m-0">Resmi sağlık portalı</p>
                        </div>
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-[#0078D4] group-hover:translate-x-1 transition-all" />
                </a>
            </div>
        </PageContainer>
    );
}
