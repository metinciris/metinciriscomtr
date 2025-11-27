import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Copy, Check, AlertCircle, Activity, Ruler, Microscope, FileText, Info } from "lucide-react";
import { cn } from "../components/ui/utils";
import { PageContainer } from "../components/PageContainer";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";

// --- Constants & Logic ---
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

// --- Robust Components ---

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shadow-sm">
            <Icon size={18} />
        </div>
        <h3 className="font-bold text-slate-800">{title}</h3>
    </div>
);

const SolidCard = ({ children, className, title, icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
    <Card className={cn("overflow-hidden border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md", className)}>
        {title && <SectionHeader title={title} icon={icon} />}
        <div className="p-6">{children}</div>
    </Card>
);

const SolidInput = ({ label, value, onChange, placeholder, suffix, className }: any) => (
    <div className={cn("space-y-2", className)}>
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
        </label>
        <div className="relative group">
            <Input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={cn(
                    "h-11 w-full rounded-lg border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 transition-all",
                    "placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20",
                    suffix && "pr-12" // Add padding for suffix
                )}
            />
            {suffix && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-xs font-semibold text-slate-400 group-focus-within:text-blue-500">{suffix}</span>
                </div>
            )}
        </div>
    </div>
);

const SolidToggle = ({ options, value, onChange, label }: { options: string[], value: string, onChange: (v: string) => void, label?: string }) => (
    <div className="space-y-3">
        {label && <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>}
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const isActive = value === opt;
                return (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        type="button"
                        className={cn(
                            "relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 border",
                            isActive
                                ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200 ring-offset-1 z-10"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900"
                        )}
                    >
                        {opt}
                        {isActive && (
                            <motion.div
                                layoutId="activeIndicator"
                                className="absolute inset-0 rounded-lg bg-blue-600 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    </div>
);

const ResultBadge = ({ label, value, colorClass }: any) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className={cn("flex flex-col items-center justify-center rounded-xl border p-5 text-center shadow-sm transition-all", colorClass)}
    >
        <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">{label}</span>
        <span className="mt-2 text-2xl font-black tracking-tight">{value || "-"}</span>
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
    const [copied, setCopied] = useState(false);

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

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(rapor);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Dynamic Colors
    const riskColor = useMemo(() => {
        if (risk === "Yüksek") return "bg-red-50 text-red-900 border-red-200 ring-red-100";
        if (risk === "Orta") return "bg-orange-50 text-orange-900 border-orange-200 ring-orange-100";
        if (risk === "Düşük" || risk === "Çok düşük") return "bg-emerald-50 text-emerald-900 border-emerald-200 ring-emerald-100";
        return "bg-slate-50 text-slate-900 border-slate-200 ring-slate-100";
    }, [risk]);

    return (
        <PageContainer>
            <div className="min-h-screen w-full bg-slate-50/50 p-4 pb-20 md:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between rounded-2xl bg-slate-900 p-8 text-white shadow-lg">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-2"
                        >
                            <h1 className="text-3xl font-bold tracking-tight">
                                GİST Raporlama
                            </h1>
                            <p className="text-slate-400">CAP GIST Protokolü (4.3.0.0) Uyumlu Akıllı Şablon</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm border border-white/10"
                        >
                            <Info size={14} className="text-blue-400" />
                            <span>v2.2 Final</span>
                        </motion.div>
                    </header>

                    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                        {/* Main Form Area */}
                        <div className="space-y-6">
                            {/* Tumor Details */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <SolidCard title="Tümör Özellikleri" icon={Microscope}>
                                    <div className="grid gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Histolojik Tip</Label>
                                            <div className="grid gap-2">
                                                {HISTO_TIP_OPTS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setHistoTip(opt)}
                                                        className={cn(
                                                            "w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all border",
                                                            histoTip === opt
                                                                ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                                                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center", histoTip === opt ? "border-blue-600" : "border-slate-300")}>
                                                                {histoTip === opt && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                                                            </div>
                                                            {opt}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Yerleşim</Label>
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                {YERLEŞIM_OPTS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setYerlesim(opt)}
                                                        className={cn(
                                                            "rounded-lg px-3 py-2.5 text-sm font-medium transition-all border text-center",
                                                            yerlesim === opt
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200 ring-offset-1"
                                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                                        )}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <SolidInput label="En Büyük Boyut" value={enBuyukCm} onChange={(e: any) => setEnBuyukCm(e.target.value)} placeholder="0.0" suffix="cm" />
                                            <SolidInput label="Mitotik Oran" value={mitoz} onChange={(e: any) => setMitoz(e.target.value)} placeholder="0" suffix="/5mm²" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Diğer Boyutlar (L x W x H)</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <SolidInput placeholder="L" value={lx} onChange={(e: any) => setLx(e.target.value)} />
                                                <SolidInput placeholder="W" value={wx} onChange={(e: any) => setWx(e.target.value)} />
                                                <SolidInput placeholder="H" value={hx} onChange={(e: any) => setHx(e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <SolidToggle label="Tümör Sınırları" options={SINIR_OPTS} value={sinir} onChange={setSinir} />
                                            <SolidToggle label="Tümör Odağı" options={ODAK_OPTS} value={odak} onChange={setOdak} />
                                        </div>
                                    </div>
                                </SolidCard>
                            </motion.div>

                            {/* Additional Features */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <SolidCard title="Ek Özellikler" icon={Activity}>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:bg-slate-100">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-bold text-slate-900">Nekroz</Label>
                                                <p className="text-xs text-slate-500">Tümörde nekroz varlığı</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {nekrozVar && <Input type="text" placeholder="%" className="w-20 h-9 bg-white text-center" value={nekrozYuzde} onChange={(e) => setNekrozYuzde(e.target.value)} />}
                                                <Switch checked={nekrozVar} onCheckedChange={setNekrozVar} />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:bg-slate-100">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-bold text-slate-900">Neoadjuvan</Label>
                                                <p className="text-xs text-slate-500">Tedavi sonrası değişiklik</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {neoTedaviVar && <Input type="text" placeholder="Canlı %" className="w-24 h-9 bg-white text-center" value={canliTumorYuzde} onChange={(e) => setCanliTumorYuzde(e.target.value)} />}
                                                <Switch checked={neoTedaviVar} onCheckedChange={setNeoTedaviVar} />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Cerrahi Sınırlar</Label>
                                                <textarea
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                                                    rows={2}
                                                    value={cerrahiMetin}
                                                    onChange={(e) => setCerrahiMetin(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Lenf Nodları</Label>
                                                <textarea
                                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none resize-none"
                                                    rows={2}
                                                    value={nodDurumu}
                                                    onChange={(e) => setNodDurumu(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </SolidCard>
                            </motion.div>

                            {/* IHC Markers */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <SolidCard title="İmmünohistokimya" icon={Ruler}>
                                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                                        <SolidToggle label="C-KİT (CD117)" options={["Pozitif", "Negatif"]} value={cd117} onChange={setCd117} />
                                        <SolidToggle label="DOG1 (ANO1)" options={["Pozitif", "Negatif"]} value={dog1} onChange={setDog1} />
                                        <SolidToggle label="CD34" options={["Pozitif", "Negatif", "Yamalı pozitif"]} value={cd34} onChange={setCd34} />
                                        <SolidToggle label="SMA" options={["Pozitif", "Negatif", "Yamalı pozitif"]} value={sma} onChange={setSma} />
                                        <SolidToggle label="Desmin" options={["Pozitif", "Negatif", "Yamalı pozitif"]} value={desmin} onChange={setDesmin} />
                                        <SolidToggle label="S-100" options={["Pozitif", "Negatif", "Yamalı pozitif"]} value={s100} onChange={setS100} />
                                        <SolidToggle label="BRAF" options={["Pozitif", "Negatif"]} value={braf} onChange={setBraf} />
                                        <SolidToggle label="SDHA" options={["İntakt", "Deficient"]} value={sdha} onChange={setSdha} />
                                        <SolidToggle label="SDHB" options={["İntakt", "Deficient"]} value={sdhb} onChange={setSdhb} />
                                        <div className="flex items-end">
                                            <SolidInput label="Ki-67 İndeksi" suffix="%" value={ki67} onChange={(e: any) => setKi67(e.target.value)} />
                                        </div>
                                    </div>
                                </SolidCard>
                            </motion.div>
                        </div>

                        {/* Sidebar Results */}
                        <div className="space-y-6">
                            <div className="sticky top-6 space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                >
                                    <SolidCard className={cn("border-2 ring-4 ring-offset-2", riskColor)}>
                                        <div className="space-y-6 text-center">
                                            <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Sonuç Paneli</h3>
                                            <div className="grid gap-4">
                                                <ResultBadge label="Risk" value={risk} colorClass="bg-white/60 backdrop-blur-sm" />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <ResultBadge label="Grade" value={grade} colorClass="bg-white/60 backdrop-blur-sm" />
                                                    <ResultBadge label="pT" value={pT} colorClass="bg-white/60 backdrop-blur-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </SolidCard>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.6 }}
                                >
                                    <SolidCard title="Rapor Önizleme" icon={FileText} className="overflow-hidden bg-slate-900 border-slate-800">
                                        <div className="relative">
                                            <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950/50 border border-slate-800 p-4 text-[11px] leading-relaxed text-slate-300 font-mono">
                                                {rapor}
                                            </pre>
                                            <div className="absolute bottom-4 right-4">
                                                <Button
                                                    size="sm"
                                                    onClick={handleCopy}
                                                    className={cn(
                                                        "shadow-lg transition-all font-semibold",
                                                        copied
                                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/50"
                                                            : "bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-500/50"
                                                    )}
                                                >
                                                    {copied ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
                                                    {copied ? "Kopyalandı" : "Kopyala"}
                                                </Button>
                                            </div>
                                        </div>
                                    </SolidCard>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
