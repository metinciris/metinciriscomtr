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
                            )
        }
                        </tbody >
                    </table >
                </div >
            </div >

        {/* Info Footer */ }
        < div className = "mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg shadow-sm" >
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
            </div >
        </PageContainer >
    );
}
