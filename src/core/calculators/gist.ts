export const HISTO_TIP_OPTS = [
    "Gastrointestinal Stromal Tümör, iğsi hücreli tip",
    "Gastrointestinal Stromal Tümör, epiteloid tip",
    "Gastrointestinal Stromal Tümör, mikst",
];

export const YERLEŞIM_OPTS = [
    "Mide", "Duodenum", "Jejunum/İleum", "Rektum", "Kolon", "Özofagus",
    "Omentum", "Mezenter", "Retroperiton", "Periton", "Karaciğer", "Pankreas",
] as const;

export const CAP_GIST_RISK_REFERENCE = "CAP GİST 4.4.0.0, Not D, Tablo 1";
export const CAP_GIST_RISK_URL = "https://www.cap.org/wp-content/uploads/2026/09/GIST_4.4.0.0.REL_CAPCP.pdf?download=true#page=12";

export const SINIR_OPTS = ["Ekspansil", "İnfiltratif"];
export const ODAK_OPTS = ["Unifokal", "Multifokal"];

export interface GistData {
    histoTip: string;
    enBuyukCm: number | undefined;
    lx: number | undefined;
    wx: number | undefined;
    hx: number | undefined;
    sinir: string;
    odak: string;
    yerlesim: string;
    mitozNum: number | undefined;
    nekrozVar: boolean | undefined;
    nekrozYuzde: number | undefined;
    neoTedaviVar: boolean | undefined;
    canliTumorYuzde: number | undefined;
    cerrahiMetin: string;
    nodDurumu: string;
    cd117: string;
    dog1: string;
    sdha: string;
    sdhb: string;
    braf: string;
    cd34: string;
    sma: string;
    desmin: string;
    s100: string;
    ki67: string;
}

export function formatNumber(n: any, digits = 1) {
    if (n === undefined || n === null || n === "") return "";
    const val = typeof n === "string" ? parseFloat(n.replace(",", ".")) : n;
    if (Number.isNaN(val)) return String(n);
    return val.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function toNumber(input: string) {
    const trimmed = input.trim();
    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(trimmed)) return undefined;
    const value = Number(trimmed.replace(",", "."));
    return Number.isFinite(value) ? value : undefined;
}

export function toMitosisCount(input: string) {
    const value = toNumber(input);
    return value !== undefined && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

export function pTFromSize(cm: number | undefined, neoadjuvan: boolean | undefined) {
    if ((!cm && cm !== 0) || neoadjuvan === undefined) return "";
    let cat = "";
    if (cm === 0) cat = "pT0";
    else if (cm <= 2) cat = "pT1";
    else if (cm <= 5) cat = "pT2";
    else if (cm <= 10) cat = "pT3";
    else cat = "pT4";
    return (neoadjuvan ? "y" : "") + cat;
}

export function gradeFromMitotic(mitosPer5mm2: number | undefined) {
    if (mitosPer5mm2 === undefined) return "";
    return mitosPer5mm2 <= 5 ? "G1; low grade" : "G2; high grade";
}

type RiskCategory = "Yok" | "Çok düşük" | "Düşük" | "Orta" | "Yüksek";
type CapSite = "Mide" | "Duodenum" | "Jejunum/İleum" | "Rektum";
type RiskAssessment =
    | { kind: "direct" | "proxy"; category: RiskCategory }
    | { kind: "missing" | "invalid" | "insufficient" | "postTreatment"; category: null };

// CAP Not D, Tablo 1. Sütunlar: ≤2, >2–≤5, >5–≤10, >10 cm.
// null = ilgili yerleşime özgü veri yetersiz, "Yok" = tablodaki ayrı risk kategorisi.
const CAP_RISK_MATRIX = {
    lowMitosis: {
        Mide: ["Yok", "Çok düşük", "Düşük", "Orta"],
        Duodenum: ["Yok", "Düşük", null, "Yüksek"],
        "Jejunum/İleum": ["Yok", "Düşük", "Orta", "Yüksek"],
        Rektum: ["Yok", "Düşük", null, "Yüksek"],
    },
    highMitosis: {
        Mide: ["Yok", "Orta", "Yüksek", "Yüksek"],
        Duodenum: [null, "Yüksek", null, "Yüksek"],
        "Jejunum/İleum": ["Yüksek", "Yüksek", "Yüksek", "Yüksek"],
        Rektum: ["Yüksek", "Yüksek", null, "Yüksek"],
    },
} as const satisfies Record<string, Record<CapSite, readonly (RiskCategory | null)[]>>;

export function riskFrom(sizeCm: number | undefined, mitos: number | undefined, site: string, postTreatment = false): RiskAssessment {
    if (postTreatment) return { kind: "postTreatment", category: null };
    if (sizeCm === undefined || mitos === undefined || !site.trim()) return { kind: "missing", category: null };
    const trimmedSite = site.trim();
    const normalizedSite = trimmedSite === "Duedonum" ? "Duodenum" : trimmedSite === "Jejenum/İleum" ? "Jejunum/İleum" : trimmedSite;
    if (!Number.isFinite(sizeCm) || sizeCm <= 0 || !Number.isSafeInteger(mitos) || mitos < 0
        || !YERLEŞIM_OPTS.some(option => option === normalizedSite)) {
        return { kind: "invalid", category: null };
    }
    const row = CAP_RISK_MATRIX[mitos > 5 ? "highMitosis" : "lowMitosis"];
    const band = sizeCm <= 2 ? 0 : sizeCm <= 5 ? 1 : sizeCm <= 10 ? 2 : 3;
    if (!Object.prototype.hasOwnProperty.call(row, normalizedSite)) return { kind: "proxy", category: row["Jejunum/İleum"][band] };
    const category = row[normalizedSite as CapSite][band];
    return category === null ? { kind: "insufficient", category: null } : { kind: "direct", category };
}

export function riskAssessmentNote(risk: RiskAssessment): string {
    if (risk.kind === "proxy") return "Yerleşim tabloda yok; jejunum/ileum ölçütleri kullanıldı, yerleşime özgü sonuç değildir.";
    if (risk.kind === "insufficient") return "Bu yerleşim ve ölçümler için tabloda veri yetersiz; otomatik kategori atanmadı. Jejunum/ileum ölçütleri uzman değerlendirmesinde dikkate alınabilir.";
    if (risk.kind === "postTreatment") return "Neoadjuvan tedavi sonrası ölçümlerden otomatik kategori atanmadı.";
    if (risk.category === "Yok") return "Tablo kategorisidir; bireysel riskin sıfır olduğunu göstermez.";
    return "";
}

export function generateGistReport(data: GistData): string {
    const lines: string[] = [];
    const addFinding = (label: string, value: string) => {
        const trimmed = value.trim();
        if (trimmed) lines.push(`${label}: ${trimmed}`);
    };
    addFinding("Histolojik Tip", data.histoTip);

    // 2,01/5,01/10,01 gibi ölçümler, risk sınırının diğer tarafına yuvarlanmamalı.
    const ebc = data.enBuyukCm?.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 20 });
    if (ebc) lines.push(`En büyük tümör boyutu: ${ebc} cm`);

    const L = formatNumber(data.lx), W = formatNumber(data.wx), H = formatNumber(data.hx);
    if (L || W || H) lines.push(`Tümör boyutları: ${L || "?"} x ${W || "?"} x ${H || "?"} cm`);

    addFinding("Tümör sınırları", data.sinir);
    addFinding("Tümör odağı", data.odak);
    addFinding("Tümör yerleşimi", data.yerlesim);

    if (data.mitozNum !== undefined) lines.push(`Mitotik oran: ${formatNumber(data.mitozNum, 0)} mitoz/5mm²`);

    if (data.nekrozVar === true) {
        lines.push(`Nekroz: Var${data.nekrozYuzde !== undefined ? ` (%${formatNumber(data.nekrozYuzde, 0)})` : ""}`);
    } else if (data.nekrozVar === false) {
        lines.push("Nekroz: Yok");
    }

    if (data.neoTedaviVar === true) {
        const percentage = data.canliTumorYuzde !== undefined
            ? ` Canlı tümör yüzdesi: %${formatNumber(data.canliTumorYuzde, 0)}.`
            : "";
        lines.push(`Neoadjuvan tedavi vardır.${percentage}`);
    } else if (data.neoTedaviVar === false) {
        lines.push("Neoadjuvan tedavi: Yok");
    }

    addFinding("Cerrahi sınırlar", data.cerrahiMetin);
    addFinding("Bölgesel lenf nodları durumu", data.nodDurumu);

    const grade = gradeFromMitotic(data.mitozNum);
    if (grade) lines.push(`Histolojik Grade: ${grade}`);

    const risk = riskFrom(data.enBuyukCm, data.mitozNum, data.yerlesim, data.neoTedaviVar === true);
    const riskNote = riskAssessmentNote(risk);
    if (risk.category || riskNote) {
        lines.push(`Risk değerlendirmesi (${CAP_GIST_RISK_REFERENCE}): ${[risk.category, riskNote].filter(Boolean).join(" | ")}`);
    }

    const pT = pTFromSize(data.enBuyukCm, data.neoTedaviVar);
    if (pT) lines.push(`pT kategori: ${pT}`);

    addFinding("C-KİT (CD117)", data.cd117);
    addFinding("DOG1 (ANO1)", data.dog1);
    addFinding("SDHA", data.sdha);
    addFinding("SDHB", data.sdhb);
    addFinding("BRAF", data.braf);
    addFinding("CD34", data.cd34);
    addFinding("SMA", data.sma);
    addFinding("Desmin", data.desmin);
    addFinding("S-100", data.s100);

    if (data.ki67.trim()) lines.push(`Ki-67: %${data.ki67.trim()}`);

    return lines.join("\n");
}
