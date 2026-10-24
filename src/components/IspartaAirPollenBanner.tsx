import React, { useEffect, useState } from 'react';
import { Leaf, MapPin, Wind } from 'lucide-react';

// Isparta Merkez (sabit koordinat); model tahmini, istasyon olcumu degil.
const URL = 'https://air-quality-api.open-meteo.com/v1/air-quality?' + new URLSearchParams({
  latitude: '37.7606',
  longitude: '30.5566',
  current: 'european_aqi,pm2_5,grass_pollen,olive_pollen,ragweed_pollen,mugwort_pollen,birch_pollen,alder_pollen',
  hourly: 'european_aqi',
  forecast_days: '2',
  timezone: 'Europe/Istanbul',
}).toString();

interface Current {
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

interface ResponseData {
  current?: Current;
  hourly?: { time?: string[]; european_aqi?: (number | null)[] };
  error?: boolean;
}

const TYPES = [
  { key: 'grass_pollen', label: 'Çim' },
  { key: 'olive_pollen', label: 'Zeytin' },
  { key: 'ragweed_pollen', label: 'Ambrosia' },
  { key: 'mugwort_pollen', label: 'Pelin' },
  { key: 'birch_pollen', label: 'Huş' },
  { key: 'alder_pollen', label: 'Kızılağaç' },
] as const;

const valid = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

function category(n: number | null) {
  if (n === null) return { name: 'Veri yok', color: '#CBD5E1' };
  if (n <= 20) return { name: 'İyi', color: '#6EE7B7' };
  if (n <= 40) return { name: 'Makul', color: '#BEF264' };
  if (n <= 60) return { name: 'Orta', color: '#FCD34D' };
  if (n <= 80) return { name: 'Kötü', color: '#FDBA74' };
  if (n <= 100) return { name: 'Çok kötü', color: '#FDA4AF' };
  return { name: 'Aşırı kötü', color: '#D8B4FE' };
}

function HourlyTrend({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="flex h-14 items-center justify-center text-xs text-slate-400">Grafik yok</div>;
  }
  // Sifirdan baslayan eksen, ani degisimi gereksiz abartmaz.
  const scale = Math.max(50, ...values);
  const points = values.map((v, i) =>
    String(i * 180 / (values.length - 1)) + ',' + String(57 - v * 50 / scale)
  ).join(' ');
  return (
    <svg viewBox="0 0 180 62" preserveAspectRatio="none" className="h-14 w-full"
      role="img" aria-label="Önümüzdeki saatlerin hava kalitesi tahmin eğilimi">
      <path d="M0 57 H180" stroke="#94A3B8" strokeOpacity="0.27" />
      <polyline points={points} fill="none" stroke="#67E8F9" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function IspartaAirPollenBanner() {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let abort: AbortController | null = null;
    async function update() {
      abort?.abort();
      abort = new AbortController();
      const controller = abort;
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(URL, { signal: controller.signal });
        if (!response.ok) throw new Error('Fetch failed');
        const body = await response.json() as ResponseData;
        const time = body.current?.time;
        if (body.error || !time || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time)) throw new Error('Missing timestamp');

        // Turkiye sabit UTC+3; eski tarihteki tahmini guncelmis gibi gosterme.
        const millis = Date.parse(time + '+03:00');
        if (!Number.isFinite(millis) || millis < Date.now() - 6 * 3600000 || millis > Date.now() + 2 * 3600000)
          throw new Error('Outdated model data');

        if (active) { setData(body); setFailed(false); }
      } catch {
        if (active) { setData(null); setFailed(true); }
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }
    void update();
    const interval = window.setInterval(() => { void update(); }, 45 * 60000);
    return () => { active = false; window.clearInterval(interval); abort?.abort(); };
  }, []);

  const current = data?.current;
  const aqi = valid(current?.european_aqi) ? current.european_aqi : null;
  const pm25 = valid(current?.pm2_5) ? current.pm2_5 : null;
  const level = category(aqi);

  const times = data?.hourly?.time || [];
  const values = data?.hourly?.european_aqi || [];
  const from = current?.time ? times.findIndex(t => t >= current.time!) : -1;
  const trend = from < 0 ? [] : values.slice(from, from + 12).filter(valid);

  const pollen = TYPES
    .flatMap(type => {
      const value = current?.[type.key];
      return valid(value) ? [{ label: type.label, value }] : [];
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  const maxPollen = Math.max(1, ...pollen.map(item => item.value));

  return (
    <section aria-label="Isparta Merkez hava kalitesi ve polen tahmini"
      className="relative mx-auto mb-8 max-w-5xl overflow-hidden rounded-3xl border border-slate-700/40 bg-gradient-to-br from-[#0C2834] via-[#15363C] to-[#113C37] p-5 text-white shadow-lg sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <MapPin size={17} className="text-teal-300" aria-hidden="true" />
            <span>Isparta Merkez</span><span className="text-slate-400">/</span><span>Açık hava özeti</span>
          </div>
          <span className="text-xs text-slate-300">
            {loading ? 'Yükleniyor…' : failed ? 'Model verisi kullanılamıyor' : current?.time?.slice(11, 16) + ' TSİ · Model tahmini'}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-2">
              <Wind size={19} className="text-cyan-200" aria-hidden="true" />
              <h2 className="m-0 text-base font-semibold text-white">Hava kalitesi</h2>
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold leading-none tabular-nums" style={{ color: level.color }}>
                    {loading ? '…' : aqi === null ? '—' : Math.round(aqi)}
                  </span>
                  <span className="mb-1 text-xs text-slate-300">Avrupa AQI</span>
                </div>
                <p className="mb-0 mt-2 text-sm font-semibold" style={{ color: level.color }}>
                  {loading ? 'Yükleniyor' : failed ? 'Veri alınamadı' : level.name}
                </p>
              </div>
              <div className="w-36 max-w-[43%]">
                <p className="mb-1 text-right text-[11px] text-slate-300">12 saatlik eğilim</p>
                <HourlyTrend values={trend} />
              </div>
            </div>
            <p className="mb-0 mt-3 border-t border-white/10 pt-3 text-xs text-slate-300">
              PM2.5: <span className="font-semibold text-white">
                {pm25 === null ? '—' : pm25.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
              </span> µg/m³
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center gap-2">
              <Leaf size={19} className="text-lime-200" aria-hidden="true" />
              <h2 className="m-0 text-base font-semibold text-white">Polen tahmini</h2>
            </div>
            {pollen.length > 0 ? (
              <div className="mt-3 space-y-2.5">
                {pollen.map(item => (
                  <div key={item.label} className="grid grid-cols-[74px_minmax(0,1fr)_88px] items-center gap-2 text-xs">
                    <span className="truncate text-slate-200">{item.label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-lime-300"
                        style={{ width: String(item.value / maxPollen * 100) + '%' }} />
                    </div>
                    <span className="text-right tabular-nums text-white">
                      {item.value.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
                      <span className="text-slate-300"> tane/m³</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex min-h-24 items-center rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-3 text-sm leading-relaxed text-slate-200">
                {loading ? 'Polen tahmini yükleniyor…' : failed ? 'Polen verisi alınamadı.' : 'Bu tarih veya bölge için polen tahmini bulunmuyor (mevsimsel olabilir).'}
              </div>
            )}
            {pollen.length > 0 && (
              <p className="mb-0 mt-3 text-[11px] text-slate-300">
                Tür bazında tahmini yoğunluk; alerji riski puanı değildir.
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <span>İstasyon ölçümü değil; CAMS model tahminidir.</span>
          <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank"
            rel="noopener noreferrer" className="font-medium text-teal-200 underline underline-offset-2 hover:text-white">
            Veri: Open-Meteo / CAMS · CC BY 4.0
          </a>
        </div>
      </div>
    </section>
  );
}
