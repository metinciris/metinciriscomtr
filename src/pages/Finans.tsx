import React, { useEffect, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { TrendingUp, Info, ArrowUpRight } from 'lucide-react';


// --- Canlı Veri Notu ---
// Veriler TradingView piyasa kaynakları ve Resmi Kurumlar (TCMB, TÜİK) üzerinden alınmaktadır.
// Piyasa bazlı göstergeler (Döviz, Altın, Tahvil) canlıdır; Makro veriler (Enflasyon, Faiz) periyodik güncellenir.

// --- Robust TradingView Widget (with Link Masking) ---
const RobustTradingViewWidget = ({ symbol, title, height = 280 }: { symbol: string; title: string; height?: number }) => {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "symbol": symbol,
            "width": "100%",
            "height": height,
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
    }, [symbol, height]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 relative group overflow-hidden hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                    {title}
                </span>
                <ArrowUpRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </h3>
            <div className="tradingview-widget-container" ref={container}></div>
            {/* Link Masking Layer */}
            <div className="absolute inset-0 bg-transparent z-10 cursor-default" />
        </div>
    );
};

export function Finans() {
    return (
        <PageContainer>
            {/* Üst Bilgi Paneli */}
            <div
                className="p-12 mb-10 rounded-3xl shadow-xl border-b-8 border-indigo-900/20"
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: 'white'
                }}
            >
                <div className="flex items-center gap-6 mb-6">
                    <div className="p-5 bg-indigo-600 rounded-3xl shadow-2xl rotate-3">
                        <TrendingUp size={42} color="white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black m-0 tracking-tight" style={{ color: 'white' }}>Finans Paneli</h1>
                        <p className="text-indigo-300 text-xl font-medium m-0 opacity-90">Ekonomik Nabız & Piyasa Verileri</p>
                    </div>
                </div>
                <p className="max-w-3xl text-xl opacity-80 leading-relaxed font-normal" style={{ color: 'white' }}>
                    Türkiye ekonomisinin yönünü tayin eden resmi makro veriler ile küresel piyasalardan anlık döviz, altın ve emtia fiyatlarını takip edin.
                </p>
            </div>

            {/* Bölüm: Piyasa Bazlı Öncü Göstergeler (Canlı) */}
            <div className="mb-12">
                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <TrendingUp size={20} color="white" />
                    </div>
                    Piyasa Bazlı Öncü Göstergeler (Canlı)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RobustTradingViewWidget symbol="FX_IDC:USDTRY" title="USD / TRY Kuru" />
                    <RobustTradingViewWidget symbol="FX_IDC:XAUTRYG" title="Gram Altın (TL)" />
                    <RobustTradingViewWidget symbol="FX_IDC:EURTRY" title="Euro / TL" />
                    <RobustTradingViewWidget symbol="TVC:GOLD" title="Ons Altın (USD)" />
                    <RobustTradingViewWidget symbol="TVC:USOIL" title="Ham Petrol (Brent)" />
                    <RobustTradingViewWidget symbol="BITSTAMP:BTCUSD" title="Bitcoin / USD" />
                </div>

            </div>

            {/* Bilgilendirme Paneli */}
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 mb-12">
                <div className="flex items-start gap-4 text-slate-600 leading-relaxed text-sm">
                    <Info className="text-indigo-600 shrink-0 mt-1" size={20} />
                    <p>
                        Bu sayfada sunulan <strong>Canlı Piyasa Verileri</strong> (Döviz, Altın, Emtia, Kripto) TradingView altyapısı ile global piyasalardan anlık olarak çekilmektedir. Buradaki bilgiler yalnızca bilgilendirme amaçlıdır, yatırım tavsiyesi değildir ve doğruluğu garanti edilmez.
                    </p>
                </div>
            </div>
        </PageContainer>
    );
}
