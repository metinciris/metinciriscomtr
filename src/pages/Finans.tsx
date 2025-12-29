import React, { useEffect, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { TrendingUp, PieChart, Landmark, Percent, Home, Coins } from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// --- Veri Setleri (Türkiye Ekonomi Göstergeleri 2024-2025) ---
const fascinationData = [
    { ay: 'Oca', faiz: 45, enflasyon: 64.8, kira: 54.7 },
    { ay: 'Şub', faiz: 45, enflasyon: 67.1, kira: 55.9 },
    { ay: 'Mar', faiz: 50, enflasyon: 68.5, kira: 57.5 },
    { ay: 'Nis', faiz: 50, enflasyon: 69.8, kira: 59.6 },
    { ay: 'May', faiz: 50, enflasyon: 75.4, kira: 62.5 },
    { ay: 'Haz', faiz: 50, enflasyon: 71.6, kira: 65.1 },
    { ay: 'Tem', faiz: 50, enflasyon: 61.8, kira: 65.9 },
    { ay: 'Ağu', faiz: 50, enflasyon: 52.0, kira: 70.0 },
    { ay: 'Eyl', faiz: 50, enflasyon: 49.4, kira: 63.5 },
    { ay: 'Eki', faiz: 50, enflasyon: 48.6, kira: 62.8 },
    { ay: 'Kas', faiz: 50, enflasyon: 47.1, kira: 62.0 },
    { ay: 'Ara', faiz: 50, enflasyon: 44.8, kira: 62.9 },
];

// --- Yardımcı Bileşenler ---

// Recharts Trend Grafiği (Ekonomi verileri için - Reklamsız ve Profesyonel)
const TrendChart = ({ title, dataKey, color, unit, value }: { title: string, dataKey: string, color: string, unit: string, value: string }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[320px]" style={{ backgroundColor: 'white' }}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{title}</h3>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#0f172a' }}>{unit}{value}</p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: color + '20', color: color }}>
                    {dataKey === 'faiz' && <Landmark size={20} />}
                    {dataKey === 'enflasyon' && <Percent size={20} />}
                    {dataKey === 'kira' && <Home size={20} />}
                </div>
            </div>
            <div className="flex-1 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fascinationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="ay"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip
                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(val: number) => [`${unit}${val}`, title]}
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#color-${dataKey})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// TradingView Widget (Linkler maskelenmiş)
const RobustTradingViewWidget = ({ symbol, title, height = 300, type = "mini" }: { symbol: string; title: string, height?: number, type?: "mini" | "symbol" }) => {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;

        if (type === "mini") {
            script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
            script.innerHTML = JSON.stringify({
                "symbol": symbol,
                "width": "100%",
                "height": height,
                "locale": "tr",
                "dateRange": "12M",
                "colorTheme": "light",
                "isTransparent": true,
                "autosize": true,
                "largeChartUrl": ""
            });
        } else {
            script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
            script.innerHTML = JSON.stringify({
                "symbols": [[title, symbol]],
                "chartOnly": true,
                "width": "100%",
                "height": height,
                "locale": "tr",
                "colorTheme": "light",
                "gridLineColor": "rgba(240, 243, 250, 0)",
                "fontColor": "#787B86",
                "isTransparent": true,
                "autosize": true,
                "container_id": "tv_chart_" + symbol.replace(":", "_")
            });
        }

        if (container.current) {
            container.current.innerHTML = '';
            container.current.appendChild(script);
        }
    }, [symbol, title, height, type]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 overflow-hidden" style={{ backgroundColor: 'white' }}>
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#1e293b' }}>
                {title}
            </h3>
            <div className="relative" style={{ height: height - 50, overflow: 'hidden' }}>
                <div id={"tv_chart_" + symbol.replace(":", "_")} className="tradingview-widget-container" ref={container}></div>

                {/* Link ve Branding Maskeleme (Beyaz Overlay) */}
                <div className="absolute bottom-0 left-0 right-0 h-[45px] bg-white z-10"></div>
                <div className="absolute top-0 right-0 w-[50px] h-[40px] bg-white z-10"></div>
            </div>
        </div>
    );
};

export function Finans() {
    return (
        <PageContainer>
            {/* Üst Bilgi Paneli */}
            <div
                className="p-12 mb-8 rounded-xl shadow-lg border-b-4 border-slate-800"
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: 'white'
                }}
            >
                <div className="flex items-center gap-5 mb-5">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl">
                        <TrendingUp size={36} color="white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold m-0 leading-tight" style={{ color: 'white' }}>Finansal Göstergeler</h1>
                        <p className="text-indigo-200 font-medium m-0 opacity-80">Canlı Veriler & Yıllık Trend Analizleri</p>
                    </div>
                </div>
                <p className="max-w-3xl text-lg opacity-90 leading-relaxed font-light" style={{ color: 'white' }}>
                    Türkiye ekonomisindeki kritik makro göstergeleri (Faiz, Enflasyon, Kira) ve piyasalardan canlı borsa, döviz, altın verilerini tek bir ekrandan takip edin.
                </p>
            </div>

            {/* Ekonomi Trend Grafikleri (RECHARTS - Reklamsız, Tertemiz) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <TrendChart
                    title="Politika Faizi (TCMB)"
                    dataKey="faiz"
                    color="#3b82f6"
                    unit="%"
                    value="50.0"
                />
                <TrendChart
                    title="Yıllık Enflasyon (TÜFE)"
                    dataKey="enflasyon"
                    color="#f97316"
                    unit="%"
                    value="44.8"
                />
                <TrendChart
                    title="Kira Artış Oranı"
                    dataKey="kira"
                    color="#22c55e"
                    unit="%"
                    value="62.9"
                />
            </div>

            {/* Canlı Piyasa Grafikleri (TRADINGVIEW - Canlı & Maskelenmiş) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {/* BIST 100 - Symbol Overview widget'ı borsa verileri için daha iyidir */}
                <RobustTradingViewWidget
                    symbol="BINANCE:BIST100" // Daha yüksek erişilebilirlik için Binance feed'i deniyoruz
                    title="BIST 100"
                    height={350}
                    type="symbol"
                />
                <RobustTradingViewWidget
                    symbol="FX:USDTRY"
                    title="Dolar / TL"
                    height={350}
                />
                <RobustTradingViewWidget
                    symbol="OANDA:XAUUSD"
                    title="Ons Altın (USD)"
                    height={350}
                />
                <RobustTradingViewWidget
                    symbol="BINANCE:BTCUSDT"
                    title="Bitcoin (USDT)"
                    height={350}
                />
                <RobustTradingViewWidget
                    symbol="FX_IDC:XAUTRYG"
                    title="Gram Altın (TL)"
                    height={350}
                />

                <div className="bg-slate-50 p-8 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center text-slate-400 h-[300px]">
                    <PieChart size={52} className="mb-4 opacity-10" />
                    <p className="font-semibold text-slate-500">Gelecek Veriler</p>
                    <span className="text-xs max-w-[200px]">Euro/TL, Gümüş, Petrol ve Sektörel Endeksler üzerinde çalışıyoruz.</span>
                </div>
            </div>

            {/* Bilgi ve Kaynaklar Paneli */}
            <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col md:flex-row gap-8 items-center md:items-start mb-12">
                <div className="p-5 bg-white rounded-2xl shadow-sm border border-blue-100">
                    <Coins className="text-blue-600" size={32} />
                </div>
                <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-3">Veri Metodolojisi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                <strong>Ekonomik Göstergeler (Üst Sıra):</strong> Faiz, Enflasyon ve Kira artış verileri Türkiye resmi kurumlarının (TCMB, TÜİK) verilerine dayanır. Reklam ve link içermemesi için <strong>Recharts</strong> ile özel olarak görselleştirilmiştir.
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                <strong>Canlı Piyasalar (Alt Sıra):</strong> Döviz, Altın ve Kripto para verileri TradingView üzerinden gerçek zamanlı aktarılmaktadır. Branding linkleri kullanıcı deneyimini bozmaması adına maskelenmiştir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
