import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Clock,
  AlertOctagon,
  Zap,
  Volume2,
  VolumeX,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Navigation
} from 'lucide-react';

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

interface AfadEvent {
  eventID: string;
  location: string;
  latitude: string;
  longitude: string;
  depth: string;
  magnitude: string;
  type?: string;
  date: string;
  province?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  country?: string | null;
  isEventUpdate?: boolean;
  lastUpdateDate?: string | null;
  rms?: string;
}

type SortKey = 'date_time' | 'mag' | 'distance';
type SortDirection = 'asc' | 'desc';

const CountdownTimer = ({ duration, resetKey, size = 28 }: { duration: number; resetKey: any; size?: number }) => {
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

  const radius = (size / 2) - 3;
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
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Default: en yeni en üstte
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'date_time',
    direction: 'desc'
  });

  // Son 7 gün toggle
  const [sevenDays, setSevenDays] = useState(false);

  const latestEqDateRef = useRef<string | null>(null);

  // Isparta Coordinates
  const ISPARTA_COORDS = { lat: 37.7648, lng: 30.5567 };
  const ISPARTA_RADIUS_KM = 100;

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  const playBeep = (frequency = 440, duration = 0.12) => {
    if (!soundEnabled) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.error('Audio play error:', e);
    }
  };

  const playBeepSequence = (count: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!soundEnabled || count <= 0) {
        resolve();
        return;
      }

      let beepsPlayed = 0;
      const interval = setInterval(() => {
        playBeep(880, 0.15);
        beepsPlayed++;
        if (beepsPlayed >= count) {
          clearInterval(interval);
          resolve();
        }
      }, 300);
    });
  };

  // Isparta/100 km içinde “yakın” işareti: 1 uzun bip
  const playNearPreamble = async () => {
    if (!soundEnabled) return;
    playBeep(660, 0.6);
    await sleep(750);
  };

  // Queue: her yeni deprem için {mag, isNear100}
  const soundQueue = useRef<Array<{ mag: number; near100: boolean }>>([]);
  const isPlaying = useRef(false);

  const processSoundQueue = async () => {
    if (isPlaying.current || soundQueue.current.length === 0) return;
    isPlaying.current = true;

    while (soundQueue.current.length > 0) {
      const item = soundQueue.current.shift();
      if (item) {
        if (item.near100) {
          await playNearPreamble();
          await sleep(200);
        }
        await playBeepSequence(Math.floor(item.mag));
        if (soundQueue.current.length > 0) {
          await sleep(900);
        }
      }
    }

    isPlaying.current = false;
  };

  const toIsoNoMs = (d: Date) => d.toISOString().slice(0, 19);

  const mapAfadToEarthquake = (ev: AfadEvent): Earthquake | null => {
    const lat = Number(ev.latitude);
    const lon = Number(ev.longitude);
    const mag = Number(ev.magnitude);
    const depth = Number(ev.depth);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(mag) || !Number.isFinite(depth)) {
      return null;
    }

    const cityName = (ev.province || ev.district || '').toString();

    return {
      earthquake_id: ev.eventID,
      title: ev.location || `${ev.district ?? ''} ${ev.province ?? ''}`.trim(),
      mag,
      depth,
      date_time: ev.date,
      geojson: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      location_properties: {
        closestCity: {
          name: cityName || '—',
          distance: 0
        }
      }
    };
  };

  // GH Pages CORS fix: Cloudflare Worker proxy
  const fetchWithProxy = async (pathAndQuery: string) => {
    const proxyBase = 'https://depremo.tutkumuz.workers.dev';

    const qIndex = pathAndQuery.indexOf('?');
    const query = qIndex >= 0 ? pathAndQuery.slice(qIndex + 1) : '';

    const proxyUrl = `${proxyBase}/?${query}`;

    const r = await fetch(proxyUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!r.ok) throw new Error(`AFAD cevap vermiyor. (HTTP ${r.status})`);
    return r;
  };

  // Title'dan "Isparta ili mi?" tespiti (örn: "Yalvaç (Isparta)")
  const isIspartaProvinceFromTitle = (title: string) => {
    const t = title.toLocaleLowerCase('tr-TR').trim();
    return (
      t.includes('(isparta)') ||
      t.endsWith(' isparta') ||
      t.includes(' isparta ') ||
      t.includes('ısparta') ||
      t.includes('(ısparta)')
    );
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const end = new Date();
      const start = new Date(end.getTime() - (sevenDays ? 7 : 1) * 24 * 60 * 60 * 1000);

      const path =
        `/apiv2/event/filter` +
        `?start=${encodeURIComponent(toIsoNoMs(start))}` +
        `&end=${encodeURIComponent(toIsoNoMs(end))}` +
        `&format=json`;

      const resp = await fetchWithProxy(path);
      const afadData: AfadEvent[] = await resp.json();

      const mapped = (afadData || [])
        .map(mapAfadToEarthquake)
        .filter(Boolean) as Earthquake[];

      const uniqueMap = new Map<string, Earthquake>();
      mapped.forEach(eq => {
        const key = eq.earthquake_id || `${eq.date_time}_${eq.mag}`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, eq);
      });

      const uniqueEarthquakes = Array.from(uniqueMap.values());
      uniqueEarthquakes.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

      // New quake detection + sound queue
      if (uniqueEarthquakes.length > 0) {
        const newestEq = uniqueEarthquakes[0];

        if (latestEqDateRef.current) {
          const lastDate = new Date(latestEqDateRef.current);

          const newQuakes = uniqueEarthquakes
            .filter(eq => new Date(eq.date_time) > lastDate)
            .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

          if (newQuakes.length > 0) {
            newQuakes.forEach(eq => {
              const dist = calculateDistance(
                ISPARTA_COORDS.lat,
                ISPARTA_COORDS.lng,
                eq.geojson.coordinates[1],
                eq.geojson.coordinates[0]
              );

              const isIspartaProvince = isIspartaProvinceFromTitle(eq.title);
              const near100 = isIspartaProvince || dist <= ISPARTA_RADIUS_KM;

              soundQueue.current.push({ mag: eq.mag, near100 });
            });
            processSoundQueue();
          }
        }

        latestEqDateRef.current = newestEq.date_time;
      }

      setEarthquakes(uniqueEarthquakes);
    } catch (err: any) {
      console.error('Deprem verisi hatası:', err);
      setError(err?.message || 'AFAD şu an cevap vermiyor.');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => fetchData(), 30000);
    return () => clearInterval(intervalId);
  }, [soundEnabled, sevenDays]);

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

    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    return `${diffInHours} saat önce`;
  };

  const getMagnitudeBadgeStyle = (mag: number) => {
    if (mag >= 6) return 'bg-red-100 text-red-900 border border-red-300 ring-2 ring-red-500';
    if (mag >= 5) return 'bg-red-100 text-red-800 border border-red-200 ring-1 ring-red-400';
    if (mag >= 4) return 'bg-orange-100 text-orange-800 border border-orange-200';
    if (mag >= 3) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-green-100 text-green-800 border border-green-200';
  };

  // Sorting: first click defaults (distance asc, mag desc, date desc)
  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current.key === key) {
        return { key, direction: current.direction === 'desc' ? 'asc' : 'desc' };
      }
      const defaultDir: SortDirection =
        key === 'distance' ? 'asc' :
          key === 'mag' ? 'desc' :
            'desc';
      return { key, direction: defaultDir };
    });
  };

  const sortedEarthquakes = useMemo(() => {
    const copy = [...earthquakes];
    copy.sort((a, b) => {
      if (sortConfig.key === 'mag') {
        return sortConfig.direction === 'asc' ? a.mag - b.mag : b.mag - a.mag;
      } else if (sortConfig.key === 'distance') {
        const distA = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, a.geojson.coordinates[1], a.geojson.coordinates[0]);
        const distB = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, b.geojson.coordinates[1], b.geojson.coordinates[0]);
        return sortConfig.direction === 'asc' ? distA - distB : distB - distA;
      } else {
        const timeA = new Date(a.date_time).getTime();
        const timeB = new Date(b.date_time).getTime();
        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
      }
    });
    return copy;
  }, [earthquakes, sortConfig]);

  const top50 = sortedEarthquakes.slice(0, 50);
  const olderRecords = sortedEarthquakes.slice(50);
  const olderSignificant = olderRecords.filter(eq => eq.mag >= 3.0);

  const displayedEarthquakes = showHistory ? sortedEarthquakes : top50;

  // Banner: only if ISPARTA or YAKIN (<=100 km)
  const bannerQuakes = useMemo(() => {
    const filtered = earthquakes.filter(eq => {
      const dist = calculateDistance(
        ISPARTA_COORDS.lat,
        ISPARTA_COORDS.lng,
        eq.geojson.coordinates[1],
        eq.geojson.coordinates[0]
      );
      const isIspartaProv = isIspartaProvinceFromTitle(eq.title);
      return isIspartaProv || dist <= ISPARTA_RADIUS_KM;
    });

    return filtered.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
  }, [earthquakes]);

  const latestBannerEq = bannerQuakes.length > 0 ? bannerQuakes[0] : null;

  const getBannerTitle = (eq: Earthquake) => {
    const isIspartaProv = isIspartaProvinceFromTitle(eq.title);
    return isIspartaProv ? "Isparta'da Deprem!" : "Isparta'ya Yakın Deprem!";
  };

  return (
    <PageContainer>
      {/* Banner */}
      {latestBannerEq && (
        <div
          className="text-white p-4 mb-4 rounded-xl shadow-lg border-2 border-red-400"
          style={{ background: 'linear-gradient(to right, #dc2626, #b91c1c)' }}
        >
          <div className="flex items-center gap-4">
            <AlertOctagon size={30} className="flex-shrink-0 animate-pulse" />
            <div>
              <h3 className="font-bold text-base uppercase tracking-wide">{getBannerTitle(latestBannerEq)}</h3>
              <p className="font-medium mt-1">
                {latestBannerEq.title} — Büyüklük: <span className="text-lg font-bold">{latestBannerEq.mag.toFixed(1)}</span>
              </p>
              <p className="text-sm opacity-90">
                {formatDate(latestBannerEq.date_time)} ({getTimeAgo(latestBannerEq.date_time)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header - compact */}
      <div
        className="text-white p-5 mb-5 rounded-xl shadow-lg"
        style={{ background: 'linear-gradient(to right, #dc2626, #b91c1c)' }}
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-white mb-1 text-3xl font-bold flex items-center gap-2">
              <Activity size={30} className="animate-pulse" />
              Son Depremler
            </h1>
            <p className="text-white/90 text-sm">
              AFAD canlı verileri • 30 sn yenilenir • Ses açıkken: şiddet kadar tık
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setSevenDays(s => !s)}
                className="px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all"
                style={{
                  backgroundColor: sevenDays ? 'white' : 'rgba(0,0,0,0.2)',
                  color: sevenDays ? '#b91c1c' : 'white',
                  border: '1px solid rgba(255,255,255,0.25)'
                }}
                title="Son 7 gün verisini göster"
              >
                {sevenDays ? 'Son 7 Gün: Açık' : 'Son 7 Gün'}
              </button>

              <div className="text-xs text-white/80 bg-black/20 border border-white/20 rounded-lg px-2 py-1.5">
                ISPARTA: il içi • YAKIN: {ISPARTA_RADIUS_KM} km
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-3 min-w-[170px] flex items-center gap-3">
              <div className="flex items-center justify-center w-[34px]">
                {loading ? (
                  <RefreshCw size={24} className="animate-spin" />
                ) : (
                  <CountdownTimer duration={30000} resetKey={lastUpdated} size={26} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <Clock size={12} />
                  <span>{lastUpdated.toLocaleTimeString('tr-TR')}</span>
                </div>
                <div className="text-xs text-white/70 mt-0.5">
                  {earthquakes.length > 0 ? `${earthquakes.length} kayıt` : '—'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg backdrop-blur-sm transition-all shadow-md ${soundEnabled
                ? 'ring-2 ring-red-500'
                : 'hover:bg-black/30'
                }`}
              style={{
                backgroundColor: soundEnabled ? 'white' : 'rgba(0, 0, 0, 0.2)',
                color: soundEnabled ? '#b91c1c' : 'white'
              }}
              title={soundEnabled ? "Sesli uyarı açık" : "Sesli uyarı kapalı"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span className="font-bold text-sm">
                {soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
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
                  title="İlk tık: en yakınlar üstte"
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
                  title="İlk tık: en büyükler üstte"
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
                  title="İlk tık: en yeni en üstte"
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
                  const distance = calculateDistance(
                    ISPARTA_COORDS.lat,
                    ISPARTA_COORDS.lng,
                    eq.geojson.coordinates[1],
                    eq.geojson.coordinates[0]
                  );

                  const isIspartaProvince = isIspartaProvinceFromTitle(eq.title);
                  const isNear = !isIspartaProvince && distance <= ISPARTA_RADIUS_KM;

                  const recent = isRecent(eq.date_time);

                  const getRowColor = (mag: number) => {
                    if (isIspartaProvince) return '#fee2e2'; // ISPARTA: kırmızımsı
                    if (isNear) return '#ffedd5'; // YAKIN: turuncumsu
                    if (mag >= 6) return '#fca5a5';
                    if (mag >= 5) return '#fee2e2';
                    if (mag >= 4) return '#ffedd5';
                    if (mag >= 3) return '#fef9c3';
                    return '#dcfce7';
                  };

                  const rowColor = getRowColor(eq.mag);

                  let rowClasses = 'transition-all duration-150 border-l-4';
                  if (isIspartaProvince) rowClasses += ' border-l-red-700 shadow-sm';
                  else if (isNear) rowClasses += ' border-l-orange-600 shadow-sm';
                  else if (eq.mag >= 6) rowClasses += ' border-l-red-800';
                  else if (eq.mag >= 5) rowClasses += ' border-l-red-500';
                  else if (eq.mag >= 4) rowClasses += ' border-l-orange-400';
                  else if (eq.mag >= 3) rowClasses += ' border-l-yellow-400';
                  else rowClasses += ' border-l-green-400';

                  if (recent) rowClasses += ' animate-pulse';

                  const labelText = isIspartaProvince ? 'ISPARTA' : isNear ? 'YAKIN' : null;
                  const labelBg = isIspartaProvince ? '#dc2626' : '#ea580c';

                  return (
                    <tr
                      key={eq.earthquake_id || index}
                      className={rowClasses}
                      style={{ backgroundColor: rowColor }}
                    >
                      <td
                        className={`px-6 py-4 border-r border-gray-300 border-b border-gray-300 ${labelText
                          ? 'font-bold text-gray-900 text-base'
                          : 'text-gray-800'
                          }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-start gap-2">
                            {labelText && (
                              <span
                                className="inline-block px-2 py-0.5 text-white text-xs font-bold rounded uppercase mt-0.5 shadow-sm"
                                style={{ backgroundColor: labelBg }}
                              >
                                {labelText}
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
                          {recent && (
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
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${getMagnitudeBadgeStyle(eq.mag)}`}
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
                        {formatDate(eq.date_time)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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

      {/* Footer */}
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
        <p className="text-sm text-blue-800">
          <strong>Not:</strong> Veriler AFAD Event Service üzerinden alınmaktadır.
          <br />
          <span className="font-bold">Son 1 saat</span> içindeki depremler <span className="font-bold">"YENİ"</span> etiketi ile belirtilir.
          <br />
          <span className="font-bold text-red-700 mt-2 block">
            Isparta ilinde deprem varsa <span className="font-bold">ISPARTA</span> etiketi ile gösterilir. Yakın depremler <span className="font-bold">YAKIN</span> etiketi ile belirtilir.
          </span>
        </p>
      </div>
    </PageContainer>
  );
}
