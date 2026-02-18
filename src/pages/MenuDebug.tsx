import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { AlertCircle, CheckCircle2, RefreshCw, Terminal, Search, ShieldAlert } from 'lucide-react';

const OGRENCI_URL_EXPORT = 'https://docs.google.com/spreadsheets/d/1rXB81K4CkGT1wrtRGOnqVVRZB8g5GxpvP4TqAXu4BSE/export?format=csv&gid=711889518';
const OGRENCI_URL_GVIZ = 'https://docs.google.com/spreadsheets/d/1rXB81K4CkGT1wrtRGOnqVVRZB8g5GxpvP4TqAXu4BSE/gviz/tq?tqx=out:csv&gid=711889518';

export function MenuDebug() {
    const [results, setResults] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    const runTest = async (name: string, url: string) => {
        const timestamp = `&t=${Date.now()}`;
        const finalUrl = url + timestamp;
        let result: any = { name, url: finalUrl, time: new Date().toLocaleTimeString() };

        try {
            console.log(`Testing ${name}:`, finalUrl);
            const response = await fetch(finalUrl);
            result.status = response.status;
            result.ok = response.ok;

            if (response.ok) {
                const text = await response.text();
                result.length = text.length;
                result.snippet = text.substring(0, 200);
                result.success = true;

                // Attempt a basic check for "Tarih" content
                result.hasTarih = text.toLocaleLowerCase('en-US').includes('tarih');
            } else {
                result.success = false;
                result.error = `HTTP Error: ${response.status}`;
            }
        } catch (err: any) {
            console.error(`Error in ${name}:`, err);
            result.success = false;
            result.error = err.message || 'Network Error / CORS Block';
        }

        return result;
    };

    const runAllTests = async () => {
        setLoading(true);
        setResults([]);

        const res1 = await runTest('Standard Export URL', OGRENCI_URL_EXPORT);
        const res2 = await runTest('Gviz API URL (Hospital Style)', OGRENCI_URL_GVIZ);

        setResults([res1, res2]);
        setLoading(false);
    };

    return (
        <PageContainer title="Menü Bağlantı Tanılama" description="Google Sheets bağlantı sorunlarını teşhis etmek için hazırlanan demo sayfası.">
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start space-x-3 text-blue-700">
                    <Terminal className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">Neden bu sayfadayız?</p>
                        <p className="text-sm opacity-90">Verilerin "localhost" üzerinde neden çekilemediğini anlamak için iki farklı yöntemi test ediyoruz. Lütfen "Testleri Başlat" butonuna basın.</p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={runAllTests}
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        <span>{loading ? 'Testler Çalışıyor...' : 'Bağlantı Testlerini Başlat'}</span>
                    </button>
                </div>

                {results.length > 0 && (
                    <div className="grid grid-cols-1 gap-4">
                        {results.map((res, i) => (
                            <div key={i} className={`p-5 rounded-2xl border-2 transition-all ${res.success ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        {res.success ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <AlertCircle className="w-6 h-6 text-rose-600" />}
                                        <h3 className="text-lg font-bold text-slate-800">{res.name}</h3>
                                    </div>
                                    <span className="text-sm text-slate-500">{res.time}</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-slate-800 text-slate-200 p-3 rounded-lg text-xs font-mono break-all overflow-hidden whitespace-nowrap text-ellipsis">
                                        URL: {res.url}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <p className="text-slate-500 text-xs mb-1">Durum</p>
                                            <p className={`font-bold ${res.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {res.status || 'Hata'} {res.ok ? '(OK)' : ''}
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <p className="text-slate-500 text-xs mb-1">Veri Boyutu</p>
                                            <p className="font-bold text-slate-800">{res.length || 0} byte</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <p className="text-slate-500 text-xs mb-1">"Tarih" İçeriği</p>
                                            <p className={`font-bold ${res.hasTarih ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {res.hasTarih ? 'Bulundu' : 'Bulunamadı'}
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <p className="text-slate-500 text-xs mb-1">CORS Durumu</p>
                                            <p className="font-bold text-slate-800">{res.error ? 'Hataya Bakınız' : 'Temiz'}</p>
                                        </div>
                                    </div>

                                    {res.error && (
                                        <div className="bg-rose-100/50 border border-rose-200 p-3 rounded-xl text-rose-700 text-sm flex items-start space-x-2">
                                            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span><strong>HATA DETAYI:</strong> {res.error}</span>
                                        </div>
                                    )}

                                    {res.snippet && (
                                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                                            <p className="text-slate-500 text-xs mb-2">Veri Önizleme (Snippet):</p>
                                            <pre className="text-[10px] font-mono whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-100 max-h-24 overflow-y-auto">
                                                {res.snippet}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-center text-slate-400 text-xs py-4">
                    Bu sayfa sadece teknik analiz içindir. Sorun çözüldüğünde kaldırılacaktır.
                </div>
            </div>
        </PageContainer>
    );
}
