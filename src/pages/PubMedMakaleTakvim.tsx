import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, Clock, BookOpen, Loader2, AlertCircle, RefreshCw, FileText, Link2 } from 'lucide-react';
import { pubmedDailyService, Article } from '../services/pubmedDailyService';

// Pathology journals to track
const PATHOLOGY_JOURNALS = [
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

    return (
        <div
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-all duration-300"
        >
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
                            {article.abstract}
                        </div>
                    )}
                </div>
            )}

            {/* Links Section */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
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
                <span className="inline-flex items-center px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">
                    PMID: {article.pmid}
                </span>
            </div>
        </div>
    );
}

// Loading Spinner Component
function LoadingSpinner({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16" data-nosnippet>
            <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600 text-lg">{message}</p>
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

export function PubMedMakaleTakvim() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [totalResults, setTotalResults] = useState(0);
    const [isSearchingDate, setIsSearchingDate] = useState(false);

    const fetchArticles = useCallback(async (date: Date) => {
        setLoading(true);
        setError(null);

        try {
            const result = await pubmedDailyService.searchArticles(PATHOLOGY_JOURNALS, date);
            setArticles(result.articles);
            setTotalResults(result.total);
        } catch (err) {
            setError('Makaleler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
            setArticles([]);
            setTotalResults(0);
        } finally {
            setLoading(false);
        }
    }, []);

    const findLastArticleDate = useCallback(async (startDate: Date): Promise<Date | null> => {
        setIsSearchingDate(true);
        const maxDaysToCheck = 30;

        for (let i = 0; i < maxDaysToCheck; i++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(checkDate.getDate() - i);

            try {
                const result = await pubmedDailyService.searchArticles(PATHOLOGY_JOURNALS, checkDate);
                if (result.total > 0) {
                    setIsSearchingDate(false);
                    return checkDate;
                }
            } catch (error) {
                console.error('Tarih arama hatası:', error);
            }
        }

        setIsSearchingDate(false);
        return null;
    }, []);

    const findPreviousArticleDate = useCallback(async (currentDate: Date): Promise<Date | null> => {
        setIsSearchingDate(true);
        const maxDaysToCheck = 30;

        for (let i = 1; i <= maxDaysToCheck; i++) {
            const checkDate = new Date(currentDate);
            checkDate.setDate(checkDate.getDate() - i);

            try {
                const result = await pubmedDailyService.searchArticles(PATHOLOGY_JOURNALS, checkDate);
                if (result.total > 0) {
                    setIsSearchingDate(false);
                    return checkDate;
                }
            } catch (error) {
                console.error('Önceki tarih arama hatası:', error);
            }
        }

        setIsSearchingDate(false);
        return null;
    }, []);

    const findNextArticleDate = useCallback(async (currentDate: Date): Promise<Date | null> => {
        setIsSearchingDate(true);
        const today = new Date();
        const maxDaysToCheck = 30;

        for (let i = 1; i <= maxDaysToCheck; i++) {
            const checkDate = new Date(currentDate);
            checkDate.setDate(checkDate.getDate() + i);

            if (checkDate > today) {
                break;
            }

            try {
                const result = await pubmedDailyService.searchArticles(PATHOLOGY_JOURNALS, checkDate);
                if (result.total > 0) {
                    setIsSearchingDate(false);
                    return checkDate;
                }
            } catch (error) {
                console.error('Sonraki tarih arama hatası:', error);
            }
        }

        setIsSearchingDate(false);
        return null;
    }, []);

    useEffect(() => {
        const initializeApp = async () => {
            const today = new Date();
            const lastDate = await findLastArticleDate(today);

            if (lastDate) {
                setSelectedDate(lastDate);
                await fetchArticles(lastDate);
            } else {
                setSelectedDate(today);
                await fetchArticles(today);
            }
        };

        initializeApp();
    }, [fetchArticles, findLastArticleDate]);

    const handleDateChange = async (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            const prevDate = await findPreviousArticleDate(selectedDate);
            if (prevDate) {
                setSelectedDate(prevDate);
                await fetchArticles(prevDate);
            }
        } else {
            const nextDate = await findNextArticleDate(selectedDate);
            if (nextDate) {
                setSelectedDate(nextDate);
                await fetchArticles(nextDate);
            }
        }
    };

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

    const canGoNext = () => {
        const today = new Date();
        return selectedDate < today;
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
                        {PATHOLOGY_JOURNALS.map(j => <li key={j}>{j}</li>)}
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
                        Dünyaca ünlü patoloji dergilerinden günlük makale takibi - Tarihe göre gezinin
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

            {/* Date Navigation */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <button
                        onClick={() => handleDateChange('prev')}
                        disabled={isSearchingDate}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200"
                        style={{
                            backgroundColor: isSearchingDate ? '#f3f4f6' : '#1e40af',
                            color: isSearchingDate ? '#9ca3af' : '#ffffff',
                            cursor: isSearchingDate ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <ChevronLeft size={20} />
                        <span>
                            {isSearchingDate ? 'Aranıyor...' : 'Önceki Gün'}
                        </span>
                    </button>

                    <div className="flex items-center gap-4">
                        <Calendar size={28} className="text-blue-600" />
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {formatDate(selectedDate)}
                            </h2>
                            {isToday(selectedDate) && (
                                <span
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-1"
                                    style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
                                >
                                    Bugün
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => handleDateChange('next')}
                        disabled={!canGoNext() || isSearchingDate}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200"
                        style={{
                            backgroundColor: canGoNext() && !isSearchingDate ? '#1e40af' : '#f3f4f6',
                            color: canGoNext() && !isSearchingDate ? '#ffffff' : '#9ca3af',
                            cursor: canGoNext() && !isSearchingDate ? 'pointer' : 'not-allowed'
                        }}
                    >
                        <span>
                            {isSearchingDate ? 'Aranıyor...' : 'Sonraki Gün'}
                        </span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Results Summary */}
            {!loading && !isSearchingDate && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-8 border border-blue-100">
                    <p className="text-blue-800 text-center text-lg font-medium">
                        {totalResults > 0
                            ? `📚 ${totalResults} makale bulundu - ${PATHOLOGY_JOURNALS.length} patoloji dergisinden`
                            : '📭 Bu tarihte makale bulunamadı'
                        }
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="min-h-96">
                {(loading || isSearchingDate) && (
                    <LoadingSpinner message={isSearchingDate ? 'Makale bulunan tarih aranıyor...' : 'Makaleler yükleniyor...'} />
                )}

                {error && <ErrorMessage message={error} onRetry={() => fetchArticles(selectedDate)} />}

                {!loading && !isSearchingDate && !error && articles.length === 0 && (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
                        <BookOpen size={64} className="mx-auto text-slate-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Makale Bulunamadı
                        </h3>
                        <p className="text-gray-600 text-lg">
                            Son 30 gün içinde seçilen dergilerde yayınlanan makale bulunmuyor.
                        </p>
                    </div>
                )}

                {!loading && !isSearchingDate && !error && articles.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {articles.map((article, index) => (
                            <ArticleCard key={`${article.pmid}-${index}`} article={article} />
                        ))}
                    </div>
                )}
            </div>

            {/* Journal List */}
            <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-slate-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <BookOpen size={24} className="text-blue-600" />
                    Takip Edilen Patoloji Dergileri
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PATHOLOGY_JOURNALS.map((journal, index) => (
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
