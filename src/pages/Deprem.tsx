/**
 * Deprem.tsx — Final (Tek Dosya / Çok Açıklamalı)
 * ============================================================
 * BU SÜRÜMDE NELER VAR?
 * ------------------------------------------------------------
 * ✅ Zaman normalizasyonu: timezone yoksa "Z" eklemiyoruz (3 saat geri kalma biter)
 * ✅ Üstte Isparta/Yakın depremler "ŞERİT" (yatay) — en yeni solda
 *    - 1 tane varsa: tek kart tüm genişlik
 *    - 2-3: yan yana / kaydırmalı
 *    - 4+: oklarla sağ-sol kaydırma
 * ✅ Üst şerit (alarm) navbar'a daha yakın; altındaki panel ile aralık dengeli
 * ✅ Üst panel: “Deprem Takibi” başlığı yukarıda (sayfanın deprem sayfası olduğu net)
 *    - Ortada Bildirim toggle (teşvik edici ama abartısız)
 *    - Sağda countdown + saat + 7gün deprem sayısı
 * ✅ Bildirim açılınca kısa bilgi yazısı (üst üste binmez, flow içinde)
 *    - Fade-in + fade-out (CSS’te animate-fade-in/out)
 * ✅ Şiddet renk barı tablonun üstünde (tablo renklerini anlatıyor)
 * ✅ En büyük deprem kartları şiddet rengiyle uyumlu
 * ✅ Desktop: tablo (thead sticky)
 * ✅ Mobil: şık “karo” listesi + tek kart açılır (accordion)
 *    - kartta: Yer + kaç dk önce + Büyüklük (büyüklük belirgin)
 *    - tıklayınca: uzaklık/derinlik/tarih/harita vb açılır
 *
 * NOTLAR
 * ------------------------------------------------------------
 * - localStorage YOK (storage engelli tarayıcılara uygun)
 * - timezone gösterimi: Europe/Istanbul
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
   1) TIPLER
   ============================================================ */

interface Earthquake {
  earthquake_id: string;
  title: string;
  mag: number;
  depth: number;
  date_time: string; // ISO-ish string (timezone yoksa da "local" kabul edeceğiz)
  geojson: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
}

type SortKey = 'date_time' | 'mag' | 'distance';
type SortDirection = 'asc' | 'desc';
type Relation = 'ISPARTA' | 'YAKIN' | null;

/* ============================================================
   2) SABİTLER / TEK YERDEN KONTROL
   ============================================================ */

/**
 * Sayfadaki ana bloklar arası boşluk:
 * - banner şeridi
 * - üst panel
 * - hata
 * - renk barı
 * - tablo/kart listesi
 *
 * "hepsi birleşti / çok açıldı" gibi durumlarda tek yerden kontrol.
 */
const SECTION_GAP = 'mb-5';

/**
 * Üst sabit header yüzünden içerik aşağı iniyorsa,
 * sayfa içinde yukarı çekmek için.
 *
 * Fazla çekiyorsa -mt-4 / -mt-3 yap.
 */
const PAGE_TOP_PULL = '-mt-6';

/**
 * AFAD proxy
 */
const AFAD_PROXY = 'https://depremo.tutkumuz.workers.dev';

/**
 * Isparta merkez
 */
const ISPARTA_COORDS = { lat: 37.7648, lng: 30.5567 };

/**
 * Yakın sayılma eşiği (km)
 */
const NEAR_KM = 100;

/**
 * Banner şeridi (üst alarm) kartlarının "çok eskiyse kırmızılığı yumuşat"
 */
const ALERT_FRESH_HOURS = 12;

/**
 * İstanbul TZ
 */
const IST_TZ = 'Europe/Istanbul';

/* ============================================================
   3) KÜÇÜK UI: COUNTDOWN
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
   4) BİLDİRİM TOGGLE (Ses yerine Bildirim)
   ============================================================ */

function NotificationToggle({
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
      className={[
        'group inline-flex items-center gap-3 select-none shrink-0 rounded-full px-3 py-2',
        'border backdrop-blur-sm shadow-sm active:scale-[0.98]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        'whitespace-nowrap',
        enabled
          ? 'bg-green-500/20 border-green-300/40 ring-2 ring-green-300/40'
          : 'bg-white/10 border-white/15 hover:bg-white/15'
      ].join(' ')}
      title={enabled ? 'Bildirim Açık' : 'Bildirim Kapalı'}
    >
      {/* Switch gövdesi */}
      <span
        className={[
          'relative inline-flex h-7 w-[46px] items-center rounded-full transition-colors',
          enabled ? 'bg-green-500' : 'bg-white/25'
        ].join(' ')}
        style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35)' }}
      >
        {/* Switch topu */}
        <span
          className={[
            'inline-block h-6 w-6 rounded-full bg-white transition-transform',
            enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
          ].join(' ')}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
        />
      </span>

      {/* ikon */}
      <span className="text-white/90">
        {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </span>

      {/* yazı */}
      <span className="font-extrabold text-sm text-white">
        {enabled ? 'Bildirim Açık' : 'Bildirim Kapalı'}
      </span>

      {/* küçük teşvik metni (abartmadan) */}
      <span className="hidden sm:inline text-xs text-white/70 group-hover:text-white/80 transition">
        {enabled ? '• tık uyarısı aktif' : '• açarsan uyarı veririm'}
      </span>
    </button>
  );
}

/* ============================================================
   5) YARDIMCI: ZAMAN / MESAFE / RENK
   ============================================================ */

/**
 * KRİTİK:
 * - timezone yoksa "Z" eklemek 3 saat kaydırıyordu.
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

const getTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (totalMinutes < 60) return `${totalMinutes} dk önce`;
  if (totalMinutes < 120) return minutes <= 0 ? `${hours} saat önce` : `${hours} saat ${minutes} dk önce`;
  return `${hours} saat önce`;
};

const isRecent = (dateStr: string) => Date.now() - new Date(dateStr).getTime() < 60 * 60 * 1000;

// Haversine
const deg2rad = (deg: number) => deg * (Math.PI / 180);

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getRelation = (title: string, distanceKm: number): Relation => {
  const t = title.toLocaleLowerCase('tr-TR');
  if (t.includes('isparta') || t.includes('ısparta')) return 'ISPARTA';
  if (distanceKm < NEAR_KM) return 'YAKIN';
  return null;
};

/**
 * Şiddet rengi (tek kaynak):
 * - tablo satır arka planı
 * - max kart arka planı
 * - şiddet bar
 */
const getSeverityColor = (mag: number) => {
  if (mag >= 6) return '#fecaca'; // red-200
  if (mag >= 5) return '#fee2e2'; // red-100
  if (mag >= 4) return '#ffedd5'; // orange-100
  if (mag >= 3) return '#fef9c3'; // yellow-100
  return '#dcfce7'; // green-100
};

const getMagnitudeBadgeStyle = (mag: number) => {
  if (mag >= 6) return 'bg-red-100 text-red-900 border border-red-300 ring-2 ring-red-500';
  if (mag >= 5) return 'bg-red-100 text-red-800 border border-red-200 ring-1 ring-red-400';
  if (mag >= 4) return 'bg-orange-100 text-orange-800 border border-orange-200';
  if (mag >= 3) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return 'bg-green-100 text-green-800 border border-green-200';
};

/* ============================================================
   6) ANA SAYFA
   ============================================================ */

export function Deprem() {
  /* ------------------------------
     6.1 State
     ------------------------------ */

  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // tablo tarafı (desktop)
  const [showHistory, setShowHistory] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'date_time',
    direction: 'desc'
  });

  // mobil karo (accordion): tek kart açık
  const [openMobileId, setOpenMobileId] = useState<string | null>(null);

  // “Bildirim açıldı” yazısı: show -> hide -> hidden (fade-out için)
  const [notifyHintPhase, setNotifyHintPhase] = useState<'hidden' | 'show' | 'hide'>('hidden');
  const notifyHintTimers = useRef<number[]>([]);

  /* ------------------------------
     6.2 Ref (render tetiklemesin)
     ------------------------------ */

  // yeni deprem tespiti: ID bazlı set
  const seenIdsRef = useRef<Set<string>>(new Set());

  // audio context tek instance
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ses kuyruğu + kilit
  const soundQueue = useRef<Earthquake[]>([]);
  const isPlaying = useRef(false);

  // üst alarm şeridi scroll için
  const alertStripRef = useRef<HTMLDivElement | null>(null);

  /* ============================================================
     7) AUDIO (Bildirim tık sesi)
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

  const playBeep = async (frequency: number, duration: number, gainLevel = 0.1) => {
    if (!notificationsEnabled) return;

    try {
      const audioCtx = await ensureAudio();
      if (!audioCtx) return;

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(gainLevel, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // ISPARTA/YAKIN preamble: 1 uzun tık
  const playNearPreamble = async () => {
    if (!notificationsEnabled) return;
    await playBeep(440, 0.55, 0.11);
    await sleep(650);
  };

  // mag kadar tık (floor)
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

  // bildirim kapanınca temizle
  useEffect(() => {
    if (!notificationsEnabled) {
      soundQueue.current = [];
      isPlaying.current = false;
    }
  }, [notificationsEnabled]);

  // unmount: audio kapat
  useEffect(() => {
    return () => {
      try {
        audioCtxRef.current?.close?.();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;

      // olası timer temizliği
      notifyHintTimers.current.forEach((t) => window.clearTimeout(t));
      notifyHintTimers.current = [];
    };
  }, []);

  /* ============================================================
     8) NOTIFY HINT (fade-in/out)
     ============================================================ */

  const showNotifyHintOnce = () => {
    // Önce eski timer’ları temizle (üst üste binmesin)
    notifyHintTimers.current.forEach((t) => window.clearTimeout(t));
    notifyHintTimers.current = [];

    // 1) göster
    setNotifyHintPhase('show');

    // 2) 3 saniye sonra hide animasyonu
    notifyHintTimers.current.push(
      window.setTimeout(() => setNotifyHintPhase('hide'), 2800)
    );

    // 3) kısa süre sonra tamamen kaldır
    notifyHintTimers.current.push(
      window.setTimeout(() => setNotifyHintPhase('hidden'), 3300)
    );
  };

  // Bildirim açılınca hint göster
  useEffect(() => {
    if (notificationsEnabled) showNotifyHintOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsEnabled]);

  /* ============================================================
     9) AFAD RAW -> Earthquake[]
     ============================================================ */

  const mapAfadToEarthquakes = (raw: any): Earthquake[] => {
    const out: Earthquake[] = [];

    const pushOne = (id: any, title: any, mag: any, depth: any, date: any, lon: any, lat: any) => {
      const lngNum = Number(lon);
      const latNum = Number(lat);
      const magNum = Number(mag);
      const depthNum = Number(depth);

      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || !Number.isFinite(magNum)) return;

      const dt = normalizeDateString(date);

      out.push({
        earthquake_id: String(id ?? `${dt}_${magNum}_${lngNum}_${latNum}`),
        title: String(title ?? 'Bilinmeyen Konum'),
        mag: magNum,
        depth: Number.isFinite(depthNum) ? depthNum : 0,
        date_time: dt,
        geojson: { type: 'Point', coordinates: [lngNum, latNum] }
      });
    };

    // GeoJSON features
    if (raw?.features && Array.isArray(raw.features)) {
      for (const f of raw.features) {
        const p = f?.properties ?? {};
        const g = f?.geometry ?? {};
        const coords = Array.isArray(g.coordinates) ? g.coordinates : [];

        const lon = coords[0];
        const lat = coords[1];
        const depthFromCoord = coords.length >= 3 ? coords[2] : undefined;

        pushOne(
          p.eventID ?? p.eventId ?? p.id,
          p.location ?? p.place ?? p.title ?? p.name,
          p.magnitude ?? p.mag ?? p.ml ?? p.MAG,
          p.depth ?? p.Depth ?? depthFromCoord,
          p.date ?? p.time ?? p.datetime,
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
          e?.eventID ?? e?.eventId ?? e?.id,
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
     10) FETCH (30sn)
     ============================================================ */

  const fetchData = async (distanceMapForSound?: Map<string, number>) => {
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

      // dedupe
      const uniqueMap = new Map<string, Earthquake>();
      for (const eq of mapped) uniqueMap.set(eq.earthquake_id, eq);
      const list = Array.from(uniqueMap.values());

      // newest first (GENEL LİSTE)
      list.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

      // yeni deprem tespiti (ID bazlı)
      const newOnes: Earthquake[] = [];
      for (const eq of list) {
        if (!seenIdsRef.current.has(eq.earthquake_id)) {
          seenIdsRef.current.add(eq.earthquake_id);
          newOnes.push(eq);
        }
      }

      setEarthquakes(list);

      // bildirim açıksa: yeni gelenleri kuyruğa ekle
      if (notificationsEnabled && newOnes.length > 0) {
        newOnes.forEach((eq) => soundQueue.current.push(eq));
        if (distanceMapForSound) processSoundQueue(distanceMapForSound);
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

  // interval: 1 kere kur
  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
     11) MEMO: distance map + sorted list + üst şerit listesi
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

  // tablo sıralaması (desktop)
  const sortedEarthquakes = useMemo(() => {
    const list = [...earthquakes];

    list.sort((a, b) => {
      if (sortConfig.key === 'mag') {
        return sortConfig.direction === 'asc' ? a.mag - b.mag : b.mag - a.mag;
      }
      if (sortConfig.key === 'distance') {
        const distA = distanceMap.get(a.earthquake_id) ?? 0;
        const distB = distanceMap.get(b.earthquake_id) ?? 0;
        return sortConfig.direction === 'asc' ? distA - distB : distB - distA;
      }
      // date
      const ta = new Date(a.date_time).getTime();
      const tb = new Date(b.date_time).getTime();
      return sortConfig.direction === 'asc' ? ta - tb : tb - ta;
    });

    return list;
  }, [earthquakes, sortConfig, distanceMap]);

  const displayedEarthquakes = showHistory ? sortedEarthquakes : sortedEarthquakes.slice(0, 50);

  /**
   * ÜST ALARM ŞERİDİ:
   * - sadece ISPARTA/YAKIN olanlar
   * - en yeni solda (istenen)
   */
  const alertEarthquakes = useMemo(() => {
    const list = earthquakes
      .map((eq) => {
        const distance = distanceMap.get(eq.earthquake_id) ?? 999999;
        const rel = getRelation(eq.title, distance);
        return { eq, rel, distance };
      })
      .filter((x) => x.rel !== null);

    list.sort((a, b) => new Date(b.eq.date_time).getTime() - new Date(a.eq.date_time).getTime());
    return list;
  }, [earthquakes, distanceMap]);

  /**
   * Üst şerit “tazelik” — ilk kart çok eskiyse kırmızıyı yumuşat
   */
  const alertIsFresh = useMemo(() => {
    if (alertEarthquakes.length === 0) return true;
    const hours = (Date.now() - new Date(alertEarthquakes[0].eq.date_time).getTime()) / (1000 * 60 * 60);
    return hours < ALERT_FRESH_HOURS;
  }, [alertEarthquakes]);

  /* ============================================================
     12) En büyük depremler (24h / 7d)
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

  /* ============================================================
     13) UI yardımcıları: Sort, Scroll, Kartlar
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

  const scrollAlertStrip = (dir: 'left' | 'right') => {
    const el = alertStripRef.current;
    if (!el) return;
    const amount = 320; // “bir kart kadar” kaydırma hissi
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  /**
   * Max kart (şiddet rengi ile uyumlu)
   */
  const renderMaxCard = (title: string, eq: Earthquake | null) => {
    if (!eq) {
      return (
        <div className="rounded-lg p-3 border shadow-sm bg-white/10 border-white/20 text-white">
          <div className="text-xs font-extrabold">{title}</div>
          <div className="text-xs mt-1 text-white/80">Veri yok</div>
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
            <span className="font-mono">Isparta: {Math.round(distance)} km</span>
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline flex items-center gap-1"
              style={{ color: '#1d4ed8' }}
              title="OpenStreetMap'te aç"
            >
              <Navigation size={14} />
              Harita
            </a>
          </div>

          <div className="text-[11px] mt-1 text-right" style={{ color: '#334155' }}>
            {formatDateIstanbul(eq.date_time)}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Şiddet bar (tablonun üstünde)
   */
  const renderSeverityBar = () => {
    const items = [
      { label: '<3 düşük', bg: getSeverityColor(2.9), fg: '#14532d' },
      { label: '3–3.9 orta', bg: getSeverityColor(3.2), fg: '#713f12' },
      { label: '4–4.9 belirgin', bg: getSeverityColor(4.2), fg: '#7c2d12' },
      { label: '5–5.9 güçlü', bg: getSeverityColor(5.2), fg: '#7f1d1d' },
      { label: '6+ çok güçlü', bg: getSeverityColor(6.2), fg: '#7f1d1d' }
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
  };

  /* ============================================================
     14) RENDER
     ============================================================ */

  return (
    <PageContainer>
      {/* PageContainer üst padding etkisini sayfa içinde telafi */}
      <div className={PAGE_TOP_PULL}>
        {/* =====================================================
            A) ÜST ALARM ŞERİDİ (ISPARTA/YAKIN)
            - navbar'a yaklaşsın
            - 1 tane ise tam genişlik
            - 4+ ise oklar
           ===================================================== */}
        {alertEarthquakes.length > 0 && (
          <div className={['mt-1', SECTION_GAP].join(' ')}>
            {/* Şerit üst satırı: küçük başlık + oklar */}
            <div className="flex items-center justify-between mb-2">
              <div
                className="text-xs font-extrabold uppercase tracking-wide"
                style={{ color: alertIsFresh ? '#b91c1c' : '#92400e' }}
              >
                Isparta / Yakın Depremler
              </div>

              {/* 4+ ise oklar göster */}
              {alertEarthquakes.length >= 4 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollAlertStrip('left')}
                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm"
                    title="Sola"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollAlertStrip('right')}
                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 shadow-sm"
                    title="Sağa"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Şerit içerik: horizontal scroll */}
            <div
              ref={alertStripRef}
              className={[
                'flex gap-3 overflow-x-auto scroll-smooth',
                'pb-1', // scrollbar nefesi
                'snap-x snap-mandatory'
              ].join(' ')}
            >
              {alertEarthquakes.map(({ eq, rel, distance }) => {
                // kart görsel tonu (ISPARTA kırmızı, YAKIN turuncu ama pastel)
                const baseBg = rel === 'ISPARTA' ? '#ffe4e6' : '#ffedd5';
                const strongBg = rel === 'ISPARTA' ? '#ef4444' : '#f97316';

                // tek kart varsa full
                const isSingle = alertEarthquakes.length === 1;

                return (
                  <div
                    key={eq.earthquake_id}
                    className={[
                      'snap-start',
                      'rounded-xl border shadow-sm overflow-hidden',
                      isSingle ? 'w-full' : 'min-w-[280px] sm:min-w-[320px]',
                    ].join(' ')}
                    style={{ backgroundColor: baseBg, borderColor: 'rgba(0,0,0,0.12)' }}
                  >
                    <div className="p-3">
                      {/* üst satır: badge + timeago */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center px-2 py-1 text-[11px] font-extrabold rounded-md uppercase tracking-wide border"
                          style={{
                            backgroundColor: strongBg,
                            color: '#fff',
                            borderColor: 'rgba(0,0,0,0.12)',
                            textShadow: '0 1px 1px rgba(0,0,0,0.35)'
                          }}
                        >
                          {rel}
                        </span>

                        <span className="text-xs font-semibold text-slate-700">
                          {getTimeAgo(eq.date_time)}
                        </span>
                      </div>

                      {/* ana satır: yer + mag */}
                      <div className="mt-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-slate-900 break-words">
                            {eq.title}
                          </div>
                          <div className="text-[11px] text-slate-700 mt-1 font-mono">
                            Isparta: {Math.round(distance)} km • {formatDateIstanbul(eq.date_time)}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end">
                          {/* büyüklük belirgin */}
                          <div
                            className="text-3xl font-black leading-none"
                            style={{ color: '#0f172a' }}
                          >
                            {eq.mag.toFixed(1)}
                          </div>
                          <div className="text-[11px] text-slate-700 font-semibold">
                            Mw / ML
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================
            B) ÜST PANEL (Sayfa başlığı burada!)
            - “Deprem Takibi” + kısa açıklama
            - Ortada Bildirim
            - Sağda countdown + saat + 7gün sayısı
           ===================================================== */}
        <div
          className={['text-white p-5 rounded-xl shadow-lg', SECTION_GAP].join(' ')}
          style={{ background: 'linear-gradient(to right, #0f172a, #1e3a8a)' }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
            {/* SOL: “Deprem sayfası” başlığı yukarı taşındı */}
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

            {/* ORTA: toggle + (flow içinde) açıklama */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-extrabold text-white/80 uppercase tracking-wide">
                Bildirim
              </div>

              <NotificationToggle
                enabled={notificationsEnabled}
                onToggle={() => setNotificationsEnabled((v) => !v)}
              />

              {/* Üst üste binmesin: absolute yok, flow içinde */}
              {notifyHintPhase !== 'hidden' && (
                <div
                  className={[
                    'px-3 py-1.5 rounded-md text-xs font-semibold',
                    'bg-black/70 text-white shadow border border-white/10',
                    notifyHintPhase === 'show' ? 'animate-fade-in' : 'animate-fade-out'
                  ].join(' ')}
                >
                  🔔 Bildirim açık — yeni depremler sesle bildirilecek
                </div>
              )}
            </div>

            {/* SAĞ: countdown + saat + sayım */}
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

                  <div className="text-xs text-white/70">
                    Son 7 günde {earthquakes.length} deprem
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* max kartlar */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {renderMaxCard('Son 24 saatte en büyük deprem', max24h)}
            {renderMaxCard('Son 7 günün en büyük depremi', max7d)}
          </div>
        </div>

        {/* =====================================================
            C) HATA
           ===================================================== */}
        {error && (
          <div className={['bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow', SECTION_GAP].join(' ')}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
              <div>
                <p className="text-red-700 font-semibold mb-1">Veri Yükleme Hatası</p>
                <p className="text-red-600 text-sm">{error}</p>

                <button
                  onClick={() => fetchData(distanceMap)}
                  className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            D) ŞİDDET BAR (Tablo/Karo üstü)
           ===================================================== */}
        {renderSeverityBar()}

        {/* =====================================================
            E) MOBİL KARO SİSTEMİ (md altı)
            - kartta: yer + timeago + büyük mag
            - tıklayınca: detay açılır
            - tek kart açık (accordion)
           ===================================================== */}
        <div className={['md:hidden', SECTION_GAP].join(' ')}>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin size={18} />
            Son Depremler
          </h2>

          {/* Loading / Empty */}
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
              {sortedEarthquakes.slice(0, showHistory ? sortedEarthquakes.length : 50).map((eq) => {
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
                    {/* KART ÖN YÜZÜ (tıklanabilir) */}
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

                        {/* Yer (kısa, tek satır) */}
                        <div className="mt-1 text-sm font-extrabold text-slate-900 truncate">
                          {eq.title}
                        </div>

                        {/* Kaç dk önce */}
                        <div className="mt-1 text-xs text-slate-700 flex items-center gap-1">
                          <Clock size={12} />
                          {getTimeAgo(eq.date_time)}
                        </div>
                      </div>

                      {/* BÜYÜKLÜK (çok belirgin) */}
                      <div className="shrink-0 text-right">
                        <div className="text-4xl font-black leading-none text-slate-900">
                          {eq.mag.toFixed(1)}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700">
                          Mw / ML
                        </div>
                      </div>
                    </button>

                    {/* AÇILAN DETAY (accordion) */}
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
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${getMagnitudeBadgeStyle(eq.mag)}`}
                          >
                            {eq.mag.toFixed(1)}
                          </span>

                          <a
                            href={osmUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold underline text-blue-700"
                            title="OpenStreetMap'te aç"
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

              {/* Mobilde “Daha fazla göster” */}
              {!showHistory && sortedEarthquakes.length > 50 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-md transition-all"
                  style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold' }}
                >
                  <ChevronDown size={20} />
                  Daha Fazla Göster ({sortedEarthquakes.length - 50} kayıt daha)
                </button>
              )}

              {showHistory && (
                <div className="text-center text-gray-600 italic text-sm">
                  Tüm kayıtlar gösteriliyor.
                </div>
              )}
            </div>
          )}
        </div>

        {/* =====================================================
            F) DESKTOP TABLO (md ve üstü)
           ===================================================== */}
        <div className="hidden md:block">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin size={18} />
            Son Depremler Listesi
          </h2>

          <div className={['bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200', SECTION_GAP].join(' ')}>
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
                    displayedEarthquakes.map((eq, idx) => {
                      const distance = distanceMap.get(eq.earthquake_id) ?? 999999;
                      const rel = getRelation(eq.title, distance);
                      const recent = isRecent(eq.date_time);

                      const rowColor = getSeverityColor(eq.mag);

                      // modern: yeni ise mavi accent + hafif pulse; değilse relation accent
                      let rowClasses = 'transition-all duration-150 border-l-4';
                      if (recent) rowClasses += ' border-l-blue-600 animate-pulse';
                      else if (rel === 'ISPARTA') rowClasses += ' border-l-rose-600';
                      else if (rel === 'YAKIN') rowClasses += ' border-l-orange-500';
                      else rowClasses += ' border-l-slate-300';

                      return (
                        <tr key={eq.earthquake_id || idx} className={rowClasses} style={{ backgroundColor: rowColor }}>
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
                                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-900 text-xs font-bold rounded uppercase mt-0.5 shadow-sm border border-blue-300">
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

            {/* Daha fazla göster */}
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

        {/* =====================================================
            FOOTER
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

/* ============================================================
   CSS NOTU (ÖNEMLİ)
   ------------------------------------------------------------
   Bu dosyada animate-fade-in / animate-fade-out class'ları kullanıldı.
   src/index.css dosyanın en altına şunu ekle:

   @keyframes fade-in { from { opacity:0; transform: translateY(-4px);} to {opacity:1; transform: translateY(0);} }
   .animate-fade-in { animation: fade-in 180ms ease-out; }

   @keyframes fade-out { from { opacity:1; transform: translateY(0);} to {opacity:0; transform: translateY(-4px);} }
   .animate-fade-out { animation: fade-out 220ms ease-in; }
   ============================================================ */
