import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Copy, FileText, CheckCircle, Microscope, RotateCcw, Plus, Trash2, LayoutGrid } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { toast } from 'sonner';
import { RelatedPages } from '../components/RelatedPages';
import { ReportingDisclaimer } from '../components/ReportingDisclaimer';
import {
    Sample,
    THYROID_FEATURE_GROUPS,
    OTHER_FEATURE_GROUPS,
    BETHESDA_CATEGORIES,
    OTHER_DIAGNOSES,
    BETHESDA_5_OPTIONS,
    BETHESDA_6_OPTIONS,
    generateSuggestedDiagnosis,
    generateTiiabReport
} from '../core/calculators/tiiab';

const TiiabRaporlama: React.FC = () => {
    const [samples, setSamples] = useState<Sample[]>([
        { id: 1, type: 'thyroid', selectedFeatures: [], customInputs: {}, diagnosis: '', bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' }
    ]);
    const [activeSample, setActiveSample] = useState<number>(1);
    const [copiedToClipboard, setCopiedToClipboard] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const [lastModifiedSample, setLastModifiedSample] = useState<number | null>(null);
    const [lastModifiedTime, setLastModifiedTime] = useState<number>(Date.now());

    // Load saved data from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem('thyroidFNAData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setSamples(parsed.samples || samples);
                setActiveSample(parsed.activeSample || 1);
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }, []);

    // Save data to localStorage
    useEffect(() => {
        localStorage.setItem('thyroidFNAData', JSON.stringify({
            samples,
            activeSample
        }));
    }, [samples, activeSample]);

    // Auto-scroll to active sample in report
    useEffect(() => {
        if (reportRef.current) {
            const activeSampleElement = reportRef.current.querySelector(`[data-sample-id="${activeSample}"]`);
            if (activeSampleElement) {
                const reportContainer = reportRef.current;
                const elementTop = (activeSampleElement as HTMLElement).offsetTop;
                const scrollPosition = Math.max(0, elementTop - 100);

                reportContainer.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeSample]);

    const getCurrentSample = () => {
        return samples.find(s => s.id === activeSample) || samples[0];
    };

    const addSample = () => {
        if (samples.length < 5) {
            const newId = Math.max(...samples.map(s => s.id)) + 1;
            setSamples([...samples, {
                id: newId,
                type: 'thyroid',
                selectedFeatures: [],
                customInputs: {},
                diagnosis: '',
                bethesda3Type: '',
                bethesda5Type: '',
                bethesda6Type: ''
            }]);
            setActiveSample(newId);
        }
    };

    const toggleSampleType = (sampleId: number) => {
        setSamples(samples.map(sample =>
            sample.id === sampleId
                ? { ...sample, type: sample.type === 'thyroid' ? 'other' : 'thyroid', selectedFeatures: [], customInputs: {}, diagnosis: '', bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' }
                : sample
        ));
    };

    const updateBethesda5Type = (value: string) => {
        setSamples(samples.map(sample =>
            sample.id === activeSample ? { ...sample, bethesda5Type: value } : sample
        ));
    };

    const updateBethesda6Type = (value: string) => {
        setSamples(samples.map(sample =>
            sample.id === activeSample ? { ...sample, bethesda6Type: value } : sample
        ));
    };

    const toggleFeature = (featureId: string) => {
        setLastModifiedSample(activeSample);
        setLastModifiedTime(Date.now());

        setSamples(samples.map(sample =>
            sample.id === activeSample
                ? {
                    ...sample,
                    selectedFeatures: sample.selectedFeatures.includes(featureId)
                        ? sample.selectedFeatures.filter(f => f !== featureId)
                        : [...sample.selectedFeatures, featureId]
                }
                : sample
        ));
    };

    const updateCustomInput = (groupTitle: string, value: string) => {
        setLastModifiedSample(activeSample);
        setLastModifiedTime(Date.now());

        setSamples(samples.map(sample =>
            sample.id === activeSample
                ? {
                    ...sample,
                    customInputs: { ...sample.customInputs, [groupTitle]: value }
                }
                : sample
        ));
    };

    const updateDiagnosis = (diagnosis: string) => {
        setLastModifiedSample(activeSample);
        setLastModifiedTime(Date.now());

        setSamples(samples.map(sample =>
            sample.id === activeSample
                ? { ...sample, diagnosis, bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' }
                : sample
        ));
    };

    const updateBethesda3Type = (type: 'nuclear' | 'structural' | 'both' | '') => {
        setSamples(samples.map(sample =>
            sample.id === activeSample
                ? { ...sample, bethesda3Type: type }
                : sample
        ));
    };

    // Clear the modification highlight after 3 seconds
    useEffect(() => {
        if (lastModifiedSample !== null) {
            const timer = setTimeout(() => {
                setLastModifiedSample(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [lastModifiedTime]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generateTiiabReport(samples));
            setCopiedToClipboard(true);
            toast.success("Rapor kopyalandı");
            setTimeout(() => setCopiedToClipboard(false), 2000);
        } catch (error) {
            console.error('Failed to copy info:', error);
        }
    };

    const clearAll = () => {
        if (window.confirm("Bu örnek temizlenecek?")) {
            setSamples(samples.map(sample => sample.id === activeSample ? { ...sample, selectedFeatures: [], customInputs: {}, diagnosis: '', bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' } : sample));
        }
    };

    const clearAllSamples = () => {
        if (window.confirm("Bütün örnekler temizlenecek?")) {
            setSamples([{ id: 1, type: 'thyroid', selectedFeatures: [], customInputs: {}, diagnosis: '', bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' }]);
            setActiveSample(1);
        }
    };

    const getDiagnosisStyles = (diag: string) => {
        if (diag.includes('Kategori 1')) return 'border-yellow-400 bg-yellow-50 text-yellow-800 focus:ring-yellow-500';
        if (diag.includes('Kategori 2')) return 'border-green-400 bg-green-50 text-green-800 focus:ring-green-500';
        if (diag.includes('Kategori 6')) return 'border-purple-400 bg-purple-50 text-purple-800 focus:ring-purple-500';
        return 'border-red-400 bg-red-50 text-red-800 focus:ring-red-500';
    };

    const getSampleButtonStyles = (sample: Sample) => {
        const diagnosis = sample.diagnosis || (sample.type === 'thyroid' ? generateSuggestedDiagnosis(sample) : "Benign Sitoloji");
        const isActive = sample.id === activeSample;

        let colorClass = 'blue';
        if (sample.type === 'other') colorClass = 'green';
        else if (diagnosis.includes('Kategori 1')) colorClass = 'yellow';
        else if (diagnosis.includes('Kategori 2')) colorClass = 'green';
        else if (diagnosis.includes('Kategori 6')) colorClass = 'purple';
        else colorClass = 'red';

        if (isActive) return `bg-${colorClass}-600 text-white shadow-lg`;
        return `bg-${colorClass}-100 text-${colorClass}-800 hover:bg-${colorClass}-200`;
    };

    const currentSample = getCurrentSample();
    const currentFeatureGroups = currentSample.type === 'thyroid' ? THYROID_FEATURE_GROUPS : OTHER_FEATURE_GROUPS;
    const currentDiagnoses = currentSample.type === 'thyroid' ? BETHESDA_CATEGORIES : OTHER_DIAGNOSES;

    return (
        <PageContainer>
            <div className="min-h-screen bg-slate-50 pb-20">
                {/* Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="w-full mx-auto px-4 py-3 md:py-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                                    <Microscope className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                                        TİİAB Raporlama Sistemi
                                    </h1>
                                    <p className="text-xs font-medium text-slate-500">
                                        Tiroid İnce İğne Aspirasyon Biyopsisi (Bethesda 2023)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                                {samples.map(sample => (
                                    <button
                                        key={sample.id}
                                        onClick={() => setActiveSample(sample.id)}
                                        className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${getSampleButtonStyles(sample)}`}
                                    >
                                        {sample.id}. {sample.type === 'thyroid' ? 'Tiroid' : 'Diğer'}
                                    </button>
                                ))}
                                {samples.length < 5 && (
                                    <button
                                        onClick={addSample}
                                        className="p-2.5 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                    <div className="w-full mx-auto px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleSampleType(activeSample)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${currentSample.type === 'thyroid'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                                    }`}
                            >
                                {currentSample.type === 'thyroid' ? "Diğer Sitoloji'ye Çevir" : "Tiroid Sitoloji'ye Çevir"}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearAll}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Örneği Sıfırla
                            </button>
                            <button
                                onClick={clearAllSamples}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg shadow-rose-100"
                            >
                                <Trash2 className="w-4 h-4" /> Tümünü Temizle
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full mx-auto px-4 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Left: Features */}
                        <div className="lg:col-span-9 space-y-4">
                            {/* Tanı Seçimi */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">Tanı ve Kategori</h3>
                                        <p className="text-xs font-medium text-slate-500">Bulgulara göre otomatik önerilir</p>
                                    </div>
                                    <select
                                        value={currentSample.diagnosis || generateSuggestedDiagnosis(currentSample)}
                                        onChange={(e) => updateDiagnosis(e.target.value)}
                                        className={`w-full md:w-auto px-6 py-3 text-sm md:text-base font-bold border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-opacity-20 transition-all ${currentSample.type === 'thyroid'
                                            ? getDiagnosisStyles(currentSample.diagnosis || generateSuggestedDiagnosis(currentSample))
                                            : 'border-emerald-400 bg-emerald-50 text-emerald-800 focus:ring-emerald-500'
                                            }`}
                                    >
                                        {currentDiagnoses.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                {/* Bethesda 3 Type Requirement */}
                                {(currentSample.diagnosis === "Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3)" ||
                                    (!currentSample.diagnosis && generateSuggestedDiagnosis(currentSample) === "Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3)")) && (
                                        <div className="mb-6 p-6 bg-amber-50 rounded-2xl border border-amber-200 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-4">Rapor Başlığına Eklenecek Atipi Türü:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { id: 'nuclear', label: 'Nükleer atipi' },
                                                    { id: 'structural', label: 'Yapısal atipi' },
                                                    { id: 'both', label: 'Yapısal ve Nükleer atipi' }
                                                ].map(type => (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => updateBethesda3Type(type.id as any)}
                                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${currentSample.bethesda3Type === type.id
                                                            ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-100'
                                                            : 'bg-white border-amber-200 text-amber-800 hover:border-amber-400'
                                                            }`}
                                                    >
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {/* Bethesda 5 Type Requirement */}
                                {(currentSample.diagnosis === "Malignite Şüphesi (Bethesda Kategori 5)" ||
                                    (!currentSample.diagnosis && generateSuggestedDiagnosis(currentSample) === "Malignite Şüphesi (Bethesda Kategori 5)")) && (
                                        <div className="mb-6 p-6 bg-red-50 rounded-2xl border border-red-200 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-sm font-black text-red-800 uppercase tracking-widest mb-4">Tanı Detayı:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {BETHESDA_5_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => updateBethesda5Type(opt)}
                                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${currentSample.bethesda5Type === opt
                                                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-100'
                                                            : 'bg-white border-red-200 text-red-800 hover:border-red-400'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {/* Bethesda 6 Type Requirement */}
                                {(currentSample.diagnosis === "Malign (Bethesda Kategori 6)" ||
                                    (!currentSample.diagnosis && generateSuggestedDiagnosis(currentSample) === "Malign (Bethesda Kategori 6)")) && (
                                        <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-200 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-sm font-black text-purple-800 uppercase tracking-widest mb-4">Tanı Detayı:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {BETHESDA_6_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => updateBethesda6Type(opt)}
                                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${currentSample.bethesda6Type === opt
                                                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100'
                                                            : 'bg-white border-purple-200 text-purple-800 hover:border-purple-400'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>

                            {/* Masonry-like Features Grid */}
                            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 3xl:columns-6 gap-4 space-y-4">
                                {currentFeatureGroups.map(group => (
                                    <div key={group.title} className="break-inside-avoid bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
                                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-indigo-600" />
                                            {group.title}
                                        </h3>
                                        <div className="flex flex-col gap-1.5 mb-3">
                                            {group.features.map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => toggleFeature(f.id)}
                                                    className={`w-full p-2 text-left text-[13px] font-bold rounded-xl transition-all border-2 ${currentSample.selectedFeatures.includes(f.id)
                                                        ? f.malignant
                                                            ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100'
                                                            : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                        : f.malignant
                                                            ? 'bg-rose-50 border-rose-100 text-rose-800 hover:border-rose-300'
                                                            : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-white'
                                                        }`}
                                                >
                                                    {f.text}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Ek notlar..."
                                            value={currentSample.customInputs[group.title] || ''}
                                            onChange={(e) => updateCustomInput(group.title, e.target.value)}
                                            className="w-full px-3 py-2 text-[13px] font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Preview (Sticky) */}
                        <div className="lg:col-span-3 lg:sticky lg:top-20 h-fit">
                            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xl shadow-indigo-100/50 overflow-hidden flex flex-col">
                                <div className="p-4 bg-slate-900 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-400" />
                                        <span className="font-black text-white uppercase tracking-widest text-xs">Rapor Önizleme</span>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${copiedToClipboard ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-indigo-400 hover:text-white'
                                            }`}
                                    >
                                        {copiedToClipboard ? 'KOPYALANDI!' : 'KOPYALA'}
                                    </button>
                                </div>
                                <div
                                    ref={reportRef}
                                    className="p-4 bg-white overflow-y-auto max-h-[70vh] md:max-h-[80vh] font-mono text-[13px] leading-relaxed text-slate-800"
                                >
                                    {generateTiiabReport(samples).split('\n').map((line, i) => {
                                        const isActiveLine = line.includes(`${activeSample}-`);
                                        return (
                                            <div
                                                key={i}
                                                data-sample-id={isActiveLine ? activeSample : undefined}
                                                className={`mb-1 ${isActiveLine ? 'bg-indigo-50 border-l-4 border-indigo-600 pl-2 py-1 rounded-r-md' : ''}`}
                                            >
                                                {line || '\u00A0'}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-100">
                                    <button
                                        onClick={copyToClipboard}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-black text-base transition-all shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 group"
                                    >
                                        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Raporu Kopyala
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ReportingDisclaimer />
            <RelatedPages
                pages={[
                    {
                        title: "Sjögren Raporlama",
                        subtitle: "Minör tükrük bezi biyopsisi raporlama aracı",
                        page: "sjogren-raporlama",
                        color: "bg-indigo-600",
                        icon: Microscope
                    },
                    {
                        title: "GİST Raporlama",
                        subtitle: "Gastrointestinal Stromal Tümör raporlama aracı",
                        page: "gist-raporlama",
                        color: "bg-purple-600",
                        icon: FileText
                    },
                    {
                        title: "Endoskopi Raporlama",
                        subtitle: "Gastrointestinal sistem biyopsileri raporlama aracı",
                        page: "endoskopi-raporlama",
                        color: "bg-blue-600",
                        icon: LayoutGrid
                    }
                ]}
            />
        </PageContainer>
    );
};

export default TiiabRaporlama;
