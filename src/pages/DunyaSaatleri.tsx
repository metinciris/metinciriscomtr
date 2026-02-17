import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { RelatedPages } from '../components/RelatedPages';
import { Globe, Clock, Sun, Moon, Plus, X, Calendar, Users, Check, Share2, Search } from 'lucide-react';

// ─── Intl helpers (replaces moment-timezone, saves ~793KB) ───────────

/** Get numeric hour (0-23) in a timezone */
function getHourInTz(date: Date, tz: string): number {
    const h = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(date);
    return parseInt(h) % 24;
}

/** Format as HH:mm */
function fmtHHMM(date: Date, tz: string): string {
    return new Intl.DateTimeFormat('tr-TR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

/** Format as HH:mm:ss */
function fmtHHMMSS(date: Date, tz: string): string {
    return new Intl.DateTimeFormat('tr-TR', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date);
}

/** Format as DD MMM */
function fmtDDMMM(date: Date, tz: string): string {
    return new Intl.DateTimeFormat('tr-TR', { timeZone: tz, day: '2-digit', month: 'short' }).format(date);
}

/** Format as DD MMM YYYY HH:mm */
function fmtFull(date: Date, tz: string): string {
    return new Intl.DateTimeFormat('tr-TR', {
        timeZone: tz, day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(date);
}

/** Format as DD MMM YYYY */
function fmtDDMMMYYYY(date: Date, tz: string): string {
    return new Intl.DateTimeFormat('tr-TR', {
        timeZone: tz, day: '2-digit', month: 'short', year: 'numeric',
    }).format(date);
}

/** Create a Date representing a local date+time in a given timezone */
function createDateInTz(dateStr: string, timeStr: string, timezone: string): Date {
    // Use a reference point to calculate the UTC offset of the timezone
    const ref = new Date(`${dateStr}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false,
    }).formatToParts(ref);
    const g = (t: string) => parseInt(parts.find(p => p.type === t)?.value || '0');
    const tzAsUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), 0);
    const offsetMs = ref.getTime() - tzAsUtc;

    const [h, m] = timeStr.split(':').map(Number);
    const [y, mo, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, mo - 1, d, h, m, 0) + offsetMs);
}

/** Calculate difference in displayed calendar days between two timezones for the same instant */
function dayDiffBetweenTz(date: Date, sourceTz: string, targetTz: string): number {
    const dayVal = (tz: string) => {
        const p = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric',
        }).formatToParts(date);
        const g = (t: string) => parseInt(p.find(pp => pp.type === t)?.value || '0');
        return new Date(g('year'), g('month') - 1, g('day')).getTime();
    };
    return Math.round((dayVal(targetTz) - dayVal(sourceTz)) / 86400000);
}

/** Today as YYYY-MM-DD */
function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── City data ───────────────────────────────────────────────────────

interface City {
    id: string;
    name: string;
    timezone: string;
    offset: number; // UTC offset for positioning
    country: string;
}

const CITIES: City[] = [
    // Americas
    { id: 'la', name: 'Los Angeles', timezone: 'America/Los_Angeles', offset: -8, country: 'ABD' },
    { id: 'sf', name: 'San Francisco', timezone: 'America/Los_Angeles', offset: -8, country: 'ABD' },
    { id: 'denver', name: 'Denver', timezone: 'America/Denver', offset: -7, country: 'ABD' },
    { id: 'chicago', name: 'Chicago', timezone: 'America/Chicago', offset: -6, country: 'ABD' },
    { id: 'houston', name: 'Houston', timezone: 'America/Chicago', offset: -6, country: 'ABD' },
    { id: 'ny', name: 'New York', timezone: 'America/New_York', offset: -5, country: 'ABD' },
    { id: 'toronto', name: 'Toronto', timezone: 'America/Toronto', offset: -5, country: 'Kanada' },
    { id: 'saopaulo', name: 'São Paulo', timezone: 'America/Sao_Paulo', offset: -3, country: 'Brezilya' },
    { id: 'buenosaires', name: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', offset: -3, country: 'Arjantin' },
    // Europe
    { id: 'london', name: 'Londra', timezone: 'Europe/London', offset: 0, country: 'İngiltere' },
    { id: 'dublin', name: 'Dublin', timezone: 'Europe/Dublin', offset: 0, country: 'İrlanda' },
    { id: 'lisbon', name: 'Lizbon', timezone: 'Europe/Lisbon', offset: 0, country: 'Portekiz' },
    { id: 'paris', name: 'Paris', timezone: 'Europe/Paris', offset: 1, country: 'Fransa' },
    { id: 'berlin', name: 'Berlin', timezone: 'Europe/Berlin', offset: 1, country: 'Almanya' },
    { id: 'amsterdam', name: 'Amsterdam', timezone: 'Europe/Amsterdam', offset: 1, country: 'Hollanda' },
    { id: 'madrid', name: 'Madrid', timezone: 'Europe/Madrid', offset: 1, country: 'İspanya' },
    { id: 'rome', name: 'Roma', timezone: 'Europe/Rome', offset: 1, country: 'İtalya' },
    { id: 'zurich', name: 'Zürih', timezone: 'Europe/Zurich', offset: 1, country: 'İsviçre' },
    { id: 'vienna', name: 'Viyana', timezone: 'Europe/Vienna', offset: 1, country: 'Avusturya' },
    { id: 'warsaw', name: 'Varşova', timezone: 'Europe/Warsaw', offset: 1, country: 'Polonya' },
    { id: 'athens', name: 'Atina', timezone: 'Europe/Athens', offset: 2, country: 'Yunanistan' },
    { id: 'bucharest', name: 'Bükreş', timezone: 'Europe/Bucharest', offset: 2, country: 'Romanya' },
    { id: 'helsinki', name: 'Helsinki', timezone: 'Europe/Helsinki', offset: 2, country: 'Finlandiya' },
    { id: 'istanbul', name: 'İstanbul', timezone: 'Europe/Istanbul', offset: 3, country: 'Türkiye' },
    { id: 'ankara', name: 'Ankara', timezone: 'Europe/Istanbul', offset: 3, country: 'Türkiye' },
    { id: 'moscow', name: 'Moskova', timezone: 'Europe/Moscow', offset: 3, country: 'Rusya' },
    // Middle East & Africa
    { id: 'dubai', name: 'Dubai', timezone: 'Asia/Dubai', offset: 4, country: 'BAE' },
    { id: 'riyadh', name: 'Riyad', timezone: 'Asia/Riyadh', offset: 3, country: 'Suudi Arabistan' },
    { id: 'cairo', name: 'Kahire', timezone: 'Africa/Cairo', offset: 2, country: 'Mısır' },
    { id: 'johannesburg', name: 'Johannesburg', timezone: 'Africa/Johannesburg', offset: 2, country: 'Güney Afrika' },
    // Asia & Pacific
    { id: 'mumbai', name: 'Mumbai', timezone: 'Asia/Kolkata', offset: 5.5, country: 'Hindistan' },
    { id: 'delhi', name: 'Delhi', timezone: 'Asia/Kolkata', offset: 5.5, country: 'Hindistan' },
    { id: 'singapore', name: 'Singapur', timezone: 'Asia/Singapore', offset: 8, country: 'Singapur' },
    { id: 'hongkong', name: 'Hong Kong', timezone: 'Asia/Hong_Kong', offset: 8, country: 'Çin' },
    { id: 'beijing', name: 'Pekin', timezone: 'Asia/Shanghai', offset: 8, country: 'Çin' },
    { id: 'seoul', name: 'Seul', timezone: 'Asia/Seoul', offset: 9, country: 'Güney Kore' },
    { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', offset: 9, country: 'Japonya' },
    { id: 'sydney', name: 'Sidney', timezone: 'Australia/Sydney', offset: 11, country: 'Avustralya' },
    { id: 'auckland', name: 'Auckland', timezone: 'Pacific/Auckland', offset: 13, country: 'Yeni Zelanda' },
];

// Sort cities by UTC offset for the bar display
const SORTED_CITIES = [...CITIES].sort((a, b) => a.offset - b.offset);

// ─── Component ───────────────────────────────────────────────────────

export function DunyaSaatleri() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedCities, setSelectedCities] = useState<string[]>(['istanbul']);
    const [meetingDate, setMeetingDate] = useState(todayStr());
    const [meetingStartTime, setMeetingStartTime] = useState('20:00');
    const [meetingEndTime, setMeetingEndTime] = useState('21:00');
    const [useEndTime, setUseEndTime] = useState(false);
    const [meetingCity, setMeetingCity] = useState('istanbul');
    const [meetingName, setMeetingName] = useState('');
    const [meetingDuration, setMeetingDuration] = useState(60);
    const [copied, setCopied] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);

    // Scroll to Istanbul on mount
    useEffect(() => {
        if (timelineRef.current) {
            const istanbulIndex = SORTED_CITIES.findIndex(c => c.id === 'istanbul');
            if (istanbulIndex >= 0) {
                const scrollWidth = timelineRef.current.scrollWidth;
                const clientWidth = timelineRef.current.clientWidth;
                const istanbulPosition = (istanbulIndex / (SORTED_CITIES.length - 1)) * scrollWidth;
                const scrollTo = istanbulPosition - (clientWidth / 2);
                timelineRef.current.scrollLeft = Math.max(0, scrollTo);
            }
        }
    }, []);

    // Duration options (expanded)
    const DURATION_OPTIONS = [
        { value: 30, label: '30 dk' },
        { value: 45, label: '45 dk' },
        { value: 60, label: '1 saat' },
        { value: 90, label: '1.5 saat' },
        { value: 120, label: '2 saat' },
        { value: 180, label: '3 saat' },
        { value: 240, label: '4 saat' },
        { value: 480, label: '8 saat' }
    ];

    // Filter cities for search
    const filteredCities = useMemo(() => {
        if (!citySearch.trim()) return CITIES.filter(c => !selectedCities.includes(c.id));
        const search = citySearch.toLowerCase();
        return CITIES.filter(c =>
            !selectedCities.includes(c.id) &&
            (c.name.toLowerCase().includes(search) || c.country.toLowerCase().includes(search))
        );
    }, [citySearch, selectedCities]);

    // Update current time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Check if it's daytime in a timezone
    const isDaytime = useCallback((timezone: string, time: Date = currentTime) => {
        const localHour = getHourInTz(time, timezone);
        return localHour >= 6 && localHour < 20;
    }, [currentTime]);

    // Toggle city selection
    const toggleCity = (cityId: string) => {
        setSelectedCities(prev =>
            prev.includes(cityId)
                ? prev.filter(id => id !== cityId)
                : [...prev, cityId]
        );
    };

    // Get meeting date as UTC Date
    const getMeetingDate = () => {
        const sourceTz = CITIES.find(c => c.id === meetingCity)?.timezone || 'Europe/Istanbul';
        return createDateInTz(meetingDate, meetingStartTime, sourceTz);
    };

    // Calculate duration from start/end times
    const getEffectiveDuration = () => {
        if (!useEndTime) return meetingDuration;
        const [sh, sm] = meetingStartTime.split(':').map(Number);
        const [eh, em] = meetingEndTime.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60; // Handle overnight
        return diff;
    };

    // Format duration for display
    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins} dk`;
        const hours = Math.floor(mins / 60);
        const remaining = mins % 60;
        return remaining > 0 ? `${hours} saat ${remaining} dk` : `${hours} saat`;
    };

    // Generate WhatsApp share text
    const generateShareText = () => {
        const meetingMoment = getMeetingDate();
        const sourceCity = CITIES.find(c => c.id === meetingCity);
        const sourceTz = sourceCity?.timezone || 'Europe/Istanbul';
        const duration = getEffectiveDuration();

        let text = `📅 *${meetingName || 'Toplantı'}*\n`;
        text += `━━━━━━━━━━━━━━━━━━\n`;
        text += `⏱️ Süre: ${formatDuration(duration)}\n\n`;
        text += `🏠 ${sourceCity?.name}: ${fmtFull(meetingMoment, sourceTz)}${useEndTime ? ` - ${meetingEndTime}` : ''} _(yerel saat)_\n\n`;
        text += `🌍 *Diğer Şehirler:*\n`;

        CITIES.filter(city => selectedCities.includes(city.id) && city.id !== meetingCity).forEach(city => {
            const dayDiff = dayDiffBetweenTz(meetingMoment, sourceTz, city.timezone);
            const dayNote = dayDiff !== 0 ? ` _(${dayDiff > 0 ? '+' : ''}${dayDiff} gün)_` : '';
            text += `• ${city.name}: ${fmtHHMM(meetingMoment, city.timezone)}${dayNote}\n`;
        });

        text += `\n━━━━━━━━━━━━━━━━━━`;
        return text;
    };

    // Copy to clipboard
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generateShareText());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Kopyalama başarısız:', err);
        }
    };

    return (
        <PageContainer>
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-8 md:p-12 mb-8">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`,
                    }} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                            <Globe className="w-7 h-7" />
                        </div>
                        <span className="px-4 py-1.5 bg-white/10 rounded-full text-sm font-bold tracking-wider uppercase">
                            Zaman Dilimleri
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                        Dünya Saatleri
                    </h1>
                    <p className="text-lg text-white/70 max-w-2xl">
                        Avrupa ve Amerika'daki önemli merkezlerin anlık saatleri. Toplantı zamanlarını kolayca planlayın.
                    </p>
                </div>
            </div>

            {/* Timezone Bar */}
            <div ref={timelineRef} className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 mb-8 shadow-2xl border border-slate-700 overflow-x-auto">
                {/* Timeline with Cities */}
                <div className="min-w-[800px]">
                    {/* Top Row Cities (even index) */}
                    <div className="relative h-24 mb-2">
                        {SORTED_CITIES.filter((_, i) => i % 2 === 0).map((city) => {
                            const originalIndex = SORTED_CITIES.findIndex(c => c.id === city.id);
                            const isSelected = selectedCities.includes(city.id);
                            const isDay = isDaytime(city.timezone);
                            const position = (originalIndex / (SORTED_CITIES.length - 1)) * 100;

                            return (
                                <div
                                    key={city.id}
                                    className="absolute transform -translate-x-1/2 cursor-pointer group flex flex-col items-center"
                                    style={{ left: `${position}%` }}
                                    onClick={() => toggleCity(city.id)}
                                >
                                    {/* City Name - Vertical */}
                                    <div
                                        className={`text-xs font-bold whitespace-nowrap mb-1 transition-all ${isSelected ? 'text-amber-400' : 'text-slate-300 group-hover:text-white'
                                            }`}
                                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: '60px', overflow: 'hidden' }}
                                    >
                                        {city.name}
                                    </div>
                                    {/* Time */}
                                    <div className={`text-xs font-bold tabular-nums ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                                        {fmtHHMM(currentTime, city.timezone)}
                                    </div>
                                    {/* Dot */}
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center mt-1 transition-all ${isSelected
                                        ? 'bg-amber-400 shadow-md shadow-amber-400/50'
                                        : isDay ? 'bg-blue-400' : 'bg-slate-500'
                                        }`}>
                                        {isDay ? <Sun className="w-2.5 h-2.5 text-white" /> : <Moon className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    {/* Connector */}
                                    <div className={`w-0.5 h-3 ${isSelected ? 'bg-amber-400' : 'bg-slate-600'}`} />
                                </div>
                            );
                        })}
                    </div>

                    {/* Timeline Bar */}
                    <div className="relative h-3 bg-gradient-to-r from-slate-700 via-blue-600 to-amber-500 rounded-full overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>

                    {/* Bottom Row Cities (odd index) */}
                    <div className="relative h-16 mt-2">
                        {SORTED_CITIES.filter((_, i) => i % 2 === 1).map((city) => {
                            const originalIndex = SORTED_CITIES.findIndex(c => c.id === city.id);
                            const isSelected = selectedCities.includes(city.id);
                            const isDay = isDaytime(city.timezone);
                            const position = (originalIndex / (SORTED_CITIES.length - 1)) * 100;

                            return (
                                <div
                                    key={city.id}
                                    className="absolute transform -translate-x-1/2 cursor-pointer group flex flex-col items-center"
                                    style={{ left: `${position}%` }}
                                    onClick={() => toggleCity(city.id)}
                                >
                                    {/* Connector */}
                                    <div className={`w-0.5 h-3 ${isSelected ? 'bg-amber-400' : 'bg-slate-600'}`} />
                                    {/* Dot */}
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center mt-0 transition-all ${isSelected
                                        ? 'bg-amber-400 shadow-md shadow-amber-400/50'
                                        : isDay ? 'bg-blue-400' : 'bg-slate-500'
                                        }`}>
                                        {isDay ? <Sun className="w-2.5 h-2.5 text-white" /> : <Moon className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    {/* Time */}
                                    <div className={`text-xs font-bold tabular-nums mt-1 ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                                        {fmtHHMM(currentTime, city.timezone)}
                                    </div>
                                    {/* City Name - Vertical */}
                                    <div
                                        className={`text-xs font-bold whitespace-nowrap mt-1 transition-all ${isSelected ? 'text-amber-400' : 'text-slate-300 group-hover:text-white'
                                            }`}
                                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', maxHeight: '60px', overflow: 'hidden' }}
                                    >
                                        {city.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center">
                            <Sun className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span>Gündüz</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center">
                            <Moon className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span>Gece</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
                        <span>Seçili</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Meeting Panel */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex items-center gap-3">
                        <Users className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Toplantı Oluştur</h2>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Meeting Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Users className="w-4 h-4 text-amber-500" />
                                Toplantı Adı
                            </label>
                            <input
                                type="text"
                                value={meetingName}
                                onChange={(e) => setMeetingName(e.target.value)}
                                placeholder="Örn: Haftalık Ekip Toplantısı"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                            />
                        </div>

                        {/* Date & City Row */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    Tarih
                                </label>
                                <input
                                    type="date"
                                    value={meetingDate}
                                    onChange={(e) => setMeetingDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Globe className="w-4 h-4 text-amber-500" />
                                    Toplantı Şehri
                                </label>
                                <select
                                    value={meetingCity}
                                    onChange={(e) => {
                                        const newCity = e.target.value;
                                        setMeetingCity(newCity);
                                        if (!selectedCities.includes(newCity)) {
                                            setSelectedCities(prev => [...prev, newCity]);
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                                >
                                    {CITIES.map(city => (
                                        <option key={city.id} value={city.id}>{city.name}, {city.country}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Time Selection - Simplified */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    Saat
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useEndTime}
                                        onChange={(e) => setUseEndTime(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-gray-600">Başlangıç-Bitiş</span>
                                </label>
                            </div>
                            <div className={`grid gap-3 ${useEndTime ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">{useEndTime ? 'Başlangıç' : 'Saat'}</label>
                                    <input
                                        type="time"
                                        value={meetingStartTime}
                                        onChange={(e) => setMeetingStartTime(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                                    />
                                </div>
                                {useEndTime && (
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Bitiş</label>
                                        <input
                                            type="time"
                                            value={meetingEndTime}
                                            onChange={(e) => setMeetingEndTime(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                                        />
                                    </div>
                                )}
                            </div>
                            {useEndTime && (
                                <div className="mt-2 text-sm text-amber-600 font-medium">
                                    Toplam: {formatDuration(getEffectiveDuration())}
                                </div>
                            )}
                        </div>

                        {/* Duration - Only show if not using end time */}
                        {!useEndTime && (
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    Süre
                                </label>
                                <select
                                    value={meetingDuration}
                                    onChange={(e) => setMeetingDuration(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                                >
                                    {DURATION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Meeting Times List */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <Clock className="w-4 h-4 text-amber-500" />
                                Seçili Şehirlerde Toplantı Saati
                            </h3>

                            {selectedCities.length > 0 ? (
                                <div className="space-y-2">
                                    {CITIES.filter(city => selectedCities.includes(city.id))
                                        .sort((a, b) => {
                                            // Meeting city first
                                            if (a.id === meetingCity) return -1;
                                            if (b.id === meetingCity) return 1;
                                            return a.offset - b.offset;
                                        })
                                        .map(city => {
                                            const meetingMoment = getMeetingDate();
                                            const isDay = isDaytime(city.timezone, meetingMoment);
                                            const isMeetingCity = city.id === meetingCity;

                                            return (
                                                <div
                                                    key={city.id}
                                                    className={`flex items-center justify-between p-4 rounded-xl transition-all ${isMeetingCity
                                                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200'
                                                        : 'bg-gray-50 border border-gray-100 hover:border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMeetingCity
                                                            ? 'bg-amber-500 text-white'
                                                            : isDay
                                                                ? 'bg-blue-100 text-blue-600'
                                                                : 'bg-gray-200 text-gray-600'
                                                            }`}>
                                                            {isDay ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className={`font-semibold ${isMeetingCity ? 'text-amber-700' : 'text-gray-800'}`}>
                                                                {city.name}
                                                                {isMeetingCity && (
                                                                    <span className="ml-2 text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                                                                        Yerel
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{city.country}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <div className={`text-xl font-bold tabular-nums ${isMeetingCity ? 'text-amber-600' : 'text-gray-800'
                                                                }`}>
                                                                {fmtHHMM(meetingMoment, city.timezone)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {fmtDDMMMYYYY(meetingMoment, city.timezone)}
                                                            </div>
                                                        </div>
                                                        {!isMeetingCity && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleCity(city.id);
                                                                }}
                                                                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                                            >
                                                                <X className="w-4 h-4 text-gray-400" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    {/* Add City - Search Dropdown */}
                                    {CITIES.filter(c => !selectedCities.includes(c.id)).length > 0 && (
                                        <div className="relative">
                                            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                                <Search className="w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={citySearch}
                                                    onChange={(e) => {
                                                        setCitySearch(e.target.value);
                                                        setShowCityDropdown(true);
                                                    }}
                                                    onFocus={() => setShowCityDropdown(true)}
                                                    placeholder="Şehir ara veya yandan ekle..."
                                                    className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                                                />
                                            </div>
                                            {showCityDropdown && filteredCities.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                    {filteredCities.slice(0, 10).map(city => (
                                                        <button
                                                            key={city.id}
                                                            onClick={() => {
                                                                toggleCity(city.id);
                                                                setCitySearch('');
                                                                setShowCityDropdown(false);
                                                            }}
                                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
                                                        >
                                                            <div>
                                                                <div className="font-medium text-gray-800">{city.name}</div>
                                                                <div className="text-xs text-gray-500">{city.country} • UTC{city.offset >= 0 ? '+' : ''}{city.offset}</div>
                                                            </div>
                                                            <Plus className="w-5 h-5 text-amber-500" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Yukarıdaki çizgiden şehirlere tıklayarak seçim yapın</p>
                                </div>
                            )}
                        </div>

                        {/* Share Button */}
                        {selectedCities.length > 0 && (
                            <button
                                onClick={copyToClipboard}
                                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all ${copied
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5'
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Kopyalandı!
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-5 h-5" />
                                        WhatsApp için Kopyala
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* City Times Panel */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Anlık Şehir Saatleri</h2>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {SORTED_CITIES.map(city => {
                            const isDay = isDaytime(city.timezone);
                            const isSelected = selectedCities.includes(city.id);

                            return (
                                <div
                                    key={city.id}
                                    onClick={() => toggleCity(city.id)}
                                    className={`px-6 py-4 cursor-pointer transition-all ${isSelected
                                        ? 'bg-amber-50 border-l-4 border-amber-500'
                                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected
                                                ? 'bg-amber-100 text-amber-600'
                                                : isDay
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {isDay ? (
                                                    <Sun className="w-6 h-6" />
                                                ) : (
                                                    <Moon className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div>
                                                <div className={`font-bold text-lg ${isSelected ? 'text-amber-700' : 'text-gray-800'}`}>
                                                    {city.name}
                                                </div>
                                                <div className="text-sm text-gray-500">{city.country} • UTC{city.offset >= 0 ? '+' : ''}{city.offset}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold tabular-nums ${isSelected ? 'text-amber-600' : 'text-gray-800'}`}>
                                                {fmtHHMMSS(currentTime, city.timezone)}
                                            </div>
                                            <div className="text-sm text-gray-500">{fmtDDMMM(currentTime, city.timezone)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="font-bold mb-4 text-amber-400 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    Kullanım İpuçları
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-300">
                    <div className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>Üstteki zaman çizgisinden şehirlere tıklayarak seçim yapın</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>Toplantı şehrini ve saatini belirleyip diğer şehirlerdeki karşılıkları görün</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>WhatsApp butonu ile toplantı zamanlarını kolayca paylaşın</span>
                    </div>
                </div>
            </div>

            <RelatedPages
                pages={[
                    {
                        title: "Konsensus Takip",
                        subtitle: "Patoloji toplantı takvimi",
                        page: "konsensus",
                        color: "bg-blue-600",
                        icon: Users
                    }
                ]}
            />
        </PageContainer>
    );
}
