import React, { useEffect, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { TrendingUp, PieChart, Landmark, Percent, Home, Coins, Info } from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// --- Gerçek 2024 Türkiye Ekonomi Verileri ---
const economyData = [
    { ay: 'Oca 24', faiz: 45.00, enflasyon: 64.77, kira: 54.68 },
    { ay: 'Şub 24', faiz: 45.00, enflasyon: 67.07, kira: 55.89 },
    { ay: 'Mar 24', faiz: 50.00, enflasyon: 68.50, kira: 57.52 },
    { ay: 'Nis 24', faiz: 50.00, enflasyon: 69.80, kira: 59.55 },
    { ay: 'May 24', faiz: 50.00, enflasyon: 75.45, kira: 62.52 },
    { ay: 'Haz 24', faiz: 50.00, enflasyon: 71.60, kira: 65.08 },
    { ay: 'Tem 24', faiz: 50.00, enflasyon: 61.78, kira: 65.93 },
    { ay: 'Ağu 24', faiz: 50.00, enflasyon: 51.97, kira: 69.96 },
    { ay: 'Eyl 24', faiz: 50.00, enflasyon: 49.38, kira: 63.45 },
    { ay: 'Eki 24', faiz: 50.00, enflasyon: 48.58, kira: 62.79 },
    { ay: 'Kas 24', faiz: 50.00, enflasyon: 47.09, kira: 61.98 },
    { ay: 'Ara 24', faiz: 50.00, enflasyon: 44.38, kira: 62.91 },
];

// --- Recharts Trend Grafiği ---
const TrendChart = ({ title, dataKey, color, unit, value, date }: {
    title: string, dataKey: string, color: string, unit: string, value: string, date: string
}) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[320px]" style={{ backgroundColor: 'white' }}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{title}</h3>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#0f172a' }}>{unit}{value}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mt-1">
                        Son Veri: <span className="text-slate-500 font-bold">{date}</span>
                    </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: color + '20', color: color }}>
                    {dataKey === 'faiz' && <Landmark size={20} />}
                    {dataKey === 'enflasyon' && <Percent size={20} />}
                    {dataKey === 'kira' && <Home size={20} />}
                </div>
            </div>
            <div className="flex-1 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={economyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                            formatter={(val: number) => [`${unit}${val.toFixed(2)}`, title]}
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

// --- TradingView Widget (Linkler maskelenmiş) ---
const FinanceWidget = ({ symbol, title, height = 300 }: {
    symbol: string; title: string, height?: number
}) => {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
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

        if (container.current) {
            container.current.innerHTML = '';
            container.current.appendChild(script);
        }
    }, [symbol, title, height]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 overflow-hidden" style={{ backgroundColor: 'white' }}>
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#1e293b' }}>
                {title}
            </h3>
            <div className="relative" style={{ height: height - 50, overflow: 'hidden' }}>
                <div className="tradingview-widget-container" ref={container}></div>
                {/* Link Maskeleme */}
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
                    Türkiye ekonomisindeki kritik makro göstergeleri (Faiz, Enflasyon, Kira) ve piyasalardan canlı döviz, altın, emtia verilerini tek bir ekrandan takip edin.
                </p>
            </div>

            {/* Ekonomi Trend Grafikleri (RECHARTS - Gerçek 2024 Verileri) */}
            <div className="flex flex-col mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Ekonomik Göstergeler</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <TrendChart
                    title="Politika Faizi (TCMB)"
                    dataKey="faiz"
                    color="#3b82f6"
                    unit="%"
                    value="50.00"
                    date="Aralık 2024"
                />
                <TrendChart
                    title="Yıllık Enflasyon (TÜFE)"
                    dataKey="enflasyon"
                    color="#f97316"
                    unit="%"
                    value="44.38"
                    date="Aralık 2024"
                />
                <TrendChart
                    title="Kira Artış Oranı"
                    dataKey="kira"
                    color="#22c55e"
                    unit="%"
                    value="62.91"
                    date="Aralık 2024"
                />
            </div>

            {/* Döviz Kurları */}
            <h2 className="text-2xl font-bold text-slate-800 mb-4 mt-12">Döviz Kurları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <FinanceWidget symbol="FX:USDTRY" title="Dolar / TL" height={300} />
                <FinanceWidget symbol="FX:EURTRY" title="Euro / TL" height={300} />
                <FinanceWidget symbol="BINANCE:BTCUSDT" title="Bitcoin (USDT)" height={300} />
            </div>

            {/* Altın & Gümüş */}
            <h2 className="text-2xl font-bold text-slate-800 mb-4 mt-12">Altın & Gümüş</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <FinanceWidget symbol="OANDA:XAUUSD" title="Ons Altın (USD)" height={300} />
                <FinanceWidget symbol="FX_IDC:XAUTRYG" title="Gram Altın (TL)" height={300} />
                <FinanceWidget symbol="OANDA:XAGUSD" title="Gümüş (USD)" height={300} />
            </div>

            {/* Emtia */}
            <h2 className="text-2xl font-bold text-slate-800 mb-4 mt-12">Emtia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
                <FinanceWidget symbol="TVC:USOIL" title="Ham Petrol (WTI)" height={300} />
                <FinanceWidget symbol="TVC:GOLD" title="Altın Vadeli (Comex)" height={300} />
            </div>



            {/* Detaylı Bilgilendirme Paneli */}
            <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200 shadow-lg mb-12">
                <div className="flex items-start gap-6">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-blue-200">
                        <Info className="text-blue-600" size={32} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            Veri Kaynakları & Metodoloji
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100">
                                <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <Landmark size={18} className="text-blue-600" />
                                    Ekonomik Göstergeler
                                </h5>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    <strong>Politika Faizi:</strong> T.C. Merkez Bankası (TCMB) resmi verileri<br />
                                    <strong>Enflasyon (TÜFE):</strong> Türkiye İstatistik Kurumu (TÜİK) aylık yayınları<br />
                                    <strong>Kira Artış Oranı:</strong> 6098 sayılı Türk Borçlar Kanunu'na göre hesaplanmış 12 aylık TÜFE ortalaması
                                </p>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100">
                                <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-green-600" />
                                    Piyasa Verileri
                                </h5>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    <strong>Döviz, Altın, Emtia:</strong> TradingView platformu üzerinden gerçek zamanlı veri akışı<br />
                                    <strong>Güncelleme:</strong> Piyasa saatleri içinde canlı, borsa verileri 15 dakika gecikmeli olabilir
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
                            <div className="flex items-start gap-3">
                                <Coins className="text-amber-600 mt-1 flex-shrink-0" size={24} />
                                <div>
                                    <h5 className="font-bold text-amber-900 mb-2">⚠️ Önemli Yasal Uyarı</h5>
                                    <p className="text-amber-800 text-sm leading-relaxed">
                                        Bu sayfada yer alan tüm bilgiler <strong>yalnızca bilgilendirme amaçlıdır</strong> ve hiçbir şekilde
                                        <strong> yatırım danışmanlığı veya alım-satım tavsiyesi niteliği taşımamaktadır</strong>.
                                        Yatırım kararlarınızı vermeden önce mutlaka profesyonel bir finansal danışmana başvurunuz.
                                        Veriler üçüncü taraf kaynaklardan alınmakta olup, doğruluğu garanti edilmemektedir.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
