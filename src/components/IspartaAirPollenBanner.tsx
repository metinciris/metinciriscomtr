import React, { useEffect, useRef, useState } from 'react';
import { Leaf, MapPin, Wind } from 'lucide-react';

// Yalnizca Isparta Merkez. Gercek istasyon olcumu degil, CAMS model tahmini.
// Polen verisi Avrupa model bolgesi ve mevsime gore bos gelebilir.
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality?' + new URLSearchParams({
  latitude: '37.7606',
  longitude: '30.5566',
  current: 'european_aqi,grass_pollen,pm2_5,carbon_monoxide',
  hourly: 'european_aqi,grass_pollen,pm2_5,carbon_monoxide',
  past_days: '3',
  forecast_days: '4',
  timezone: 'Europe/Istanbul',
}).toString();

const TEAL = '#17A2B8';
const ECHARTS_SCRIPT = 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.simple.min.js';

interface AirCurrent {
  time?: string;
  european_aqi?: number | null;
  grass_pollen?: number | null;
  pm2_5?: number | null;
  carbon_monoxide?: number | null;
}

interface AirResponse {
  current?: AirCurrent;
  current_units?: {
    carbon_monoxide?: string;
    grass_pollen?: string;
    pm2_5?: string;
  };
  hourly?: {
    time?: string[];
    european_aqi?: (number | null)[];
    grass_pollen?: (number | null)[];
    pm2_5?: (number | null)[];
    carbon_monoxide?: (number | null)[];
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

// Ayrı birimlerdeki metrikler ayni eksende karsilastirilmaz.
// Her satirin kendi y-olcegi olan 7 gunluk mini grafigi bulunur.
type DatedValue = { day: string; value: number | null };

function dailyAverage(times: string[] | undefined, readings: (number | null)[] | undefined): DatedValue[] {
  if (!times?.length) return [];
  const buckets = new Map<string, { total: number; count: number }>();
  times.forEach((time, index) => {
    const day = time.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    const bucket = buckets.get(day) ?? { total: 0, count: 0 };
    const reading = readings?.[index];
    if (valid(reading)) {
      bucket.total += reading;
      bucket.count += 1;
    }
    buckets.set(day, bucket);
  });
  return [...buckets].map(([day, bucket]) => ({
    day,
    value: bucket.count ? Math.round(bucket.total / bucket.count * 10) / 10 : null,
  }));
}

function shortDay(isoDay: string): string {
  const date = new Date(isoDay + 'T12:00:00+03:00');
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })
    : isoDay;
}

function sevenDayAirOption(
  times: string[] | undefined,
  readings: (number | null)[] | undefined,
  currentTime: string | undefined,
  animate: boolean,
): Record<string, unknown> | null {
  if (!times?.length || !readings?.some(valid)) return null;
  const currentIndex = currentTime ? times.findIndex(t => t >= currentTime) : -1;
  const nowHour = currentIndex >= 0 ? times[currentIndex] : null;
  const nowValue = currentIndex >= 0 ? readings[currentIndex] : null;
  return {
    animation: animate,
    animationDuration: 650,
    animationEasing: 'cubicOut',
    grid: { left: 6, right: 9, top: 29, bottom: 26 },
    tooltip: {
      trigger: 'axis',
      confine: true,
      valueFormatter: (value: unknown) => valid(value) ? Math.round(value) + ' AQI' : 'Veri yok',
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748B',
        fontSize: 10,
        interval: 0,
        hideOverlap: true,
        formatter: (time: string) => time.endsWith('T00:00') ? shortDay(time.slice(0, 10)) : '',
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 10,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: 'rgba(23,162,184,0.13)', type: 'dashed' } },
    },
    series: [{
      name: 'Avrupa AQI',
      type: 'line',
      smooth: 0.3,
      showSymbol: false,
      connectNulls: false,
      data: readings.map(value => valid(value) ? value : null),
      lineStyle: { color: TEAL, width: 2.5 },
      itemStyle: { color: TEAL },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(23,162,184,0.28)' },
            { offset: 1, color: 'rgba(23,162,184,0.02)' },
          ],
        },
      },
      markLine: nowHour ? {
        silent: true,
        animation: false,
        symbol: ['none', 'none'],
        lineStyle: { color: '#E16D45', width: 1.6, type: 'dashed' },
        label: {
          show: true, color: '#B65330', fontSize: 11, fontWeight: 'bold',
          formatter: 'Şimdi', position: 'end', distance: 3,
        },
        data: [{ xAxis: nowHour }],
      } : undefined,
      markPoint: nowHour && valid(nowValue) ? {
        symbol: 'circle',
        symbolSize: 10,
        label: { show: false },
        itemStyle: { color: '#E16D45', borderColor: '#FFFFFF', borderWidth: 2 },
        data: [{ coord: [nowHour, nowValue], name: 'Şimdi' }],
      } : undefined,
    }],
  };
}

function sevenDayMiniOption(
  days: DatedValue[],
  today: string | undefined,
  unit: string,
  animate: boolean,
): Record<string, unknown> | null {
  const present = days.filter(item => valid(item.value));
  // Tamami sifir olan bir polen serisini buyuk grafik olarak gostermeyelim.
  if (present.length < 2 || present.every(item => item.value === 0)) return null;
  const dates = days.map(item => item.day);
  const todayDay = today?.slice(0, 10);
  return {
    animation: animate,
    animationDuration: 550,
    animationEasing: 'cubicOut',
    grid: { left: 2, right: 3, top: 8, bottom: 6 },
    tooltip: {
      trigger: 'axis', confine: true,
      valueFormatter: (value: unknown) =>
        valid(value) ? value.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' ' + unit : 'Veri yok',
    },
    xAxis: { type: 'category', boundaryGap: false, data: dates, show: false },
    yAxis: { type: 'value', min: 0, show: false, scale: false },
    series: [{
      name: '7 günlük değişim',
      type: 'line',
      smooth: true,
      showSymbol: false,
      connectNulls: false,
      data: days.map(item => valid(item.value) ? item.value : null),
      lineStyle: { color: TEAL, width: 2 },
      itemStyle: { color: TEAL },
      areaStyle: { color: 'rgba(23,162,184,0.10)' },
      markLine: todayDay && dates.includes(todayDay) ? {
        silent: true, animation: false, symbol: ['none', 'none'],
        label: { show: false },
        lineStyle: { color: '#E16D45', type: 'dashed', width: 1 },
        data: [{ xAxis: todayDay }],
      } : undefined,
    }],
  };
}

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
  const status = aqiCategory(aqi);
  const currentTime = current?.time;
  const days = data?.hourly?.time;
  const animate = typeof window !== 'undefined'
    ? !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    : true;

  // CAMS 3 geride + bugün + 3 ileride = toplam 7 takvim günü.
  // Null degerler korunur, eksik olcumler asla 0'a donusturulmez.
  const airOption = sevenDayAirOption(days, data?.hourly?.european_aqi, currentTime, animate);
  const grass = valid(current?.grass_pollen) ? current.grass_pollen : null;
  const pm25 = valid(current?.pm2_5) ? current.pm2_5 : null;
  const co = valid(current?.carbon_monoxide) ? current.carbon_monoxide : null;

  const metrics = [
    {
      key: 'grass',
      label: 'Çim poleni',
      currentValue: grass,
      display: grass === null ? 'Veri yok' : grass === 0
        ? 'Çok düşük' : grass.toLocaleString('tr-TR', { maximumFractionDigits: 1 }),
      unit: grass === 0 ? '' : 'tane/m³',
      points: dailyAverage(days, data?.hourly?.grass_pollen),
    },
    {
      key: 'pm25',
      label: 'PM2.5',
      currentValue: pm25,
      display: pm25 === null ? 'Veri yok' : pm25.toLocaleString('tr-TR', { maximumFractionDigits: 1 }),
      unit: 'µg/m³',
      points: dailyAverage(days, data?.hourly?.pm2_5),
    },
    {
      key: 'co',
      label: 'Karbon monoksit (CO)',
      currentValue: co,
      display: co === null ? 'Veri yok' : co.toLocaleString('tr-TR', { maximumFractionDigits: 1 }),
      unit: 'µg/m³',
      points: dailyAverage(days, data?.hourly?.carbon_monoxide),
    },
  ];

  const currentLabel = loading ? 'Yükleniyor…'
    : failed ? 'Güncel veri alınamadı'
    : currentTime?.slice(11, 16) + ' TSİ · Model tahmini';

  return (
    <section
      aria-label="Isparta Merkez hava kalitesi, polen ve hava kirleticileri tahmini"
      className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-2xl border bg-white shadow-sm"
      style={{ borderColor: 'rgba(23,162,184,0.28)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-white sm:px-5"
        style={{ background: 'linear-gradient(110deg, #17A2B8 0%, #0D7489 100%)' }}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MapPin size={17} aria-hidden="true" />
          <span>Isparta Merkez</span>
          <span className="text-white/60">·</span>
          <span>Polen ve Hava Kalitesi</span>
        </div>
        <span className="text-xs text-white/90">{currentLabel}</span>
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
              <EChartMini
                option={airOption}
                label="Isparta Merkez 7 günlük hava kalitesi değişimi; turuncu kesikli Şimdi çizgisi"
                height={158}
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg bg-white/80 px-3 text-center text-sm text-slate-500">
                {loading ? '7 günlük hava kalitesi grafiği hazırlanıyor…'
                  : failed ? 'Hava kalitesi tahmini alınamadı.'
                  : '7 günlük hava kalitesi verisi mevcut değil.'}
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#D3ECEF] pt-2 text-[11px] text-slate-600">
            <span>3 gün geçmiş · bugün · 3 gün tahmin</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#B65330]">
              <span className="inline-block h-3 border-l-2 border-dashed border-[#E16D45]" aria-hidden="true" />
              Şimdi
            </span>
          </div>
        </article>

        <article className="min-w-0 rounded-xl border border-[#D3ECEF] bg-[#F7FCFD] p-4">
          <div className="flex items-center gap-2">
            <Leaf size={19} color={TEAL} aria-hidden="true" />
            <h2 className="m-0 text-base font-semibold text-slate-800">Polen ve Hava Etkenleri</h2>
            <span className="ml-auto text-[11px] text-slate-500">7 gün</span>
          </div>
          <p className="mb-0 mt-2 text-xs text-slate-500">
            Çim poleni, ince partikül ve karbon monoksit
          </p>
          <div className="mt-2 space-y-2">
            {metrics.map(metric => {
              const miniature = sevenDayMiniOption(metric.points, currentTime, metric.unit || 'tane/m³', animate);
              return (
                <div key={metric.key} className="grid grid-cols-[minmax(0,1fr)_minmax(96px,42%)] items-center gap-2 rounded-lg bg-white/80 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-700">{metric.label}</div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-1">
                      <span className="text-sm font-bold tabular-nums text-[#0F6F7E]">
                        {loading ? '…' : metric.display}
                      </span>
                      {metric.currentValue !== null && metric.unit && (
                        <span className="text-[11px] text-slate-500">{metric.unit}</span>
                      )}
                    </div>
                  </div>
                  {miniature ? (
                    <EChartMini
                      option={miniature}
                      label={metric.label + ' için yedi günlük ayrı ölçekli eğilim'}
                      height={43}
                    />
                  ) : (
                    <div className="flex h-11 items-center justify-center text-right text-[11px] text-slate-400">
                      {loading ? 'Yükleniyor…' : metric.currentValue === 0 ? 'Çok düşük' : '7 günlük veri yok'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mb-0 mt-2 text-[11px] text-slate-500">
            Her gösterge ayrı ölçekte; CO ve PM2.5 kirleticidir, polen değildir. İstasyon ölçümü değildir.
          </p>
        </article>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E0F0F2] px-4 py-2.5 text-[11px] text-slate-500 sm:px-5">
        <span>Open-Meteo / CAMS tahmini · Geçmiş günler arşivlenmiş model verisidir.</span>
        <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener noreferrer"
          className="font-medium underline underline-offset-2 hover:text-[#0F6F7E]"
          style={{ color: '#0F6F7E' }}>
          Veri kaynağı · CC BY 4.0
        </a>
      </div>
    </section>
  );
}
