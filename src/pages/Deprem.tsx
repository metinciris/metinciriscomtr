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

function SoundToggle({
  enabled,
  onToggle
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className="inline-flex items-center gap-3 select-none shrink-0 rounded-full px-2 py-1
                 bg-white/10 border border-white/15 backdrop-blur-sm
                 shadow-sm hover:bg-white/15 active:scale-[0.98]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      title={enabled ? 'Ses Açık' : 'Ses Kapalı'}
    >
      {/* iOS-style switch */}
      <span
        className={[
          "relative inline-flex h-7 w-[46px] items-center rounded-full transition-colors",
          enabled ? "bg-green-500" : "bg-white/25"
        ].join(" ")}
        style={{
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)"
        }}
      >
        <span
          className={[
            "inline-block h-6 w-6 rounded-full bg-white transition-transform",
            enabled ? "translate-x-[18px]" : "translate-x-[2px]"
          ].join(" ")}
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.35)"
          }}
        />
      </span>

      {/* icon */}
      <span className="text-white/90">
        {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </span>

      {/* label: mobil kısa, desktop uzun */}
      <span className="font-extrabold text-sm text-white sm:hidden">Ses</span>
      <span className="font-extrabold text-sm text-white hidden sm:inline">
        {enabled ? 'Ses Açık' : 'Ses Kapalı'}
      </span>
    </button>
  );
}


type SoundItem = { mag: number; isNear: boolean; eq: Earthquake };

type LastAlertInfo = {
  title: string;
  mag: number;
  date_time: string;
  distanceKm: number;
  relation: 'ISPARTA' | 'YAKIN' | null;
};

export function Deprem() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [lastAlert, setLastAlert] = useState<LastAlertInfo | null>(null);
  const lastAlertHideTimer = useRef<number | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'date_time',
    direction: 'desc'
  });

  const ISPARTA_COORDS = { lat: 37.7648, lng: 30.5567 };
  const NEAR_KM = 100;

  // ✅ AFAD Proxy / Worker URL
  const AFAD_PROXY = 'https://depremo.tutkumuz.workers.dev';

  const latestEqDateRef = useRef<string | null>(null);

  // ===== İstanbul TZ helpers =====
  const IST_TZ = 'Europe/Istanbul';

  const toIstanbulParam = (d: Date) => {
    const parts = new Intl.DateTimeFormat('sv-SE', {
      timeZone: IST_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).formatToParts(d);

    const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
  };

  const formatTimeIstanbul = (d: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: IST_TZ,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(d);
  };

  const formatDateIstanbul = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('tr-TR', {
        timeZone: IST_TZ,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // ✅ Kritik: AFAD event-service timezone’suz timestamp → UTC kabul et (Z ekle)
  const normalizeDateString = (s: any): string => {
    if (!s) return '';
    let str = String(s).trim();

    if (str.includes(' ') && !str.includes('T')) str = str.replace(' ', 'T');

    const hasTZ =
      /[zZ]$/.test(str) || /[+-]\d{2}:\d{2}$/.test(str) || /[+-]\d{4}$/.test(str);

    return hasTZ ? str : `${str}Z`;
  };
  // ==============================

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

  // “Isparta/ısparta” geçen her şey: ISPARTA
  const getRelation = (title: string, distanceKm: number): 'ISPARTA' | 'YAKIN' | null => {
    const t = title.toLocaleLowerCase('tr-TR');
    if (t.includes('isparta') || t.includes('ısparta')) return 'ISPARTA';
    if (distanceKm < NEAR_KM) return 'YAKIN';
    return null;
  };

  const getRowColor = (mag: number, relation: 'ISPARTA' | 'YAKIN' | null) => {
    if (relation === 'ISPARTA') return '#ffe4e6';
    if (relation === 'YAKIN') return '#ffedd5';

    if (mag >= 6) return '#fecaca';
    if (mag >= 5) return '#fee2e2';
    if (mag >= 4) return '#ffedd5';
    if (mag >= 3) return '#fef9c3';
    return '#dcfce7';
  };

  const getSeverityBg = (mag: number, relation: 'ISPARTA' | 'YAKIN' | null) => getRowColor(mag, relation);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current.key === key) {
        return { key, direction: current.direction === 'desc' ? 'asc' : 'desc' };
      }
      const defaultDir: SortDirection = key === 'distance' ? 'asc' : 'desc';
      return { key, direction: defaultDir };
    });
  };

  // ---- SOUND ----
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

  const playNearPreamble = async () => {
    if (!soundEnabled) return;
    playBeep(440, 0.55); // 1 uzun
    await sleep(700);
    playBeep(660, 0.12); // 2 kısa
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

  const showLastAlert = (eq: Earthquake, relation: 'ISPARTA' | 'YAKIN' | null, distanceKm: number) => {
    setLastAlert({
      title: eq.title,
      mag: eq.mag,
      date_time: eq.date_time,
      distanceKm,
      relation
    });

    if (lastAlertHideTimer.current) window.clearTimeout(lastAlertHideTimer.current);
    lastAlertHideTimer.current = window.setTimeout(() => setLastAlert(null), 30000);
  };

  const processSoundQueue = async () => {
    if (isPlaying.current || soundQueue.current.length === 0) return;
    isPlaying.current = true;

    while (soundQueue.current.length > 0) {
      const item = soundQueue.current.shift();
      if (!item) break;

      const distanceKm = calculateDistance(
        ISPARTA_COORDS.lat,
        ISPARTA_COORDS.lng,
        item.eq.geojson.coordinates[1],
        item.eq.geojson.coordinates[0]
      );
      const rel = getRelation(item.eq.title, distanceKm);
      showLastAlert(item.eq, rel, distanceKm);

      if (item.isNear) {
        await playNearPreamble();
      }
      await playBeepSequence(Math.floor(item.mag));

      if (soundQueue.current.length > 0) await sleep(900);
    }

    isPlaying.current = false;
  };
  // ---- /SOUND ----

  // Map AFAD shapes -> Earthquake[]
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
        geojson: { type: 'Point', coordinates: [lngNum, latNum] }
      });
    };

    // GeoJSON FeatureCollection
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

    // Array
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
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      const qs = new URLSearchParams({
        start: toIstanbulParam(start),
        end: toIstanbulParam(end),
        format: 'json'
      });

      const resp = await fetch(`${AFAD_PROXY}/?${qs.toString()}`);
      if (!resp.ok) throw new Error(`AFAD Proxy Hatası: ${resp.status}`);

      const raw = await resp.json();
      const mapped = mapAfadToEarthquakes(raw);

      const uniqueMap = new Map<string, Earthquake>();
      for (const eq of mapped) uniqueMap.set(eq.earthquake_id, eq);
      const uniqueEarthquakes = Array.from(uniqueMap.values());

      uniqueEarthquakes.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

      // New quake detection
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
              soundQueue.current.push({ mag: eq.mag, isNear: rel !== null, eq });
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
        const distA = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, a.geojson.coordinates[1], a.geojson.coordinates[0]);
        const distB = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, b.geojson.coordinates[1], b.geojson.coordinates[0]);
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

  const latestBannerEq = useMemo(() => {
    for (const eq of sortedEarthquakes) {
      const distance = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, eq.geojson.coordinates[1], eq.geojson.coordinates[0]);
      const rel = getRelation(eq.title, distance);
      if (rel) return eq;
    }
    return null;
  }, [sortedEarthquakes]);

  const getBannerTitle = (eq: Earthquake) => {
    const distance = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, eq.geojson.coordinates[1], eq.geojson.coordinates[0]);
    const rel = getRelation(eq.title, distance);
    return rel === 'ISPARTA' ? "Isparta'da Deprem!" : "Isparta'ya Yakın Deprem!";
  };

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

  const renderMaxCard = (title: string, eq: Earthquake | null) => {
    if (!eq) {
      return (
        <div
          className="relative rounded-lg p-3 border shadow-sm overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.18)' }}
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

    const distance = calculateDistance(ISPARTA_COORDS.lat, ISPARTA_COORDS.lng, eq.geojson.coordinates[1], eq.geojson.coordinates[0]);
    const rel = getRelation(eq.title, distance);
    const bg = getSeverityBg(eq.mag, rel);

    const lat = eq.geojson.coordinates[1];
    const lon = eq.geojson.coordinates[0];
    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=10/${lat}/${lon}`;

    return (
      <div className="relative rounded-lg p-3 border shadow-sm overflow-hidden" style={{ backgroundColor: bg, borderColor: 'rgba(0,0,0,0.12)' }}>
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
            <span className="flex items-center gap-2">
              <span className="whitespace-nowrap">{formatDateIstanbul(eq.date_time)}</span>
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
                style={{ color: '#1d4ed8' }}
                title="OpenStreetMap'te aç"
              >
                Haritada aç
              </a>
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSeverityBar = () => {
    const items = [
      { label: '<3 düşük', bg: '#dcfce7', fg: '#14532d' },
      { label: '3–3.9 orta', bg: '#fef9c3', fg: '#713f12' },
      { label: '4–4.9 belirgin', bg: '#ffedd5', fg: '#7c2d12' },
      { label: '5–5.9 güçlü', bg: '#fee2e2', fg: '#7f1d1d' },
      { label: '6+ çok güçlü', bg: '#fecaca', fg: '#7f1d1d' }
    ];

    return (
      <div className="w-full mt-2">
        <div className="rounded-lg overflow-hidden border border-white/15 bg-white/10">
          <div className="flex flex-wrap">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="px-3 py-2 text-[11px] font-extrabold text-center flex-1 basis-[20%] min-w-[120px] sm:min-w-[140px]"
                style={{ backgroundColor: it.bg, color: it.fg }}
              >
                {it.label}
              </div>
            ))}
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
          style={{ background: 'linear-gradient(to right, #ef4444, #b91c1c)', borderColor: 'rgba(255,255,255,0.18)' }}
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
                {formatDateIstanbul(latestBannerEq.date_time)} ({getTimeAgo(latestBannerEq.date_time)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-white p-5 mb-8 rounded-xl shadow-lg" style={{ background: 'linear-gradient(to right, #0f172a, #1e3a8a)' }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-white text-3xl font-bold flex items-center gap-3">
                <Activity size={34} className="animate-pulse" />
                Son Depremler
              </h1>

              <p className="text-white/85 text-sm mt-1">
                Ses açıkken deprem bildirimi: Deprem şiddeti kadar tık sesi.
              </p>

              {soundEnabled && lastAlert && (
                <div
                  className="mt-2 inline-flex items-start gap-2 rounded-lg border px-3 py-2 max-w-[920px]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.18)' }}
                >
                  <Zap size={16} className="mt-[2px]" />
                  <div className="text-xs leading-snug">
                    <div className="font-extrabold text-white/95">
                      Son bildirim: {lastAlert.mag.toFixed(1)} • {getTimeAgo(lastAlert.date_time)}
                      {lastAlert.relation ? ` • ${lastAlert.relation}` : ''}
                    </div>
                    <div className="text-white/85 break-words">
                      {lastAlert.title} • Isparta&apos;dan {Math.round(lastAlert.distanceKm)} km • {formatDateIstanbul(lastAlert.date_time)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sağ üst: Ses toggle + sayaç/saat */}
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* ✅ Ses toggle: artık sağdan taşmaz */}
              <SoundToggle enabled={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />

              <div className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 flex items-center gap-3">
                <div className="flex items-center justify-center h-[30px] w-[30px]">
                  {loading ? <RefreshCw size={22} className="animate-spin" /> : <CountdownTimer duration={30000} resetKey={lastUpdated} size={28} />}
                </div>

                <div className="leading-tight">
                  <div className="flex items-center gap-1 text-sm text-white/90">
                    <Clock size={14} />
                    {formatTimeIstanbul(lastUpdated)}
                  </div>
                  <div className="text-xs text-white/75">
                    {earthquakes.length > 0 ? `Son 7 günde ${earthquakes.length} deprem` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Max cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {renderMaxCard('Son 24 saatte en büyük deprem', max24h)}
            {renderMaxCard('Son 7 günün en büyük depremi', max7d)}
          </div>

          {renderSeverityBar()}
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
                    Isparta&apos;ya Uzaklık
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
                    Tarih / Saat (TS)
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
                      <td className={`px-6 py-4 border-r border-gray-300 border-b border-gray-300 ${rel ? 'font-bold text-gray-900 text-base' : 'text-gray-800'}`}>
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

                      <td className="px-6 py-4 text-center border-r border-gray-300 border-b border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${getMagnitudeBadgeStyle(eq.mag)}`}>
                            {eq.mag.toFixed(1)}
                          </span>

                          {eq.mag >= 6 && <AlertOctagon className="text-red-700 animate-pulse" size={24} />}
                          {eq.mag >= 5 && eq.mag < 6 && <AlertTriangle className="text-red-600" size={20} />}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center border-r border-gray-300 border-b border-gray-300 font-mono text-gray-700">
                        {Math.round(distance)} km
                      </td>

                      <td className="px-6 py-4 text-center text-gray-700 font-medium border-r border-gray-300 border-b border-gray-300">
                        {Number.isFinite(eq.depth) ? eq.depth.toFixed(1) : '0.0'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-300">
                        <span>{formatDateIstanbul(eq.date_time)}</span>
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
          <strong>Not:</strong> Kaynak: AFAD Event Service.
          <br />
          <span className="font-bold">Son 1 saat</span> içindeki depremler <span className="font-bold">“YENİ”</span> etiketi ile belirtilir.
          <br />
          <span className="font-bold">ISPARTA</span>: “Isparta/ısparta” geçen kayıtlar.{' '}
          <span className="font-bold ml-2">YAKIN</span>: Isparta merkeze 100 km yakın.
        </p>
      </div>
    </PageContainer>
  );
}
