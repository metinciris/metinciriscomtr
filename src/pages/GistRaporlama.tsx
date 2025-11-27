import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Copy, Check, AlertCircle, Activity, Ruler, Microscope, FileText, Info } from "lucide-react";
import { cn } from "../components/ui/utils";
import { PageContainer } from "../components/PageContainer";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

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

// --- Robust High-Contrast Components ---

const SolidCard = ({ children, className, title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
    <Card className={cn("border border-gray-200 bg-white shadow-sm", className)}>
        {title && (
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                {Icon && <div className="rounded-full bg-blue-100 p-2 text-blue-600"><Icon size={18} /></div>}
                <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
        )}
        <div className="p-6">{children}</div>
    </Card>
);

const SolidInput = ({ label, value, onChange, placeholder, suffix, className }: any) => (
    <div className={cn("space-y-1.5", className)}>
        <label className="block text-xs font-semibold text-gray-700">
            {label}
        </label>
        <div className="relative">
            <Input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">{suffix}</span>}
        </div>
    </div>
);

const SolidToggle = ({ options, value, onChange, label }: { options: string[], value: string, onChange: (v: string) => void, label?: string }) => (
    <div className="space-y-2">
        {label && <label className="text-xs font-semibold text-gray-700">{label}</label>}
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const isActive = value === opt;
                return (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={cn(
                            "rounded-md px-4 py-2 text-xs font-medium transition-colors border",
                            isActive
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                        )}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    </div>
);

const ResultBadge = ({ label, value, colorClass }: any) => (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border p-4 text-center shadow-sm", colorClass)}>
        <span className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{label}</span>
        <span className="mt-1 text-xl font-bold tracking-tight">{value || "-"}</span>
    </div>
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
        if (risk === "Yüksek") return "bg-red-50 text-red-900 border-red-200";
        if (risk === "Orta") return "bg-orange-50 text-orange-900 border-orange-200";
        if (risk === "Düşük" || risk === "Çok düşük") return "bg-green-50 text-green-900 border-green-200";
        return "bg-gray-50 text-gray-900 border-gray-200";
    }, [risk]);

    return (
        <PageContainer>
            <div className="min-h-screen w-full bg-gray-50 p-4 pb-20 md:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                GİST Raporlama
                            </h1>
                            <p className="text-sm text-gray-500">CAP GIST Protokolü (4.3.0.0) Uyumlu Akıllı Şablon</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-gray-900 border border-gray-200 shadow-sm">
                            <Info size={14} className="text-blue-600" />
                            <span>v2.1 Stable</span>
                        </div>
                    </header>

                    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                        {/* Main Form Area */}
                        <div className="space-y-6">
                            {/* Tumor Details */}
                            <SolidCard title="Tümör Özellikleri" icon={Microscope}>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-gray-700">Histolojik Tip</Label>
                                            <div className="flex flex-col gap-2">
                                                {HISTO_TIP_OPTS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setHistoTip(opt)}
                                                        className={cn(
                                                            "w-full rounded-md px-4 py-2.5 text-left text-xs font-medium transition-colors border",
                                                            histoTip === opt
                                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                                                        )}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-gray-700">Yerleşim</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {YERLEŞIM_OPTS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setYerlesim(opt)}
                                                        className={cn(
                                                            "rounded-md px-3 py-2 text-xs font-medium transition-colors border",
                                                            yerlesim === opt
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                                                        )}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <SolidInput label="En Büyük Boyut" value={enBuyukCm} onChange={(e: any) => setEnBuyukCm(e.target.value)} placeholder="0.0" suffix="cm" />
                                            <SolidInput label="Mitotik Oran" value={mitoz} onChange={(e: any) => setMitoz(e.target.value)} placeholder="0" suffix="/5mm²" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-gray-700">Diğer Boyutlar (L x W x H)</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <SolidInput placeholder="L" value={lx} onChange={(e: any) => setLx(e.target.value)} />
                                                <SolidInput placeholder="W" value={wx} onChange={(e: any) => setWx(e.target.value)} />
                                                <SolidInput placeholder="H" value={hx} onChange={(e: any) => setHx(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
                                            <SolidToggle label="Tümör Sınırları" options={SINIR_OPTS} value={sinir} onChange={setSinir} />
                                            <SolidToggle label="Tümör Odağı" options={ODAK_OPTS} value={odak} onChange={setOdak} />
                                        </div>
                                    </div>
                                </div>
                            </SolidCard>

                            {/* Additional Features */}
                            <SolidCard title="Ek Özellikler" icon={Activity}>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium text-gray-900">Nekroz</Label>
                                            <p className="text-xs text-gray-500">Tümörde nekroz varlığı</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {nekrozVar && <Input type="text" placeholder="%" className="w-16 h-8 bg-white" value={nekrozYuzde} onChange={(e) => setNekrozYuzde(e.target.value)} />}
                                            <Switch checked={nekrozVar} onCheckedChange={setNekrozVar} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium text-gray-900">Neoadjuvan Tedavi</Label>
                                            <p className="text-xs text-gray-500">Tedavi sonrası değişiklik</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {neoTedaviVar && <Input type="text" placeholder="Canlı %" className="w-20 h-8 bg-white" value={canliTumorYuzde} onChange={(e) => setCanliTumorYuzde(e.target.value)} />}
                                            <Switch checked={neoTedaviVar} onCheckedChange={setNeoTedaviVar} />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="mb-2 block text-xs font-semibold text-gray-700">Cerrahi Sınırlar & Lenf Nodları</Label>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <textarea className="w-full rounded-md border border-gray-300 bg-white p-3 text-xs text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" rows={3} value={cerrahiMetin} onChange={(e) => setCerrahiMetin(e.target.value)} />
                                            <textarea className="w-full rounded-md border border-gray-300 bg-white p-3 text-xs text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" rows={3} value={nodDurumu} onChange={(e) => setNodDurumu(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </SolidCard>

                            {/* IHC Markers */}
                            <SolidCard title="İmmünohistokimya" icon={Ruler}>
                                <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
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
                                        <SolidInput label="Ki-67 Proliferasyon İndeksi" suffix="%" value={ki67} onChange={(e: any) => setKi67(e.target.value)} />
                                    </div>
                                </div>
                            </SolidCard>
                        </div>

                        {/* Sidebar Results */}
                        <div className="space-y-6">
                            <div className="sticky top-6 space-y-6">
                                <SolidCard className={cn("border-2", riskColor)}>
                                    <div className="space-y-4 text-center">
                                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-70">Sonuç Paneli</h3>
                                        <div className="grid gap-3">
                                            <ResultBadge label="Risk" value={risk} colorClass="bg-white/50" />
                                            <div className="grid grid-cols-2 gap-3">
                                                <ResultBadge label="Grade" value={grade} colorClass="bg-white/50" />
                                                <ResultBadge label="pT" value={pT} colorClass="bg-white/50" />
                                            </div>
                                        </div>
                                    </div>
                                </SolidCard>

                                <SolidCard title="Rapor Önizleme" icon={FileText} className="overflow-hidden">
                                    <div className="relative">
                                        <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 border border-gray-200 p-4 text-[11px] leading-relaxed text-gray-900">
                                            {rapor}
                                        </pre>
                                        <div className="absolute bottom-4 right-4">
                                            <Button size="sm" onClick={() => navigator.clipboard?.writeText(rapor)} className="shadow-sm">
                                                <Copy size={14} className="mr-2" />
                                                Kopyala
                                            </Button>
                                        </div>
                                    </div>
                                </SolidCard>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
