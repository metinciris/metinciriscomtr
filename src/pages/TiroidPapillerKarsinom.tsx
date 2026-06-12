import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Copy, Check, Plus, Trash2, Microscope, FileText, RotateCcw, LayoutGrid } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { RelatedPages } from '../components/RelatedPages';
import { ReportingDisclaimer } from '../components/ReportingDisclaimer';
import { toast } from 'sonner';
import {
    Tumor,
    LymphNode,
    HISTOLOGIC_SUBTYPES,
    BACKGROUND_THYROID_OPTIONS,
    TUMOR_LOCATION_EXAMPLES,
    CAPSULE_ET_OPTIONS,
    STRAP_OPTIONS,
    generateThyroidReport
} from '../core/calculators/tiroidPapiller';

export function TiroidPapillerKarsinom() {
    // --- State ---
    const [specimenType, setSpecimenType] = useState<string>('Total Tiroidektomi');
    const [tumors, setTumors] = useState<Tumor[]>([
        {
            id: 1,
            location: '',
            size: '',
            sample: '',
            subtypes: ['Klasik papiller karsinom'],
            encapsulation: 'Yoktur',
            capsuleEtOptions: ['Tiroid dışı invazyon yoktur'],
            strapMuscle: '',
            lvInvasion: 'yoktur',
            lymphaticInvasion: false,
            angioinvasion: false,
            perineuralInvasion: false,
            mitoticActivity: '0',
            necrosis: false,
            includeMarginsLine: false,
            marginsTumorPresent: false,
            marginsNote: ''
        }
    ]);
    const [lymphNodes, setLymphNodes] = useState<LymphNode[]>([]);
    const [backgroundThyroid, setBackgroundThyroid] = useState<string[]>(['Nodüler guatr']);
    const [freeNote, setFreeNote] = useState<string>('');
    
    const [activeTumorId, setActiveTumorId] = useState<number | null>(1);
    const [copied, setCopied] = useState<boolean>(false);

    // --- Highlighting States ---
    const [highlightedLines, setHighlightedLines] = useState<Record<string, number>>({});
    const [changedFields, setChangedFields] = useState<Record<string, number>>({});
    
    const prevLinesRef = useRef<string[]>([]);
    const controlsPanelRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    // --- Report Calculation ---
    const reportText = useMemo(() => {
        return generateThyroidReport({
            specimenType,
            tumors,
            lymphNodes,
            backgroundThyroid,
            freeNote
        });
    }, [specimenType, tumors, lymphNodes, backgroundThyroid, freeNote]);

    // --- Line Highlighting Effect ---
    useEffect(() => {
        const currentLines = reportText.split('\n');
        const prevLines = prevLinesRef.current;
        const now = Date.now();
        const nextHighlights = { ...highlightedLines };
        let changed = false;

        currentLines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            // Highlight if the line is new/modified in comparison to previous text
            if (!prevLines.includes(line)) {
                nextHighlights[line] = now;
                changed = true;

                // Schedule cleanup for this specific line after 6 seconds
                setTimeout(() => {
                    setHighlightedLines(prev => {
                        const updated = { ...prev };
                        delete updated[line];
                        return updated;
                    });
                }, 6000);
            }
        });

        if (changed) {
            setHighlightedLines(nextHighlights);
        }
        prevLinesRef.current = currentLines;
    }, [reportText]);

    // --- Scroll highlighted line into view ---
    useEffect(() => {
        const reportContainer = reportRef.current;
        if (reportContainer) {
            const highlightedElement = reportContainer.querySelector('.animate-line-flash');
            if (highlightedElement) {
                highlightedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }
    }, [highlightedLines]);

    // --- Input Control Flash Trigger ---
    const markFieldChanged = (fieldKey: string) => {
        const now = Date.now();
        setChangedFields(prev => ({ ...prev, [fieldKey]: now }));
        setTimeout(() => {
            setChangedFields(prev => {
                const updated = { ...prev };
                delete updated[fieldKey];
                return updated;
            });
        }, 2000);
    };

    // --- Actions ---
    const addTumor = () => {
        const newId = Date.now();
        const newTumor: Tumor = {
            id: newId,
            location: '',
            size: '',
            sample: '',
            subtypes: ['Klasik papiller karsinom'],
            encapsulation: 'Yoktur',
            capsuleEtOptions: ['Tiroid dışı invazyon yoktur'],
            strapMuscle: '',
            lvInvasion: 'yoktur',
            lymphaticInvasion: false,
            angioinvasion: false,
            perineuralInvasion: false,
            mitoticActivity: '0',
            necrosis: false,
            includeMarginsLine: false,
            marginsTumorPresent: false,
            marginsNote: ''
        };
        setTumors([...tumors, newTumor]);
        setActiveTumorId(newId);
        markFieldChanged(`tumor-add-${newId}`);
        toast.success("Yeni Tümör Odağı Eklendi");
    };

    const deleteTumor = (id: number) => {
        if (tumors.length > 1) {
            const remaining = tumors.filter(t => t.id !== id);
            setTumors(remaining);
            if (activeTumorId === id) {
                setActiveTumorId(remaining[remaining.length - 1].id);
            }
            toast.success("Tümör Odağı Silindi");
        } else {
            toast.error("En az bir tümör odağı bulunmalıdır");
        }
    };

    const updateTumor = (id: number, field: keyof Tumor, value: any) => {
        markFieldChanged(`tumor-${id}-${String(field)}`);
        setTumors(prev => prev.map(t => {
            if (t.id === id) {
                const updated = { ...t, [field]: value } as Tumor;

                // Sync logic
                if (field === 'capsuleEtOptions') {
                    const opts = value as string[];
                    // Prevent both "invazyon var" and "invazyon yok" from being selected together
                    let finalOpts = [...opts];
                    if (opts.includes('Tiroid dışı invazyon vardır')) {
                        finalOpts = finalOpts.filter(x => x !== 'Tiroid dışı invazyon yoktur');
                    }
                    if (opts.includes('Tiroid dışı invazyon yoktur')) {
                        finalOpts = finalOpts.filter(x => x !== 'Tiroid dışı invazyon vardır');
                    }
                    if (!finalOpts.length) {
                        finalOpts = ['Tiroid dışı invazyon yoktur'];
                    }
                    updated.capsuleEtOptions = finalOpts;
                }

                // If no invasion, clear strap muscle
                if (!updated.capsuleEtOptions.includes('Tiroid dışı invazyon vardır')) {
                    updated.strapMuscle = '';
                }

                // Auto-include margins if there's invasion/adhesion
                const hasAdhesion = updated.capsuleEtOptions.includes('Tiroid dışı invazyon vardır') || 
                                    updated.capsuleEtOptions.includes('Tiroid kapsülüne yapışıktır');
                const hasStrap = !!(updated.strapMuscle && updated.strapMuscle.trim());
                if (hasAdhesion || hasStrap) {
                    updated.includeMarginsLine = true;
                }

                return updated;
            }
            return t;
        }));
    };

    const addLymphNode = () => {
        const newId = Date.now();
        setLymphNodes([...lymphNodes, {
            id: newId,
            location: '',
            metastatic: 0,
            total: 1,
            metastaticTumorSize: '',
            ene: false,
            eneSize: ''
        }]);
        markFieldChanged(`ln-add-${newId}`);
        toast.success("Lenf Nodu Grubu Eklendi");
    };

    const deleteLymphNode = (id: number) => {
        setLymphNodes(lymphNodes.filter(ln => ln.id !== id));
        toast.success("Lenf Nodu Grubu Silindi");
    };

    const updateLymphNode = (id: number, field: keyof LymphNode, value: any) => {
        markFieldChanged(`ln-${id}-${String(field)}`);
        setLymphNodes(prev => prev.map(ln => {
            if (ln.id === id) {
                const updated = { ...ln, [field]: value } as LymphNode;
                // If metastatic is 0 or less, clear ENE and tumor size fields
                if (field === 'metastatic' && Number(value) <= 0) {
                    updated.metastaticTumorSize = '';
                    updated.ene = false;
                    updated.eneSize = '';
                }
                if (field === 'ene' && !value) {
                    updated.eneSize = '';
                }
                return updated;
            }
            return ln;
        }));
    };

    const toggleBackgroundOption = (opt: string) => {
        markFieldChanged('backgroundThyroid');
        if (backgroundThyroid.includes(opt)) {
            setBackgroundThyroid(backgroundThyroid.filter(x => x !== opt));
        } else {
            setBackgroundThyroid([...backgroundThyroid, opt]);
        }
    };

    const resetAll = () => {
        if (window.confirm("Tüm formu sıfırlamak istediğinize emin misiniz?")) {
            setSpecimenType('Total Tiroidektomi');
            setTumors([
                {
                    id: 1,
                    location: '',
                    size: '',
                    sample: '',
                    subtypes: ['Klasik papiller karsinom'],
                    encapsulation: 'Yoktur',
                    capsuleEtOptions: ['Tiroid dışı invazyon yoktur'],
                    strapMuscle: '',
                    lvInvasion: 'yoktur',
                    lymphaticInvasion: false,
                    angioinvasion: false,
                    perineuralInvasion: false,
                    mitoticActivity: '0',
                    necrosis: false,
                    includeMarginsLine: false,
                    marginsTumorPresent: false,
                    marginsNote: ''
                }
            ]);
            setLymphNodes([]);
            setBackgroundThyroid(['Nodüler guatr']);
            setFreeNote('');
            setActiveTumorId(1);
            toast.success("Form Sıfırlandı");
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(reportText);
            setCopied(true);
            toast.success("Rapor Panoya Kopyalandı");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Kopyalama başarısız oldu");
        }
    };

    // --- Custom styles to ensure inputs and preview look good with animation ---
    const getFieldClass = (key: string) => {
        const isFlash = changedFields[key] !== undefined;
        return `w-full px-3 py-1.5 text-sm font-medium border rounded-lg focus:outline-none transition-all duration-200 ${
            isFlash ? 'animate-control-flash border-orange-500 bg-orange-50/50 shadow-md shadow-orange-100/50' : 'bg-white border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
        }`;
    };

    const getToggleClass = (key: string, isActive: boolean, isBad: boolean = false) => {
        const isFlash = changedFields[key] !== undefined;
        let base = `px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 flex-1 text-center cursor-pointer ${
            isFlash ? 'animate-control-flash shadow-md shadow-orange-100/50' : ''
        } `;
        
        if (isActive) {
            if (isBad) {
                base += 'bg-red-650 border-red-700 text-white shadow-md shadow-red-100/50';
            } else {
                base += 'bg-indigo-600 border-indigo-600 text-white shadow-sm';
            }
        } else {
            base += 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300';
        }
        return base;
    };

    return (
        <PageContainer>
            {/* Custom Animations & Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes line-flash {
                    0% {
                        background-color: rgba(251, 146, 60, 0.45);
                        border-left: 4px solid #f97316;
                    }
                    100% {
                        background-color: transparent;
                        border-left: 4px solid transparent;
                    }
                }
                .animate-line-flash {
                    animation: line-flash 5.8s ease-out forwards;
                    padding-left: 8px;
                    margin-left: -8px;
                    border-radius: 4px;
                }
                @keyframes control-flash {
                    0% {
                        background-color: #ffedd5;
                        border-color: #fb923c;
                        box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.2);
                    }
                }
                .animate-control-flash {
                    animation: control-flash 1.5s ease-out;
                }
                .bg-red-655 {
                    background-color: #dc2626;
                }
                .bg-red-650 {
                    background-color: #ef4444;
                }
            `}} />

            <div className="min-h-screen bg-slate-50/50 pb-20">
                {/* Header */}
                <div className="bg-white border-b border-slate-200/80 mb-6">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                                <Microscope className="w-5.5 h-5.5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                                    Tiroid Papiller Karsinom Rapor Oluşturucu
                                </h1>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                    Histopatolojik Papiller Karsinom Akıllı Raporlama Şablonu
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={resetAll}
                                className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-xs font-bold border border-slate-200 bg-white"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Formu Sıfırla
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* LEFT COLUMN: Controls Panel */}
                        <div ref={controlsPanelRef} className="lg:col-span-7 space-y-5">
                            
                            {/* SECTION: TANI BİLGİLERİ */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
                                <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                    1. Tanı Bilgileri
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Materyal Tipi</label>
                                        <select
                                            value={specimenType}
                                            onChange={(e) => {
                                                setSpecimenType(e.target.value);
                                                markFieldChanged('specimenType');
                                            }}
                                            className={getFieldClass('specimenType')}
                                        >
                                            <option value="Total Tiroidektomi">Total Tiroidektomi</option>
                                            <option value="Konsültasyon, Total tiroidektomi">Konsültasyon, Total tiroidektomi</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tanı Altına Serbest Not</label>
                                        <input
                                            type="text"
                                            value={freeNote}
                                            onChange={(e) => {
                                                setFreeNote(e.target.value);
                                                markFieldChanged('freeNote');
                                            }}
                                            placeholder="Varsa eklemek istediğiniz açıklama notu..."
                                            className={getFieldClass('freeNote')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: TÜMÖR ODAKLARI */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
                                <div className="border-b border-slate-100 pb-3 mb-4">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                        2. Tümör Odakları
                                    </h3>
                                </div>

                                {/* SCROLL-FREE COMPACT GRID OF TUMOR FOCUSES */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {tumors.map((tumor, idx) => {
                                        const isActive = tumor.id === activeTumorId;
                                        return (
                                            <div 
                                                key={tumor.id} 
                                                onClick={() => setActiveTumorId(tumor.id)}
                                                onFocusCapture={() => setActiveTumorId(tumor.id)}
                                                className={`p-3.5 border rounded-xl shadow-sm flex flex-col justify-between transition-all duration-300 ${
                                                    isActive 
                                                        ? 'bg-yellow-50/75 border-yellow-300 shadow-md shadow-yellow-100/50' 
                                                        : changedFields[`tumor-add-${tumor.id}`] 
                                                            ? 'border-indigo-500 bg-indigo-50/10' 
                                                            : 'bg-slate-50/50 border-slate-200'
                                                }`}
                                            >
                                                {/* Card Header */}
                                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3">
                                                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                                                        {idx + 1}. Odak {isActive && <span className="text-[10px] text-yellow-600 ml-1.5 font-bold bg-yellow-100/80 px-1.5 py-0.5 rounded">(Aktif Odak)</span>}
                                                    </span>
                                                    {tumors.length > 1 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteTumor(tumor.id);
                                                            }}
                                                            className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                                                            title="Bu tümörü sil"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Card Fields Form Layout */}
                                                <div className="space-y-3 flex-1">
                                                    {/* Yerleşim, Çap, Örnek */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yerleşim</label>
                                                            <input
                                                                type="text"
                                                                value={tumor.location}
                                                                onChange={(e) => updateTumor(tumor.id, 'location', e.target.value)}
                                                                placeholder="Sağ/Sol lob..."
                                                                list={`loc-list-${tumor.id}`}
                                                                className={getFieldClass(`tumor-${tumor.id}-location`)}
                                                            />
                                                            <datalist id={`loc-list-${tumor.id}`}>
                                                                {TUMOR_LOCATION_EXAMPLES.map(ex => <option key={ex} value={ex} />)}
                                                            </datalist>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Çap (mm)</label>
                                                            <input
                                                                type="number"
                                                                value={tumor.size}
                                                                min="0"
                                                                onChange={(e) => updateTumor(tumor.id, 'size', e.target.value === '' ? '' : Number(e.target.value))}
                                                                placeholder="mm"
                                                                className={getFieldClass(`tumor-${tumor.id}-size`)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Örnek No</label>
                                                            <input
                                                                type="text"
                                                                value={tumor.sample}
                                                                onChange={(e) => updateTumor(tumor.id, 'sample', e.target.value)}
                                                                placeholder="Örn: 1A"
                                                                className={getFieldClass(`tumor-${tumor.id}-sample`)}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Alt Tip */}
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Histolojik Alt Tip</label>
                                                        <select
                                                            value={tumor.subtypes[0]}
                                                            onChange={(e) => updateTumor(tumor.id, 'subtypes', [e.target.value])}
                                                            className={getFieldClass(`tumor-${tumor.id}-subtypes`)}
                                                        >
                                                            {HISTOLOGIC_SUBTYPES.map(sub => (
                                                                <option key={sub} value={sub}>{sub}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Binary Flags with Compact Toggles */}
                                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                                        {/* Enkapsülasyon */}
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enkapsülasyon</label>
                                                            <div className="flex gap-1">
                                                                {['Yoktur', 'vardır', 'Kısmen vardır'].map(opt => {
                                                                    const optActive = tumor.encapsulation === opt;
                                                                    return (
                                                                        <button
                                                                            key={opt}
                                                                            type="button"
                                                                            onClick={() => updateTumor(tumor.id, 'encapsulation', opt)}
                                                                            className={`${getToggleClass(`tumor-${tumor.id}-encapsulation`, optActive)} ${
                                                                                optActive ? 'bg-indigo-100 text-indigo-800' : ''
                                                                            }`}
                                                                        >
                                                                            {opt === 'Yoktur' ? 'Yok' : opt === 'vardır' ? 'Var' : 'Kısmen'}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* LVI */}
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lenfatik/Venöz Inv.</label>
                                                            <div className="flex gap-1">
                                                                {['yoktur', 'VARDIR', 'Kuşkulu VARDIR'].map(opt => {
                                                                    const optActive = tumor.lvInvasion === opt;
                                                                    const isBad = opt !== 'yoktur';
                                                                    return (
                                                                        <button
                                                                            key={opt}
                                                                            type="button"
                                                                            onClick={() => updateTumor(tumor.id, 'lvInvasion', opt)}
                                                                            className={`${getToggleClass(`tumor-${tumor.id}-lvInvasion`, optActive, isBad)} ${
                                                                                optActive 
                                                                                    ? isBad 
                                                                                        ? 'bg-red-100 text-red-800 border-red-300' 
                                                                                        : 'bg-indigo-100 text-indigo-800' 
                                                                                    : ''
                                                                            }`}
                                                                        >
                                                                            {opt === 'yoktur' ? 'Yok' : opt === 'VARDIR' ? 'Var' : 'Şüpheli'}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* LVI Types (Only shown if LVI is VARDIR - Bad prognosis -> red highlighting) */}
                                                    {tumor.lvInvasion === 'VARDIR' && (
                                                        <div className="bg-red-50/50 border border-red-200/80 p-2 rounded-lg flex items-center justify-around gap-2">
                                                            <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-bold px-2 py-1 rounded transition-colors ${
                                                                tumor.lymphaticInvasion ? 'bg-red-650 text-white shadow-sm' : 'text-red-700 bg-red-50 hover:bg-red-100'
                                                            }`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={tumor.lymphaticInvasion}
                                                                    onChange={(e) => updateTumor(tumor.id, 'lymphaticInvasion', e.target.checked)}
                                                                    className="rounded text-red-600 w-4 h-4 cursor-pointer focus:ring-0"
                                                                />
                                                                Lenfatik
                                                            </label>
                                                            <label className={`flex items-center gap-1.5 cursor-pointer text-xs font-bold px-2 py-1 rounded transition-colors ${
                                                                tumor.angioinvasion ? 'bg-red-650 text-white shadow-sm' : 'text-red-700 bg-red-50 hover:bg-red-100'
                                                            }`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={tumor.angioinvasion}
                                                                    onChange={(e) => updateTumor(tumor.id, 'angioinvasion', e.target.checked)}
                                                                    className="rounded text-red-600 w-4 h-4 cursor-pointer focus:ring-0"
                                                                />
                                                                Anjioinvazyon
                                                            </label>
                                                        </div>
                                                    )}

                                                    {/* Perinöral, Mitoz, Nekroz */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Perinöral Inv.</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateTumor(tumor.id, 'perineuralInvasion', !tumor.perineuralInvasion)}
                                                                className={`${getToggleClass(`tumor-${tumor.id}-perineuralInvasion`, tumor.perineuralInvasion, true)} ${
                                                                    tumor.perineuralInvasion ? 'bg-red-100 text-red-800 border-red-300' : ''
                                                                }`}
                                                            >
                                                                {tumor.perineuralInvasion ? 'Var' : 'Yok'}
                                                            </button>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nekroz</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateTumor(tumor.id, 'necrosis', !tumor.necrosis)}
                                                                className={`${getToggleClass(`tumor-${tumor.id}-necrosis`, tumor.necrosis, true)} ${
                                                                    tumor.necrosis ? 'bg-red-100 text-red-800 border-red-300' : ''
                                                                }`}
                                                            >
                                                                {tumor.necrosis ? 'Var' : 'Yok'}
                                                            </button>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mitotik Oran</label>
                                                            <input
                                                                type="text"
                                                                value={tumor.mitoticActivity}
                                                                onChange={(e) => updateTumor(tumor.id, 'mitoticActivity', e.target.value.replace(/[^0-9]/g, ''))}
                                                                placeholder="0"
                                                                className={getFieldClass(`tumor-${tumor.id}-mitoticActivity`)}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Kapsül İlişkisi & Tiroid Dışı İnvazyon Checkboxes */}
                                                    <div className="bg-white border border-slate-200 p-2 rounded-lg space-y-1.5">
                                                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest border-b pb-0.5 mb-1.5">
                                                            Kapsül & Tiroid Dışı İnvazyon
                                                        </label>
                                                        {CAPSULE_ET_OPTIONS.map(opt => {
                                                            const isChecked = tumor.capsuleEtOptions.includes(opt);
                                                            const isBad = opt === 'Tiroid dışı invazyon vardır';
                                                            return (
                                                                <label 
                                                                    key={opt} 
                                                                    className={`flex items-center gap-2 cursor-pointer text-xs font-bold px-2 py-1 rounded border transition-colors ${
                                                                        isChecked 
                                                                            ? isBad 
                                                                                ? 'bg-red-50 text-red-700 border-red-200' 
                                                                                : 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                                                            : 'text-slate-600 hover:text-slate-800 border-transparent bg-transparent'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={(e) => {
                                                                            let next = [...tumor.capsuleEtOptions];
                                                                            if (e.target.checked) {
                                                                                next.push(opt);
                                                                            } else {
                                                                                next = next.filter(x => x !== opt);
                                                                            }
                                                                            updateTumor(tumor.id, 'capsuleEtOptions', next);
                                                                        }}
                                                                        className={`rounded w-3.5 h-3.5 cursor-pointer focus:ring-0 ${
                                                                            isBad ? 'text-red-600' : 'text-indigo-600'
                                                                        }`}
                                                                    />
                                                                    {opt === 'Tiroid kapsülüne yapışıktır' ? 'Kapsüle Yapışık' : opt === 'Tiroid dışı invazyon vardır' ? 'İnvazyon Var' : 'İnvazyon Yok'}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Strap Muscle (Only if ET is Var - Bad prognosis -> red highlighting) */}
                                                    {tumor.capsuleEtOptions.includes('Tiroid dışı invazyon vardır') && (
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Çizgili Kas İnvazyonu</label>
                                                            <div className="flex gap-1">
                                                                {STRAP_OPTIONS.map(opt => {
                                                                    const optActive = tumor.strapMuscle === opt;
                                                                    const isBad = opt.includes('VARDIR');
                                                                    return (
                                                                        <button
                                                                            key={opt}
                                                                            type="button"
                                                                            onClick={() => updateTumor(tumor.id, 'strapMuscle', opt)}
                                                                            className={`${getToggleClass(`tumor-${tumor.id}-strapMuscle`, optActive, isBad)} ${
                                                                                optActive 
                                                                                    ? isBad 
                                                                                        ? 'bg-red-105 border-red-300 text-white shadow-md' 
                                                                                        : 'bg-indigo-100 text-indigo-800'
                                                                                    : ''
                                                                            }`}
                                                                        >
                                                                            {opt.includes('VARDIR') ? 'İnvazyon Var' : 'Yok'}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Cerrahi Sınırlar Toggle */}
                                                    <div className="pt-1 border-t border-slate-200/50">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Cerrahi Sınırlar Satırı</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateTumor(tumor.id, 'includeMarginsLine', !tumor.includeMarginsLine)}
                                                                className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                                                                    tumor.includeMarginsLine ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-400'
                                                                }`}
                                                            >
                                                                {tumor.includeMarginsLine ? 'Eklenecek' : 'Eklenmeyecek'}
                                                            </button>
                                                        </div>

                                                        {tumor.includeMarginsLine && (
                                                            <div className="space-y-2 mt-2">
                                                                <div className="flex gap-1">
                                                                    {['Cerrahi sınırlarda tümör yoktur', 'Cerrahi sınırlarda tümör VARDIR'].map(opt => {
                                                                        const isActive = (opt === 'Cerrahi sınırlarda tümör VARDIR') === tumor.marginsTumorPresent;
                                                                        const isBad = opt === 'Cerrahi sınırlarda tümör VARDIR';
                                                                        return (
                                                                            <button
                                                                                key={opt}
                                                                                type="button"
                                                                                onClick={() => updateTumor(tumor.id, 'marginsTumorPresent', opt === 'Cerrahi sınırlarda tümör VARDIR')}
                                                                                className={`${getToggleClass(`tumor-${tumor.id}-marginsTumorPresent`, isActive, isBad)} ${
                                                                                    isActive 
                                                                                        ? isBad 
                                                                                            ? 'bg-red-100 text-red-800 border-red-300' 
                                                                                            : 'bg-indigo-100 text-indigo-800' 
                                                                                        : ''
                                                                                }`}
                                                                            >
                                                                                {opt === 'Cerrahi sınırlarda tümör VARDIR' ? 'Tümörlü Sınır' : 'Temiz Sınır'}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {tumor.marginsTumorPresent && (
                                                                    <input
                                                                        type="text"
                                                                        value={tumor.marginsNote}
                                                                        onChange={(e) => updateTumor(tumor.id, 'marginsNote', e.target.value)}
                                                                        placeholder="Cerrahi sınır ek açıklama..."
                                                                        className={getFieldClass(`tumor-${tumor.id}-marginsNote`)}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={addTumor}
                                        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Tümör Ekle
                                    </button>
                                </div>
                            </div>

                            {/* SECTION: LENF NODU DURUMU */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                        3. Lenf Nodu Durumu
                                    </h3>
                                    <button
                                        onClick={addLymphNode}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> LN Grubu Ekle
                                    </button>
                                </div>

                                {lymphNodes.length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                        <p className="text-xs font-bold text-slate-400">Lenf nodu grubu eklenmedi. Rapor sadece tiroid bezi odaklı oluşturuluyor.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {lymphNodes.map((ln, idx) => {
                                            const hasMetastasis = ln.metastatic > 0;
                                            return (
                                                <div 
                                                    key={ln.id} 
                                                    className={`p-3.5 border rounded-xl shadow-sm space-y-3 flex flex-col justify-between transition-all duration-300 ${
                                                        hasMetastasis
                                                            ? 'bg-red-50/10 border-red-200 shadow-sm'
                                                            : changedFields[`ln-add-${ln.id}`] 
                                                                ? 'border-indigo-500 bg-indigo-50/10' 
                                                                : 'border-slate-200 bg-slate-50/50'
                                                    }`}
                                                >
                                                    {/* LN Header */}
                                                    <div className={`flex items-center justify-between border-b pb-2 ${
                                                        hasMetastasis ? 'border-red-200/60' : 'border-slate-200/60'
                                                    }`}>
                                                        <span className={`text-xs font-black uppercase tracking-wider ${
                                                            hasMetastasis ? 'text-red-700' : 'text-indigo-700'
                                                        }`}>
                                                            {idx + 1}. LN Grubu {hasMetastasis && <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold ml-1">METASTAZ</span>}
                                                        </span>
                                                        <button
                                                            onClick={() => deleteLymphNode(ln.id)}
                                                            className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {/* LN Fields */}
                                                    <div className="space-y-3 flex-1">
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="col-span-1">
                                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yerleşim</label>
                                                                <input
                                                                    type="text"
                                                                    value={ln.location}
                                                                    onChange={(e) => updateLymphNode(ln.id, 'location', e.target.value)}
                                                                    placeholder="Örn: Seviye 6"
                                                                    className={getFieldClass(`ln-${ln.id}-location`)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Metastatik</label>
                                                                <input
                                                                    type="number"
                                                                    value={ln.metastatic}
                                                                    min="0"
                                                                    onChange={(e) => updateLymphNode(ln.id, 'metastatic', Number(e.target.value))}
                                                                    className={getFieldClass(`ln-${ln.id}-metastatic`)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Toplam</label>
                                                                <input
                                                                    type="number"
                                                                    value={ln.total}
                                                                    min="1"
                                                                    onChange={(e) => updateLymphNode(ln.id, 'total', Number(e.target.value))}
                                                                    className={getFieldClass(`ln-${ln.id}-total`)}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Metastaz Bulguları (Çap, ENE) - Sadece metastatik varsa */}
                                                        {ln.metastatic > 0 && (
                                                            <div className="bg-white border border-red-100 p-2.5 rounded-lg space-y-3">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                                                        {ln.metastatic > 1 ? 'En Büyük Metastaz Çapı (mm)' : 'Metastaz Çapı (mm)'}
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        value={ln.metastaticTumorSize}
                                                                        onChange={(e) => updateLymphNode(ln.id, 'metastaticTumorSize', e.target.value)}
                                                                        placeholder="mm"
                                                                        className={getFieldClass(`ln-${ln.id}-metastaticTumorSize`)}
                                                                    />
                                                                </div>

                                                                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                                                                    <label className="text-xs font-bold text-slate-700">Ekstranodal Yayılım (ENE)</label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateLymphNode(ln.id, 'ene', !ln.ene)}
                                                                        className={getToggleClass(`ln-${ln.id}-ene`, ln.ene, true)}
                                                                    >
                                                                        {ln.ene ? 'Var' : 'Yok'}
                                                                    </button>
                                                                </div>

                                                                {ln.ene && (
                                                                    <div className="animate-in fade-in slide-in-from-top-1">
                                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">ENE Çapı (mm)</label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.1"
                                                                            value={ln.eneSize}
                                                                            onChange={(e) => updateLymphNode(ln.id, 'eneSize', e.target.value)}
                                                                            placeholder="mm"
                                                                            className={getFieldClass(`ln-${ln.id}-eneSize`)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* SECTION: TÜMÖR DIŞI TİROİD BULGULARI */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
                                <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                    4. Tümör Dışı Tiroid Parankimi
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {BACKGROUND_THYROID_OPTIONS.map(opt => {
                                        const isChecked = backgroundThyroid.includes(opt);
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => toggleBackgroundOption(opt)}
                                                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all duration-150 cursor-pointer ${
                                                    isChecked 
                                                        ? 'bg-indigo-100 border-indigo-300 text-indigo-800 shadow-sm' 
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Preview Panel (Sticky) */}
                        <div className="lg:col-span-5 sticky top-2">
                            <div className="bg-white rounded-2xl border border-slate-200/85 shadow-xl overflow-hidden flex flex-col h-full max-h-[calc(100vh-100px)]">
                                <div className="p-4 border-b border-slate-100 bg-slate-900 flex items-center justify-between text-white">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-600 rounded-lg">
                                            <FileText className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="font-extrabold tracking-widest text-xs uppercase text-slate-200">
                                            Rapor Önizleme
                                        </span>
                                    </div>
                                    {copied && (
                                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-950/50 border border-emerald-500/25 px-2.5 py-1 rounded-md">
                                            <Check className="w-3.5 h-3.5" /> KOPYALANDI!
                                        </div>
                                    )}
                                </div>

                                {/* PREVIEW TEXT BOX WITH DYNAMIC LINE HIGHLIGHTS */}
                                <div 
                                    ref={reportRef} 
                                    className="flex-1 p-5 overflow-y-auto bg-white font-mono text-[13px] leading-relaxed text-slate-800 max-h-[60vh] lg:max-h-[68vh]"
                                >
                                    {reportText.split('\n').map((line, i) => {
                                        const isHighlighted = highlightedLines[line] !== undefined;
                                        
                                        return (
                                            <div
                                                key={`${line}-${i}`} // Key includes content to recreate DOM node on edit & trigger animation
                                                className={`min-h-[1.5rem] transition-all duration-300 ${
                                                    isHighlighted ? 'animate-line-flash font-semibold text-slate-950' : ''
                                                }`}
                                            >
                                                {line || '\u00A0'}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-4 bg-slate-50 border-t border-slate-100">
                                    <button
                                        onClick={copyToClipboard}
                                        className="w-full flex items-center justify-center gap-2.5 py-3 bg-indigo-600 hover:bg-emerald-600 hover:shadow-emerald-100 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-150 active:scale-98 group cursor-pointer"
                                    >
                                        <Copy className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                                        Raporu Kopyala
                                    </button>
                                    <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                                        Raporu kopyaladıktan sonra hastane patoloji sisteminize doğrudan yapıştırabilirsiniz.
                                    </p>
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
                        title: "TİİAB Raporlama",
                        subtitle: "Tiroid İnce İğne Aspirasyon Biyopsisi (Bethesda Kriterleri)",
                        page: "tiiab-raporlama",
                        color: "bg-emerald-600",
                        icon: Microscope
                    },
                    {
                        title: "GİST Raporlama",
                        subtitle: "Gastrointestinal Stromal Tümör raporlama kriterleri",
                        page: "gist-raporlama",
                        color: "bg-purple-600",
                        icon: FileText
                    },
                    {
                        title: "Sjögren Raporlama",
                        subtitle: "Minör tükrük bezi biyopsileri raporlama aracı",
                        page: "sjogren-raporlama",
                        color: "bg-indigo-600",
                        icon: Microscope
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
}

export default TiroidPapillerKarsinom;
