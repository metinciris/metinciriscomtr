import React, { useEffect, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { TrendingUp, Landmark, Info, PieChart, Percent, Home, Coins, ArrowUpRight, Activity } from 'lucide-react';


// --- Canlı Veri Notu ---
// Veriler TradingView piyasa kaynakları ve Resmi Kurumlar (TCMB, TÜİK) üzerinden alınmaktadır.
// Piyasa bazlı göstergeler (Döviz, Altın, Tahvil) canlıdır; Makro veriler (Enflasyon, Faiz) periyodik güncellenir.

// --- Macro Indicator Card (For Official Static Data) ---
const MacroIndicatorCard = ({ title, value, unit, date, icon: Icon, colorClass }: { title: string; value: string; unit: string; date: string; icon: any; colorClass: string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${colorClass.replace('text-', 'bg-')}`} />
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('-600', '-50')} ${colorClass}`}>
                    <Icon size={24} />
                </div>
                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{date}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800">{value}</span>
                <span className="text-lg font-bold text-slate-400">{unit}</span>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Info size={14} />
            Resmi Kurum Verisi (TCMB/TÜİK)
        </div>
    </div>
);

// --- Robust TradingView Widget (with Link Masking) ---
const RobustTradingViewWidget = ({ symbol, title, height = 220 }: { symbol: string; title: string; height?: number }) => {
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

            {/* Bölüm: Resmi Makro Göstergeler */}
            <div className="mb-12">
                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Landmark size={20} color="white" />
                    </div>
                    Resmi Makro Göstergeler
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MacroIndicatorCard
                        title="Politika Faizi (TCMB)"
                        value="38.00"
                        unit="%"
                        date="Aralık 2025"
                        icon={Percent}
                        colorClass="text-blue-600"
                    />
                    <MacroIndicatorCard
                        title="Yıllık Enflasyon (TÜFE)"
                        value="31.07"
                        unit="%"
                        date="Kasım 2025"
                        icon={Activity}
                        colorClass="text-rose-600"
                    />
                    <MacroIndicatorCard
                        title="İşsizlik Oranı"
                        value="9.30"
                        unit="%"
                        date="Ekim 2025"
                        icon={PieChart}
                        colorClass="text-amber-600"
                    />
                </div>
            </div>

            {/* Bölüm: Piyasa Bazlı Öncü Göstergeler */}
            <div className="mb-12">
                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <TrendingUp size={20} color="white" />
                    </div>
                    Piyasa Bazlı Öncü Göstergeler (Canlı)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <RobustTradingViewWidget symbol="TVC:TR10Y" title="TR 10Y Tahvil Faizi" height={280} />
                    <RobustTradingViewWidget symbol="FX_IDC:USDTRY" title="USD / TRY Kuru" height={280} />
                    <RobustTradingViewWidget symbol="FX_IDC:XAUTRYG" title="Gram Altın (TL)" height={280} />
                </div>
                <p className="mt-4 text-sm text-slate-500 italic">
                    * Tahvil faizleri, piyasanın gelecek enflasyon ve risk beklentisini yansıtan "proxy" bir göstergedir.
                </p>
            </div>

            {/* Diğer Kurlar & Emtia */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">Euro & Kripto</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <RobustTradingViewWidget symbol="FX_IDC:EURTRY" title="Euro / TL" />
                        <RobustTradingViewWidget symbol="BITSTAMP:BTCUSD" title="Bitcoin / USD" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">Emtia & Ons</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <RobustTradingViewWidget symbol="TVC:GOLD" title="Ons Altın (USD)" />
                        <RobustTradingViewWidget symbol="TVC:USOIL" title="Ham Petrol (Brent)" />
                    </div>
                </div>
            </div>

            {/* Bilgilendirme Paneli */}
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 mb-12">
                <div className="flex items-start gap-4 text-slate-600 leading-relaxed text-sm">
                    <Info className="text-indigo-600 shrink-0 mt-1" size={20} />
                    <p>
                        Bu sayfada sunulan <strong>Resmi Makro Veriler</strong> (Faiz, Enflasyon, İşsizlik) T.C. Merkez Bankası ve TÜİK verileri olup, duyuru takvimine göre periyodik olarak güncellenmektedir. <strong>Canlı Piyasa Verileri</strong> (Döviz, Altın, Tahvil) ise TradingView altyapısı ile global piyasalardan anlık olarak çekilmektedir. Buradaki bilgiler yalnızca bilgilendirme amaçlıdır, yatırım tavsiyesi değildir ve doğruluğu garanti edilmez.
                    </p>
                </div>
            </div>
        </PageContainer>
    );
}
