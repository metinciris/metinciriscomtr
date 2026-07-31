import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calculator, Info } from 'lucide-react';
import { calculateRCBValue, RcbInputs } from '../core/calculators/rcb';
import { ReportingDisclaimer } from '../components/ReportingDisclaimer';

export function RcbCalculator() {
    const [d1, setD1] = useState("");
    const [d2, setD2] = useState("");
    const [c, setC] = useState("");
    const [pis, setPis] = useState("");
    const [pn, setPn] = useState("");
    const [dmet, setDmet] = useState("");

    const [result, setResult] = useState<{ rcb: string; category: string; output: string } | null>(null);

    const handleCalculate = () => {
        const D1 = parseFloat(d1);
        const D2 = parseFloat(d2);
        const C = parseFloat(c);
        const PIS = parseFloat(pis);
        const pN = parseFloat(pn || "0");
        const dmetVal = parseFloat(dmet || "0");

        if (isNaN(D1) || isNaN(D2)) {
            alert("Lütfen tümör yatağı alanı için hem genişlik hem de yükseklik değerlerini girin.");
            return;
        }

        if (C < 0 || C > 100 || PIS < 0 || PIS > 100 || D1 <= 0 || D2 <= 0 || pN < 0 || dmetVal < 0) {
            alert("Lütfen geçerli değerler girin.");
            return;
        }

        const res = calculateRCBValue({ d1: D1, d2: D2, c: C, pis: PIS, pn: pN, dmet: dmetVal });
        setResult({
            rcb: res.rcb.toFixed(3),
            category: res.category,
            output: res.details
        });
    };

    return (
        <PageContainer>
            <div className="bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white p-12 mb-8 rounded-xl shadow-lg">
                <h1 className="text-white mb-4 text-4xl font-bold">Rezidüel Kanser Yükü (RCB)</h1>
                <p className="text-white/90 max-w-3xl text-lg">
                    Meme kanserinde neoadjuvan kemoterapi sonrası rezidüel kanser yükünün hesaplanması.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Primer Tümör Yatağı */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm">1</span>
                            Primer Tümör Yatağı
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Primer Tümör Yatağı (mm) - Genişlik
                                </label>
                                <input
                                    type="number"
                                    placeholder="Genişlik (d1)"
                                    value={d1}
                                    onChange={(e) => setD1(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Primer Tümör Yatağı (mm) - Yükseklik
                                </label>
                                <input
                                    type="number"
                                    placeholder="Yükseklik (d2)"
                                    value={d2}
                                    onChange={(e) => setD2(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kanser alanı tümör selülaritesi (%)
                            </label>
                            <input
                                type="number"
                                placeholder="0-100 arası"
                                value={c}
                                onChange={(e) => setC(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tümör alanı in situ yüzdesi (%)
                            </label>
                            <input
                                type="number"
                                placeholder="0-100 arası"
                                value={pis}
                                onChange={(e) => setPis(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Lenf Nodları */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm">2</span>
                            Lenf Nodları
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pozitif Lenf Nodu Sayısı
                                </label>
                                <input
                                    type="number"
                                    placeholder="Sayı"
                                    value={pn}
                                    onChange={(e) => setPn(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    En Büyük Metastaz Çapı (mm)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Çap (dmet)"
                                    value={dmet}
                                    onChange={(e) => setDmet(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleCalculate}
                        className="w-full bg-[#E74C3C] hover:bg-[#C0392B] text-white font-bold py-4 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-lg"
                    >
                        <Calculator size={24} />
                        Hesapla
                    </button>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-1 flex flex-col">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24 flex flex-col h-[calc(100vh-8rem)] lg:h-auto lg:min-h-[600px]">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Sonuçlar</h2>

                        {result ? (
                            <div className="space-y-6 flex-1 flex flex-col">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                                    <p className="text-gray-500 text-sm mb-1">Rezidüel Kanser Yükü (RCB)</p>
                                    <p className="text-4xl font-bold text-[#E74C3C]">{result.rcb}</p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                                    <p className="text-gray-500 text-sm mb-1">RCB Sınıfı</p>
                                    <p className="text-xl font-bold text-gray-800">{result.category}</p>
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Detaylı Çıktı
                                    </label>
                                    <textarea
                                        value={result.output}
                                        readOnly
                                        className="w-full flex-1 p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none font-mono focus:outline-none min-h-[200px]"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400 flex-1 flex flex-col justify-center">
                                <Info size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Hesaplama yapmak için soldaki formu doldurun ve "Hesapla" butonuna basın.</p>
                            </div>
                        )}

                        <div className="mt-auto pt-6 border-t border-gray-100 text-xs text-center text-gray-500">
                            <p>
                                Bu hesaplama,{' '}
                                <a
                                    href="https://www.academia.edu/65377827/Histological_Evaluation_of_Therapeutic_Effect_and_RCB_Residual_Cancer_Burden_Index_in_Primary_Breast_Cancer_Operated_after_Neoadjuvant_Chemotherapy_Retrospective_Study_of_the_Clinicopathological_Findings_and_Prognosis?source=swp_share"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    Hajikano et al., 2017
                                </a>{' '}
                                çalışmasına dayanmaktadır.
                            </p>
                        </div>
                    </div>
                </div>
                <ReportingDisclaimer />
            </div>
        </PageContainer>
    );
}
