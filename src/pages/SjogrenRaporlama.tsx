import React, { useMemo, useState } from "react";
import { Copy, Check, Microscope, FileText, Info, RotateCcw, Plus, Trash2 } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { toast } from "sonner";

// --- Constants ---
const FOKUS_OPTS = [
    { id: "yok", label: "Yok", value: "İnflamasyon yok" },
    { id: "az", label: "<1", value: "Bir fokusdan az inflamasyon" },
    { id: "bir", label: "1", value: "Bir fokus inflamasyon. (Fokus: 50 lenfosit topluluğu)" },
    { id: "iki", label: "2", value: "İki fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "uc", label: "3", value: "Üç fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "dort", label: "4", value: "Dört fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "bes", label: "5", value: "Beş fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "alti", label: "6", value: "Altı fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "yedi", label: "7", value: "Yedi fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "sekiz", label: "8+", value: "Sekiz veya daha fazla fokus. (Fokus: 50 lenfosit topluluğu.)" },
];

const FIBROZIS_OPTS = [
    { id: "yok", label: "Fibrozis yok" },
    { id: "hafif", label: "Hafif fibrozis" },
    { id: "belirgin", label: "Belirgin fibrozis" },
];

const YAGLANMA_OPTS = [
    { id: "yok", label: "Yağlanma yok" },
    { id: "var", label: "Yağlanma var" },
];

const YETERLILIK_OPTS = [
    { id: "yeterli", label: "Glandüler doku: yeterli (minimal 4 mm2)" },
    { id: "sinirli", label: "Glandüler doku: sınırlı yeterli (minimal 4 mm2)" },
    { id: "yetersiz", label: "Glandüler doku: Yetersiz (minimal 4 mm2)" },
    { id: "yok", label: "Glandüler doku yok." },
];

export function SjogrenRaporlama() {
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
        let lines = ["Üç lam seri kesit "];
        const activeStains = stains.filter(s => s.trim() !== "");
        if (activeStains.length > 0) {
            if (activeStains.length === 1) {
                lines[0] += `ve ${activeStains[0]} `;
            } else {
                lines[0] += `ve ${activeStains.join(", ")} `;
            }
        }
        lines[0] += "ile incelenmiştir.";
        lines.push("");

        // Yeterlilik
        let yeterlilikText = "Yeterlilik:\t";
        if (yeterlilik === "yeterli") yeterlilikText += "Glandüler doku: yeterli (minimal 4 mm2)";
        else if (yeterlilik === "sinirli") yeterlilikText += "Glandüler doku: sınırlı yeterli (minimal 4 mm2)";
        else if (yeterlilik === "yetersiz") yeterlilikText += `Glandüler doku: Yetersiz (minimal 4 mm2). İzlenen: ${izlenenMm2} mm2`;
        else yeterlilikText += "Glandüler doku yok.";
        lines.push(yeterlilikText);

        if (yeterlilik !== "yok") {
            // Fokus
            const fOpt = FOKUS_OPTS.find(o => o.id === fokus);
            lines.push(`Fokus sayısı (4 mm2'de):\t${fOpt?.value || ""}`);

            // Fibrozis
            const fibOpt = FIBROZIS_OPTS.find(o => o.id === fibrozis);
            lines.push(`Fibrozis:\t${fibOpt?.label || ""}`);

            // Yağlanma
            const yagOpt = YAGLANMA_OPTS.find(o => o.id === yaglanma);
            lines.push(`Yağlanma:\t${yagOpt?.label || ""}`);

            // Diğer
            const otherItems = [];
            if (otherFindings.enYogun) otherItems.push("Fokus sayımında gland yapısında en yoğun 4 mm2 alan değerlendirilmiştir.");
            if (otherFindings.mukozal) otherItems.push("Minör tükrük bezi içermeyen mukozal fragman izlenmiştir.");
            if (otherFindings.plazmaNadir) otherItems.push("Nadir plazma hücresi izlenmiştir.");
            if (otherFindings.plazmaTopluluk) otherItems.push("Plazma hücresi topluluğu (>10 hücre) izlenmiştir.");
            if (otherFindings.onkositik) otherItems.push("Duktuslarda onkositik metaplazi vardır.");
            if (otherFindings.devKonfluen) otherItems.push("Dev / Konfluen fokus vardır.");
            if (otherFindings.germinal) otherItems.push("Germinal merkez izlenmiştir.");
            if (customOther.trim()) otherItems.push(customOther.trim());

            if (otherItems.length > 0) {
                lines.push(`Diğer:\t${otherItems.join(" ")}`);
            }
        } else {
            // Glandüler doku yoksa
            const otherItems = [];
            if (otherFindings.enYogun) otherItems.push("Fokus sayımında gland yapısında en yoğun 4 mm2 alan değerlendirilmiştir.");
            if (otherFindings.mukozal) otherItems.push("Minör tükrük bezi içermeyen mukozal fragman izlenmiştir.");
            if (otherFindings.plazmaNadir) otherItems.push("Nadir plazma hücresi izlenmiştir.");
            if (otherFindings.plazmaTopluluk) otherItems.push("Plazma hücresi topluluğu (>10 hücre) izlenmiştir.");
            if (otherFindings.onkositik) otherItems.push("Duktuslarda onkositik metaplazi vardır.");
            if (otherFindings.devKonfluen) otherItems.push("Dev / Konfluen fokus vardır.");
            if (otherFindings.germinal) otherItems.push("Germinal merkez izlenmiştir.");
            if (customOther.trim()) otherItems.push(customOther.trim());

            lines.push(`Diğer:\t${otherItems.join(" ")}`);
        }

        lines.push("");

        // Tanı
        let tani = "Tanı:\t";
        if (yeterlilik === "yetersiz" || yeterlilik === "yok") {
            tani += "Minör tükrük bezi biyopsisi: Nondiagnostik";
        } else {
            if (fokus === "yok") {
                if (fibrozis === "belirgin") tani += "İnflamasyon yok, ancak belirgin fibrozis var";
                else if (fibrozis === "hafif") tani += "Minör tükrük bezi biyopsisi: İnflamasyon yok, ancak hafif fibrozis vardır";
                else tani += "Minör tükrük bezi biyopsisi: Normal görünümlü minör tükrük bezi";
            } else if (fokus === "az") {
                if (fibrozis === "yok") tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokusdan az), fibrozis yok";
                else if (fibrozis === "hafif") tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokusdan az), hafif fibrozis";
                else tani += "Minör tükrük bezi biyopsisi: Bir fokustan az inflamasyon, ancak belirgin fibrozis vardır";
            } else if (fokus === "bir") {
                if (fibrozis === "yok") tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokus), fibrozis yok";
                else if (fibrozis === "hafif") tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokus), hafif fibrozis";
                else tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokus), belirgin fibrozis";
            } else {
                // 2+ fokus
                if (fibrozis === "yok") tani += "Minör tükrük bezi biyopsisi: İki veya daha fazla fokus lenfositik inflamasyon, fibrozis yok";
                else if (fibrozis === "hafif") tani += "Minör tükrük bezi biyopsisi: İki veya daha fazla fokus lenfositik inflamasyon, hafif fibrozis";
                else tani += "Minör tükrük bezi biyopsisi: İki veya daha fazla fokus lenfositik inflamasyon, belirgin fibrozis";
            }
        }
        lines.push(tani);

        if (yeterlilik !== "yok") {
            const fOpt = FOKUS_OPTS.find(o => o.id === fokus);
            let fCountText = "Fokus sayısı: ";
            if (fokus === "yok") fCountText = "Fokus Sayısı: İnflamasyon yok";
            else if (fokus === "az") fCountText = "Fokus yok";
            else if (fokus === "sekiz") fCountText += "8 ve daha fazla";
            else fCountText += fOpt?.label || "";
            lines.push(`\t${fCountText}`);
        }

        return lines.join("\n");
    }, [stains, yeterlilik, izlenenMm2, fokus, fibrozis, yaglanma, otherFindings, customOther]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(report);
        setCopied(true);
        toast.success("Rapor kopyalandı");
        setTimeout(() => setCopied(false), 2000);
    };

    // --- Styling ---
    const cardBase = "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden";
    const headerBase = "px-6 py-4 border-b border-slate-100 flex items-center justify-between";
    const labelBase = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3";

    return (
        <PageContainer>
            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* Hero Header */}
                <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Microscope className="w-6 h-6 text-blue-400" />
                                </div>
                                <span className="text-blue-400 text-sm font-bold tracking-widest uppercase">Patoloji Raporlama</span>
                            </div>
                            <h1 className="text-3xl font-black text-white">Sjögren Raporlama</h1>
                            <p className="text-slate-400 mt-2">Minör tükrük bezi biyopsisi için standardize rapor oluşturucu</p>
                        </div>
                        <button
                            onClick={resetForm}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-sm font-medium"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Sıfırla
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Inputs */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Boyama Bilgisi */}
                        <div className={cardBase}>
                            <div className={headerBase}>
                                <div className="flex items-center gap-3 text-slate-800 font-bold">
                                    <PageContainer className="p-0 m-0"><div className="w-2 h-2 rounded-full bg-blue-500" /></PageContainer>
                                    Boyama Bilgisi
                                </div>
                                <button onClick={addStain} className="text-blue-600 hover:text-blue-700 p-1 rounded-lg hover:bg-blue-50 transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-3">
                                {stains.map((stain, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={stain}
                                            onChange={(e) => updateStain(idx, e.target.value)}
                                            placeholder="Boyama adı..."
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                        {stains.length > 1 && (
                                            <button onClick={() => removeStain(idx)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors">
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
                                <div className="flex items-center gap-3 text-slate-800 font-bold">
                                    <PageContainer className="p-0 m-0"><div className="w-2 h-2 rounded-full bg-emerald-500" /></PageContainer>
                                    Yeterlilik
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-2">
                                    {YETERLILIK_OPTS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setYeterlilik(opt.id)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${yeterlilik === opt.id
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                                                    : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${yeterlilik === opt.id ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                                                }`}>
                                                {yeterlilik === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                {yeterlilik === "yetersiz" && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-xs font-bold text-slate-500 block mb-2">İzlenen Alan (mm2)</label>
                                        <input
                                            type="number"
                                            value={izlenenMm2}
                                            onChange={(e) => setIzlenenMm2(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fokus ve Diğer Ayarlar (Sadece yeterliyse) */}
                        {yeterlilik !== "yok" && (
                            <>
                                <div className={cardBase}>
                                    <div className={headerBase}>
                                        <div className="flex items-center gap-3 text-slate-800 font-bold">
                                            <PageContainer className="p-0 m-0"><div className="w-2 h-2 rounded-full bg-indigo-500" /></PageContainer>
                                            Fokus Sayısı <span className="text-slate-400 font-normal text-xs">(4 mm2'de)</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-5 gap-2">
                                            {FOKUS_OPTS.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setFokus(opt.id)}
                                                    className={`px-3 py-2.5 rounded-xl border text-sm text-center transition-all ${fokus === opt.id
                                                            ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20"
                                                            : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={cardBase}>
                                        <div className="p-6">
                                            <label className={labelBase}>Fibrozis</label>
                                            <div className="flex flex-col gap-2">
                                                {FIBROZIS_OPTS.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setFibrozis(opt.id)}
                                                        className={`px-4 py-2.5 rounded-xl border text-sm transition-all ${fibrozis === opt.id
                                                                ? "bg-slate-800 border-slate-800 text-white font-bold"
                                                                : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cardBase}>
                                        <div className="p-6">
                                            <label className={labelBase}>Yağlanma</label>
                                            <div className="flex flex-col gap-2">
                                                {YAGLANMA_OPTS.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setYaglanma(opt.id)}
                                                        className={`px-4 py-2.5 rounded-xl border text-sm transition-all ${yaglanma === opt.id
                                                                ? "bg-amber-500 border-amber-500 text-white font-bold shadow-lg shadow-amber-500/20"
                                                                : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                                                            }`}
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
                    </div>

                    {/* Right Column - Report & Other Findings */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Rapor Panel */}
                        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    <span className="font-bold text-white">Rapor Önizleme</span>
                                </div>
                                {copied && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 animate-in fade-in zoom-in">
                                        <Check className="w-3 h-3" />
                                        KOPYALANDI
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <div className="bg-black/30 rounded-2xl p-6 font-mono text-sm leading-relaxed text-blue-100 whitespace-pre-wrap min-h-[300px] border border-white/5">
                                    {report}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                                >
                                    <Copy className="w-5 h-5" />
                                    Raporu Kopyala
                                </button>
                            </div>
                        </div>

                        {/* Diğer Bulgular */}
                        <div className={cardBase}>
                            <div className={headerBase}>
                                <div className="flex items-center gap-3 text-slate-800 font-bold">
                                    <Info className="w-5 h-5 text-slate-400" />
                                    Diğer Bulgular
                                </div>
                            </div>
                            <div className="p-6 space-y-3">
                                {[
                                    { key: "enYogun", label: "En yoğun 4 mm2 alan" },
                                    { key: "plazmaNadir", label: "Nadir plazma hücresi" },
                                    { key: "plazmaTopluluk", label: "Plazma hücresi topluluğu (>10)" },
                                    { key: "onkositik", label: "Duktusta onkositik metaplazi" },
                                    { key: "devKonfluen", label: "Dev / Konfluen fokus" },
                                    { key: "germinal", label: "Germinal merkez" },
                                    { key: "mukozal", label: "Glandsız mukozal fragman" },
                                ].map((item) => (
                                    <label
                                        key={item.key}
                                        className="flex items-center group cursor-pointer"
                                    >
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={otherFindings[item.key as keyof typeof otherFindings]}
                                                onChange={() => toggleOther(item.key as keyof typeof otherFindings)}
                                                className="peer hidden"
                                            />
                                            <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                                        </div>
                                        <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                                            {item.label}
                                        </span>
                                    </label>
                                ))}

                                <div className="pt-4 mt-4 border-t border-slate-100">
                                    <label className={labelBase}>Ek Notlar</label>
                                    <input
                                        type="text"
                                        value={customOther}
                                        onChange={(e) => setCustomOther(e.target.value)}
                                        placeholder="Eklemek istediğiniz diğer detaylar..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
