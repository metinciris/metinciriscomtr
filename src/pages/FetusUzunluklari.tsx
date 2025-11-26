import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Minus, Plus, Scale, Ruler, Activity } from 'lucide-react';

interface FetalData {
    week: number;
    weight: number; // grams
    crl: number; // Crown-Rump Length (cm)
    chl: number; // Crown-Heel Length (cm)
    hc: number; // Head Circumference (cm)
    cc: number; // Chest Circumference (cm)
    ac: number; // Abdominal Circumference (cm)
}

// Data approximation based on standard fetal growth charts (e.g., Hansen, Kalter, Streeter)
const fetalData: FetalData[] = [
    { week: 10, weight: 5, crl: 4.0, chl: 6.5, hc: 0, cc: 0, ac: 0 },
    { week: 11, weight: 8, crl: 5.0, chl: 7.5, hc: 0, cc: 0, ac: 0 },
    { week: 12, weight: 14, crl: 6.0, chl: 9.0, hc: 7.0, cc: 6.5, ac: 6.0 },
    { week: 13, weight: 23, crl: 7.5, chl: 10.5, hc: 8.5, cc: 7.5, ac: 7.0 },
    { week: 14, weight: 43, crl: 8.5, chl: 12.5, hc: 10.0, cc: 8.5, ac: 8.0 },
    { week: 15, weight: 70, crl: 10.0, chl: 14.5, hc: 11.5, cc: 9.5, ac: 9.0 },
    { week: 16, weight: 100, crl: 11.5, chl: 16.5, hc: 13.0, cc: 10.5, ac: 10.0 },
    { week: 17, weight: 140, crl: 13.0, chl: 18.5, hc: 14.5, cc: 11.5, ac: 11.0 },
    { week: 18, weight: 190, crl: 14.0, chl: 20.5, hc: 15.5, cc: 12.5, ac: 12.0 },
    { week: 19, weight: 240, crl: 15.0, chl: 22.5, hc: 16.5, cc: 13.5, ac: 13.0 },
    { week: 20, weight: 300, crl: 16.0, chl: 25.0, hc: 17.5, cc: 14.5, ac: 14.0 },
    { week: 21, weight: 360, crl: 17.5, chl: 27.0, hc: 18.5, cc: 15.5, ac: 15.0 },
    { week: 22, weight: 430, crl: 19.0, chl: 28.5, hc: 19.5, cc: 16.5, ac: 16.0 },
    { week: 23, weight: 500, crl: 20.0, chl: 30.0, hc: 20.5, cc: 17.5, ac: 17.0 },
    { week: 24, weight: 600, crl: 21.0, chl: 31.5, hc: 21.5, cc: 18.5, ac: 18.0 },
    { week: 25, weight: 660, crl: 22.0, chl: 33.0, hc: 22.5, cc: 19.5, ac: 19.0 },
    { week: 26, weight: 760, crl: 23.0, chl: 34.5, hc: 23.5, cc: 20.5, ac: 20.0 },
    { week: 27, weight: 875, crl: 24.0, chl: 36.0, hc: 24.5, cc: 21.5, ac: 21.0 },
    { week: 28, weight: 1000, crl: 25.0, chl: 37.5, hc: 25.5, cc: 22.5, ac: 22.0 },
    { week: 29, weight: 1150, crl: 26.0, chl: 39.0, hc: 26.5, cc: 23.5, ac: 23.0 },
    { week: 30, weight: 1300, crl: 27.0, chl: 40.5, hc: 27.5, cc: 24.5, ac: 24.0 },
    { week: 31, weight: 1500, crl: 28.0, chl: 42.0, hc: 28.5, cc: 25.5, ac: 25.0 },
    { week: 32, weight: 1700, crl: 29.0, chl: 43.5, hc: 29.5, cc: 26.5, ac: 26.0 },
    { week: 33, weight: 1900, crl: 30.0, chl: 45.0, hc: 30.5, cc: 27.5, ac: 27.0 },
    { week: 34, weight: 2100, crl: 31.0, chl: 46.5, hc: 31.5, cc: 28.5, ac: 28.0 },
    { week: 35, weight: 2380, crl: 32.0, chl: 47.5, hc: 32.5, cc: 29.5, ac: 29.0 },
    { week: 36, weight: 2600, crl: 33.0, chl: 48.5, hc: 33.5, cc: 30.5, ac: 30.0 },
    { week: 37, weight: 2850, crl: 34.0, chl: 49.5, hc: 34.0, cc: 31.5, ac: 31.0 },
    { week: 38, weight: 3080, crl: 35.0, chl: 50.5, hc: 34.5, cc: 32.5, ac: 32.0 },
    { week: 39, weight: 3250, crl: 36.0, chl: 51.5, hc: 35.0, cc: 33.5, ac: 33.0 },
    { week: 40, weight: 3400, crl: 37.0, chl: 52.5, hc: 35.5, cc: 34.5, ac: 34.0 },
    { week: 41, weight: 3550, crl: 38.0, chl: 53.5, hc: 36.0, cc: 35.0, ac: 35.0 },
    { week: 42, weight: 3650, crl: 39.0, chl: 54.5, hc: 36.5, cc: 35.5, ac: 36.0 },
];

export function FetusUzunluklari() {
    const [week, setWeek] = useState(20);
    const [data, setData] = useState<FetalData | undefined>(undefined);

    useEffect(() => {
        const foundData = fetalData.find(d => d.week === week);
        setData(foundData);
    }, [week]);

    const handleIncrement = () => {
        if (week < 42) setWeek(prev => prev + 1);
    };

    const handleDecrement = () => {
        if (week > 10) setWeek(prev => prev - 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 10 && val <= 42) {
            setWeek(val);
        }
    };

    return (
        <PageContainer>
            <div className="bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white p-12 mb-8 rounded-xl shadow-lg">
                <h1 className="text-white mb-4 text-4xl font-bold">Fetus Uzunlukları</h1>
                <p className="text-white/90 max-w-3xl text-lg">
                    Gebelik haftasına göre beklenen fetal ölçümler. Medikal otopsi referans değerleri.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Hafta Seçimi</h2>

                        <div className="flex items-center justify-between mb-8">
                            <button
                                onClick={handleDecrement}
                                disabled={week <= 10}
                                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Minus size={24} className="text-gray-600" />
                            </button>

                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    value={week}
                                    onChange={handleInputChange}
                                    className="text-5xl font-bold text-center w-24 bg-transparent border-none focus:ring-0 text-[#3498DB]"
                                    min="10"
                                    max="42"
                                />
                                <span className="text-gray-500 font-medium">. Hafta</span>
                            </div>

                            <button
                                onClick={handleIncrement}
                                disabled={week >= 42}
                                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-blue-800 text-sm text-center">
                                10 ile 42. hafta arasındaki değerleri görüntüleyebilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2">
                    {data ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Weight Card */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2 flex items-center gap-6">
                                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <Scale size={32} className="text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium mb-1">Fetal Ağırlık</p>
                                    <p className="text-4xl font-bold text-gray-900">{data.weight} <span className="text-xl text-gray-500 font-normal">g</span></p>
                                </div>
                            </div>

                            {/* Lengths */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Ruler size={20} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 m-0">Uzunluklar</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-gray-600">Baş-Topuk (CHL)</span>
                                        <span className="text-xl font-bold text-gray-900">{data.chl} <span className="text-sm text-gray-500 font-normal">cm</span></span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-gray-600">Baş-Makat (CRL)</span>
                                        <span className="text-xl font-bold text-gray-900">{data.crl} <span className="text-sm text-gray-500 font-normal">cm</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Circumferences */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <Activity size={20} className="text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 m-0">Çevre Ölçümleri</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-gray-600">Baş Çevresi (HC)</span>
                                        <span className="text-xl font-bold text-gray-900">{data.hc > 0 ? data.hc : '-'} <span className="text-sm text-gray-500 font-normal">cm</span></span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-gray-600">Göğüs Çevresi (CC)</span>
                                        <span className="text-xl font-bold text-gray-900">{data.cc > 0 ? data.cc : '-'} <span className="text-sm text-gray-500 font-normal">cm</span></span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-gray-600">Karın Çevresi (AC)</span>
                                        <span className="text-xl font-bold text-gray-900">{data.ac > 0 ? data.ac : '-'} <span className="text-sm text-gray-500 font-normal">cm</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                            <p className="text-gray-500">Seçilen hafta için veri bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
