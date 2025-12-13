import React, { useEffect, useMemo, useRef, useState } from 'react';
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
}

type SortKey = 'date_time' | 'mag' | 'distance';
type SortDirection = 'asc' | 'desc';

const CountdownTimer = ({
  duration,
  resetKey,
  size = 30
}: {
  duration: number;
  resetKey: any;
  size?: number;
}) => {
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

  const radius = size / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.22)"
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

type SoundItem = { mag: number; isNear: boolean };

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

  // Isparta merkez koordinatları
  const ISPARTA_COORDS = { lat: 37.7648, lng: 30.5567 };
  const NEAR_KM = 100;

  // Cloudflare Worker (AFAD proxy)
  const AFAD_PROXY = 'https://depremo.tutkumuz.workers.dev';

  const latestEqDateRef = useRef<string | null>(null);

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const normalizeDateString = (s: any): string => {
    if (!s) return '';
    const str = String(s);
    return str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str;
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

  // 2 saat+ için dakika göstermiyoruz
  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const totalMinutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (totalMinutes < 60) return `${totalMinutes} dk önce`;
    if (totalMinutes < 120) {
      if (minutes <= 0) return `${hours} saat önce`;
      return `${hours} saat ${minutes} dk önce`;
    }
    return `${hours} saat önce`;
  };

  const isRecent = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours < 1;
  };

  const getMagnitudeBadgeStyle = (mag: number) => {
    if (mag >= 6) return 'bg-red-100 text-red-900 border border-red-300 ring-2 ring-red-500';
    if (mag >= 5) return 'bg-red-100 text-red-800 border border-red-200 ring-1 ring-red-400';
    if (mag >= 4) return 'bg-orange-100 text-orange-800 border border-orange-200';
    if (mag >= 3) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-green-100 text-green-800 border border-green-200';
  };

  // “Isparta” sınırları içinde 
  const getRelation = (title: string, distanceKm: number): 'ISPARTA' | 'YAKIN' | null => {
    const t = title.toLocaleLowerCase('tr-TR');
    if (t.includes('isparta') || t.includes('ısparta')) return 'ISPARTA';
    if (distanceKm < NEAR_KM) return 'YAKIN';
    return null;
  };

  // Satır/şiddet renkleri
  const getRowColor = (mag: number, relation: 'ISPARTA' | 'YAKIN' | null) => {
    if (relation === 'ISPARTA') return '#ffe4e6'; // rose-100
    if (relation === 'YAKIN') return '#ffedd5'; // orange-100

    if (mag >= 6) return '#fecaca'; // red-200
    if (mag >= 5) return '#fee2e2'; // red-100
    if (mag >= 4) return '#ffedd5'; // orange-100
    if (mag >= 3) return '#fef9c3'; // yellow-100
    return '#dcfce7'; // green-100
  };

  const getSeverityBg = (mag: number, relation: 'ISPARTA' | 'YAKIN' | null) => {
    return getRowColor(mag, relation);
  };

  // Sorting: first click defaults (distance asc, mag desc, date desc)
  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current.key === key) {
        return { key, direction: current.direction === 'desc' ? 'asc' : 'desc' };
      }
      const defaultDir: SortDirection = key === 'distance' ? 'asc' : 'desc';
      return { key, direction: defaultDir };
    });
  };

  // Sound
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

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 1 uzun + 2 kısa “yakın” işareti
  const playNearPreamble = async () => {
    if (!soundEnabled) return;
    playBeep(440, 0.55);
    await sleep(700);
    playBeep(660, 0.12);
    await sleep(250);
    playBeep(660, 0.12);
    await sleep(300);
  };

  const playBeepSequence = (count: number): Promise<void> => {
    return new Promise(resolve => {
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

  const soundQueue = useRef<SoundItem[]>([]);
  const isPlaying = useRef(false);

  const processSoundQueue = async () => {
    if (isPlaying.current || soundQueue.current.length === 0) return;
    isPlaying.current = true;

    while (soundQueue.current.length > 0) {
      const item = soundQueue.current.shift();
      if (!item) break;

      if (item.isNear) {
        await playNearPreamble();
      }
      await playBeepSequence(Math.floor(item.mag));

      if (soundQueue.current.length > 0) {
        await sleep(900);
      }
    }

    isPlaying.current = false;
  };

  // AFAD map (featurecollection / array / farklı şemalara toleranslı)
  const mapAfadToEarthquakes = (raw: any): Earthquake[] => {
    const out: Earthquake[] = [];

    const pushOne = (id: any, title: any, mag: any, depth: any, date: any, lon: any, lat: any) => {
      const lngNum = Number(lon);
      const latNum = Number(lat);
      const magNum = Number(mag);
      const depthNum = Number(depth);

      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || !Number.isFinite(magNum)) return;

      out.push({
        earthquake_id: String(id ?? `${date}_${magNum}_${lngNum}_${latNum}`),
        title: String(title ?? 'Bilinmeyen Konum'),
        mag: magNum,
        depth: Number.isFinite(depthNum) ? depthNum : 0,
        date_time: normalizeDateString(date),
        geojson: {
          type: 'Point',
          coordinates: [lngNum, latNum]
        }
      });
    };

    if (raw?.features && Array.isArray(raw.features)) {
      for (const f of raw.features) {
        const p = f?.properties ?? {};
        const g = f?.geometry ?? {};
        const coords = Array.isArray(g.coordinates) ? g.coordinates : [];

        const lon = coords[0];
        const lat = coords[1];
        const depthFromCoord = coords.length >= 3 ? coords[2] : undefined;

        pushOne(
          p.eventID ?? p.eventId ?? p.id ?? p.earthquake_id,
          p.location ?? p.place ?? p.title ?? p.name,
          p.magnitude ?? p.mag ?? p.ml ?? p.MAG,
          p.depth ?? p.Depth ?? depthFromCoord,
          p.date ?? p.time ?? p.Date ?? p.datetime,
          lon,
          lat
        );
      }
      return out;
    }

    if (Array.isArray(raw)) {
      for (const e of raw) {
        const lon = e?.longitude ?? e?.lon ?? e?.lng ?? e?.geojson?.coordinates?.[0] ?? e?.coordinates?.[0];
        const lat = e?.latitude ?? e?.lat ?? e?.geojson?.coordinates?.[1] ?? e?.coordinates?.[1];
        pushOne(
          e?.eventID ?? e?.eventId ?? e?.id ?? e?.earthquake_id,
          e?.location ?? e?.place ?? e?.title ?? e?.name,
          e?.magnitude ?? e?.mag ?? e?.ml,
          e?.depth ?? e?.Depth,
          e?.date ?? e?.time ?? e?.datetime ?? e?.date_time,
          lon,
          lat
        );
      }
      return out;
    }

    if (raw?.result && Array.isArray(raw.result)) {
      return mapAfadToEarthquakes(raw.result);
    }

    return out;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Son 7 gün
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      const toParam = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
          d.getMinutes()
        )}:${pad(d.getSeconds())}`;
      };

      const qs = new URLSearchParams({
        start: toParam(start),
        end: toParam(end),
        format: 'json'
      });

      const resp = await fetch(`${AFAD_PROXY}/?${qs.toString()}`);
      if (!resp.ok) throw new Error(`AFAD Proxy Hatası: ${resp.status}`);

      const raw = await resp.json();
      const mapped = mapAfadToEarthquakes(raw);

      // Deduplicate
      const uniqueMap = new Map<string, Earthquake>();
      for (const eq of mapped) uniqueMap.set(eq.earthquake_id, eq);
      const uniqueEarthquakes = Array.from(uniqueMap.values());

      // Default: date desc
      uniqueEarthquakes.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

      // New quake detection + sound queue
      if (uniqueEarthquakes.length > 0) {
        const newestEq = uniqueEarthquakes[0];
        if (latestEqDateRef.current) {
          const lastDate = new Date(latestEqDateRef.current);
          const newQuakes = uniqueEarthquakes.filter(eq => new Date(eq.date_time) > lastDate);

          if (newQuakes.length > 0) {
            newQuakes.forEach(eq => {
              const distance = calculateDistance(
                ISPARTA_COORDS.lat,
                ISPARTA_COORDS.lng,
                eq.geojson.coordinates[1],
                eq.geojson.coordinates[0]
              );
              const rel = getRelation(eq.title, distance);
              soundQueue.current.push({ mag: eq.mag, isNear: rel !== null });
            });
            processSoundQueue();
          }
        }
        latestEqDateRef.current = newestEq.date_time;
      }

      setEarthquakes(uniqueEarthquakes);
    } catch (err: any) {
      console.error('Deprem verisi hatası:', err);
      const msg = err?.message || 'Veriler yüklenirken bir hata oluştu.';
      setError(msg.includes('Failed to fetch') ? 'AFAD cevabı alınamadı (Failed to fetch).' : msg);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => fetchData(), 30000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  const sortedEarthquakes = useMemo(() => {
    const list = [...earthquakes];
    list.sort((a, b) => {
      if (sortConfig.key === 'mag') {
        return sortConfig.direction === 'asc' ? a.mag - b.mag : b.mag - a.mag;
      }
      if (sortConfig.key === 'distance') {
        const distA = calculateDistance(
          ISPARTA_COORDS.lat,
          ISPARTA_COORDS.lng,
          a.geojson.coordinates[1],
          a.geojson.coordinates[0]
        );
        const distB = calculateDistance(
          ISPARTA_COORDS.lat,
          ISPARTA_COORDS.lng,
          b.geojson.coordinates[1],
          b.geojson.coordinates[0]
        );
        return sortConfig.direction === 'asc' ? distA - distB : distB - distA;
      }
      const timeA = new Date(a.date_time).getTime();
      const timeB = new Date(b.date_time).getTime();
      return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
    });
    return list;
  }, [earthquakes, sortConfig]);

  const top50 = sortedEarthquakes.slice(0, 50);
  const displayedEarthquakes = showHistory ? sortedEarthquakes : top50;

  // Banner: ISPARTA/YAKIN varsa en günceli
  const latestBannerEq = useMemo(() => {
    for (const eq of sortedEarthquakes) {
      const distance = calculateDistance(
        ISPARTA_COORDS.lat,
        ISPARTA_COORDS.lng,
        eq.geojson.coordinates[1],
        eq.geojson.coordinates[0]
      );
      const rel = getRelation(eq.title, distance);
      if (rel) return eq;
    }
    return null;
  }, [sortedEarthquakes]);

  const getBannerTitle = (eq: Earthquake) => {
    const distance = calculateDistance(
      ISPARTA_COORDS.lat,
      ISPARTA_COORDS.lng,
      eq.geojson.coordinates[1],
      eq.geojson.coordinates[0]
    );
    const rel = getRelation(eq.title, distance);
    return rel === 'ISPARTA' ? "Isparta'da Deprem!" : "Isparta'ya Yakın Deprem!";
  };

  // En büyükler: 24 saat / 7 gün
  const max24h = useMemo(() => {
    const now = Date.now();
    const list = earthquakes.filter(eq => new Date(eq.date_time).getTime() >= now - 24 * 60 * 60 * 1000);
    if (list.length === 0) return null;
    return list.reduce((best, eq) => {
      if (!best) return eq;
      if (eq.mag > best.mag) return eq;
      if (eq.mag === best.mag && new Date(eq.date_time).getTime() > new Date(best.date_time).getTime()) return eq;
      return best;
    }, null as Earthquake | null);
  }, [earthquakes]);

  const max7d = useMemo(() => {
    if (earthquakes.length === 0) return null;
    return earthquakes.reduce((best, eq) => {
      if (!best) return eq;
      if (eq.mag > best.mag) return eq;
      if (eq.mag === best.mag && new Date(eq.date_time).getTime() > new Date(best.date_time).getTime()) return eq;
      return best;
    }, null as Earthquake | null);
  }, [earthquakes]);

  // ✅ OKUNURLUK KESİN ÇÖZÜM: overlay + inline renkler
  const renderMaxCard = (title: string, eq: Earthquake | null) => {
    if (!eq) {
      return (
        <div
          className="relative rounded-lg p-3 border shadow-sm overflow-hidden"
          style={{
            backgroundColor: 'rgba(255,255,255,0.10)',
            borderColor: 'rgba(255,255,255,0.18)'
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
          <div className="relative">
            <div style={{ color: 'rgba(255,255,255,0.95)' }} className="text-xs font-extrabold">
              {title}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.80)' }} className="text-xs mt-1">
              Veri yok
            </div>
          </div>
        </div>
      );
    }

    const distance = calculateDistance(
      ISPARTA_COORDS.lat,
      ISPARTA_COORDS.lng,
      eq.geojson.coordinates[1],
      eq.geojson.coordinates[0]
    );
    const rel = getRelation(eq.title, distance);
    const bg = getSeverityBg(eq.mag, rel);

    return (
      <div
        className="relative rounded-lg p-3 border shadow-sm overflow-hidden"
        style={{
          backgroundColor: bg,
          borderColor: 'rgba(0,0,0,0.12)'
        }}
      >
        {/* beyaz overlay -> header içindeki text-white mirasını etkisiz */}
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.72)' }} />

        <div className="relative">
          <div className="text-xs font-extrabold mb-1" style={{ color: '#0f172a' }}>
            {title}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold leading-none" style={{ color: '#0f172a' }}>
                {eq.mag.toFixed(1)}
              </span>
              <span className="text-xs font-semibold" style={{ color: '#334155' }}>
                {getTimeAgo(eq.date_time)}
              </span>
            </div>

            {rel && (
              <span
                className="inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold rounded-md uppercase tracking-wide shadow-md border"
                style={{
                  backgroundColor: rel === 'ISPARTA' ? '#be123c' : '#c2410c',
                  color: '#ffffff',
                  borderColor: 'rgba(0,0,0,0.12)',
                  textShadow: '0 1px 1px rgba(0,0,0,0.35)'
                }}
              >
                {rel}
              </span>
            )}
          </div>

          <div className="text-xs mt-1 leading-snug break-words font-semibold" style={{ color: '#0f172a' }}>
            {eq.title}
          </div>

          <div className="text-[11px] mt-1 flex items-center justify-between gap-2 font-medium" style={{ color: '#334155' }}>
            <span className="font-mono">Isparta&apos;dan uzaklık: {Math.round(distance)} km</span>
            <span className="whitespace-nowrap">{formatDate(eq.date_time)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      {/* Banner */}
      {latestBannerEq && (
        <div
          className="text-white p-4 mb-6 rounded-xl shadow-lg border"
          style={{
            background: 'linear-gradient(to right, #ef4444, #b91c1c)',
            borderColor: 'rgba(255,255,255,0.18)'
          }}
        >
          <div className="flex items-center gap-4">
            <AlertOctagon size={30} className="flex-shrink-0 animate-pulse" />
            <div>
              <h3 className="font-bold text-lg uppercase tracking-wide">{getBannerTitle(latestBannerEq)}</h3>
              <p className="font-medium">
                {latestBannerEq.title} - Büyüklük:{' '}
                <span className="text-xl font-bold">{latestBannerEq.mag.toFixed(1)}</span>
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
        className="text-white p-6 mb-8 rounded-xl shadow-lg"
        style={{ background: 'linear-gradient(to right, #0f172a, #1e3a8a)' }}
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-white mb-2 text-3xl font-bold flex items-center gap-3">
              <Activity size={34} className="animate-pulse" />
              Son Depremler
            </h1>
            <p className="text-white/90 text-base mb-1">AFAD Event Service canlı verileri</p>
            <p className="text-white/80 text-sm">
              30 saniyede bir güncellenir. Ses açıkken deprem bildirimi: Deprem şiddeti kadar tık sesi.
            </p>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-extrabold">
              <span
                className="px-2 py-1 rounded-md border"
                style={{ backgroundColor: '#dcfce7', borderColor: 'rgba(0,0,0,0.08)', color: '#14532d' }}
              >
                &lt;3 düşük
              </span>
              <span
                className="px-2 py-1 rounded-md border"
                style={{ backgroundColor: '#fef9c3', borderColor: 'rgba(0,0,0,0.08)', color: '#713f12' }}
              >
                3–3.9 orta
              </span>
              <span
                className="px-2 py-1 rounded-md border"
                style={{ backgroundColor: '#ffedd5', borderColor: 'rgba(0,0,0,0.08)', color: '#7c2d12' }}
              >
                4–4.9 belirgin
              </span>
              <span
                className="px-2 py-1 rounded-md border"
                style={{ backgroundColor: '#fee2e2', borderColor: 'rgba(0,0,0,0.08)', color: '#7f1d1d' }}
              >
                5–5.9 güçlü
              </span>
              <span
                className="px-2 py-1 rounded-md border"
                style={{ backgroundColor: '#fecaca', borderColor: 'rgba(0,0,0,0.08)', color: '#7f1d1d' }}
              >
                6+ çok güçlü
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:min-w-[340px]">
            <div className="bg-white/10 border border-white/15 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-[34px] w-[34px]">
                  {loading ? (
                    <RefreshCw size={26} className="animate-spin" />
                  ) : (
                    <CountdownTimer duration={30000} resetKey={lastUpdated} size={30} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm text-white/90">
                    <Clock size={14} />
                    {lastUpdated.toLocaleTimeString('tr-TR')}
                  </div>
                  <div className="text-xs text-white/70">{earthquakes.length > 0 ? `${earthquakes.length} kayıt` : ''}</div>
                </div>
              </div>

              {/* Ses butonu */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all shadow-md border hover:shadow-lg"
                style={{
                  backgroundColor: soundEnabled ? 'rgba(34, 197, 94, 0.18)' : 'rgba(255, 255, 255, 0.10)',
                  color: '#ffffff',
                  borderColor: soundEnabled ? 'rgba(34, 197, 94, 0.45)' : 'rgba(255, 255, 255, 0.18)',
                  boxShadow: soundEnabled ? '0 0 0 3px rgba(34, 197, 94, 0.20)' : undefined
                }}
                title={soundEnabled ? 'Sesli uyarı açık' : 'Sesli uyarı kapalı'}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                <span className="font-extrabold text-sm tracking-wide" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.35)' }}>
                  {soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}
                </span>
              </button>
            </div>

            {/* En büyük kartları */}
            <div className="grid grid-cols-1 gap-2">
              {renderMaxCard('Son 24 saatte en büyük deprem', max24h)}
              {renderMaxCard('Son 7 günün en büyük depremi', max7d)}
            </div>
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

                {/* Büyüklük önce */}
                <th
                  className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  onClick={() => handleSort('mag')}
                  title="İlk tık: en büyük üstte"
                >
                  <div className="flex items-center justify-center gap-1">
                    Büyüklük
                    {sortConfig.key === 'mag' &&
                      (sortConfig.direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                    {sortConfig.key !== 'mag' && <ArrowUpDown size={14} className="text-gray-400" />}
                  </div>
                </th>

                <th
                  className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  onClick={() => handleSort('distance')}
                  title="İlk tık: en yakın üstte"
                >
                  <div className="flex items-center justify-center gap-1">
                    <Navigation size={16} className="inline mr-1" />
                    Isparta'ya Uzaklık
                    {sortConfig.key === 'distance' &&
                      (sortConfig.direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
                    {sortConfig.key !== 'distance' && <ArrowUpDown size={14} className="text-gray-400" />}
                  </div>
                </th>

                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                  Derinlik (km)
                </th>

                <th
                  className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  onClick={() => handleSort('date_time')}
                  title="Varsayılan: en yeni üstte"
                >
                  <div className="flex items-center gap-1">
                    <Clock size={16} className="inline mr-2" />
                    Tarih / Saat
                    {sortConfig.key === 'date_time' &&
                      (sortConfig.direction === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
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

                  const rel = getRelation(eq.title, distance);
                  const recent = isRecent(eq.date_time);
                  const rowColor = getRowColor(eq.mag, rel);

                  let rowClasses = 'transition-all duration-150 border-l-4';
                  if (rel === 'ISPARTA') rowClasses += ' border-l-rose-600 shadow-sm';
                  else if (rel === 'YAKIN') rowClasses += ' border-l-orange-500 shadow-sm';
                  else if (eq.mag >= 6) rowClasses += ' border-l-red-700';
                  else if (eq.mag >= 5) rowClasses += ' border-l-red-500';
                  else if (eq.mag >= 4) rowClasses += ' border-l-orange-400';
                  else if (eq.mag >= 3) rowClasses += ' border-l-yellow-400';
                  else rowClasses += ' border-l-green-400';

                  if (recent) rowClasses += ' animate-pulse';

                  return (
                    <tr key={eq.earthquake_id || index} className={rowClasses} style={{ backgroundColor: rowColor }}>
                      {/* Yer */}
                      <td
                        className={`px-6 py-4 border-r border-gray-300 border-b border-gray-300 ${
                          rel ? 'font-bold text-gray-900 text-base' : 'text-gray-800'
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-start gap-2 flex-wrap">
                            {rel && (
                              <span
                                className="inline-flex items-center px-2.5 py-1 text-[11px] font-extrabold rounded-md uppercase tracking-wide mt-0.5 shadow-md border"
                                style={{
                                  backgroundColor: rel === 'ISPARTA' ? '#be123c' : '#c2410c',
                                  color: '#ffffff',
                                  borderColor: 'rgba(0,0,0,0.12)',
                                  textShadow: '0 1px 1px rgba(0,0,0,0.35)'
                                }}
                              >
                                {rel}
                              </span>
                            )}

                            {recent && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-900 text-xs font-bold rounded uppercase mt-0.5 shadow-sm animate-pulse border border-blue-300">
                                <Zap size={12} className="mr-1" />
                                YENİ
                              </span>
                            )}

                            <span className="break-words">{eq.title}</span>
                          </div>

                          <div className="text-xs text-gray-600 mt-1 ml-1 flex items-center gap-1">
                            <Clock size={10} />
                            {getTimeAgo(eq.date_time)}
                          </div>
                        </div>
                      </td>

                      {/* Büyüklük */}
                      <td className="px-6 py-4 text-center border-r border-gray-300 border-b border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${getMagnitudeBadgeStyle(
                              eq.mag
                            )}`}
                          >
                            {eq.mag.toFixed(1)}
                          </span>

                          {eq.mag >= 6 && <AlertOctagon className="text-red-700 animate-pulse" size={24} />}
                          {eq.mag >= 5 && eq.mag < 6 && <AlertTriangle className="text-red-600" size={20} />}
                        </div>
                      </td>

                      {/* Uzaklık */}
                      <td className="px-6 py-4 text-center border-r border-gray-300 border-b border-gray-300 font-mono text-gray-700">
                        {Math.round(distance)} km
                      </td>

                      {/* Derinlik */}
                      <td className="px-6 py-4 text-center text-gray-700 font-medium border-r border-gray-300 border-b border-gray-300">
                        {Number.isFinite(eq.depth) ? eq.depth.toFixed(1) : '0.0'}
                      </td>

                      {/* Tarih */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-300">
                        <span>{formatDate(eq.date_time)}</span>
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
              style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' }}
            >
              <ChevronDown size={20} />
              <span>Daha Fazla Göster ({sortedEarthquakes.length - 50} kayıt daha)</span>
            </button>
          </div>
        )}

        {showHistory && (
          <div className="p-4 text-center border-t border-gray-200 bg-gray-50">
            <p className="text-gray-600 italic">Tüm kayıtlar gösteriliyor.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
        <p className="text-sm text-blue-800">
          <strong>Not:</strong> Kaynak: "AFAD Event Service"
          <br />
          <span className="font-bold">Son 1 saat</span> içindeki depremler <span className="font-bold">“YENİ”</span> etiketi ile belirtilir.
          <br />
          <span className="font-bold">ISPARTA</span>: Isparta il sınırları içinde.{' '}
          <span className="font-bold ml-2">YAKIN</span>: Isparta dışı ama 100 km'den yakın.
        </p>
      </div>
    </PageContainer>
  );
}
