import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Leaf, MapPin, Wind } from 'lucide-react';

// Yalnizca Isparta Merkez. Gercek istasyon olcumu degil, CAMS model tahmini.
// Polen verisi Avrupa model bolgesi ve mevsime gore bos gelebilir.
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality?' + new URLSearchParams({
  latitude: '37.7606',
  longitude: '30.5566',
  current: 'european_aqi,pm2_5,grass_pollen,olive_pollen,ragweed_pollen,mugwort_pollen,birch_pollen,alder_pollen',
  hourly: 'european_aqi',
  forecast_days: '2',
  timezone: 'Europe/Istanbul',
}).toString();

const TEAL = '#17A2B8';
const ECHARTS_SCRIPT = 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.simple.min.js';

interface AirCurrent {
  time?: string;
  european_aqi?: number | null;
  pm2_5?: number | null;
  grass_pollen?: number | null;
  olive_pollen?: number | null;
  ragweed_pollen?: number | null;
  mugwort_pollen?: number | null;
  birch_pollen?: number | null;
  alder_pollen?: number | null;
}

interface AirResponse {
  current?: AirCurrent;
  hourly?: {
    time?: string[];
    european_aqi?: (number | null)[];
  };
  error?: boolean;
}

interface EChartsInstance {
  setOption: (option: Record<string, unknown>, notMerge?: boolean) => void;
  resize: () => void;
  dispose: () => void;
}
interface EChartsLibrary {
  init: (container: HTMLDivElement, theme?: string | null, options?: { renderer?: 'canvas' | 'svg' }) => EChartsInstance;
}
declare global {
  interface Window {
    echarts?: EChartsLibrary;
  }
}

let libraryPromise: Promise<EChartsLibrary | null> | null = null;

// On-demand: ECharts yalnizca gercek grafik verisi oldugunda indirilir.
// Simple Canvas paketi tam paketten kucuktur ve kisa animasyonlar icin yeterlidir.
function loadECharts(): Promise<EChartsLibrary | null> {
  if (window.echarts) return Promise.resolve(window.echarts);
  if (libraryPromise) return libraryPromise;

  libraryPromise = new Promise(resolve => {
    const script = document.createElement('script');
    script.src = ECHARTS_SCRIPT;
    script.async = true;
    let complete = false;
    const finish = (library: EChartsLibrary | null) => {
      if (complete) return;
      complete = true;
      window.clearTimeout(timeout);
      if (!library) {
        script.remove();
        libraryPromise = null;
      }
      resolve(library);
    };
    const timeout = window.setTimeout(() => finish(null), 10000);
    script.onload = () => finish(window.echarts || null);
    script.onerror = () => finish(null);
    document.head.appendChild(script);
  });
  return libraryPromise;
}

const valid = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

// Bitki turleri kendi baslarina gosterilir; birlestirilmis bir "alerji riski"
// veya kaynaktan gelmeyen bir polen endeksi uretilmez.
const POLLEN_TYPES = [
  { key: 'grass_pollen', label: 'Çimen' },
  { key: 'olive_pollen', label: 'Zeytin' },
  { key: 'mugwort_pollen', label: 'Pelin' },
  { key: 'birch_pollen', label: 'Huş' },
  { key: 'alder_pollen', label: 'Kızılağaç' },
  { key: 'ragweed_pollen', label: 'Yabani ot' },
] as const;

function aqiCategory(value: number | null) {
  if (value === null) return { name: 'Veri yok', color: '#64748B' };
  if (value <= 20) return { name: 'İyi', color: '#168565' };
  if (value <= 40) return { name: 'Makul', color: '#7A821B' };
  if (value <= 60) return { name: 'Orta', color: '#AD7418' };
  if (value <= 80) return { name: 'Kötü', color: '#BF582D' };
  if (value <= 100) return { name: 'Çok kötü', color: '#B83759' };
  return { name: 'Aşırı kötü', color: '#8F44A7' };
}

function EChartMini({
  option,
  label,
  height = 112,
}: {
  option: Record<string, unknown>;
  label: string;
  height?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let removed = false;
    let chart: EChartsInstance | null = null;
    let observer: ResizeObserver | null = null;

    void loadECharts().then(lib => {
      if (removed || !host.current) return;
      if (!lib) {
        setUnavailable(true);
        return;
      }
      try {
        chart = lib.init(host.current, null, { renderer: 'canvas' });
        chart.setOption(option, true);
        chart.resize();
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(() => chart?.resize());
          observer.observe(host.current);
        } else {
          window.addEventListener('resize', resize);
        }
      } catch {
        chart?.dispose();
        chart = null;
        setUnavailable(true);
      }
    });

    function resize() { chart?.resize(); }
    return () => {
      removed = true;
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      chart?.dispose();
    };
  }, [option]);

  if (unavailable) {
    return <div className="flex items-center justify-center text-xs text-slate-500" style={{ height }}>Grafik şu anda yüklenemiyor.</div>;
  }
  return <div ref={host} role="img" aria-label={label} className="w-full" style={{ height }} />;
}

export function IspartaAirPollenBanner() {
  const [data, setData] = useState<AirResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      const currentController = controller;
      const timeout = window.setTimeout(() => currentController.abort(), 12000);
      try {
        const result = await fetch(AIR_URL, { signal: currentController.signal, cache: 'no-store' });
        if (!result.ok) throw new Error('Air service unavailable');
        const value = await result.json() as AirResponse;
        const modelTime = value.current?.time;
        if (value.error || !modelTime || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(modelTime))
          throw new Error('Air forecast timestamp missing');

        // Open-Meteo timezone=Europe/Istanbul; tahmin 6 saatten eskiyse guncel denmez.
        const measuredAt = Date.parse(modelTime + '+03:00');
        if (!Number.isFinite(measuredAt) || measuredAt < Date.now() - 6 * 3600000 || measuredAt > Date.now() + 2 * 3600000)
          throw new Error('Air forecast is stale');

        if (active) {
          setData(value);
          setFailed(false);
        }
      } catch {
        if (active) {
          setData(null);
          setFailed(true);
        }
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }

    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 45 * 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
      controller?.abort();
    };
  }, []);

  const current = data?.current;
  const aqi = valid(current?.european_aqi) ? current.european_aqi : null;
  const pm25 = valid(current?.pm2_5) ? current.pm2_5 : null;
  const status = aqiCategory(aqi);

  // React Compiler: memoization bagimliliklari callback'in kullandigi
  // alanlarla birebir ayni olmali. Tum data nesnesini bagimlilik yapma.
  const hourlyTimes = data?.hourly?.time;
  const hourlyAqi = data?.hourly?.european_aqi;
  const modelTime = data?.current?.time;
  const trend = useMemo(() => {
    const hours = hourlyTimes ?? [];
    const values = hourlyAqi ?? [];
    if (!modelTime || !hours.length) return [];
    const start = hours.findIndex(hour => hour >= modelTime);
    if (start === -1) return [];
    return hours.slice(start, start + 12).map((time, i) => ({
      label: time.slice(11, 16),
      value: values[start + i],
    })).filter(({ value }) => valid(value));
  }, [hourlyTimes, hourlyAqi, modelTime]);

  const pollen = useMemo(() => POLLEN_TYPES
    .flatMap(type => {
      const value = current?.[type.key];
      return valid(value) ? [{ label: type.label, value }] : [];
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 4), [current]);

  const animate = typeof window !== 'undefined'
    ? !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    : true;

  const airOption = useMemo<Record<string, unknown> | null>(() => {
    if (trend.length < 2) return null;
    return {
      animation: animate,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      grid: { left: 5, right: 7, top: 12, bottom: 20 },
      tooltip: {
        trigger: 'axis',
        confine: true,
        valueFormatter: (value: unknown) => typeof value === 'number' ? Math.round(value) + ' AQI' : '—',
      },
      xAxis: {
        type: 'category', boundaryGap: false,
        data: trend.map(item => item.label),
        axisTick: { show: false }, axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10, interval: 2 },
      },
      yAxis: {
        type: 'value', min: 0, minInterval: 10, axisLine: { show: false },
        axisTick: { show: false }, axisLabel: { show: false },
        splitLine: { lineStyle: { color: 'rgba(23,162,184,0.12)', type: 'dashed' } },
      },
      series: [{
        name: 'Avrupa AQI',
        type: 'line', smooth: true, showSymbol: false,
        symbol: 'circle', symbolSize: 5,
        data: trend.map(item => item.value),
        lineStyle: { color: TEAL, width: 3 },
        itemStyle: { color: TEAL },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(23,162,184,0.30)' },
              { offset: 1, color: 'rgba(23,162,184,0.02)' },
            ],
          },
        },
      }],
    };
  }, [trend, animate]);

  const pollenOption = useMemo<Record<string, unknown> | null>(() => {
    if (!pollen.length) return null;
    // Siralama ECharts'in yukaridan asagi bar yerlesimi icin ters cevrilir.
    const rows = [...pollen].reverse();
    return {
      animation: animate,
      animationDuration: 550,
      animationEasing: 'cubicOut',
      grid: { left: 74, right: 50, top: 4, bottom: 5 },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' }, confine: true,
        valueFormatter: (value: unknown) =>
          typeof value === 'number' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' tane/m³' : '—',
      },
      xAxis: { type: 'value', min: 0, show: false },
      yAxis: {
        type: 'category',
        data: rows.map(row => row.label),
        axisTick: { show: false }, axisLine: { show: false },
        axisLabel: { color: '#475569', fontSize: 11 },
      },
      series: [{
        name: 'Polen',
        type: 'bar',
        data: rows.map(row => row.value),
        barWidth: 12,
        showBackground: true,
        backgroundStyle: { color: 'rgba(23,162,184,0.09)', borderRadius: 8 },
        itemStyle: { color: TEAL, borderRadius: [0, 8, 8, 0] },
        label: {
          show: true, position: 'right', color: '#0F6F7E', fontSize: 11,
          formatter: (info: { value: number }) =>
            info.value.toLocaleString('tr-TR', { maximumFractionDigits: 1 }),
        },
      }],
    };
  }, [pollen, animate]);

  return (
    <section
      aria-label="Isparta Merkez polen ve hava kalitesi tahmini"
      className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: 'rgba(23,162,184,0.28)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-white sm:px-5"
        style={{ background: 'linear-gradient(110deg, #17A2B8 0%, #0D7489 100%)' }}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MapPin size={17} aria-hidden="true" />
          <span>Isparta Merkez</span>
          <span className="text-white/60">·</span>
          <span>Alerji ve Hava Kalitesi</span>
        </div>
        <span className="text-xs text-white/90">
          {loading ? 'Yükleniyor…' : failed ? 'Güncel veri alınamadı' : current?.time?.slice(11, 16) + ' TSİ · Tahmin'}
        </span>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-2 sm:p-4">
        <article className="min-w-0 rounded-xl border border-[#D3ECEF] bg-[#F7FCFD] p-4">
          <div className="flex items-center gap-2">
            <Wind size={19} color={TEAL} aria-hidden="true" />
            <h2 className="m-0 text-base font-semibold text-slate-800">Hava Kalitesi</h2>
            <span className="ml-auto text-[11px] text-slate-500">Avrupa AQI</span>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-4xl font-bold leading-none tabular-nums" style={{ color: TEAL }}>
              {loading ? '…' : aqi === null ? '—' : Math.round(aqi)}
            </span>
            <span className="pb-1 text-sm font-semibold" style={{ color: status.color }}>
              {loading ? 'Yükleniyor' : failed ? 'Veri alınamadı' : status.name}
            </span>
          </div>
          <div className="mt-3">
            {airOption ? (
              <EChartMini option={airOption} label="Gelecek 12 saat için Avrupa hava kalitesi endeksi grafiği" />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-lg bg-white/80 px-3 text-center text-sm text-slate-500">
                {loading ? 'Hava kalitesi grafiği hazırlanıyor…' : failed ? 'Hava kalitesi tahmini alınamadı.' : 'Saatlik hava kalitesi eğilimi mevcut değil.'}
              </div>
            )}
          </div>
          <div className="mt-2 border-t border-[#D3ECEF] pt-2 text-xs text-slate-600">
            PM2.5: <strong className="text-slate-800">
              {pm25 === null ? '—' : pm25.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
            </strong> µg/m³
            <span className="float-right text-slate-500">12 saatlik eğilim</span>
          </div>
        </article>

        <article className="min-w-0 rounded-xl border border-[#D3ECEF] bg-[#F7FCFD] p-4">
          <div className="flex items-center gap-2">
            <Leaf size={19} color={TEAL} aria-hidden="true" />
            <h2 className="m-0 text-base font-semibold text-slate-800">Polen</h2>
            <span className="ml-auto text-[11px] text-slate-500">Alerji · Bitki polenleri</span>
          </div>
          <p className="mb-0 mt-2 text-xs text-slate-500">
            Bitki türlerine göre tahmini yoğunluk (tane/m³)
          </p>
          <div className="mt-2">
            {pollenOption ? (
              <EChartMini option={pollenOption} label="Isparta Merkez bitki polen yoğunlukları; yatay sütun grafik" height={142} />
            ) : (
              <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-[#C6E6EA] bg-white px-3 text-center text-sm leading-relaxed text-slate-500">
                {loading ? 'Polen tahmini yükleniyor…'
                  : failed ? 'Polen verisi şu anda alınamadı.'
                  : 'Isparta için şu anda polen tahmini bulunmuyor. Bu durum mevsim veya bölgesel veri kapsamından kaynaklanabilir.'}
              </div>
            )}
          </div>
          {pollenOption && (
            <p className="mb-0 mt-1 text-[11px] text-slate-500">
              Tür bazında model tahmini; kişisel alerji riski puanı değildir.
            </p>
          )}
        </article>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E0F0F2] px-4 py-2.5 text-[11px] text-slate-500 sm:px-5">
        <span>İstasyon ölçümü değil, Open-Meteo / CAMS model tahminidir.</span>
        <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener noreferrer"
          className="font-medium underline underline-offset-2 hover:text-[#0F6F7E]"
          style={{ color: '#0F6F7E' }}>
          Veri kaynağı · CC BY 4.0
        </a>
      </div>
    </section>
  );
}
