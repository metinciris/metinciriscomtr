import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { RelatedPages } from '../components/RelatedPages';
import { Globe, Clock, Sun, Moon, Plus, X, Calendar, Users, Copy, Check, Share2 } from 'lucide-react';
import moment from 'moment-timezone';

interface City {
    id: string;
    name: string;
    timezone: string;
    offset: number; // UTC offset for positioning
    country: string;
}

const CITIES: City[] = [
    { id: 'la', name: 'Los Angeles', timezone: 'America/Los_Angeles', offset: -8, country: 'ABD' },
    { id: 'ny', name: 'New York', timezone: 'America/New_York', offset: -5, country: 'ABD' },
    { id: 'london', name: 'Londra', timezone: 'Europe/London', offset: 0, country: 'İngiltere' },
    { id: 'paris', name: 'Paris', timezone: 'Europe/Paris', offset: 1, country: 'Fransa' },
    { id: 'berlin', name: 'Berlin', timezone: 'Europe/Berlin', offset: 1, country: 'Almanya' },
    { id: 'istanbul', name: 'İstanbul', timezone: 'Europe/Istanbul', offset: 3, country: 'Türkiye' },
    { id: 'moscow', name: 'Moskova', timezone: 'Europe/Moscow', offset: 3, country: 'Rusya' },
    { id: 'dubai', name: 'Dubai', timezone: 'Asia/Dubai', offset: 4, country: 'BAE' },
];

// Sort cities by UTC offset for the bar display
const SORTED_CITIES = [...CITIES].sort((a, b) => a.offset - b.offset);

export function DunyaSaatleri() {
    const [currentTime, setCurrentTime] = useState(moment());
    const [selectedCities, setSelectedCities] = useState<string[]>(['istanbul']);
    const [meetingDate, setMeetingDate] = useState(moment().format('YYYY-MM-DD'));
    const [meetingHour, setMeetingHour] = useState('20:00');
    const [meetingCity, setMeetingCity] = useState('istanbul');
    const [meetingName, setMeetingName] = useState('');
    const [meetingDuration, setMeetingDuration] = useState(60);
    const [copied, setCopied] = useState(false);

    // Preset time options (every 30 min)
    const PRESET_TIMES = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
        '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
        '21:00', '21:30', '22:00'
    ];

    // Duration options
    const DURATION_OPTIONS = [
        { value: 30, label: '30 dk' },
        { value: 45, label: '45 dk' },
        { value: 60, label: '1 saat' },
        { value: 90, label: '1.5 saat' },
        { value: 120, label: '2 saat' }
    ];

    // Update current time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(moment());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Check if it's daytime in a timezone
    const isDaytime = useCallback((timezone: string, time: moment.Moment = currentTime) => {
        const localHour = time.clone().tz(timezone).hour();
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

    // Get combined meeting datetime
    const getMeetingMoment = () => {
        const sourceTz = CITIES.find(c => c.id === meetingCity)?.timezone || 'Europe/Istanbul';
        return moment.tz(`${meetingDate}T${meetingHour}`, sourceTz);
    };

    // Get time in a specific timezone for meeting
    const getMeetingTimeInTimezone = (timezone: string) => {
        return getMeetingMoment().clone().tz(timezone);
    };

    // Generate WhatsApp share text
    const generateShareText = () => {
        const meetingMoment = getMeetingMoment();
        const sourceCity = CITIES.find(c => c.id === meetingCity);

        let text = `📅 *${meetingName || 'Toplantı'}*\n`;
        text += `━━━━━━━━━━━━━━━━━━\n`;
        text += `⏱️ Süre: ${DURATION_OPTIONS.find(d => d.value === meetingDuration)?.label || `${meetingDuration} dk`}\n\n`;
        text += `🏠 ${sourceCity?.name}: ${meetingMoment.format('DD MMM YYYY HH:mm')} _(yerel saat)_\n\n`;
        text += `🌍 *Diğer Şehirler:*\n`;

        CITIES.filter(city => selectedCities.includes(city.id) && city.id !== meetingCity).forEach(city => {
            const cityTime = getMeetingTimeInTimezone(city.timezone);
            const dayDiff = cityTime.diff(meetingMoment, 'days');
            const dayNote = dayDiff !== 0 ? ` _(${dayDiff > 0 ? '+' : ''}${dayDiff} gün)_` : '';
            text += `• ${city.name}: ${cityTime.format('HH:mm')}${dayNote}\n`;
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

    // Format time display
    const formatTime = (m: moment.Moment) => m.format('HH:mm:ss');
    const formatDate = (m: moment.Moment) => m.format('DD MMM');

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
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 mb-8 shadow-2xl border border-slate-700">
                {/* UTC Scale */}
                <div className="flex items-center justify-between mb-3 px-2 text-xs text-slate-500 font-mono">
                    <span>UTC-8</span>
                    <span>UTC-5</span>
                    <span>UTC±0</span>
                    <span>UTC+1</span>
                    <span>UTC+3</span>
                    <span>UTC+4</span>
                </div>

                {/* Timeline Bar */}
                <div className="relative h-3 bg-gradient-to-r from-slate-700 via-blue-600 to-amber-500 rounded-full mb-2 overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                {/* City Points Row */}
                <div className="relative h-20 mb-2">
                    {SORTED_CITIES.map((city, index) => {
                        const isSelected = selectedCities.includes(city.id);
                        const cityTime = currentTime.clone().tz(city.timezone);
                        const isDay = isDaytime(city.timezone);
                        const position = (index / (SORTED_CITIES.length - 1)) * 100;

                        return (
                            <div
                                key={city.id}
                                className="absolute transform -translate-x-1/2 cursor-pointer group transition-all duration-300"
                                style={{ left: `${position}%` }}
                                onClick={() => toggleCity(city.id)}
                            >
                                {/* Connector Line */}
                                <div className={`w-0.5 h-4 mx-auto transition-all duration-300 ${isSelected ? 'bg-amber-400' : 'bg-slate-600'
                                    }`} />

                                {/* City Dot */}
                                <div className={`relative w-5 h-5 mx-auto rounded-full transition-all duration-300 flex items-center justify-center ${isSelected
                                    ? 'bg-amber-400 shadow-lg shadow-amber-400/50 scale-125'
                                    : isDay
                                        ? 'bg-blue-400 group-hover:bg-blue-300'
                                        : 'bg-slate-500 group-hover:bg-slate-400'
                                    }`}>
                                    {isDay ? (
                                        <Sun className="w-3 h-3 text-white" />
                                    ) : (
                                        <Moon className="w-3 h-3 text-white" />
                                    )}
                                </div>

                                {/* Time Display */}
                                <div className={`text-center mt-2 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                                    }`}>
                                    <div className={`text-sm font-bold tabular-nums ${isSelected ? 'text-amber-400' : 'text-white'
                                        }`}>
                                        {cityTime.format('HH:mm')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* City Names Row */}
                <div className="relative h-12">
                    {SORTED_CITIES.map((city, index) => {
                        const isSelected = selectedCities.includes(city.id);
                        const position = (index / (SORTED_CITIES.length - 1)) * 100;

                        return (
                            <div
                                key={city.id}
                                className="absolute transform -translate-x-1/2 text-center cursor-pointer"
                                style={{ left: `${position}%`, width: '80px' }}
                                onClick={() => toggleCity(city.id)}
                            >
                                <div className={`text-xs font-semibold transition-all duration-300 ${isSelected ? 'text-amber-400' : 'text-slate-300'
                                    }`}>
                                    {city.name}
                                </div>
                                <div className={`text-[10px] transition-all duration-300 ${isSelected ? 'text-amber-400/70' : 'text-slate-500'
                                    }`}>
                                    {city.country}
                                </div>
                            </div>
                        );
                    })}
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

                        {/* Time Selection with Presets */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Clock className="w-4 h-4 text-amber-500" />
                                Saat
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {PRESET_TIMES.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => setMeetingHour(time)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${meetingHour === time
                                                ? 'bg-amber-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="time"
                                value={meetingHour}
                                onChange={(e) => setMeetingHour(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-sm"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Clock className="w-4 h-4 text-amber-500" />
                                Süre
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {DURATION_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setMeetingDuration(opt.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${meetingDuration === opt.value
                                                ? 'bg-amber-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                                            const meetingMoment = getMeetingTimeInTimezone(city.timezone);
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
                                                                {meetingMoment.format('HH:mm')}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {meetingMoment.format('DD MMM YYYY')}
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

                                    {/* Add City Button */}
                                    {CITIES.filter(c => !selectedCities.includes(c.id)).length > 0 && (
                                        <button
                                            onClick={() => {
                                                const availableCities = CITIES.filter(c => !selectedCities.includes(c.id));
                                                if (availableCities.length > 0) {
                                                    toggleCity(availableCities[0].id);
                                                }
                                            }}
                                            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50/50 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span className="font-medium">Şehir Ekle</span>
                                        </button>
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
                            const cityTime = currentTime.clone().tz(city.timezone);
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
                                                {formatTime(cityTime)}
                                            </div>
                                            <div className="text-sm text-gray-500">{formatDate(cityTime)}</div>
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
