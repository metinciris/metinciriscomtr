// src/core/calculators/exam.ts

export type Booklet = "A" | "B" | "C" | "D";

export interface ProfileConfig {
    idStart: number;
    idLen: number;
    nameStart: number;
    nameLen: number;
    bookletPos: number; // 1-based index in line (0 => yok)
    answersStart: number;
    answersLen: number; // soru sayısı
    noBooklet: boolean;
}

export interface Student {
    id: string;
    name: string;
    booklet: Booklet;
    answersRaw: string[]; // geldiği sıradaki cevaplar (kitapçık sırası)
}

export interface MappingPack {
    mapping: Partial<Record<Booklet, number[]>>;
    tableAKey?: string;
    errors: string[];
    warnings: string[];
}

export interface ScoringConfig {
    blankAsWrong: boolean;
    wrongPenalty: number; // 0 => götürme yok
    totalScore: number;
}

export interface SubjectBlock {
    name: string;
    start: number; // 1-based
    end: number; // 1-based
}

export interface ScoredStudent extends Student {
    answersA: string[];
    correct: number;
    wrong: number;
    blank: number;
    net: number;
    score: number;
    excludedReason?: string;
}

export interface QuestionAnalysis {
    soru: number;
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    Bos: number;
    dogru: string;
    dogruPct: number;
    ayiricilik: number;
    zorluk: number;
    yorum: string;
}

export const DEFAULT_PROFILE: ProfileConfig = {
    idStart: 21,
    idLen: 10,
    nameStart: 1,
    nameLen: 20,
    bookletPos: 31,
    answersStart: 32,
    answersLen: 95,
    noBooklet: false,
};

export const DEFAULT_SCORING: ScoringConfig = {
    blankAsWrong: false,
    wrongPenalty: 0,
    totalScore: 100,
};

export function clampInt(n: number, min: number, max: number) {
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
}

export function onlyAnswerChars(s: string) {
    return (s || "")
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/[^ABCDE#*X]/g, "");
}

export function normalizeAnswerChar(ch: string) {
    const c = (ch || "").toUpperCase();
    if (c === "*" || c === "#" || c === "X") return " ";
    if (["A", "B", "C", "D", "E"].includes(c)) return c;
    return " ";
}

export function splitFixed(line: string, start1Based: number, len: number) {
    const s = clampInt(start1Based, 1, Math.max(1, line.length));
    const l = clampInt(len, 0, Math.max(0, line.length));
    return line.slice(s - 1, s - 1 + l);
}

export function parseBookletChar(ch: string): Booklet {
    const c = (ch || "").toUpperCase();
    if (c === "B") return "B";
    if (c === "C") return "C";
    if (c === "D") return "D";
    return "A";
}

export function validatePermutation(arr: number[], n: number) {
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

export function parseMappingList(text: string): number[] {
    return (text || "")
        .split(/[\s,;]+/)
        .map(x => parseInt(x))
        .filter(x => !isNaN(x));
}

export function parseMappingTable(bText: string, cText: string, dText: string): MappingPack {
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

export function deriveBookletKeyFromA(aKey: string, toA: number[]) {
    const A = aKey || "";
    return toA
        .map((aNo) => {
            const idx = Number(aNo) - 1;
            if (!Number.isFinite(idx) || idx < 0 || idx >= A.length) return " ";
            return A[idx] || " ";
        })
        .join("");
}

export function answersToAOrder(answersInBookletOrder: string[], toA: number[], n: number) {
    const out = new Array(n).fill(" ");
    for (let i = 0; i < Math.min(answersInBookletOrder.length, toA.length); i++) {
        const aNo = toA[i];
        const aIdx = Number(aNo) - 1;
        if (!Number.isFinite(aIdx) || aIdx < 0 || aIdx >= n) continue;
        out[aIdx] = answersInBookletOrder[i] ?? " ";
    }
    return out;
}

export function scoreOne(
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

export function overlap(aStart: number, aLen: number, bStart: number, bLen: number) {
    const a0 = aStart;
    const a1 = aStart + Math.max(0, aLen) - 1;
    const b0 = bStart;
    const b1 = bStart + Math.max(0, bLen) - 1;
    if (aLen <= 0 || bLen <= 0) return false;
    return !(a1 < b0 || b1 < a0);
}

export function round2(n: number) {
    return Math.round(n * 100) / 100;
}

export type FieldKey = "id" | "name" | "booklet" | "answers";

export function formatPct(n: number) {
    if (!Number.isFinite(n)) return "0%";
    return `${n.toFixed(2)}%`.replace(".", ",");
}

export function safeMean(xs: number[]) {
    const v = xs.filter((x) => Number.isFinite(x));
    if (!v.length) return 0;
    return v.reduce((a, b) => a + b, 0) / v.length;
}

export function commentFor(p: number, disc: number) {
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

export function parseStudents(datContent: string, profile: ProfileConfig): Student[] {
    const content = (datContent || "").trim();
    if (!content) return [];
    const lines = content
        .split(/\r?\n/)
        .map((l) => l.replace(/\r/g, ""))
        .filter((l) => l.trim().length > 0);
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
    return parsed;
}

export function calculateResults(
    students: Student[],
    aKey: string,
    questionCount: number,
    scoring: ScoringConfig,
    mappingNeeded: boolean,
    mapping: Partial<Record<Booklet, number[]>>,
    manualKeys: Partial<Record<Booklet, string>>
): { scored: ScoredStudent[]; excluded: { student: Student; reason: string }[] } {
    if (!students.length || !aKey || aKey.length < 5 || questionCount < 5) {
        return { scored: [], excluded: [] };
    }
    const aKeyArr = aKey.slice(0, questionCount).split("");
    const scored: ScoredStudent[] = [];
    const excluded: { student: Student; reason: string }[] = [];
    for (const st of students) {
        let answersA: string[] = [];
        if (st.booklet === "A" || !mappingNeeded) {
            answersA = (st.answersRaw || []).slice(0, questionCount);
        } else {
            const toA = mapping[st.booklet];
            if (toA && toA.length > 0) {
                answersA = answersToAOrder(st.answersRaw || [], toA, questionCount);
            } else {
                const manualKey = manualKeys[st.booklet];
                if (manualKey && manualKey.length >= 5) {
                    const studAnswers = (st.answersRaw || []).slice(0, questionCount);
                    const manualKeyArr = manualKey.slice(0, questionCount).split("");
                    const s = scoreOne(studAnswers, manualKeyArr, scoring);
                    scored.push({
                        ...st,
                        answersA: studAnswers,
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
}

export function performItemAnalysis(
    scored: ScoredStudent[],
    questionCount: number,
    aKey: string
): { questionRows: QuestionAnalysis[]; scoreHist: { range: string; count: number }[] } {
    if (!questionCount || !aKey || aKey.length < questionCount || scored.length === 0) {
        return { questionRows: [], scoreHist: [] };
    }
    const aKeyArr = aKey.slice(0, questionCount).split("");
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
    const scoreIndices = scored
        .map((s, i) => ({ s: s.score, i }))
        .sort((a, b) => b.s - a.s);
    const totalStudents = scored.length;
    const groupSize = Math.max(1, Math.round(totalStudents * 0.27));
    const topIndices = new Set(scoreIndices.slice(0, groupSize).map(x => x.i));
    const botIndices = new Set(scoreIndices.slice(totalStudents - groupSize).map(x => x.i));
    const questionRows = Array.from({ length: questionCount }).map((_, qi) => {
        const correctAnswer = aKeyArr[qi];
        const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, blank: 0 };
        let correctTop = 0;
        let correctBot = 0;
        scored.forEach((st, i) => {
            const ans = normalizeAnswerChar(st.answersA[qi] || " ");
            if (ans === " ") dist.blank++;
            else dist[ans] = (dist[ans] || 0) + 1;
            const isCorrect = ans === correctAnswer;
            if (topIndices.has(i) && isCorrect) correctTop++;
            if (botIndices.has(i) && isCorrect) correctBot++;
        });
        const total = scored.length || 1;
        const p = dist[correctAnswer] / total;
        const diffFormula = ((correctTop + correctBot) / (2 * groupSize)) * 100;
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
            dogruPct: p,
            ayiricilik: round2(discFormula),
            zorluk: round2(diffFormula),
            yorum: commentFor(diffFormula / 100, discFormula),
        };
    });
    return { questionRows, scoreHist };
}
