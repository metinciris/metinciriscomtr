import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Minus, Plus, Scale, Ruler, Activity, Thermometer } from 'lucide-react';

interface FetalData {
    week: number;
    weight: number; // grams
    crl: number; // Crown-Rump Length (cm)
    chl: number; // Crown-Heel Length (cm)
    fl: number; // Foot Length (cm)
    hc: number; // Head Circumference (cm)
    cc: number; // Chest Circumference (cm)
    ac: number; // Abdominal Circumference (cm)
}

// Data updated based on professional growth charts provided by user and standard autopsy references
const fetalData: FetalData[] = [
    { week: 8, weight: 20, crl: 1.57, chl: 0, fl: 0.3, hc: 0, cc: 0, ac: 0 },
    { week: 9, weight: 27, crl: 2.30, chl: 0, fl: 0.4, hc: 0, cc: 0, ac: 0 },
    { week: 10, weight: 35, crl: 3.1, chl: 0, fl: 0.6, hc: 0, cc: 0, ac: 0 },
    { week: 11, weight: 45, crl: 4.1, chl: 0, fl: 0.8, hc: 0, cc: 0, ac: 0 },
    { week: 12, weight: 58, crl: 5.4, chl: 0, fl: 0.9, hc: 7.0, cc: 6.5, ac: 6.0 },
    { week: 13, weight: 73, crl: 6.7, chl: 0, fl: 1.1, hc: 8.5, cc: 7.5, ac: 7.0 },
    { week: 14, weight: 93, crl: 9.8, chl: 14.7, fl: 1.4, hc: 10.0, cc: 8.5, ac: 8.0 },
    { week: 15, weight: 117, crl: 11.1, chl: 16.7, fl: 1.7, hc: 11.5, cc: 9.5, ac: 9.0 },
    { week: 16, weight: 146, crl: 12.4, chl: 18.6, fl: 2.0, hc: 13.0, cc: 10.5, ac: 10.0 },
    { week: 17, weight: 181, crl: 13.6, chl: 20.4, fl: 2.3, hc: 14.5, cc: 11.5, ac: 11.0 },
    { week: 18, weight: 223, crl: 14.8, chl: 22.2, fl: 2.6, hc: 15.5, cc: 12.5, ac: 12.0 },
    { week: 19, weight: 273, crl: 16.0, chl: 24.0, fl: 2.9, hc: 16.5, cc: 13.5, ac: 13.0 },
    { week: 20, weight: 331, crl: 17.1, chl: 25.7, fl: 3.3, hc: 17.5, cc: 14.5, ac: 14.0 },
    { week: 21, weight: 399, crl: 18.3, chl: 27.4, fl: 3.6, hc: 18.5, cc: 15.5, ac: 15.0 },
    { week: 22, weight: 478, crl: 19.3, chl: 29.0, fl: 3.9, hc: 19.5, cc: 16.5, ac: 16.0 },
    { week: 23, weight: 568, crl: 20.4, chl: 30.6, fl: 4.2, hc: 20.5, cc: 17.5, ac: 17.0 },
    { week: 24, weight: 670, crl: 21.5, chl: 32.2, fl: 4.5, hc: 21.5, cc: 18.5, ac: 18.0 },
    { week: 25, weight: 785, crl: 22.5, chl: 33.7, fl: 4.7, hc: 22.5, cc: 19.5, ac: 19.0 },
    { week: 26, weight: 913, crl: 23.4, chl: 35.1, fl: 4.9, hc: 23.5, cc: 20.5, ac: 20.0 },
    { week: 27, weight: 1055, crl: 24.4, chl: 36.6, fl: 5.1, hc: 24.5, cc: 21.5, ac: 21.0 },
    { week: 28, weight: 1210, crl: 25.1, chl: 37.6, fl: 5.3, hc: 25.5, cc: 22.5, ac: 22.0 },
    { week: 29, weight: 1379, crl: 26.2, chl: 39.3, fl: 5.5, hc: 26.5, cc: 23.5, ac: 23.0 },
    { week: 30, weight: 1559, crl: 27.0, chl: 40.5, fl: 5.7, hc: 27.5, cc: 24.5, ac: 24.0 },
    { week: 31, weight: 1751, crl: 27.9, chl: 41.8, fl: 5.9, hc: 28.5, cc: 25.5, ac: 25.0 },
    { week: 32, weight: 1953, crl: 28.7, chl: 43.0, fl: 6.1, hc: 29.5, cc: 26.5, ac: 26.0 },
    { week: 33, weight: 2162, crl: 29.4, chl: 44.1, fl: 6.3, hc: 30.5, cc: 27.5, ac: 27.0 },
    { week: 34, weight: 2377, crl: 30.2, chl: 45.3, fl: 6.5, hc: 31.5, cc: 28.5, ac: 28.0 },
    { week: 35, weight: 2595, crl: 30.9, chl: 46.3, fl: 6.7, hc: 32.5, cc: 29.5, ac: 29.0 },
    { week: 36, weight: 2813, crl: 31.5, chl: 47.3, fl: 6.9, hc: 33.5, cc: 30.5, ac: 30.0 },
    { week: 37, weight: 3028, crl: 32.2, chl: 48.3, fl: 7.1, hc: 34.0, cc: 31.5, ac: 31.0 },
    { week: 38, weight: 3236, crl: 32.9, chl: 49.3, fl: 7.3, hc: 34.5, cc: 32.5, ac: 32.0 },
    { week: 39, weight: 3435, crl: 33.4, chl: 50.1, fl: 7.5, hc: 35.0, cc: 33.5, ac: 33.0 },
    { week: 40, weight: 3619, crl: 34.0, chl: 51.0, fl: 7.7, hc: 35.5, cc: 34.5, ac: 34.0 },
    { week: 41, weight: 3787, crl: 34.5, chl: 51.8, fl: 7.9, hc: 36.0, cc: 35.0, ac: 35.0 },
];

export function FetusUzunluklari() {
    const [week, setWeek] = useState(20);
    const [data, setData] = useState<FetalData | undefined>(undefined);

    useEffect(() => {
        const foundData = fetalData.find(d => d.week === week);
        setData(foundData);
    }, [week]);

    const handleIncrement = () => {
        if (week < 41) setWeek(prev => prev + 1);
    };

    const handleDecrement = () => {
        if (week > 8) setWeek(prev => prev - 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 8 && val <= 41) {
            setWeek(val);
        }
    };

    // Brain: ~13%, Lungs: ~2%, Heart: ~0.7%, Liver: ~4%, Kidneys: ~1%, Spleen: ~0.3%, Thymus: ~0.4%
    const calculateOrganWeights = (totalWeight: number) => {
        return [
            { name: 'Beyin', weight: (totalWeight * 0.13).toFixed(1), ratio: '%13' },
            { name: 'Karaciğer', weight: (totalWeight * 0.04).toFixed(1), ratio: '%4' },
            { name: 'Akciğerler (Toplam)', weight: (totalWeight * 0.02).toFixed(1), ratio: '%2' },
            { name: 'Böbrekler (Toplam)', weight: (totalWeight * 0.01).toFixed(1), ratio: '%1' },
            { name: 'Kalp', weight: (totalWeight * 0.007).toFixed(1), ratio: '%0.7' },
            { name: 'Timus', weight: (totalWeight * 0.004).toFixed(1), ratio: '%0.4' },
            { name: 'Dalak', weight: (totalWeight * 0.003).toFixed(1), ratio: '%0.3' },
        ];
    };

    return (
        <PageContainer>
            <div className="bg-blue-50 text-gray-900 p-12 mb-8 rounded-xl shadow-lg border border-blue-100">
                <h1 className="text-gray-900 mb-4 text-4xl font-bold">Fetus Uzunlukları & Otopsi Referansları</h1>
                <p className="text-blue-800 max-w-3xl text-lg">
                    Gebelik haftasına göre beklenen fetal ölçümler ve fetal otopsi için tahmini organ ağırlıkları.
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
                                disabled={week <= 8}
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
                                    min="8"
                                    max="41"
                                />
                                <span className="text-gray-500 font-medium">. Hafta</span>
                            </div>

                            <button
                                onClick={handleIncrement}
                                disabled={week >= 41}
                                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-blue-800 text-sm text-center">
                                8 ile 41. hafta arasındaki değerleri görüntüleyebilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2">
                    {data ? (
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Weight Card */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                        <Scale size={32} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 font-medium mb-1">Beklenen Fetal Ağırlık</p>
                                        <p className="text-4xl font-bold text-gray-900">{data.weight} <span className="text-xl text-gray-500 font-normal">g</span></p>
                                    </div>
                                </div>

                                {/* Lengths */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Ruler size={20} className="text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 m-0">Uzunluk Ölçümleri</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                            <span className="text-gray-600">Baş-Topuk (CHL)</span>
                                            <span className="text-xl font-bold text-gray-900">{data.chl > 0 ? data.chl : '-'} <span className="text-sm text-gray-500 font-normal">cm</span></span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                            <span className="text-gray-600">Baş-Makat (CRL)</span>
                                            <span className="text-xl font-bold text-gray-900">{data.crl > 0 ? data.crl : '-'} <span className="text-sm text-gray-500 font-normal">cm</span></span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                            <span className="text-gray-600 text-blue-700 font-medium">Ayak Uzunluğu (FL)</span>
                                            <span className="text-xl font-bold text-blue-800">{data.fl} <span className="text-sm text-blue-500 font-normal">cm</span></span>
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

                            {/* Organ Weights Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <Thermometer size={20} className="text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 m-0">Otopsi: Tahmini Organ Ağırlıkları</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {calculateOrganWeights(data.weight).map((organ) => (
                                        <div key={organ.name} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <p className="text-sm text-gray-500 mb-1">{organ.name}</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {organ.weight} <span className="text-sm text-gray-500 font-normal">g</span>
                                                <span className="ml-2 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">{organ.ratio}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-xs text-yellow-800">
                                    * Organ ağırlıkları, toplam vücut ağırlığına oranlanan standart literatür verilerine (Kalter, 2003) dayalı yaklaşık değerlerdir. Patolojik değerlendirmede makro bulgular esastır.
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
