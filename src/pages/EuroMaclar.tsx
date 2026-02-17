import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, Trophy, AlertCircle, RefreshCw, Clock } from 'lucide-react';

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
const BASKETBALL_LEAGUES = ['4363', '4546', '4547', '4548']; // EuroLeague, EuroCup, BCL, FIBA Europe Cup
const VOLLEYBALL_LEAGUES = [
    '5610', '5612', // Womens World & Euro (Available on TheSportsDB)
    '5616', '5615', '5614' // CEV CL, Cup, Challenge (M) - Fallback/Current
];

// Turkish Team Keywords
const TURKISH_KEYWORDS = [
    'fenerbahce', 'anadolu efes', 'besiktas', 'turk telekom', 'galatasaray',
    'vakifbank', 'eczacibasi', 'thy', 'turk hava yollari', 'kuzeyboru',
    'nilufer', 'aydin', 'aras kargo', 'sariyer', 'zeren', 'bahcelievler',
    'kecioen', 'tofas', 'bursaspor', 'manisa', 'petkim', 'karsiyaka',
    'bahcesehir', 'darussafaka', 'turkiye', 'türkiye'
];

const CACHE_KEY = 'euro_matches_cache_v3';
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

function matchesTurkishFilter(teamName: string): boolean {
    const normalized = normalizeName(teamName);
    return TURKISH_KEYWORDS.some(k => normalized.includes(k));
}

function getSportEmoji(sport: SportType): string {
    return sport === 'basketball' ? '🏀' : '🏐';
}

function getSportDisplayName(sport: SportType): string {
    return sport === 'basketball' ? 'Basketbol' : 'Voleybol';
}

function mapStatus(event: TheSportsDBEvent): EuroMatch['status'] {
    if (event.strPostponed === 'yes') return 'postponed';
    const status = event.strStatus?.toUpperCase();
    if (status === 'NS' || status === 'NOT STARTED') return 'scheduled';
    if (status === 'FT' || status === 'FINISHED' || status === 'AOT' || status === 'AET') return 'finished';
    if (status === 'LIVE' || status === '1H' || status === '2H' || status === 'HT' || status === 'LIVE') return 'live';
    if (event.intHomeScore !== null && event.intHomeScore !== undefined && event.intHomeScore !== '') {
        return 'finished';
    }
    return 'scheduled';
}

function normalizeEvent(event: TheSportsDBEvent, sport: SportType): EuroMatch {
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

    const isTurkishHome = matchesTurkishFilter(match.homeTeam);
    const isTurkishAway = matchesTurkishFilter(match.awayTeam);
    const isTurkishMatch = isTurkishHome || isTurkishAway;

    return (
        <div className={`bg-white rounded-xl shadow-sm border ${isTurkishMatch || highlight ? 'border-yellow-400 shadow-md ring-1 ring-yellow-50' : 'border-slate-200'} p-4 hover:shadow-md transition-shadow relative overflow-hidden`}>
            {/* Sport & Competition Badge */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black rounded-bl-xl uppercase tracking-widest ${match.sport === 'basketball' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'}`}>
                {getSportEmoji(match.sport)} {match.competition}
            </div>

            <div className="flex flex-col gap-3">
                {/* Date & Time */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <Calendar size={12} />
                    <span>{dateStr} • {timeStr}</span>
                    {match.status === 'live' && (
                        <span className="bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse">CANLI</span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-lg p-1 mb-1">
                            {match.homeTeamBadge ? (
                                <img src={match.homeTeamBadge} alt={match.homeTeam} className="w-8 h-8 object-contain" loading="lazy" />
                            ) : (
                                <Trophy size={16} className="text-slate-300" />
                            )}
                        </div>
                        <span className={`text-[11px] font-black uppercase leading-[1.1] ${isTurkishHome ? 'text-slate-900 border-b-2 border-yellow-400' : 'text-slate-500'}`}>
                            {match.homeTeam}
                        </span>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                        {match.status === 'finished' || match.status === 'live' ? (
                            <div className={`text-xl font-black italic tracking-tighter ${match.status === 'live' ? 'text-red-600' : 'text-slate-900'}`}>
                                {match.scoreHome ?? '0'}:{match.scoreAway ?? '0'}
                            </div>
                        ) : (
                            <div className="text-sm font-black bg-slate-100 text-slate-900 px-2 py-1 rounded">
                                {timeStr}
                            </div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-lg p-1 mb-1">
                            {match.awayTeamBadge ? (
                                <img src={match.awayTeamBadge} alt={match.awayTeam} className="w-8 h-8 object-contain" loading="lazy" />
                            ) : (
                                <Trophy size={16} className="text-slate-300" />
                            )}
                        </div>
                        <span className={`text-[11px] font-black uppercase leading-[1.1] ${isTurkishAway ? 'text-slate-900 border-b-2 border-yellow-400' : 'text-slate-500'}`}>
                            {match.awayTeam}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function EuroMaclar() {
    const [matches, setMatches] = useState<EuroMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sportFilter, setSportFilter] = useState<'all' | SportType>('all');
    const [lastFetched, setLastFetched] = useState<Date | null>(null);

    const fetchMatches = useCallback(async (forceRefresh = false) => {
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

            const fetchLeague = async (id: string, sport: SportType) => {
                const [nextRes, pastRes] = await Promise.all([
                    fetch(`${API_BASE}/eventsnextleague.php?id=${id}`),
                    fetch(`${API_BASE}/eventspastleague.php?id=${id}`)
                ]);

                const processEvents = (data: any) => {
                    if (data.events && Array.isArray(data.events)) {
                        const m = data.events.map((e: TheSportsDBEvent) => normalizeEvent(e, sport));

                        // Filtering logic: Show ALL matches for specified leagues
                        allMatches.push(...m);
                    }
                };

                if (nextRes.ok) processEvents(await nextRes.json());
                if (pastRes.ok) processEvents(await pastRes.json());
            };

            await Promise.all([
                ...BASKETBALL_LEAGUES.map(id => fetchLeague(id, 'basketball')),
                ...VOLLEYBALL_LEAGUES.map(id => fetchLeague(id, 'volleyball'))
            ]);

            if (allMatches.length === 0) {
                // If it's empty, maybe include generic volleyball if CEV CL is missing
                setError('Şu an için aktif maç verisi bulunamadı.');
            } else {
                const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());
                uniqueMatches.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
                setMatches(uniqueMatches);
                saveToCache(uniqueMatches);
                setLastFetched(new Date());
            }
        } catch (err) {
            console.error(err);
            setError('Maç Sonuçları Hazırlanıyor...');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const filteredMatches = useMemo(() => {
        if (sportFilter === 'all') return matches;
        return matches.filter(m => m.sport === sportFilter);
    }, [matches, sportFilter]);

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric' });
    const parts = formatter.formatToParts(now);
    const d = parts.find(p => p.type === 'day')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const y = parts.find(p => p.type === 'year')?.value;
    const todayStart = new Date(parseInt(y || '0'), parseInt(m || '0') - 1, parseInt(d || '0'));
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todaysMatches = filteredMatches.filter(m => {
        const d = new Date(m.matchDate);
        return d >= todayStart && d < todayEnd;
    });

    const upcomingMatches = filteredMatches.filter(m => new Date(m.matchDate) >= todayEnd && m.status === 'scheduled').slice(0, 24);
    const recentMatches = filteredMatches.filter(m => new Date(m.matchDate) < todayStart).sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()).slice(0, 24);

    return (
        <PageContainer>
            {/* SEO-friendly hidden description for bots */}
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
                <h2>Avrupa Kupaları Basketbol ve Voleybol Maç Sonuçları</h2>
                <p>
                    Fenerbahçe, Anadolu Efes, VakıfBank ve Eczacıbaşı gibi temsilcilerimizin EuroLeague, EuroCup ve CEV Şampiyonlar Ligi'ndeki güncel maç sonuçlarını ve gelecek maç programlarını takip edin. Canlı skorlar ve turnuva detayları burada.
                </p>
            </div>
            <div className="bg-slate-950 text-white p-8 md:p-12 mb-8 rounded-3xl shadow-2xl relative overflow-hidden border-b-4 border-yellow-400">
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <Trophy size={32} className="text-yellow-400" />
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">AVRUPA KUPALARI</h1>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Erkek basketbol Avrupa • Kadın Voleybol CEV</p>

                    <div className="flex gap-4">
                        <div className={`px-6 py-4 rounded-2xl flex flex-col gap-1 border-2 ${todaysMatches.length > 0 ? 'bg-yellow-400 border-yellow-500 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                            <span className="text-[10px] font-black uppercase tracking-tight">Bugünkü Maçlar</span>
                            <span className="text-2xl font-black">{todaysMatches.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-200 mb-8 sticky top-4 z-40 flex items-center justify-between gap-4">
                <div className="flex gap-2">
                    {['all', 'basketball', 'volleyball'].map(f => (
                        <button
                            key={f}
                            onClick={() => setSportFilter(f as any)}
                            className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${sportFilter === f ? 'bg-slate-950 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {f === 'all' ? 'TÜMÜ' : f === 'basketball' ? 'ERKEK BASKETBOL AVRUPA' : 'KADIN VOLEYBOL CEV'}
                        </button>
                    ))}
                </div>
                <button onClick={() => fetchMatches(true)} className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-950 rounded-full animate-spin"></div>
                    <span className="font-black text-slate-300 uppercase tracking-widest text-xs">Sahadan Veriler Bekleniyor...</span>
                </div>
            ) : (
                <div className="space-y-12 pb-12">
                    {todaysMatches.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase italic tracking-tighter">BUGÜNÜN MAÇLARI</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {todaysMatches.map(m => <MatchCard key={m.id} match={m} highlight />)}
                            </div>
                        </section>
                    )}

                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase italic tracking-tighter">GELECEK RANDEVULAR</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcomingMatches.map(m => <MatchCard key={m.id} match={m} />)}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase italic tracking-tighter text-slate-400">SON SONUÇLAR</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75 grayscale hover:grayscale-0 transition-all">
                            {recentMatches.map(m => <MatchCard key={m.id} match={m} />)}
                        </div>
                    </section>

                    {lastFetched && (
                        <div className="pt-8 border-t border-slate-200 text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                SON GÜNCELLEME: {lastFetched.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul' })} (İSTANBUL)
                            </p>
                        </div>
                    )}
                </div>
            )}
        </PageContainer>
    );
}

export default EuroMaclar;
