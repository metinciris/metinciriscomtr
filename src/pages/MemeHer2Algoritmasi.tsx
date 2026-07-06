import React, { useState, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  ChevronLeft,
  Microscope,
  Info,
  BookOpen,
  FlaskConical,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type SampleAdequacy = 'adequate' | 'too_few' | 'dcis_only' | 'artefact_dominant';
type MembraneStatus = 'none' | 'present' | 'cytoplasmic_only' | 'artefact';
type MembraneIntensity = 'faint' | 'weak' | 'moderate' | 'strong';
type MembranePattern = 'incomplete' | 'complete' | 'cytoplasmic_masking';
type CellProportion = 'lte10' | 'gt10';
type IshResult = 'negative' | 'positive' | 'pending';

type HER2Score = '0' | '0+' | '1+' | '2+' | '3+';
type ClinicalCategory =
  | 'HER2-null'
  | 'HER2-ultralow'
  | 'HER2-low'
  | 'HER2-equivocal'
  | 'HER2-positive'
  | 'HER2-low (ISH-neg)'
  | 'HER2-positive (ISH-amp)'
  | 'ISH bekleniyor';

interface HER2Input {
  sampleAdequacy: SampleAdequacy;
  membraneStatus: MembraneStatus;
  intensity: MembraneIntensity;
  pattern: MembranePattern;
  proportion: CellProportion;
  ishResult?: IshResult;
}

interface HER2Result {
  score: HER2Score;
  category: ClinicalCategory;
  ishRequired: boolean;
  reportSentence: string;
  notes: string[];
  colorKey: 'positive' | 'equivocal' | 'low' | 'ultralow' | 'null' | 'pending';
  isRare?: boolean;
}

interface Warning {
  type: 'block' | 'choice' | 'info';
  message: string;
  choices?: { label: string; action: string }[];
}

// ─── Scoring function (pure) ─────────────────────────────────────────────────

function calculateHER2Score(input: Partial<HER2Input>): HER2Result | null {
  const { sampleAdequacy, membraneStatus, intensity, pattern, proportion, ishResult } = input;

  // No membrane staining
  if (membraneStatus === 'none') {
    return {
      score: '0',
      category: 'HER2-null',
      ishRequired: false,
      reportSentence:
        'HER2 IHK: Skor 0; invaziv tümör hücrelerinde membranöz boyanma izlenmemiştir. Klinik kategori: HER2-null.',
      notes: [
        'Önceden yalnızca HER2-negatif olarak raporlanmış eski olgularda, metastatik hastada T-DXd değerlendirmesi gündemdeyse yeniden değerlendirme/restain düşünülebilir.',
      ],
      colorKey: 'null',
    };
  }

  // Cytoplasmic masking → 2+/equivocal
  if (pattern === 'cytoplasmic_masking') {
    const result: HER2Result = {
      score: '2+',
      category: 'HER2-equivocal',
      ishRequired: true,
      reportSentence:
        'HER2 IHK: Skor 2+; membran boyanma şiddeti sitoplazmik boyanma nedeniyle güvenilir ayrıştırılamadığından refleks ISH ile değerlendirme önerilir.',
      notes: ['Sitoplazmik boyanma varlığında komplet/inkomplet ayrımı yapılamamaktadır. ISH zorunludur.'],
      colorKey: 'equivocal',
    };
    if (ishResult) return applyIsh(result, ishResult);
    return result;
  }

  if (!intensity || !pattern || !proportion) return null;

  let score: HER2Score;
  let colorKey: HER2Result['colorKey'];
  let isRare = false;

  // Decision matrix
  if (intensity === 'faint') {
    if (proportion === 'lte10') {
      score = '0+';
      colorKey = 'ultralow';
    } else {
      score = '1+';
      colorKey = 'low';
    }
  } else if (intensity === 'weak') {
    if (pattern === 'incomplete') {
      score = proportion === 'lte10' ? '0+' : '1+';
      colorKey = proportion === 'lte10' ? 'ultralow' : 'low';
    } else {
      // complete
      score = proportion === 'lte10' ? '1+' : '2+';
      colorKey = proportion === 'lte10' ? 'low' : 'equivocal';
    }
  } else if (intensity === 'moderate') {
    if (pattern === 'incomplete' && proportion === 'lte10') {
      score = '1+';
      colorKey = 'low';
    } else {
      score = '2+';
      colorKey = 'equivocal';
    }
  } else {
    // strong
    if (pattern === 'complete' && proportion === 'gt10') {
      score = '3+';
      colorKey = 'positive';
    } else if (pattern === 'incomplete' && proportion === 'lte10') {
      score = '1+';
      colorKey = 'low';
      isRare = true;
    } else {
      score = '2+';
      colorKey = 'equivocal';
    }
  }

  const result = buildResult(score, colorKey, isRare);
  if (score === '2+' && ishResult) return applyIsh(result, ishResult);
  return result;
}

function buildResult(score: HER2Score, colorKey: HER2Result['colorKey'], isRare?: boolean): HER2Result {
  const notes: string[] = [];
  if (isRare) {
    notes.push(
      'Nadir/alışılmadık patern (strong + inkomplet + ≤%10): gerekiyorsa ikinci patolog görüşü, tekrar boyama veya ek blok düşünülebilir.',
    );
  }

  const categoryMap: Record<HER2Score, ClinicalCategory> = {
    '0': 'HER2-null',
    '0+': 'HER2-ultralow',
    '1+': 'HER2-low',
    '2+': 'HER2-equivocal',
    '3+': 'HER2-positive',
  };

  const sentenceMap: Record<HER2Score, string> = {
    '0': 'HER2 IHK: Skor 0; invaziv tümör hücrelerinde membranöz boyanma izlenmemiştir. Klinik kategori: HER2-null.',
    '0+': 'HER2 IHK: Skor 0+; invaziv tümör hücrelerinde ≤%10 oranında çok silik/zayıf membranöz boyanma izlenmiştir. Klinik kategori: HER2-ultralow.',
    '1+': 'HER2 IHK: Skor 1+; invaziv tümör hücrelerinde düşük düzeyde membranöz boyanma izlenmiştir. Klinik kategori: HER2-low.',
    '2+': 'HER2 IHK: Skor 2+; nihai HER2 durumu için refleks ISH sonucu beklenmektedir.',
    '3+': "HER2 IHK: Skor 3+; invaziv tümör hücrelerinin >%10'unda kuvvetli komplet membranöz boyanma izlenmiştir. Kategori: HER2-positive.",
  };

  return {
    score,
    category: categoryMap[score],
    ishRequired: score === '2+',
    reportSentence: sentenceMap[score],
    notes,
    colorKey,
    isRare,
  };
}

function applyIsh(base: HER2Result, ish: IshResult): HER2Result {
  if (ish === 'negative') {
    return {
      ...base,
      category: 'HER2-low (ISH-neg)',
      colorKey: 'low',
      reportSentence:
        'HER2 IHK: Skor 2+. Refleks ISH ile HER2 amplifikasyonu saptanmamıştır. Nihai klinik kategori: HER2-low.',
    };
  }
  if (ish === 'positive') {
    return {
      ...base,
      category: 'HER2-positive (ISH-amp)',
      colorKey: 'positive',
      reportSentence:
        'HER2 IHK: Skor 2+. Refleks ISH ile HER2 amplifikasyonu saptanmıştır. Nihai kategori: HER2-positive.',
    };
  }
  // pending
  return {
    ...base,
    category: 'ISH bekleniyor',
    colorKey: 'pending',
    reportSentence: 'HER2 IHK: Skor 2+; nihai HER2 durumu için refleks ISH sonucu beklenmektedir.',
  };
}

// ─── Color tokens ─────────────────────────────────────────────────────────────

const COLOR_TOKENS: Record<HER2Result['colorKey'], { bg: string; border: string; text: string; badge: string }> = {
  positive: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
  },
  equivocal: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
  },
  ultralow: {
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    text: 'text-violet-800',
    badge: 'bg-violet-100 text-violet-700',
  },
  null: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-600',
  },
  pending: {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-600',
  },
};

// ─── Step definitions ─────────────────────────────────────────────────────────

type StepId =
  | 'adequacy'
  | 'membrane'
  | 'intensity'
  | 'pattern'
  | 'proportion'
  | 'ish'
  | 'result';

// ─── Accordion helper ─────────────────────────────────────────────────────────

function Accordion({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-3 font-semibold text-gray-800">
          {icon}
          {title}
        </span>
        {open ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 text-sm text-gray-700 leading-relaxed border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ─── Option button ─────────────────────────────────────────────────────────────

function OptionBtn({
  label,
  hint,
  selected,
  onClick,
  color = 'indigo',
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
  color?: string;
}) {
  const baseSelected = color === 'indigo'
    ? 'border-indigo-500 bg-indigo-50 text-indigo-800 shadow-md shadow-indigo-100'
    : color === 'amber'
    ? 'border-amber-500 bg-amber-50 text-amber-800'
    : 'border-indigo-500 bg-indigo-50 text-indigo-800';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md group ${
        selected
          ? baseSelected
          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/40'
      }`}
    >
      <div className="font-medium">{label}</div>
      {hint && <div className={`text-xs mt-1 ${selected ? 'opacity-80' : 'text-gray-400 group-hover:text-gray-500'}`}>{hint}</div>}
    </button>
  );
}

// ─── Selection summary chip ───────────────────────────────────────────────────

function SummaryChip({ label }: { label: string }) {
  return (
    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium mr-1 mb-1">
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MemeHer2Algoritmasi() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepId>('adequacy');

  // Selections
  const [sampleAdequacy, setSampleAdequacy] = useState<SampleAdequacy | null>(null);
  const [membraneStatus, setMembraneStatus] = useState<MembraneStatus | null>(null);
  const [membraneChoice, setMembraneChoice] = useState<'none' | 'present' | null>(null); // after warning
  const [intensity, setIntensity] = useState<MembraneIntensity | null>(null);
  const [pattern, setPattern] = useState<MembranePattern | null>(null);
  const [proportion, setProportion] = useState<CellProportion | null>(null);
  const [ishResult, setIshResult] = useState<IshResult | null>(null);

  // Warnings
  const [warning, setWarning] = useState<Warning | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setStarted(false);
    setCurrentStep('adequacy');
    setSampleAdequacy(null);
    setMembraneStatus(null);
    setMembraneChoice(null);
    setIntensity(null);
    setPattern(null);
    setProportion(null);
    setIshResult(null);
    setWarning(null);
    setCopied(false);
  }, []);

  const goBack = () => {
    setWarning(null);
    const order: StepId[] = ['adequacy', 'membrane', 'intensity', 'pattern', 'proportion', 'ish', 'result'];
    const idx = order.indexOf(currentStep);
    if (idx > 0) setCurrentStep(order[idx - 1]);
  };

  // Compute result
  const inputForCalc: Partial<HER2Input> = {
    sampleAdequacy: sampleAdequacy ?? undefined,
    membraneStatus: (membraneStatus === 'artefact' || membraneStatus === 'cytoplasmic_only')
      ? membraneChoice === 'none' ? 'none' : membraneChoice === 'present' ? 'present' : undefined
      : membraneStatus ?? undefined,
    intensity: intensity ?? undefined,
    pattern: pattern ?? undefined,
    proportion: proportion ?? undefined,
    ishResult: ishResult ?? undefined,
  };

  const result =
    currentStep === 'result' || (currentStep === 'ish' && ishResult !== null)
      ? calculateHER2Score(inputForCalc)
      : null;

  const finalResult =
    currentStep === 'result'
      ? calculateHER2Score(inputForCalc)
      : null;

  // Selection summary
  const summaryParts: string[] = [];
  if (sampleAdequacy) {
    const aMap: Record<SampleAdequacy, string> = {
      adequate: 'Örnek: yeterli',
      too_few: 'Örnek: az hücre',
      dcis_only: 'Örnek: DCIS',
      artefact_dominant: 'Örnek: artefakt',
    };
    summaryParts.push(aMap[sampleAdequacy]);
  }
  if (membraneStatus) {
    const mMap: Record<MembraneStatus, string> = {
      none: 'Membran: yok',
      present: 'Membran: var',
      cytoplasmic_only: 'Membran: sitoplazmik',
      artefact: 'Membran: kuşkulu',
    };
    summaryParts.push(mMap[membraneStatus]);
  }
  if (membraneChoice === 'none') summaryParts.push('Karar: membran yok');
  if (membraneChoice === 'present') summaryParts.push('Karar: membran var');
  if (intensity) {
    const iMap: Record<MembraneIntensity, string> = {
      faint: 'Şiddet: faint',
      weak: 'Şiddet: weak',
      moderate: 'Şiddet: moderate',
      strong: 'Şiddet: strong',
    };
    summaryParts.push(iMap[intensity]);
  }
  if (pattern) {
    const pMap: Record<MembranePattern, string> = {
      incomplete: 'Patern: inkomplet',
      complete: 'Patern: komplet',
      cytoplasmic_masking: 'Patern: maskelenmiş',
    };
    summaryParts.push(pMap[pattern]);
  }
  if (proportion) {
    summaryParts.push(proportion === 'lte10' ? 'Oran: ≤%10' : 'Oran: >%10');
  }
  if (ishResult) {
    const ishMap: Record<IshResult, string> = {
      negative: 'ISH: negatif',
      positive: 'ISH: pozitif',
      pending: 'ISH: bekleniyor',
    };
    summaryParts.push(ishMap[ishResult]);
  }

  const handleCopy = () => {
    if (finalResult) {
      navigator.clipboard.writeText(finalResult.reportSentence).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // ─── Step handlers ────────────────────────────────────────────────

  const handleAdequacy = (val: SampleAdequacy) => {
    setSampleAdequacy(val);
    if (val === 'dcis_only') {
      setWarning({
        type: 'block',
        message:
          'HER2 skoru invaziv tümör hücrelerinde değerlendirilmelidir. İn situ komponentteki boyanma invaziv tümör skoruna dahil edilmez.',
      });
      return;
    }
    if (val === 'too_few') {
      setWarning({
        type: 'block',
        message:
          'HER2 değerlendirmesi belirsiz / yetersiz olabilir. Özellikle T-DXd uygunluğu düşünülen metastatik hastada yeni kesit, ek blok veya alternatif örnek değerlendirmesi düşünülebilir.',
      });
      return;
    }
    setWarning(null);
    setCurrentStep('membrane');
  };

  const handleMembrane = (val: MembraneStatus) => {
    setMembraneStatus(val);
    if (val === 'cytoplasmic_only') {
      setWarning({
        type: 'choice',
        message:
          'Sitoplazmik, nükleer veya granüler nonmembranöz boyanma HER2 skoru için kullanılmaz. Membranöz boyanma değerlendirmesine devam etmek için seçiniz:',
        choices: [
          { label: 'Gerçek membranöz boyanma yok kabul et', action: 'none' },
          { label: 'Preparat tekrar değerlendirilecek', action: 'retry' },
        ],
      });
      return;
    }
    if (val === 'artefact') {
      setWarning({
        type: 'choice',
        message:
          'Kenar artefaktı, apikal/luminal yüzey boyanması veya hücre kümelerinin çevresel boyanması gerçek interselüler membranöz boyanmayı taklit edebilir. Kuşkulu durumda tekrar boyama veya ek blok önerilir.',
        choices: [
          { label: 'Gerçek membranöz boyanma var', action: 'present' },
          { label: 'Gerçek membranöz boyanma yok', action: 'none' },
        ],
      });
      return;
    }
    setWarning(null);
    if (val === 'none') {
      setCurrentStep('result');
    } else {
      setCurrentStep('intensity');
    }
  };

  const handleWarningChoice = (action: string) => {
    if (action === 'retry') {
      setMembraneStatus(null);
      setWarning(null);
      return;
    }
    if (action === 'none') {
      setMembraneChoice('none');
      setWarning(null);
      setCurrentStep('result');
      return;
    }
    if (action === 'present') {
      setMembraneChoice('present');
      setWarning(null);
      setCurrentStep('intensity');
      return;
    }
  };

  const handleIntensity = (val: MembraneIntensity) => {
    setIntensity(val);
    setCurrentStep('pattern');
  };

  const handlePattern = (val: MembranePattern) => {
    setPattern(val);
    if (val === 'cytoplasmic_masking') {
      setCurrentStep('ish');
    } else {
      setCurrentStep('proportion');
    }
  };

  const handleProportion = (val: CellProportion) => {
    setProportion(val);
    // Check if 2+ will be needed for ISH
    const tempInput: Partial<HER2Input> = {
      membraneStatus: (membraneStatus === 'artefact' || membraneStatus === 'cytoplasmic_only')
        ? membraneChoice === 'none' ? 'none' : 'present'
        : membraneStatus ?? undefined,
      intensity: intensity ?? undefined,
      pattern: pattern ?? undefined,
      proportion: val,
    };
    const tempResult = calculateHER2Score(tempInput);
    if (tempResult?.score === '2+') {
      setCurrentStep('ish');
    } else {
      setCurrentStep('result');
    }
  };

  const handleIsh = (val: IshResult) => {
    setIshResult(val);
    setCurrentStep('result');
  };

  // ─── Render steps ─────────────────────────────────────────────────

  const renderStep = () => {
    if (!started) return null;

    // Warning overlay
    if (warning) {
      return (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={22} />
            <p className="text-amber-800 font-medium leading-relaxed">{warning.message}</p>
          </div>
          {warning.choices && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {warning.choices.map((c) => (
                <button
                  key={c.action}
                  onClick={() => handleWarningChoice(c.action)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-amber-300 text-amber-800 font-medium hover:bg-amber-100 transition-colors text-sm"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {warning.type === 'block' && (
            <button
              onClick={() => { setWarning(null); setSampleAdequacy(null); }}
              className="text-amber-600 text-sm underline hover:no-underline"
            >
              ← Geri dön
            </button>
          )}
        </div>
      );
    }

    switch (currentStep) {
      case 'adequacy':
        return (
          <StepCard
            stepNo={1}
            title="Örnek Yeterliliği"
            subtitle="Değerlendirilen materyal hakkında en uygun seçeneği işaretleyiniz."
          >
            <div className="space-y-3">
              {([
                { val: 'adequate', label: 'Yeterli invaziv tümör alanı mevcut', hint: 'Standart skorlama için devam' },
                { val: 'too_few', label: 'Çok az invaziv tümör hücresi var', hint: 'Sınırlı materyal / küçük biyopsi' },
                { val: 'dcis_only', label: 'Sadece DCIS / in situ alan değerlendiriliyor', hint: 'İnvaziv komponente eşlik etmiyor' },
                { val: 'artefact_dominant', label: 'Nekrotik / ezilmiş / artefaktlı alan baskın', hint: 'Teknik kalite yetersiz' },
              ] as { val: SampleAdequacy; label: string; hint: string }[]).map((o) => (
                <OptionBtn
                  key={o.val}
                  label={o.label}
                  hint={o.hint}
                  selected={sampleAdequacy === o.val}
                  onClick={() => handleAdequacy(o.val)}
                />
              ))}
            </div>
          </StepCard>
        );

      case 'membrane':
        return (
          <StepCard
            stepNo={2}
            title="Membran Boyanması"
            subtitle="İnvaziv tümör hücrelerinde membranöz boyanma var mı?"
          >
            <div className="space-y-3">
              {([
                { val: 'none', label: 'Hiç membran boyanması yok' },
                { val: 'present', label: 'Membranöz boyanma mevcut' },
                { val: 'cytoplasmic_only', label: 'Sadece sitoplazmik / nükleer / granüler boyanma', hint: 'Membranöz boyanma görülmüyor' },
                { val: 'artefact', label: 'Kenar artefaktı / luminal-apikal boyanma gibi kuşkulu boyanma', hint: 'Gerçek membranöz boyanmadan ayırt edilemiyor' },
              ] as { val: MembraneStatus; label: string; hint?: string }[]).map((o) => (
                <OptionBtn
                  key={o.val}
                  label={o.label}
                  hint={o.hint}
                  selected={membraneStatus === o.val}
                  onClick={() => handleMembrane(o.val)}
                />
              ))}
            </div>
          </StepCard>
        );

      case 'intensity':
        return (
          <StepCard
            stepNo={3}
            title="Membran Boyanma Şiddeti"
            subtitle="En uygun şiddet kategorisini seçiniz."
          >
            <div className="space-y-3">
              {([
                {
                  val: 'faint',
                  label: 'Faint (çok silik)',
                  hint: 'Genellikle ×40 objektifte seçilir, düşük büyütmede fark edilmez.',
                },
                {
                  val: 'weak',
                  label: 'Weak (zayıf)',
                  hint: 'Genellikle ×20 objektifte belirginleşir.',
                },
                {
                  val: 'moderate',
                  label: 'Moderate (orta)',
                  hint: 'Düşük büyütmede görülebilir; 3+ kontrol kadar kuvvetli değildir.',
                },
                {
                  val: 'strong',
                  label: 'Strong (kuvvetli)',
                  hint: 'Düşük büyütmede kolayca görülür; komplet ve yoğun membranöz boyanma 3+ lehinedir.',
                },
              ] as { val: MembraneIntensity; label: string; hint: string }[]).map((o) => (
                <OptionBtn
                  key={o.val}
                  label={o.label}
                  hint={o.hint}
                  selected={intensity === o.val}
                  onClick={() => handleIntensity(o.val)}
                />
              ))}
            </div>
          </StepCard>
        );

      case 'pattern':
        return (
          <StepCard
            stepNo={4}
            title="Membran Boyanma Paterni"
            subtitle="Boyanma dağılımını tanımlayınız."
          >
            <div className="space-y-3">
              {([
                { val: 'incomplete', label: 'İnkomplet membranöz', hint: 'Hücre çevresinin bir bölümü boyanıyor' },
                { val: 'complete', label: 'Komplet / sirkumferensiyel membranöz', hint: 'Hücre zarının tamamı boyalı' },
                { val: 'cytoplasmic_masking', label: 'Değerlendirme güç / sitoplazmik boyanma membranı maskeliyor', hint: '→ Skor 2+ / ISH önerilir' },
              ] as { val: MembranePattern; label: string; hint?: string }[]).map((o) => (
                <OptionBtn
                  key={o.val}
                  label={o.label}
                  hint={o.hint}
                  selected={pattern === o.val}
                  onClick={() => handlePattern(o.val)}
                />
              ))}
            </div>
          </StepCard>
        );

      case 'proportion':
        return (
          <StepCard
            stepNo={5}
            title="Pozitif Hücre Oranı"
            subtitle="Membran boyanması gösteren invaziv tümör hücrelerinin yaklaşık oranı:"
          >
            <div className="space-y-3">
              <OptionBtn
                label="≤%10 — Tümör hücrelerinin onda biri ya da daha azında boyanma"
                selected={proportion === 'lte10'}
                onClick={() => handleProportion('lte10')}
              />
              <OptionBtn
                label=">%10 — Tümör hücrelerinin ondan fazlasında boyanma"
                selected={proportion === 'gt10'}
                onClick={() => handleProportion('gt10')}
              />
            </div>
          </StepCard>
        );

      case 'ish':
        return (
          <StepCard
            stepNo={6}
            title="Refleks ISH Sonucu"
            subtitle="HER2 IHK skoru 2+ (equivocal) olarak belirlendi. ISH sonucunu giriniz:"
          >
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-2 items-start">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>2+ olgularda refleks ISH ile nihai HER2 kategorisi belirlenir.</span>
            </div>
            <div className="space-y-3">
              <OptionBtn
                label="ISH negatif — amplifikasyon yok"
                hint="Nihai kategori: HER2-low"
                selected={ishResult === 'negative'}
                onClick={() => handleIsh('negative')}
              />
              <OptionBtn
                label="ISH pozitif — amplifikasyon var"
                hint="Nihai kategori: HER2-positive"
                selected={ishResult === 'positive'}
                onClick={() => handleIsh('positive')}
              />
              <OptionBtn
                label="ISH yapılmadı / bekleniyor"
                hint="Sonuç şimdilik belirsiz"
                selected={ishResult === 'pending'}
                onClick={() => handleIsh('pending')}
              />
            </div>
          </StepCard>
        );

      case 'result':
        return finalResult ? <ResultCard result={finalResult} onCopy={handleCopy} copied={copied} summaryParts={summaryParts} /> : null;

      default:
        return null;
    }
  };

  return (
    <PageContainer>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-indigo-800 to-violet-900 text-white p-8 md:p-12 mb-8">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Microscope className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase">
              Patoloji · Eğitim Aracı
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
            Meme Karsinomunda HER2 IHK Skorlama Algoritması
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            Adım adım ilerleyerek HER2 IHK skorunu ve klinik kategori yorumunu elde edin.
            Raporlama ve eğitim desteği için tasarlanmıştır.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 flex gap-3 items-start text-sm text-amber-800">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
        <span>
          <strong>Eğitim amaçlıdır.</strong> Bu araç; lokal validasyon, güncel ASCO/CAP şablonları ve onkoloji kararı yerine geçmez.
          Tanı ve tedavi kararları ilgili uzmanlar tarafından verilmelidir.
        </span>
      </div>

      {/* Main area */}
      <div className="max-w-2xl mx-auto">
        {!started ? (
          <div className="text-center py-10 space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
              <Microscope size={36} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Algoritmayı Başlatın</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Adım adım soruları yanıtlayarak HER2 IHK skoru ve klinik kategorisini belirleyebilirsiniz.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-base transition-colors shadow-lg shadow-indigo-200"
            >
              Algoritmaya Başla
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Selection summary */}
            {summaryParts.length > 0 && currentStep !== 'result' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Seçim özeti</p>
                <div>{summaryParts.map((p, i) => <SummaryChip key={i} label={p} />)}</div>
              </div>
            )}

            {/* Step content */}
            {renderStep()}

            {/* Navigation */}
            {!warning && currentStep !== 'adequacy' && currentStep !== 'result' && (
              <div className="flex justify-between pt-2">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} /> Geri
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <RotateCcw size={14} /> Sıfırla
                </button>
              </div>
            )}

            {currentStep === 'result' && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-xl transition-colors font-medium"
                >
                  <RotateCcw size={14} /> Yeni Değerlendirme
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Accordions */}
      <div className="mt-12 max-w-2xl mx-auto space-y-3">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Info size={18} /> Ek Bilgi
        </h2>

        <Accordion icon={<BookOpen size={16} className="text-indigo-500" />} title="HER2-low ve ultralow ne işe yarar?">
          <p>
            Tarihsel olarak 0 ve 1+ skorlar "HER2-negatif" kabul edilirken, HER2 hedefli antikor-ilaç konjugatları
            (ADC) nedeniyle 0, 0+, 1+ ve 2+/ISH-negatif ayrımı klinik iletişimde önem kazanmıştır.
            Bu ayrım özellikle metastatik meme kanserinde onkoloji tedavi seçenekleri açısından gündeme gelir.
          </p>
          <p className="mt-2 text-gray-500 text-xs">
            0+ (ultralow) kategorisi, çok silik veya inkomplet boyanan ≤%10 hücre oranındaki vakaları kapsar;
            klinik önemi araştırılmaya devam etmektedir.
          </p>
        </Accordion>

        <Accordion icon={<AlertTriangle size={16} className="text-amber-500" />} title="Skorlarken neyi dışlamalıyım?">
          <ul className="list-disc pl-4 space-y-1">
            <li>DCIS / in situ komponent HER2 skoruna dahil edilmez.</li>
            <li>Nekroz, ezilme, kuruma ve kenar artefaktlarındaki boyanma skorlanmaz.</li>
            <li>Sitoplazmik / nükleer boyanma HER2 membran skoru olarak kabul edilmez.</li>
            <li>Apikal / luminal yüzey boyanması gerçek membranöz boyanmayı taklit edebilir.</li>
            <li>Kontroller zayıfsa veya 1+ kontrol beklenen gibi değilse tekrar boyama düşünülmelidir.</li>
          </ul>
        </Accordion>

        <Accordion icon={<FlaskConical size={16} className="text-emerald-500" />} title="Preanalitik kısa not">
          <ul className="list-disc pl-4 space-y-1">
            <li>%10 nötral tamponlu formalin fiksasyonu önerilir.</li>
            <li>Soğuk iskemi idealde &lt;1 saat olmalıdır.</li>
            <li>Fiksasyon süresi genellikle 6–72 saat; en fazla 96 saat.</li>
            <li>Yeni veya yakın zamanda kesilmiş FFPE kesit tercih edilir.</li>
            <li>Çok eski boyalı lamların yeniden skorlanması yanıltıcı olabilir.</li>
          </ul>
        </Accordion>

        <Accordion icon={<ShieldCheck size={16} className="text-blue-500" />} title="Kalite güvence notu">
          <ul className="list-disc pl-4 space-y-1">
            <li>Validasyonlu HER2 IHK yöntemi kullanılmalıdır.</li>
            <li>0, 1+, 2+, 3+ aralığını kapsayan kontroller önerilir.</li>
            <li>Düşük / ultralow aralıkta interobserver değişkenlik yüksektir.</li>
            <li>Sınır olgularda ikinci patolog görüşü yararlı olabilir.</li>
            <li>Laboratuvar içi audit ve EQA programları önemlidir.</li>
          </ul>
        </Accordion>

        <Accordion icon={<ClipboardList size={16} className="text-slate-500" />} title="Raporlama yaklaşımı">
          <p>
            Rapor, mümkünse yalnızca "HER2-negatif" yerine IHK skorunu açıkça belirtmelidir:
            <strong> 0, 0+, 1+, 2+ veya 3+</strong>.
            2+ olgularda ISH sonucu ile nihai kategori raporlanmalıdır.
          </p>
        </Accordion>
      </div>

      {/* Reference */}
      <div className="mt-8 max-w-2xl mx-auto p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500">
        <p className="font-semibold text-gray-600 mb-1">Kaynak</p>
        <p>
          Rakha EA ve ark. International Expert Consensus Recommendations for HER2 Reporting in Breast Cancer:
          Focus on HER2-Low and Ultralow Categories. <em>Modern Pathology</em>, 2026.
        </p>
      </div>
    </PageContainer>
  );
}

// ─── StepCard sub-component ───────────────────────────────────────────────────

function StepCard({
  stepNo,
  title,
  subtitle,
  children,
}: {
  stepNo: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
            {stepNo}
          </span>
          <div>
            <h2 className="font-bold text-gray-900 text-base leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── ResultCard sub-component ─────────────────────────────────────────────────

function ResultCard({
  result,
  onCopy,
  copied,
  summaryParts,
}: {
  result: HER2Result;
  onCopy: () => void;
  copied: boolean;
  summaryParts: string[];
}) {
  const colors = COLOR_TOKENS[result.colorKey];

  const scoreLabel: Record<HER2Score, string> = {
    '0': 'Skor 0',
    '0+': 'Skor 0+',
    '1+': 'Skor 1+',
    '2+': 'Skor 2+',
    '3+': 'Skor 3+',
  };

  const ishLabel = result.ishRequired
    ? result.category === 'HER2-low (ISH-neg)' || result.category === 'HER2-positive (ISH-amp)'
      ? result.category.includes('ISH-neg') ? 'ISH negatif (tamamlandı)' : 'ISH pozitif (tamamlandı)'
      : result.category === 'ISH bekleniyor'
      ? 'ISH bekleniyor'
      : 'Refleks ISH önerilir'
    : 'Gerekmez';

  return (
    <div className={`rounded-2xl border-2 ${colors.bg} ${colors.border} overflow-hidden shadow-md`}>
      {/* Header */}
      <div className={`px-6 py-5 border-b ${colors.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Sonuç</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-2xl font-black ${colors.text}`}>{scoreLabel[result.score]}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${colors.badge}`}>{result.category}</span>
            </div>
          </div>
          <Microscope size={28} className={`${colors.text} opacity-50`} />
        </div>
      </div>

      {/* Details grid */}
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-white/70 rounded-xl p-3 border border-white/60">
            <p className="text-xs text-gray-400 mb-1 font-medium">HER2 IHK Skoru</p>
            <p className={`font-bold ${colors.text}`}>{result.score}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3 border border-white/60">
            <p className="text-xs text-gray-400 mb-1 font-medium">Klinik Kategori</p>
            <p className={`font-bold ${colors.text}`}>{result.category}</p>
          </div>
          <div className="bg-white/70 rounded-xl p-3 border border-white/60 sm:col-span-2">
            <p className="text-xs text-gray-400 mb-1 font-medium">Refleks ISH</p>
            <p className={`font-semibold ${colors.text}`}>{ishLabel}</p>
          </div>
        </div>

        {/* Report sentence */}
        <div className="bg-white/80 rounded-xl p-4 border border-white/60">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Kısa Rapor Cümlesi</p>
          <p className="text-gray-800 text-sm leading-relaxed font-medium">{result.reportSentence}</p>
        </div>

        {/* Notes */}
        {result.notes.length > 0 && (
          <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200 space-y-1.5">
            <p className="text-xs text-amber-600 mb-2 font-semibold uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle size={13} /> Dikkat
            </p>
            {result.notes.map((n, i) => (
              <p key={i} className="text-amber-800 text-sm leading-relaxed">
                {n}
              </p>
            ))}
          </div>
        )}

        {/* Summary */}
        {summaryParts.length > 0 && (
          <div className="bg-white/60 rounded-xl p-3 border border-white/50">
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Değerlendirme özeti</p>
            <div>{summaryParts.map((p, i) => <SummaryChip key={i} label={p} />)}</div>
          </div>
        )}

        {/* Copy button */}
        <button
          onClick={onCopy}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl text-gray-700 font-medium text-sm transition-all"
        >
          {copied ? (
            <>
              <Check size={16} className="text-green-500" /> Kopyalandı
            </>
          ) : (
            <>
              <Copy size={16} /> Rapor cümlesini kopyala
            </>
          )}
        </button>
      </div>
    </div>
  );
}
