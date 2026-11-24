export const HISTO_TIP_OPTS = [
    "Gastrointestinal Stromal Tümör, iğsi hücreli tip",
    "Gastrointestinal Stromal Tümör, epiteloid tip",
    "Gastrointestinal Stromal Tümör, mikst",
];

export const YERLEŞIM_OPTS = [
    "Mide", "Duedonum", "Jejenum/İleum", "Rektum", "Kolon", "Özofagus",
    "Omentum", "Mezenter", "Retroperiton", "Periton", "Karaciğer", "Pankreas",
];

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

export function toNumber(n: any) {
    if (n === undefined || n === null || n === "") return undefined;
    if (typeof n === "number") return n;
    const v = parseFloat(String(n).replace(",", "."));
    return Number.isNaN(v) ? undefined : v;
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

export function riskFrom(sizeCm: number | undefined, mitos: number | undefined, site: string) {
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

export function generateGistReport(data: GistData): string {
    const lines: string[] = [];
    const addFinding = (label: string, value: string) => {
        const trimmed = value.trim();
        if (trimmed) lines.push(`${label}: ${trimmed}`);
    };
    addFinding("Histolojik Tip", data.histoTip);

    const ebc = formatNumber(data.enBuyukCm);
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

    const risk = riskFrom(data.enBuyukCm, data.mitozNum, data.yerlesim.trim());
    if (risk !== "Belirsiz") lines.push(`Risk değerlendirmesi: ${risk}`);

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
