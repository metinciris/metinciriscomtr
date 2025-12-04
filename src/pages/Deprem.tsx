import React, { useEffect, useState, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Activity, RefreshCw, AlertTriangle, MapPin, Clock, AlertOctagon, Zap, Volume2, VolumeX, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Navigation } from 'lucide-react';

interface Earthquake {
    earthquake_id: string;
    title: string;
    mag: number;
    depth: number;
    date_time: string;
    geojson: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
    };
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

type SortKey = 'date_time' | 'mag' | 'distance';
type SortDirection = 'asc' | 'desc';

const CountdownTimer = ({ duration, resetKey, size = 32 }: { duration: number; resetKey: any; size?: number }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress(0);
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);
        }, 100);

        return () => clearInterval(interval);
    }, [resetKey, duration]);

    const radius = (size / 2) - 3; // Adjust radius based on size, keeping stroke width in mind
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="white"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
            </svg>
        </div>
    );
};

export function Deprem() {
    const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
    // Loading state for data fetching
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'date_time',
        direction: 'desc'
    });
    const latestEqDateRef = useRef<string | null>(null);

    // Isparta Coordinates
    const ISPARTA_COORDS = { lat: 37.7648, lng: 30.5567 };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

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

    const soundQueue = useRef<number[]>([]);
    const isPlaying = useRef(false);

    const processSoundQueue = async () => {
        if (isPlaying.current || soundQueue.current.length === 0) return;

        isPlaying.current = true;

        while (soundQueue.current.length > 0) {
            const mag = soundQueue.current.shift();
            if (mag) {
                await playBeepSequence(Math.floor(mag));
                if (soundQueue.current.length > 0) {
                    // Wait 1 second between different earthquake alerts
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        isPlaying.current = false;
    };

    const playBeepSequence = (count: number): Promise<void> => {
        return new Promise((resolve) => {
            if (!soundEnabled || count <= 0) {
                resolve();
                return;
            }

            let beepsPlayed = 0;
            const interval = setInterval(() => {
                playBeep(880, 0.15); // Higher pitch for alert
                beepsPlayed++;
                if (beepsPlayed >= count) {
                    clearInterval(interval);
                    resolve();
                }
            }, 300); // 300ms between beeps
        });
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch both Live (for immediate latest) and Archive (for deeper history)
            const [liveResponse, archiveResponse] = await Promise.all([
                fetch('https://api.orhanaydogdu.com.tr/deprem/kandilli/live'),
                fetch('https://api.orhanaydogdu.com.tr/deprem/kandilli/archive?limit=500')
            ]);

            const liveData: APIResponse = await liveResponse.json();
            const archiveData: APIResponse = await archiveResponse.json();

            let allEarthquakes: Earthquake[] = [];

            if (liveData.status && liveData.result) {
                allEarthquakes = [...allEarthquakes, ...liveData.result];
            }
            if (archiveData.status && archiveData.result) {
                allEarthquakes = [...allEarthquakes, ...archiveData.result];
            }

            // Deduplicate
            const uniqueMap = new Map();
            allEarthquakes.forEach(eq => {
                const key = eq.earthquake_id || `${eq.date_time}_${eq.mag}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, eq);
                }
            });

            const uniqueEarthquakes = Array.from(uniqueMap.values());

            // Initial sort by date desc
            uniqueEarthquakes.sort((a, b) => {
                return new Date(b.date_time).getTime() - new Date(a.date_time).getTime();
            });

            // Check for new earthquake (using the very first one from live/merged)
            if (uniqueEarthquakes.length > 0) {
                const newestEq = uniqueEarthquakes[0];
                if (latestEqDateRef.current) {
                    const lastDate = new Date(latestEqDateRef.current);
                    // Find all new earthquakes since last check
                    const newQuakes = uniqueEarthquakes.filter(eq => new Date(eq.date_time) > lastDate);

                    if (newQuakes.length > 0) {
                        // Add all new magnitudes to queue
                        // Reverse to play oldest to newest? Or newest first?
                        // Let's play them in the order they appear (newest first)
                        newQuakes.forEach(eq => {
                            soundQueue.current.push(eq.mag);
                        });
                        processSoundQueue();
                    }
                }
                latestEqDateRef.current = newestEq.date_time;
            }

            setEarthquakes(uniqueEarthquakes);
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
    }, [soundEnabled]);



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

    // Sorting Logic
    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedEarthquakes = [...earthquakes].sort((a, b) => {
        if (sortConfig.key === 'mag') {
            return sortConfig.direction === 'asc' ? a.mag - b.mag : b.mag - a.mag;
        } else if (sortConfig.key === 'distance') {
            const distA = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, a.geojson.coordinates[1], a.geojson.coordinates[0]);
            const distB = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, b.geojson.coordinates[1], b.geojson.coordinates[0]);
            return sortConfig.direction === 'asc' ? distA - distB : distB - distA;
        } else {
            // Date sort
            const timeA = new Date(a.date_time).getTime();
            const timeB = new Date(b.date_time).getTime();
            return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
        }
    });

    // Split data logic
    const top50 = sortedEarthquakes.slice(0, 50);
    const olderRecords = sortedEarthquakes.slice(50);
    const olderSignificant = olderRecords.filter(eq => eq.mag >= 3.0);

    // Determine what to show
    const displayedEarthquakes = showHistory
        ? sortedEarthquakes // Show all when history is expanded
        : top50;

    // Find Isparta or nearby earthquakes for banner
    const bannerQuakes = earthquakes.filter(eq => {
        const titleLower = eq.title.toLocaleLowerCase('tr-TR');
        const isIsparta = titleLower.includes('isparta') || titleLower.includes('ısparta');
        const distance = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, eq.geojson.coordinates[1], eq.geojson.coordinates[0]);

        return isIsparta || distance < 100;
    });
    const latestBannerEq = bannerQuakes.length > 0 ? bannerQuakes[0] : null;

    const getBannerTitle = (eq: Earthquake) => {
        const titleLower = eq.title.toLocaleLowerCase('tr-TR');
        if (titleLower.includes('isparta') || titleLower.includes('ısparta')) {
            return "Isparta'da Deprem!";
        }
        return "Isparta'ya Yakın Deprem!";
    };

    return (
        <PageContainer>
            {/* Isparta Banner */}
            {latestBannerEq && (
                <div
                    className="text-white p-4 mb-6 rounded-xl shadow-lg border-2 border-red-400"
                    style={{ background: 'linear-gradient(to right, #dc2626, #b91c1c)' }}
                >
                    <div className="flex items-center gap-4">
                        <AlertOctagon size={32} className="flex-shrink-0 animate-pulse" />
                        <div>
                            <h3 className="font-bold text-lg uppercase tracking-wide">{getBannerTitle(latestBannerEq)}</h3>
                            <p className="font-medium">
                                {latestBannerEq.title} - Büyüklük: <span className="text-xl font-bold">{latestBannerEq.mag}</span>
                            </p>
                            <p className="text-sm opacity-90">
                                {formatDate(latestBannerEq.date_time)} ({getTimeAgo(latestBannerEq.date_time)})
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div
                className="text-white p-8 mb-8 rounded-xl shadow-lg"
                style={{ background: 'linear-gradient(to right, #dc2626, #b91c1c)' }}
            >
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
                            30 saniyede bir güncellenir. Ses açıkken deprem bildirimi: Deprem şiddeti kadar tık sesi.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 min-w-[200px] flex flex-col items-center justify-center min-h-[120px]">
                            <div className="flex items-center justify-center mb-3 h-[40px]">
                                {loading ? (
                                    <RefreshCw size={32} className="animate-spin" />
                                ) : (
                                    <CountdownTimer duration={30000} resetKey={lastUpdated} size={32} />
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-sm text-white/90">
                                <Clock size={14} />
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
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg backdrop-blur-sm transition-all shadow-md ${soundEnabled
                                ? 'ring-2 ring-red-500'
                                : 'hover:bg-black/30'
                                }`}
                            style={{
                                backgroundColor: soundEnabled ? 'white' : 'rgba(0, 0, 0, 0.2)',
                                color: soundEnabled ? '#b91c1c' : 'white'
                            }}
                            title={soundEnabled ? "Sesli uyarı açık" : "Sesli uyarı kapalı"}
                        >
                            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            <span className="font-bold">
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
                                <th
                                    className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors select-none"
                                    onClick={() => handleSort('distance')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <Navigation size={16} className="inline mr-1" />
                                        Isparta'ya Uzaklık
                                        {sortConfig.key === 'distance' && (
                                            sortConfig.direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
                                        )}
                                        {sortConfig.key !== 'distance' && <ArrowUpDown size={14} className="text-gray-400" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors select-none"
                                    onClick={() => handleSort('mag')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Büyüklük
                                        {sortConfig.key === 'mag' && (
                                            sortConfig.direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
                                        )}
                                        {sortConfig.key !== 'mag' && <ArrowUpDown size={14} className="text-gray-400" />}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                                    Derinlik (km)
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none"
                                    onClick={() => handleSort('date_time')}
                                >
                                    <div className="flex items-center gap-1">
                                        <Clock size={16} className="inline mr-2" />
                                        Tarih / Saat
                                        {sortConfig.key === 'date_time' && (
                                            sortConfig.direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
                                        )}
                                        {sortConfig.key !== 'date_time' && <ArrowUpDown size={14} className="text-gray-400" />}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                            {loading && earthquakes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <RefreshCw className="animate-spin mx-auto mb-3 text-gray-400" size={32} />
                                        <p className="text-gray-500">Veriler yükleniyor...</p>
                                    </td>
                                </tr>
                            ) : earthquakes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <AlertTriangle className="mx-auto mb-3 text-gray-300" size={32} />
                                        <p>Kayıt bulunamadı.</p>
                                    </td>
                                </tr>
                            ) : (
                                displayedEarthquakes.map((eq, index) => {
                                    const distance = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, eq.geojson.coordinates[1], eq.geojson.coordinates[0]);

                                    // Isparta check with better Turkish character handling
                                    const titleLower = eq.title.toLocaleLowerCase('tr-TR');
                                    const isIspartaTitle = titleLower.includes('isparta') || titleLower.includes('ısparta');

                                    // Highlight if title contains Isparta OR distance is less than 100km
                                    const highlight = isIspartaTitle || distance < 100;

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
                                                <div className="flex flex-col">
                                                    <div className="flex items-start gap-2">
                                                        {highlight && (
                                                            <span
                                                                className="inline-block px-2 py-0.5 text-white text-xs font-bold rounded uppercase mt-0.5 shadow-sm"
                                                                style={{ backgroundColor: '#dc2626' }}
                                                            >
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
                                                    {today && (
                                                        <div className="text-xs text-gray-500 mt-1 ml-1 flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {getTimeAgo(eq.date_time)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center border-r border-gray-300 border-b border-gray-300 font-mono text-gray-700">
                                                {Math.round(distance)} km
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

                {/* Custom Pagination for Older Significant Quakes */}
                {!showHistory && sortedEarthquakes.length > 50 && (
                    <div className="p-4 text-center border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={() => setShowHistory(true)}
                            className="flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-lg shadow-md transition-all transform hover:scale-105"
                            style={{
                                backgroundColor: '#2563eb',
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        >
                            <ChevronDown size={20} />
                            <span>
                                Daha Fazla Göster ({sortedEarthquakes.length - 50} kayıt daha)
                            </span>
                        </button>
                    </div>
                )}

                {!showHistory && olderSignificant.length > 0 && sortedEarthquakes.length <= 50 && (
                    <div className="p-4 text-center border-t border-gray-200 bg-orange-50">
                        <p className="text-orange-800 font-medium">
                            <AlertTriangle size={16} className="inline mr-2" />
                            3.0 ve üzeri {olderSignificant.length} eski deprem mevcut
                        </p>
                    </div>
                )}

                {showHistory && (
                    <div className="p-4 text-center border-t border-gray-200 bg-gray-50">
                        <p className="text-gray-600 italic">Tüm önemli eski kayıtlar gösteriliyor.</p>
                    </div>
                )}
            </div>

            {/* Info Footer */}
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
                <p className="text-sm text-blue-800">
                    <strong>Not:</strong> Veriler Kandilli Rasathanesi ve Orhanaydogdu API'dan alınmaktadır.
                    <br />
                    <span className="font-bold">Bugünkü depremler</span> mavi çerçeve ile gösterilir.
                    <span className="font-bold ml-2">Son 1 saat</span> içindeki depremler "YENİ" etiketi ile belirtilir.
                    <br />
                    <span className="font-bold text-red-700 mt-2 block">Isparta ilinde deprem varsa Kırmızı renkle yazılır.</span>
                </p>
            </div>
        </PageContainer>
    );
}
