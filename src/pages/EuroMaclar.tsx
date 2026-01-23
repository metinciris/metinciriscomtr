import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, Trophy, AlertCircle, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

// ============================================
// TYPES
// ============================================
type SportType = 'basketball' | 'volleyball';

interface EuroMatch {
    id: string;
    sport: SportType;
    competition: string;
    competitionId: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamBadge?: string;
    awayTeamBadge?: string;
    matchDate: string; // ISO format with Z
    status: 'scheduled' | 'finished' | 'live' | 'postponed';
    scoreHome: number | null;
    scoreAway: number | null;
}

interface TheSportsDBEvent {
    idEvent: string;
    strLeague: string;
    idLeague: string;
    strHomeTeam: string;
    strAwayTeam: string;
    strHomeTeamBadge?: string;
    strAwayTeamBadge?: string;
    dateEvent: string;
    strTime?: string;
    strTimeLocal?: string;
    intHomeScore?: string | null;
    intAwayScore?: string | null;
    strStatus?: string;
    strPostponed?: string;
}

// ============================================
// CONSTANTS & FILTER LISTS
// ============================================
const API_BASE = 'https://www.thesportsdb.com/api/v1/json/123';

// Major European Competitions
const BASKETBALL_LEAGUES = ['4546', '4547', '4548', '4363']; // EuroLeague, EuroCup, BCL, FIBA Europe Cup
const VOLLEYBALL_LEAGUES = ['5616', '5615', '5614', '4912']; // CEV CL, CEV Cup, CEV Challenge, EuroVolley Women

// Turkish Team Keywords for Precise Filtering
const TURKISH_MEN_BASKETBALL = [
    'fenerbahce', 'anadolu efes', 'besiktas', 'turk telekom', 'galatasaray',
    'karsiyaka', 'bahcesehir', 'bursaspor', 'tofas', 'darussafaka', 'petkim',
    'manisa', 'merkezefendi', 'yalovaspor', 'turkiye'
];

const TURKISH_WOMEN_VOLLEYBALL = [
    'vakifbank', 'eczacibasi', 'fenerbahce', 'galatasaray', 'besiktas',
    'thy', 'turk hava yollari', 'kuzeyboru', 'nilufer', 'aydin bb',
    'aras kargo', 'sariyer', 'zeren', 'bahcelievler', 'kecioen', 'turkiye'
];

const CACHE_KEY = 'euro_matches_cache_v2'; // Bumped version for new filtering
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// ============================================
// HELPERS
// ============================================
function normalizeName(name: string): string {
    return name.toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .trim();
}

function isTurkishTeam(teamName: string, sport: SportType): boolean {
    const normalized = normalizeName(teamName);
    const keywords = sport === 'basketball' ? TURKISH_MEN_BASKETBALL : TURKISH_WOMEN_VOLLEYBALL;
    return keywords.some(k => normalized.includes(k));
}

function getSportEmoji(sport: SportType): string {
    return sport === 'basketball' ? '🏀' : '🏐';
}

function getSportDisplayName(sport: SportType): string {
    return sport === 'basketball' ? 'Basketbol (Erkek)' : 'Voleybol (Kadın)';
}

function mapStatus(event: TheSportsDBEvent): EuroMatch['status'] {
    if (event.strPostponed === 'yes') return 'postponed';
    const status = event.strStatus?.toUpperCase();
    if (status === 'NS' || status === 'NOT STARTED') return 'scheduled';
    if (status === 'FT' || status === 'FINISHED' || status === 'AOT' || status === 'AET') return 'finished';
    if (status === 'LIVE' || status === '1H' || status === '2H' || status === 'HT') return 'live';
    if (event.intHomeScore !== null && event.intHomeScore !== undefined && event.intHomeScore !== '') {
        return 'finished';
    }
    return 'scheduled';
}

function normalizeEvent(event: TheSportsDBEvent, sport: SportType): EuroMatch {
    // TheSportsDB strTime is in UTC. We append Z to ensure JS treats it as UTC.
    const time = event.strTime || '00:00:00';
    const dateStr = `${event.dateEvent}T${time}Z`;

    return {
        id: event.idEvent,
        sport,
        competition: event.strLeague,
        competitionId: event.idLeague,
        homeTeam: event.strHomeTeam,
        awayTeam: event.strAwayTeam,
        homeTeamBadge: event.strHomeTeamBadge,
        awayTeamBadge: event.strAwayTeamBadge,
        matchDate: dateStr,
        status: mapStatus(event),
        scoreHome: event.intHomeScore ? parseInt(event.intHomeScore, 10) : null,
        scoreAway: event.intAwayScore ? parseInt(event.intAwayScore, 10) : null,
    };
}

interface CacheData {
    timestamp: number;
    matches: EuroMatch[];
}

function getFromCache(): EuroMatch[] | null {
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        const data: CacheData = JSON.parse(cached);
        if (Date.now() - data.timestamp > CACHE_DURATION_MS) {
            sessionStorage.removeItem(CACHE_KEY);
            return null;
        }
        return data.matches;
    } catch {
        return null;
    }
}

function saveToCache(matches: EuroMatch[]): void {
    try {
        const data: CacheData = { timestamp: Date.now(), matches };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
        // Ignore storage errors
    }
}

// ============================================
// MATCH CARD COMPONENT
// ============================================
interface MatchCardProps {
    match: EuroMatch;
    highlight?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, highlight }) => {
    const dateObj = new Date(match.matchDate);

    // Display strictly in Istanbul Timezone
    const dateStr = dateObj.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        weekday: 'short',
        timeZone: 'Europe/Istanbul'
    });
    const timeStr = dateObj.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Istanbul'
    });

    const getBadgeColor = (sport: SportType) => {
        return sport === 'basketball' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
    };

    const getStatusBadge = () => {
        switch (match.status) {
            case 'live':
                return <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">CANLI</span>;
            case 'postponed':
                return <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">Ertelendi</span>;
            default:
                return null;
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border ${highlight ? 'border-yellow-400 shadow-md ring-1 ring-yellow-100' : 'border-slate-200'} p-4 hover:shadow-md transition-shadow relative overflow-hidden`}>
            {/* Sport & Competition Badge */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${getBadgeColor(match.sport)}`}>
                {getSportEmoji(match.sport)} {match.competition}
            </div>

            <div className="flex flex-col gap-3">
                {/* Date & Time */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar size={16} />
                    <span className={highlight ? "font-semibold text-slate-700 font-mono" : "font-mono"}>
                        {dateStr} • {timeStr}
                    </span>
                    {getStatusBadge()}
                </div>

                {/* Teams & Score */}
                <div className="flex items-center justify-between mt-2">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center text-center gap-1">
                        <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full p-2">
                            {match.homeTeamBadge ? (
                                <img src={match.homeTeamBadge} alt="" className="w-10 h-10 object-contain" />
                            ) : (
                                <Trophy size={20} className="text-slate-300" />
                            )}
                        </div>
                        <span className={`text-xs font-bold leading-tight uppercase ${isTurkishTeam(match.homeTeam, match.sport) ? 'text-slate-900 underline decoration-yellow-400 decoration-2 underline-offset-4' : 'text-slate-500'}`}>
                            {match.homeTeam}
                        </span>
                    </div>

                    {/* Score / Time */}
                    <div className="flex flex-col items-center justify-center min-w-[80px] px-2">
                        {match.status === 'finished' || match.status === 'live' ? (
                            <div className={`text-2xl font-black tracking-tighter ${match.status === 'live' ? 'text-red-600' : 'text-slate-800'}`}>
                                {match.scoreHome ?? '-'} : {match.scoreAway ?? '-'}
                            </div>
                        ) : match.status === 'postponed' ? (
                            <div className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 uppercase">
                                Ertelendi
                            </div>
                        ) : (
                            <div className={`text-sm font-bold px-3 py-1 rounded-full ${highlight ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                {timeStr}
                            </div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center text-center gap-1">
                        <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-full p-2">
                            {match.awayTeamBadge ? (
                                <img src={match.awayTeamBadge} alt="" className="w-10 h-10 object-contain" />
                            ) : (
                                <Trophy size={20} className="text-slate-300" />
                            )}
                        </div>
                        <span className={`text-xs font-bold leading-tight uppercase ${isTurkishTeam(match.awayTeam, match.sport) ? 'text-slate-900 underline decoration-yellow-400 decoration-2 underline-offset-4' : 'text-slate-500'}`}>
                            {match.awayTeam}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export function EuroMaclar() {
    const [matches, setMatches] = useState<EuroMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sportFilter, setSportFilter] = useState<'all' | SportType>('all');
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    const fetchMatches = useCallback(async (forceRefresh = false) => {
        // Check cache first
        if (!forceRefresh) {
            const cached = getFromCache();
            if (cached) {
                setMatches(cached);
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const allMatches: EuroMatch[] = [];

            // Helper for fetching league data
            const fetchLeague = async (id: string, sport: SportType) => {
                const [nextRes, pastRes] = await Promise.all([
                    fetch(`${API_BASE}/eventsnextleague.php?id=${id}`),
                    fetch(`${API_BASE}/eventspastleague.php?id=${id}`)
                ]);

                const processEvents = (data: any) => {
                    if (data.events && Array.isArray(data.events)) {
                        const filtered = data.events
                            .map((e: TheSportsDBEvent) => normalizeEvent(e, sport))
                            // Robust filter: Only Turkish Men's Basketball or Turkish Women's Volleyball
                            .filter((m: EuroMatch) => isTurkishTeam(m.homeTeam, sport) || isTurkishTeam(m.awayTeam, sport));
                        allMatches.push(...filtered);
                    }
                };

                if (nextRes.ok) processEvents(await nextRes.json());
                if (pastRes.ok) processEvents(await pastRes.json());
            };

            // Fetch Basketball & Volleyball in parallel
            await Promise.all([
                ...BASKETBALL_LEAGUES.map(id => fetchLeague(id, 'basketball')),
                ...VOLLEYBALL_LEAGUES.map(id => fetchLeague(id, 'volleyball'))
            ]);

            if (allMatches.length === 0) {
                setError('Şu an için Türk takımlarının Avrupa maçı bulunamadı.');
            } else {
                // Deduplicate by event id
                const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());

                // Sort by date: Finished first (desc), then Upcoming (asc)
                uniqueMatches.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

                setMatches(uniqueMatches);
                saveToCache(uniqueMatches);
                setLastFetched(new Date());
            }
        } catch (err) {
            console.error('Error fetching matches:', err);
            setError('Maç verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    // Filter matches by sport
    const filteredMatches = useMemo(() => {
        if (sportFilter === 'all') return matches;
        return matches.filter(m => m.sport === sportFilter);
    }, [matches, sportFilter]);

    // Categorize matches
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric' });
    const parts = formatter.formatToParts(now);
    const d = parts.find(p => p.type === 'day')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const y = parts.find(p => p.type === 'year')?.value;

    // Boundary in Istanbul time
    const todayStart = new Date(parseInt(y || '0'), parseInt(m || '0') - 1, parseInt(d || '0'));
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todaysMatches = useMemo(() =>
        filteredMatches.filter(m => {
            const matchDate = new Date(m.matchDate);
            return matchDate >= todayStart && matchDate < todayEnd;
        }), [filteredMatches, todayStart, todayEnd]);

    const upcomingMatches = useMemo(() =>
        filteredMatches
            .filter(m => new Date(m.matchDate) >= todayEnd && m.status === 'scheduled')
            .slice(0, 20),
        [filteredMatches, todayEnd]);

    const recentMatches = useMemo(() =>
        filteredMatches
            .filter(m => new Date(m.matchDate) < todayStart)
            .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
            .slice(0, 20),
        [filteredMatches, todayStart]);

    const hasTodayMatches = todaysMatches.length > 0;

    return (
        <PageContainer>
            {/* Header Banner */}
            <div className={`${hasTodayMatches ? 'bg-gradient-to-br from-indigo-700 via-blue-800 to-indigo-950' : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950'} text-white p-8 md:p-12 mb-8 rounded-2xl shadow-xl relative overflow-hidden`}>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                            <Trophy size={40} className="text-yellow-400 drop-shadow-lg" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic underline decoration-yellow-400 decoration-4 underline-offset-8">
                                Avrupa Kupaları
                            </h1>
                            <p className="text-blue-100 font-medium mt-2 tracking-wide uppercase text-sm">
                                Türk Takımlarının Avrupa Serüveni
                            </p>
                        </div>
                    </div>

                    {/* Today's Status Card */}
                    <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-2xl mt-4">
                        {hasTodayMatches ? (
                            <>
                                <div className="w-4 h-4 rounded-full bg-yellow-400 animate-ping"></div>
                                <span className="text-xl md:text-2xl font-black tracking-tight uppercase">
                                    Bugün <span className="text-yellow-400">{todaysMatches.length}</span> kritik maç var!
                                </span>
                            </>
                        ) : (
                            <>
                                <Clock size={24} className="text-white/60" />
                                <span className="text-lg font-bold text-white/80 uppercase">
                                    Bugün maçımız yok
                                </span>
                            </>
                        )}
                    </div>

                    <div className="mt-8 flex gap-4 text-xs font-bold text-white/50 uppercase tracking-widest">
                        <span>#BasketbolErkek</span>
                        <span>#VoleybolKadin</span>
                        <span>#AvrupaFatihi</span>
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[150%] rotate-45 bg-gradient-to-b from-white to-transparent"></div>
                </div>
            </div>

            {/* Sport Filter Tabs */}
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200 mb-10 sticky top-6 z-30">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        {[
                            { id: 'all', label: 'Tümü', emoji: '🏆', count: matches.length },
                            { id: 'basketball', label: 'Basketbol', emoji: '🏀', count: matches.filter(m => m.sport === 'basketball').length },
                            { id: 'volleyball', label: 'Voleybol', emoji: '🏐', count: matches.filter(m => m.sport === 'volleyball').length },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSportFilter(f.id as 'all' | SportType)}
                                className={`px-6 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-tighter flex items-center gap-3 border-2 ${sportFilter === f.id
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                                    }`}
                            >
                                <span className="text-lg">{f.emoji}</span>
                                <span>{f.label}</span>
                                {f.count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] ${sportFilter === f.id ? 'bg-yellow-400 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
                                        {f.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => fetchMatches(true)}
                        disabled={loading}
                        className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all border border-transparent hover:border-slate-900"
                        title="Verileri Yenile"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Loading / Error States */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-yellow-400 rounded-full animate-spin"></div>
                    <span className="font-black text-slate-400 uppercase tracking-widest text-sm">Veriler Sahadan Geliyor...</span>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-12 text-center flex flex-col items-center gap-6">
                    <AlertCircle size={64} className="text-red-400" />
                    <div className="max-w-md">
                        <h3 className="text-xl font-black text-red-900 uppercase">Veri Alınamadı</h3>
                        <p className="text-red-600 font-medium mt-2">{error}</p>
                    </div>
                    <button
                        onClick={() => fetchMatches(true)}
                        className="px-8 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all uppercase tracking-tighter"
                    >
                        Tekrar Dene
                    </button>
                </div>
            ) : (
                <div className="space-y-16">

                    {/* Today's Section */}
                    {todaysMatches.length > 0 && (
                        <section className="relative">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-yellow-400 w-2 h-8 rounded-full"></div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">BU GÜNÜN KRİTİK MAÇLARI</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {todaysMatches.map(match => (
                                    <MatchCard key={match.id} match={match} highlight />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Upcoming Section */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-slate-300 w-2 h-8 rounded-full"></div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">SIRADAKİ RANDEVULAR</h2>
                        </div>
                        {upcomingMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcomingMatches.map(match => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest">Planlanmış yakın maç bulunamadı.</p>
                            </div>
                        )}
                    </section>

                    {/* Recent Results Section */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-slate-200 w-2 h-8 rounded-full"></div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">SON ARENA SONUÇLARI</h2>
                        </div>
                        {recentMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                                {recentMatches.map(match => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest">Son maç sonucu bulunamadı.</p>
                            </div>
                        )}
                    </section>

                    {/* Footer Info */}
                    {lastFetched && (
                        <div className="mt-20 pt-10 border-t border-slate-200">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-center md:text-left">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        SON GÜNCELLEME (İSTANBUL): {lastFetched.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
                                    </p>
                                    <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">
                                        VERİ KAYNAĞI: THE SPORTS DB • © 2026 METINCIRIS.COM.TR
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">
                                        {matches.length} AKTİF KAYIT
                                    </div>
                                    <div className="px-4 py-2 bg-yellow-50 rounded-lg text-[10px] font-black text-yellow-700 uppercase">
                                        GERÇEK ZAMANLI VERİ
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </PageContainer>
    );
}

// Default export for lazy loading
export default EuroMaclar;
