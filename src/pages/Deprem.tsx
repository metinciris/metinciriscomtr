import React, { useEffect, useState, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Activity, RefreshCw, AlertTriangle, MapPin, Clock, AlertOctagon, Zap, Volume2, VolumeX } from 'lucide-react';

interface Earthquake {
    earthquake_id: string;
    title: string;
    mag: number;
    depth: number;
    date_time: string;
    location_properties: {
        closestCity: {
            name: string;
            distance: number;
        };
    };
}

interface APIResponse {
    status: boolean;
    result: Earthquake[];
    metadata: {
        count: number;
    };
}

export function Deprem() {
    const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
    // Loading state for data fetching
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const latestEqDateRef = useRef<string | null>(null);

    const playBeep = (frequency = 440, duration = 0.1) => {
        if (!soundEnabled) return;

        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.error('Audio play error:', e);
        }
    };

    const playBeepSequence = (count: number) => {
        if (!soundEnabled || count <= 0) return;

        let beepsPlayed = 0;
        const interval = setInterval(() => {
            playBeep(880, 0.15); // Higher pitch for alert
            beepsPlayed++;
            if (beepsPlayed >= count) {
                clearInterval(interval);
            }
        }, 300); // 300ms between beeps
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('https://api.orhanaydogdu.com.tr/deprem/kandilli/live');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: APIResponse = await response.json();

            if (data.status && data.result && Array.isArray(data.result)) {
                // Filter for last 10 days
                const tenDaysAgo = new Date();
                tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

                const filtered = data.result.filter((eq: Earthquake) => {
                    try {
                        const eqDate = new Date(eq.date_time);
                        return eqDate >= tenDaysAgo && !isNaN(eqDate.getTime());
                    } catch {
                        return false;
                    }
                });

                // Check for new earthquake
                if (filtered.length > 0) {
                    const newestEq = filtered[0];
                    if (latestEqDateRef.current && newestEq.date_time !== latestEqDateRef.current) {
                        // New earthquake detected!
                        const newEqDate = new Date(newestEq.date_time);
                        const oldEqDate = new Date(latestEqDateRef.current);

                        if (newEqDate > oldEqDate) {
                            const beepCount = Math.floor(newestEq.mag);
                            playBeepSequence(beepCount);
                        }
                    }
                    latestEqDateRef.current = newestEq.date_time;
                }

                setEarthquakes(filtered);
            } else {
                throw new Error('Veri formatı hatalı');
            }
        } catch (err: any) {
            console.error('Deprem verisi hatası:', err);
            setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    };

    useEffect(() => {
        fetchData();

        // Auto refresh every 30 seconds
        const intervalId = setInterval(() => {
            fetchData();
        }, 30000);

        return () => clearInterval(intervalId);
    }, [soundEnabled]); // Re-create interval if soundEnabled changes to capture new state in closure? No, fetchData uses ref/state. 
    // Actually fetchData is defined inside component, so it captures state. 
    // But fetchData depends on soundEnabled for playBeepSequence -> playBeep.
    // So we should include soundEnabled in dependency array or use a ref for soundEnabled.
    // Better: use a ref for soundEnabled so we don't restart interval constantly.

    // Let's stick to simple dependency for now, restarting interval every time user toggles sound is fine.

    const isIsparta = (title: string) => {
        return title.toLocaleLowerCase('tr-TR').includes('isparta');
    };

    const isToday = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isRecent = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        return diffInHours < 1;
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} dk önce`;
        }
        return `${diffInHours} saat önce`;
    };

    // Badge color for magnitude (Text on light background for readability)
    const getMagnitudeBadgeStyle = (mag: number) => {
        if (mag >= 6) return 'bg-red-100 text-red-900 border border-red-300 ring-2 ring-red-500';
        if (mag >= 5) return 'bg-red-100 text-red-800 border border-red-200 ring-1 ring-red-400';
        if (mag >= 4) return 'bg-orange-100 text-orange-800 border border-orange-200';
        if (mag >= 3) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        return 'bg-green-100 text-green-800 border border-green-200';
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E74C3C] via-[#C0392B] to-[#E74C3C] text-white p-8 mb-8 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                        <h1 className="text-white mb-3 text-4xl font-bold flex items-center gap-3">
                            <Activity size={36} className="animate-pulse" />
                            Son Depremler
                        </h1>
                        <p className="text-white/90 text-lg mb-2">
                            Kandilli Rasathanesi canlı verileri
                        </p>
                        <p className="text-white/80 text-sm">
                            Son 10 günün depremleri • 30 saniyede bir güncellenir
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                <span className="font-semibold">
                                    {loading ? 'Yenileniyor...' : 'Canlı'}
                                </span>
                            </div>
                            <div className="text-center text-sm text-white/90">
                                <Clock size={14} className="inline mr-1" />
                                {lastUpdated.toLocaleTimeString('tr-TR')}
                            </div>
                            {earthquakes.length > 0 && (
                                <div className="text-center text-sm text-white/80 mt-2 pt-2 border-t border-white/20">
                                    {earthquakes.length} kayıt
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg backdrop-blur-sm transition-all ${soundEnabled
                                ? 'bg-white text-red-600 shadow-md'
                                : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            title={soundEnabled ? "Sesli uyarı açık" : "Sesli uyarı kapalı"}
                        >
                            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            <span className="font-medium">
                                {soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-r-lg shadow">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                        <div>
                            <p className="text-red-700 font-semibold mb-1">Veri Yükleme Hatası</p>
                            <p className="text-red-600 text-sm">{error}</p>
                            <button
                                onClick={fetchData}
                                className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Tekrar Dene
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr className="border-b-2 border-gray-300">
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-1/3 border-r border-gray-300">
                                    <MapPin size={16} className="inline mr-2" />
                                    Yer
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                                    Büyüklük
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                                    Derinlik (km)
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    <Clock size={16} className="inline mr-2" />
                                    Tarih / Saat
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                            {loading && earthquakes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <RefreshCw className="animate-spin mx-auto mb-3 text-gray-400" size={32} />
                                        <p className="text-gray-500">Veriler yükleniyor...</p>
                                    </td>
                                </tr>
                            ) : earthquakes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <AlertTriangle className="mx-auto mb-3 text-gray-300" size={32} />
                                        <p>Kayıt bulunamadı.</p>
                                    </td>
                                </tr>
                            ) : (
                                earthquakes.map((eq, index) => {
                                    const highlight = isIsparta(eq.title);
                                    const today = isToday(eq.date_time);
                                    const recent = isRecent(eq.date_time);
                                    const getRowColor = (mag: number, isIspartaLocation: boolean, isTodayEq: boolean, isRecentEq: boolean) => {
                                        if (isIspartaLocation) return '#fee2e2'; // red-100
                                        if (mag >= 6) return '#fca5a5'; // red-300
                                        if (mag >= 5) return '#fee2e2'; // red-100
                                        if (mag >= 4) return '#ffedd5'; // orange-100
                                        if (mag >= 3) return '#fef9c3'; // yellow-100
                                        return '#dcfce7'; // green-100
                                    };

                                    const rowColor = getRowColor(eq.mag, highlight, today, recent);

                                    // Base classes for borders and transitions
                                    let rowClasses = 'transition-all duration-150 border-l-4';

                                    if (highlight) rowClasses += ' border-l-red-600 shadow-sm';
                                    else if (eq.mag >= 6) rowClasses += ' border-l-red-800';
                                    else if (eq.mag >= 5) rowClasses += ' border-l-red-500';
                                    else if (eq.mag >= 4) rowClasses += ' border-l-orange-400';
                                    else if (eq.mag >= 3) rowClasses += ' border-l-yellow-400';
                                    else rowClasses += ' border-l-green-400';

                                    if (today) rowClasses += ' ring-4 ring-blue-500 ring-inset z-10 relative shadow-lg';
                                    if (recent) rowClasses += ' animate-pulse';

                                    return (
                                        <tr
                                            key={eq.earthquake_id || index}
                                            className={rowClasses}
                                            style={{ backgroundColor: rowColor }}
                                        >
                                            <td
                                                className={`px-6 py-4 border-r border-gray-300 border-b border-gray-300 ${highlight
                                                    ? 'font-bold text-red-900 text-base'
                                                    : 'text-gray-800'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    {highlight && (
                                                        <span className="inline-block px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded uppercase mt-0.5 shadow-sm">
                                                            Isparta
                                                        </span>
                                                    )}
                                                    {recent && (
                                                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-900 text-xs font-bold rounded uppercase mt-0.5 shadow-sm animate-pulse border border-blue-300">
                                                            <Zap size={12} className="mr-1" />
                                                            YENİ
                                                        </span>
                                                    )}
                                                    <span>{eq.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center border-r border-gray-300 border-b border-gray-300">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${getMagnitudeBadgeStyle(
                                                            eq.mag
                                                        )}`}
                                                    >
                                                        {eq.mag.toFixed(1)}
                                                    </span>
                                                    {eq.mag >= 6 && (
                                                        <AlertOctagon className="text-red-700 animate-pulse" size={24} />
                                                    )}
                                                    {eq.mag >= 5 && eq.mag < 6 && (
                                                        <AlertTriangle className="text-red-600" size={20} />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-700 font-medium border-r border-gray-300 border-b border-gray-300">
                                                {eq.depth.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-300">
                                                <div className="flex flex-col">
                                                    <span>{formatDate(eq.date_time)}</span>
                                                    {today && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                                                                BUGÜN
                                                            </span>
                                                            <span className="text-xs text-gray-600 italic">
                                                                {getTimeAgo(eq.date_time)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Footer */}
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
                <p className="text-sm text-blue-800">
                    <strong>Not:</strong> Veriler Kandilli Rasathanesi ve Orhanaydogdu API'dan alınmaktadır.
                    <br />
                    <span className="font-bold">Bugünkü depremler</span> mavi çerçeve ile gösterilir.
                    <span className="font-bold ml-2">Son 1 saat</span> içindeki depremler "YENİ" etiketi ile belirtilir.
                    <br />
                    <span className="inline-block w-3 h-3 bg-green-200 border border-green-400 mr-1 ml-2 rounded-full"></span> &lt; 3.0
                    <span className="inline-block w-3 h-3 bg-yellow-200 border border-yellow-400 mr-1 ml-2 rounded-full"></span> 3.0 - 4.0
                    <span className="inline-block w-3 h-3 bg-orange-200 border border-orange-400 mr-1 ml-2 rounded-full"></span> 4.0 - 5.0
                    <span className="inline-block w-3 h-3 bg-red-200 border border-red-400 mr-1 ml-2 rounded-full"></span> &gt; 5.0
                </p>
            </div>
        </PageContainer>
    );
}
