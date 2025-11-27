import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Copy, Check, Activity, Ruler, Microscope, FileText, Info } from "lucide-react";
import { PageContainer } from "../components/PageContainer";

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

    // Inline styles to override ALL global CSS
    const baseButtonStyle: React.CSSProperties = {
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid',
        outline: 'none',
        fontFamily: 'inherit',
        lineHeight: '1.5',
    };

    const activeButtonStyle: React.CSSProperties = {
        ...baseButtonStyle,
        backgroundColor: '#2563eb',
        color: '#ffffff',
        borderColor: '#2563eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    };

    const inactiveButtonStyle: React.CSSProperties = {
        ...baseButtonStyle,
        backgroundColor: '#ffffff',
        color: '#475569',
        borderColor: '#e2e8f0',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        fontSize: '14px',
        fontWeight: '500',
        color: '#0f172a',
        outline: 'none',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        marginBottom: '24px',
    };

    return (
        <PageContainer>
            <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px 16px' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '16px',
                        padding: '32px',
                        marginBottom: '32px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
                                    GİST Raporlama
                                </h1>
                                <p style={{ fontSize: '14px', color: '#94a3b8' }}>CAP GIST Protokolü (4.3.0.0) Uyumlu Akıllı Şablon</p>
                            </div>
                            <div style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Info size={14} />
                                <span>v2.3 Stable</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
                        {/* Main Form */}
                        <div>
                            {/* Tümör Özellikleri */}
                            <div style={cardStyle}>
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '1px solid #e2e8f0',
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: '#dbeafe',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#1d4ed8'
                                    }}>
                                        <Microscope size={18} />
                                    </div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Tümör Özellikleri</h3>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    {/* Histolojik Tip */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            color: '#64748b',
                                            marginBottom: '12px'
                                        }}>Histolojik Tip</label>
                                        <div style={{ display: 'grid', gap: '8px' }}>
                                            {HISTO_TIP_OPTS.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setHistoTip(opt)}
                                                    style={{
                                                        ...baseButtonStyle,
                                                        backgroundColor: histoTip === opt ? '#eff6ff' : '#ffffff',
                                                        color: histoTip === opt ? '#1e40af' : '#475569',
                                                        borderColor: histoTip === opt ? '#93c5fd' : '#e2e8f0',
                                                        textAlign: 'left',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        borderRadius: '50%',
                                                        border: `2px solid ${histoTip === opt ? '#2563eb' : '#cbd5e1'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        {histoTip === opt && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />}
                                                    </div>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Yerleşim */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            color: '#64748b',
                                            marginBottom: '12px'
                                        }}>Yerleşim</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            {YERLEŞIM_OPTS.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setYerlesim(opt)}
                                                    style={yerlesim === opt ? {
                                                        ...activeButtonStyle,
                                                        backgroundColor: '#6366f1',
                                                        borderColor: '#6366f1',
                                                    } : inactiveButtonStyle}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Boyutlar */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#64748b',
                                                marginBottom: '8px'
                                            }}>En Büyük Boyut</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={enBuyukCm}
                                                    onChange={(e) => setEnBuyukCm(e.target.value)}
                                                    placeholder="0.0"
                                                    style={{ ...inputStyle, paddingRight: '40px' }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: '#94a3b8',
                                                    pointerEvents: 'none'
                                                }}>cm</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#64748b',
                                                marginBottom: '8px'
                                            }}>Mitotik Oran</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={mitoz}
                                                    onChange={(e) => setMitoz(e.target.value)}
                                                    placeholder="0"
                                                    style={{ ...inputStyle, paddingRight: '60px' }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: '#94a3b8',
                                                    pointerEvents: 'none'
                                                }}>/5mm²</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* L x W x H */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            color: '#64748b',
                                            marginBottom: '8px'
                                        }}>Diğer Boyutlar (L x W x H)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                            <input type="text" inputMode="decimal" value={lx} onChange={(e) => setLx(e.target.value)} placeholder="L" style={inputStyle} />
                                            <input type="text" inputMode="decimal" value={wx} onChange={(e) => setWx(e.target.value)} placeholder="W" style={inputStyle} />
                                            <input type="text" inputMode="decimal" value={hx} onChange={(e) => setHx(e.target.value)} placeholder="H" style={inputStyle} />
                                        </div>
                                    </div>

                                    {/* Sınır ve Odak */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#64748b',
                                                marginBottom: '12px'
                                            }}>Tümör Sınırları</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {SINIR_OPTS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setSinir(opt)}
                                                        style={sinir === opt ? activeButtonStyle : inactiveButtonStyle}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#64748b',
                                                marginBottom: '12px'
                                            }}>Tümör Odağı</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {ODAK_OPTS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setOdak(opt)}
                                                        style={odak === opt ? activeButtonStyle : inactiveButtonStyle}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ek Özellikler */}
                            <div style={cardStyle}>
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '1px solid #e2e8f0',
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: '#dbeafe',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#1d4ed8'
                                    }}>
                                        <Activity size={18} />
                                    </div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Ek Özellikler</h3>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        <div style={{
                                            backgroundColor: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Nekroz</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Tümörde nekroz varlığı</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {nekrozVar && <input type="text" placeholder="%" value={nekrozYuzde} onChange={(e) => setNekrozYuzde(e.target.value)} style={{ ...inputStyle, width: '80px', textAlign: 'center' }} />}
                                                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={nekrozVar}
                                                        onChange={(e) => setNekrozVar(e.target.checked)}
                                                        style={{ opacity: 0, width: 0, height: 0 }}
                                                    />
                                                    <span style={{
                                                        position: 'absolute',
                                                        cursor: 'pointer',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        backgroundColor: nekrozVar ? '#2563eb' : '#cbd5e1',
                                                        transition: '0.3s',
                                                        borderRadius: '24px',
                                                    }}>
                                                        <span style={{
                                                            position: 'absolute',
                                                            content: '',
                                                            height: '18px',
                                                            width: '18px',
                                                            left: nekrozVar ? '26px' : '3px',
                                                            bottom: '3px',
                                                            backgroundColor: 'white',
                                                            transition: '0.3s',
                                                            borderRadius: '50%',
                                                        }} />
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                        <div style={{
                                            backgroundColor: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Neoadjuvan</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Tedavi sonrası</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {neoTedaviVar && <input type="text" placeholder="Canlı %" value={canliTumorYuzde} onChange={(e) => setCanliTumorYuzde(e.target.value)} style={{ ...inputStyle, width: '96px', textAlign: 'center' }} />}
                                                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={neoTedaviVar}
                                                        onChange={(e) => setNeoTedaviVar(e.target.checked)}
                                                        style={{ opacity: 0, width: 0, height: 0 }}
                                                    />
                                                    <span style={{
                                                        position: 'absolute',
                                                        cursor: 'pointer',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        backgroundColor: neoTedaviVar ? '#2563eb' : '#cbd5e1',
                                                        transition: '0.3s',
                                                        borderRadius: '24px',
                                                    }}>
                                                        <span style={{
                                                            position: 'absolute',
                                                            content: '',
                                                            height: '18px',
                                                            width: '18px',
                                                            left: neoTedaviVar ? '26px' : '3px',
                                                            bottom: '3px',
                                                            backgroundColor: 'white',
                                                            transition: '0.3s',
                                                            borderRadius: '50%',
                                                        }} />
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#64748b',
                                                marginBottom: '8px'
                                            }}>Cerrahi Sınırlar</label>
                                            <textarea
                                                value={cerrahiMetin}
                                                onChange={(e) => setCerrahiMetin(e.target.value)}
                                                rows={2}
                                                style={{
                                                    ...inputStyle,
                                                    resize: 'none',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#64748b',
                                                marginBottom: '8px'
                                            }}>Lenf Nodları</label>
                                            <textarea
                                                value={nodDurumu}
                                                onChange={(e) => setNodDurumu(e.target.value)}
                                                rows={2}
                                                style={{
                                                    ...inputStyle,
                                                    resize: 'none',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* İmmünohistokimya */}
                            <div style={cardStyle}>
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    borderBottom: '1px solid #e2e8f0',
                                    padding: '20px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: '#dbeafe',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#1d4ed8'
                                    }}>
                                        <Ruler size={18} />
                                    </div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>İmmünohistokimya</h3>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                                        {[
                                            { label: 'C-KİT (CD117)', value: cd117, setter: setCd117, options: ['Pozitif', 'Negatif'] },
                                            { label: 'DOG1 (ANO1)', value: dog1, setter: setDog1, options: ['Pozitif', 'Negatif'] },
                                            { label: 'CD34', value: cd34, setter: setCd34, options: ['Pozitif', 'Negatif', 'Yamalı pozitif'] },
                                            { label: 'SMA', value: sma, setter: setSma, options: ['Pozitif', 'Negatif', 'Yamalı pozitif'] },
                                            { label: 'Desmin', value: desmin, setter: setDesmin, options: ['Pozitif', 'Negatif', 'Yamalı pozitif'] },
                                            { label: 'S-100', value: s100, setter: setS100, options: ['Pozitif', 'Negatif', 'Yamalı pozitif'] },
                                            { label: 'BRAF', value: braf, setter: setBraf, options: ['Pozitif', 'Negatif'] },
                                            { label: 'SDHA', value: sdha, setter: setSdha, options: ['İntakt', 'Deficient'] },
                                            { label: 'SDHB', value: sdhb, setter: setSdhb, options: ['İntakt', 'Deficient'] },
                                        ].map(item => (
                                            <div key={item.label}>
                                                <label style={{
                                                    display: 'block',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    color: '#64748b',
                                                    marginBottom: '12px'
                                                }}>{item.label}</label>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {item.options.map(opt => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => item.setter(opt)}
                                                            style={{
                                                                ...baseButtonStyle,
                                                                padding: '8px 12px',
                                                                fontSize: '13px',
                                                                backgroundColor: item.value === opt ? '#2563eb' : '#ffffff',
                                                                color: item.value === opt ? '#ffffff' : '#475569',
                                                                borderColor: item.value === opt ? '#2563eb' : '#e2e8f0',
                                                            }}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#64748b',
                                                marginBottom: '8px'
                                            }}>Ki-67 İndeksi</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={ki67}
                                                    onChange={(e) => setKi67(e.target.value)}
                                                    placeholder="0"
                                                    style={{ ...inputStyle, paddingRight: '32px' }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: '#94a3b8',
                                                    pointerEvents: 'none'
                                                }}>%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div>
                            <div style={{ position: 'sticky', top: '24px' }}>
                                {/* Sonuç Paneli */}
                                <div style={{
                                    ...cardStyle,
                                    border: '2px solid',
                                    borderColor: risk === 'Yüksek' ? '#fca5a5' : risk === 'Orta' ? '#fdba74' : risk === 'Düşük' || risk === 'Çok düşük' ? '#86efac' : '#e2e8f0',
                                    backgroundColor: risk === 'Yüksek' ? '#fef2f2' : risk === 'Orta' ? '#fff7ed' : risk === 'Düşük' || risk === 'Çok düşük' ? '#f0fdf4' : '#ffffff',
                                }}>
                                    <div style={{ padding: '24px', textAlign: 'center' }}>
                                        <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '24px' }}>Sonuç Paneli</h3>
                                        <div style={{ marginBottom: '16px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '8px' }}>Risk</div>
                                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{risk || '-'}</div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '8px' }}>Grade</div>
                                                <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{grade || '-'}</div>
                                            </div>
                                            <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '8px' }}>pT</div>
                                                <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>{pT || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rapor Önizleme */}
                                <div style={{ ...cardStyle, backgroundColor: '#1e293b', borderColor: '#334155', marginTop: '24px' }}>
                                    <div style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderBottom: '1px solid #334155',
                                        padding: '20px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#60a5fa'
                                        }}>
                                            <FileText size={18} />
                                        </div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>Rapor Önizleme</h3>
                                    </div>
                                    <div style={{ padding: '24px', position: 'relative' }}>
                                        <pre style={{
                                            maxHeight: '400px',
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            backgroundColor: 'rgba(0,0,0,0.3)',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            fontSize: '11px',
                                            lineHeight: '1.6',
                                            color: '#cbd5e1',
                                            fontFamily: 'monospace',
                                            margin: 0
                                        }}>
                                            {rapor}
                                        </pre>
                                        <button
                                            onClick={handleCopy}
                                            style={{
                                                ...baseButtonStyle,
                                                position: 'absolute',
                                                bottom: '36px',
                                                right: '36px',
                                                backgroundColor: copied ? '#10b981' : '#2563eb',
                                                color: '#ffffff',
                                                borderColor: copied ? '#10b981' : '#2563eb',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                            {copied ? 'Kopyalandı' : 'Kopyala'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
