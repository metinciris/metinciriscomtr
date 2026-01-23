import React, { useEffect, useState, useMemo } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
    EuroMatch,
    LastUpdatedInfo,
    SportType,
    getSportDisplayName,
    getSportEmoji,
    TURKISH_FOOTBALL_TEAMS,
    TURKISH_BASKETBALL_TEAMS,
    TURKISH_VOLLEYBALL_TEAMS
} from '../types/euroMatches';
import { Calendar, Trophy, AlertCircle, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

// ============================================
// MATCH CARD COMPONENT
// ============================================
interface MatchCardProps {
    match: EuroMatch;
    highlight?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, highlight }) => {
    const dateObj = new Date(match.startTimeLocal);
    const dateStr = dateObj.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        weekday: 'short'
    });
    const timeStr = dateObj.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Determine if Turkish team won/lost for coloring
    const getTurkishTeamList = (sport: SportType) => {
        switch (sport) {
            case 'football': return TURKISH_FOOTBALL_TEAMS;
            case 'basketball': return TURKISH_BASKETBALL_TEAMS;
            case 'volleyball': return TURKISH_VOLLEYBALL_TEAMS;
        }
    };

    const turkishTeams = getTurkishTeamList(match.sport);
    const isHomeTurkish = turkishTeams.some(t =>
        match.homeTeam.toLowerCase().includes(t.toLowerCase())
    );
    const isAwayTurkish = turkishTeams.some(t =>
        match.awayTeam.toLowerCase().includes(t.toLowerCase())
    );

    let scoreColorClass = "text-slate-700";
    if (match.status === 'finished' && match.scoreHome != null && match.scoreAway != null) {
        if (isHomeTurkish && !isAwayTurkish) {
            scoreColorClass = match.scoreHome > match.scoreAway ? "text-green-600" : "text-red-600";
        } else if (isAwayTurkish && !isHomeTurkish) {
            scoreColorClass = match.scoreAway > match.scoreHome ? "text-green-600" : "text-red-600";
        }
    }

    // Sport-specific badge color
    const getBadgeColor = (sport: SportType) => {
        switch (sport) {
            case 'football': return 'bg-green-100 text-green-700';
            case 'basketball': return 'bg-orange-100 text-orange-700';
            case 'volleyball': return 'bg-blue-100 text-blue-700';
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
                </div>

                {/* Teams & Score */}
                <div className="flex items-center justify-between mt-2">
                    {/* Home Team */}
                    <div className={`flex-1 text-center ${isHomeTurkish ? 'font-semibold' : ''}`}>
                        <span className="text-base leading-tight">{match.homeTeam}</span>
                    </div>

                    {/* Score / Time */}
                    <div className="flex flex-col items-center justify-center min-w-[80px] px-2">
                        {match.status === 'finished' ? (
                            <div className={`text-xl font-bold tracking-tight ${scoreColorClass}`}>
                                {match.scoreHome} - {match.scoreAway}
                            </div>
                        ) : (
                            <div className={`text-sm font-semibold px-3 py-1 rounded-full ${highlight ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                {timeStr}
                            </div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className={`flex-1 text-center ${isAwayTurkish ? 'font-semibold' : ''}`}>
                        <span className="text-base leading-tight">{match.awayTeam}</span>
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
    const [footballMatches, setFootballMatches] = useState<EuroMatch[]>([]);
    const [basketballMatches, setBasketballMatches] = useState<EuroMatch[]>([]);
    const [volleyballMatches, setVolleyballMatches] = useState<EuroMatch[]>([]);
    const [lastUpdated, setLastUpdated] = useState<LastUpdatedInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sport filter
    const [sportFilter, setSportFilter] = useState<'all' | SportType>('all');

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const cacheBuster = `?v=${Date.now()}`;

                // Fetch all JSON files in parallel
                const [footballRes, basketballRes, volleyballRes, lastUpdatedRes] = await Promise.allSettled([
                    fetch(`/data/football.json${cacheBuster}`),
                    fetch(`/data/basketball.json${cacheBuster}`),
                    fetch(`/data/volleyball.json${cacheBuster}`),
                    fetch(`/data/last_updated.json${cacheBuster}`)
                ]);

                // Process football
                try {
                    if (footballRes.status === 'fulfilled' && footballRes.value.ok) {
                        const data = await footballRes.value.json();
                        setFootballMatches(Array.isArray(data) ? data : []);
                    }
                } catch (e) { console.error('Error parsing football.json', e); }

                // Process basketball
                try {
                    if (basketballRes.status === 'fulfilled' && basketballRes.value.ok) {
                        const data = await basketballRes.value.json();
                        setBasketballMatches(Array.isArray(data) ? data : []);
                    }
                } catch (e) { console.error('Error parsing basketball.json', e); }

                // Process volleyball
                try {
                    if (volleyballRes.status === 'fulfilled' && volleyballRes.value.ok) {
                        const data = await volleyballRes.value.json();
                        setVolleyballMatches(Array.isArray(data) ? data : []);
                    }
                } catch (e) { console.error('Error parsing volleyball.json', e); }

                // Process last updated
                try {
                    if (lastUpdatedRes.status === 'fulfilled' && lastUpdatedRes.value.ok) {
                        const data = await lastUpdatedRes.value.json();
                        setLastUpdated(data);
                    }
                } catch (e) { console.error('Error parsing last_updated.json', e); }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Veri yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Combine and filter matches
    const allMatches = useMemo(() => {
        let matches: EuroMatch[] = [];

        if (sportFilter === 'all' || sportFilter === 'football') {
            matches = matches.concat(footballMatches);
        }
        if (sportFilter === 'all' || sportFilter === 'basketball') {
            matches = matches.concat(basketballMatches);
        }
        if (sportFilter === 'all' || sportFilter === 'volleyball') {
            matches = matches.concat(volleyballMatches);
        }

        return matches;
    }, [footballMatches, basketballMatches, volleyballMatches, sportFilter]);

    // Categorize matches
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todaysMatches = useMemo(() =>
        allMatches.filter(m => {
            const matchDate = new Date(m.startTimeLocal);
            return matchDate >= todayStart && matchDate < todayEnd;
        }).sort((a, b) => new Date(a.startTimeLocal).getTime() - new Date(b.startTimeLocal).getTime()),
        [allMatches, todayStart, todayEnd]);

    const upcomingMatches = useMemo(() =>
        allMatches
            .filter(m => new Date(m.startTimeLocal) >= todayEnd && m.status === 'scheduled')
            .sort((a, b) => new Date(a.startTimeLocal).getTime() - new Date(b.startTimeLocal).getTime())
            .slice(0, 10),
        [allMatches, todayEnd]);

    const recentMatches = useMemo(() =>
        allMatches
            .filter(m => new Date(m.startTimeLocal) < todayStart && m.status === 'finished')
            .sort((a, b) => new Date(b.startTimeLocal).getTime() - new Date(a.startTimeLocal).getTime())
            .slice(0, 10),
        [allMatches, todayStart]);

    const hasTodayMatches = todaysMatches.length > 0;

    return (
        <PageContainer>
            {/* Header Banner */}
            <div className={`${hasTodayMatches ? 'bg-gradient-to-r from-green-600 to-green-800' : 'bg-gradient-to-r from-slate-600 to-slate-800'} text-white p-8 md:p-12 mb-8 rounded-xl shadow-lg relative overflow-hidden`}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy size={32} className="text-yellow-400" />
                        <h1 className="text-3xl md:text-4xl font-bold">Avrupa Maç Merkezi</h1>
                    </div>

                    {/* Today's Match Status */}
                    <div className="flex items-center gap-3 mt-4">
                        {hasTodayMatches ? (
                            <>
                                <CheckCircle size={28} className="text-yellow-300" />
                                <span className="text-2xl font-semibold">
                                    Bugün {todaysMatches.length} maç var! ⚽🏀🏐
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
                        Futbol (UEFA), Basketbol (EuroLeague/EuroCup), Voleybol (CEV)
                    </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute left-1/2 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            {/* Sport Filter Tabs */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 sticky top-4 z-20">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {[
                        { id: 'all', label: 'Tümü', emoji: '🏆' },
                        { id: 'football', label: 'Futbol', emoji: '⚽' },
                        { id: 'basketball', label: 'Basketbol', emoji: '🏀' },
                        { id: 'volleyball', label: 'Voleybol', emoji: '🏐' },
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
                            {f.id === 'football' && footballMatches.length > 0 && (
                                <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">{footballMatches.length}</span>
                            )}
                            {f.id === 'basketball' && basketballMatches.length > 0 && (
                                <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{basketballMatches.length}</span>
                            )}
                            {f.id === 'volleyball' && volleyballMatches.length > 0 && (
                                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{volleyballMatches.length}</span>
                            )}
                        </button>
                    ))}
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
            {error && (
                <div className="text-center py-12 text-red-500 flex flex-col items-center gap-2">
                    <AlertCircle />
                    <span>{error}</span>
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
                                        {getSportEmoji(sportFilter)} {getSportDisplayName(sportFilter)} için önümüzdeki 14 gün içinde planlanmış maç yok.
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
                                        {getSportEmoji(sportFilter)} {getSportDisplayName(sportFilter)} için son 14 gün içinde tamamlanmış maç yok.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Last Updated Footer */}
                    {lastUpdated && (
                        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-400">
                            <p>
                                Son güncelleme: {new Date(lastUpdated.lastUpdated).toLocaleString('tr-TR')}
                            </p>
                            <div className="flex justify-center gap-4 mt-2">
                                <span className={lastUpdated.football.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                                    ⚽ {lastUpdated.football.matchCount} maç
                                </span>
                                <span className={lastUpdated.basketball.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                                    🏀 {lastUpdated.basketball.matchCount} maç
                                </span>
                                <span className={lastUpdated.volleyball.status === 'success' ? 'text-green-500' : 'text-red-500'}>
                                    🏐 {lastUpdated.volleyball.matchCount} maç
                                </span>
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
