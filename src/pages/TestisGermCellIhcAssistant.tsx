import React, { useState, useMemo, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  Copy, Check, ChevronDown, ChevronUp, Info, Shield, AlertTriangle,
  RefreshCw, Clipboard, X, Eye, Microscope
} from 'lucide-react';
import {
  type AntibodyDefinition,
  type SerumMarkers,
  type AgeRange,
  type MorphologyFlags,
  type TumorType,
  type CardOutput,
  MAIN_PANEL_ANTIBODIES,
  MIMIC_PANEL_ANTIBODIES,
  TUMOR_DEFINITIONS,
  AGE_RANGES,
  MORPHOLOGY_FLAGS,
  MEDICAL_DISCLAIMER,
  WEIGHT_DISCLAIMER,
  getScoreColor,
  CARD_COLORS,
  SERUM_INTERPRETATIONS,
} from '../data/testisGhtData';
import {
  calculateTumorScores,
  generateCombinationCards,
  generateMimicWarnings,
  generateNextMarkerSuggestions,
  buildIhcCopyText,
  buildSerumCopyText,
  buildInterpretationCopyText,
  isPositive as checkIsPositive,
} from '../data/testisGhtRules';

// ─── Inline style constants ───
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  marginBottom: '16px',
};

const sectionHeaderStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  padding: '14px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  userSelect: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#64748b',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none',
  fontFamily: 'inherit',
};

// ─── Sub-Components ───

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback handled */ }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px', borderRadius: '8px', fontSize: '13px',
        fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
        border: '1px solid', fontFamily: 'inherit',
        backgroundColor: copied ? '#dcfce7' : '#f8fafc',
        color: copied ? '#166534' : '#475569',
        borderColor: copied ? '#86efac' : '#e2e8f0',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Kopyalandı' : label}
    </button>
  );
}

function AntibodyRow({
  antibody,
  selectedKey,
  onSelect,
  onInfoClick,
  referenceExpected,
}: {
  antibody: AntibodyDefinition;
  selectedKey: string;
  onSelect: (antibodyId: string, optionKey: string) => void;
  onInfoClick: (antibodyId: string) => void;
  referenceExpected?: string;
}) {
  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onInfoClick(antibody.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6366f1', fontWeight: '700', fontSize: '13px',
            padding: '2px 4px', borderRadius: '4px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
          title={`${antibody.name} bilgi kartı`}
        >
          <Info size={13} />
          {antibody.name}
        </button>
        {antibody.isNuclearMarker && (
          <span style={{
            fontSize: '10px', fontWeight: '600', color: '#7c3aed',
            backgroundColor: '#ede9fe', padding: '1px 6px', borderRadius: '4px',
          }}>NÜK</span>
        )}
        {referenceExpected && (
          <span style={{
            fontSize: '10px', fontWeight: '500', color: '#0369a1',
            backgroundColor: '#e0f2fe', padding: '1px 6px', borderRadius: '10px',
            marginLeft: 'auto',
          }} title="Seçili referans tümör beklentisi">
            📌 {referenceExpected}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {antibody.options.map((opt) => {
          const isSelected = selectedKey === opt.key;
          let bgColor = '#ffffff';
          let textColor = '#475569';
          let borderColor = '#e2e8f0';
          if (isSelected) {
            if (opt.key === 'not_done') {
              bgColor = '#f1f5f9'; textColor = '#64748b'; borderColor = '#cbd5e1';
            } else if (opt.key === 'negative') {
              bgColor = '#fef2f2'; textColor = '#991b1b'; borderColor = '#fca5a5';
            } else if (opt.isWrongPattern) {
              bgColor = '#fef3c7'; textColor = '#92400e'; borderColor = '#fcd34d';
            } else if (opt.isPositive) {
              bgColor = '#dcfce7'; textColor = '#166534'; borderColor = '#86efac';
            } else {
              bgColor = '#e0e7ff'; textColor = '#3730a3'; borderColor = '#a5b4fc';
            }
          }
          return (
            <button
              key={opt.key}
              onClick={() => onSelect(antibody.id, opt.key)}
              style={{
                padding: '5px 10px', borderRadius: '6px', fontSize: '11px',
                fontWeight: isSelected ? '700' : '500', cursor: 'pointer',
                transition: 'all 0.15s', border: '1px solid',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                backgroundColor: bgColor, color: textColor, borderColor,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScoreBar({ tumorId, name, score, isSelected, onClick }: {
  tumorId: string; name: string; score: number; isSelected: boolean;
  onClick: () => void;
}) {
  const colors = getScoreColor(score);
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '10px 14px', borderRadius: '10px', marginBottom: '6px',
        border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
        transition: 'all 0.2s', fontFamily: 'inherit',
        boxShadow: isSelected ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{name}</span>
        <span style={{
          fontSize: '12px', fontWeight: '700', color: colors.text,
          backgroundColor: colors.bg, padding: '2px 8px', borderRadius: '6px',
          border: `1px solid ${colors.border}`,
        }}>
          {Math.round(score)}%
        </span>
      </div>
      <div style={{
        height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${Math.min(score, 100)}%`,
          backgroundColor: colors.border, borderRadius: '3px',
          transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ fontSize: '10px', color: colors.text, marginTop: '2px', fontWeight: '500' }}>
        {colors.label}
      </div>
    </button>
  );
}

function CardDisplay({ card }: { card: CardOutput }) {
  const colors = CARD_COLORS[card.type];
  return (
    <div style={{
      padding: '14px 16px', borderRadius: '10px', marginBottom: '8px',
      backgroundColor: colors.bg, borderLeft: `4px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>{colors.icon}</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            {card.title}
          </div>
          <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.5' }}>
            {card.text}
          </div>
          {card.suggestions && card.suggestions.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {card.suggestions.map((s, i) => (
                <div key={i} style={{
                  fontSize: '11px', color: '#475569', padding: '3px 8px',
                  backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '4px',
                  marginBottom: '3px', display: 'inline-block', marginRight: '4px',
                }}>
                  💊 {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ antibody }: { antibody: AntibodyDefinition | null }) {
  if (!antibody) return null;
  const info = antibody.infoCard;
  return (
    <div style={{
      ...cardStyle, border: '2px solid #c7d2fe', marginBottom: '12px',
    }}>
      <div style={{
        padding: '14px 18px', backgroundColor: '#eef2ff',
        borderBottom: '1px solid #c7d2fe',
      }}>
        <div style={{ fontSize: '15px', fontWeight: '800', color: '#3730a3' }}>
          📋 {antibody.name}
        </div>
      </div>
      <div style={{ padding: '14px 18px', fontSize: '12px', lineHeight: '1.6', color: '#334155' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Boyanma paterni:</strong> {info.stainingPattern}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Ana kullanım:</strong> {info.mainUse}
        </div>
        {info.expectedPositive.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <strong>Güçlü beklenen:</strong> {info.expectedPositive.join(', ')}
          </div>
        )}
        {info.expectedNegative.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <strong>Beklenen negatif:</strong> {info.expectedNegative.join(', ')}
          </div>
        )}
        {info.pitfall && (
          <div style={{
            padding: '8px 10px', backgroundColor: '#fef9c3', borderRadius: '6px',
            fontSize: '11px', color: '#854d0e',
          }}>
            ⚠️ <strong>Pitfall:</strong> {info.pitfall}
          </div>
        )}
      </div>
    </div>
  );
}

function ReferencePanel({ tumorId }: { tumorId: TumorType | null }) {
  if (!tumorId) return null;
  const tumor = TUMOR_DEFINITIONS.find(t => t.id === tumorId);
  if (!tumor) return null;
  const ref = tumor.referenceProfile;
  return (
    <div style={{
      ...cardStyle, border: '2px solid #bfdbfe', marginBottom: '12px',
    }}>
      <div style={{
        padding: '14px 18px', backgroundColor: '#dbeafe',
        borderBottom: '1px solid #bfdbfe',
      }}>
        <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e40af' }}>
          📖 {tumor.name} – Referans Profil
        </div>
      </div>
      <div style={{ padding: '14px 18px', fontSize: '12px', lineHeight: '1.6', color: '#334155' }}>
        {Object.entries(ref.expectedMarkers).map(([marker, info]) => (
          <div key={marker} style={{ marginBottom: '4px' }}>
            <strong>{marker}:</strong> {info.expected}
            {info.note && <span style={{ color: '#64748b' }}> ({info.note})</span>}
          </div>
        ))}
        {ref.pitfalls.length > 0 && (
          <div style={{
            marginTop: '10px', padding: '8px 10px', backgroundColor: '#fef9c3',
            borderRadius: '6px', fontSize: '11px', color: '#854d0e',
          }}>
            ⚠️ <strong>Pitfall:</strong>
            {ref.pitfalls.map((p, i) => <div key={i}>• {p}</div>)}
          </div>
        )}
        {ref.notes.length > 0 && ref.notes.map((n, i) => (
          <div key={i} style={{
            marginTop: '6px', padding: '6px 10px', backgroundColor: '#f0f9ff',
            borderRadius: '6px', fontSize: '11px', color: '#0369a1',
          }}>
            ℹ️ {n}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───
export function TestisGermCellIhcAssistant() {
  // ─── State ───
  const [observedResults, setObservedResults] = useState<Record<string, string>>({});
  const [serumMarkers, setSerumMarkers] = useState<SerumMarkers>({
    afp: { value: '', unit: 'ng/mL', status: 'unknown' },
    betaHcg: { value: '', unit: 'mIU/mL', status: 'unknown' },
    ldh: { value: '', unit: 'xULN', status: 'unknown' },
  });
  const [ageRange, setAgeRange] = useState<AgeRange>('unknown');
  const [morphologyFlags, setMorphologyFlags] = useState<MorphologyFlags>({});
  const [selectedTumorReference, setSelectedTumorReference] = useState<TumorType | null>(null);
  const [selectedAntibodyInfo, setSelectedAntibodyInfo] = useState<string | null>(null);
  const [showMimicPanel, setShowMimicPanel] = useState(false);
  const [showSerumPanel, setShowSerumPanel] = useState(true);
  const [showMorphologyPanel, setShowMorphologyPanel] = useState(true);
  const [showCopyPanel, setShowCopyPanel] = useState(false);

  // ─── Handlers ───
  const handleAntibodySelect = useCallback((antibodyId: string, optionKey: string) => {
    setObservedResults(prev => ({ ...prev, [antibodyId]: optionKey }));
  }, []);

  const handleTumorClick = useCallback((tumorId: TumorType) => {
    setSelectedTumorReference(prev => prev === tumorId ? null : tumorId);
    setSelectedAntibodyInfo(null);
  }, []);

  const handleAntibodyInfoClick = useCallback((antibodyId: string) => {
    setSelectedAntibodyInfo(prev => prev === antibodyId ? null : antibodyId);
    setSelectedTumorReference(null);
  }, []);

  const handleSerumChange = useCallback((marker: 'afp' | 'betaHcg' | 'ldh', field: string, value: string) => {
    setSerumMarkers(prev => ({
      ...prev,
      [marker]: { ...prev[marker], [field]: value },
    }));
  }, []);

  const handleMorphologyChange = useCallback((key: keyof MorphologyFlags) => {
    setMorphologyFlags(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleClearAll = useCallback(() => {
    setObservedResults({});
    setSerumMarkers({
      afp: { value: '', unit: 'ng/mL', status: 'unknown' },
      betaHcg: { value: '', unit: 'mIU/mL', status: 'unknown' },
      ldh: { value: '', unit: 'xULN', status: 'unknown' },
    });
    setAgeRange('unknown');
    setMorphologyFlags({});
    setSelectedTumorReference(null);
    setSelectedAntibodyInfo(null);
  }, []);

  const handleClearAntibodies = useCallback(() => {
    setObservedResults({});
  }, []);

  const handleClearSerum = useCallback(() => {
    setSerumMarkers({
      afp: { value: '', unit: 'ng/mL', status: 'unknown' },
      betaHcg: { value: '', unit: 'mIU/mL', status: 'unknown' },
      ldh: { value: '', unit: 'xULN', status: 'unknown' },
    });
  }, []);

  // ─── Computed ───
  const scores = useMemo(() =>
    calculateTumorScores(observedResults, serumMarkers, ageRange, morphologyFlags),
    [observedResults, serumMarkers, ageRange, morphologyFlags]
  );

  const combinationCards = useMemo(() =>
    generateCombinationCards(observedResults, serumMarkers, ageRange, morphologyFlags, scores),
    [observedResults, serumMarkers, ageRange, morphologyFlags, scores]
  );

  const mimicWarnings = useMemo(() =>
    generateMimicWarnings(observedResults, serumMarkers, ageRange, morphologyFlags, scores),
    [observedResults, serumMarkers, ageRange, morphologyFlags, scores]
  );

  const nextSuggestions = useMemo(() =>
    generateNextMarkerSuggestions(observedResults, scores, ageRange, morphologyFlags),
    [observedResults, scores, ageRange, morphologyFlags]
  );

  const allAntibodies = useMemo(() => [...MAIN_PANEL_ANTIBODIES, ...MIMIC_PANEL_ANTIBODIES], []);

  const ihcCopyText = useMemo(() => buildIhcCopyText(observedResults, allAntibodies), [observedResults, allAntibodies]);
  const serumCopyText = useMemo(() => buildSerumCopyText(serumMarkers), [serumMarkers]);
  const allCards = useMemo(() => [...combinationCards, ...mimicWarnings], [combinationCards, mimicWarnings]);
  const interpretationCopyText = useMemo(() => buildInterpretationCopyText(allCards, scores), [allCards, scores]);
  const fullCopyText = useMemo(() => `${ihcCopyText}\n\n${serumCopyText}\n\n${interpretationCopyText}`, [ihcCopyText, serumCopyText, interpretationCopyText]);

  // Determine if any results entered
  const hasResults = Object.keys(observedResults).some(k => observedResults[k] && observedResults[k] !== 'not_done');

  // Reference expected marker for antibody rows
  const getRefExpected = useCallback((antibodyId: string): string | undefined => {
    if (!selectedTumorReference) return undefined;
    const tumor = TUMOR_DEFINITIONS.find(t => t.id === selectedTumorReference);
    if (!tumor) return undefined;
    const entry = tumor.referenceProfile.expectedMarkers[antibodyId];
    return entry?.expected;
  }, [selectedTumorReference]);

  // Find antibody definition for info panel
  const selectedAntibodyDef = useMemo(() => {
    if (!selectedAntibodyInfo) return null;
    return allAntibodies.find(a => a.id === selectedAntibodyInfo) || null;
  }, [selectedAntibodyInfo, allAntibodies]);

  // Sorted scores
  const sortedScores = useMemo(() => {
    return TUMOR_DEFINITIONS
      .map(t => ({ id: t.id, name: t.name, score: scores[t.id] || 0 }))
      .sort((a, b) => b.score - a.score);
  }, [scores]);

  const serumStatusOptions: { key: string; label: string }[] = [
    { key: 'unknown', label: 'Bilinmiyor' },
    { key: 'normal', label: 'Normal' },
    { key: 'mild_high', label: 'Hafif yüksek' },
    { key: 'significant_high', label: 'Anlamlı yüksek' },
    { key: 'very_high', label: 'Çok yüksek' },
  ];

  return (
    <PageContainer>
      <div style={{ minHeight: '100vh', padding: '8px 0' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

          {/* ─── Header ─── */}
          <div style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%)',
            borderRadius: '16px', padding: '28px 28px 20px', marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={22} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                  Testis GHT İHK Uyum Yardımcısı
                </h1>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>
                  WHO 2022 terminolojisi temelinde statik karar destek aracı
                </p>
              </div>
            </div>
          </div>

          {/* ─── Medical Disclaimer ─── */}
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '12px',
            backgroundColor: '#fef2f2', border: '1px solid #fecaca',
            display: 'flex', alignItems: 'flex-start', gap: '8px',
          }}>
            <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ fontSize: '12px', color: '#991b1b', lineHeight: '1.5' }}>
              <strong>{MEDICAL_DISCLAIMER}</strong>
              <br />
              <span style={{ color: '#b91c1c', fontSize: '11px' }}>{WEIGHT_DISCLAIMER}</span>
            </div>
          </div>

          {/* ─── Main Layout ─── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 390px',
            gap: '16px',
          }} className="testis-ght-layout">

            {/* ═══ LEFT COLUMN ═══ */}
            <div>

              {/* ─── Age Range ─── */}
              <div style={cardStyle}>
                <div style={{ padding: '14px 18px' }}>
                  <label style={labelStyle}>Yaş Aralığı</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {AGE_RANGES.map(a => (
                      <button
                        key={a.key}
                        onClick={() => setAgeRange(a.key)}
                        style={{
                          padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                          fontWeight: ageRange === a.key ? '700' : '500',
                          cursor: 'pointer', border: '1px solid',
                          fontFamily: 'inherit', transition: 'all 0.15s',
                          backgroundColor: ageRange === a.key ? '#0d9488' : '#ffffff',
                          color: ageRange === a.key ? '#ffffff' : '#475569',
                          borderColor: ageRange === a.key ? '#0d9488' : '#e2e8f0',
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ─── Serum Markers ─── */}
              <div style={cardStyle}>
                <div
                  style={sectionHeaderStyle}
                  onClick={() => setShowSerumPanel(p => !p)}
                >
                  <Microscope size={16} color="#0d9488" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    Serum Markerları (Opsiyonel)
                  </span>
                  {showSerumPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {showSerumPanel && (
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {(['afp', 'betaHcg', 'ldh'] as const).map(marker => (
                        <div key={marker}>
                          <label style={labelStyle}>
                            {marker === 'afp' ? 'AFP' : marker === 'betaHcg' ? 'beta-hCG' : 'LDH'}
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Değer"
                            value={serumMarkers[marker].value}
                            onChange={e => handleSerumChange(marker, 'value', e.target.value)}
                            style={{ ...inputStyle, marginBottom: '6px' }}
                          />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                            {serumStatusOptions.map(opt => (
                              <button
                                key={opt.key}
                                onClick={() => handleSerumChange(marker, 'status', opt.key)}
                                style={{
                                  padding: '3px 7px', borderRadius: '4px', fontSize: '10px',
                                  fontWeight: serumMarkers[marker].status === opt.key ? '700' : '500',
                                  cursor: 'pointer', border: '1px solid',
                                  fontFamily: 'inherit',
                                  backgroundColor: serumMarkers[marker].status === opt.key ? '#0d9488' : '#fff',
                                  color: serumMarkers[marker].status === opt.key ? '#fff' : '#64748b',
                                  borderColor: serumMarkers[marker].status === opt.key ? '#0d9488' : '#e2e8f0',
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                            {serumMarkers[marker].unit}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Serum interpretation */}
                    {(['afp', 'betaHcg', 'ldh'] as const).some(m => serumMarkers[m].status !== 'unknown' && serumMarkers[m].status !== 'normal') && (
                      <div style={{ marginTop: '10px' }}>
                        {(['afp', 'betaHcg', 'ldh'] as const).map(m => {
                          const s = serumMarkers[m].status;
                          if (s === 'unknown' || s === 'normal') return null;
                          const interp = SERUM_INTERPRETATIONS[m];
                          return (
                            <div key={m} style={{
                              fontSize: '11px', color: '#854d0e', padding: '6px 10px',
                              backgroundColor: '#fef9c3', borderRadius: '6px', marginBottom: '4px',
                            }}>
                              ⚠️ {interp}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─── Morphology Flags ─── */}
              <div style={cardStyle}>
                <div
                  style={sectionHeaderStyle}
                  onClick={() => setShowMorphologyPanel(p => !p)}
                >
                  <Eye size={16} color="#0d9488" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    Morfoloji / Klinik Bilgi
                  </span>
                  {showMorphologyPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {showMorphologyPanel && (
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                      {MORPHOLOGY_FLAGS.map(flag => (
                        <label
                          key={flag.key}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', color: '#334155', cursor: 'pointer',
                            padding: '5px 8px', borderRadius: '6px',
                            backgroundColor: morphologyFlags[flag.key] ? '#f0fdfa' : 'transparent',
                            border: morphologyFlags[flag.key] ? '1px solid #99f6e4' : '1px solid transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!morphologyFlags[flag.key]}
                            onChange={() => handleMorphologyChange(flag.key)}
                            style={{ accentColor: '#0d9488' }}
                          />
                          {flag.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* ─── Main Panel Antibodies ─── */}
              <div style={cardStyle}>
                <div style={{
                  ...sectionHeaderStyle, cursor: 'default',
                }}>
                  <Microscope size={16} color="#0d9488" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    Ana Panel Antikorları
                  </span>
                </div>
                {MAIN_PANEL_ANTIBODIES.map(ab => (
                  <AntibodyRow
                    key={ab.id}
                    antibody={ab}
                    selectedKey={observedResults[ab.id] || 'not_done'}
                    onSelect={handleAntibodySelect}
                    onInfoClick={handleAntibodyInfoClick}
                    referenceExpected={getRefExpected(ab.id)}
                  />
                ))}
              </div>

              {/* ─── Mimic/Safety Panel ─── */}
              <div style={cardStyle}>
                <div
                  style={sectionHeaderStyle}
                  onClick={() => setShowMimicPanel(p => !p)}
                >
                  <AlertTriangle size={16} color="#ec4899" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    {showMimicPanel ? 'Mimik / güvenlik panelini kapat' : 'Mimik / güvenlik panelini aç'}
                  </span>
                  {showMimicPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {showMimicPanel && (
                  <>
                    {MIMIC_PANEL_ANTIBODIES.map(ab => (
                      <AntibodyRow
                        key={ab.id}
                        antibody={ab}
                        selectedKey={observedResults[ab.id] || 'not_done'}
                        onSelect={handleAntibodySelect}
                        onInfoClick={handleAntibodyInfoClick}
                        referenceExpected={getRefExpected(ab.id)}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* ─── Combination Cards ─── */}
              {combinationCards.length > 0 && (
                <div style={cardStyle}>
                  <div style={{
                    ...sectionHeaderStyle, cursor: 'default',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                      🔬 Kombinasyon Kartları
                    </span>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    {combinationCards.map((card, i) => (
                      <CardDisplay key={i} card={card} />
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Mimic Warnings ─── */}
              {mimicWarnings.length > 0 && (
                <div style={cardStyle}>
                  <div style={{
                    ...sectionHeaderStyle, cursor: 'default',
                    backgroundColor: '#fdf2f8',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#831843' }}>
                      🔴 GHT Dışı / Mimik Uyarıları
                    </span>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    {mimicWarnings.map((card, i) => (
                      <CardDisplay key={i} card={card} />
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Next Marker Suggestions ─── */}
              {nextSuggestions.length > 0 && (
                <div style={cardStyle}>
                  <div style={{
                    ...sectionHeaderStyle, cursor: 'default',
                    backgroundColor: '#eff6ff',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e40af' }}>
                      💡 Sonraki Önerilen Markerlar
                    </span>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    {nextSuggestions.map((card, i) => (
                      <CardDisplay key={i} card={card} />
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Copy Section ─── */}
              <div style={cardStyle}>
                <div
                  style={sectionHeaderStyle}
                  onClick={() => setShowCopyPanel(p => !p)}
                >
                  <Clipboard size={16} color="#0d9488" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    Kopyalanabilir Metinler
                  </span>
                  {showCopyPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {showCopyPanel && (
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>İHK Sonucu</label>
                      <div style={{
                        padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px',
                        border: '1px solid #e2e8f0', fontSize: '12px', lineHeight: '1.6',
                        color: '#334155', marginBottom: '6px', maxHeight: '120px', overflow: 'auto',
                      }}>
                        {ihcCopyText || 'Henüz sonuç girilmemiş.'}
                      </div>
                      <CopyButton text={ihcCopyText} label="Kopyala: İHK" />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>Serum Sonucu</label>
                      <div style={{
                        padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px',
                        border: '1px solid #e2e8f0', fontSize: '12px', lineHeight: '1.6',
                        color: '#334155', marginBottom: '6px',
                      }}>
                        {serumCopyText}
                      </div>
                      <CopyButton text={serumCopyText} label="Kopyala: Serum" />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>Uyum Yorumu</label>
                      <div style={{
                        padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px',
                        border: '1px solid #e2e8f0', fontSize: '12px', lineHeight: '1.6',
                        color: '#334155', marginBottom: '6px', maxHeight: '120px', overflow: 'auto',
                      }}>
                        {interpretationCopyText || 'Yeterli veri girilmemiş.'}
                      </div>
                      <CopyButton text={interpretationCopyText} label="Kopyala: Uyum Yorumu" />
                    </div>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      <CopyButton text={fullCopyText} label="Hepsini Kopyala" />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Action Buttons ─── */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px',
              }}>
                <button
                  onClick={handleClearAntibodies}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                    fontWeight: '600', cursor: 'pointer', border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff', color: '#475569', fontFamily: 'inherit',
                  }}
                >
                  <RefreshCw size={12} style={{ marginRight: '4px', display: 'inline' }} />
                  Antikorları Temizle
                </button>
                <button
                  onClick={handleClearSerum}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                    fontWeight: '600', cursor: 'pointer', border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff', color: '#475569', fontFamily: 'inherit',
                  }}
                >
                  Serum Temizle
                </button>
                <button
                  onClick={() => setShowMimicPanel(p => !p)}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                    fontWeight: '600', cursor: 'pointer', border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff', color: '#475569', fontFamily: 'inherit',
                  }}
                >
                  {showMimicPanel ? 'Mimik Paneli Kapat' : 'Mimik Paneli Aç'}
                </button>
                <button
                  onClick={handleClearAll}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                    fontWeight: '500', cursor: 'pointer', border: '1px solid #fecaca',
                    backgroundColor: '#fff', color: '#b91c1c', fontFamily: 'inherit',
                    opacity: 0.7,
                  }}
                >
                  <X size={12} style={{ marginRight: '4px', display: 'inline' }} />
                  Tüm Sonuçları Temizle
                </button>
              </div>

            </div>

            {/* ═══ RIGHT COLUMN (Sidebar) ═══ */}
            <div>
              <div
                className="testis-ght-sidebar"
                style={{
                  position: 'sticky',
                  top: '16px',
                  maxHeight: 'calc(100vh - 32px)',
                  overflowY: 'auto',
                  paddingRight: '6px',
                }}
              >
                {/* ─── Tumor Scores ─── */}
                <div style={cardStyle}>
                  <div style={{
                    ...sectionHeaderStyle, cursor: 'default',
                  }}>
                    <Shield size={16} color="#0d9488" />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                      Komponent Profil Uyumu
                    </span>
                  </div>
                  <div style={{ padding: '14px 18px' }}>
                    {sortedScores.map(s => (
                      <ScoreBar
                        key={s.id}
                        tumorId={s.id}
                        name={s.name}
                        score={s.score}
                        isSelected={selectedTumorReference === s.id}
                        onClick={() => handleTumorClick(s.id as TumorType)}
                      />
                    ))}
                  </div>
                </div>

                {/* Info/Reference Panel */}
                {selectedAntibodyDef && (
                  <InfoPanel antibody={selectedAntibodyDef} />
                )}
                {selectedTumorReference && (
                  <ReferencePanel tumorId={selectedTumorReference} />
                )}
                {!selectedAntibodyDef && !selectedTumorReference && (
                  <div style={{
                    ...cardStyle, padding: '20px',
                    textAlign: 'center', color: '#94a3b8',
                  }}>
                    <Info size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#64748b' }}>
                      Bilgi Paneli
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                      Antikor adına tıklayarak bilgi kartını,
                      tümör başlığına tıklayarak referans profilini görüntüleyin.
                    </div>
                  </div>
                )}

                {/* Active warnings count */}
                {(combinationCards.length > 0 || mimicWarnings.length > 0) && (
                  <div style={{ ...cardStyle, marginTop: '8px' }}>
                    <div style={{ padding: '10px 14px' }}>
                      <div style={{
                        fontSize: '11px', fontWeight: '700', color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
                      }}>
                        Aktif Kartlar
                      </div>
                      {combinationCards.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#166534', marginBottom: '2px' }}>
                          ✅ {combinationCards.length} kombinasyon kartı
                        </div>
                      )}
                      {mimicWarnings.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#831843' }}>
                          🔴 {mimicWarnings.length} GHT dışı uyarı
                        </div>
                      )}
                      {nextSuggestions.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#1e40af', marginTop: '2px' }}>
                          💡 {nextSuggestions.length} marker önerisi
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile responsive override ─── */}
      <style>{`
        @media (max-width: 1024px) {
          .testis-ght-layout {
            grid-template-columns: 1fr !important;
          }
        }
        .testis-ght-sidebar::-webkit-scrollbar {
          width: 6px;
        }
        .testis-ght-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .testis-ght-sidebar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }
      `}</style>
    </PageContainer>
  );
}
