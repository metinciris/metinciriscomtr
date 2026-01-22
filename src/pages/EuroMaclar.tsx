import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Match, TURKISH_TEAMS } from '../types/euroMatches';
import { Calendar, MapPin, Trophy, Search, AlertCircle, RefreshCw, Star } from 'lucide-react';

interface MatchCardProps {
    match: Match;
    special?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, special }) => {
    // Format date: "25 Oca Pzt 20:45"
    const dateObj = new Date(match.startTimeISO);
    const dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
    const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // Check if Turkish team wins (green) or loses (red) or other
    let scoreColorClass = "text-slate-700";
    if (match.status === 'finished' && match.homeScore !== undefined && match.awayScore !== undefined) {

        // Slightly different logic for Super Lig to avoid coloring everything red/green if both are Turkish
        const isHomeTurkish = TURKISH_TEAMS.some(t => match.homeTeam.includes(t));
        const isAwayTurkish = TURKISH_TEAMS.some(t => match.awayTeam.includes(t));
        // If it's a Euro match, we care about Turkish teams winning/losing
        // If it's Super Lig, maybe just highlight the winner or keep it neutral unless it's a derby? 
        // For simplicity, let's keep the logic but maybe refine later.

        // Only apply color logic for non-Super Lig competitive context where "us vs them" matters more?
        // Actually user wants to track "Euro Maclar" mainly, so let's keep the logic general.
        // If both are Turkish (Super Lig), it might look weird if one is green and one is red based on who they are?
        // No, let's just color based on score if we consider them "our" teams?
        // Actually, for Super Lig, just display the score normally without green/red bias unless we track a specific user team.
        // Let's rely on competition check.

        if (match.competition !== 'Super Lig') {
            if (isHomeTurkish) {
                if (match.homeScore > match.awayScore) scoreColorClass = "text-green-600";
                else if (match.homeScore < match.awayScore) scoreColorClass = "text-red-600";
            } else if (isAwayTurkish) {
                if (match.awayScore > match.homeScore) scoreColorClass = "text-green-600";
                else if (match.awayScore < match.homeScore) scoreColorClass = "text-red-600";
            }
        }
    }

    const isEuroLeague = match.competition === 'EuroLeague';

    let badgeColor = "bg-blue-100 text-blue-700";
    if (isEuroLeague) badgeColor = "bg-orange-100 text-orange-700";

    return (
        <div className={`bg-white rounded-xl shadow-sm border ${special ? 'border-yellow-400 shadow-md ring-1 ring-yellow-100' : 'border-slate-200'} p-4 hover:shadow-md transition-shadow relative overflow-hidden`}>
            {/* Competition Badge */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${badgeColor}`}>
                {match.competition}
            </div>

            <div className="flex flex-col gap-4">
                {/* Header: Date & Round */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <Calendar size={16} />
                    <span className={special ? "font-semibold text-slate-700" : ""}>{dateStr} • {timeStr}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{match.round}</span>
                </div>

                {/* Teams & Score */}
                <div className="flex items-center justify-between">
                    {/* Home */}
                    <div className={`flex-1 flex flex-col items-center text-center gap-2 ${match.status === 'finished' && match.homeScore && match.awayScore && match.homeScore > match.awayScore ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                        <span className="text-lg leading-tight">{match.homeTeam}</span>
                    </div>

                    {/* VS / Score */}
                    <div className="flex flex-col items-center justify-center min-w-[80px]">
                        {match.status === 'finished' ? (
                            <div className={`text-2xl font-bold tracking-tight ${scoreColorClass}`}>
                                {match.homeScore} - {match.awayScore}
                            </div>
                        ) : (
                            <div className={`text-sm font-semibold text-slate-400 px-3 py-1 rounded-full ${special ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100'}`}>
                                {match.status === 'live' ? 'CANLI' : timeStr}
                            </div>
                        )}
                    </div>

                    {/* Away */}
                    <div className={`flex-1 flex flex-col items-center text-center gap-2 ${match.status === 'finished' && match.homeScore && match.awayScore && match.awayScore > match.awayScore ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                        <span className="text-lg leading-tight">{match.awayTeam}</span>
                    </div>
                </div>

                {/* Venue */}
                {match.venue && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 justify-center">
                        <MapPin size={12} />
                        <span>{match.venue}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export function EuroMaclar() {
    const [fixtures, setFixtures] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [leagueFilter, setLeagueFilter] = useState<'All' | 'EuroLeague' | 'EuroCup'>('All');
    const [teamFilter, setTeamFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setLoading(true);
        fetch(`/data/fixtures.json?v=${new Date().getTime()}`)
            .then(res => {
                if (!res.ok) throw new Error('Veri yüklenemedi');
                return res.json();
            })
            .then(data => {
                setFixtures(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Fixture verisi alınamadı.');
                setLoading(false);
            });
    }, []);

    // Filter Logic
    const filteredMatches = fixtures.filter(match => {
        // 1. League Filter
        if (leagueFilter !== 'All' && match.competition !== leagueFilter) return false;

        // 2. Team Filter
        if (teamFilter !== 'All') {
            if (!match.homeTeam.includes(teamFilter) && !match.awayTeam.includes(teamFilter)) return false;
        }

        // 3. Search Query
        if (searchQuery) {
            const lowQ = searchQuery.toLowerCase();
            const content = (match.homeTeam + match.awayTeam + (match.venue || '')).toLowerCase();
            if (!content.includes(lowQ)) return false;
        }

        return true;
    });

    const now = new Date();
    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    // Classification Logic
    // Super Lig removed, only EuroLeague/Cup

    // We don't have separate Today section unless needed, but existing logic groups them.
    // For EuroLeague, usually we just show Upcoming and Past.
    // Let's keep the arrays but maybe not highlight Today specially unless it matches? 
    // Actually, user liked "Bugün" (Today) concept, so let's keep it if data exists.

    const todaysMatches = filteredMatches.filter(m => isSameDay(new Date(m.startTimeISO), now));

    const upcoming = filteredMatches
        .filter(m => new Date(m.startTimeISO) > now && !isSameDay(new Date(m.startTimeISO), now))
        .sort((a, b) => new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime());

    const past = filteredMatches
        .filter(m => new Date(m.startTimeISO) <= now && !isSameDay(new Date(m.startTimeISO), now))
        .sort((a, b) => new Date(b.startTimeISO).getTime() - new Date(a.startTimeISO).getTime());

    return (
        <PageContainer>
            {/* Header Section */}
            <div className="bg-gradient-to-r from-orange-700 to-orange-900 text-white p-8 md:p-12 mb-8 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Trophy size={32} className="text-yellow-400" />
                        <h1 className="text-3xl md:text-4xl font-bold">Avrupa Maç Merkezi</h1>
                    </div>
                    <p className="text-white/90 max-w-2xl text-lg">
                        EuroLeague ve EuroCup maçları ve canlı skorlar.
                    </p>
                </div>
                {/* Decorative elements */}
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute left-1/2 bottom-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl"></div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 sticky top-4 z-20 flex flex-col md:flex-row gap-4 items-center justify-between">

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {[
                        { id: 'All', label: 'Tümü' },
                        { id: 'EuroLeague', label: 'EuroLeague' },
                        { id: 'EuroCup', label: 'EuroCup' },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setLeagueFilter(f.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${leagueFilter === f.id ? 'bg-orange-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={teamFilter}
                        onChange={(e) => setTeamFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="All">Türk Takımları</option>
                        {TURKISH_TEAMS.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Takım ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>
            </div>

            {loading && (
                <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
                    <RefreshCw className="animate-spin" />
                    <span>Veriler yükleniyor...</span>
                </div>
            )}

            {error && (
                <div className="text-center py-12 text-red-500 flex flex-col items-center gap-2">
                    <AlertCircle />
                    <span>{error}</span>
                </div>
            )}

            {!loading && !error && (
                <div className="space-y-12">

                    {/* Today's Matches Section */}
                    {todaysMatches.length > 0 && (
                        <section className="bg-gradient-to-b from-yellow-50 to-white p-6 rounded-2xl border border-yellow-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Star className="text-yellow-500 fill-yellow-500" />
                                <h2 className="text-2xl font-bold text-slate-900">Bugün Oynanacak Maçlar</h2>
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold animate-pulse">CANLI / BUGÜN</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {todaysMatches.map(match => (
                                    <MatchCard key={match.id} match={match} special />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Upcoming Matches */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Gelecek Maçlar</h2>
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">{upcoming.length}</span>
                        </div>

                        {upcoming.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcoming.map(match => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">Planlanmış maç bulunamadı.</p>
                        )}
                    </section>

                    {/* Past Matches */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Tamamlanan Maçlar</h2>
                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">{past.length}</span>
                        </div>

                        {past.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {past.map(match => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">Geçmiş maç bulunamadı.</p>
                        )}
                    </section>
                </div>
            )}
        </PageContainer>
    );
}

// Default export for lazy loading
export default EuroMaclar;
