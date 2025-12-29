import React, { useEffect, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { TrendingUp, Landmark, Info, PieChart, Percent, Home, Coins } from 'lucide-react';


// --- Canlı Veri Notu ---
// Veriler TradingView ve Resmi Kurumlar (TCMB, TÜİK) üzerinden canlı olarak akmaktadır.
// Bu sayfadaki tüm mali göstergeler otomatik güncellenmektedir.

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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 relative group overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                {title}
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

            {/* Ekonomik Göstergeler (Canlı) */}
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <Landmark className="text-blue-600" />
                Ekonomik Göstergeler (Canlı)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <RobustTradingViewWidget symbol="ECONOMICS:TRINTR" title="Politika Faizi (TCMB)" height={280} />
                <RobustTradingViewWidget symbol="ECONOMICS:TRIRYY" title="Yıllık Enflasyon (TÜFE)" height={280} />
                <RobustTradingViewWidget symbol="ECONOMICS:TRUR" title="İşsizlik Oranı" height={280} />
            </div>

            {/* Döviz Kurları */}
            <h2 className="text-2xl font-bold text-slate-800 mb-4 mt-6">Döviz Kurları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <RobustTradingViewWidget symbol="FX_IDC:USDTRY" title="ABD Doları / TL" />
                <RobustTradingViewWidget symbol="FX_IDC:EURTRY" title="Euro / TL" />
                <RobustTradingViewWidget symbol="BITSTAMP:BTCUSD" title="Bitcoin / USD" />
            </div>

            {/* Altın & Gümüş */}
            <h2 className="text-2xl font-bold text-slate-800 mb-4 mt-12">Altın & Gümüş</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <RobustTradingViewWidget symbol="TVC:GOLD" title="Ons Altın (USD)" />
                <RobustTradingViewWidget symbol="OANDA:XAUTRY" title="Gram Altın (TL)" height={220} />
                <RobustTradingViewWidget symbol="OANDA:XAGUSD" title="Gümüş (USD)" height={300} />
            </div>

            {/* Emtia */}
            <h2 className="text-2xl font-bold text-slate-800 mb-4 mt-12">Emtia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <RobustTradingViewWidget symbol="TVC:USOIL" title="Ham Petrol (WTI)" height={300} />
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
                                    <strong>İşsizlik Oranı:</strong> Türkiye İstatistik Kurumu (TÜİK) aylık verileri
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
