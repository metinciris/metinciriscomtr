import React, { useState, useMemo } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Minus, Plus, Scale, Ruler, Activity, Thermometer } from 'lucide-react';
import { getFetalDataForWeek, calculateFetalOrganWeights } from '../core/calculators/fetus';

export function FetusUzunluklari() {
    const [week, setWeek] = useState(20);

    const data = useMemo(() => getFetalDataForWeek(week), [week]);
    const organWeights = useMemo(() => data ? calculateFetalOrganWeights(data.weight) : [], [data]);

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
                                    {organWeights.map((organ) => (
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
