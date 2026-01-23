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
// CONSTANTS
// ============================================
const API_BASE = 'https://www.thesportsdb.com/api/v1/json/123';

const BASKETBALL_LEAGUES = ['4546', '4547', '4548', '5607'];
const VOLLEYBALL_LEAGUES = ['5616', '5615', '5614'];

const CACHE_KEY = 'euro_matches_cache';
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// ============================================
// HELPERS
// ============================================
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
                    <span className={highlight ? "font-semibold text-slate-700" : ""}>
                        {dateStr} • {timeStr}
                    </span>
                    {getStatusBadge()}
                </div>

                {/* Teams & Score */}
                <div className="flex items-center justify-between mt-2">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center text-center gap-1">
                        {match.homeTeamBadge && (
                            <img src={match.homeTeamBadge} alt="" className="w-10 h-10 object-contain" />
                        )}
                        <span className="text-sm font-medium leading-tight">{match.homeTeam}</span>
                    </div>

                    {/* Score / Time */}
                    <div className="flex flex-col items-center justify-center min-w-[80px] px-2">
                        {match.status === 'finished' || match.status === 'live' ? (
                            <div className={`text-xl font-bold tracking-tight ${match.status === 'live' ? 'text-red-600' : 'text-slate-700'}`}>
                                {match.scoreHome ?? '-'} - {match.scoreAway ?? '-'}
                            </div>
                        ) : match.status === 'postponed' ? (
                            <div className="text-sm font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                Ertelendi
                            </div>
                        ) : (
                            <div className={`text-sm font-semibold px-3 py-1 rounded-full ${highlight ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                {timeStr}
                            </div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center text-center gap-1">
                        {match.awayTeamBadge && (
                            <img src={match.awayTeamBadge} alt="" className="w-10 h-10 object-contain" />
                        )}
                        <span className="text-sm font-medium leading-tight">{match.awayTeam}</span>
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

            // Fetch basketball leagues
            for (const leagueId of BASKETBALL_LEAGUES) {
                try {
                    const [nextRes, pastRes] = await Promise.all([
                        fetch(`${API_BASE}/eventsnextleague.php?id=${leagueId}`),
                        fetch(`${API_BASE}/eventspastleague.php?id=${leagueId}`)
                    ]);

                    if (nextRes.ok) {
                        const nextData = await nextRes.json();
                        if (nextData.events && Array.isArray(nextData.events)) {
                            allMatches.push(...nextData.events.map((e: TheSportsDBEvent) => normalizeEvent(e, 'basketball')));
                        }
                    }

                    if (pastRes.ok) {
                        const pastData = await pastRes.json();
                        if (pastData.events && Array.isArray(pastData.events)) {
                            allMatches.push(...pastData.events.map((e: TheSportsDBEvent) => normalizeEvent(e, 'basketball')));
                        }
                    }
                } catch (e) {
                    console.error(`Error fetching basketball league ${leagueId}:`, e);
                }
            }

            // Fetch volleyball leagues
            for (const leagueId of VOLLEYBALL_LEAGUES) {
                try {
                    const [nextRes, pastRes] = await Promise.all([
                        fetch(`${API_BASE}/eventsnextleague.php?id=${leagueId}`),
                        fetch(`${API_BASE}/eventspastleague.php?id=${leagueId}`)
                    ]);

                    if (nextRes.ok) {
                        const nextData = await nextRes.json();
                        if (nextData.events && Array.isArray(nextData.events)) {
                            allMatches.push(...nextData.events.map((e: TheSportsDBEvent) => normalizeEvent(e, 'volleyball')));
                        }
                    }

                    if (pastRes.ok) {
                        const pastData = await pastRes.json();
                        if (pastData.events && Array.isArray(pastData.events)) {
                            allMatches.push(...pastData.events.map((e: TheSportsDBEvent) => normalizeEvent(e, 'volleyball')));
                        }
                    }
                } catch (e) {
                    console.error(`Error fetching volleyball league ${leagueId}:`, e);
                }
            }

            if (allMatches.length === 0) {
                setError('Maç verisi bulunamadı. API\'ye erişilemiyor olabilir.');
            } else {
                // Deduplicate by id
                const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());
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
    // Use Istanbul time for current day boundary
    const formatter = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric' });
    const [{ value: d }, , { value: m }, , { value: y }] = formatter.formatToParts(now);
    const todayStart = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todaysMatches = useMemo(() =>
        filteredMatches.filter(m => {
            const matchDate = new Date(m.matchDate);
            return matchDate >= todayStart && matchDate < todayEnd;
        }).sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()),
        [filteredMatches, todayStart, todayEnd]);

    const upcomingMatches = useMemo(() =>
        filteredMatches
            .filter(m => new Date(m.matchDate) >= todayEnd && m.status === 'scheduled')
            .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
            .slice(0, 15),
        [filteredMatches, todayEnd]);

    const recentMatches = useMemo(() =>
        filteredMatches
            .filter(m => new Date(m.matchDate) < todayStart && m.status === 'finished')
            .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
            .slice(0, 15),
        [filteredMatches, todayStart]);

    const hasTodayMatches = todaysMatches.length > 0;

    // Count by sport
    const basketballCount = matches.filter(m => m.sport === 'basketball').length;
    const volleyballCount = matches.filter(m => m.sport === 'volleyball').length;

    return (
        <PageContainer>
            {/* Header Banner */}
            <div className={`${hasTodayMatches ? 'bg-gradient-to-r from-orange-600 to-orange-800' : 'bg-gradient-to-r from-slate-600 to-slate-800'} text-white p-8 md:p-12 mb-8 rounded-xl shadow-lg relative overflow-hidden`}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy size={32} className="text-yellow-400" />
                        <h1 className="text-3xl md:text-4xl font-bold">Avrupa Kupaları</h1>
                    </div>

                    {/* Today's Match Status */}
                    <div className="flex items-center gap-3 mt-4">
                        {hasTodayMatches ? (
                            <>
                                <CheckCircle size={28} className="text-yellow-300" />
                                <span className="text-2xl font-semibold">
                                    Bugün {todaysMatches.length} maç var! 🏀🏐
                                </span>
                            </>
                        ) : (
                            <>
                                <XCircle size={28} className="text-slate-300" />
                                <span className="text-xl text-white/80">
                                    Bugün maç yok
                                </span>
                            </>
                        )}
                    </div>

                    <p className="text-white/70 mt-4 text-sm">
                        Basketbol (EuroLeague, EuroCup) ve Voleybol (CEV Şampiyonlar Ligi) maçları
                    </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute left-1/2 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            {/* Sport Filter Tabs */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 sticky top-4 z-20">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        {[
                            { id: 'all', label: 'Tümü', emoji: '🏆', count: matches.length },
                            { id: 'basketball', label: 'Basketbol', emoji: '🏀', count: basketballCount },
                            { id: 'volleyball', label: 'Voleybol', emoji: '🏐', count: volleyballCount },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSportFilter(f.id as 'all' | SportType)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${sportFilter === f.id
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <span>{f.emoji}</span>
                                <span>{f.label}</span>
                                {f.count > 0 && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${sportFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
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
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Yenile</span>
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
                    <RefreshCw className="animate-spin" />
                    <span>Veriler yükleniyor...</span>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="text-center py-12 text-red-500 flex flex-col items-center gap-4">
                    <AlertCircle size={48} />
                    <span className="text-lg">{error}</span>
                    <button
                        onClick={() => fetchMatches(true)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                        Tekrar Dene
                    </button>
                </div>
            )}

            {/* Content */}
            {!loading && !error && (
                <div className="space-y-12">

                    {/* Today's Matches */}
                    {todaysMatches.length > 0 && (
                        <section className="bg-gradient-to-b from-yellow-50 to-white p-6 rounded-2xl border border-yellow-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Clock className="text-yellow-500" />
                                <h2 className="text-2xl font-bold text-slate-900">Bugünkü Maçlar</h2>
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
                                    {todaysMatches.length} maç
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {todaysMatches.map(match => (
                                    <MatchCard key={match.id} match={match} highlight />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Upcoming Matches */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Yaklaşan Maçlar</h2>
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">
                                {upcomingMatches.length}
                            </span>
                        </div>

                        {upcomingMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcomingMatches.map(match => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-500">
                                <p>Yaklaşan maç bulunamadı.</p>
                                {sportFilter !== 'all' && (
                                    <p className="text-sm mt-2">
                                        {getSportEmoji(sportFilter)} {getSportDisplayName(sportFilter)} için planlanmış maç yok.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Recent Results */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Son Sonuçlar</h2>
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">
                                {recentMatches.length}
                            </span>
                        </div>

                        {recentMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentMatches.map(match => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-500">
                                <p>Son maç sonucu bulunamadı.</p>
                                {sportFilter !== 'all' && (
                                    <p className="text-sm mt-2">
                                        {getSportEmoji(sportFilter)} {getSportDisplayName(sportFilter)} için tamamlanmış maç yok.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Last Updated Footer */}
                    {lastFetched && (
                        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-400">
                            <p>
                                Son güncelleme (İstanbul): {lastFetched.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}
                            </p>
                            <p className="text-xs mt-1">
                                Veriler 10 dakika önbelleğe alınır • Kaynak: TheSportsDB
                            </p>
                        </div>
                    )}
                </div>
            )}
        </PageContainer>
    );
}

// Default export for lazy loading
export default EuroMaclar;
