import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, AlertCircle, Activity, Ruler, Microscope, FileText, Info } from "lucide-react";
import { cn } from "../components/ui/utils";
import { PageContainer } from "../components/PageContainer";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

// --- Constants & Logic (Preserved) ---
const HISTO_TIP_OPTS = [
    "Gastrointestinal Stromal Tümör, iğsi hücreli tip",
    "Gastrointestinal Stromal Tümör, epiteloid tip",
    "Gastrointestinal Stromal Tümör, mikst",
];

const YERLEŞIM_OPTS = [
    "Mide", "Duedonum", "Jejenum/İleum", "Rektum", "Kolon", "Özofagus",
    "Omentum", "Mezenter", "Retroperiton", "Periton", "Karaciğer", "Pankreas",
];

const SINIR_OPTS = ["Ekspansil", "İnfiltratif"];
const ODAK_OPTS = ["Unifokal", "Multifokal"];

function formatNumber(n: any, digits = 1) {
    if (n === undefined || n === null || n === "") return "";
    const val = typeof n === "string" ? parseFloat(n.replace(",", ".")) : n;
    if (Number.isNaN(val)) return String(n);
    return val.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function toNumber(n: any) {
    if (n === undefined || n === null || n === "") return undefined;
    if (typeof n === "number") return n;
    const v = parseFloat(String(n).replace(",", "."));
    return Number.isNaN(v) ? undefined : v;
}

function pTFromSize(cm: number | undefined, neoadjuvan: boolean) {
    if (!cm && cm !== 0) return "";
    let cat = "";
    if (cm === 0) cat = "pT0";
    else if (cm <= 2) cat = "pT1";
    else if (cm <= 5) cat = "pT2";
    else if (cm <= 10) cat = "pT3";
    else cat = "pT4";
    return (neoadjuvan ? "y" : "") + cat;
}

function gradeFromMitotic(mitosPer5mm2: number | undefined) {
    if (mitosPer5mm2 === undefined) return "";
    return mitosPer5mm2 <= 5 ? "G1; low grade" : "G2; high grade";
}

function riskFrom(sizeCm: number | undefined, mitos: number | undefined, site: string) {
    if (sizeCm === undefined || mitos === undefined || !site) return "Belirsiz";
    const highMitos = mitos > 5;
    const gastric = site === "Mide";
    const smallBowel = site === "Jejenum/İleum" || site === "Duedonum";
    const colorectal = site === "Rektum" || site === "Kolon";
    const s = sizeCm;
    const band = s <= 2 ? 1 : s <= 5 ? 2 : s <= 10 ? 3 : 4;

    if (gastric) return !highMitos ? (band === 1 ? "Çok düşük" : band === 2 ? "Düşük" : band === 3 ? "Orta" : "Yüksek") : (band === 1 ? "Orta" : band === 2 ? "Orta" : "Yüksek");
    if (smallBowel || colorectal) return !highMitos ? (band === 1 ? "Düşük" : band === 2 ? "Orta" : "Yüksek") : "Yüksek";
    return highMitos || band >= 3 ? "Yüksek" : band === 2 ? "Orta" : "Düşük";
}

// --- Custom Premium Components ---

const GlassCard = ({ children, className, title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
            "relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 backdrop-blur-xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:bg-white/70 dark:bg-black/40 dark:border-white/10",
            className
        )}
    >
        {title && (
            <div className="flex items-center gap-3 border-b border-black/5 bg-white/30 px-6 py-4 dark:border-white/5 dark:bg-black/20">
                {Icon && <div className="rounded-full bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400"><Icon size={18} /></div>}
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
            </div>
        )}
        <div className="p-6">{children}</div>
    </motion.div>
);

const AnimatedInput = ({ label, value, onChange, placeholder, suffix, className }: any) => (
    <div className={cn("group relative", className)}>
        <label className="mb-1.5 block text-xs font-medium text-gray-500 transition-colors group-focus-within:text-blue-600 dark:text-gray-400 dark:group-focus-within:text-blue-400">
            {label}
        </label>
        <div className="relative">
            <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-xl border-0 bg-gray-100/50 px-4 py-3 text-sm font-medium text-gray-900 shadow-inner ring-1 ring-black/5 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/50 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:bg-black/20"
            />
            {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">{suffix}</span>}
        </div>
    </div>
);

const PillToggle = ({ options, value, onChange, label }: { options: string[], value: string, onChange: (v: string) => void, label?: string }) => (
    <div className="space-y-2">
        {label && <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>}
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const isActive = value === opt;
                return (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={cn(
                            "relative rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300",
                            isActive ? "text-white shadow-lg shadow-blue-500/25" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={`pill-${label || "group"}`}
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{opt}</span>
                    </button>
                );
            })}
        </div>
    </div>
);

const ResultBadge = ({ label, value, colorClass }: any) => (
    <motion.div
        layout
        className={cn("flex flex-col items-center justify-center rounded-2xl border p-4 text-center shadow-sm transition-colors duration-500", colorClass)}
    >
        <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
        <span className="mt-1 text-xl font-bold tracking-tight">{value || "-"}</span>
    </motion.div>
);

export default function GistRaporlama() {
    // State
    const [histoTip, setHistoTip] = useState(HISTO_TIP_OPTS[0]);
    const [enBuyukCm, setEnBuyukCm] = useState("");
    const [lx, setLx] = useState("");
    const [wx, setWx] = useState("");
    const [hx, setHx] = useState("");
    const [sinir, setSinir] = useState("Ekspansil");
    const [odak, setOdak] = useState("Unifokal");
    const [yerlesim, setYerlesim] = useState("Mide");
    const [mitoz, setMitoz] = useState("");
    const [nekrozVar, setNekrozVar] = useState(false);
    const [nekrozYuzde, setNekrozYuzde] = useState("");
    const [neoTedaviVar, setNeoTedaviVar] = useState(false);
    const [canliTumorYuzde, setCanliTumorYuzde] = useState("");
    const [cerrahiMetin, setCerrahiMetin] = useState("Serozal yüzeye 0,3 cm mesafededir.");
    const [nodDurumu, setNodDurumu] = useState("Bölgesel lenf nodlarında reaktif hiperplazi (0/)");

    // IHC State
    const [cd117, setCd117] = useState("Pozitif");
    const [dog1, setDog1] = useState("Pozitif");
    const [sdha, setSdha] = useState("İntakt");
    const [sdhb, setSdhb] = useState("İntakt");
    const [braf, setBraf] = useState("Negatif");
    const [cd34, setCd34] = useState("Pozitif");
    const [sma, setSma] = useState("Negatif");
    const [desmin, setDesmin] = useState("Negatif");
    const [s100, setS100] = useState("Negatif");
    const [ki67, setKi67] = useState("");

    // Calculations
    const sizeNum = useMemo(() => toNumber(enBuyukCm), [enBuyukCm]);
    const mitozNum = useMemo(() => toNumber(mitoz), [mitoz]);
    const pT = useMemo(() => pTFromSize(sizeNum, neoTedaviVar), [sizeNum, neoTedaviVar]);
    const grade = useMemo(() => gradeFromMitotic(mitozNum), [mitozNum]);
    const risk = useMemo(() => riskFrom(sizeNum, mitozNum, yerlesim), [sizeNum, mitozNum, yerlesim]);

    // Report Generation
    const rapor = useMemo(() => {
        const lines = [];
        if (histoTip) lines.push(`Histolojik Tip: ${histoTip}`);
        const ebc = formatNumber(sizeNum);
        if (ebc) lines.push(`En büyük tümör boyutu: ${ebc} cm`);
        const L = formatNumber(toNumber(lx)), W = formatNumber(toNumber(wx)), H = formatNumber(toNumber(hx));
        if (L || W || H) lines.push(`Tümör boyutları: ${L || "?"} x ${W || "?"} x ${H || "?"} cm`);
        if (sinir) lines.push(`Tümör sınırları: ${sinir}`);
        if (odak) lines.push(`Tümör odağı: ${odak}`);
        if (yerlesim) lines.push(`Tümör yerleşimi: ${yerlesim}`);
        if (mitozNum !== undefined) lines.push(`Mitotik oran: ${formatNumber(mitozNum, 0)} mitoz/5mm²`);
        lines.push(nekrozVar ? `Nekroz: Var${toNumber(nekrozYuzde) !== undefined ? ` (%${formatNumber(toNumber(nekrozYuzde), 0)})` : ""}` : "Nekroz: Yok");
        if (neoTedaviVar) lines.push(`Neoadjuvan tedavi vardır. Canlı tümör yüzdesi: ${toNumber(canliTumorYuzde) !== undefined ? `%${formatNumber(toNumber(canliTumorYuzde), 0)}` : "belirtilmemiş"}.`);
        if (cerrahiMetin) lines.push(`Cerrahi sınırlar: ${cerrahiMetin}`);
        if (nodDurumu) lines.push(`Bölgesel lenf nodları durumu: ${nodDurumu}`);
        if (grade) lines.push(`Histolojik Grade: ${grade}`);
        if (risk) lines.push(`Risk değerlendirmesi: ${risk}`);
        if (pT) lines.push(`pT kategori: ${pT}`);
        lines.push(`C-KİT (CD117): ${cd117}`, `DOG1 (ANO1): ${dog1}`, `SDHA: ${sdha}`, `SDHB: ${sdhb}`, `BRAF: ${braf}`, `CD34: ${cd34}`, `SMA: ${sma}`, `Desmin: ${desmin}`, `S-100: ${s100}`);
        if (ki67) lines.push(`Ki-67: %${ki67}`);
        return lines.join("\n");
    }, [histoTip, sizeNum, lx, wx, hx, sinir, odak, yerlesim, mitozNum, nekrozVar, nekrozYuzde, neoTedaviVar, canliTumorYuzde, cerrahiMetin, nodDurumu, grade, risk, pT, cd117, dog1, sdha, sdhb, braf, cd34, sma, desmin, s100, ki67]);

    // Dynamic Colors
    const riskColor = useMemo(() => {
        if (risk === "Yüksek") return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
        if (risk === "Orta") return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
        if (risk === "Düşük" || risk === "Çok düşük") return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }, [risk]);

    return (
        <PageContainer>
            <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50/50 p-4 pb-20 dark:from-gray-950 dark:to-blue-950/20 md:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:to-indigo-400">
                                GİST Raporlama
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">CAP GIST Protokolü (4.3.0.0) Uyumlu Akıllı Şablon</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-white/50 px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur dark:bg-white/5 dark:text-gray-300">
                            <Info size={14} />
                            <span>v2.0 Premium</span>
                        </div>
                    </header>

                    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                        {/* Main Form Area */}
                        <div className="space-y-6">
                            {/* Tumor Details */}
                            <GlassCard title="Tümör Özellikleri" icon={Microscope}>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-500">Histolojik Tip</Label>
                                            <div className="flex flex-col gap-2">
                                                {HISTO_TIP_OPTS.map(opt => (
                                                    <button key={opt} onClick={() => setHistoTip(opt)} className={cn("w-full rounded-xl px-4 py-2.5 text-left text-xs font-medium transition-all", histoTip === opt ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-300")}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-500">Yerleşim</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {YERLEŞIM_OPTS.map(opt => (
                                                    <button key={opt} onClick={() => setYerlesim(opt)} className={cn("rounded-lg px-3 py-2 text-xs font-medium transition-all", yerlesim === opt ? "bg-indigo-600 text-white shadow-md" : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-300")}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <AnimatedInput label="En Büyük Boyut" value={enBuyukCm} onChange={(e: any) => setEnBuyukCm(e.target.value)} placeholder="0.0" suffix="cm" />
                                            <AnimatedInput label="Mitotik Oran" value={mitoz} onChange={(e: any) => setMitoz(e.target.value)} placeholder="0" suffix="/5mm²" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-500">Diğer Boyutlar (L x W x H)</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <AnimatedInput placeholder="L" value={lx} onChange={(e: any) => setLx(e.target.value)} />
                                                <AnimatedInput placeholder="W" value={wx} onChange={(e: any) => setWx(e.target.value)} />
                                                <AnimatedInput placeholder="H" value={hx} onChange={(e: any) => setHx(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-4 rounded-2xl bg-gray-50/50 p-4 dark:bg-white/5">
                                            <PillToggle label="Tümör Sınırları" options={SINIR_OPTS} value={sinir} onChange={setSinir} />
                                            <PillToggle label="Tümör Odağı" options={ODAK_OPTS} value={odak} onChange={setOdak} />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Additional Features */}
                            <GlassCard title="Ek Özellikler" icon={Activity}>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-white/5">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium">Nekroz</Label>
                                            <p className="text-xs text-gray-500">Tümörde nekroz varlığı</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {nekrozVar && <input type="text" placeholder="%" className="w-16 rounded-lg border-0 bg-white px-2 py-1 text-center text-sm shadow-sm ring-1 ring-black/5 dark:bg-black/20 dark:ring-white/10" value={nekrozYuzde} onChange={(e) => setNekrozYuzde(e.target.value)} />}
                                            <Switch checked={nekrozVar} onCheckedChange={setNekrozVar} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-white/5">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium">Neoadjuvan Tedavi</Label>
                                            <p className="text-xs text-gray-500">Tedavi sonrası değişiklik</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {neoTedaviVar && <input type="text" placeholder="Canlı %" className="w-20 rounded-lg border-0 bg-white px-2 py-1 text-center text-sm shadow-sm ring-1 ring-black/5 dark:bg-black/20 dark:ring-white/10" value={canliTumorYuzde} onChange={(e) => setCanliTumorYuzde(e.target.value)} />}
                                            <Switch checked={neoTedaviVar} onCheckedChange={setNeoTedaviVar} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="mb-2 block text-xs font-medium text-gray-500">Cerrahi Sınırlar & Lenf Nodları</Label>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <textarea className="w-full rounded-xl border-0 bg-gray-100/50 p-3 text-xs shadow-inner ring-1 ring-black/5 focus:bg-white focus:ring-2 focus:ring-blue-500/50 dark:bg-white/5 dark:ring-white/10" rows={3} value={cerrahiMetin} onChange={(e) => setCerrahiMetin(e.target.value)} />
                                            <textarea className="w-full rounded-xl border-0 bg-gray-100/50 p-3 text-xs shadow-inner ring-1 ring-black/5 focus:bg-white focus:ring-2 focus:ring-blue-500/50 dark:bg-white/5 dark:ring-white/10" rows={3} value={nodDurumu} onChange={(e) => setNodDurumu(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* IHC Markers */}
                            <GlassCard title="İmmünohistokimya" icon={Ruler}>
                                <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                                    <PillToggle label="C-KİT (CD117)" options={["Pozitif", "Negatif"]} value={cd117} onChange={setCd117} />
                                    <PillToggle label="DOG1 (ANO1)" options={["Pozitif", "Negatif"]} value={dog1} onChange={setDog1} />
                                    <PillToggle label="CD34" options={["Pozitif", "Negatif", "Yamalı pozitif"]} value={cd34} onChange={setCd34} />
                                    <PillToggle label="SMA" options={["Pozitif", "Negatif", "Yamalı pozitif"]} value={sma} onChange={setSma} />
                                    <PillToggle label="Desmin" options={["Pozitif", "Negatif", "Yamalı pozitif"]} value={desmin} onChange={setDesmin} />
                                    <PillToggle label="S-100" options={["Pozitif", "Negatif", "Yamalı pozitif"]} value={s100} onChange={setS100} />
                                    <PillToggle label="BRAF" options={["Pozitif", "Negatif"]} value={braf} onChange={setBraf} />
                                    <PillToggle label="SDHA" options={["İntakt", "Deficient"]} value={sdha} onChange={setSdha} />
                                    <PillToggle label="SDHB" options={["İntakt", "Deficient"]} value={sdhb} onChange={setSdhb} />
                                    <div className="flex items-end">
                                        <AnimatedInput label="Ki-67 Proliferasyon İndeksi" suffix="%" value={ki67} onChange={(e: any) => setKi67(e.target.value)} />
                                    </div>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Sidebar Results */}
                        <div className="space-y-6">
                            <div className="sticky top-6 space-y-6">
                                <GlassCard className="border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/50">
                                    <div className="space-y-4 text-center">
                                        <h3 className="text-sm font-semibold uppercase tracking-widest text-blue-900/60 dark:text-blue-100/60">Sonuç Paneli</h3>
                                        <div className="grid gap-3">
                                            <ResultBadge label="Risk" value={risk} colorClass={riskColor} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <ResultBadge label="Grade" value={grade} colorClass="bg-white/50 dark:bg-white/5" />
                                                <ResultBadge label="pT" value={pT} colorClass="bg-white/50 dark:bg-white/5" />
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>

                                <GlassCard title="Rapor Önizleme" icon={FileText} className="overflow-hidden">
                                    <div className="relative">
                                        <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-[10px] leading-relaxed text-gray-600 shadow-inner dark:bg-black/30 dark:text-gray-400">
                                            {rapor}
                                        </pre>
                                        <div className="absolute bottom-4 right-4">
                                            <Button size="sm" onClick={() => navigator.clipboard?.writeText(rapor)} className="shadow-lg">
                                                <Copy size={14} className="mr-2" />
                                                Kopyala
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
