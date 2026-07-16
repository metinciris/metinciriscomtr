import React, { useState, useMemo } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Search, Book, HelpCircle, AlertTriangle, ArrowRight, Microscope, Info, ExternalLink, Hash, CheckCircle2, ShieldCheck, Wand2 } from 'lucide-react';

interface Term {
    word: string;
    definition: string;
    category?: string;
}

interface FAQ {
    question: string;
    answer: string;
}

interface PatolojiSozluguProps {
    onNavigate?: (page: string) => void;
}

export function PatolojiSozlugu({ onNavigate }: PatolojiSozluguProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [reportText, setReportText] = useState('');
    const [matchedTerms, setMatchedTerms] = useState<Term[]>([]);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        } else {
            window.location.hash = page;
        }
    };

    const terms: Term[] = useMemo(() => [
        {
            word: 'Adenokarsinom',
            definition: 'Salgı yapan bez yapılarından köken alan kötü huylu (kanser) tümör.',
            category: 'Tümör'
        },
        {
            word: 'Abse',
            definition: 'İltihap hücreleri ve ölü doku artıklarından oluşan irin birikimi.',
            category: 'Enfeksiyon'
        },
        {
            word: 'Atipi / Atipik',
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
            word: 'Hiperplazi',
            definition: 'Hücre sayısının normalden fazla artması. Genellikle bir uyarana (hormonal vb.) yanıt olarak gelişir.',
            category: 'Hücre Yapısı'
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
            word: 'Kist',
            definition: 'İçerisinde sıvı veya yarı katı madde bulunan, etrafı ince bir zarla çevrili keselere denir.',
            category: 'Genel'
        },
        {
            word: 'Lenfovasküler İnvazyon',
            definition: 'Tümör hücrelerinin kan veya lenf damarlarına girmesi. Yayılma riski açısından önemlidir.',
            category: 'Tanı'
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
            word: 'Mitoz',
            definition: 'Hücre bölünmesi hızı. Kanserli dokularda mitoz sayısının artması genellikle agresif seyirle ilişkilidir.',
            category: 'Hücre Yapısı'
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
            word: 'Nükleer Derece (Grade)',
            definition: 'Hücre çekirdeğinin görüntüsüne göre belirlenen anormallik derecesi. Yüksek derece genellikle hızlı büyümeyi gösterir.',
            category: 'Tanı'
        },
        {
            word: 'Perinöral İnvazyon',
            definition: 'Tümör hücrelerinin sinir kılıfı çevresine yayılması.',
            category: 'Tanı'
        },
        {
            word: 'Polip',
            definition: 'Organların mukoza adı verilen iç yüzeylerinden dışarıya doğru sarkan saplı veya sapsız doku çıkıntıları.',
            category: 'Genel'
        },
        {
            word: 'Prognoz',
            definition: 'Hastalığın seyri ve iyileşme ihtimali hakkındaki öngörü.',
            category: 'Genel'
        },
        {
            word: 'Reaktif',
            definition: 'Hücrelerin bir hasara (tahriş, iltihap vb.) yanıt olarak gösterdiği geçici ve iyi huylu değişiklikler.',
            category: 'Hücre Yapısı'
        },
        {
            word: 'Rezeksiyon',
            definition: 'Bir organın veya dokunun bir kısmının veya tamamının ameliyatla çıkarılması.',
            category: 'İşlem'
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
            answer: "Tıbbi çalışmalar, standart biyopsi işlemlerinin birçok kanser türünde, kanserin yayılmasına neden olmadığını göstermektedir. Aksine, doğru tanı ve uygun tedavi planı için biyopsi hayati önem taşır."
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

    const analyzeReport = () => {
        if (!reportText.trim()) {
            setHasAnalyzed(false);
            setMatchedTerms([]);
            return;
        }
        
        // Türkçe karakterleri de dikkate alarak küçültelim
        const lowerReport = reportText.toLocaleLowerCase('tr-TR');
        
        const matches = terms.filter(t => {
            // "Atipi / Atipik" gibi ifadeleri ayır
            const parts = t.word.split('/').map(p => p.trim().toLocaleLowerCase('tr-TR'));
            return parts.some(part => lowerReport.includes(part));
        });
        
        setMatchedTerms(matches);
        setHasAnalyzed(true);
    };

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
                    <div className="bg-amber-100 p-3 rounded-full flex-shrink-0 mt-1">
                        <AlertTriangle className="text-amber-600 w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-amber-900 text-xl font-bold mb-2">Çok Önemli Not!</h2>
                        <p className="text-amber-800 text-lg leading-relaxed">
                            Bu sözlükteki bilgiler ve otomatik analiz aracı sadece genel bilgilendirme amaçlıdır. Patoloji raporları bir bütündür ve tek bir kelime üzerinden yorumlanamaz.
                            <strong className="block mt-2 bg-amber-200/50 px-2 py-1 rounded inline-block"> Sonuçlarınızı mutlaka biyopsiyi alan ve tedavinizi planlayan doktorunuzla görüşmelisiniz.</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* Smart Report Analyzer Section */}
            <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-200 mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Wand2 size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 m-0">Otomatik Rapor Açıklayıcı</h2>
                            <p className="text-slate-500 mt-1">Raporunuzdaki karmaşık tıbbi terimleri saniyeler içinde analiz edin.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm text-sm font-medium">
                        <ShieldCheck size={18} />
                        <span>%100 Gizli - Sunucuya veri gönderilmez, cihazınızda işlenir.</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Area */}
                    <div className="space-y-4">
                        <label htmlFor="reportInput" className="block font-bold text-slate-700">
                            Patoloji raporunuzu buraya yapıştırın:
                        </label>
                        <textarea
                            id="reportInput"
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            placeholder="Makroskopi, mikroskopi veya tanı bölümündeki metni buraya yapıştırabilirsiniz..."
                            className="w-full h-48 md:h-64 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
                        ></textarea>
                        <button
                            onClick={analyzeReport}
                            disabled={!reportText.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                            <Wand2 size={20} />
                            Raporu Analiz Et
                        </button>
                    </div>

                    {/* Output Area */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full max-h-[400px] overflow-y-auto custom-scrollbar">
                        {!hasAnalyzed ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4 py-12">
                                <Book size={48} className="mb-4 opacity-50" />
                                <p className="font-medium text-lg text-slate-500">Raporunuzu yapıştırıp "Analiz Et" butonuna tıklayın.</p>
                                <p className="text-sm mt-2">Raporda geçen terimlerin açıklamaları burada listelenecektir.</p>
                            </div>
                        ) : matchedTerms.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-4 py-12">
                                <CheckCircle2 size={48} className="mb-4 text-emerald-400" />
                                <p className="font-medium text-lg">Sözlüğümüzde yer alan kritik bir terim bulunamadı.</p>
                                <p className="text-sm mt-2">Tüm detaylar için doktorunuza danışınız.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                                    Bulunan Terimler
                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{matchedTerms.length} Eşleşme</span>
                                </h3>
                                {matchedTerms.map((term, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-indigo-700">{term.word}</h4>
                                            {term.category && (
                                                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                    {term.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{term.definition}</p>
                                    </div>
                                ))}
                            </div>
                        )}
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
                            <div className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold">
                                {filteredTerms.length} Terim
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-8">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-[#8E44AD]" />
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
                        <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredTerms.map((term, index) => (
                                <div
                                    key={index}
                                    className="p-6 rounded-2xl border border-gray-50 bg-white hover:bg-[#8E44AD]/5 hover:border-[#8E44AD]/20 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#8E44AD] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <h3 className="text-xl font-bold text-[#8E44AD] m-0 group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                                            <Hash size={16} className="text-gray-300" />
                                            {term.word}
                                        </h3>
                                        {term.category && (
                                            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                                                {term.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 leading-relaxed m-0 text-lg">
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

                {/* FAQ Section - Lightened as requested */}
                <div className="lg:col-span-1">
                    <div className="bg-[#f8fafc] rounded-3xl p-8 border border-slate-200 shadow-sm sticky top-24">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
                            <div className="bg-[#8E44AD] p-2 rounded-lg text-white">
                                <HelpCircle size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 m-0">Sık Sorulanlar</h2>
                        </div>

                        <div className="space-y-10">
                            {faqs.map((faq, index) => (
                                <div key={index} className="space-y-3">
                                    <h4 className="text-lg font-bold text-[#8E44AD] flex items-start gap-2 leading-snug">
                                        <CheckCircle2 size={18} className="text-[#8E44AD] mt-1 flex-shrink-0" />
                                        {faq.question}
                                    </h4>
                                    <p className="text-slate-600 leading-relaxed text-base pl-7">
                                        {faq.answer}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="flex items-center gap-2 text-slate-800 mb-3 font-bold">
                                <Info size={18} className="text-[#8E44AD]" />
                                Hala Sorularınız mı Var?
                            </h4>
                            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                                Raporunuzla ilgili detaylı değerlendirme için klinik doktorunuzla randevu planlamayı unutmayın.
                            </p>
                            <button
                                onClick={() => handleNavigate('iletisim')}
                                className="w-full flex items-center justify-center gap-2 bg-[#8E44AD] hover:bg-[#9B59B6] text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#8E44AD]/20 group"
                            >
                                <span>İletişime Geçin</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => handleNavigate('biyopsi-sonucu')}
                    className="flex items-center justify-between p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8E44AD]/30 transition-all group"
                >
                    <div className="flex items-center gap-4 text-left">
                        <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                            < Microscope size={28} />
                        </div>
                        <div>
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
                    <div className="flex items-center gap-4 text-left">
                        <div className="bg-blue-50 p-4 rounded-2xl text-[#0078D4] group-hover:scale-110 transition-transform">
                            <ExternalLink size={28} />
                        </div>
                        <div>
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
