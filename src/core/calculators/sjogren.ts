export interface SjogrenInputs {
    stains: string[];
    yeterlilik: string;
    izlenenMm2: string;
    fokus: string;
    fibrozis: string;
    yaglanma: string;
    otherFindings: {
        enYogun: boolean;
        plazmaNadir: boolean;
        plazmaTopluluk: boolean;
        onkositik: boolean;
        devKonfluen: boolean;
        germinal: boolean;
        mukozal: boolean;
    };
    customOther: string;
}

export const FOKUS_OPTS = [
    { id: "yok", label: "Yok", value: "İnflamasyon yok" },
    { id: "az", label: "<1", value: "Bir fokusdan az inflamasyon" },
    { id: "bir", label: "1", value: "Bir fokus inflamasyon. (Fokus: 50 lenfosit topluluğu)" },
    { id: "iki", label: "2", value: "İki fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "uc", label: "3", value: "Üç fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "dort", label: "4", value: "Dört fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "bes", label: "5", value: "Beş fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "alti", label: "6", value: "Altı fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "yedi", label: "7", value: "Yedi fokus. (Fokus: 50 lenfosit topluluğu.)" },
    { id: "sekiz", label: "8+", value: "Sekiz veya daha fazla fokus. (Fokus: 50 lenfosit topluluğu.)" },
];

export const FIBROZIS_OPTS = [
    { id: "yok", label: "Fibrozis yok" },
    { id: "hafif", label: "Hafif fibrozis" },
    { id: "belirgin", label: "Belirgin fibrozis" },
];

export const YAGLANMA_OPTS = [
    { id: "yok", label: "Yağlanma yok" },
    { id: "var", label: "Yağlanma var" },
];

export const YETERLILIK_OPTS = [
    { id: "yeterli", label: "Glandüler doku: yeterli (minimal 4 mm2)" },
    { id: "sinirli", label: "Glandüler doku: sınırlı yeterli (minimal 4 mm2)" },
    { id: "yetersiz", label: "Glandüler doku: Yetersiz (minimal 4 mm2)" },
    { id: "yok", label: "Glandüler doku yok." },
];

export const generateSjogrenReport = (inputs: SjogrenInputs): string => {
    const { stains, yeterlilik, izlenenMm2, fokus, fibrozis, yaglanma, otherFindings, customOther } = inputs;

    let lines = ["Üç lam seri kesit "];
    const activeStains = stains.filter(s => s.trim() !== "");
    if (activeStains.length > 0) {
        if (activeStains.length === 1) {
            lines[0] += `ve ${activeStains[0]} `;
        } else {
            lines[0] += `ve ${activeStains.join(", ")} `;
        }
    }
    lines[0] += "ile incelenmiştir.";
    lines.push("");

    // Yeterlilik
    let yeterlilikText = "Yeterlilik:\t";
    if (yeterlilik === "yeterli") yeterlilikText += "Glandüler doku: yeterli (minimal 4 mm2)";
    else if (yeterlilik === "sinirli") yeterlilikText += "Glandüler doku: sınırlı yeterli (minimal 4 mm2)";
    else if (yeterlilik === "yetersiz") yeterlilikText += `Glandüler doku: Yetersiz (minimal 4 mm2). İzlenen: ${izlenenMm2} mm2`;
    else yeterlilikText += "Glandüler doku yok.";
    lines.push(yeterlilikText);

    if (yeterlilik !== "yok") {
        // Fokus
        const fOpt = FOKUS_OPTS.find(o => o.id === fokus);
        lines.push(`Fokus sayısı (4 mm2'de):\t${fOpt?.value || ""}`);

        // Fibrozis
        const fibOpt = FIBROZIS_OPTS.find(o => o.id === fibrozis);
        lines.push(`Fibrozis:\t${fibOpt?.label || ""}`);

        // Yağlanma
        const yagOpt = YAGLANMA_OPTS.find(o => o.id === yaglanma);
        lines.push(`Yağlanma:\t${yagOpt?.label || ""}`);

        // Diğer
        const otherItems = [];
        if (otherFindings.enYogun) otherItems.push("Fokus sayımında gland yapısında en yoğun 4 mm2 alan değerlendirilmiştir.");
        if (otherFindings.mukozal) otherItems.push("Minör tükrük bezi içermeyen mukozal fragman izlenmiştir.");
        if (otherFindings.plazmaNadir) otherItems.push("Nadir plazma hücresi izlenmiştir.");
        if (otherFindings.plazmaTopluluk) otherItems.push("Plazma hücresi topluluğu (>10 hücre) izlenmiştir.");
        if (otherFindings.onkositik) otherItems.push("Duktuslarda onkositik metaplazi vardır.");
        if (otherFindings.devKonfluen) otherItems.push("Dev / Konfluen fokus vardır.");
        if (otherFindings.germinal) otherItems.push("Germinal merkez izlenmiştir.");
        if (customOther.trim()) otherItems.push(customOther.trim());

        if (otherItems.length > 0) {
            lines.push(`Diğer:\t${otherItems.join(" ")}`);
        }
    } else {
        // Glandüler doku yoksa
        const otherItems = [];
        if (otherFindings.enYogun) otherItems.push("Fokus sayımında gland yapısında en yoğun 4 mm2 alan değerlendirilmiştir.");
        if (otherFindings.mukozal) otherItems.push("Minör tükrük bezi içermeyen mukozal fragman izlenmiştir.");
        if (otherFindings.plazmaNadir) otherItems.push("Nadir plazma hücresi izlenmiştir.");
        if (otherFindings.plazmaTopluluk) otherItems.push("Plazma hücresi topluluğu (>10 hücre) izlenmiştir.");
        if (otherFindings.onkositik) otherItems.push("Duktuslarda onkositik metaplazi vardır.");
        if (otherFindings.devKonfluen) otherItems.push("Dev / Konfluen fokus vardır.");
        if (otherFindings.germinal) otherItems.push("Germinal merkez izlenmiştir.");
        if (customOther.trim()) otherItems.push(customOther.trim());

        lines.push(`Diğer:\t${otherItems.join(" ")}`);
    }

    lines.push("");

    // Tanı
    let tani = "Tanı:\t";
    if (yeterlilik === "yetersiz" || yeterlilik === "yok") {
        tani += "Minör tükrük bezi biyopsisi: Nondiagnostik";
    } else {
        if (fokus === "yok") {
            if (fibrozis === "belirgin") tani += "İnflamasyon yok, ancak belirgin fibrozis var";
            else if (fibrozis === "hafif") tani += "Minör tükrük bezi biyopsisi: İnflamasyon yok, ancak hafif fibrozis vardır";
            else tani += "Minör tükrük bezi biyopsisi: Normal görünümlü minör tükrük bezi";
        } else if (fokus === "az") {
            if (fibrozis === "yok") tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokusdan az), fibrozis yok";
            else if (fibrozis === "hafif") tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokusdan az), hafif fibrozis";
            else tani += "Minör tükrük bezi biyopsisi: Bir fokustan az inflamasyon, ancak belirgin fibrozis vardır";
        } else if (fokus === "bir") {
            if (fibrozis === "yok") tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokus), fibrozis yok";
            else if (fibrozis === "hafif") tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokus), hafif fibrozis";
            else tani += "Minör tükrük bezi biyopsisi: Fokal lenfositik inflamasyon (Bir fokus), belirgin fibrozis";
        } else {
            // 2+ fokus
            if (fibrozis === "yok") tani += "Minör tükrük bezi biyopsisi: İki veya daha fazla fokus lenfositik inflamasyon, fibrozis yok";
            else if (fibrozis === "hafif") tani += "Minör tükrük bezi biyopsisi: İki veya daha fazla fokus lenfositik inflamasyon, hafif fibrozis";
            else tani += "Minör tükrük bezi biyopsisi: İki veya daha fazla fokus lenfositik inflamasyon, belirgin fibrozis";
        }
    }
    lines.push(tani);

    if (yeterlilik !== "yok") {
        const fOpt = FOKUS_OPTS.find(o => o.id === fokus);
        let fCountText = "Fokus sayısı: ";
        if (fokus === "yok") fCountText = "Fokus Sayısı: İnflamasyon yok";
        else if (fokus === "az") fCountText = "Fokus yok";
        else if (fokus === "sekiz") fCountText += "8 ve daha fazla";
        else fCountText += fOpt?.label || "";
        lines.push(`\t${fCountText}`);
    }

    return lines.join("\n");
};
