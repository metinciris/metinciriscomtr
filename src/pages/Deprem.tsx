/**
 * Deprem.tsx — FINAL
 * ============================================================
 * İSTEKLER (son durum):
 * ------------------------------------------------------------
 * ✅ Üstte Isparta/Yakın: EKRANDA 1 kart (en yeni).
 * ✅ Eğer başka Isparta/Yakın deprem varsa: "+N diğer" butonu.
 * ✅ Butona basınca: çökmeden, mobilde 1 / desktop'ta 2 görünecek şekilde
 *    yatay kaydırmalı şerit açılır (oklarla kaydırma).
 * ✅ Desktop tablo görünürlüğü Tailwind breakpoint'e bağlı değil:
 *    matchMedia ile "gerçek desktop" tespiti yapılıyor.
 * ✅ Mobil liste "karo" sisteminde: yer + zaman önce + büyüklük belirgin,
 *    karta tıklayınca detay açılıyor.
 * ✅ Mobil sıralama: select değil, 3 buton (tam satır).
 * ✅ "Son Depremler Listesi" H2 kaldırıldı.
 * ✅ Şiddet renk barı tablonun üstünde.
 *
 * NOTLAR:
 * ------------------------------------------------------------
 * - LocalStorage yok.
 * - Zaman: Europe/Istanbul formatında gösterilir.
 * - Zaman normalizasyonu: timezone yoksa Z EKLEMEYİZ (3 saat geri kalma yapıyordu).
 * - AFAD verisi Cloudflare Worker proxy üzerinden çekilir.
 */

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
  Navigation,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/* ============================================================
   1) Tipler
   ============================================================ */
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
type Relation = 'ISPARTA' | 'YAKIN' | null;

/* ============================================================
   2) Sabitler
   ============================================================ */
const ISPARTA_COORDS = { lat: 37.7648, lng: 30.5567 };
const NEAR_KM = 100;
const IST_TZ = 'Europe/Istanbul';
const AFAD_PROXY = 'https://depremo.tutkumuz.workers.dev';

// Tasarımda bloklar arası boşluk — tek yerden yönet
const SECTION_GAP = 'mb-5';

// Navbar’a biraz yaklaşması için (istersen 0 yap)
const PAGE_TOP_PULL = '-mt-4';

/* ============================================================
   3) Responsive garanti (Tailwind md’ye takılma)
   ============================================================ */
function useIsDesktop(minWidth = 768) {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(`(min-width:${minWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(min-width:${minWidth}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    setIsDesktop(mq.matches);

    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, [minWidth]);

  return isDesktop;
}

/* ============================================================
   4) 30sn countdown (kaybolmasın)
   ============================================================ */
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

/* ============================================================
   5) Bildirim toggle
   ============================================================ */
function NotificationToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
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
      className={[
        'group inline-flex items-center gap-3 select-none shrink-0 rounded-full px-3 py-2',
        'border backdrop-blur-sm shadow-sm active:scale-[0.98]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        // kırılmayı azalt (senin dediğin)
        'whitespace-nowrap',
        enabled
          ? 'bg-green-500/20 border-green-300/40 ring-2 ring-green-300/40'
          : 'bg-white/10 border-white/15 hover:bg-white/15'
      ].join(' ')}
      title={enabled ? 'Bildirim Açık' : 'Bildirim Kapalı'}
    >
      {/* Switch */}
      <span
        className={[
          'relative inline-flex h-7 w-[46px] items-center rounded-full transition-colors',
          enabled ? 'bg-green-500' : 'bg-white/25'
        ].join(' ')}
        style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35)' }}
      >
        <span
          className={[
            'inline-block h-6 w-6 rounded-full bg-white transition-transform',
            enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
          ].join(' ')}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
        />
      </span>

      {/* Icon */}
      <span className="text-white/90">{enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</span>

      {/* Text */}
      <span className="font-extrabold text-sm text-white">{enabled ? 'Bildirim Açık' : 'Bildirim Kapalı'}</span>

      {/* Hafif teşvik */}
      <span className="hidden sm:inline text-xs text-white/70 group-hover:text-white/80 transition">
        {enabled ? '• tık uyarısı aktif' : '• açarsan uyarı veririm'}
      </span>
    </button>
  );
}

/* ============================================================
   6) Tarih/saat/mesafe/renk yardımcıları
   ============================================================ */

/**
 * ZAMAN NORMALİZASYONU:
 * - Eskiden timezone yoksa "Z" eklemek 3 saat geri kaydırıyordu.
 * - O yüzden: sadece format düzelt (space->T), Z EKLEME.
 */
const normalizeDateString = (s: any): string => {
  if (!s) return '';
  let str = String(s).trim();
  if (str.includes(' ') && !str.includes('T')) str = str.replace(' ', 'T');
  return str;
};

const formatTimeIstanbul = (d: Date) =>
  new Intl.DateTimeFormat('tr-TR', {
    timeZone: IST_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d);

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

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
};

// haversine
const deg2rad = (deg: number) => deg * (Math.PI / 180);
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
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
  if (totalMinutes < 120) return minutes <= 0 ? `${hours} saat önce` : `${hours} saat ${minutes} dk önce`;
  return `${hours} saat önce`;
};

const isRecent = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours < 1;
};

const getRelation = (title: string, distanceKm: number): Relation => {
  const t = title.toLocaleLowerCase('tr-TR');
  if (t.includes('isparta') || t.includes('ısparta')) return 'ISPARTA';
  if (distanceKm < NEAR_KM) return 'YAKIN';
  return null;
};

// Şiddet rengi (tablo + kartlar uyumlu tek kaynak)
const getSeverityColor = (mag: number) => {
  if (mag >= 6) return '#fecaca';
  if (mag >= 5) return '#fee2e2';
  if (mag >= 4) return '#ffedd5';
  if (mag >= 3) return '#fef9c3';
  return '#dcfce7';
};

const getMagnitudeBadgeStyle = (mag: number) => {
  if (mag >= 6) return 'bg-red-100 text-red-900 border border-red-300 ring-2 ring-red-500';
  if (mag >= 5) return 'bg-red-100 text-red-800 border border-red-200 ring-1 ring-red-400';
  if (mag >= 4) return 'bg-orange-100 text-orange-800 border border-orange-200';
  if (mag >= 3) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return 'bg-green-100 text-green-800 border border-green-200';
};

/* ============================================================
   7) AFAD map
   ============================================================ */
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

  // FeatureCollection
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

  // raw.result
  if (raw?.result && Array.isArray(raw.result)) return mapAfadToEarthquakes(raw.result);

  return out;
};

/* ============================================================
   8) Şiddet bar
   ============================================================ */
function SeverityBar() {
  const items = [
    { label: '<3 düşük', bg: '#dcfce7', fg: '#14532d' },
    { label: '3–3.9 orta', bg: '#fef9c3', fg: '#713f12' },
    { label: '4–4.9 belirgin', bg: '#ffedd5', fg: '#7c2d12' },
    { label: '5–5.9 güçlü', bg: '#fee2e2', fg: '#7f1d1d' },
    { label: '6+ çok güçlü', bg: '#fecaca', fg: '#7f1d1d' }
  ];

  return (
    <div className={`w-full ${SECTION_GAP}`}>
      <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
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
}

/* ============================================================
   9) Ana bileşen
   ============================================================ */
export function Deprem() {
  const isDesktop = useIsDesktop(768);

  /* ------------------------------
     State
  ------------------------------ */
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Bildirim
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Desktop tablo sıralama
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'date_time',
    direction: 'desc'
  });

  // Mobil sıralama (3 buton)
  const [mobileSort, setMobileSort] = useState<'newest' | 'largest' | 'nearest'>('newest');

  // Mobil accordion
  const [openMobileId, setOpenMobileId] = useState<string | null>(null);

  // 50 / hepsi
  const [showHistory, setShowHistory] = useState(false);

  // Üst şeritte “diğerlerini göster” aç/kapat
  const [showMoreIspartaStrip, setShowMoreIspartaStrip] = useState(false);

  /* ------------------------------
     Refs (render tetiklemesin)
  ------------------------------ */
  const seenIdsRef = useRef<Set<string>>(new Set());

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundQueue = useRef<Earthquake[]>([]);
  const isPlaying = useRef(false);

  const alertStripRef = useRef<HTMLDivElement | null>(null);
// Ok butonlarıyla şeridi yana kaydırmak için
const scrollAlertStripBy = (dir: 'left' | 'right') => {
  const el = alertStripRef.current;
  if (!el) return;

  // Mobilde ekrana yakın, desktop'ta sabit kaydırma
  const step = isDesktop ? 480 : Math.round(window.innerWidth * 0.9);

  el.scrollBy({
    left: dir === 'left' ? -step : step,
    behavior: 'smooth'
  });
};

  /* ============================================================
     10) Ses (WebAudio) — basit ve stabil
     ============================================================ */
  const ensureAudio = async () => {
    if (!notificationsEnabled) return null;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;

    if (!audioCtxRef.current) audioCtxRef.current = new Ctor();

    if (audioCtxRef.current.state === 'suspended') {
      try {
        await audioCtxRef.current.resume();
      } catch {
        // ignore
      }
    }
    return audioCtxRef.current;
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const playBeep = async (frequency: number, duration: number, gainLevel = 0.1) => {
    if (!notificationsEnabled) return;
    try {
      const ctx = await ensureAudio();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  // Isparta/Yakın ise önce 1 uzun “uyarı”
  const playNearPreamble = async () => {
    if (!notificationsEnabled) return;
    await playBeep(440, 0.55, 0.11);
    await sleep(650);
  };

  const playBeepSequence = async (count: number) => {
    if (!notificationsEnabled || count <= 0) return;
    for (let i = 0; i < count; i++) {
      await playBeep(880, 0.15, 0.1);
      await sleep(280);
    }
  };

  const processSoundQueue = async (distanceMap: Map<string, number>) => {
    if (isPlaying.current) return;
    if (!notificationsEnabled || soundQueue.current.length === 0) return;

    isPlaying.current = true;

    while (soundQueue.current.length > 0) {
      if (!notificationsEnabled) {
        soundQueue.current = [];
        break;
      }

      const eq = soundQueue.current.shift();
      if (!eq) break;

      const distance = distanceMap.get(eq.earthquake_id) ?? 999999;
      const rel = getRelation(eq.title, distance);

      if (rel) await playNearPreamble();
      await playBeepSequence(Math.floor(eq.mag));

      if (soundQueue.current.length > 0) await sleep(800);
    }

    isPlaying.current = false;
  };

  /* ============================================================
     11) Fetch
     ============================================================ */
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

      // deduplicate
      const uniqueMap = new Map<string, Earthquake>();
      for (const eq of mapped) uniqueMap.set(eq.earthquake_id, eq);

      const list = Array.from(uniqueMap.values());

      // default: newest first
      list.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

      // yeni deprem tespiti (ID bazlı)
      const newOnes: Earthquake[] = [];
      for (const eq of list) {
        if (!seenIdsRef.current.has(eq.earthquake_id)) newOnes.push(eq);
      }

      // ilk yükleme: hepsini “görüldü” say (ses çalma yok)
      if (seenIdsRef.current.size === 0) {
        list.forEach((eq) => seenIdsRef.current.add(eq.earthquake_id));
      } else {
        list.forEach((eq) => seenIdsRef.current.add(eq.earthquake_id));
      }

      setEarthquakes(list);

      // ses için distanceMap
      const dmap = new Map<string, number>();
      for (const eq of list) {
        const d = calculateDistance(
          ISPARTA_COORDS.lat,
          ISPARTA_COORDS.lng,
          eq.geojson.coordinates[1],
          eq.geojson.coordinates[0]
        );
        dmap.set(eq.earthquake_id, d);
      }

      if (notificationsEnabled && newOnes.length > 0) {
        newOnes.forEach((eq) => soundQueue.current.push(eq));
        processSoundQueue(dmap);
      }
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
    const id = setInterval(() => fetchData(), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
     12) Memo: distanceMap, üst isparta listesi, tablo sıralaması
     ============================================================ */
  const distanceMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const eq of earthquakes) {
      const d = calculateDistance(
        ISPARTA_COORDS.lat,
        ISPARTA_COORDS.lng,
        eq.geojson.coordinates[1],
        eq.geojson.coordinates[0]
      );
      m.set(eq.earthquake_id, d);
    }
    return m;
  }, [earthquakes]);

  /**
   * Üstte kullanılacak Isparta/Yakın listesi
   * - Burada hepsini tutuyoruz (kullanıcı "diğerleri de görünsün" dedi)
   * - Ama ekranda: 1 kart + isteğe bağlı “diğerleri şerit”
   */
  const alertEarthquakes = useMemo(() => {
    const list = earthquakes
      .map((eq) => {
        const distance = distanceMap.get(eq.earthquake_id) ?? 999999;
        const rel = getRelation(eq.title, distance);
        return { eq, rel, distance };
      })
      .filter((x) => x.rel !== null) as Array<{ eq: Earthquake; rel: Exclude<Relation, null>; distance: number }>;

    list.sort((a, b) => new Date(b.eq.date_time).getTime() - new Date(a.eq.date_time).getTime());
    return list;
  }, [earthquakes, distanceMap]);

  const latestAlert = alertEarthquakes[0] ?? null;
  const otherAlertCount = Math.max(0, alertEarthquakes.length - 1);

  // Şerit: mobil 1 kart görünsün, desktop 2 kart görünsün (çökme olmasın)
  const stripCardWidthClass = isDesktop ? 'w-[460px]' : 'w-[88%]';

  const scrollAlertStrip = (dir: 'left' | 'right') => {
    const el = alertStripRef.current;
    if (!el) return;
    const delta = dir === 'left' ? -420 : 420;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Desktop tablo sıralaması
  const sortedEarthquakes = useMemo(() => {
    const list = [...earthquakes];

    list.sort((a, b) => {
      if (sortConfig.key === 'mag') {
        return sortConfig.direction === 'asc' ? a.mag - b.mag : b.mag - a.mag;
      }
      if (sortConfig.key === 'distance') {
        const da = distanceMap.get(a.earthquake_id) ?? 999999;
        const db = distanceMap.get(b.earthquake_id) ?? 999999;
        return sortConfig.direction === 'asc' ? da - db : db - da;
      }
      const ta = new Date(a.date_time).getTime();
      const tb = new Date(b.date_time).getTime();
      return sortConfig.direction === 'asc' ? ta - tb : tb - ta;
    });

    return list;
  }, [earthquakes, sortConfig, distanceMap]);

  const displayedEarthquakes = showHistory ? sortedEarthquakes : sortedEarthquakes.slice(0, 50);

  // Mobil sıralama (karo)
  const mobileSorted = useMemo(() => {
    const list = [...earthquakes];

    if (mobileSort === 'largest') {
      list.sort((a, b) => b.mag - a.mag || new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
      return list;
    }

    if (mobileSort === 'nearest') {
      list.sort((a, b) => {
        const da = distanceMap.get(a.earthquake_id) ?? 999999;
        const db = distanceMap.get(b.earthquake_id) ?? 999999;
        return da - db || new Date(b.date_time).getTime() - new Date(a.date_time).getTime();
      });
      return list;
    }

    // newest
    list.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
    return list;
  }, [earthquakes, mobileSort, distanceMap]);

  /* ============================================================
     13) Max kartlar
     ============================================================ */
  const max24h = useMemo(() => {
    const now = Date.now();
    const list = earthquakes.filter((eq) => new Date(eq.date_time).getTime() >= now - 24 * 60 * 60 * 1000);
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
        <div className="rounded-xl border bg-white/10 p-3 shadow-sm" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>
          <div className="text-xs font-extrabold text-white/95">{title}</div>
          <div className="text-xs mt-1 text-white/75">Veri yok</div>
        </div>
      );
    }

    const distance = distanceMap.get(eq.earthquake_id) ?? 999999;
    const rel = getRelation(eq.title, distance);
    const bg = getSeverityColor(eq.mag);

    const lat = eq.geojson.coordinates[1];
    const lon = eq.geojson.coordinates[0];
    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=10/${lat}/${lon}`;

    return (
      <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: bg, borderColor: 'rgba(0,0,0,0.12)' }}>
        <div className="p-3">
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
            <span className="font-mono">Isparta uzaklık: {Math.round(distance)} km</span>

            <span className="flex items-center gap-2">
              <span className="whitespace-nowrap">{formatDateIstanbul(eq.date_time)}</span>
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
                style={{ color: '#1d4ed8' }}
              >
                Haritada aç
              </a>
            </span>
          </div>
        </div>
      </div>
    );
  };

  /* ============================================================
     14) Tablo sort
     ============================================================ */
  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'desc' ? 'asc' : 'desc' };
      }
      const defaultDir: SortDirection = key === 'distance' ? 'asc' : 'desc';
      return { key, direction: defaultDir };
    });
  };

  /* ============================================================
     15) Render
     ============================================================ */
  return (
    <PageContainer>
      <div className={PAGE_TOP_PULL}>
        {/* =====================================================
            A) ÜST: Isparta/Yakın (1 kart + "+N diğer" ile açılan şerit)
           ===================================================== */}
        {latestAlert && (
          <div className={SECTION_GAP}>
            <div className="flex items-center justify-between mb-2 gap-3">
              <div className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
                Isparta / Yakın Deprem
              </div>

              {/* +N diğer butonu */}
              {otherAlertCount > 0 && (
                <button
                  onClick={() => setShowMoreIspartaStrip((v) => !v)}
                  className="text-xs font-extrabold px-2.5 py-1.5 rounded-lg border bg-white shadow-sm hover:bg-gray-50"
                  title="Diğer Isparta/Yakın depremleri göster/gizle"
                >
                  {showMoreIspartaStrip ? 'Kapat' : `+${otherAlertCount} diğer`}
                </button>
              )}
            </div>

            {/* En yeni tek kart */}
            <div
              className="rounded-xl border shadow-sm overflow-hidden"
              style={{
                backgroundColor: latestAlert.rel === 'ISPARTA' ? '#ffe4e6' : '#ffedd5',
                borderColor: 'rgba(0,0,0,0.12)'
              }}
            >
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center px-2 py-1 text-[11px] font-extrabold rounded-md uppercase"
                      style={{
                        backgroundColor: latestAlert.rel === 'ISPARTA' ? '#be123c' : '#c2410c',
                        color: '#fff'
                      }}
                    >
                      {latestAlert.rel}
                    </span>

                    <span className="text-xs text-slate-700 font-semibold">{getTimeAgo(latestAlert.eq.date_time)}</span>
                  </div>

                  <div className="text-sm font-extrabold text-slate-900 break-words">{latestAlert.eq.title}</div>

                  <div className="text-xs text-slate-700 mt-1">
                    Isparta’ya uzaklık:{' '}
                    <span className="font-mono font-bold">{Math.round(latestAlert.distance)} km</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-4xl font-black leading-none text-slate-900">
                    {latestAlert.eq.mag.toFixed(1)}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">Mw / ML</div>
                </div>
              </div>
            </div>

            {/* Diğerleri (isteğe bağlı açılan şerit) */}
            {showMoreIspartaStrip && otherAlertCount > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-600">
                    Diğer Isparta/Yakın depremler
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollAlertStripBy'left')}
                      className="p-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm"
                      title="Sola"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => scrollAlertStripBy'right')}
                      className="p-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm"
                      title="Sağa"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div
                  ref={alertStripRef}
                  className="flex flex-row flex-nowrap gap-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth pb-1 items-stretch"
                >
                  {alertEarthquakes.slice(1).map((it) => (
                    <div
                      key={it.eq.earthquake_id}
                      className={`flex-none ${stripCardWidthClass} rounded-xl border shadow-sm overflow-hidden`}
                      style={{
                        backgroundColor: it.rel === 'ISPARTA' ? '#ffe4e6' : '#ffedd5',
                        borderColor: 'rgba(0,0,0,0.12)'
                      }}
                    >
                      <div className="p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center px-2 py-1 text-[11px] font-extrabold rounded-md uppercase"
                              style={{
                                backgroundColor: it.rel === 'ISPARTA' ? '#be123c' : '#c2410c',
                                color: '#fff'
                              }}
                            >
                              {it.rel}
                            </span>

                            <span className="text-xs text-slate-700 font-semibold">{getTimeAgo(it.eq.date_time)}</span>
                          </div>

                          <div className="mt-1 text-sm font-extrabold text-slate-900 break-words line-clamp-2">
                            {it.eq.title}
                          </div>

                          <div className="text-xs text-slate-700 mt-1">
                            <span className="font-mono font-bold">{Math.round(it.distance)} km</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-3xl font-black leading-none text-slate-900">
                            {it.eq.mag.toFixed(1)}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-700">Mw/ML</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            B) ÜST PANEL (Başlık + Bildirim + Sağ sayaç)
           ===================================================== */}
        <div
          className={['text-white p-5 rounded-xl shadow-lg', SECTION_GAP].join(' ')}
          style={{ background: 'linear-gradient(to right, #0f172a, #1e3a8a)' }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            {/* Sol */}
            <div className="min-w-0">
              <h1 className="text-white text-3xl font-bold flex items-center gap-3">
                <Activity size={34} className="animate-pulse" />
                Deprem Takibi
              </h1>

              <p className="text-white/80 text-sm mt-1">
                AFAD verisi • Isparta odaklı • Saat: <span className="font-semibold">TS (Europe/Istanbul)</span>
              </p>

              <p className="text-white/75 text-xs mt-1">
                Bildirim açıksa: deprem şiddeti kadar tık sesi (Isparta/Yakın ise önce uzun uyarı).
              </p>
            </div>

            {/* Orta */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-extrabold text-white/80 uppercase tracking-wide">Bildirim</div>
              <NotificationToggle enabled={notificationsEnabled} onToggle={() => setNotificationsEnabled((v) => !v)} />
            </div>

            {/* Sağ */}
            <div className="flex justify-start md:justify-end md:justify-self-end">
              <div className="bg-white/10 border border-white/15 rounded-lg px-3 py-2 flex items-center gap-3">
                <div className="flex items-center justify-center h-[30px] w-[30px]">
                  {loading ? (
                    <RefreshCw size={22} className="animate-spin" />
                  ) : (
                    <CountdownTimer duration={30000} resetKey={lastUpdated} size={28} />
                  )}
                </div>

                <div className="leading-tight text-left md:text-right">
                  <div className="flex items-center gap-1 text-sm text-white/90 md:justify-end">
                    <Clock size={14} />
                    {formatTimeIstanbul(lastUpdated)}
                  </div>
                  <div className="text-xs text-white/70">Son 7 günde {earthquakes.length} deprem</div>
                </div>
              </div>
            </div>
          </div>

          {/* Max kartlar */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {renderMaxCard('Son 24 saatte en büyük deprem', max24h)}
            {renderMaxCard('Son 7 günün en büyük depremi', max7d)}
          </div>
        </div>

        {/* =====================================================
            C) Hata
           ===================================================== */}
        {error && (
          <div className={['bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow', SECTION_GAP].join(' ')}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
              <div>
                <p className="text-red-700 font-semibold mb-1">Veri Yükleme Hatası</p>
                <p className="text-red-600 text-sm">{error}</p>

                <button
                  onClick={() => fetchData()}
                  className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            D) Şiddet barı
           ===================================================== */}
        <SeverityBar />

        {/* =====================================================
            E) MOBİL KARO
           ===================================================== */}
        {!isDesktop && (
          <div className={SECTION_GAP}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MapPin size={18} />
                Son Depremler
              </h2>
            </div>

            {/* Mobil sıralama: 3 buton, tam satır */}
            <div className="flex w-full gap-2 mb-3">
              {[
                { key: 'newest', label: 'En Yeni' },
                { key: 'largest', label: 'En Büyük' },
                { key: 'nearest', label: 'En Yakın' }
              ].map((b) => {
                const active = mobileSort === (b.key as any);
                return (
                  <button
                    key={b.key}
                    onClick={() => setMobileSort(b.key as any)}
                    className={[
                      'flex-1 px-3 py-2 rounded-xl text-sm font-extrabold border shadow-sm',
                      active ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-800 border-gray-200 hover:bg-gray-50'
                    ].join(' ')}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>

            {loading && earthquakes.length === 0 ? (
              <div className="bg-white rounded-xl border shadow-sm p-6 text-center">
                <RefreshCw className="animate-spin mx-auto mb-3 text-gray-400" size={28} />
                <p className="text-gray-500">Veriler yükleniyor...</p>
              </div>
            ) : earthquakes.length === 0 ? (
              <div className="bg-white rounded-xl border shadow-sm p-6 text-center text-gray-500">
                <AlertTriangle className="mx-auto mb-3 text-gray-300" size={28} />
                <p>Kayıt bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mobileSorted.slice(0, showHistory ? mobileSorted.length : 50).map((eq) => {
                  const distance = distanceMap.get(eq.earthquake_id) ?? 999999;
                  const rel = getRelation(eq.title, distance);
                  const recent = isRecent(eq.date_time);
                  const isOpen = openMobileId === eq.earthquake_id;

                  const bg = getSeverityColor(eq.mag);

                  const lat = eq.geojson.coordinates[1];
                  const lon = eq.geojson.coordinates[0];
                  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=10/${lat}/${lon}`;

                  return (
                    <div
                      key={eq.earthquake_id}
                      className="rounded-xl border shadow-sm overflow-hidden bg-white"
                      style={{ borderColor: 'rgba(0,0,0,0.12)' }}
                    >
                      {/* Ön yüz */}
                      <button
                        type="button"
                        onClick={() => setOpenMobileId(isOpen ? null : eq.earthquake_id)}
                        className="w-full text-left p-4 flex items-start justify-between gap-3"
                        style={{ backgroundColor: bg }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {rel && (
                              <span
                                className="inline-flex items-center px-2 py-1 text-[11px] font-extrabold rounded-md uppercase tracking-wide border"
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
                              <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-900 text-xs font-bold rounded uppercase shadow-sm border border-blue-300">
                                <Zap size={12} className="mr-1" />
                                YENİ
                              </span>
                            )}
                          </div>

                          <div className="mt-1 text-sm font-extrabold text-slate-900 truncate">{eq.title}</div>

                          <div className="mt-1 text-xs text-slate-700 flex items-center gap-1">
                            <Clock size={12} />
                            {getTimeAgo(eq.date_time)}
                          </div>
                        </div>

                        {/* büyüklük */}
                        <div className="shrink-0 text-right">
                          <div className="text-4xl font-black leading-none text-slate-900">{eq.mag.toFixed(1)}</div>
                          <div className="text-[11px] font-semibold text-slate-700">Mw / ML</div>
                        </div>
                      </button>

                      {/* detay */}
                      {isOpen && (
                        <div className="p-4 bg-white border-t">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-xs text-gray-500">Isparta Uzaklık</div>
                              <div className="font-mono font-semibold">{Math.round(distance)} km</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Derinlik</div>
                              <div className="font-mono font-semibold">{eq.depth.toFixed(1)} km</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-xs text-gray-500">Tarih / Saat (TS)</div>
                              <div className="font-semibold">{formatDateIstanbul(eq.date_time)}</div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${getMagnitudeBadgeStyle(eq.mag)}`}>
                              {eq.mag.toFixed(1)}
                            </span>

                            <a
                              href={osmUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold underline text-blue-700"
                            >
                              <Navigation size={16} />
                              Harita
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!showHistory && mobileSorted.length > 50 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-md transition-all"
                    style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' }}
                  >
                    <ChevronDown size={20} />
                    Daha Fazla Göster ({mobileSorted.length - 50} kayıt daha)
                  </button>
                )}

                {showHistory && <div className="text-center text-gray-600 italic text-sm">Tüm kayıtlar gösteriliyor.</div>}
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            F) DESKTOP TABLO (H2 kaldırıldı)
           ===================================================== */}
        {isDesktop && (
          <div className={SECTION_GAP}>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
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
                      displayedEarthquakes.map((eq) => {
                        const distance = distanceMap.get(eq.earthquake_id) ?? 999999;
                        const rel = getRelation(eq.title, distance);
                        const recent = isRecent(eq.date_time);

                        const rowColor = getSeverityColor(eq.mag);

                        let rowClasses = 'transition-all duration-150 border-l-4';
                        if (recent) rowClasses += ' border-l-blue-600 animate-pulse';
                        else if (rel === 'ISPARTA') rowClasses += ' border-l-rose-600';
                        else if (rel === 'YAKIN') rowClasses += ' border-l-orange-500';
                        else rowClasses += ' border-l-slate-300';

                        return (
                          <tr key={eq.earthquake_id} className={rowClasses} style={{ backgroundColor: rowColor }}>
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
                              {eq.depth.toFixed(1)}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-300">
                              {formatDateIstanbul(eq.date_time)}
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
          </div>
        )}

        {/* =====================================================
            Footer
           ===================================================== */}
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
          <p className="text-sm text-blue-800">
            <strong>Not:</strong> Kaynak: AFAD Event Service.
            <br />
            <span className="font-bold">Son 1 saat</span> içindeki depremler <span className="font-bold">“YENİ”</span> etiketi ile belirtilir.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
