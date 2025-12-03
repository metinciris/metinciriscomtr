import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Activity, RefreshCw, AlertTriangle } from 'lucide-react';

interface Earthquake {
    date: string;
    timestamp: string; // "2024.12.03 10:15:00" format usually
    mag: number;
    depth: number;
    title: string; // Location
    geojson: {
        coordinates: [number, number];
    };
    location_properties: {
        closestCity: {
            name: string;
        };
    };
}

export function Deprem() {
    const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://api.orhanaydogdu.com.tr/deprem/kandilli/live');
            if (!response.ok) {
                throw new Error('Veri çekilemedi');
            }
            const data = await response.json();

            if (data.status && data.result) {
                // Filter for last 10 days
                const tenDaysAgo = new Date();
                tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

                const filtered = data.result.filter((eq: any) => {
                    // Parse date manually as format might be "2024.12.03 10:15:00"
                    // The API returns 'date' field in "YYYY.MM.DD HH:mm:ss" format usually
                    const dateStr = eq.date.replace(/\./g, '-'); // Convert 2024.12.03 to 2024-12-03
                    const eqDate = new Date(dateStr);
                    return eqDate >= tenDaysAgo;
                });

                setEarthquakes(filtered);
                setError(null);
            }
        } catch (err) {
            console.error('Deprem verisi hatası:', err);
            setError('Veriler yüklenirken bir hata oluştu.');
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

    return (
        <PageContainer>
            <div className="bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white p-8 mb-8 rounded-xl shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-white mb-2 text-3xl font-bold flex items-center gap-3">
                            <Activity size={32} />
                            Son Depremler
                        </h1>
                        <p className="text-white/90 text-lg">
                            Kandilli Rasathanesi verileri (Son 10 gün)
                        </p>
                    </div>
                    <div className="text-right text-sm text-white/80">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            {loading ? 'Yenileniyor...' : 'Canlı'}
                        </div>
                        <div>Son Güncelleme: {lastUpdated.toLocaleTimeString()}</div>
                        <div className="mt-1 text-xs">30 saniyede bir yenilenir</div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex items-center">
                        <AlertTriangle className="text-red-500 mr-2" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Tarih / Saat</th>
                                <th className="px-6 py-3">Büyüklük</th>
                                <th className="px-6 py-3">Derinlik (km)</th>
                                <th className="px-6 py-3">Yer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {earthquakes.map((eq, index) => {
                                const highlight = isIsparta(eq.title);
                                return (
                                    <tr
                                        key={index}
                                        className={`border-b hover:bg-gray-50 transition-colors ${highlight ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {eq.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded font-bold ${eq.mag >= 4 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {eq.mag}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {eq.depth}
                                        </td>
                                        <td className={`px-6 py-4 ${highlight ? 'font-bold text-red-700' : 'text-gray-700'}`}>
                                            {eq.title}
                                        </td>
                                    </tr>
                                );
                            })}
                            {earthquakes.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageContainer>
    );
}
