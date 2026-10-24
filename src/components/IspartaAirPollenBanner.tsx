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
  axisMax: number,
): Record<string, unknown> | null {
  if (!times?.length || !readings?.some(valid)) return null;
  return {
    backgroundColor: 'transparent',
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
      max: axisMax, // ayni olcek, renk bantlariyla bire bir eslesir
      minInterval: 10,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: 'rgba(53,83,100,0.26)', type: 'dashed' } },
    },
    series: [{
      name: 'Hava Kalitesi Endeksi',
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
            { offset: 0, color: withOpacity(fillColor, 0.12) },
            { offset: 1, color: withOpacity(fillColor, 0.01) },
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

export function aqiCategory(value: number | null) {
  return value === null ? null : AQI_STAGES.find(stage => value <= stage.max) ?? null;
}

export function withOpacity(hex: string, opacity: number) {
  const rgb = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((rgb >> 16) & 255) + ',' + ((rgb >> 8) & 255) + ',' + (rgb & 255) + ',' + opacity + ')';
}

// AQI grafiğinin Y eksenini renklendirme ile ayni sinirda tut.
// Grafik 51'e ulastiginda yesil (0-50) ile sari (51-100)
// her iki tarafta da acikca gorunmeli. Daha yuksek degerlerde
// turuncu, kirmizi ve mor esikler de otomatik eklenir.
function aqiAxisMax(readings: (number | null)[] | undefined): number {
  const numbers = readings?.filter(valid) ?? [];
  const highest = numbers.length ? Math.max(...numbers) : 0;
  return Math.max(100, Math.ceil((highest + 5) / 50) * 50);
}

function aqiBandBackground(axisMax: number): string {
  let start = 0;
  const stops: string[] = [];
  for (const stage of AQI_STAGES) {
    const end = Math.min(axisMax, stage.max);
    if (end <= start) continue;
    const tone = withOpacity(stage.color, end <= 100 ? 0.35 : 0.26);
    stops.push(
      tone + ' ' + (100 * start / axisMax).toFixed(2) + '%',
      tone + ' ' + (100 * end / axisMax).toFixed(2) + '%',
    );
    start = end;
    if (start >= axisMax) break;
  }
  return 'linear-gradient(to top, ' + stops.join(', ') + ')';
}

// Kullanıcının örnek görselindeki 6 renkli yüz ikonundan kırpılıp küçültülmüş sprite.
// Bir PNG verisi CSS arka planıyla tek bir ikon olarak gösterilir.
const AQI_FACE_SPRITE = 'data:image/png;base64,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';

// Yalnızca eczane çevresindeki dekorasyon için: aynı altı AQI yüzü,
// renkli zeminleri korunmuş, göz ve ağız çizgileri koyu renge dönüştürülmüş.
const AQI_FACE_DARK_SPRITE = 'data:image/png;base64,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';

export function AqiFace({ index, size = 40, label, darkDetails = false }: {
  index: number;
  size?: number;
  label: string;
  darkDetails?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-block shrink-0"
      style={{
        width: size,
        height: size,
        backgroundImage: 'url("' + (darkDetails ? AQI_FACE_DARK_SPRITE : AQI_FACE_SPRITE) + '")',
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
  bandBackground,
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
  bandBackground?: string;
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
      {bandBackground && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-0 rounded-sm"
          style={{
            left: gridLeft,
            right: gridRight,
            top: gridTop,
            bottom: gridBottom,
            background: bandBackground,
          }}
        />
      )}
      <div ref={host} role="img" aria-label={label} className="relative z-[1] h-full w-full" />
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

export function IspartaAirPollenBanner({
  onAqiChange,
  embedded = false,
}: {
  onAqiChange?: (aqi: number | null) => void;
  embedded?: boolean;
} = {}) {
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
          // Eczane cevresindeki dekor mevcut hava kalitesi ile ayni kaynagi kullanir.
          // Yeniden API sorgusu yapmaya gerek yoktur.
          const latestAqi = value.current?.us_aqi;
          onAqiChange?.(valid(latestAqi) ? latestAqi : null);
        }
      } catch {
        if (active) {
          setData(null);
          setFailed(true);
          // Model verisine ulasilamazsa sahte durum/renk gostermeyelim.
          onAqiChange?.(null);
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
  }, [onAqiChange]);

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
  const maxAqi = aqiAxisMax(data?.hourly?.us_aqi);
  const airBands = aqiBandBackground(maxAqi);
  const airOption = sevenDayAirOption(
    days, data?.hourly?.us_aqi, animate,
    status?.ink ?? TEAL,
    status?.color ?? TEAL,
    maxAqi,
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
      className={`mx-auto max-w-5xl overflow-hidden rounded-2xl border bg-white shadow-sm${embedded ? '' : ' mb-8'}`}
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
            <span className="ml-auto text-[11px] text-slate-500" title="Değerler ve renkler ABD AQI sınıflandırmasına göredir. AQI bir ölçüm birimi değil, hava kalitesi endeksidir.">Hava Kalitesi İndeksi</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[56px] font-extrabold leading-none tabular-nums sm:text-[64px]"
              style={{ color: status?.ink ?? '#64748B' }}>
              {loading ? '…' : aqi === null ? '—' : Math.round(aqi)}
            </span>
            {status ? (
              <div className="flex min-w-0 items-center gap-2">
                <AqiFace index={status.icon} size={62} label={status.name} darkDetails={status.icon < 3} />
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
                bandBackground={airBands}
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
            <div className="flex flex-wrap items-center gap-1" aria-label="Hava kalitesi endeksinin altı renkli durum simgesi">
              {AQI_STAGES.map(stage => (
                <span key={stage.icon} className="rounded-md p-0.5"
                  style={{
                    border: status?.icon === stage.icon ? '1.5px solid ' + stage.ink : '1.5px solid transparent',
                    background: status?.icon === stage.icon ? withOpacity(stage.color, 0.18) : 'transparent',
                  }}>
                  <AqiFace index={stage.icon} size={30} label={stage.range + ': ' + stage.name} darkDetails={stage.icon < 3} />
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
