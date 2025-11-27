import React, { useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Separator } from "../components/ui/separator";
import { cn } from "../components/ui/utils";
import { PageContainer } from "../components/PageContainer";

/**
 * GİST Raporlama – tek dosyalık React bileşeni (JS/TS uyumlu)
 * Notlar:
 * - Tailwind + shadcn/ui bileşenleriyle tasarlanmıştır.
 * - "Raporu Oluştur" düğmesine tıklayınca metin raporu üretir.
 * - Risk ve pT kategorileri CAP GIST protokolündeki (Tablo 1, mitotik oran / boyut / lokalizasyon) mantığa göre
 *   basitleştirilmiş şekilde hesaplanır.
 * - Bu sürüm sayfa yerleşimini daha kompakt kullanır.
 */

const HISTO_TIP_OPTS = [
    "Gastrointestinal Stromal Tümör, iğsi hücreli tip",
    "Gastrointestinal Stromal Tümör, epiteloid tip",
    "Gastrointestinal Stromal Tümör, mikst",
];

const YERLEŞIM_OPTS = [
    "Mide",
    "Duedonum",
    "Jejenum/İleum",
    "Rektum",
    "Kolon",
    "Özofagus",
    "Omentum",
    "Mezenter",
    "Retroperiton",
    "Periton",
    "Karaciğer",
    "Pankreas",
];

const SINIR_OPTS = ["Ekspansil", "İnfiltratif"];
const ODAK_OPTS = ["Unifokal", "Multifokal"];

function formatNumber(n: any, digits = 1) {
    if (n === undefined || n === null || n === "") return "";
    const val = typeof n === "string" ? parseFloat(n.replace(",", ".")) : n;
    if (Number.isNaN(val)) return String(n);
    return val.toLocaleString("tr-TR", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
    });
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

// Basitleştirilmiş AFIP/NIH yaklaşımı – yüzdeler verilmez, yalnızca kategori döner.
function riskFrom(sizeCm: number | undefined, mitos: number | undefined, site: string) {
    if (sizeCm === undefined || mitos === undefined || !site) return "Belirsiz";
    const highMitos = mitos > 5;
    const gastric = site === "Mide";
    const smallBowel = site === "Jejenum/İleum" || site === "Duedonum";
    const colorectal = site === "Rektum" || site === "Kolon";

    // Boyut bantları
    const s = sizeCm;
    const band = s <= 2 ? 1 : s <= 5 ? 2 : s <= 10 ? 3 : 4;

    if (gastric) {
        if (!highMitos) {
            return band === 1 ? "Çok düşük" : band === 2 ? "Düşük" : band === 3 ? "Orta" : "Yüksek";
        } else {
            return band === 1 ? "Orta" : band === 2 ? "Orta" : "Yüksek";
        }
    }
    if (smallBowel || colorectal) {
        if (!highMitos) {
            return band === 1 ? "Düşük" : band === 2 ? "Orta" : "Yüksek";
        } else {
            return "Yüksek";
        }
    }
    // Diğer yerleşimler için konservatif yaklaşım
    return highMitos || band >= 3 ? "Yüksek" : band === 2 ? "Orta" : "Düşük";
}

function TestPanel() {
    const tests = [
        // pTFromSize
        { name: "pT: 1.5cm, no neo", got: pTFromSize(1.5, false), want: "pT1" },
        { name: "pT: 6cm, neo", got: pTFromSize(6, true), want: "ypT3" },
        { name: "pT: 0cm", got: pTFromSize(0, false), want: "pT0" },
        // gradeFromMitotic
        { name: "Grade: 3/5mm2", got: gradeFromMitotic(3), want: "G1; low grade" },
        { name: "Grade: 12/5mm2", got: gradeFromMitotic(12), want: "G2; high grade" },
        // riskFrom (gastric)
        { name: "Risk: Gastric 2cm, 3 mitoz", got: riskFrom(2, 3, "Mide"), want: "Çok düşük" },
        { name: "Risk: Gastric 7cm, 2 mitoz", got: riskFrom(7, 2, "Mide"), want: "Orta" },
        { name: "Risk: Gastric 3cm, 8 mitoz", got: riskFrom(3, 8, "Mide"), want: "Orta" },
        // riskFrom (small bowel)
        { name: "Risk: Jejenum 4cm, 3 mitoz", got: riskFrom(4, 3, "Jejenum/İleum"), want: "Orta" },
        { name: "Risk: Duedonum 7cm, 1 mitoz", got: riskFrom(7, 1, "Duedonum"), want: "Yüksek" },
        { name: "Risk: Rektum 3cm, 9 mitoz", got: riskFrom(3, 9, "Rektum"), want: "Yüksek" },
    ];

    const fails = tests.filter((t) => t.got !== t.want);
    return (
        <Card className={cn("mt-3 text-xs", fails.length ? "border-red-500" : "border-green-500")}>
            <CardContent className="p-3">
                <div className="font-medium text-xs">Dahili Testler</div>
                <ul className="mt-1 space-y-0.5 text-[11px] leading-snug">
                    {tests.map((t, i) => (
                        <li key={i} data-test={t.name}>
                            <span className="font-mono">{t.name}</span>: {String(t.got)} {t.got === t.want ? "✅" : `❌ (beklenen: ${t.want})`}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

export default function GistRaporlama() {
    const [histoTip, setHistoTip] = useState(HISTO_TIP_OPTS[0]);
    const [enBuyukCm, setEnBuyukCm] = useState("2.2");
    const [lx, setLx] = useState("2.2");
    const [wx, setWx] = useState("1.8");
    const [hx, setHx] = useState("1.5");
    const [sinir, setSinir] = useState("Ekspansil");
    const [odak, setOdak] = useState("Unifokal");
    const [yerlesim, setYerlesim] = useState("Mide");
    const [mitoz, setMitoz] = useState("3");
    const [nekrozVar, setNekrozVar] = useState(false);
    const [nekrozYuzde, setNekrozYuzde] = useState("0");
    const [neoTedaviVar, setNeoTedaviVar] = useState(false);
    const [canliTumorYuzde, setCanliTumorYuzde] = useState("");
    const [cerrahiMetin, setCerrahiMetin] = useState("Serozal yüzeye 0,3 cm mesafededir.");
    const [nodDurumu, setNodDurumu] = useState("Bölgesel lenf nodlarında reaktif hiperplazi (0/)");

    // İmmünohistokimya
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

    const sizeNum = useMemo(() => toNumber(enBuyukCm), [enBuyukCm]);
    const mitozNum = useMemo(() => toNumber(mitoz), [mitoz]);

    const pT = useMemo(() => pTFromSize(sizeNum, neoTedaviVar), [sizeNum, neoTedaviVar]);
    const grade = useMemo(() => gradeFromMitotic(mitozNum), [mitozNum]);
    const risk = useMemo(() => riskFrom(sizeNum, mitozNum, yerlesim), [sizeNum, mitozNum, yerlesim]);

    const rapor = useMemo(() => {
        const hatlar = [];

        // Başlık/Tip
        if (histoTip) hatlar.push(`Histolojik Tip: ${histoTip}`);

        // Boyutlar
        const ebc = formatNumber(sizeNum);
        if (ebc) hatlar.push(`En büyük tümör boyutu: ${ebc} cm`);
        const L = formatNumber(toNumber(lx));
        const W = formatNumber(toNumber(wx));
        const H = formatNumber(toNumber(hx));
        if (L || W || H) hatlar.push(`Tümör boyutları: ${L || "?"} x ${W || "?"} x ${H || "?"} cm`);

        // Sınır & Odağ
        if (sinir) hatlar.push(`Tümör sınırları: ${sinir}`);
        if (odak) hatlar.push(`Tümör odağı: ${odak}`);

        // Yerleşim
        if (yerlesim) hatlar.push(`Tümör yerleşimi: ${yerlesim}`);

        // Mitotik oran
        if (mitozNum !== undefined) hatlar.push(`Mitotik oran: ${formatNumber(mitozNum, 0)} mitoz/5mm²`);

        // Nekroz
        if (nekrozVar) {
            const n = toNumber(nekrozYuzde);
            hatlar.push(`Nekroz: Var${n !== undefined ? ` (%${formatNumber(n, 0)})` : ""}`);
        } else {
            hatlar.push("Nekroz: Yok");
        }

        // Tedavi etkisi
        if (neoTedaviVar) {
            const cty = toNumber(canliTumorYuzde);
            hatlar.push(`Neoadjuvan tedavi vardır. Canlı tümör yüzdesi: ${cty !== undefined ? `%${formatNumber(cty, 0)}` : "belirtilmemiş"}.`);
        }

        // Cerrahi sınırlar
        if (cerrahiMetin) hatlar.push(`Cerrahi sınırlar: ${cerrahiMetin}`);

        // LN durumu
        if (nodDurumu) hatlar.push(`Bölgesel lenf nodları durumu: ${nodDurumu}`);

        // Grade & Risk & pT
        if (grade) hatlar.push(`Histolojik Grade: ${grade}`);
        if (risk) hatlar.push(`Risk değerlendirmesi: ${risk}`);
        if (pT) hatlar.push(`pT kategori: ${pT}`);

        // IHK
        const ihkSatirlari = [];
        ihkSatirlari.push(`C-KİT (CD117): ${cd117}`);
        ihkSatirlari.push(`DOG1 (ANO1): ${dog1}`);
        ihkSatirlari.push(`SDHA: ${sdha}`);
        ihkSatirlari.push(`SDHB: ${sdhb}`);
        ihkSatirlari.push(`BRAF: ${braf}`);
        ihkSatirlari.push(`CD34: ${cd34}`);
        ihkSatirlari.push(`SMA: ${sma}`);
        ihkSatirlari.push(`Desmin: ${desmin}`);
        ihkSatirlari.push(`S-100: ${s100}`);
        if (ki67) ihkSatirlari.push(`Ki-67: %${ki67}`);
        hatlar.push(...ihkSatirlari);

        return hatlar.join("\n");
    }, [
        histoTip,
        sizeNum,
        lx,
        wx,
        hx,
        sinir,
        odak,
        yerlesim,
        mitozNum,
        nekrozVar,
        nekrozYuzde,
        neoTedaviVar,
        canliTumorYuzde,
        cerrahiMetin,
        nodDurumu,
        grade,
        risk,
        pT,
        cd117,
        dog1,
        sdha,
        sdhb,
        braf,
        cd34,
        sma,
        desmin,
        s100,
        ki67,
    ]);

    // Determine background color based on risk/grade
    const bgClass = useMemo(() => {
        if (risk === "Yüksek" || grade === "G2; high grade") return "bg-red-50 border-red-200";
        if (risk === "Orta") return "bg-orange-50 border-orange-200";
        if (risk === "Düşük" || risk === "Çok düşük" || grade === "G1; low grade") return "bg-green-50 border-green-200";
        return "bg-white border-gray-200";
    }, [risk, grade]);

    return (
        <PageContainer>
            <div className={cn("min-h-screen p-3 md:p-4 transition-colors duration-500", bgClass)}>
                <div className="max-w-[95%] xl:max-w-7xl mx-auto w-full space-y-4">
                    <div className="flex items-baseline justify-between gap-2">
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">GİST Raporlama</h1>
                        <div className="text-[11px] text-muted-foreground text-right">
                            CAP GIST protokolü (4.3.0.0) uyumlu şablon
                        </div>
                    </div>

                    <Card className={cn("mt-1 border transition-colors duration-500", bgClass)}>
                        <CardContent className="p-4 space-y-4">
                            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                <div className="grid gap-2 text-sm">
                                    <Label className="text-xs">Histolojik Tip</Label>
                                    <Select value={histoTip} onValueChange={setHistoTip}>
                                        <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {HISTO_TIP_OPTS.map((o) => (
                                                <SelectItem key={o} value={o}>
                                                    {o}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2 text-sm">
                                    <Label className="text-xs">Yerleşim</Label>
                                    <Select value={yerlesim} onValueChange={setYerlesim}>
                                        <SelectTrigger className="w-full h-8 text-xs">
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {YERLEŞIM_OPTS.map((o) => (
                                                <SelectItem key={o} value={o}>
                                                    {o}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2 text-sm">
                                    <Label className="text-xs">En büyük tümör boyutu (cm)</Label>
                                    <Input className="h-8 text-xs" inputMode="decimal" value={enBuyukCm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnBuyukCm(e.target.value)} />
                                </div>

                                <div className="grid gap-2 text-sm">
                                    <Label className="text-xs">Tümör boyutları (L × W × H, cm)</Label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <Input className="h-8 text-xs" placeholder="L" inputMode="decimal" value={lx} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLx(e.target.value)} />
                                        <Input className="h-8 text-xs" placeholder="W" inputMode="decimal" value={wx} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWx(e.target.value)} />
                                        <Input className="h-8 text-xs" placeholder="H" inputMode="decimal" value={hx} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHx(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid gap-2 text-sm">
                                    <Label className="text-xs">Tümör sınırları</Label>
                                    <RadioGroup value={sinir} onValueChange={(v: string) => setSinir(v)} className="flex gap-3 text-xs">
                                        {SINIR_OPTS.map((o) => (
                                            <div key={o} className="flex items-center space-x-1.5">
                                                <RadioGroupItem id={`sinir-${o}`} value={o} />
                                                <Label htmlFor={`sinir-${o}`} className="text-xs">{o}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <div className="grid gap-2 text-sm">
                                    <Label className="text-xs">Tümör odağı</Label>
                                    <RadioGroup value={odak} onValueChange={(v: string) => setOdak(v)} className="flex gap-3 text-xs">
                                        {ODAK_OPTS.map((o) => (
                                            <div key={o} className="flex items-center space-x-1.5">
                                                <RadioGroupItem id={`odak-${o}`} value={o} />
                                                <Label htmlFor={`odak-${o}`} className="text-xs">{o}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                <div className="grid gap-2 text-sm">
                                    <Label className="text-xs">Mitotik oran (mitoz/5mm²)</Label>
                                    <Input className="h-8 text-xs" inputMode="numeric" value={mitoz} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMitoz(e.target.value)} />
                                </div>

                                <div className="grid gap-1.5 text-sm">
                                    <Label className="flex items-center gap-2 text-xs">
                                        Nekroz
                                        <Switch checked={nekrozVar} onCheckedChange={setNekrozVar} />
                                    </Label>
                                    {nekrozVar && (
                                        <Input className="h-8 text-xs max-w-[90px]" placeholder="%" inputMode="numeric" value={nekrozYuzde} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNekrozYuzde(e.target.value)} />
                                    )}
                                </div>

                                <div className="grid gap-1.5 text-sm">
                                    <Label className="flex items-center gap-2 text-xs">
                                        Neoadjuvan tedavi var
                                        <Switch checked={neoTedaviVar} onCheckedChange={setNeoTedaviVar} />
                                    </Label>
                                    {neoTedaviVar && (
                                        <Input className="h-8 text-xs max-w-[120px]" placeholder="Canlı tümör %" inputMode="numeric" value={canliTumorYuzde} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCanliTumorYuzde(e.target.value)} />
                                    )}
                                </div>

                                <div className="md:col-span-2 grid gap-1.5 text-sm">
                                    <Label className="text-xs">Cerrahi sınırlar (serbest metin)</Label>
                                    <Textarea className="text-xs min-h-[52px]" value={cerrahiMetin} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCerrahiMetin(e.target.value)} rows={2} />
                                </div>

                                <div className="md:col-span-2 grid gap-1.5 text-sm">
                                    <Label className="text-xs">Bölgesel lenf nodları (serbest metin)</Label>
                                    <Textarea className="text-xs min-h-[52px]" value={nodDurumu} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNodDurumu(e.target.value)} rows={2} />
                                </div>
                            </section>

                            <Separator className="my-1" />

                            <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">C-KİT (CD117)</Label>
                                    <Select value={cd117} onValueChange={setCd117}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {["Pozitif", "Negatif"].map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">DOG1 (ANO1)</Label>
                                    <Select value={dog1} onValueChange={setDog1}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {['Pozitif', 'Negatif'].map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">SDHA</Label>
                                    <Select value={sdha} onValueChange={setSdha}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {['İntakt', 'Deficient'].map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">SDHB</Label>
                                    <Select value={sdhb} onValueChange={setSdhb}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {['İntakt', 'Deficient'].map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">BRAF</Label>
                                    <Select value={braf} onValueChange={setBraf}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {['Pozitif', 'Negatif'].map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">CD34</Label>
                                    <Select value={cd34} onValueChange={setCd34}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {['Pozitif', 'Negatif', 'Yamalı pozitif'].map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">SMA</Label>
                                    <Select value={sma} onValueChange={setSma}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {['Pozitif', 'Negatif', 'Yamalı pozitif'].map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">Desmin</Label>
                                    <Select value={desmin} onValueChange={setDesmin}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {['Pozitif', 'Negatif', 'Yamalı pozitif'].map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">S-100</Label>
                                    <Select value={s100} onValueChange={setS100}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="text-xs">
                                            {['Pozitif', 'Negatif', 'Yamalı pozitif'].map((o) => (
                                                <SelectItem key={o} value={o}>{o}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-[11px]">Ki-67 (%)</Label>
                                    <Input className="h-8 text-xs" inputMode="numeric" value={ki67} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKi67(e.target.value)} />
                                </div>
                            </section>

                            <Separator className="my-1" />

                            <div className="flex items-center justify-between gap-2 text-[11px]">
                                <div className="text-muted-foreground leading-snug">
                                    Hesaplananlar:
                                    <span className="font-medium"> Grade</span> ({grade || "-"}),
                                    <span className="font-medium"> Risk</span> ({risk || "-"}),
                                    <span className="font-medium"> pT</span> ({pT || "-"})
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard?.writeText(rapor).catch(() => { });
                                    }}
                                    className="rounded-xl h-8 px-3 text-xs"
                                >
                                    Raporu Kopyala
                                </Button>
                            </div>

                            <Card className="border-dashed text-xs">
                                <CardContent className="p-3">
                                    <pre className="whitespace-pre-wrap text-[11px] leading-snug max-h-[260px] overflow-auto">{rapor}</pre>
                                </CardContent>
                            </Card>

                            <TestPanel />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}
