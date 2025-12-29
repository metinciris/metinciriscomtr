import React, { useEffect, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { TrendingUp, PieChart, Landmark, Percent, Home, Coins } from 'lucide-react';

// Finansal Veri Tipleri
interface FinanceData {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: React.ReactNode;
    color: string;
}

// Sembol bazlı TradingView Widget'ı
const TradingViewWidget = ({ symbol, title }: { symbol: string; title: string }) => {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "symbol": symbol,
            "width": "100%",
            "height": "220",
            "locale": "tr",
            "dateRange": "12M",
            "colorTheme": "light",
            "isTransparent": false,
            "autosize": true,
            "largeChartUrl": ""
        });

        if (container.current) {
            container.current.innerHTML = '';
            container.current.appendChild(script);
        }
    }, [symbol]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3" style={{ backgroundColor: 'white' }}>
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#1e293b' }}>
                {title}
            </h3>
            <div className="tradingview-widget-container" ref={container}></div>
        </div>
    );
};

// TradingView Tekli Değer Widget'ı (Ekonomi verileri için)
const TradingViewQuoteWidget = ({ symbol, title, color }: { symbol: string; title: string, color: string }) => {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "symbol": symbol,
            "width": "100%",
            "colorTheme": "light",
            "isTransparent": true,
            "locale": "tr"
        });

        if (container.current) {
            container.current.innerHTML = '';
            container.current.appendChild(script);
        }
    }, [symbol]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2" style={{ backgroundColor: 'white' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                {title}
            </h3>
            <div className="tradingview-widget-container" ref={container}></div>
        </div>
    );
};

// Ekonomi Veri Kartı (Manuel veriler için)
const EconomyCard = ({ data }: { data: FinanceData }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between min-h-[140px]" style={{ backgroundColor: 'white' }}>
        <div>
            <p className="text-slate-500 text-sm font-medium mb-1" style={{ color: '#64748b' }}>{data.title}</p>
            <h3 className="text-2xl font-bold text-slate-900" style={{ color: '#0f172a' }}>{data.value}</h3>
            <p className="text-sm mt-1 flex items-center gap-1" style={{ color: data.isPositive ? '#16a34a' : '#dc2626' }}>
                {data.change}
            </p>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: data.color.replace('bg-[', '').replace(']', ''), color: 'white' }}>
            {data.icon}
        </div>
    </div>
);

export function Finans() {
    // Statik Veriler (Kira artışı gibi özel hesaplamalar için)
    const manualEconomyData: FinanceData[] = [
        {
            title: "Kira Artış Oranı (Aralık)",
            value: "%62.91",
            change: "12 Aylık TÜFE Ort.",
            isPositive: false,
            icon: <Home size={24} />,
            color: "#27AE60"
        }
    ];

    return (
        <PageContainer>
            <div
                className="p-12 mb-8 rounded-xl shadow-lg"
                style={{
                    background: 'linear-gradient(to right, #2C3E50, #34495E)',
                    color: 'white'
                }}
            >
                <h1 className="mb-4 text-4xl font-bold" style={{ color: 'white' }}>Finans Paneli</h1>
                <p className="max-w-3xl text-lg" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Türkiye ekonomisi ve piyasalara dair canlı veriler ve 1 yıllık gelişim grafikleri.
                </p>
            </div>

            {/* Ekonomi Özet Kartları (Otomatik & Manuel) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <TradingViewQuoteWidget
                    symbol="ECONOMICS:TRINTR"
                    title="Politika Faizi (TCMB)"
                    color="bg-[#2C3E50]"
                />
                <TradingViewQuoteWidget
                    symbol="ECONOMICS:TRIRYY"
                    title="Yıllık Enflasyon (TÜFE)"
                    color="bg-[#E67E22]"
                />
                {manualEconomyData.map((data, idx) => (
                    <EconomyCard key={idx} data={data} />
                ))}
            </div>

            {/* Canlı Grafikler Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TradingViewWidget symbol="BIST:XU100" title="BIST 100 - Borsa İstanbul" />
                <TradingViewWidget symbol="FX:USDTRY" title="Dolar / TL" />
                <TradingViewWidget symbol="OANDA:XAUUSD" title="Ons Altın (USD)" />
                <TradingViewWidget symbol="BINANCE:BTCUSDT" title="Bitcoin / USDT" />
                <TradingViewWidget symbol="FX_IDC:XAUTRYG" title="Gram Altın (TL)" />
                <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center text-slate-500">
                    <PieChart size={48} className="mb-2 opacity-20" />
                    <p className="font-medium text-sm">Diğer Göstergeler Yakında</p>
                    <span className="text-xs">Euro, Gümüş ve Sanayi Endeksleri</span>
                </div>
            </div>

            <div className="mt-12 p-6 bg-amber-50 rounded-xl border border-amber-100 flex gap-4 items-start">
                <Coins className="text-amber-600 mt-1" size={24} />
                <div>
                    <h4 className="font-semibold text-amber-900">Bilgi Notu</h4>
                    <p className="text-amber-800 text-sm leading-relaxed">
                        Grafikler ve faiz/enflasyon verileri TradingView tarafından otomatik sağlanmaktadır.
                        Borsa verileri 15 dakika gecikmeli olabilir.
                        Kira artış oranları, enflasyon verisine bağlı olarak yasal mevzuat gereği (12 aylık TÜFE ortalaması) hesaplanmaktadır.
                        Bu sayfa bilgilendirme amaçlıdır, yatırım tavsiyesi içermez.
                    </p>
                </div>
            </div>
        </PageContainer>
    );
}
