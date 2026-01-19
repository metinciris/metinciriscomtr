import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Download,
  FileText,
  Info,
  Settings2,
  Upload,
  Wand2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

/**
 * OnlineTestAnaliz.tsx
 * - Mapping: Excel tablo (A->B/C/D sıra) yapıştırılınca otomatik tersine çevirip (B sıra -> A soru no) order üretir.
 * - A anahtar + mapping varsa B/C/D anahtarlarını arka planda üretip yüklenen anahtarlarla karşılaştırır.
 * - Mapping yoksa: her kitapçık kendi anahtarıyla puanlanır; A’ya normalize analiz adımları kısıtlanır.
 */

type Booklet = "A" | "B" | "C" | "D";

type Student = {
  id: string;
  name: string;
  booklet: Booklet;
  answers: string; // ham (kitapçık sırası)
};

type AnswerKey = {
  booklet: Booklet;
  answers: string; // kitapçık sırası (optik uyumlu)
};

type Mapping = {
  fromBooklet: Exclude<Booklet, "A">;
  order: number[]; // kitapçık soru sırası i (1..N) -> A soru no (1..N)
  source: "table" | "list";
};

type Subject = {
  name: string;
  start: number;
  end: number;
};

type Scoring = {
  correct: number;
  wrong: number; // negative allowed
  blank: number;
  maxScore: number;
};

type ResultRow = {
  studentId: string;
  name: string;
  booklet: Booklet;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
  score: number;
  // normalize edilmiş cevaplar (A sırası) varsa buraya
  answersA?: string;
};

type StepStatus = "todo" | "done" | "skipped" | "warning";

const DEFAULT_PROFILE = {
  nameStart: 1,
  nameLen: 30,
  idStart: 31,
  idLen: 10,
  bookletPos: 0, // 0 = yok
  answersStart: 45,
  questionCount: 95,
  noBooklet: false,
};

function cleanVal(s: string) {
  return (s || "")
    .toUpperCase()
    .replace(/[^ABCDE*#\s]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function isPermutation1toN(arr: number[], n: number) {
  if (arr.length !== n) return false;
  const seen = new Set<number>();
  for (const x of arr) {
    if (!Number.isInteger(x) || x < 1 || x > n) return false;
    if (seen.has(x)) return false;
    seen.add(x);
  }
  return seen.size === n;
}

/**
 * Excel tablo formatı örneği:
 * A anahtar | B kitapçık sıra | C kitapçık sıra | D kitapçık sıra | Soru No
 * E         | 12             | 8              | 16             | 1
 *
 * Buradan: orderB[12-1] = 1  (B1..N -> A soru no)
 */
function parseMappingFromTableText(
  text: string,
  questionCount: number
): {
  mappings: Mapping[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const lines = (text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return { mappings: [], warnings };

  // header olabilir
  const dataLines = lines.filter((l) => /\d/.test(l));
  if (!dataLines.length) return { mappings: [], warnings };

  // satır split: önce tab, yoksa çoklu boşluk
  const splitRow = (line: string) => {
    const tabParts = line.split(/\t+/).map((x) => x.trim()).filter(Boolean);
    if (tabParts.length >= 4) return tabParts;
    return line.split(/\s+/).map((x) => x.trim()).filter(Boolean);
  };

  // table parse: her satırdan integer’ları çek
  // beklenen integer sayısı: 4 (B,C,D,SoruNo) veya 5 (A key hariç dahil) fark etmez.
  const rows: Array<{
    aNo: number;
    bPos?: number;
    cPos?: number;
    dPos?: number;
    aKeyLetter?: string;
  }> = [];

  for (const line of dataLines) {
    const parts = splitRow(line);
    // Örnek: ["E","12","8","16","1"] veya ["12","8","16","1"]
    const ints = parts
      .map((p) => {
        const m = p.match(/^\d+$/);
        return m ? parseInt(p, 10) : null;
      })
      .filter((x): x is number => x !== null);

    // minimum 2 sayı olmazsa geç
    if (ints.length < 2) continue;

    // Heuristik: satırda 4 sayı varsa sonu SoruNo kabul edelim: [B,C,D,SoruNo]
    // 2-3 sayı varsa: [B,SoruNo] gibi olabilir.
    // Bizim beklediğimiz: B,C,D ve A soru no.
    let bPos: number | undefined;
    let cPos: number | undefined;
    let dPos: number | undefined;
    let aNo: number | undefined;

    if (ints.length >= 4) {
      // son = soruNo
      aNo = ints[ints.length - 1];
      // önceki üç = B,C,D (en yaygın)
      const bcd = ints.slice(ints.length - 4, ints.length - 1);
      bPos = bcd[0];
      cPos = bcd[1];
      dPos = bcd[2];
    } else if (ints.length === 3) {
      aNo = ints[2];
      bPos = ints[0];
      cPos = ints[1];
    } else if (ints.length === 2) {
      aNo = ints[1];
      bPos = ints[0];
    }

    if (!aNo || aNo < 1 || aNo > questionCount) continue;

    // A harfini yakala (varsa)
    const letter = parts.find((p) => /^[ABCDE]$/.test(p)) || undefined;

    rows.push({
      aNo,
      bPos,
      cPos,
      dPos,
      aKeyLetter: letter,
    });
  }

  if (!rows.length) return { mappings: [], warnings };

  // order dizilerini üret (B/C/D soru sırası -> A soru no)
  const orderB = new Array<number | null>(questionCount).fill(null);
  const orderC = new Array<number | null>(questionCount).fill(null);
  const orderD = new Array<number | null>(questionCount).fill(null);

  for (const r of rows) {
    if (r.bPos && r.bPos >= 1 && r.bPos <= questionCount) orderB[r.bPos - 1] = r.aNo;
    if (r.cPos && r.cPos >= 1 && r.cPos <= questionCount) orderC[r.cPos - 1] = r.aNo;
    if (r.dPos && r.dPos >= 1 && r.dPos <= questionCount) orderD[r.dPos - 1] = r.aNo;
  }

  const mappings: Mapping[] = [];
  const finalize = (from: Exclude<Booklet, "A">, orderMaybe: Array<number | null>) => {
    const missing = orderMaybe.filter((x) => x === null).length;
    const order = orderMaybe.map((x) => x ?? -1);
    if (missing === 0 && isPermutation1toN(order as number[], questionCount)) {
      mappings.push({
        fromBooklet: from,
        order: order as number[],
        source: "table",
      });
    } else {
      // Eğer tabloda o kitapçık yoksa hiç ekleme; varsa warning ver
      const filled = orderMaybe.some((x) => x !== null);
      if (filled) {
        warnings.push(
          `${from} mapping tablosu eksik/bozuk görünüyor (boş hücre: ${missing}).`
        );
      }
    }
  };

  finalize("B", orderB);
  finalize("C", orderC);
  finalize("D", orderD);

  if (!mappings.length && warnings.length === 0) {
    warnings.push("Mapping tablosu okunamadı (format beklenenden farklı olabilir).");
  }

  return { mappings, warnings };
}

/**
 * Liste formatı: "1 2 3 4 ... N"
 * Bu zaten "kitapçık sırası -> A soru no" (order) olarak kabul edilir.
 */
function parseMappingFromListText(text: string, questionCount: number): number[] | null {
  const nums = (text || "")
    .split(/[^0-9]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => parseInt(x, 10))
    .filter((n) => Number.isInteger(n));

  if (!nums.length) return null;
  if (nums.length !== questionCount) return null;
  if (!isPermutation1toN(nums, questionCount)) return null;
  return nums;
}

/**
 * A anahtar + order (kitapçık sırası -> A soru no) => kitapçık anahtarını üret
 */
function deriveBookletKeyFromA(aKey: string, order: number[], questionCount: number) {
  const a = cleanVal(aKey);
  if (a.length !== questionCount) return "";
  const out = new Array<string>(questionCount).fill("*");
  for (let i = 0; i < questionCount; i++) {
    const aNo = order[i] - 1;
    if (aNo >= 0 && aNo < questionCount) out[i] = a[aNo];
  }
  return out.join("");
}

/**
 * Öğrenci cevaplarını A sırasına normalize et:
 * order[i] = A soru no (1..N)  // kitapçık soru i+1 hangi A sorusu?
 */
function normalizeAnswersToA(answers: string, order: number[], questionCount: number) {
  const src = cleanVal(answers);
  const out = new Array<string>(questionCount).fill("*");
  const len = Math.min(src.length, order.length, questionCount);
  for (let i = 0; i < len; i++) {
    const aNo = order[i] - 1;
    if (aNo >= 0 && aNo < questionCount) out[aNo] = src[i];
  }
  return out.join("");
}

function scoreOne(
  answers: string,
  key: string,
  scoring: Scoring,
  questionCount: number
): { correct: number; wrong: number; blank: number; net: number; score: number } {
  const a = (answers || "").padEnd(questionCount, "*").slice(0, questionCount);
  const k = (key || "").padEnd(questionCount, "*").slice(0, questionCount);

  let correct = 0;
  let wrong = 0;
  let blank = 0;

  for (let i = 0; i < questionCount; i++) {
    const ch = a[i];
    const kk = k[i];

    const isBlank = ch === "*" || ch === " " || ch === "#" || ch === "";
    if (isBlank) {
      blank++;
      continue;
    }
    if (ch === kk) correct++;
    else wrong++;
  }

  const net = correct * scoring.correct + wrong * scoring.wrong + blank * scoring.blank;
  // Score bar’daki NaN/undefined hatalarını engelle
  const safeNet = Number.isFinite(net) ? net : 0;
  const maxNet = questionCount * scoring.correct;
  const score =
    maxNet > 0
      ? (safeNet / maxNet) * scoring.maxScore
      : 0;

  return {
    correct,
    wrong,
    blank,
    net: safeNet,
    score: Number.isFinite(score) ? score : 0,
  };
}

function diffKeys(loaded: string, derived: string) {
  const a = cleanVal(loaded);
  const b = cleanVal(derived);
  const n = Math.min(a.length, b.length);
  let match = 0;
  let mismatch = 0;
  const firstDiff: Array<{ idx: number; a: string; b: string }> = [];
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) match++;
    else {
      mismatch++;
      if (firstDiff.length < 5) firstDiff.push({ idx: i + 1, a: a[i], b: b[i] });
    }
  }
  // uzunluk farklarını da mismatch say
  mismatch += Math.abs(a.length - b.length);
  return { match, mismatch, n, firstDiff };
}

function detectOverlap(ranges: Array<{ name: string; start: number; end: number }>) {
  const sorted = [...ranges].sort((x, y) => x.start - y.start);
  const collisions: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (cur.end >= next.start) {
      collisions.push({ a: cur.name, b: next.name });
    }
  }
  return collisions;
}

export default function OnlineTestAnaliz() {
  // --- State
  const [datContent, setDatContent] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([
    { booklet: "A", answers: "" },
    { booklet: "B", answers: "" },
    { booklet: "C", answers: "" },
    { booklet: "D", answers: "" },
  ]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [mappingPaste, setMappingPaste] = useState<string>("");
  const [mappingMode, setMappingMode] = useState<"table" | "list">("table");
  const [mappingBookletForList, setMappingBookletForList] = useState<Exclude<Booklet, "A">>("B");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scoring, setScoring] = useState<Scoring>({
    correct: 1,
    wrong: -0.25,
    blank: 0,
    maxScore: 100,
  });

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("dat_profile_v2");
      return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [activeStep, setActiveStep] = useState<number>(1);
  const [touchedSteps, setTouchedSteps] = useState<Set<number>>(new Set([1]));
  const [activeKeyBooklet, setActiveKeyBooklet] = useState<Booklet>("A");

  // --- Refs for scrolling
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const questionCount = useMemo(() => {
    const aKey = answerKeys.find((k) => k.booklet === "A")?.answers || "";
    const aLen = cleanVal(aKey).length;
    if (aLen > 0) return aLen;
    if (profile.questionCount > 0) return profile.questionCount;
    const first = students[0]?.answers || "";
    const firstLen = cleanVal(first).length;
    return firstLen || 0;
  }, [answerKeys, profile.questionCount, students]);

  const usedBooklets = useMemo(() => {
    const set = new Set<Booklet>();
    for (const s of students) set.add(s.booklet);
    return Array.from(set).sort();
  }, [students]);

  const usedNonA = useMemo(() => {
    return usedBooklets.filter((b) => b !== "A") as Exclude<Booklet, "A">[];
  }, [usedBooklets]);

  const aKey = useMemo(() => answerKeys.find((k) => k.booklet === "A")?.answers || "", [answerKeys]);

  const mappingByBooklet = useMemo(() => {
    const map = new Map<Exclude<Booklet, "A">, Mapping>();
    for (const m of mappings) map.set(m.fromBooklet, m);
    return map;
  }, [mappings]);

  const mappingCoverageComplete = useMemo(() => {
    if (!usedNonA.length) return true; // sadece A varsa mapping gerekmiyor
    if (!cleanVal(aKey) || cleanVal(aKey).length !== questionCount) return false;
    for (const b of usedNonA) {
      const m = mappingByBooklet.get(b);
      if (!m || m.order.length !== questionCount) return false;
      if (!isPermutation1toN(m.order, questionCount)) return false;
    }
    return true;
  }, [usedNonA, mappingByBooklet, aKey, questionCount]);

  const derivedKeys = useMemo(() => {
    const out: Partial<Record<Booklet, string>> = {};
    const a = cleanVal(aKey);
    if (a.length !== questionCount) return out;
    for (const b of ["B", "C", "D"] as const) {
      const m = mappingByBooklet.get(b);
      if (!m) continue;
      out[b] = deriveBookletKeyFromA(a, m.order, questionCount);
    }
    return out;
  }, [aKey, mappingByBooklet, questionCount]);

  // --- DAT parsing
  function parseDat(raw: string) {
    const lines = (raw || "").split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsed: Student[] = [];

    for (const line of lines) {
      const name = (line.substring(profile.nameStart - 1, profile.nameStart - 1 + profile.nameLen) || "")
        .trim();
      const id = (line.substring(profile.idStart - 1, profile.idStart - 1 + profile.idLen) || "")
        .trim();

      let booklet: Booklet = "A";
      if (!profile.noBooklet && profile.bookletPos > 0) {
        const ch = (line.substring(profile.bookletPos - 1, profile.bookletPos) || "A")
          .trim()
          .toUpperCase();
        if (ch === "B" || ch === "C" || ch === "D" || ch === "A") booklet = ch;
      }

      const ans = line.substring(profile.answersStart - 1).trim();
      const answers = cleanVal(ans);

      if (!id && !name && !answers) continue;

      parsed.push({
        id: id || `NOID_${parsed.length + 1}`,
        name: name || "İSİMSİZ",
        booklet,
        answers,
      });
    }

    setStudents(parsed);
  }

  useEffect(() => {
    try {
      localStorage.setItem("dat_profile_v2", JSON.stringify(profile));
    } catch {}
    if (datContent) parseDat(datContent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, datContent]);

  // --- Step logic (tamamlandı/atlandı vb.)
  function markTouched(step: number) {
    setTouchedSteps((prev) => new Set(prev).add(step));
  }

  function stepStatus(step: number): StepStatus {
    const aLen = cleanVal(aKey).length;
    const hasStudents = students.length > 0;
    const hasDat = datContent.trim().length > 0;

    switch (step) {
      case 1:
        return hasDat ? "done" : "todo";
      case 2:
        return hasStudents ? "done" : hasDat ? "todo" : "warning";
      case 3:
        return aLen === questionCount && questionCount > 0 ? "done" : hasStudents ? "todo" : "warning";
      case 4:
        if (!usedNonA.length) return "skipped";
        // mapping hiç yoksa: todo (atlayabilirsiniz ama analiz kısıtlı)
        if (!mappings.length) return "todo";
        return mappingCoverageComplete ? "done" : "warning";
      case 5:
        return subjects.length ? "done" : "skipped";
      case 6:
        // default scoring “hazır”; kullanıcı hiç girmediyse done demeyelim
        return touchedSteps.has(6) ? "done" : "skipped";
      case 7:
        // sonuç üretilebiliyorsa done sayalım
        if (!hasStudents) return "warning";
        if (aLen !== questionCount) return "warning";
        return "done";
      default:
        return "todo";
    }
  }

  const stepMeta = useMemo(() => {
    const statuses = Array.from({ length: 7 }, (_, i) => stepStatus(i + 1));
    const done = statuses.filter((s) => s === "done").length;
    const skipped = statuses.filter((s) => s === "skipped").length;
    const warning = statuses.filter((s) => s === "warning").length;
    return { statuses, done, skipped, warning, total: 7 };
  }, [datContent, students, aKey, questionCount, usedNonA.length, mappings.length, mappingCoverageComplete, subjects.length, touchedSteps]);

  function goToStep(step: number) {
    setActiveStep(step);
    markTouched(step);
    requestAnimationFrame(() => {
      const el = stepRefs.current[step];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // header offset
        window.scrollBy({ top: -110, left: 0, behavior: "smooth" });
      }
    });
  }

  // --- Calculate results
  const results = useMemo(() => {
    const out: ResultRow[] = [];
    const a = cleanVal(aKey);
    if (!students.length) return out;

    for (const s of students) {
      const bookletKey = answerKeys.find((k) => k.booklet === s.booklet)?.answers || "";
      const kA = a;
      const kOwn = cleanVal(bookletKey);

      let answersForScoring = s.answers;
      let keyForScoring = kOwn;
      let answersA: string | undefined = undefined;

      if (s.booklet === "A") {
        keyForScoring = kA;
        answersForScoring = s.answers;
        answersA = s.answers.padEnd(questionCount, "*").slice(0, questionCount);
      } else {
        const m = mappingByBooklet.get(s.booklet as Exclude<Booklet, "A">);
        const canNormalize = m && kA.length === questionCount && m.order.length === questionCount && isPermutation1toN(m.order, questionCount);

        if (canNormalize) {
          // normalize student answers -> A order; key = A
          answersA = normalizeAnswersToA(s.answers, m!.order, questionCount);
          answersForScoring = answersA;
          keyForScoring = kA;
        } else {
          // mapping yok/bozuk => kendi kitapçık anahtarıyla puanla
          // (kendi anahtar da yoksa A ile denemek yerine uyarı modunda net/puan yine çıkar ama güvenilmez olur)
          if (kOwn.length === questionCount) {
            answersForScoring = s.answers;
            keyForScoring = kOwn;
          } else if (kA.length === questionCount) {
            // fallback (uyarı)
            answersForScoring = s.answers;
            keyForScoring = kA;
          }
        }
      }

      const sc = scoreOne(answersForScoring, keyForScoring, scoring, questionCount);

      out.push({
        studentId: s.id,
        name: s.name,
        booklet: s.booklet,
        correct: sc.correct,
        wrong: sc.wrong,
        blank: sc.blank,
        net: sc.net,
        score: sc.score,
        answersA,
      });
    }
    return out;
  }, [students, answerKeys, aKey, scoring, mappingByBooklet, questionCount]);

  // --- Analysis helpers (only if we have A-order for everyone)
  const canDoGlobalQuestionAnalysis = useMemo(() => {
    // A anahtar şart
    if (cleanVal(aKey).length !== questionCount) return false;
    // Eğer B/C/D kullanılmışsa mapping complete olsun
    if (usedNonA.length && !mappingCoverageComplete) return false;
    return true;
  }, [aKey, questionCount, usedNonA.length, mappingCoverageComplete]);

  // --- UI helpers
  function statusBadge(s: StepStatus) {
    if (s === "done")
      return <Badge className="ml-2">Tamam</Badge>;
    if (s === "skipped")
      return <Badge variant="secondary" className="ml-2">Atlanabilir</Badge>;
    if (s === "warning")
      return <Badge variant="destructive" className="ml-2">Dikkat</Badge>;
    return <Badge variant="outline" className="ml-2">Eksik</Badge>;
  }

  // --- Step components
  function StepHeader({
    step,
    icon,
    title,
  }: {
    step: number;
    icon: React.ReactNode;
    title: string;
  }) {
    const st = stepStatus(step);
    const isActive = activeStep === step;
    return (
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => goToStep(step)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted">
            {icon}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="font-semibold">{step}. {title}</span>
              {/* “girilmediyse tamam” yazmasın: status doğrudan kriterle */}
              {statusBadge(st)}
            </div>
            {step === 4 && usedNonA.length > 0 && !mappings.length && (
              <span className="text-xs text-muted-foreground">
                Mapping girmeden devam edebilirsiniz; bu durumda kitapçıklar kendi anahtarıyla değerlendirilir.
              </span>
            )}
          </div>
        </div>
        {isActive ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </div>
    );
  }

  function StepContainer({
    step,
    children,
  }: {
    step: number;
    children: React.ReactNode;
  }) {
    const isActive = activeStep === step;
    return (
      <div
        ref={(el) => {
          stepRefs.current[step] = el;
        }}
        className="border rounded-2xl p-4 bg-card"
      >
        {children}
        {!isActive && (
          <div className="mt-2 text-xs text-muted-foreground">
            {/* collapsed hint */}
          </div>
        )}
      </div>
    );
  }

  // --- Step 1: DAT upload
  function Step1_DAT() {
    const onFile = async (file: File) => {
      const text = await file.text();
      setDatContent(text);
      markTouched(1);
      goToStep(2);
    };

    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            DAT Dosyası
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => document.getElementById("datFileInput")?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              DAT Yükle
            </Button>
            <input
              id="datFileInput"
              type="file"
              accept=".dat,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(datContent || "");
              }}
              disabled={!datContent}
            >
              <Clipboard className="w-4 h-4 mr-2" />
              Kopyala
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Ham İçerik (opsiyonel)</Label>
            <Textarea
              value={datContent}
              onChange={(e) => {
                setDatContent(e.target.value);
                markTouched(1);
              }}
              placeholder="DAT içeriğini buraya yapıştırabilirsiniz..."
              className="min-h-[140px]"
            />
          </div>

          {datContent && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Yüklendi</AlertTitle>
              <AlertDescription>
                {datContent.split(/\r?\n/).filter((l) => l.trim()).length} satır okundu.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // --- Step 2: Design Management
  function Step2_Profile() {
    const firstLine = useMemo(() => {
      const line = (datContent || "").split(/\r?\n/).find((l) => l.trim());
      return line || "";
    }, [datContent]);

    const sample = useMemo(() => {
      if (!firstLine) return null;
      const name = firstLine.substring(profile.nameStart - 1, profile.nameStart - 1 + profile.nameLen).trim();
      const id = firstLine.substring(profile.idStart - 1, profile.idStart - 1 + profile.idLen).trim();
      const booklet = profile.noBooklet || profile.bookletPos <= 0
        ? "(yok)"
        : firstLine.substring(profile.bookletPos - 1, profile.bookletPos).trim().toUpperCase();
      const answers = cleanVal(firstLine.substring(profile.answersStart - 1).trim()).slice(0, questionCount);
      return { name, id, booklet, answers };
    }, [firstLine, profile, questionCount]);

    const collisions = useMemo(() => {
      const ranges = [
        { name: "Ad Soyad", start: profile.nameStart, end: profile.nameStart + profile.nameLen - 1 },
        { name: "No", start: profile.idStart, end: profile.idStart + profile.idLen - 1 },
        ...(profile.noBooklet || profile.bookletPos <= 0
          ? []
          : [{ name: "Kitapçık", start: profile.bookletPos, end: profile.bookletPos }]),
        { name: "Cevaplar", start: profile.answersStart, end: profile.answersStart + questionCount - 1 },
      ];
      return detectOverlap(ranges);
    }, [profile, questionCount]);

    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Dizayn Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {collisions.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Çakışma var</AlertTitle>
              <AlertDescription>
                Alanlar çakışıyor:{" "}
                {collisions.map((c, i) => (
                  <span key={i} className="font-medium">
                    {c.a} ↔ {c.b}{" "}
                  </span>
                ))}
                <div className="mt-2 text-xs opacity-90">
                  İlk DAT satırı: <span className="font-mono break-all">{firstLine || "(boş)"}</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ad Soyad Başlangıç</Label>
              <Input
                type="number"
                value={profile.nameStart}
                onChange={(e) => {
                  setProfile((p: any) => ({ ...p, nameStart: clampInt(parseInt(e.target.value, 10), 1, 999) }));
                  markTouched(2);
                }}
              />
              {sample && <div className="text-xs"><span className="text-muted-foreground">Örnek:</span> <span className="font-semibold text-emerald-600">{sample.name}</span></div>}
            </div>

            <div className="space-y-2">
              <Label>Ad Soyad Uzunluk</Label>
              <Input
                type="number"
                value={profile.nameLen}
                onChange={(e) => {
                  setProfile((p: any) => ({ ...p, nameLen: clampInt(parseInt(e.target.value, 10), 1, 200) }));
                  markTouched(2);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>No Başlangıç</Label>
              <Input
                type="number"
                value={profile.idStart}
                onChange={(e) => {
                  setProfile((p: any) => ({ ...p, idStart: clampInt(parseInt(e.target.value, 10), 1, 999) }));
                  markTouched(2);
                }}
              />
              {sample && <div className="text-xs"><span className="text-muted-foreground">Örnek:</span> <span className="font-semibold text-sky-600">{sample.id}</span></div>}
            </div>

            <div className="space-y-2">
              <Label>No Uzunluk</Label>
              <Input
                type="number"
                value={profile.idLen}
                onChange={(e) => {
                  setProfile((p: any) => ({ ...p, idLen: clampInt(parseInt(e.target.value, 10), 1, 50) }));
                  markTouched(2);
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Kitapçık Yok</Label>
                <Switch
                  checked={profile.noBooklet}
                  onCheckedChange={(v) => {
                    setProfile((p: any) => ({ ...p, noBooklet: v }));
                    markTouched(2);
                  }}
                />
              </div>
              {!profile.noBooklet && (
                <>
                  <Label>Kitapçık Pozisyonu</Label>
                  <Input
                    type="number"
                    value={profile.bookletPos}
                    onChange={(e) => {
                      setProfile((p: any) => ({ ...p, bookletPos: clampInt(parseInt(e.target.value, 10), 1, 999) }));
                      markTouched(2);
                    }}
                  />
                  {sample && <div className="text-xs"><span className="text-muted-foreground">Örnek:</span> <span className="font-semibold text-violet-600">{sample.booklet}</span></div>}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cevaplar Başlangıç</Label>
              <Input
                type="number"
                value={profile.answersStart}
                onChange={(e) => {
                  setProfile((p: any) => ({ ...p, answersStart: clampInt(parseInt(e.target.value, 10), 1, 999) }));
                  markTouched(2);
                }}
              />
              {sample && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Örnek:</span>{" "}
                  <span className="font-mono text-amber-700 break-all">{sample.answers}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Soru Sayısı</Label>
              <Input
                type="number"
                value={profile.questionCount}
                onChange={(e) => {
                  setProfile((p: any) => ({ ...p, questionCount: clampInt(parseInt(e.target.value, 10), 1, 300) }));
                  markTouched(2);
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (datContent) parseDat(datContent);
                goToStep(3);
              }}
              disabled={!datContent}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Uygula & Devam
            </Button>
          </div>

          {students.length > 0 && (
            <Alert>
              <CheckCircle2 className="w-4 h-4" />
              <AlertTitle>Okundu</AlertTitle>
              <AlertDescription>
                {students.length} öğrenci bulundu. Kitapçık dağılımı:{" "}
                {(["A", "B", "C", "D"] as Booklet[])
                  .map((b) => `${b}:${students.filter((s) => s.booklet === b).length}`)
                  .join("  ")}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // --- Step 3: Answer keys (with derived preview + diff)
  function Step3_AnswerKeys() {
    const updateKey = (booklet: Booklet, text: string) => {
      setAnswerKeys((prev) =>
        prev.map((k) => (k.booklet === booklet ? { ...k, answers: cleanVal(text) } : k))
      );
      markTouched(3);
    };

    const canShowDerived = (booklet: Exclude<Booklet, "A">) => {
      return cleanVal(aKey).length === questionCount && !!mappingByBooklet.get(booklet);
    };

    const renderKeyPanel = (b: Booklet) => {
      const loaded = answerKeys.find((k) => k.booklet === b)?.answers || "";
      const derived = (b !== "A" ? derivedKeys[b] : undefined) || "";
      const showCompare = b !== "A" && canShowDerived(b as Exclude<Booklet, "A">);

      const diff = showCompare && cleanVal(loaded).length === questionCount
        ? diffKeys(loaded, derived)
        : null;

      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{b} Kitapçık Anahtarı</Label>
            <Textarea
              value={loaded}
              onChange={(e) => updateKey(b, e.target.value)}
              placeholder={`${b} anahtarını yapıştırın (A-E, *, #)...`}
              className="min-h-[120px] font-mono"
            />
            <div className="text-xs text-muted-foreground">
              Uzunluk: {cleanVal(loaded).length} / {questionCount}
            </div>
          </div>

          {showCompare && (
            <div className="space-y-2 rounded-xl border p-3 bg-muted/40">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Mapping’e göre oluşan {b} anahtarı</div>
                <Badge variant="secondary">{(derived || "").length}/{questionCount}</Badge>
              </div>
              <Textarea
                value={derived || ""}
                readOnly
                className="min-h-[120px] font-mono"
              />
              {diff && (
                <Alert variant={diff.mismatch === 0 ? "default" : "destructive"}>
                  {diff.mismatch === 0 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <AlertTitle>
                    {diff.mismatch === 0
                      ? "Yüklenen anahtar mapping ile birebir aynı"
                      : `Uyumsuzluk var: ${diff.match}/${questionCount} eşleşti`}
                  </AlertTitle>
                  {diff.mismatch !== 0 && (
                    <AlertDescription className="text-xs">
                      İlk farklar:{" "}
                      {diff.firstDiff.map((d, i) => (
                        <span key={i} className="font-mono">
                          #{d.idx}:{d.a}≠{d.b}{" "}
                        </span>
                      ))}
                    </AlertDescription>
                  )}
                </Alert>
              )}
              {!cleanVal(loaded) && (
                <div className="text-xs text-muted-foreground">
                  (İsterseniz B/C/D anahtarını hiç girmeyin — mapping ile otomatik üretilebilir.)
                </div>
              )}
            </div>
          )}

          {b !== "A" && !showCompare && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Not</AlertTitle>
              <AlertDescription className="text-sm">
                Bu kitapçık için mapping yoksa/eksikse, bu kitapçığın anahtarıyla değerlendirme yapılır.
                Mapping girerseniz sistem otomatik {b} anahtarını üretecek ve burada gösterecektir.
              </AlertDescription>
            </Alert>
          )}
        </div>
      );
    };

    const availableTabs: Booklet[] = profile.noBooklet ? ["A"] : ["A", "B", "C", "D"];

    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Cevap Anahtarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeKeyBooklet} onValueChange={(v) => setActiveKeyBooklet(v as Booklet)}>
            <TabsList className="w-full justify-start">
              {availableTabs.map((b) => (
                <TabsTrigger key={b} value={b}>
                  {b}
                </TabsTrigger>
              ))}
            </TabsList>

            {availableTabs.map((b) => (
              <TabsContent key={b} value={b} className="mt-4">
                {renderKeyPanel(b)}
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => goToStep(4)}
              disabled={cleanVal(aKey).length !== questionCount || questionCount === 0}
            >
              Devam (Mapping)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Step 4: Mapping
  function Step4_Mapping() {
    const apply = () => {
      markTouched(4);

      if (!usedNonA.length) {
        setMappings([]);
        return;
      }

      if (mappingMode === "table") {
        const parsed = parseMappingFromTableText(mappingPaste, questionCount);
        if (parsed.warnings.length) {
          // warnings shown in UI below
        }
        // sadece kullanılan kitapçıkları al (B/C/D)
        const filtered = parsed.mappings.filter((m) => usedNonA.includes(m.fromBooklet));
        setMappings(filtered);
      } else {
        const order = parseMappingFromListText(mappingPaste, questionCount);
        if (!order) return;
        setMappings((prev) => {
          const rest = prev.filter((m) => m.fromBooklet !== mappingBookletForList);
          return [
            ...rest,
            {
              fromBooklet: mappingBookletForList,
              order,
              source: "list",
            },
          ];
        });
      }
    };

    const tableParsePreview = useMemo(() => {
      if (mappingMode !== "table") return null;
      if (!mappingPaste.trim()) return null;
      return parseMappingFromTableText(mappingPaste, questionCount);
    }, [mappingMode, mappingPaste, questionCount]);

    const mappingSummary = useMemo(() => {
      const rows = (["B", "C", "D"] as const).map((b) => {
        const m = mappingByBooklet.get(b);
        return {
          b,
          ok: !!m && m.order.length === questionCount && isPermutation1toN(m.order, questionCount),
          source: m?.source || "-",
        };
      });
      return rows;
    }, [mappingByBooklet, questionCount]);

    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Kitapçık Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {usedNonA.length === 0 ? (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Mapping gerekmiyor</AlertTitle>
              <AlertDescription>
                Bu DAT içinde sadece A kitapçık var.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>Atlayabilirsiniz</AlertTitle>
              <AlertDescription className="text-sm">
                Mapping girmezseniz: <b>her kitapçık kendi anahtarıyla</b> puanlanır. <br />
                Mapping girerseniz: tüm kitapçıklar <b>A sırasına normalize</b> edilip tek analizde birleşir ve
                sistem B/C/D anahtarlarını otomatik üretip karşılaştırır.
              </AlertDescription>
            </Alert>
          )}

          {usedNonA.length > 0 && (
            <>
              <div className="flex flex-col md:flex-row gap-3 md:items-end">
                <div className="space-y-2">
                  <Label>Mapping Girişi</Label>
                  <Select value={mappingMode} onValueChange={(v) => setMappingMode(v as any)}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Excel tablo (A→B/C/D sıra)</SelectItem>
                      <SelectItem value="list">Sıra listesi (B sıra→A soru no)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mappingMode === "list" && (
                  <div className="space-y-2">
                    <Label>Hangi kitapçık?</Label>
                    <Select
                      value={mappingBookletForList}
                      onValueChange={(v) => setMappingBookletForList(v as any)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="B" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  {mappingMode === "table"
                    ? "Excel mapping tablosunu buraya yapıştırın"
                    : "B/C/D için sıra listesini (1..N permütasyon) yapıştırın"}
                </Label>
                <Textarea
                  value={mappingPaste}
                  onChange={(e) => {
                    setMappingPaste(e.target.value);
                    markTouched(4);
                  }}
                  className="min-h-[160px] font-mono"
                  placeholder={
                    mappingMode === "table"
                      ? "A anahtar  B kitapçık sıra  C kitapçık sıra  D kitapçık sıra  Soru No ..."
                      : "Örn: 5 1 2 3 4 ... (toplam N sayı)"
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={apply}>
                  Uygula
                </Button>
                <Button variant="outline" onClick={() => goToStep(5)}>
                  Devam
                </Button>
              </div>

              {tableParsePreview?.warnings?.length ? (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Mapping uyarısı</AlertTitle>
                  <AlertDescription className="text-sm">
                    {tableParsePreview.warnings.map((w, i) => (
                      <div key={i}>• {w}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="rounded-xl border p-3">
                <div className="font-semibold mb-2">Mapping Durumu</div>
                <div className="flex flex-wrap gap-2">
                  {mappingSummary.map((r) => (
                    <Badge key={r.b} variant={r.ok ? "default" : "secondary"}>
                      {r.b}: {r.ok ? "OK" : "Yok/Eksik"} ({r.source})
                    </Badge>
                  ))}
                </div>
                {!mappingCoverageComplete && usedNonA.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Mapping eksikse, global soru analizi (A’ya normalize) kısıtlı olur.
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // --- Step 5: Subjects (optional)
  function Step5_Subjects() {
    const addSubject = () => {
      setSubjects((prev) => [
        ...prev,
        { name: `Ders ${prev.length + 1}`, start: 1, end: questionCount },
      ]);
      markTouched(5);
    };

    const update = (idx: number, patch: Partial<Subject>) => {
      setSubjects((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
      markTouched(5);
    };

    const remove = (idx: number) => {
      setSubjects((prev) => prev.filter((_, i) => i !== idx));
      markTouched(5);
    };

    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Ders / Test Bölümleri (Opsiyonel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>Atlanabilir</AlertTitle>
            <AlertDescription>
              Ders/test bölümü girmediğinizde analiz “tek test” gibi çalışır.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {subjects.map((s, idx) => (
              <div key={idx} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Input
                    value={s.name}
                    onChange={(e) => update(idx, { name: e.target.value })}
                    className="max-w-[260px]"
                  />
                  <Button variant="ghost" onClick={() => remove(idx)}>
                    Sil
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Başlangıç</Label>
                    <Input
                      type="number"
                      value={s.start}
                      onChange={(e) => update(idx, { start: clampInt(parseInt(e.target.value, 10), 1, questionCount) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Bitiş</Label>
                    <Input
                      type="number"
                      value={s.end}
                      onChange={(e) => update(idx, { end: clampInt(parseInt(e.target.value, 10), 1, questionCount) })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={addSubject}>
              Ekle
            </Button>
            <Button variant="outline" onClick={() => goToStep(6)}>
              Devam
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Step 6: Scoring
  function Step6_Scoring() {
    const update = (patch: Partial<Scoring>) => {
      setScoring((prev) => ({ ...prev, ...patch }));
      markTouched(6);
    };

    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Puanlama</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>Varsayılanlar hazır</AlertTitle>
            <AlertDescription>
              Doğru=1, Yanlış=-0.25, Boş=0, Maks=100. Değiştirmek isterseniz buradan ayarlayın.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Doğru</Label>
              <Input
                type="number"
                value={scoring.correct}
                onChange={(e) => update({ correct: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Yanlış</Label>
              <Input
                type="number"
                value={scoring.wrong}
                onChange={(e) => update({ wrong: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Boş</Label>
              <Input
                type="number"
                value={scoring.blank}
                onChange={(e) => update({ blank: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maks Puan</Label>
              <Input
                type="number"
                value={scoring.maxScore}
                onChange={(e) => update({ maxScore: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => goToStep(7)}>
              Analize Geç
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Step 7: Analysis (Step7Analysis’i “boş çıkmasın” diye guard’lı bıraktım)
  function Step7_Analysis() {
    const aLen = cleanVal(aKey).length;

    if (!students.length) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Öğrenci yok</AlertTitle>
          <AlertDescription>Önce DAT yükleyin ve dizaynı ayarlayın.</AlertDescription>
        </Alert>
      );
    }

    if (aLen !== questionCount) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>A Anahtarı Eksik</AlertTitle>
          <AlertDescription>
            A anahtar uzunluğu {aLen}. Beklenen {questionCount}.
          </AlertDescription>
        </Alert>
      );
    }

    if (!canDoGlobalQuestionAnalysis) {
      return (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertTitle>Analiz Kısıtlı Mod</AlertTitle>
          <AlertDescription>
            Mapping eksik/bozuk olduğu için tüm kitapçıkları A sırasına normalize eden soru bazlı analiz kısıtlıdır.
            Puanlama yine yapılır (kitapçık anahtarlarıyla).
          </AlertDescription>
        </Alert>
      );
    }

    // Score distribution (NaN-safe)
    const ranges = [
      { label: "0–20", count: 0 },
      { label: "20–40", count: 0 },
      { label: "40–60", count: 0 },
      { label: "60–80", count: 0 },
      { label: "80–100", count: 0 },
    ];

    for (const r of results) {
      const s = Number.isFinite(r.score) ? r.score : 0;
      const idx = clampInt(Math.floor(s / 20), 0, 4);
      ranges[idx].count++;
    }

    const maxCount = Math.max(1, ...ranges.map((r) => r.count));
    const top = [...results].sort((a, b) => b.score - a.score).slice(0, 10);

    return (
      <div className="space-y-4">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Özet</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">Öğrenci</div>
              <div className="text-2xl font-semibold">{results.length}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">Soru</div>
              <div className="text-2xl font-semibold">{questionCount}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">Mapping</div>
              <div className="text-2xl font-semibold">
                {mappingCoverageComplete ? "OK" : "Eksik"}
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">Anahtar</div>
              <div className="text-2xl font-semibold">A</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Puan Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranges.map((r) => (
              <div key={r.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{r.label}</span>
                  <span className="text-muted-foreground">{r.count}</span>
                </div>
                <Progress value={(r.count / maxCount) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>En Yüksek 10</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {top.map((r) => (
              <div key={r.studentId} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.studentId} • {r.booklet} • Doğru:{r.correct} Yanlış:{r.wrong} Boş:{r.blank}
                  </div>
                </div>
                <Badge>{r.score.toFixed(2)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // CSV export (simple)
              const header = ["Ad Soyad", "No", "Kitapçık", "Doğru", "Yanlış", "Boş", "Net", "Puan"].join(";");
              const rows = results.map((r) =>
                [
                  r.name,
                  r.studentId,
                  r.booklet,
                  r.correct,
                  r.wrong,
                  r.blank,
                  r.net.toFixed(2).replace(".", ","),
                  r.score.toFixed(2).replace(".", ","),
                ].join(";")
              );
              const csv = ["sep=;", header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "Ogrenci_Sonuclari.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV indir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      {/* Üst progress bar (tamamlananlar en üstte) */}
      <Card className="rounded-2xl sticky top-2 z-10 backdrop-blur bg-card/95">
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-semibold">Aşamalar</span>{" "}
              <span className="text-muted-foreground">
                {stepMeta.done} • Atlandı: {stepMeta.skipped} • Toplam: {stepMeta.total}
              </span>
              {stepMeta.warning > 0 && (
                <span className="ml-2 text-xs text-red-600">
                  ({stepMeta.warning} dikkat)
                </span>
              )}
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => {
                const st = stepStatus(n);
                return (
                  <Button
                    key={n}
                    size="sm"
                    variant={activeStep === n ? "default" : st === "done" ? "secondary" : "outline"}
                    onClick={() => goToStep(n)}
                    className="h-8 px-2"
                  >
                    {n}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <StepContainer step={1}>
        <StepHeader step={1} title="DAT Yükleme" icon={<Upload className="w-4 h-4" />} />
        {activeStep === 1 && <div className="mt-4"><Step1_DAT /></div>}
      </StepContainer>

      <StepContainer step={2}>
        <StepHeader step={2} title="Dizayn Yönetimi" icon={<Settings2 className="w-4 h-4" />} />
        {activeStep === 2 && <div className="mt-4"><Step2_Profile /></div>}
      </StepContainer>

      <StepContainer step={3}>
        <StepHeader step={3} title="Cevap Anahtarları" icon={<BookOpen className="w-4 h-4" />} />
        {activeStep === 3 && <div className="mt-4"><Step3_AnswerKeys /></div>}
      </StepContainer>

      <StepContainer step={4}>
        <StepHeader step={4} title="Kitapçık Mapping" icon={<Wand2 className="w-4 h-4" />} />
        {activeStep === 4 && <div className="mt-4"><Step4_Mapping /></div>}
      </StepContainer>

      <StepContainer step={5}>
        <StepHeader step={5} title="Ders/Test Bölümleri" icon={<FileText className="w-4 h-4" />} />
        {activeStep === 5 && <div className="mt-4"><Step5_Subjects /></div>}
      </StepContainer>

      <StepContainer step={6}>
        <StepHeader step={6} title="Puanlama" icon={<Settings2 className="w-4 h-4" />} />
        {activeStep === 6 && <div className="mt-4"><Step6_Scoring /></div>}
      </StepContainer>

      <StepContainer step={7}>
        <StepHeader step={7} title="Analiz" icon={<CheckCircle2 className="w-4 h-4" />} />
        {activeStep === 7 && <div className="mt-4"><Step7_Analysis /></div>}
      </StepContainer>
    </div>
  );
}
