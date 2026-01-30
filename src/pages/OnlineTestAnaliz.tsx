// OnlineTestAnaliz.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Upload,
    FileSpreadsheet,
    FileText,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Download,
    Save,
    Sparkles,
    Trash2,
} from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/components/ui/utils";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

/**
 * ✅ ÖNEMLİ:
 * - Router/React.lazy kullanan sistemlerde "Minified React error #306" genelde
 *   "lazy import default export bulamadı" yüzünden olur.
 * - Bu dosyada hem named hem default export var.
 */

type Booklet = "A" | "B" | "C" | "D";

type StepStatus = "todo" | "done" | "skipped";

type FieldKey = "id" | "name" | "booklet" | "answers";

interface ProfileConfig {
    idStart: number;
    idLen: number;
    nameStart: number;
    nameLen: number;
    bookletPos: number; // 1-based index in line (0 => yok)
    answersStart: number;
    answersLen: number; // soru sayısı
    noBooklet: boolean;
}

interface Student {
    id: string;
    name: string;
    booklet: Booklet;
    answersRaw: string[]; // geldiği sıradaki cevaplar (kitapçık sırası)
}

interface MappingPack {
    // mapping[booklet][i] = A'daki soru numarası (1..N)
    // yani: kitapçıkta i. sıradaki soru = A'da mapping[booklet][i]. soru
    mapping: Partial<Record<Booklet, number[]>>;
    // tabloda A anahtar sütunu varsa, oradan okunan A harfleri (yan yana)
    tableAKey?: string;
    errors: string[];
    warnings: string[];
}

interface ScoringConfig {
    blankAsWrong: boolean;
    // yanlışın doğruları götürmesi (ör: 4 seçenek için 1/3; 5 seçenek için 1/4)
    wrongPenalty: number; // 0 => götürme yok
    totalScore: number; // 100 gibi
}

interface SubjectBlock {
    name: string;
    start: number; // 1-based
    end: number; // 1-based
}

const DEFAULT_PROFILE: ProfileConfig = {
    idStart: 21,
    idLen: 10,
    nameStart: 1,
    nameLen: 20,
    bookletPos: 31,
    answersStart: 32,
    answersLen: 95,
    noBooklet: false,
};

const DEFAULT_SCORING: ScoringConfig = {
    blankAsWrong: false,
    wrongPenalty: 0,
    totalScore: 100,
};

function clampInt(n: number, min: number, max: number) {
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
}

function onlyAnswerChars(s: string) {
    return (s || "")
        .toUpperCase()
        .replace(/\s+/g, "") // Dikey girişi (satır sonlarını) yanyana getirmek için tüm whitespace'leri sil
        .replace(/[^ABCDE#*X]/g, ""); // Sadece geçerli karakterleri tut
}

// DAT içinden cevaplar; boş/okunmayan işaretleri normalize edelim:
function normalizeAnswerChar(ch: string) {
    const c = (ch || "").toUpperCase();
    if (c === "*" || c === "#" || c === "X") return " "; // boş say
    if (["A", "B", "C", "D", "E"].includes(c)) return c;
    return " ";
}

function splitFixed(line: string, start1Based: number, len: number) {
    const s = clampInt(start1Based, 1, Math.max(1, line.length));
    const l = clampInt(len, 0, Math.max(0, line.length));
    return line.slice(s - 1, s - 1 + l);
}

function parseBookletChar(ch: string): Booklet {
    const c = (ch || "").toUpperCase();
    if (c === "B") return "B";
    if (c === "C") return "C";
    if (c === "D") return "D";
    return "A";
}

function validatePermutation(arr: number[], n: number) {
    const seen = new Set<number>();
    const missing: number[] = [];
    const dup: number[] = [];
    for (const v of arr) {
        if (!Number.isFinite(v) || v < 1 || v > n) return { ok: false, missing: [], dup: [], outOfRange: true };
        if (seen.has(v)) dup.push(v);
        seen.add(v);
    }
    for (let i = 1; i <= n; i++) if (!seen.has(i)) missing.push(i);
    return { ok: missing.length === 0 && dup.length === 0, missing, dup, outOfRange: false };
}

/**
 * Mapping TABLO parser:
 * Beklenen Excel kopyala-yapıştır formatı:
 *  A anahtar | B kitapçık sıra | C kitapçık sıra | D kitapçık sıra | Soru No
 *  E         | 12             | 8               | 16              | 1
 *  ...
 *
 * Buradaki kritik yorum:
 *  - mapping[B][i] = B kitapçıkta i. sıradaki sorunun A'daki karşılığı (A soru no)
 *  - B anahtarı otomatik üretimi: Bkey[i] = Akey[mapping[B][i]]
 *
 * (Bu, senin verdiğin tablo + anahtarlarla birebir uyumlu olan yön.)
 */
function parseMappingList(text: string): number[] {
    return (text || "")
        .split(/[\s,;]+/)
        .map(x => parseInt(x))
        .filter(x => !isNaN(x));
}

function parseMappingTable(bText: string, cText: string, dText: string): MappingPack {
    const errors: string[] = [];
    const warnings: string[] = [];

    const mapB = parseMappingList(bText);
    const mapC = parseMappingList(cText);
    const mapD = parseMappingList(dText);

    return {
        mapping: { B: mapB, C: mapC, D: mapD },
        errors,
        warnings,
    };
}

function deriveBookletKeyFromA(aKey: string, toA: number[]) {
    const A = aKey || "";
    return toA
        .map((aNo) => {
            const idx = Number(aNo) - 1;
            if (!Number.isFinite(idx) || idx < 0 || idx >= A.length) return " ";
            return A[idx] || " ";
        })
        .join("");
}

function answersToAOrder(answersInBookletOrder: string[], toA: number[], n: number) {
    const out = new Array(n).fill(" ");
    for (let i = 0; i < Math.min(answersInBookletOrder.length, toA.length); i++) {
        const aNo = toA[i];
        const aIdx = Number(aNo) - 1;
        if (!Number.isFinite(aIdx) || aIdx < 0 || aIdx >= n) continue;
        out[aIdx] = answersInBookletOrder[i] ?? " ";
    }
    return out;
}

function scoreOne(
    studentAnswersAOrder: string[],
    aKey: string[],
    scoring: ScoringConfig
) {
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    for (let i = 0; i < aKey.length; i++) {
        const s = normalizeAnswerChar(studentAnswersAOrder[i] || " ");
        const k = normalizeAnswerChar(aKey[i] || " ");
        if (s === " ") {
            blank++;
            if (scoring.blankAsWrong) wrong++;
        } else if (s === k) {
            correct++;
        } else {
            wrong++;
        }
    }

    const net = correct - wrong * scoring.wrongPenalty;
    const totalQ = aKey.length || 1;
    const score = (net / totalQ) * scoring.totalScore;

    return { correct, wrong, blank, net, score };
}

function overlap(aStart: number, aLen: number, bStart: number, bLen: number) {
    const a0 = aStart;
    const a1 = aStart + Math.max(0, aLen) - 1;
    const b0 = bStart;
    const b1 = bStart + Math.max(0, bLen) - 1;
    if (aLen <= 0 || bLen <= 0) return false;
    return !(a1 < b0 || b1 < a0);
}

function formatPct(n: number) {
    if (!Number.isFinite(n)) return "0%";
    return `${n.toFixed(2)}%`.replace(".", ",");
}

function safeMean(xs: number[]) {
    const v = xs.filter((x) => Number.isFinite(x));
    if (!v.length) return 0;
    return v.reduce((a, b) => a + b, 0) / v.length;
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}



function commentFor(p: number, disc: number) {
    // p: difficulty (doğru oranı)
    // disc: discrimination
    const zorluk = p >= 0.85 ? "Çok kolay" : p >= 0.65 ? "Kolay" : p >= 0.35 ? "Orta" : "Zor";
    let ayir = "";
    if (disc >= 0.4) ayir = "Ayırıcılığı çok iyi.";
    else if (disc >= 0.2) ayir = "Ayırıcılığı oldukça iyi.";
    else if (disc >= 0.1) ayir = "Ayırıcılığı çok zayıf.";
    else ayir = "Ayırıcılığı çok zayıf.";

    let extra = "";
    if (zorluk === "Çok kolay" && disc < 0.1) extra = " Eğer etkili bir öğretim varsa tercih edilir.";
    if (zorluk === "Zor" && disc < 0.1) extra = " Zor ve ayırt edici özelliği olmayan bu soruyu kullanmayın.";
    if (disc < 0) extra = " Ayırıcılığı negatif: anahtar/mapping hatası veya soru problemi olabilir.";

    return `${zorluk}. ${ayir}${extra}`;
}

function StepPill({
    label,
    status,
    onClick,
}: {
    label: string;
    status: StepStatus;
    onClick?: () => void;
}) {
    const styles =
        status === "done"
            ? "bg-emerald-100 text-emerald-900 border-emerald-200"
            : status === "skipped"
                ? "bg-slate-100 text-slate-700 border-slate-200"
                : "bg-amber-100 text-amber-900 border-amber-200";
    const icon =
        status === "done" ? (
            <CheckCircle2 className="h-4 w-4" />
        ) : status === "skipped" ? (
            <XCircle className="h-4 w-4" />
        ) : (
            <AlertTriangle className="h-4 w-4" />
        );

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:opacity-90 transition",
                styles
            )}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function HintRow({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="flex gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
            <div>
                <div className="font-medium">{title}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
            </div>
        </div>
    );
}

function MappingMiniAnimation() {
    return (
        <div className="mt-4 rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="rounded-lg border px-3 py-2 text-sm">
                    <div className="font-medium">A anahtar</div>
                    <div className="font-mono text-muted-foreground">E A C C A ...</div>
                </div>

                <ArrowRight className="h-5 w-5 text-muted-foreground" />

                <div className="rounded-lg border px-3 py-2 text-sm">
                    <div className="font-medium">Mapping</div>
                    <div className="font-mono text-muted-foreground">B satır: 12, 13, 14...</div>
                </div>

                <ArrowRight className="h-5 w-5 text-muted-foreground" />

                <div className="rounded-lg border px-3 py-2 text-sm">
                    <div className="font-medium">B/C/D anahtarları</div>
                    <div className="font-mono text-muted-foreground">C A B D A ...</div>
                </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
                Mantık: <span className="font-mono">BKey[i] = AKey[ mappingB[i] ]</span> (tablodaki B sütunu A soru numarasını gösterir)
            </div>
        </div>
    );
}

function KeyComparisonTable({
    aKey,
    mapping,
    derived,
    manual,
}: {
    aKey: string,
    mapping: Partial<Record<Booklet, number[]>>,
    derived: Partial<Record<Booklet, string>>,
    manual: Partial<Record<Booklet, string>>,
}) {
    const n = aKey.length;
    if (n === 0) return null;

    return (
        <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-xs text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b">
                        <th className="p-2 border-r font-medium w-12 sticky left-0 bg-slate-50 z-10">Soru</th>
                        <th className="p-2 border-r font-medium text-emerald-700 bg-emerald-50/50">A Key</th>
                        {["B", "C", "D"].map((b) => (
                            <React.Fragment key={b}>
                                <th className="p-2 border-r font-medium bg-slate-50/50 border-l-2 border-l-slate-200">{b} Sıra</th>
                                <th className="p-2 border-r font-medium bg-amber-50/30 text-amber-800">{b} Otomatik</th>
                                {(manual.B || manual.C || manual.D) && (
                                    <th className="p-2 font-medium bg-blue-50/30 text-blue-800">{b} Manuel</th>
                                )}
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: n }).map((_, i) => {
                        const qNo = i + 1;
                        return (
                            <tr key={i} className="border-b hover:bg-slate-50/30">
                                <td className="p-2 border-r text-muted-foreground sticky left-0 bg-white z-10">{qNo}</td>
                                <td className="p-2 border-r font-mono font-bold text-emerald-700 bg-emerald-50/20">{aKey[i] || "-"}</td>
                                {(["B", "C", "D"] as Booklet[]).map((b) => {
                                    // A'daki qNo, B kitapçığının kaçıncı sorusu?
                                    const bookletIdx = mapping[b]?.indexOf(qNo) ?? -1;
                                    const derivedKey = derived[b]?.[bookletIdx];
                                    const manualKey = manual[b]?.[bookletIdx];

                                    const showManual = (manual.B || manual.C || manual.D);

                                    // Mismatch highlight check
                                    // Sadece her ikisi de varsa ve farklıysa uyar
                                    const mismatch = derivedKey && manualKey && derivedKey !== manualKey && derivedKey !== " " && manualKey !== " ";

                                    // Derived boşsa tire koy
                                    const dVal = derivedKey || "-";
                                    // Manuel boşsa tire
                                    const mVal = manualKey || "-";

                                    return (
                                        <React.Fragment key={b}>
                                            <td className="p-2 border-r text-muted-foreground border-l-2 border-l-slate-100">
                                                {bookletIdx === -1 ? "-" : bookletIdx + 1}
                                            </td>
                                            <td className={cn(
                                                "p-2 border-r font-mono",
                                                mismatch ? "bg-red-50 text-red-600 font-bold" : "text-amber-900 bg-amber-50/10"
                                            )}>
                                                {dVal}
                                            </td>
                                            {showManual && (
                                                <td className={cn(
                                                    "p-2 font-mono",
                                                    mismatch ? "bg-red-50 text-red-600 font-bold" : "text-blue-900 bg-blue-50/10"
                                                )}>
                                                    {mVal}
                                                </td>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function OnlineTestAnaliz() {
    // --- state ---
    const [datContent, setDatContent] = useState<string>("");
    const [profile, setProfile] = useState<ProfileConfig>(() => {
        const saved = localStorage.getItem("ota_profile_v3");
        if (!saved) return DEFAULT_PROFILE;
        try {
            return { ...DEFAULT_PROFILE, ...(JSON.parse(saved) as Partial<ProfileConfig>) };
        } catch {
            return DEFAULT_PROFILE;
        }
    });

    const [students, setStudents] = useState<Student[]>([]);
    const [firstLine, setFirstLine] = useState<string>("");

    const [aKeyText, setAKeyText] = useState<string>(() => localStorage.getItem("ota_akey_v3") || "");
    const [bKeyText, setBKeyText] = useState<string>(() => localStorage.getItem("ota_bkey_v3") || "");
    const [cKeyText, setCKeyText] = useState<string>(() => localStorage.getItem("ota_ckey_v3") || "");
    const [dKeyText, setDKeyText] = useState<string>(() => localStorage.getItem("ota_dkey_v3") || "");

    const [bMappingText, setBMappingText] = useState<string>(() => localStorage.getItem("ota_bmapping_v3") || "");
    const [cMappingText, setCMappingText] = useState<string>(() => localStorage.getItem("ota_cmapping_v3") || "");
    const [dMappingText, setDMappingText] = useState<string>(() => localStorage.getItem("ota_dmapping_v3") || "");
    const [subjects, setSubjects] = useState<SubjectBlock[]>(() => {
        const saved = localStorage.getItem("ota_subjects_v3");
        if (!saved) return [];
        try {
            return JSON.parse(saved) as SubjectBlock[];
        } catch {
            return [];
        }
    });

    const [scoring, setScoring] = useState<ScoringConfig>(() => {
        const saved = localStorage.getItem("ota_scoring_v3");
        if (!saved) return DEFAULT_SCORING;
        try {
            return { ...DEFAULT_SCORING, ...(JSON.parse(saved) as Partial<ScoringConfig>) };
        } catch {
            return DEFAULT_SCORING;
        }
    });

    const [currentStep, setCurrentStep] = useState<number>(1);
    const headerRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const resetExam = () => {
        if (!window.confirm("Tüm veri ve ayarlar sıfırlanacak. Emin misiniz?")) return;
        setDatContent("");
        setAKeyText("");
        setBKeyText("");
        setCKeyText("");
        setDKeyText("");
        setBMappingText("");
        setCMappingText("");
        setDMappingText("");
        setSubjects([]);
        setScoring({
            wrongPenalty: 0,
            totalScore: 100,
            blankAsWrong: false,
        });
        setProfile(DEFAULT_PROFILE);
        setCurrentStep(1);
    };

    const saveDesign = () => {
        localStorage.setItem("ota_pinned_design", JSON.stringify(profile));
        alert("Karakter yerleşimi tarayıcıya kaydedildi.");
    };

    const loadDesign = () => {
        const saved = localStorage.getItem("ota_pinned_design");
        if (saved) {
            try {
                setProfile(JSON.parse(saved));
            } catch (e) {
                console.error("Design load error", e);
            }
        } else {
            alert("Kaydedilmiş dizayn bulunamadı.");
        }
    };

    // --- persist ---
    useEffect(() => {
        localStorage.setItem("ota_profile_v3", JSON.stringify(profile));
    }, [profile]);

    useEffect(() => {
        localStorage.setItem("ota_akey_v3", aKeyText);
        localStorage.setItem("ota_bkey_v3", bKeyText);
        localStorage.setItem("ota_ckey_v3", cKeyText);
        localStorage.setItem("ota_dkey_v3", dKeyText);
    }, [aKeyText, bKeyText, cKeyText, dKeyText]);

    useEffect(() => {
        localStorage.setItem("ota_bmapping_v3", bMappingText);
        localStorage.setItem("ota_cmapping_v3", cMappingText);
        localStorage.setItem("ota_dmapping_v3", dMappingText);
    }, [bMappingText, cMappingText, dMappingText]);

    useEffect(() => {
        localStorage.setItem("ota_subjects_v3", JSON.stringify(subjects));
    }, [subjects]);

    useEffect(() => {
        localStorage.setItem("ota_scoring_v3", JSON.stringify(scoring));
    }, [scoring]);

    // --- parse DAT ---
    useEffect(() => {
        const content = (datContent || "").trim();
        if (!content) {
            setStudents([]);
            setFirstLine("");
            return;
        }

        const lines = content
            .split(/\r?\n/)
            .map((l) => l.replace(/\r/g, ""))
            .filter((l) => l.trim().length > 0);

        setFirstLine(lines[0] || "");

        const parsed: Student[] = [];

        for (const line of lines) {
            const id = splitFixed(line, profile.idStart, profile.idLen).trim();
            const name = splitFixed(line, profile.nameStart, profile.nameLen).trim();

            const booklet =
                profile.noBooklet || profile.bookletPos <= 0
                    ? "A"
                    : parseBookletChar(line.charAt(profile.bookletPos - 1));

            const answersRawStr = splitFixed(line, profile.answersStart, profile.answersLen);
            const answersRaw = answersRawStr.split("").map(normalizeAnswerChar);

            if (!id && !name) continue;

            parsed.push({
                id: id || "(id yok)",
                name: name || "(isim yok)",
                booklet,
                answersRaw,
            });
        }

        setStudents(parsed);
    }, [datContent, profile]);

    // --- normalized keys ---
    const aKey = useMemo(() => onlyAnswerChars(aKeyText), [aKeyText]);
    const bKey = useMemo(() => onlyAnswerChars(bKeyText), [bKeyText]);
    const cKey = useMemo(() => onlyAnswerChars(cKeyText), [cKeyText]);
    const dKey = useMemo(() => onlyAnswerChars(dKeyText), [dKeyText]);

    // --- mapping parsed ---
    const mappingPack = useMemo(() => {
        return parseMappingTable(bMappingText, cMappingText, dMappingText);
    }, [bMappingText, cMappingText, dMappingText]);

    const questionCount = useMemo(() => {
        // soru sayısını en güvenli şekilde A anahtardan alalım
        if (aKey.length > 0) return aKey.length;
        // yoksa profile.answersLen
        return profile.answersLen || 0;
    }, [aKey.length, profile.answersLen]);

    // --- derived booklet keys from A + mapping ---
    const derivedKeys = useMemo(() => {
        const out: Partial<Record<Booklet, string>> = {};
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!aKey || aKey.length < 5) {
            return { out, errors, warnings };
        }

        const mB = mappingPack.mapping.B;
        const mC = mappingPack.mapping.C;
        const mD = mappingPack.mapping.D;

        const n = aKey.length;

        if (mB && mB.length >= n) out.B = deriveBookletKeyFromA(aKey, mB.slice(0, n));
        if (mC && mC.length >= n) out.C = deriveBookletKeyFromA(aKey, mC.slice(0, n));
        if (mD && mD.length >= n) out.D = deriveBookletKeyFromA(aKey, mD.slice(0, n));

        // permütasyon kontrolü
        if (mB && mB.length >= n) {
            const v = validatePermutation(mB.slice(0, n), n);
            if (!v.ok) warnings.push("B mapping 1..N permütasyonu değil (eksik/tekrar/out-of-range olabilir).");
        }
        if (mC && mC.length >= n) {
            const v = validatePermutation(mC.slice(0, n), n);
            if (!v.ok) warnings.push("C mapping 1..N permütasyonu değil (eksik/tekrar/out-of-range olabilir).");
        }
        if (mD && mD.length >= n) {
            const v = validatePermutation(mD.slice(0, n), n);
            if (!v.ok) warnings.push("D mapping 1..N permütasyonu değil (eksik/tekrar/out-of-range olabilir).");
        }

        // tablo A anahtar kontrolü
        if (mappingPack.tableAKey && mappingPack.tableAKey.length >= 5) {
            const len = Math.min(n, mappingPack.tableAKey.length);
            const tableA = mappingPack.tableAKey.slice(0, len);
            const refA = aKey.slice(0, len);
            if (tableA !== refA) {
                errors.push("Mapping tablosundaki A anahtar harfleri ile girilen A anahtar uyuşmuyor. Tablo başka sınava ait kısımlar içeriyor olabilir.");
            }
        }

        return { out, errors, warnings };
    }, [aKey, mappingPack.mapping, mappingPack.tableAKey]);

    // --- detect if mapping needed ---
    const bookletsUsed = useMemo(() => {
        const s = new Set<Booklet>();
        for (const st of students) s.add(st.booklet);
        return Array.from(s);
    }, [students]);

    const mappingNeeded = useMemo(() => {
        // kitapçık yoksa mapping gereksiz
        if (profile.noBooklet || profile.bookletPos <= 0) return false;
        // sadece A varsa mapping gereksiz
        const used = new Set(bookletsUsed);
        used.delete("A");
        return used.size > 0;
    }, [profile.noBooklet, profile.bookletPos, bookletsUsed]);

    // --- results calculation ---
    const results = useMemo(() => {
        const n = questionCount;
        if (!students.length || !aKey || aKey.length < 5 || n < 5) {
            return {
                scored: [] as Array<
                    Student & { correct: number; wrong: number; blank: number; net: number; score: number; answersA: string[]; excludedReason?: string }
                >,
                excluded: [] as Array<{ student: Student; reason: string }>,
            };
        }

        const aKeyArr = aKey.slice(0, n).split("");

        const scored: Array<
            Student & { correct: number; wrong: number; blank: number; net: number; score: number; answersA: string[]; excludedReason?: string }
        > = [];
        const excluded: Array<{ student: Student; reason: string }> = [];

        for (const st of students) {
            // öğrencinin cevapları A düzenine çevrilecek
            let answersA: string[] = [];

            if (st.booklet === "A" || !mappingNeeded) {
                answersA = (st.answersRaw || []).slice(0, n);
            } else {
                const toA = mappingPack.mapping[st.booklet];
                if (toA && toA.length > 0) {
                    // Case 1: Mapping table is available
                    answersA = answersToAOrder(st.answersRaw || [], toA, n);
                } else {
                    // Case 2: Mapping missing, check for manual key fallback
                    const manualKey = st.booklet === "B" ? bKey : st.booklet === "C" ? cKey : st.booklet === "D" ? dKey : "";
                    if (manualKey && manualKey.length >= 5) {
                        // Directly score against the manual key
                        const studAnswers = (st.answersRaw || []).slice(0, n);
                        const manualKeyArr = manualKey.slice(0, n).split("");
                        const s = scoreOne(studAnswers, manualKeyArr, scoring);
                        scored.push({
                            ...st,
                            answersA: studAnswers, // Not actually A-order, but used for scoring display
                            correct: s.correct,
                            wrong: s.wrong,
                            blank: s.blank,
                            net: round2(s.net),
                            score: round2(s.score),
                            excludedReason: "Mapping yok, manuel anahtara göre hesaplandı."
                        });
                        continue;
                    } else {
                        excluded.push({ student: st, reason: `${st.booklet} mapping tablosu veya manuel anahtar bulunamadı.` });
                        continue;
                    }
                }
            }

            const s = scoreOne(answersA, aKeyArr, scoring);

            scored.push({
                ...st,
                answersA,
                correct: s.correct,
                wrong: s.wrong,
                blank: s.blank,
                net: round2(s.net),
                score: round2(s.score),
            });
        }

        return { scored, excluded };
    }, [students, aKey, questionCount, scoring, mappingNeeded, mappingPack.mapping]);

    // --- Step7Analysis: madde analizi ---
    const analysis = useMemo(() => {
        const n = questionCount;
        const scored = results.scored;
        if (!n || !aKey || aKey.length < n || scored.length === 0) {
            return { questionRows: [], scoreHist: [] as Array<{ range: string; count: number }> };
        }

        const aKeyArr = aKey.slice(0, n).split("");

        // histogram
        const bins = [
            { min: 0, max: 20, label: "0-20" },
            { min: 20, max: 40, label: "20-40" },
            { min: 40, max: 60, label: "40-60" },
            { min: 60, max: 70, label: "60-70" },
            { min: 70, max: 80, label: "70-80" },
            { min: 80, max: 90, label: "80-90" },
            { min: 90, max: 100.0001, label: "90-100" },
        ];

        const scoreHist = bins.map((b) => ({
            range: b.label,
            count: scored.filter((x) => x.score >= b.min && x.score < b.max).length,
        }));

        // madde istatistikleri için üst/alt %27 grupları belirle
        const scoreIndices = scored
            .map((s, i) => ({ s: s.score, i }))
            .sort((a, b) => b.s - a.s); // puan azalan

        const totalStudents = scored.length;
        // Eğer öğrenci sayısı az ise (örn < 10) bu yöntem sapıtabilir ama yine de %27 mantığı:
        const groupSize = Math.max(1, Math.round(totalStudents * 0.27));

        const topIndices = new Set(scoreIndices.slice(0, groupSize).map(x => x.i));
        // Alt grup sondan groupSize kadar
        const botIndices = new Set(scoreIndices.slice(totalStudents - groupSize).map(x => x.i));

        const questionRows = Array.from({ length: n }).map((_, qi) => {
            const correctAnswer = aKeyArr[qi];

            const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, blank: 0 };

            let correctTop = 0;
            let correctBot = 0;

            scored.forEach((st, i) => {
                const ans = normalizeAnswerChar(st.answersA[qi] || " ");

                // Dağılım sayımı
                if (ans === " ") dist.blank++;
                else dist[ans] = (dist[ans] || 0) + 1;

                const isCorrect = ans === correctAnswer;

                // Üst/Alt grup doğru sayıları
                if (topIndices.has(i) && isCorrect) correctTop++;
                if (botIndices.has(i) && isCorrect) correctBot++;
            });

            const total = scored.length || 1;
            const p = dist[correctAnswer] / total; // Genel doğru oranı ( klasik p)

            // Kullanıcı isteği Zorluk: ((üst + alt) / (2 * grupSayisi)) * 100
            // Not: grupSayisi dediğimiz groupSize (tek grubun mevcudu). İkisinin toplamı 2*groupSize.
            const diffFormula = ((correctTop + correctBot) / (2 * groupSize)) * 100; // 0..100 ölçeğinde
            // Ancak UI genelde 0..1 bekliyor olabilir mi? Hayır, formülde *100 var. 
            // round2 ile gösterirken 0.55 yerine 55.00 yazacak. Puan gibi.

            // Ayırıcılık: (üst - alt) / grupSayisi
            // -1..+1 arası çıkar.
            const discFormula = (correctTop - correctBot) / groupSize;

            return {
                soru: qi + 1,
                A: dist.A,
                B: dist.B,
                C: dist.C,
                D: dist.D,
                E: dist.E,
                Bos: dist.blank,
                dogru: correctAnswer,
                dogruPct: p, // Bu "Doğru %" sütunu için, genel başarı
                ayiricilik: round2(discFormula),
                // Kullanıcı isteğine göre zorluk 0..100 arası olmalı
                zorluk: round2(diffFormula),
                yorum: commentFor(diffFormula / 100, discFormula),
            };
        });

        return { questionRows, scoreHist };
    }, [results.scored, questionCount, aKey]);

    // --- overlaps in Design step ---
    const designOverlaps = useMemo(() => {
        const p = profile;
        const problems: string[] = [];

        const fields: Array<{ key: FieldKey; start: number; len: number; label: string }> = [
            { key: "id", start: p.idStart, len: p.idLen, label: "No" },
            { key: "name", start: p.nameStart, len: p.nameLen, label: "İsim" },
            { key: "answers", start: p.answersStart, len: p.answersLen, label: "Cevaplar" },
        ];

        if (!p.noBooklet && p.bookletPos > 0) {
            // booklet tek char alan
            fields.push({ key: "booklet", start: p.bookletPos, len: 1, label: "Kitapçık" });
        }

        for (let i = 0; i < fields.length; i++) {
            for (let j = i + 1; j < fields.length; j++) {
                const a = fields[i];
                const b = fields[j];
                if (overlap(a.start, a.len, b.start, b.len)) {
                    problems.push(`"${a.label}" ile "${b.label}" alanları çakışıyor.`);
                }
            }
        }

        return problems;
    }, [profile]);

    // --- Step logic ---
    const steps = useMemo(
        () => [
            { id: 1, title: "Dosya Yükleme", desc: "DAT/CSV içeriğini yükleyin." },
            { id: 2, title: "Dizayn Yönetimi", desc: "Alanların karakter aralıklarını ayarlayın." },
            { id: 3, title: "Cevap Anahtarı", desc: "A anahtarını girin (zorunlu). İsterseniz B/C/D de yapıştırın." },
            { id: 4, title: "Mapping (Opsiyonel)", desc: "Birden fazla kitapçık varsa mapping tablosunu yapıştırın." },
            { id: 5, title: "Ders / Bölümleme (Opsiyonel)", desc: "Soru aralıklarını derslere ayırın." },
            { id: 6, title: "Puanlama (Opsiyonel)", desc: "Yanlış götürme / toplam puan ayarı." },
            { id: 7, title: "Sonuçlar & Analiz", desc: "Öğrenci sonuçları ve madde analizi." },
        ],
        []
    );

    function getStepStatus(id: number): StepStatus {
        const n = questionCount;

        if (id === 1) return datContent.trim() ? "done" : "todo";

        if (id === 2) {
            // Dosya yoksa bu adım atlanabilir, ama "done" demeyelim.
            if (!datContent.trim()) return "todo";
            // Çakışma yoksa "done" sayabiliriz.
            return designOverlaps.length === 0 ? "done" : "todo";
        }

        if (id === 3) {
            return aKey.length >= 5 ? "done" : "todo";
        }

        if (id === 4) {
            if (!mappingNeeded) return "skipped";
            if (!bMappingText.trim() && !cMappingText.trim() && !dMappingText.trim()) return "todo";
            if (derivedKeys.errors.length) return "todo";
            // B/C/D mapping uzunluğu ve permütasyon kontrolü
            const need = new Set(bookletsUsed);
            need.delete("A");
            let ok = true;
            for (const b of Array.from(need)) {
                const m = mappingPack.mapping[b];
                if (!m || m.length < n) ok = false;
                else {
                    const v = validatePermutation(m.slice(0, n), n);
                    if (!v.ok) ok = false;
                }
            }
            return ok ? "done" : "todo";
        }

        if (id === 5) {
            // hiç ders eklenmediyse "todo" ama opsiyonel
            return subjects.length ? "done" : "skipped";
        }

        if (id === 6) {
            // scoring her zaman var ama kullanıcı değiştirmedi ise "skipped" gibi gösterebiliriz
            const isDefault = JSON.stringify(scoring) === JSON.stringify(DEFAULT_SCORING);
            return isDefault ? "skipped" : "done";
        }

        if (id === 7) {
            if (!students.length) return "todo";
            if (aKey.length < 5) return "todo";
            // mapping gerekiyorsa ve eksikse todo
            if (mappingNeeded && getStepStatus(4) !== "done") return "todo";
            return "done";
        }

        return "todo";
    }

    const stepSummary = useMemo(() => {
        const s = steps.map((x) => getStepStatus(x.id));
        const done = s.filter((x) => x === "done").length;
        const skipped = s.filter((x) => x === "skipped").length;
        return { done, skipped, total: steps.length };
    }, [steps, datContent, profile, aKey, mappingNeeded, bMappingText, cMappingText, dMappingText, subjects, scoring, students, derivedKeys.errors.length, bookletsUsed, questionCount]);

    function openStep(id: number) {
        setCurrentStep(id);
        // kontrollü scroll - animasyonun bitmesini (300ms) bekle
        setTimeout(() => {
            const el = headerRefs.current[id];
            if (!el) return;
            // Sticky header payı + biraz boşluk (90px)
            const y = el.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        }, 300);
    }

    // --- file upload ---
    async function handleFile(file: File) {
        const text = await file.text();
        setDatContent(text);
        openStep(2);
    }

    // --- helpers for preview in design step ---
    const designPreview = useMemo(() => {
        const line = firstLine || "";
        if (!line) return null;

        const p = profile;
        const id = splitFixed(line, p.idStart, p.idLen);
        const name = splitFixed(line, p.nameStart, p.nameLen);
        const booklet = p.noBooklet || p.bookletPos <= 0 ? "" : line.charAt(p.bookletPos - 1);
        const answers = splitFixed(line, p.answersStart, p.answersLen);

        return { id, name, booklet, answers, line };
    }, [firstLine, profile]);

    // --- compare derived keys with uploaded B/C/D keys (optional) ---
    function keyDiffCount(a: string, b: string) {
        const n = Math.min(a.length, b.length);
        let diff = 0;
        for (let i = 0; i < n; i++) if ((a[i] || " ") !== (b[i] || " ")) diff++;
        diff += Math.abs(a.length - b.length);
        return diff;
    }

    // --- export CSV ---
    function downloadCsv(filename: string, rows: string[][]) {
        const csv = rows
            .map((r) =>
                r
                    .map((cell) => {
                        const s = String(cell ?? "");
                        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
                            return `"${s.replace(/"/g, '""')}"`;
                        }
                        return s;
                    })
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // --- UI ---
    return (
        <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
            {/* Sticky progress bar */}
            <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-white/80 backdrop-blur border-b">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                            <span className="font-medium">
                                Tamamlandı: {stepSummary.done}
                            </span>{" "}
                            • Atlandı: {stepSummary.skipped} • Toplam: {stepSummary.total}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={resetExam}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Sınavı Sıfırla
                        </Button>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {steps.map((s) => (
                            <StepPill
                                key={s.id}
                                label={`${s.id}`}
                                status={getStepStatus(s.id)}
                                onClick={() => openStep(s.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {steps.map((step) => {
                    const status = getStepStatus(step.id);
                    const isOpen = currentStep === step.id;

                    return (
                        <Card key={step.id} className="overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30 shadow-sm hover:shadow-md transition-shadow">
                            <div
                                ref={(el) => {
                                    headerRefs.current[step.id] = el;
                                }}
                                className="px-6 py-4 flex items-start justify-between gap-3 cursor-pointer select-none"
                                onClick={() => setCurrentStep(isOpen ? 0 : step.id)}
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-lg font-semibold">{step.id}. {step.title}</div>
                                        {status === "done" && <Badge className="bg-emerald-600">Tamamlandı</Badge>}
                                        {status === "skipped" && <Badge variant="secondary">Atlandı</Badge>}
                                        {status === "todo" && <Badge className="bg-amber-600">Eksik</Badge>}
                                    </div>
                                    <div className="text-sm text-muted-foreground">{step.desc}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(isOpen ? 0 : step.id)}>
                                    {isOpen ? "Kapat" : "Aç"}
                                </Button>
                            </div>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="px-6 pb-6"
                                    >
                                        <Separator className="mb-6" />

                                        {/* Step 1 */}
                                        {step.id === 1 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer">
                                                        <Upload className="h-4 w-4" />
                                                        <span className="text-sm font-medium">DAT/CSV seç</span>
                                                        <input
                                                            type="file"
                                                            accept=".dat,.csv,.txt"
                                                            className="hidden"
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                const f = e.target.files?.[0];
                                                                if (f) handleFile(f);
                                                            }}
                                                        />
                                                    </label>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setDatContent("");
                                                            setStudents([]);
                                                            setFirstLine("");
                                                        }}
                                                    >
                                                        Temizle
                                                    </Button>
                                                </div>

                                                <Textarea
                                                    value={datContent}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDatContent(e.target.value)}
                                                    placeholder="İsterseniz dosya içeriğini buraya yapıştırabilirsiniz..."
                                                    className="min-h-[180px] font-mono text-xs"
                                                />

                                                {students.length > 0 && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Okunan satır: <span className="font-medium">{students.length}</span> •
                                                        Kitapçıklar:{" "}
                                                        <span className="font-medium">{bookletsUsed.join(", ")}</span>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Button onClick={() => openStep(2)} disabled={!datContent.trim()}>
                                                        Devam
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 2 */}
                                        {step.id === 2 && (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                                    <div>
                                                        <div className="font-medium">Karakter Yerleşimi</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Alanları ayarlayın. Çakışma olursa uyarı verir.
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={profile.noBooklet}
                                                            onCheckedChange={(v: boolean) =>
                                                                setProfile((p) => ({ ...p, noBooklet: v, bookletPos: v ? 0 : p.bookletPos }))
                                                            }
                                                        />
                                                        <Label>Kitapçık bilgisi yok</Label>
                                                    </div>
                                                </div>

                                                {designOverlaps.length > 0 && (
                                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                                        <div className="flex items-center gap-2 font-medium">
                                                            <AlertTriangle className="h-4 w-4" /> Alan çakışması
                                                        </div>
                                                        <ul className="mt-2 list-disc pl-5 text-sm">
                                                            {designOverlaps.map((x, i) => (
                                                                <li key={i}>{x}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* No */}
                                                    <Card className="border">
                                                        <CardHeader>
                                                            <CardTitle className="text-base">No</CardTitle>
                                                            <CardDescription>Başlangıç (1-based) ve uzunluk</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <Label>Başlangıç</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={profile.idStart}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                            setProfile((p) => ({ ...p, idStart: clampInt(Number(e.target.value), 1, 9999) }))
                                                                        }
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Uzunluk</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={profile.idLen}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                            setProfile((p) => ({ ...p, idLen: clampInt(Number(e.target.value), 0, 9999) }))
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="rounded-md border bg-slate-50 p-3">
                                                                <div className="text-xs text-muted-foreground">İlk satır örneği</div>
                                                                <div className="font-mono text-sm text-emerald-700">
                                                                    {designPreview?.id || "—"}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    {/* İsim */}
                                                    <Card className="border">
                                                        <CardHeader>
                                                            <CardTitle className="text-base">İsim</CardTitle>
                                                            <CardDescription>Başlangıç (1-based) ve uzunluk</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <Label>Başlangıç</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={profile.nameStart}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                            setProfile((p) => ({ ...p, nameStart: clampInt(Number(e.target.value), 1, 9999) }))
                                                                        }
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Uzunluk</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={profile.nameLen}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                            setProfile((p) => ({ ...p, nameLen: clampInt(Number(e.target.value), 0, 9999) }))
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="rounded-md border bg-slate-50 p-3">
                                                                <div className="text-xs text-muted-foreground">İlk satır örneği</div>
                                                                <div className="font-mono text-sm text-emerald-700">
                                                                    {designPreview?.name || "—"}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    {/* Kitapçık */}
                                                    {!profile.noBooklet && (
                                                        <Card className="border">
                                                            <CardHeader>
                                                                <CardTitle className="text-base">Kitapçık</CardTitle>
                                                                <CardDescription>Tek karakter pozisyonu</CardDescription>
                                                            </CardHeader>
                                                            <CardContent className="space-y-3">
                                                                <div>
                                                                    <Label>Pozisyon</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={profile.bookletPos}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                            setProfile((p) => ({ ...p, bookletPos: clampInt(Number(e.target.value), 0, 9999) }))
                                                                        }
                                                                    />
                                                                </div>

                                                                <div className="rounded-md border bg-slate-50 p-3">
                                                                    <div className="text-xs text-muted-foreground">İlk satır örneği</div>
                                                                    <div className="font-mono text-sm text-emerald-700">
                                                                        {designPreview?.booklet || "—"}
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )}

                                                    {/* Cevaplar */}
                                                    <Card className="border">
                                                        <CardHeader>
                                                            <CardTitle className="text-base">Cevaplar</CardTitle>
                                                            <CardDescription>Başlangıç (1-based) ve soru sayısı</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <Label>Başlangıç</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={profile.answersStart}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                            setProfile((p) => ({
                                                                                ...p,
                                                                                answersStart: clampInt(Number(e.target.value), 1, 9999),
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Soru sayısı</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={profile.answersLen}
                                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                            setProfile((p) => ({
                                                                                ...p,
                                                                                answersLen: clampInt(Number(e.target.value), 0, 9999),
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="rounded-md border bg-slate-50 p-3">
                                                                <div className="text-xs text-muted-foreground">İlk satır örneği</div>
                                                                <div className="font-mono text-xs text-emerald-700 break-all">
                                                                    {designPreview?.answers || "—"}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button onClick={() => openStep(3)} disabled={!datContent.trim()}>
                                                        Devam
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => setProfile(DEFAULT_PROFILE)}
                                                    >
                                                        Sıfırla
                                                    </Button>
                                                    <div className="flex-1" />
                                                    <Button variant="outline" onClick={saveDesign} title="Bu yerleşimi tarayıcıya kaydet">
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Dizaynı Kaydet
                                                    </Button>
                                                    <Button variant="outline" onClick={loadDesign} title="Daha önce kaydedilen yerleşimi yükle">
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Dizaynı Yükle
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 3 */}
                                        {step.id === 3 && (
                                            <div className="space-y-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Card className="border">
                                                        <CardHeader>
                                                            <CardTitle className="text-base">A Anahtarı (Zorunlu)</CardTitle>
                                                            <CardDescription>
                                                                Yan yana (optik program uyumlu). Sadece A-B-C-D-E (boşlar: * # X olabilir).
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <Textarea
                                                                value={aKeyText}
                                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAKeyText(e.target.value)}
                                                                className="min-h-[140px] font-mono text-xs"
                                                                placeholder="Örn: EACCAB..."
                                                            />
                                                            <div className="text-sm text-muted-foreground">
                                                                Uzunluk: <span className="font-medium">{aKey.length}</span>
                                                                {questionCount ? (
                                                                    <>
                                                                        {" "}• Beklenen: <span className="font-medium">{questionCount}</span>
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    <Card className="border">
                                                        <CardHeader>
                                                            <CardTitle className="text-base">B/C/D Anahtarları (İsteğe Bağlı)</CardTitle>
                                                            <CardDescription>
                                                                Manuel anahtarlar. Mapping varsa karşılaştırma için kullanılır.
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div className="grid grid-cols-1 gap-3">
                                                                {["B", "C", "D"].map((bk) => (
                                                                    <div key={bk}>
                                                                        <Label className="text-xs font-semibold mb-1 block">{bk} Anahtarı</Label>
                                                                        <Textarea
                                                                            value={bk === "B" ? bKeyText : bk === "C" ? cKeyText : dKeyText}
                                                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => (bk === "B" ? setBKeyText(e.target.value) : bk === "C" ? setCKeyText(e.target.value) : setDKeyText(e.target.value))}
                                                                            className="min-h-[70px] font-mono text-xs"
                                                                            placeholder={`${bk} anahtarını buraya yapıştırın...`}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                <KeyComparisonTable
                                                    aKey={aKey}
                                                    mapping={mappingPack.mapping}
                                                    derived={derivedKeys.out}
                                                    manual={{ B: bKey, C: cKey, D: dKey }}
                                                />

                                                <div className="flex gap-2">
                                                    <Button onClick={() => openStep(4)} disabled={aKey.length < 5}>
                                                        Devam
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 4 */}
                                        {step.id === 4 && (
                                            <div className="space-y-5">
                                                {!mappingNeeded && (
                                                    <div className="rounded-xl border bg-slate-50 p-4">
                                                        <div className="font-medium">Mapping bu sınav için gerekmiyor.</div>
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            Ya kitapçık bilgisi yok, ya da tüm öğrenciler A kitapçık.
                                                            Bu adımı atlayabilirsiniz.
                                                        </div>
                                                    </div>
                                                )}

                                                {mappingNeeded && (
                                                    <>
                                                        <div className="rounded-xl border p-4">
                                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                                <div>
                                                                    <div className="font-medium">Mapping Tablosu</div>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        Excel'den <span className="font-medium">A anahtar / B sıra / C sıra / D sıra / Soru No</span> tabloyu komple kopyalayıp yapıştırın.
                                                                        <br />
                                                                        Buradaki mantık: <span className="font-mono">BKey[i] = AKey[ mappingB[i] ]</span>
                                                                    </div>
                                                                </div>
                                                                <Badge variant="secondary">En kritik adım</Badge>
                                                            </div>

                                                            <MappingMiniAnimation />

                                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {["B", "C", "D"].map((b) => (
                                                                    <div key={b}>
                                                                        <Label className="text-xs font-semibold mb-1 block">{b} Kitapçığı Mapping</Label>
                                                                        <Textarea
                                                                            value={b === "B" ? bMappingText : b === "C" ? cMappingText : dMappingText}
                                                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => (b === "B" ? setBMappingText(e.target.value) : b === "C" ? setCMappingText(e.target.value) : setDMappingText(e.target.value))}
                                                                            className="min-h-[140px] font-mono text-xs"
                                                                            placeholder={`${b} için sayıları girin...`}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="mt-4 space-y-3">
                                                                {(mappingPack.errors.length > 0 || derivedKeys.errors.length > 0) && (
                                                                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
                                                                        <div className="flex items-center gap-2 font-medium">
                                                                            <AlertTriangle className="h-4 w-4" /> Hata
                                                                        </div>
                                                                        <ul className="mt-2 list-disc pl-5 text-sm">
                                                                            {mappingPack.errors.map((x, i) => (
                                                                                <li key={`merr-${i}`}>{x}</li>
                                                                            ))}
                                                                            {derivedKeys.errors.map((x, i) => (
                                                                                <li key={`derr-${i}`}>{x}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}

                                                                {derivedKeys.warnings.length > 0 && (
                                                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                                                        <div className="flex items-center gap-2 font-medium">
                                                                            <AlertTriangle className="h-4 w-4" /> Uyarı
                                                                        </div>
                                                                        <ul className="mt-2 list-disc pl-5 text-sm">
                                                                            {derivedKeys.warnings.map((x, i) => (
                                                                                <li key={i}>{x}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}

                                                                {/* Otomatik anahtar üretimi + karşılaştırma */}
                                                                {aKey.length >= 5 && (bMappingText.trim() || cMappingText.trim() || dMappingText.trim()) && (
                                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                                        {(["B", "C", "D"] as Booklet[]).map((bk) => {
                                                                            const derived = derivedKeys.out[bk] || "";
                                                                            const uploaded =
                                                                                bk === "B" ? bKey : bk === "C" ? cKey : dKey;

                                                                            const diff = uploaded ? keyDiffCount(derived, uploaded) : 0;

                                                                            return (
                                                                                <Card key={bk} className="border">
                                                                                    <CardHeader>
                                                                                        <CardTitle className="text-base">{bk} Anahtarı (Otomatik)</CardTitle>
                                                                                        <CardDescription>
                                                                                            A anahtar + mapping ile oluşturuldu.
                                                                                            {uploaded ? (
                                                                                                <>
                                                                                                    {" "}• Yüklenen anahtarla fark:{" "}
                                                                                                    <span className={cn("font-medium", diff ? "text-rose-600" : "text-emerald-600")}>
                                                                                                        {diff}
                                                                                                    </span>
                                                                                                </>
                                                                                            ) : (
                                                                                                <> • (Yüklenen anahtar yoksa sadece otomatik kullanılır)</>
                                                                                            )}
                                                                                        </CardDescription>
                                                                                    </CardHeader>
                                                                                    <CardContent>
                                                                                        <div className="rounded-md border bg-slate-50 p-3 font-mono text-xs break-all">
                                                                                            {derived || "—"}
                                                                                        </div>
                                                                                    </CardContent>
                                                                                </Card>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                <div className="rounded-xl border bg-white p-4">
                                                                    <div className="font-medium">Bu adımda neler yapılır / yapılmaz?</div>
                                                                    <div className="mt-3 space-y-3">
                                                                        <HintRow
                                                                            title="Yapılır"
                                                                            desc="A anahtar girilir, mapping tablosu yapıştırılır, sistem B/C/D anahtarlarını otomatik üretir."
                                                                        />
                                                                        <HintRow
                                                                            title="Yapılır"
                                                                            desc='Tablodaki "A anahtar" sütunu ile girilen A anahtar otomatik kontrol edilir; uyuşmazsa uyarı verir.'
                                                                        />
                                                                        <HintRow
                                                                            title="Yapılmaz"
                                                                            desc="A anahtar mapping ekranında tekrar istenmez (kafa karışıklığı olmasın)."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => openStep(7)}
                                                                disabled={getStepStatus(4) !== "done"}
                                                            >
                                                                Sonuçlara git
                                                            </Button>
                                                            <Button variant="secondary" onClick={() => openStep(5)}>
                                                                (Opsiyonel) Ders bölümleme
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Step 5 */}
                                        {step.id === 5 && (
                                            <div className="space-y-5">
                                                <div className="rounded-xl border bg-slate-50 p-4">
                                                    <div className="font-medium">Bu adımı atlayabilirsiniz.</div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        Ders bazlı analiz istiyorsanız soru aralıkları ekleyin.
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 flex-wrap">
                                                    <Button
                                                        onClick={() =>
                                                            setSubjects((s) => [
                                                                ...s,
                                                                { name: `Ders ${s.length + 1}`, start: 1, end: questionCount || 1 },
                                                            ])
                                                        }
                                                        variant="secondary"
                                                    >
                                                        + Ders ekle
                                                    </Button>

                                                    <Button onClick={() => openStep(6)} variant="secondary">
                                                        Puanlamaya geç
                                                    </Button>

                                                    <Button onClick={() => openStep(7)}>
                                                        Sonuçlara geç
                                                    </Button>
                                                </div>

                                                {subjects.length > 0 && (
                                                    <div className="space-y-3">
                                                        {subjects.map((sb, idx) => (
                                                            <Card key={idx} className="border">
                                                                <CardContent className="pt-6 space-y-3">
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                        <div>
                                                                            <Label>Ders adı</Label>
                                                                            <Input
                                                                                value={sb.name}
                                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                                    const v = e.target.value;
                                                                                    setSubjects((arr) =>
                                                                                        arr.map((x, i) => (i === idx ? { ...x, name: v } : x))
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label>Başlangıç</Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={sb.start}
                                                                                onChange={(e) => {
                                                                                    const v = clampInt(Number(e.target.value), 1, questionCount || 9999);
                                                                                    setSubjects((arr) =>
                                                                                        arr.map((x, i) => (i === idx ? { ...x, start: v } : x))
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label>Bitiş</Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={sb.end}
                                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                                    const v = clampInt(Number(e.target.value), 1, questionCount || 9999);
                                                                                    setSubjects((arr) =>
                                                                                        arr.map((x, i) => (i === idx ? { ...x, end: v } : x))
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex justify-end">
                                                                        <Button
                                                                            variant="destructive"
                                                                            onClick={() => setSubjects((arr) => arr.filter((_, i) => i !== idx))}
                                                                        >
                                                                            Sil
                                                                        </Button>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Step 6 */}
                                        {step.id === 6 && (
                                            <div className="space-y-5">
                                                <div className="rounded-xl border bg-slate-50 p-4">
                                                    <div className="font-medium">Bu adımı atlayabilirsiniz.</div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        Puanlama varsayılanı: net = doğru (yanlış götürme yok), toplam puan = 100.
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Card className="border">
                                                        <CardHeader>
                                                            <CardTitle className="text-base">Boşlar yanlış sayılır</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="flex items-center justify-between">
                                                            <Label>Blank as wrong</Label>
                                                            <Switch
                                                                checked={scoring.blankAsWrong}
                                                                onCheckedChange={(v: boolean) => setScoring((s) => ({ ...s, blankAsWrong: v }))}
                                                            />
                                                        </CardContent>
                                                    </Card>

                                                    <Card className="border">
                                                        <CardHeader>
                                                            <CardTitle className="text-base">Yanlış götürme katsayısı</CardTitle>
                                                            <CardDescription>Örn: 0.25 → 4 yanlış 1 doğru götürür</CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={scoring.wrongPenalty}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                    setScoring((s) => ({ ...s, wrongPenalty: Number(e.target.value) || 0 }))
                                                                }
                                                            />
                                                        </CardContent>
                                                    </Card>

                                                    <Card className="border">
                                                        <CardHeader>
                                                            <CardTitle className="text-base">Toplam puan</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <Input
                                                                type="number"
                                                                value={scoring.totalScore}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                    setScoring((s) => ({ ...s, totalScore: Number(e.target.value) || 100 }))
                                                                }
                                                            />
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button onClick={() => openStep(7)}>Sonuçlara geç</Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 7 */}
                                        {step.id === 7 && (
                                            <div className="space-y-6">
                                                {getStepStatus(7) !== "done" && (
                                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                                        <div className="flex items-center gap-2 font-medium">
                                                            <AlertTriangle className="h-4 w-4" /> Analiz için eksikler var
                                                        </div>
                                                        <div className="mt-2 text-sm">
                                                            - Dosya ve A anahtar zorunlu. <br />
                                                            - Birden fazla kitapçık varsa mapping gerekir.
                                                        </div>
                                                    </div>
                                                )}

                                                {results.excluded.length > 0 && (
                                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                                        <div className="font-medium">Analiz dışı bırakılan öğrenciler</div>
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            Mapping eksik olduğu için bazı kitapçıklar dışarıda kalmış olabilir.
                                                        </div>
                                                        <ul className="mt-2 list-disc pl-5 text-sm">
                                                            {results.excluded.slice(0, 8).map((x, i) => (
                                                                <li key={i}>
                                                                    {x.student.name} ({x.student.id}) — {x.reason}
                                                                </li>
                                                            ))}
                                                            {results.excluded.length > 8 && (
                                                                <li>... (+{results.excluded.length - 8})</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Sonuç tablosu */}
                                                <Card className="border">
                                                    <CardHeader>
                                                        <CardTitle className="text-base">Öğrenci Sonuçları</CardTitle>
                                                        <CardDescription>
                                                            Puan = (Net / Soru sayısı) × {scoring.totalScore}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                        <div className="flex gap-2 flex-wrap">
                                                            <Button
                                                                variant="secondary"
                                                                onClick={() => {
                                                                    const rows: string[][] = [
                                                                        ["isim", "no", "kitapçık", "dogru", "yanlis", "bos", "net", "puan"],
                                                                        ...results.scored.map((r) => [
                                                                            r.name,
                                                                            r.id,
                                                                            r.booklet,
                                                                            String(r.correct),
                                                                            String(r.wrong),
                                                                            String(r.blank),
                                                                            String(r.net),
                                                                            String(r.score),
                                                                        ]),
                                                                    ];
                                                                    downloadCsv("Ogrenci_Sonuclari.csv", rows);
                                                                }}
                                                            >
                                                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                                                CSV indir
                                                            </Button>

                                                            <Button
                                                                variant="secondary"
                                                                onClick={() => {
                                                                    const rows: string[][] = [
                                                                        ["soru", "A", "B", "C", "D", "E", "bos", "dogru", "dogru_yuzde", "zorluk", "ayiricilik", "yorum"],
                                                                        ...analysis.questionRows.map((q: any) => [
                                                                            String(q.soru),
                                                                            String(q.A),
                                                                            String(q.B),
                                                                            String(q.C),
                                                                            String(q.D),
                                                                            String(q.E),
                                                                            String(q.Bos),
                                                                            q.dogru,
                                                                            formatPct(q.dogruPct * 100),
                                                                            String(round2(q.zorluk)),
                                                                            String(q.ayiricilik),
                                                                            q.yorum,
                                                                        ]),
                                                                    ];
                                                                    downloadCsv("Soru_Analizi.csv", rows);
                                                                }}
                                                            >
                                                                <FileText className="h-4 w-4 mr-2" />
                                                                Soru analizi CSV
                                                            </Button>
                                                        </div>

                                                        <div className="overflow-auto rounded-lg border">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-slate-50">
                                                                    <tr>
                                                                        <th className="text-left p-2">İsim</th>
                                                                        <th className="text-left p-2">No</th>
                                                                        <th className="text-left p-2">Kitapçık</th>
                                                                        <th className="text-right p-2">Doğru</th>
                                                                        <th className="text-right p-2">Yanlış</th>
                                                                        <th className="text-right p-2">Boş</th>
                                                                        <th className="text-right p-2">Net</th>
                                                                        <th className="text-right p-2">Puan</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {results.scored
                                                                        .slice()
                                                                        .sort((a, b) => b.score - a.score)
                                                                        .map((r) => (
                                                                            <tr key={r.id} className="border-t">
                                                                                <td className="p-2 whitespace-nowrap">{r.name}</td>
                                                                                <td className="p-2 font-mono">{r.id}</td>
                                                                                <td className="p-2">{r.booklet}</td>
                                                                                <td className="p-2 text-right">{r.correct}</td>
                                                                                <td className="p-2 text-right">{r.wrong}</td>
                                                                                <td className="p-2 text-right">{r.blank}</td>
                                                                                <td className="p-2 text-right">{r.net}</td>
                                                                                <td className="p-2 text-right font-medium">{r.score}</td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Histogram */}
                                                <Card className="border">
                                                    <CardHeader>
                                                        <CardTitle className="text-base">Puan Dağılımı</CardTitle>
                                                    </CardHeader>
                                                    <CardContent style={{ height: 260 }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={analysis.scoreHist}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="range" />
                                                                <YAxis allowDecimals={false} />
                                                                <Tooltip />
                                                                <Bar dataKey="count" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>

                                                {/* Madde analizi */}
                                                <Card className="border">
                                                    <CardHeader>
                                                        <CardTitle className="text-base">Madde Analizi</CardTitle>
                                                        <CardDescription>
                                                            Zorluk = doğru oranı • Ayırıcılık = üst %27 - alt %27
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="overflow-auto rounded-lg border">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-slate-50">
                                                                    <tr>
                                                                        <th className="p-2 text-left">Soru</th>
                                                                        <th className="p-2 text-right">A</th>
                                                                        <th className="p-2 text-right">B</th>
                                                                        <th className="p-2 text-right">C</th>
                                                                        <th className="p-2 text-right">D</th>
                                                                        <th className="p-2 text-right">E</th>
                                                                        <th className="p-2 text-right">Boş</th>
                                                                        <th className="p-2 text-left">Doğru</th>
                                                                        <th className="p-2 text-right">Doğru %</th>
                                                                        <th className="p-2 text-right">Zorluk</th>
                                                                        <th className="p-2 text-right">Ayırıcılık</th>
                                                                        <th className="p-2 text-left">Yorum</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {analysis.questionRows.map((q: any) => (
                                                                        <tr key={q.soru} className="border-t">
                                                                            <td className="p-2">{q.soru}</td>
                                                                            <td className="p-2 text-right">{q.A}</td>
                                                                            <td className="p-2 text-right">{q.B}</td>
                                                                            <td className="p-2 text-right">{q.C}</td>
                                                                            <td className="p-2 text-right">{q.D}</td>
                                                                            <td className="p-2 text-right">{q.E}</td>
                                                                            <td className="p-2 text-right">{q.Bos}</td>
                                                                            <td className="p-2">{q.dogru}</td>
                                                                            <td className="p-2 text-right">{formatPct(q.dogruPct * 100)}</td>
                                                                            <td className="p-2 text-right">{round2(q.zorluk)}</td>
                                                                            <td className={cn("p-2 text-right", q.ayiricilik < 0 ? "text-rose-600 font-medium" : "")}>
                                                                                {q.ayiricilik}
                                                                            </td>
                                                                            <td className="p-2">{q.yorum}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

// ✅ default export: React.lazy(...) için kritik
export default OnlineTestAnaliz;
