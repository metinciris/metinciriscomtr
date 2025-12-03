import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Activity, RefreshCw, AlertTriangle, MapPin, Clock, AlertOctagon, Zap } from 'lucide-react';

interface Earthquake {
    earthquake_id: string;
    title: string;
    mag: number;
    depth: number;
    date_time: string;
    location_properties: {
        closestCity: {
            name: string;
            distance: number;
        };
    };
}

interface APIResponse {
    status: boolean;
    result: Earthquake[];
    metadata: {
        count: number;
    };
}

export function Deprem() {
    const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('https://api.orhanaydogdu.com.tr/deprem/kandilli/live');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: APIResponse = await response.json();

            if (data.status && data.result && Array.isArray(data.result)) {
                // Filter for last 10 days
                const tenDaysAgo = new Date();
                tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

                const filtered = data.result.filter((eq: Earthquake) => {
                    try {
                        const eqDate = new Date(eq.date_time);
                        return eqDate >= tenDaysAgo && !isNaN(eqDate.getTime());
                    } catch {
                        return false;
                    }
                });

                setEarthquakes(filtered);
            } else {
                throw new Error('Veri formatı hatalı');
            }
        } catch (err: any) {
            console.error('Deprem verisi hatası:', err);
            setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    };

    useEffect(() => {
        fetchData();

        // Auto refresh every 30 seconds
        const intervalId = setInterval(() => {
            fetchData();
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);

    const isIsparta = (title: string) => {
        return title.toLocaleLowerCase('tr-TR').includes('isparta');
    };

    const isToday = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isRecent = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        return diffInHours < 1;
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    // Badge color for magnitude (Text on light background for readability)
    const getMagnitudeBadgeStyle = (mag: number) => {
        if (mag >= 6) return 'bg-red-100 text-red-900 border border-red-300 ring-2 ring-red-500';
        if (mag >= 5) return 'bg-red-100 text-red-800 border border-red-200 ring-1 ring-red-400';
        if (mag >= 4) return 'bg-orange-100 text-orange-800 border border-orange-200';
        if (mag >= 3) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        return 'bg-green-100 text-green-800 border border-green-200';
    };

    // Row background color based on magnitude
    const getRowStyle = (mag: number, isIspartaLocation: boolean, isTodayEq: boolean, isRecentEq: boolean) => {
        let baseStyle = '';

        if (isIspartaLocation) {
            baseStyle = 'bg-red-50 border-l-4 border-l-red-600 shadow-sm';
        } else if (mag >= 6) {
            baseStyle = 'bg-red-100/80 hover:bg-red-200/80 border-l-4 border-l-red-800';
        } else if (mag >= 5) {
            baseStyle = 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500';
        } else if (mag >= 4) {
            baseStyle = 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400';
        } else if (mag >= 3) {
            baseStyle = 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-400';
        } else {
            baseStyle = 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-400';
        }

        if (isTodayEq) {
            baseStyle += ' ring-2 ring-blue-600 ring-inset z-10 relative';
        }

        if (isRecentEq) {
            baseStyle += ' animate-pulse bg-blue-50';
        }

        return baseStyle;
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E74C3C] via-[#C0392B] to-[#E74C3C] text-white p-8 mb-8 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                        <h1 className="text-white mb-3 text-4xl font-bold flex items-center gap-3">
                            <Activity size={36} className="animate-pulse" />
                            Son Depremler
                        </h1>
                        <p className="text-white/90 text-lg mb-2">
                            Kandilli Rasathanesi canlı verileri
                        </p>
                        <p className="text-white/80 text-sm">
                            Son 10 günün depremleri • 30 saniyede bir güncellenir
                        </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            <span className="font-semibold">
                                {loading ? 'Yenileniyor...' : 'Canlı'}
                            </span>
                        </div>
                        <div className="text-center text-sm text-white/90">
                            <Clock size={14} className="inline mr-1" />
                            {lastUpdated.toLocaleTimeString('tr-TR')}
                        </div>
                        {earthquakes.length > 0 && (
                            <div className="text-center text-sm text-white/80 mt-2 pt-2 border-t border-white/20">
                                {earthquakes.length} kayıt
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-r-lg shadow">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                        <div>
                            <p className="text-red-700 font-semibold mb-1">Veri Yükleme Hatası</p>
                            <p className="text-red-600 text-sm">{error}</p>
                            <button
                                onClick={fetchData}
                                className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                Tekrar Dene
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr className="border-b-2 border-gray-300">
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-1/3">
                                    <MapPin size={16} className="inline mr-2" />
                                    Yer
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    Büyüklük
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    Derinlik (km)
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                    <Clock size={16} className="inline mr-2" />
                                    Tarih / Saat
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                            {loading && earthquakes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <RefreshCw className="animate-spin mx-auto mb-3 text-gray-400" size={32} />
                                        <p className="text-gray-500">Veriler yükleniyor...</p>
                                    </td>
                                </tr>
                            ) : earthquakes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <AlertTriangle className="mx-auto mb-3 text-gray-300" size={32} />
                                        <p>Kayıt bulunamadı.</p>
                                    </td>
                                </tr>
                            ) : (
                                earthquakes.map((eq, index) => {
                                    const highlight = isIsparta(eq.title);
                                    const today = isToday(eq.date_time);
                                    const recent = isRecent(eq.date_time);
                                    const rowStyle = getRowStyle(eq.mag, highlight, today, recent);

                                    return (
                                        <tr
                                            key={eq.earthquake_id || index}
                                            className={`transition-all duration-150 ${rowStyle}`}
                                        >
                                            <td
                                                className={`px-6 py-4 ${highlight
                                                    ? 'font-bold text-red-900 text-base'
                                                    : 'text-gray-800'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    {highlight && (
                                                        <span className="inline-block px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded uppercase mt-0.5 shadow-sm">
                                                            Isparta
                                                        </span>
                                                    )}
                                                    {recent && (
                                                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded uppercase mt-0.5 shadow-sm animate-pulse">
                                                            <Zap size={12} className="mr-1" />
                                                            YENİ
                                                        </span>
                                                    )}
                                                    <span>{eq.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${getMagnitudeBadgeStyle(
                                                            eq.mag
                                                        )}`}
                                                    >
                                                        {eq.mag.toFixed(1)}
                                                    </span>
                                                    {eq.mag >= 6 && (
                                                        <AlertOctagon className="text-red-700 animate-pulse" size={24} />
                                                    )}
                                                    {eq.mag >= 5 && eq.mag < 6 && (
                                                        <AlertTriangle className="text-red-600" size={20} />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-700 font-medium">
                                                {eq.depth.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <div className="flex flex-col">
                                                    <span>{formatDate(eq.date_time)}</span>
                                                    {today && (
                                                        <span className="text-xs text-blue-600 font-bold mt-1">
                                                            BUGÜN
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Footer */}
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
                <p className="text-sm text-blue-800">
                    <strong>Not:</strong> Veriler Kandilli Rasathanesi ve Orhanaydogdu API'dan alınmaktadır.
                    <br />
                    <span className="font-bold">Bugünkü depremler</span> mavi çerçeve ile gösterilir.
                    <span className="font-bold ml-2">Son 1 saat</span> içindeki depremler "YENİ" etiketi ile belirtilir.
                    <br />
                    <span className="inline-block w-3 h-3 bg-green-200 border border-green-400 mr-1 ml-2 rounded-full"></span> &lt; 3.0
                    <span className="inline-block w-3 h-3 bg-yellow-200 border border-yellow-400 mr-1 ml-2 rounded-full"></span> 3.0 - 4.0
                    <span className="inline-block w-3 h-3 bg-orange-200 border border-orange-400 mr-1 ml-2 rounded-full"></span> 4.0 - 5.0
                    <span className="inline-block w-3 h-3 bg-red-200 border border-red-400 mr-1 ml-2 rounded-full"></span> &gt; 5.0
                </p>
            </div>
        </PageContainer>
    );
}
