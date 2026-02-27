import React, { useMemo, useState } from "react";
import { Copy, Check, Microscope, FileText, Info, RotateCcw, Plus, Trash2, LayoutGrid } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { toast } from "sonner";
import { RelatedPages } from "../components/RelatedPages";
import { ReportingDisclaimer } from "../components/ReportingDisclaimer";
import {
    FOKUS_OPTS,
    FIBROZIS_OPTS,
    YAGLANMA_OPTS,
    YETERLILIK_OPTS,
    generateSjogrenReport
} from "../core/calculators/sjogren";

export default function SjogrenRaporlama() {
    // --- State ---
    const [stains, setStains] = useState<string[]>(["Masson Trikrom boyası"]);
    const [yeterlilik, setYeterlilik] = useState("yeterli");
    const [izlenenMm2, setIzlenenMm2] = useState("1");
    const [fokus, setFokus] = useState("az");
    const [fibrozis, setFibrozis] = useState("yok");
    const [yaglanma, setYaglanma] = useState("yok");
    const [otherFindings, setOtherFindings] = useState({
        enYogun: true,
        plazmaNadir: false,
        plazmaTopluluk: false,
        onkositik: false,
        devKonfluen: false,
        germinal: false,
        mukozal: false,
    });
    const [customOther, setCustomOther] = useState("");
    const [copied, setCopied] = useState(false);

    // --- Actions ---
    const addStain = () => setStains([...stains, ""]);
    const updateStain = (index: number, value: string) => {
        const newStains = [...stains];
        newStains[index] = value;
        setStains(newStains);
    };
    const removeStain = (index: number) => {
        if (stains.length > 1) {
            setStains(stains.filter((_, i) => i !== index));
        }
    };

    const toggleOther = (key: keyof typeof otherFindings) => {
        setOtherFindings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const resetForm = () => {
        if (window.confirm("Tüm seçimler sıfırlanacak. Emin misiniz?")) {
            setStains(["Masson Trikrom boyası"]);
            setYeterlilik("yeterli");
            setIzlenenMm2("1");
            setFokus("az");
            setFibrozis("yok");
            setYaglanma("yok");
            setOtherFindings({
                enYogun: true,
                plazmaNadir: false,
                plazmaTopluluk: false,
                onkositik: false,
                devKonfluen: false,
                germinal: false,
                mukozal: false,
            });
            setCustomOther("");
            toast.success("Form sıfırlandı");
        }
    };

    // --- Report Calculation ---
    const report = useMemo(() => {
        return generateSjogrenReport({
            stains,
            yeterlilik,
            izlenenMm2,
            fokus,
            fibrozis,
            yaglanma,
            otherFindings,
            customOther
        });
    }, [stains, yeterlilik, izlenenMm2, fokus, fibrozis, yaglanma, otherFindings, customOther]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(report);
        setCopied(true);
        toast.success("Rapor kopyalandı");
        setTimeout(() => setCopied(false), 2000);
    };

    // --- Styling ---
    const cardBase = "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden";
    const headerBase = "px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50";
    const labelBase = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2";

    // Dynamic Color Helpers
    const getYeterlilikColor = (id: string, isSelected: boolean) => {
        if (!isSelected) return "bg-white border-slate-100 text-slate-600 hover:bg-slate-50";
        switch (id) {
            case "yeterli": return "bg-emerald-500 border-emerald-600 text-white font-bold shadow-md shadow-emerald-100";
            case "sinirli": return "bg-yellow-400 border-yellow-500 text-slate-900 font-bold shadow-md shadow-yellow-100";
            case "yetersiz": return "bg-red-500 border-red-600 text-white font-bold shadow-md shadow-red-100";
            case "yok": return "bg-purple-600 border-purple-700 text-white font-bold shadow-md shadow-purple-100";
            default: return "bg-indigo-600 border-indigo-700 text-white";
        }
    };

    const getFokusColor = (id: string, isSelected: boolean) => {
        if (!isSelected) return "bg-white border-slate-100 text-slate-600 hover:bg-slate-50";
        if (id === "yok" || id === "az") return "bg-emerald-500 border-emerald-600 text-white font-bold shadow-md shadow-emerald-100";

        // Red scale for 1-8+
        const scale: Record<string, string> = {
            "bir": "bg-red-500 border-red-600",
            "iki": "bg-red-600 border-red-700",
            "uc": "bg-red-700 border-red-800",
            "dort": "bg-red-800 border-red-900",
            "bes": "bg-red-900 border-red-950",
            "alti": "bg-red-950 border-black text-white",
            "yedi": "bg-slate-900 border-black text-white",
            "sekiz": "bg-black border-black text-white",
        };
        return `${scale[id] || "bg-red-500"} text-white font-bold shadow-md shadow-red-200`;
    };

    const getFibrozisColor = (id: string, isSelected: boolean) => {
        if (!isSelected) return "bg-white border-slate-100 text-slate-500 hover:border-slate-300";
        switch (id) {
            case "yok": return "bg-blue-400 border-blue-500 text-white font-bold";
            case "hafif": return "bg-blue-600 border-blue-700 text-white font-bold shadow-md shadow-blue-200";
            case "belirgin": return "bg-blue-800 border-blue-900 text-white font-bold shadow-md shadow-blue-300";
            default: return "bg-blue-500 text-white";
        }
    };

    const getYaglanmaColor = (id: string, isSelected: boolean) => {
        if (!isSelected) return "bg-white border-slate-100 text-slate-500 hover:border-slate-300";
        return id === "var"
            ? "bg-yellow-400 border-yellow-500 text-slate-900 font-bold shadow-md shadow-yellow-100"
            : "bg-slate-200 border-slate-300 text-slate-600 font-bold";
    };

    return (
        <PageContainer>
            <div className="max-w-7xl mx-auto py-1 px-4">
                {/* Header - More Compact */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                            <Microscope className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-tight">Sjögren Raporlama</h1>
                            <p className="text-[11px] text-slate-500 font-medium">Minör tükrük bezi biyopsisi rapor aracı</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={resetForm}
                            className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all text-xs font-bold"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Sıfırla
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* Left Column - Inputs */}
                    <div className="lg:col-span-7 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Boyama Bilgisi */}
                            <div className={cardBase}>
                                <div className={headerBase}>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-base">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        Boyama
                                    </div>
                                    <button onClick={addStain} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-5 space-y-3">
                                    {stains.map((stain, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={stain}
                                                onChange={(e) => updateStain(idx, e.target.value)}
                                                placeholder="Boyama adı..."
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700 font-semibold"
                                            />
                                            {stains.length > 1 && (
                                                <button onClick={() => removeStain(idx)} className="text-slate-400 hover:text-rose-500 p-2">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Yeterlilik */}
                            <div className={cardBase}>
                                <div className={headerBase}>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-base">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Yeterlilik
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col gap-2">
                                    {YETERLILIK_OPTS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setYeterlilik(opt.id)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-all ${getYeterlilikColor(opt.id, yeterlilik === opt.id)}`}
                                        >
                                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${yeterlilik === opt.id ? "border-white bg-transparent" : "border-slate-300"}`}>
                                                {yeterlilik === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            {opt.label.replace(' (minimal 4 mm2)', '')}
                                        </button>
                                    ))}
                                    {yeterlilik === "yetersiz" && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <label className="text-xs font-bold text-slate-500">İzlenen Alan:</label>
                                            <input
                                                type="number"
                                                value={izlenenMm2}
                                                onChange={(e) => setIzlenenMm2(e.target.value)}
                                                placeholder="mm2"
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fokus ve Ayarlar */}
                        {yeterlilik !== "yok" && (
                            <>
                                <div className={cardBase}>
                                    <div className={headerBase}>
                                        <div className="flex items-center gap-2 text-slate-700 font-bold text-base">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            Fokus Sayısı <span className="text-slate-400 font-normal text-xs">(4 mm2)</span>
                                        </div>
                                    </div>
                                    <div className="p-5 grid grid-cols-5 md:grid-cols-10 gap-2">
                                        {FOKUS_OPTS.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setFokus(opt.id)}
                                                className={`py-3 rounded-lg border text-sm font-bold text-center transition-all ${getFokusColor(opt.id, fokus === opt.id)}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className={cardBase}>
                                        <div className="p-5">
                                            <label className={labelBase}>Fibrozis</label>
                                            <div className="flex flex-col gap-2">
                                                {FIBROZIS_OPTS.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setFibrozis(opt.id)}
                                                        className={`px-4 py-3 rounded-lg border text-sm font-semibold text-left transition-all ${getFibrozisColor(opt.id, fibrozis === opt.id)}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cardBase}>
                                        <div className="p-5">
                                            <label className={labelBase}>Yağlanma</label>
                                            <div className="flex flex-col gap-2">
                                                {YAGLANMA_OPTS.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setYaglanma(opt.id)}
                                                        className={`px-4 py-3 rounded-lg border text-sm font-semibold text-left transition-all ${getYaglanmaColor(opt.id, yaglanma === opt.id)}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Diğer Bulgular */}
                        <div className={cardBase}>
                            <div className={headerBase}>
                                <div className="flex items-center gap-2 text-slate-700 font-bold text-base">
                                    <Info className="w-5 h-5 text-slate-400" />
                                    Ek Bulgular & Klinik Notlar
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                                    {[
                                        { key: "enYogun", label: "Fokus sayımında gland yapısında en yoğun 4 mm2 alan değerlendirildi" },
                                        { key: "plazmaNadir", label: "Nadir plazma hücresi izlendi" },
                                        { key: "plazmaTopluluk", label: "Plazma hücresi topluluğu (>10 hücre) izlendi" },
                                        { key: "onkositik", label: "Duktuslarda onkositik metaplazi vardır" },
                                        { key: "devKonfluen", label: "Dev / Konfluen fokus vardır" },
                                        { key: "germinal", label: "Germinal merkez izlenmiştir" },
                                        { key: "mukozal", label: "Minör tükrük bezi içermeyen mukozal fragman izlendi" },
                                    ].map((item) => (
                                        <label key={item.key} className="flex items-center gap-3 group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={otherFindings[item.key as keyof typeof otherFindings]}
                                                onChange={() => toggleOther(item.key as keyof typeof otherFindings)}
                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-widest">Özel Notlar</label>
                                    <textarea
                                        value={customOther}
                                        onChange={(e) => setCustomOther(e.target.value)}
                                        placeholder="Buraya eklemek istediğiniz diğer detayları yazabilirsiniz..."
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Report Preview (Sticky) */}
                    <div className="lg:col-span-5 sticky top-2">
                        <div className="bg-white rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50/50 overflow-hidden flex flex-col h-full max-h-[calc(100vh-80px)]">
                            <div className="p-3 border-b border-slate-100 bg-indigo-50/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-600 rounded-lg">
                                        <FileText className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-bold text-slate-800 text-sm">Rapor Önizleme</span>
                                </div>
                                {copied && (
                                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                        <Check className="w-3 h-3" /> KOPYALANDI
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 p-6 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/white-paper.png')] bg-white">
                                <div className="text-slate-800 text-[14px] leading-relaxed font-sans font-medium whitespace-pre-wrap selection:bg-indigo-100">
                                    {report}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100">
                                <button
                                    onClick={copyToClipboard}
                                    className="w-full flex items-center justify-center gap-3 py-3 bg-indigo-600 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 group"
                                >
                                    <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Raporu Kopyala
                                </button>
                                <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">Kopyaladıktan sonra istediğiniz dokümana yapıştırabilirsiniz.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ReportingDisclaimer />
            <RelatedPages
                pages={[
                    {
                        title: "GİST Raporlama",
                        subtitle: "Gastrointestinal Stromal Tümör raporlama aracı",
                        page: "gist-raporlama",
                        color: "bg-purple-600",
                        icon: FileText
                    },
                    {
                        title: "TİİAB Raporlama",
                        subtitle: "Tiroid İnce İğne Aspirasyon Biyopsisi raporlama aracı",
                        page: "tiiab-raporlama",
                        color: "bg-emerald-600",
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

