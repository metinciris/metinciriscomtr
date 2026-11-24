/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo } from "react";
import { toast } from 'sonner';
import { motion } from "motion/react";
import { Copy, Check, Activity, Ruler, Microscope, FileText, Info, LayoutGrid } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { RelatedPages } from "../components/RelatedPages";
import { ReportingDisclaimer } from "../components/ReportingDisclaimer";
import {
    HISTO_TIP_OPTS,
    YERLEŞIM_OPTS,
    SINIR_OPTS,
    ODAK_OPTS,
    CAP_GIST_RISK_REFERENCE,
    CAP_GIST_RISK_URL,
    GistData,
    formatNumber,
    toNumber,
    toMitosisCount,
    pTFromSize,
    gradeFromMitotic,
    riskFrom,
    riskAssessmentNote,
    generateGistReport
} from "../core/calculators/gist";

export default function GistRaporlama() {
    // State
    const [histoTip, setHistoTip] = useState("");
    const [enBuyukCm, setEnBuyukCm] = useState("");
    const [lx, setLx] = useState("");
    const [wx, setWx] = useState("");
    const [hx, setHx] = useState("");
    const [sinir, setSinir] = useState("");
    const [odak, setOdak] = useState("");
    const [yerlesim, setYerlesim] = useState("");
    const [mitoz, setMitoz] = useState("");
    const [nekrozVar, setNekrozVar] = useState<boolean | undefined>(undefined);
    const [nekrozYuzde, setNekrozYuzde] = useState("");
    const [neoTedaviVar, setNeoTedaviVar] = useState<boolean | undefined>(undefined);
    const [canliTumorYuzde, setCanliTumorYuzde] = useState("");
    const [cerrahiMetin, setCerrahiMetin] = useState("");
    const [nodDurumu, setNodDurumu] = useState("");

    // IHC State
    const [cd117, setCd117] = useState("");
    const [dog1, setDog1] = useState("");
    const [sdha, setSdha] = useState("");
    const [sdhb, setSdhb] = useState("");
    const [braf, setBraf] = useState("");
    const [cd34, setCd34] = useState("");
    const [sma, setSma] = useState("");
    const [desmin, setDesmin] = useState("");
    const [s100, setS100] = useState("");
    const [ki67, setKi67] = useState("");
    const [copied, setCopied] = useState(false);

    // Calculations
    const sizeNum = useMemo(() => {
        const value = toNumber(enBuyukCm);
        return value !== undefined && value >= 0 ? value : undefined;
    }, [enBuyukCm]);
    const mitozNum = useMemo(() => toMitosisCount(mitoz), [mitoz]);
    const pT = useMemo(() => pTFromSize(sizeNum, neoTedaviVar), [sizeNum, neoTedaviVar]);
    const grade = useMemo(() => gradeFromMitotic(mitozNum), [mitozNum]);
    const risk = useMemo(() => riskFrom(sizeNum, mitozNum, yerlesim, neoTedaviVar === true), [sizeNum, mitozNum, yerlesim, neoTedaviVar]);
    const riskCategory = risk.category;
    const riskNote = riskAssessmentNote(risk);

    // Report Generation
    const rapor = useMemo(() => {
        const data: GistData = {
            histoTip,
            enBuyukCm: sizeNum,
            lx: toNumber(lx),
            wx: toNumber(wx),
            hx: toNumber(hx),
            sinir,
            odak,
            yerlesim,
            mitozNum,
            nekrozVar,
            nekrozYuzde: toNumber(nekrozYuzde),
            neoTedaviVar,
            canliTumorYuzde: toNumber(canliTumorYuzde),
            cerrahiMetin,
            nodDurumu,
            cd117,
            dog1,
            sdha,
            sdhb,
            braf,
            cd34,
            sma,
            desmin,
            s100,
            ki67
        };
        return generateGistReport(data);
    }, [histoTip, sizeNum, lx, wx, hx, sinir, odak, yerlesim, mitozNum, nekrozVar, nekrozYuzde, neoTedaviVar, canliTumorYuzde, cerrahiMetin, nodDurumu, cd117, dog1, sdha, sdhb, braf, cd34, sma, desmin, s100, ki67]);

    const handleCopy = async () => {
        if (!rapor || !navigator.clipboard) return;
        try {
            await navigator.clipboard.writeText(rapor);
            setCopied(true);
            toast.success("GİST rapor şablonu panoya kopyalandı.");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Rapor panoya kopyalanamadı.");
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
                                <p style={{ fontSize: '14px', color: '#94a3b8' }}>GİST rapor taslağı • Risk kaynağı: {CAP_GIST_RISK_REFERENCE}</p>
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
                                <span>v2.4</span>
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
                                                    aria-pressed={histoTip === opt}
                                                    onClick={() => setHistoTip(histoTip === opt ? "" : opt)}
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
                                                    aria-pressed={yerlesim === opt}
                                                    onClick={() => setYerlesim(yerlesim === opt ? "" : opt)}
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
                                                        aria-pressed={sinir === opt}
                                                        onClick={() => setSinir(sinir === opt ? "" : opt)}
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
                                                        aria-pressed={odak === opt}
                                                        onClick={() => setOdak(odak === opt ? "" : opt)}
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
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                        {[
                                            { id: 'gist-nekroz', label: 'Nekroz', status: nekrozVar, setStatus: setNekrozVar, percentage: nekrozYuzde, setPercentage: setNekrozYuzde, percentageLabel: 'Nekroz yüzdesi' },
                                            { id: 'gist-neoadjuvan', label: 'Neoadjuvan tedavi', status: neoTedaviVar, setStatus: setNeoTedaviVar, percentage: canliTumorYuzde, setPercentage: setCanliTumorYuzde, percentageLabel: 'Canlı tümör yüzdesi' },
                                        ].map(({ id, label, status, setStatus, percentage, setPercentage, percentageLabel }) => (
                                            <div key={id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                                                <label htmlFor={id} style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>{label}</label>
                                                <select
                                                    id={id}
                                                    value={status === undefined ? "" : status ? "yes" : "no"}
                                                    onChange={(e) => {
                                                        const choice = e.target.value;
                                                        setStatus(choice === "" ? undefined : choice === "yes");
                                                        if (choice !== "yes") setPercentage("");
                                                    }}
                                                    style={inputStyle}
                                                >
                                                    <option value="">Belirtilmedi</option>
                                                    <option value="yes">Var</option>
                                                    <option value="no">Yok</option>
                                                </select>
                                                {status === true && (
                                                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginTop: '8px' }}>
                                                        {percentageLabel}
                                                        <input type="text" inputMode="decimal" value={percentage} onChange={(e) => setPercentage(e.target.value)} style={inputStyle} />
                                                    </label>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <div>
                                            <label htmlFor="gist-cerrahi-sinirlar" style={{
                                                display: 'block',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#64748b',
                                                marginBottom: '8px'
                                            }}>Cerrahi Sınırlar</label>
                                            <textarea
                                                id="gist-cerrahi-sinirlar"
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
                                            <label htmlFor="gist-lenf-nodlari" style={{
                                                display: 'block',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#64748b',
                                                marginBottom: '8px'
                                            }}>Lenf Nodları</label>
                                            <textarea
                                                id="gist-lenf-nodlari"
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
                                                            aria-pressed={item.value === opt}
                                                            onClick={() => item.setter(item.value === opt ? "" : opt)}
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
                                    borderColor: riskCategory === 'Yüksek' ? '#fca5a5' : riskCategory === 'Orta' ? '#fdba74' : riskCategory === 'Düşük' || riskCategory === 'Çok düşük' ? '#86efac' : '#e2e8f0',
                                    backgroundColor: riskCategory === 'Yüksek' ? '#fef2f2' : riskCategory === 'Orta' ? '#fff7ed' : riskCategory === 'Düşük' || riskCategory === 'Çok düşük' ? '#f0fdf4' : '#ffffff',
                                }}>
                                    <div style={{ padding: '24px', textAlign: 'center' }}>
                                        <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '24px' }}>Sonuç Paneli</h3>
                                        <div style={{ marginBottom: '16px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '8px' }}>Progresyon riski</div>
                                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }} aria-live="polite">{riskCategory ?? 'Hesaplanmadı'}</div>
                                            {riskNote && <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>{riskNote}</p>}
                                            <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>Primer rezeksiyon verilerine dayanır; SDH kayıplı GİST’te öngörü sınırlıdır.</p>
                                            <a href={CAP_GIST_RISK_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#1d4ed8', textDecoration: 'underline' }}>{CAP_GIST_RISK_REFERENCE}</a>
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
                                            {rapor || "Rapor önizlemesi için olgu bulgularını girin."}
                                        </pre>
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            disabled={!rapor}
                                            style={{
                                                ...baseButtonStyle,
                                                position: 'absolute',
                                                bottom: '36px',
                                                right: '36px',
                                                backgroundColor: !rapor ? '#64748b' : copied ? '#10b981' : '#2563eb',
                                                cursor: rapor ? 'pointer' : 'not-allowed',
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
