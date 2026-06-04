import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, ExternalLink, Clock, BookOpen, Loader2, AlertCircle, RefreshCw, FileText, Link2, CheckCircle, Trash2, Plus, Sliders, Languages } from 'lucide-react';
import { pubmedDailyService, Article } from '../services/pubmedDailyService';

// Default Pathology journals to track
const DEFAULT_PATHOLOGY_JOURNALS = [
    'Modern Pathology',
    'Histopathology',
    'American Journal of Surgical Pathology',
    'Human Pathology',
    'Virchows Archiv',
    'Archives of Pathology Laboratory Medicine',
    'Annals of Diagnostic Pathology',
    'International Journal of Surgical Pathology',
    'Pathology Research and Practice',
    'Diagnostic Pathology',
    'Journal of Pathology',
    'RCPA Pathology',
    'APMIS',
    'Pathology International',
    'American Journal of Clinical Pathology',
    'Turk Patoloji Derg'
];

// Article Card Component with improved readability
function ArticleCard({ article }: { article: Article }) {
    const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`;
    const doiUrl = article.doi ? `https://doi.org/${article.doi}` : null;
    const [showAbstract, setShowAbstract] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedAbstract, setTranslatedAbstract] = useState<string | null>(null);
    const [translationError, setTranslationError] = useState<string | null>(null);

    const handleTranslate = async () => {
        if (!article.abstract) return;
        setIsTranslating(true);
        setTranslationError(null);
        try {
            // Clean HTML tag entities if any
            const cleanText = article.abstract.replace(/<[^>]*>/g, '');
            // Limit characters to translate to fit MyMemory limit (around 1000 characters)
            const textToTranslate = cleanText.length > 800 ? cleanText.substring(0, 800) + '...' : cleanText;
            
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|tr`);
            if (!response.ok) throw new Error('API hatası');
            const data = await response.json();
            
            if (data.responseData && data.responseData.translatedText) {
                setTranslatedAbstract(data.responseData.translatedText);
            } else {
                throw new Error('Çeviri alınamadı');
            }
        } catch (err) {
            console.error('Translation error:', err);
            setTranslationError('Otomatik çeviri limitine ulaşıldı veya bir hata oluştu.');
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
        >
            <div>
                {/* Journal Badge */}
                <div className="mb-4">
                    <span
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                    >
                        {article.journal}
                    </span>
                </div>

                {/* Title - larger and more readable */}
                <h3
                    className="font-bold text-slate-900 mb-4"
                    style={{ fontSize: '1.125rem', lineHeight: '1.6' }}
                >
                    {article.title}
                </h3>

                {/* Authors */}
                {article.authors.length > 0 && (
                    <p className="text-slate-600 text-sm mb-4" style={{ lineHeight: '1.5' }}>
                        <span className="font-medium text-slate-700">Yazarlar: </span>
                        {article.authors.join(', ')}
                        {article.authors.length >= 5 && ' et al.'}
                    </p>
                )}

                {/* Publication Date */}
                {article.pubDate && (
                    <p className="text-slate-500 text-sm mb-4">
                        <span className="font-medium">Yayın Tarihi: </span>
                        {article.pubDate}
                    </p>
                )}

                {/* Abstract Toggle */}
                {article.abstract && (
                    <div className="mb-4">
                        <button
                            onClick={() => setShowAbstract(!showAbstract)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                        >
                            <FileText size={16} />
                            {showAbstract ? 'Özeti Gizle' : 'Özeti Göster'}
                        </button>

                        {showAbstract && (
                            <div
                                className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
                                style={{ fontSize: '0.9rem', lineHeight: '1.7', color: '#374151' }}
                            >
                                <div className="mb-4 text-slate-700">{article.abstract}</div>
                                
                                {/* Translation interface */}
                                <div className="border-t border-slate-200/80 pt-3 mt-3">
                                    {!translatedAbstract && !isTranslating && (
                                        <button
                                            onClick={handleTranslate}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold"
                                        >
                                            <Languages size={14} />
                                            Türkçe'ye Çevir (BETA)
                                        </button>
                                    )}
                                    
                                    {isTranslating && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium py-1">
                                            <Loader2 size={14} className="animate-spin text-blue-500" />
                                            Türkçe'ye çevriliyor...
                                        </div>
                                    )}
                                    
                                    {translatedAbstract && (
                                        <div className="mt-2 bg-blue-50/50 border border-blue-100/50 p-3 rounded-lg">
                                            <div className="flex items-center gap-1.5 text-xs text-blue-700 font-bold mb-1">
                                                <Languages size={14} />
                                                Türkçe Çeviri:
                                            </div>
                                            <p className="text-slate-800 text-sm leading-relaxed">{translatedAbstract}</p>
                                        </div>
                                    )}
                                    
                                    {translationError && (
                                        <div className="mt-2">
                                            <p className="text-xs text-amber-600 mb-1.5">{translationError}</p>
                                            <a
                                                href={`https://translate.google.com/?sl=en&tl=tr&text=${encodeURIComponent(article.abstract)}&op=translate`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold"
                                            >
                                                <ExternalLink size={12} />
                                                Google Translate ile Çevir (Yeni Sekme)
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Links Section */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100 mt-auto">
                {/* PubMed Link */}
                <a
                    href={pubmedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <ExternalLink size={16} />
                    PubMed
                </a>

                {/* DOI Link */}
                {doiUrl && (
                    <a
                        href={doiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                        <Link2 size={16} />
                        DOI
                    </a>
                )}

                {/* PMID Badge */}
                <span className="inline-flex items-center px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm ml-auto">
                    PMID: {article.pmid}
                </span>
            </div>
        </div>
    );
}

// Skeleton Loader Component for a single article card
function ArticleCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 animate-pulse flex flex-col justify-between h-[320px]">
            <div>
                {/* Journal Badge placeholder */}
                <div className="mb-4">
                    <div className="h-6 w-32 bg-slate-200 rounded-full"></div>
                </div>
                
                {/* Title placeholder */}
                <div className="space-y-2 mb-4">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
                
                {/* Authors placeholder */}
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                
                {/* Pub Date placeholder */}
                <div className="h-3 bg-slate-200 rounded w-1/3 mb-4"></div>
            </div>
            
            {/* Buttons placeholder */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
                <div className="h-9 w-20 bg-slate-200 rounded-lg"></div>
                <div className="h-9 w-16 bg-slate-200 rounded-lg"></div>
                <div className="h-9 w-24 bg-slate-200 rounded-lg ml-auto"></div>
            </div>
        </div>
    );
}

// Skeleton feed loader
function FeedSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
        </div>
    );
}

// Error Message Component
function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100" data-nosnippet>
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Güncel Makaleler Hazırlanıyor</h3>
            <p className="text-red-600 mb-4">{message}</p>
            <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
                <RefreshCw size={16} />
                Tekrar Dene
            </button>
        </div>
    );
}

interface DayGroup {
    date: Date;
    articles: Article[];
}

export function PubMedMakaleTakvim() {
    const [loadedDays, setLoadedDays] = useState<DayGroup[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [initialError, setInitialError] = useState<string | null>(null);
    const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
    const [lastCheckedDate, setLastCheckedDate] = useState<Date>(new Date());
    const [hasMore, setHasMore] = useState(true);
    const [currentCheckingDate, setCurrentCheckingDate] = useState<Date | null>(null);

    // Dynamic user-customized journals state
    const [journals, setJournals] = useState<string[]>(() => {
        const saved = localStorage.getItem('pubmed_journals');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                console.error('Failed to parse saved journals:', e);
            }
        }
        return DEFAULT_PATHOLOGY_JOURNALS;
    });
    const [showSettings, setShowSettings] = useState(false);
    const [newJournal, setNewJournal] = useState('');

    // Initial search: find the first day with articles (check up to 30 days)
    const initializeApp = useCallback(async () => {
        setInitialLoading(true);
        setInitialError(null);
        setLoadedDays([]); // Clear previous feed on re-initialization
        const today = new Date();
        const maxDaysToCheck = 30;

        for (let i = 0; i < maxDaysToCheck; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            setCurrentCheckingDate(checkDate);

            try {
                const result = await pubmedDailyService.searchArticles(journals, checkDate);
                if (result.total > 0 && result.articles.length > 0) {
                    setLoadedDays([{ date: checkDate, articles: result.articles }]);
                    setLastCheckedDate(checkDate);
                    setInitialLoading(false);
                    setCurrentCheckingDate(null);
                    return;
                }
            } catch (err) {
                console.error('Initial load checking error for date:', checkDate, err);
                if (i === 0) {
                    setInitialError('PubMed bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
                    setInitialLoading(false);
                    setCurrentCheckingDate(null);
                    return;
                }
            }
        }

        // If we searched 30 days and found nothing
        setLoadedDays([]);
        setLastCheckedDate(today);
        setInitialLoading(false);
        setHasMore(false);
        setCurrentCheckingDate(null);
    }, [journals]);

    // Load more days: search backwards from the day before lastCheckedDate
    const loadMoreDays = useCallback(async () => {
        if (isLoadingMore || !hasMore || initialLoading) return;
        setIsLoadingMore(true);
        setLoadMoreError(null);

        const maxDaysToCheck = 30;
        const baseDate = new Date(lastCheckedDate);

        for (let i = 1; i <= maxDaysToCheck; i++) {
            const checkDate = new Date(baseDate);
            checkDate.setDate(checkDate.getDate() - i);
            setCurrentCheckingDate(checkDate);

            try {
                const result = await pubmedDailyService.searchArticles(journals, checkDate);
                if (result.total > 0 && result.articles.length > 0) {
                    setLoadedDays(prev => [...prev, { date: checkDate, articles: result.articles }]);
                    setLastCheckedDate(checkDate);
                    setIsLoadingMore(false);
                    setCurrentCheckingDate(null);
                    return;
                }
            } catch (err) {
                console.error('Error checking date:', checkDate, err);
                setLoadMoreError('Sonraki makaleler yüklenirken bir bağlantı sorunu oluştu.');
                setIsLoadingMore(false);
                setCurrentCheckingDate(null);
                return;
            }
        }

        // If we searched 30 days and found nothing
        setHasMore(false);
        setIsLoadingMore(false);
        setCurrentCheckingDate(null);
    }, [lastCheckedDate, isLoadingMore, hasMore, initialLoading, journals]);

    useEffect(() => {
        initializeApp();
    }, [initializeApp]);

    // Intersection Observer sentinel
    const observer = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (initialLoading || isLoadingMore || !hasMore || loadMoreError || initialError) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting) {
                        loadMoreDays();
                    }
                },
                { rootMargin: '200px' } // Load a bit before reaching the bottom for seamless feel
            );

            if (node) observer.current.observe(node);
        },
        [initialLoading, isLoadingMore, hasMore, loadMoreError, initialError, loadMoreDays]
    );

    useEffect(() => {
        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const handleRetryInitial = () => {
        initializeApp();
    };

    const handleSearchFurther = () => {
        setHasMore(true);
        setHasMore(prev => {
            if (!prev) {
                setTimeout(() => {
                    loadMoreDays();
                }, 50);
            }
            return true;
        });
    };

    return (
        <PageContainer>
            {/* SEO-friendly description for bots at the very top */}
            <div
                aria-hidden="false"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: '0',
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: '0'
                }}
            >
                <h2>PubMed Patoloji Günlük Makale Takibi ve Literatür Arşivi</h2>
                <p>
                    Prof. Dr. Metin Çiriş tarafından sunulan bu akademik platform, dünya çapındaki saygın patoloji dergilerinden (Modern Pathology, Histopathology, AJSP, Human Pathology, Virchows Archiv ve daha fazlası) en güncel bilimsel makaleleri günlük olarak takip etmenizi sağlar. PubMed verilerini canlı olarak filtreleyen sistemimiz, tıp profesyonelleri, patoloji asistanları ve akademisyenler için en doğru ve güncel literatür akışını sunar. Geçmişe dönük makale araması yapabilir, günlük olarak yayınlanan patoloji çalışmalarını Türkçe özetleriyle inceleyebilirsiniz.
                </p>
                <nav>
                    <ul>
                        {journals.map(j => <li key={j}>{j}</li>)}
                    </ul>
                </nav>
            </div>

            {/* Hero Banner */}
            <div
                className="relative overflow-hidden p-8 md:p-12 mb-10 rounded-3xl shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
                    color: '#ffffff'
                }}
            >
                {/* Decorative elements */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '256px',
                    height: '256px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    transform: 'translate(50%, -50%)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '192px',
                    height: '192px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    transform: 'translate(-50%, 50%)'
                }}></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '16px',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <Calendar size={32} style={{ color: '#ffffff' }} />
                        </div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            margin: 0
                        }}>PubMed Patoloji Günlük Makale Takibi</h1>
                    </div>
                    <p style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '1.125rem',
                        maxWidth: '42rem',
                        lineHeight: '1.625',
                        margin: 0
                    }}>
                        Dünyaca ünlü patoloji dergilerinden günlük makale takibi - Tarihe göre kesintisiz akış
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                        <Clock size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                        <p style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.875rem',
                            margin: 0
                        }}>
                            PubMed E-utilities API kullanılarak canlı veri çekimi yapılmaktadır
                        </p>
                    </div>
                </div>
            </div>

            {/* Feed Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Canlı Patoloji Akışı</h2>
                        <p className="text-xs text-slate-500">En güncel yayınlardan geriye doğru kesintisiz akış</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-auto flex-wrap">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm border ${
                            showSettings 
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        <Sliders size={16} />
                        Dergileri Yönet ({journals.length})
                    </button>
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-semibold text-emerald-800">
                            Aktif Takip
                        </span>
                    </div>
                </div>
            </div>

            {/* Expandable settings panel for managing journals */}
            {showSettings && (
                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200/80 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                            <Sliders size={18} className="text-blue-600" />
                            Takip Edilen Dergileri Özelleştir
                        </h3>
                        <button
                            onClick={() => {
                                if (window.confirm('Dergi listenizi varsayılan patoloji dergileri listesine sıfırlamak istiyor musunuz?')) {
                                    setJournals(DEFAULT_PATHOLOGY_JOURNALS);
                                    localStorage.setItem('pubmed_journals', JSON.stringify(DEFAULT_PATHOLOGY_JOURNALS));
                                }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:border-slate-300 transition-colors"
                        >
                            <RefreshCw size={12} />
                            Varsayılana Sıfırla
                        </button>
                    </div>

                    {/* Add new journal form */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!newJournal.trim()) return;
                            const trimmed = newJournal.trim();
                            if (journals.includes(trimmed)) {
                                alert('Bu dergi zaten listenizde ekli.');
                                return;
                            }
                            const updated = [...journals, trimmed];
                            setJournals(updated);
                            localStorage.setItem('pubmed_journals', JSON.stringify(updated));
                            setNewJournal('');
                        }}
                        className="flex gap-2 mb-4"
                    >
                        <input
                            type="text"
                            placeholder="Yeni dergi adı yazın (örn: Nature Medicine veya Lancet Oncology)"
                            value={newJournal}
                            onChange={(e) => setNewJournal(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold transition-colors shadow-md"
                        >
                            <Plus size={16} />
                            Ekle
                        </button>
                    </form>

                    {/* Active journals list tag pool */}
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 bg-white rounded-xl border border-slate-100 p-3">
                        {journals.map((journal) => (
                            <div
                                key={journal}
                                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium hover:border-slate-300 hover:bg-slate-100 transition-all"
                            >
                                <span>{journal}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (journals.length <= 1) {
                                            alert('En az bir dergi takip edilmelidir.');
                                            return;
                                        }
                                        const updated = journals.filter(j => j !== journal);
                                        setJournals(updated);
                                        localStorage.setItem('pubmed_journals', JSON.stringify(updated));
                                    }}
                                    className="text-slate-400 hover:text-red-500 rounded-full p-0.5 hover:bg-slate-200 transition-colors"
                                    title={`${journal} dergisini çıkar`}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                        ℹ️ Dergi listeniz tarayıcınızın belleğine kaydedilir ve değişiklik yapıldığında akış en baştan taranır.
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="min-h-96">
                {initialLoading && (
                    <div className="space-y-6 py-6">
                        <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center gap-3 text-slate-600 font-medium">
                            <Loader2 size={20} className="animate-spin text-blue-600" />
                            {currentCheckingDate ? `${formatDate(currentCheckingDate)} tarihi taranıyor...` : 'İlk makaleler yükleniyor...'}
                        </div>
                        <FeedSkeleton />
                    </div>
                )}

                {initialError && (
                    <ErrorMessage message={initialError} onRetry={handleRetryInitial} />
                )}

                {!initialLoading && !initialError && loadedDays.length === 0 && (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
                        <BookOpen size={64} className="mx-auto text-slate-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Makale Bulunamadı
                        </h3>
                        <p className="text-gray-600 text-lg mb-4">
                            Son 30 gün içinde seçilen dergilerde yayınlanan makale bulunamadı.
                        </p>
                        <button
                            onClick={handleSearchFurther}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors shadow-md"
                        >
                            Geçmişe Doğru Tara
                        </button>
                    </div>
                )}

                {!initialLoading && !initialError && loadedDays.length > 0 && (
                    <div className="space-y-12">
                        {loadedDays.map((dayGroup) => (
                            <div key={dayGroup.date.toDateString()} className="border-b border-slate-100 pb-10 last:border-0 last:pb-0">
                                {/* Day Header */}
                                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100/60">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Calendar size={18} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">
                                        {formatDate(dayGroup.date)}
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                        {dayGroup.articles.length} Makale
                                    </span>
                                    {isToday(dayGroup.date) && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            Bugün
                                        </span>
                                    )}
                                </div>

                                {/* Articles Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {dayGroup.articles.map((article, index) => (
                                        <ArticleCard key={`${article.pmid}-${index}`} article={article} />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Infinite Scroll Load More Status / Sentinel */}
                        <div ref={sentinelRef} className="py-8 mt-4 border-t border-slate-100/40">
                            {isLoadingMore && (
                                <div className="space-y-6 mt-6">
                                    <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center gap-3 text-slate-600 font-medium">
                                        <Loader2 size={20} className="animate-spin text-blue-600" />
                                        {currentCheckingDate 
                                            ? `${formatDate(currentCheckingDate)} tarihi taranıyor...` 
                                            : 'Önceki makaleler aranıyor...'}
                                    </div>
                                    <FeedSkeleton />
                                </div>
                            )}

                            {loadMoreError && (
                                <div className="text-center py-4 max-w-md mx-auto">
                                    <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                                    <p className="text-red-700 text-sm mb-3">{loadMoreError}</p>
                                    <button
                                        onClick={loadMoreDays}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                                    >
                                        <RefreshCw size={14} />
                                        Tekrar Dene
                                    </button>
                                </div>
                            )}

                            {!hasMore && !isLoadingMore && !loadMoreError && (
                                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 max-w-xl mx-auto p-6">
                                    <CheckCircle className="mx-auto text-emerald-500 mb-3" size={40} />
                                    <h4 className="text-lg font-bold text-slate-800 mb-1">Görünüşe Göre Akışın Sonundasınız</h4>
                                    <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                                        Son 30 günlük patoloji makale akışı başarıyla listelendi. Daha eski makaleleri taramak ister misiniz?
                                    </p>
                                    <button
                                        onClick={handleSearchFurther}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
                                    >
                                        <Clock size={16} />
                                        Daha Eski Makaleleri Ara
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Journal List */}
            <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-slate-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <BookOpen size={24} className="text-blue-600" />
                    Takip Edilen Patoloji Dergileri ({journals.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {journals.map((journal, index) => (
                        <div key={index} className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="text-sm text-gray-700 font-medium">{journal}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-10 text-center text-sm text-gray-600 bg-slate-50 rounded-xl p-6 border border-slate-200">
                <p className="font-medium mb-1">
                    📡 PubMed E-utilities API kullanılarak canlı veri çekimi yapılmaktadır.
                </p>
                <p className="text-gray-500">
                    Makaleler ilgili yayıncının telif hakkı koruması altındadır. Özetler NCBI lisansı kapsamında gösterilmektedir.
                </p>
            </div>
        </PageContainer>
    );
}
