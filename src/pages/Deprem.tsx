/**
 * Deprem.tsx
 * ============================================================
 * AMAÇ
 * ------------------------------------------------------------
 * - AFAD Event Service verisini (Cloudflare Worker proxy) çekmek
 * - Isparta merkezine göre uzaklık hesaplamak
 * - ISPARTA / YAKIN etiketleri
 * - 30 sn otomatik yenileme
 * - Bildirim (ses) sistemi:
 *    - Bildirim AÇIK ise:
 *       - Normal deprem: şiddet kadar kısa "tık"
 *       - ISPARTA / YAKIN: 1 uzun + şiddet kadar kısa "tık"
 * - Üst pano sade, 3 sütun
 * - Şiddet renk skalası tablo ÜSTÜNDE
 * - En büyük deprem kartları şiddet rengiyle uyumlu
 *
 * ÖNEMLİ ZAMAN NOTU
 * ------------------------------------------------------------
 * AFAD saatleri LOCAL (Türkiye saati) kabul edilir.
 * ❌ UTC'ye zorlanmaz
 * ❌ 'Z' EKLENMEZ
 * Böylece 3 saat geri / ileri kayma olmaz.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  AlertOctagon,
  Clock,
  MapPin,
  Navigation,
  Zap,
  Volume2,
  VolumeX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

/* ============================================================
   1) TİPLER
   ============================================================ */

interface Earthquake {
  earthquake_id: string;
  title: string;
  mag: number;
  depth: number;
  date_time: string;
  geojson: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

type SortKey = 'date_time' | 'mag' | 'distance';
type SortDirection = 'asc' | 'desc';

type Relation = 'ISPARTA' | 'YAKIN' | null;

/* ============================================================
   2) SABİTLER
   ============================================================ */

const ISPARTA_COORDS = { lat: 37.7648, lng: 30.5567 };
const NEAR_KM = 100;
const IST_TZ = 'Europe/Istanbul';
const AFAD_PROXY = 'https://depremo.tutkumuz.workers.dev';

/* ============================================================
   3) YARDIMCI FONKSİYONLAR
   ============================================================ */

/**
 * AFAD saatlerini LOCAL kabul ediyoruz.
 * Z eklenmez → 3 saat kayma yok.
 */
const normalizeDateString = (s: any): string => {
  if (!s) return '';
  let str = String(s).trim();
  if (str.includes(' ') && !str.includes('T')) {
    str = str.replace(' ', 'T');
  }
  return str;
};

/** Istanbul saatinde tarih */
const formatDateIstanbul = (dateStr: string) =>
  new Intl.DateTimeFormat('tr-TR', {
    timeZone: IST_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateStr));

/** Istanbul saatinde sadece saat */
const formatTimeIstanbul = (d: Date) =>
  new Intl.DateTimeFormat('tr-TR', {
    timeZone: IST_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d);

/** Ne kadar önce */
const getTimeAgo = (dateStr: string) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  const h = Math.floor(min / 60);
  if (min < 60) return `${min} dk önce`;
  if (h < 2) return `${h} saat ${min % 60} dk önce`;
  return `${h} saat önce`;
};

/** Son 1 saat mi? */
const isRecent = (dateStr: string) =>
  Date.now() - new Date(dateStr).getTime() < 60 * 60 * 1000;

/** Haversine */
const deg2rad = (d: number) => d * (Math.PI / 180);
const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** ISPARTA / YAKIN tespiti */
const getRelation = (title: string, distance: number): Relation => {
  const t = title.toLocaleLowerCase('tr-TR');
  if (t.includes('isparta') || t.includes('ısparta')) return 'ISPARTA';
  if (distance < NEAR_KM) return 'YAKIN';
  return null;
};

/** Şiddete göre TEK renk kaynağı */
const getSeverityColor = (mag: number) => {
  if (mag >= 6) return '#fecaca';
  if (mag >= 5) return '#fee2e2';
  if (mag >= 4) return '#ffedd5';
  if (mag >= 3) return '#fef9c3';
  return '#dcfce7';
};

/* ============================================================
   4) ANA BİLEŞEN
   ============================================================ */

export function Deprem() {
  /* ---------------- STATE ---------------- */
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({ key: 'date_time', direction: 'desc' });

  /* ---------------- REF’LER ---------------- */

  /** Tek AudioContext */
  const audioCtxRef = useRef<AudioContext | null>(null);

  /** Daha önce görülen deprem ID’leri */
  const seenIdsRef = useRef<Set<string>>(new Set());

  /** Ses kuyruğu */
  const soundQueueRef = useRef<Earthquake[]>([]);
  const isPlayingRef = useRef(false);

  /* ============================================================
     5) SES / BİLDİRİM SİSTEMİ
     ============================================================ */

  const ensureAudio = async () => {
    if (!notificationsEnabled) return null;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playBeep = async (freq: number, dur: number) => {
    if (!notificationsEnabled) return;
    const ctx = await ensureAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** ISPARTA / YAKIN için 1 uzun */
  const playPreamble = async () => {
    await playBeep(440, 0.5);
    await sleep(600);
  };

  const processSoundQueue = async () => {
    if (isPlayingRef.current || !notificationsEnabled) return;
    isPlayingRef.current = true;

    while (soundQueueRef.current.length > 0 && notificationsEnabled) {
      const eq = soundQueueRef.current.shift();
      if (!eq) break;

      const dist = calcDistance(
        ISPARTA_COORDS.lat,
        ISPARTA_COORDS.lng,
        eq.geojson.coordinates[1],
        eq.geojson.coordinates[0]
      );
      const rel = getRelation(eq.title, dist);

      if (rel) await playPreamble();

      const count = Math.floor(eq.mag);
      for (let i = 0; i < count; i++) {
        await playBeep(880, 0.15);
        await sleep(300);
      }
      await sleep(800);
    }
    isPlayingRef.current = false;
  };

  /* ============================================================
     6) VERİ ÇEKME
     ============================================================ */

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      const qs = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
        format: 'json'
      });

      const res = await fetch(`${AFAD_PROXY}/?${qs}`);
      if (!res.ok) throw new Error('AFAD verisi alınamadı');

      const raw = await res.json();

      const mapped: Earthquake[] = raw?.result?.map((e: any) => ({
        earthquake_id: String(e.eventID),
        title: e.location,
        mag: Number(e.magnitude),
        depth: Number(e.depth ?? 0),
        date_time: normalizeDateString(e.date),
        geojson: {
          type: 'Point',
          coordinates: [Number(e.longitude), Number(e.latitude)]
        }
      })) ?? [];

      mapped.sort(
        (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      );

      // Yeni deprem tespiti (ID bazlı)
      const newOnes = mapped.filter(
        (eq) => !seenIdsRef.current.has(eq.earthquake_id)
      );

      newOnes.forEach((eq) => {
        seenIdsRef.current.add(eq.earthquake_id);
        soundQueueRef.current.push(eq);
      });

      if (newOnes.length > 0) processSoundQueue();

      setEarthquakes(mapped);
    } catch (e: any) {
      setError(e.message ?? 'Bilinmeyen hata');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);

  /* ============================================================
     7) HESAPLANMIŞ DEĞERLER
     ============================================================ */

  const distanceMap = useMemo(() => {
    const m = new Map<string, number>();
    earthquakes.forEach((eq) => {
      m.set(
        eq.earthquake_id,
        calcDistance(
          ISPARTA_COORDS.lat,
          ISPARTA_COORDS.lng,
          eq.geojson.coordinates[1],
          eq.geojson.coordinates[0]
        )
      );
    });
    return m;
  }, [earthquakes]);

  const sortedEarthquakes = useMemo(() => {
    const list = [...earthquakes];
    list.sort((a, b) => {
      if (sortConfig.key === 'mag') {
        return sortConfig.direction === 'asc'
          ? a.mag - b.mag
          : b.mag - a.mag;
      }
      if (sortConfig.key === 'distance') {
        const da = distanceMap.get(a.earthquake_id)!;
        const db = distanceMap.get(b.earthquake_id)!;
        return sortConfig.direction === 'asc' ? da - db : db - da;
      }
      const ta = new Date(a.date_time).getTime();
      const tb = new Date(b.date_time).getTime();
      return sortConfig.direction === 'asc' ? ta - tb : tb - ta;
    });
    return list;
  }, [earthquakes, sortConfig, distanceMap]);

  /* ============================================================
     8) RENDER
     ============================================================ */

  return (
    <PageContainer>
      {/* ---------------- ÜST PANO ---------------- */}
      <div
        className="rounded-xl p-5 mb-6 text-white shadow-lg"
        style={{ background: 'linear-gradient(90deg,#020617,#1e3a8a)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* SOL */}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity /> Son Depremler
            </h1>
            <p className="text-sm text-white/80">
              Bildirim açıksa deprem şiddeti kadar tık sesi.
            </p>
          </div>

          {/* ORTA - Bildirim */}
          <div className="flex justify-center">
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 transition"
            >
              {notificationsEnabled ? <Volume2 /> : <VolumeX />}
              <span className="font-bold">
                {notificationsEnabled ? 'Bildirim Açık' : 'Bildirim Kapalı'}
              </span>
            </button>
          </div>

          {/* SAĞ */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              {loading ? <RefreshCw className="animate-spin" /> : <Clock />}
              {formatTimeIstanbul(lastUpdated)}
            </div>
            <div className="text-sm text-white/80">
              Son 7 günde {earthquakes.length} deprem
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- ŞİDDET SKALASI ---------------- */}
      <div className="mb-3 rounded-lg overflow-hidden border">
        <div className="flex flex-wrap text-xs font-bold">
          {[
            { l: '<3 düşük', c: '#dcfce7' },
            { l: '3–3.9 orta', c: '#fef9c3' },
            { l: '4–4.9 belirgin', c: '#ffedd5' },
            { l: '5–5.9 güçlü', c: '#fee2e2' },
            { l: '6+ çok güçlü', c: '#fecaca' }
          ].map((i) => (
            <div
              key={i.l}
              className="flex-1 text-center py-2"
              style={{ backgroundColor: i.c }}
            >
              {i.l}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- TABLO ---------------- */}
      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Yer</th>
              <th className="p-3 text-center">Büyüklük</th>
              <th className="p-3 text-center">Uzaklık</th>
              <th className="p-3 text-center">Derinlik</th>
              <th className="p-3 text-left">Tarih / Saat</th>
            </tr>
          </thead>
          <tbody>
            {sortedEarthquakes.map((eq) => {
              const dist = distanceMap.get(eq.earthquake_id)!;
              const rel = getRelation(eq.title, dist);
              return (
                <tr
                  key={eq.earthquake_id}
                  style={{ backgroundColor: getSeverityColor(eq.mag) }}
                  className={isRecent(eq.date_time) ? 'animate-pulse' : ''}
                >
                  <td className="p-3 font-medium">
                    {rel && (
                      <span className="mr-2 text-xs font-bold text-white px-2 py-1 rounded bg-red-600">
                        {rel}
                      </span>
                    )}
                    {eq.title}
                  </td>
                  <td className="p-3 text-center font-bold">
                    {eq.mag.toFixed(1)}
                  </td>
                  <td className="p-3 text-center">{Math.round(dist)} km</td>
                  <td className="p-3 text-center">{eq.depth.toFixed(1)}</td>
                  <td className="p-3">
                    {formatDateIstanbul(eq.date_time)}
                    <div className="text-xs text-gray-600">
                      {getTimeAgo(eq.date_time)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500">
          <AlertTriangle className="inline mr-2" />
          {error}
        </div>
      )}
    </PageContainer>
  );
}
