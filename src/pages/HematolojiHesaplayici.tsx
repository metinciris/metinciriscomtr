import React, { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calculator, Activity, FileText, AlertCircle, Search, Briefcase, RefreshCw } from 'lucide-react';

export function HematolojiHesaplayici() {
    const [inputs, setInputs] = useState({
        hb: '',
        hct: '',
        rbc: '',
        wbc: '',
        neutrophil: '',
        lymphocyte: '',
        rdw: '',
        platelet: '',
        iron: '',
        tibc: '',
        retic: '',
        nrbc: '0',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const resetInputs = () => {
        setInputs({
            hb: '',
            hct: '',
            rbc: '',
            wbc: '',
            neutrophil: '',
            lymphocyte: '',
            rdw: '',
            platelet: '',
            iron: '',
            tibc: '',
            retic: '',
            nrbc: '0',
        });
    };

    const parse = (val: string) => parseFloat(val) || 0;

    const hb = parse(inputs.hb);
    const hct = parse(inputs.hct);
    const rbc = parse(inputs.rbc);
    const wbc = parse(inputs.wbc);
    const neut = parse(inputs.neutrophil);
    const lymp = parse(inputs.lymphocyte);
    const rdw = parse(inputs.rdw);
    const platelet = parse(inputs.platelet);
    const iron = parse(inputs.iron);
    const tibc = parse(inputs.tibc);
    const retic = parse(inputs.retic);
    const nrbc = parse(inputs.nrbc);

    // Formulas
    const normalHct = 45;
    const correctedRetic = retic * (hct / normalHct);
    
    let maturationTime = 1;
    if (hct <= 15) maturationTime = 2.5;
    else if (hct <= 25) maturationTime = 2;
    else if (hct <= 35) maturationTime = 1.5;
    
    const rpi = maturationTime > 0 ? correctedRetic / maturationTime : 0;
    const arc = retic * rbc; // Actual output might need unit conversion, but following image formula literally.
    
    const correctedWBC = wbc * 100 / (100 + nrbc);
    const anc = (wbc * neut) / 100;
    const alc = (wbc * lymp) / 100;
    
    const mcv = rbc > 0 ? (hct * 10 / rbc) : 0;
    const mch = rbc > 0 ? (hb * 10 / rbc) : 0;
    const mchc = hct > 0 ? (hb * 100 / hct) : 0;
    
    const mentzer = rbc > 0 ? (mcv / rbc) : 0;
    const rdwi = rbc > 0 ? (mcv * rdw / rbc) : 0;
    const shineLal = (mcv * mcv * mch) / 100;
    const greenKing = hb > 0 ? (mcv * mcv * rdw) / (hb * 100) : 0;
    const englandFraser = mcv - rbc - (5 * hb) - 3.4;
    
    const nlr = alc > 0 ? (anc / alc) : 0;
    const plr = alc > 0 ? (platelet / alc) : 0;
    const sii = alc > 0 ? (platelet * anc / alc) : 0;
    
    const tsat = tibc > 0 ? (iron / tibc) * 100 : 0;
    const correctedPlatelet = platelet * (hct / normalHct);

    // Interpretations
    const getMentzerInterp = () => {
        if (!mcv || !rbc) return null;
        return mentzer < 13 ? "Thalassemia trait lehine" : "Demir eksikliği anemisi lehine";
    };

    const getRdwiInterp = () => {
        if (!mcv || !rdw || !rbc) return null;
        return rdwi > 220 ? "Demir eksikliği anemisi lehine" : "Thalassemia trait lehine";
    };

    const getEnglandFraserInterp = () => {
        if (!mcv || !rbc || !hb) return null;
        return englandFraser < 0 ? "Thalassemia trait lehine" : "Demir eksikliği anemisi lehine";
    };

    const getTsatInterp = () => {
        if (!iron || !tibc) return null;
        if (tsat < 16) return "Demir eksikliği";
        if (tsat <= 45) return "Normal";
        return "Demir yüklenmesi";
    };

    const format = (num: number) => num.toFixed(2);

    return (
        <PageContainer>
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-700 to-pink-800 text-white p-10 md:p-14 mb-10">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                            <Calculator className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase">Hesaplayıcı</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                        Hematoloji Hesaplayıcı
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl font-medium">
                        Değerleri girerek formül sonuçlarını anında hesaplayın ve yorumlayın.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Inputs Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="text-rose-600" /> Giriş Değerleri
                        </h2>
                        <button 
                            onClick={resetInputs}
                            className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                            title="Temizle"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <InputField label="Hb (g/dL)" name="hb" value={inputs.hb} onChange={handleInputChange} />
                        <InputField label="Hct (%)" name="hct" value={inputs.hct} onChange={handleInputChange} />
                        <InputField label="RBC (10^6/µL)" name="rbc" value={inputs.rbc} onChange={handleInputChange} />
                        <InputField label="WBC (10^3/µL)" name="wbc" value={inputs.wbc} onChange={handleInputChange} />
                        <InputField label="Nötrofil (%)" name="neutrophil" value={inputs.neutrophil} onChange={handleInputChange} />
                        <InputField label="Lenfosit (%)" name="lymphocyte" value={inputs.lymphocyte} onChange={handleInputChange} />
                        <InputField label="RDW (%)" name="rdw" value={inputs.rdw} onChange={handleInputChange} />
                        <InputField label="Platelet (10^3/µL)" name="platelet" value={inputs.platelet} onChange={handleInputChange} />
                        <InputField label="Serum Demiri (µg/dL)" name="iron" value={inputs.iron} onChange={handleInputChange} />
                        <InputField label="TİBK (µg/dL)" name="tibc" value={inputs.tibc} onChange={handleInputChange} />
                        <InputField label="Reticulositi (%)" name="retic" value={inputs.retic} onChange={handleInputChange} />
                        <InputField label="NRBC" name="nrbc" value={inputs.nrbc} onChange={handleInputChange} />
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Erythropoiesis & Reticulocyte */}
                    <ResultCard title="Eritropoez & Retikülosit İndeksleri">
                        <ResultItem label="Düzeltilmiş Retikülosit" value={format(correctedRetic)} unit="%" />
                        <ResultItem label="RPI (Retikülosit Üretim İndeksi)" value={format(rpi)} />
                        <ResultItem label="ARC (Mutlak Retikülosit)" value={format(arc)} />
                    </ResultCard>

                    {/* WBC Corrections */}
                    <ResultCard title="Lökosit Düzeltmeleri & Mutlak Sayımlar">
                        <ResultItem label="Düzeltilmiş WBC" value={format(correctedWBC)} unit="10^3/µL" />
                        <ResultItem label="Mutlak Nötrofil Sayısı (ANC)" value={format(anc)} unit="10^3/µL" />
                        <ResultItem label="Mutlak Lenfosit Sayısı (ALC)" value={format(alc)} unit="10^3/µL" />
                    </ResultCard>

                    {/* Red Cell Indices */}
                    <ResultCard title="Eritrosit İndeksleri (CBC)">
                        <ResultItem label="MCV" value={format(mcv)} unit="fL" />
                        <ResultItem label="MCH" value={format(mch)} unit="pg" />
                        <ResultItem label="MCHC" value={format(mchc)} unit="g/dL" />
                    </ResultCard>

                    {/* Microcytic Anemia Differentiation */}
                    <ResultCard title="Mikrositer Anemi Ayırıcı Tanı İndeksleri">
                        <ResultItem label="Mentzer İndeksi" value={format(mentzer)} interpretation={getMentzerInterp()} />
                        <ResultItem label="RDW İndeksi (RDWI)" value={format(rdwi)} interpretation={getRdwiInterp()} />
                        <ResultItem label="Shine & Lal İndeksi" value={format(shineLal)} />
                        <ResultItem label="Green & King İndeksi" value={format(greenKing)} />
                        <ResultItem label="England & Fraser İndeksi" value={format(englandFraser)} interpretation={getEnglandFraserInterp()} />
                    </ResultCard>

                    {/* Inflammatory / Prognostic */}
                    <ResultCard title="İnflamatuar / Prognostik Oranlar">
                        <ResultItem label="Nötrofil-Lenfosit Oranı (NLR)" value={format(nlr)} />
                        <ResultItem label="Platelet-Lenfosit Oranı (PLR)" value={format(plr)} />
                        <ResultItem label="Sistemik İmmün-İnflamatuar İndeks (SII)" value={format(sii)} />
                    </ResultCard>

                    {/* Iron Study */}
                    <ResultCard title="Demir Parametreleri">
                        <ResultItem label="Transferrin Saturasyonu (TSAT)" value={format(tsat)} unit="%" interpretation={getTsatInterp()} />
                    </ResultCard>

                    {/* Other Corrections */}
                    <ResultCard title="Diğer Düzeltmeler">
                        <ResultItem label="Düzeltilmiş Platelet Sayısı" value={format(correctedPlatelet)} unit="10^3/µL" />
                    </ResultCard>
                </div>
            </div>
        </PageContainer>
    );
}

interface InputFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function InputField({ label, name, value, onChange }: InputFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="block w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all text-sm"
                placeholder="0.0"
            />
        </div>
    );
}

interface ResultCardProps {
    title: string;
    children: React.ReactNode;
}

function ResultCard({ title, children }: ResultCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
}

interface ResultItemProps {
    label: string;
    value: string;
    unit?: string;
    interpretation?: string | null;
}

function ResultItem({ label, value, unit, interpretation }: ResultItemProps) {
    return (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-50 hover:border-gray-100 transition-all">
            <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
            <div className="text-xl font-bold text-gray-900 flex items-baseline gap-1">
                {value}
                {unit && <span className="text-sm font-normal text-gray-500">{unit}</span>}
            </div>
            {interpretation && (
                <div className={`mt-2 text-sm font-semibold flex items-center gap-1 ${
                    interpretation.includes("lehine") ? "text-indigo-600" : "text-emerald-600"
                }`}>
                    <AlertCircle size={14} />
                    {interpretation}
                </div>
            )}
        </div>
    );
}
