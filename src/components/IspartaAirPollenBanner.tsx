import React, { useEffect, useRef, useState } from 'react';
import { Leaf, MapPin, Wind } from 'lucide-react';

// Yalnizca Isparta Merkez. Gercek istasyon olcumu degil, CAMS model tahmini.
// Polen verisi Avrupa model bolgesi ve mevsime gore bos gelebilir.
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality?' + new URLSearchParams({
  latitude: '37.7606',
  longitude: '30.5566',
  current: 'us_aqi,grass_pollen,pm2_5,carbon_monoxide',
  hourly: 'us_aqi,grass_pollen,pm2_5,carbon_monoxide',
  past_days: '3',
  forecast_days: '4',
  timezone: 'Europe/Istanbul',
}).toString();

const TEAL = '#17A2B8';
const ECHARTS_SCRIPT = 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.simple.min.js';

interface AirCurrent {
  time?: string;
  us_aqi?: number | null;
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
    us_aqi?: (number | null)[];
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

function shortDay(isoDay: string): string {
  const date = new Date(isoDay + 'T12:00:00+03:00');
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })
    : isoDay;
}

function sevenDayAirOption(
  times: string[] | undefined,
  readings: (number | null)[] | undefined,
  animate: boolean,
  lineColor: string,
  fillColor: string,
): Record<string, unknown> | null {
  if (!times?.length || !readings?.some(valid)) return null;
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
      splitLine: { lineStyle: { color: 'rgba(53,83,100,0.26)', type: 'dashed' } },
    },
    series: [{
      name: 'ABD AQI',
      type: 'line',
      smooth: 0.3,
      showSymbol: false,
      connectNulls: false,
      data: readings.map(value => valid(value) ? value : null),
      lineStyle: { color: lineColor, width: 3.7 },
      itemStyle: { color: lineColor },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: withOpacity(fillColor, 0.46) },
            { offset: 1, color: withOpacity(fillColor, 0.07) },
          ],
        },
      },

    }],
  };
}

function sevenDayMiniOption(
  times: string[] | undefined,
  readings: (number | null)[] | undefined,
  unit: string,
  animate: boolean,
): Record<string, unknown> | null {
  if (!times?.length || !readings?.length) return null;
  const present = readings.filter(valid);
  if (present.length < 2 || present.every(value => value === 0)) return null;


  return {
    animation: animate,
    animationDuration: 550,
    animationEasing: 'cubicOut',
    grid: { left: 2, right: 4, top: 19, bottom: 3 },
    tooltip: {
      trigger: 'axis',
      confine: true,
      valueFormatter: (value: unknown) =>
        valid(value) ? value.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' ' + unit : 'Veri yok',
    },
    xAxis: { type: 'category', boundaryGap: false, data: times, show: false },
    yAxis: { type: 'value', min: 0, show: false, scale: false },
    series: [{
      name: '7 günlük değişim',
      type: 'line',
      smooth: true,
      showSymbol: false,
      connectNulls: false,
      data: readings.map(value => valid(value) ? value : null),
      lineStyle: { color: '#11879D', width: 2.7 },
      itemStyle: { color: TEAL },
      areaStyle: { color: 'rgba(23,162,184,0.19)' },

    }],
  };
}

const AQI_STAGES = [
  { max: 50, range: '0–50', name: 'İyi', color: '#B1DB6D', ink: '#4D7A29', icon: 0 },
  { max: 100, range: '51–100', name: 'Orta', color: '#F7D46B', ink: '#8D620F', icon: 1 },
  { max: 150, range: '101–150', name: 'Hassas gruplar için sağlıksız', color: '#F19B65', ink: '#A85420', icon: 2 },
  { max: 200, range: '151–200', name: 'Sağlıksız', color: '#F16F7B', ink: '#A9364C', icon: 3 },
  { max: 300, range: '201–300', name: 'Çok sağlıksız', color: '#957CAF', ink: '#654687', icon: 4 },
  { max: Infinity, range: '301+', name: 'Tehlikeli', color: '#95637D', ink: '#6B3857', icon: 5 },
] as const;

function aqiCategory(value: number | null) {
  return value === null ? null : AQI_STAGES.find(stage => value <= stage.max) ?? null;
}

function withOpacity(hex: string, opacity: number) {
  const rgb = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((rgb >> 16) & 255) + ',' + ((rgb >> 8) & 255) + ',' + (rgb & 255) + ',' + opacity + ')';
}

// Kullanıcının örnek görselindeki 6 renkli yüz ikonundan kırpılıp küçültülmüş sprite.
// Bir PNG verisi CSS arka planıyla tek bir ikon olarak gösterilir.
const AQI_FACE_SPRITE = 'data:image/png;base64,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';

function AqiFace({ index, size = 40, label }: { index: number; size?: number; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-block shrink-0"
      style={{
        width: size,
        height: size,
        backgroundImage: 'url("' + AQI_FACE_SPRITE + '")',
        backgroundRepeat: 'no-repeat',
        backgroundSize: (size * 6) + 'px ' + size + 'px',
        backgroundPosition: (-size * index) + 'px 0',
      }}
    />
  );
}

function EChartMini({
  option,
  label,
  height = 112,
  times,
  currentTime,
  gridLeft = 6,
  gridRight = 9,
  gridTop = 29,
  gridBottom = 26,
  compactMarker = false,
}: {
  option: Record<string, unknown>;
  label: string;
  height?: number;
  times?: string[];
  currentTime?: string;
  gridLeft?: number;
  gridRight?: number;
  gridTop?: number;
  gridBottom?: number;
  compactMarker?: boolean;
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

  // ECharts simple paketinde markLine bileseni bulunmayabiliyor.
  // Onun yerine gercek hourly dizisindeki indeks ve ECharts'in grid
  // kenarlarini kullanarak HTML cizgisini dogrudan veri saatine hizaliyoruz.
  // boundaryGap:false => ilk kategori plot solunda, son kategori saginda.
  const currentIndex = times?.length && currentTime
    ? times.findIndex(time => time >= currentTime) : -1;
  const fraction = currentIndex >= 0 && times && times.length > 1
    ? currentIndex / (times.length - 1) : null;
  const markerOffset = fraction === null ? 0
    : gridLeft - fraction * (gridLeft + gridRight);
  const markerLeft = fraction === null ? null
    : (fraction * 100).toFixed(5) + '%';

  if (unavailable) {
    return <div className="flex items-center justify-center text-xs text-slate-500" style={{ height }}>Grafik şu anda yüklenemiyor.</div>;
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={host} role="img" aria-label={label} className="h-full w-full" />
      {markerLeft && (
        <div className="pointer-events-none absolute z-10" aria-hidden="true"
          style={{ left: markerLeft, marginLeft: markerOffset, top: 0, bottom: 0 }}>
          <span className="absolute z-10 whitespace-nowrap rounded-sm px-1 font-bold"
            style={{
              top: compactMarker ? 0 : 1,
              left: 0,
              transform: 'translateX(-50%)',
              fontSize: compactMarker ? 9 : 11,
              lineHeight: compactMarker ? '13px' : '16px',
              color: '#A84420',
              backgroundColor: 'rgba(255,255,255,0.91)',
            }}>Şimdi</span>
          <span className="absolute"
            style={{
              top: gridTop, bottom: gridBottom, left: 0,
              borderLeft: '2px dashed #E16D45',
              filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.95))',
            }} />
        </div>
      )}
    </div>
  );
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
  const aqi = valid(current?.us_aqi) ? current.us_aqi : null;
  const status = aqiCategory(aqi);
  const currentTime = current?.time;
  const days = data?.hourly?.time;
  const animate = typeof window !== 'undefined'
    ? !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    : true;

  // CAMS 3 geride + bugün + 3 ileride = toplam 7 takvim günü.
  // Null degerler korunur, eksik olcumler asla 0'a donusturulmez.
  const airOption = sevenDayAirOption(
    days, data?.hourly?.us_aqi, animate,
    status?.ink ?? TEAL,
    status?.color ?? TEAL,
  );
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
      readings: data?.hourly?.grass_pollen,
    },
    {
      key: 'pm25',
      label: 'Partikül (PM2.5)',
      currentValue: pm25,
      display: pm25 === null ? 'Veri yok' : pm25.toLocaleString('tr-TR', { maximumFractionDigits: 1 }),
      unit: 'µg/m³',
      readings: data?.hourly?.pm2_5,
    },
    {
      key: 'co',
      label: 'Karbon monoksit (CO)',
      currentValue: co,
      display: co === null ? 'Veri yok' : co.toLocaleString('tr-TR', { maximumFractionDigits: 1 }),
      unit: 'µg/m³',
      readings: data?.hourly?.carbon_monoxide,
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
        <article className="min-w-0 rounded-xl border p-4"
          style={{
            borderColor: status ? withOpacity(status.color, 0.65) : '#D3ECEF',
            background: status ? 'linear-gradient(120deg, ' + withOpacity(status.color, 0.12) + ', #F7FCFD 76%)' : '#F7FCFD',
          }}>
          <div className="flex items-center gap-2">
            <Wind size={19} color={status?.ink ?? TEAL} aria-hidden="true" />
            <h2 className="m-0 text-base font-semibold text-slate-800">Hava Kalitesi</h2>
            <span className="ml-auto text-[11px] text-slate-500">ABD AQI</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[56px] font-extrabold leading-none tabular-nums sm:text-[64px]"
              style={{ color: status?.ink ?? '#64748B' }}>
              {loading ? '…' : aqi === null ? '—' : Math.round(aqi)}
            </span>
            {status ? (
              <div className="flex min-w-0 items-center gap-2">
                <AqiFace index={status.icon} size={62} label={status.name} />
                <span className="max-w-44 text-sm font-bold leading-snug" style={{ color: status.ink }}>
                  {status.name}
                </span>
              </div>
            ) : (
              <span className="text-sm text-slate-500">
                {loading ? 'Yükleniyor' : failed ? 'Veri alınamadı' : 'Veri yok'}
              </span>
            )}
          </div>
          <div className="mt-3">
            {airOption ? (
              <EChartMini
                option={airOption}
                label="Isparta Merkez yedi günlük hava kalitesi değişimi; gerçek saat konumunda Şimdi çizgisi"
                height={158}
                times={days}
                currentTime={currentTime}
                gridLeft={6}
                gridRight={9}
                gridTop={29}
                gridBottom={26}
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg bg-white/80 px-3 text-center text-sm text-slate-500">
                {loading ? '7 günlük hava kalitesi grafiği hazırlanıyor…'
                  : failed ? 'Hava kalitesi tahmini alınamadı.'
                  : '7 günlük hava kalitesi verisi mevcut değil.'}
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#D3ECEF] pt-2">
            <div className="flex flex-wrap items-center gap-1" aria-label="ABD AQI renkli durum simgeleri">
              {AQI_STAGES.map(stage => (
                <span key={stage.icon} className="rounded-md p-0.5"
                  style={{
                    border: status?.icon === stage.icon ? '1.5px solid ' + stage.ink : '1.5px solid transparent',
                    background: status?.icon === stage.icon ? withOpacity(stage.color, 0.18) : 'transparent',
                  }}>
                  <AqiFace index={stage.icon} size={30} label={stage.range + ': ' + stage.name} />
                </span>
              ))}
            </div>

          </div>
        </article>

        <article className="min-w-0 rounded-xl border border-[#D3ECEF] bg-[#F7FCFD] p-4">
          <div className="flex items-center gap-2">
            <Leaf size={19} color={TEAL} aria-hidden="true" />
            <h2 className="m-0 text-base font-semibold text-slate-800">Polen ve Hava Etkenleri</h2>
            <span className="ml-auto text-[11px] text-slate-500">7 günlük eğilim</span>
          </div>
          <p className="mb-0 mt-2 text-xs text-slate-500">
            Çim poleni, ince partikül ve karbon monoksit
          </p>
          <div className="mt-2 space-y-2">
            {metrics.map(metric => {
              const miniature = sevenDayMiniOption(days, metric.readings, metric.unit || 'tane/m³', animate);
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
                      label={metric.label + ' için yedi günlük ayrı ölçekli eğilim ve Şimdi işareti'}
                      height={58}
                      times={days}
                      currentTime={currentTime}
                      gridLeft={2}
                      gridRight={4}
                      gridTop={19}
                      gridBottom={3}
                      compactMarker
                    />
                  ) : (
                    <div className="flex h-14 items-center justify-center text-right text-[11px] text-slate-400">
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
