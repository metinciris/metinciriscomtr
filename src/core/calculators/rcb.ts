export type RcbCategory = 'Class I (Minimal tümör yükü)' | 'Class II (Orta derecede yük)' | 'Class III (Yaygın tümör yükü)';

export interface RcbInputs {
    d1: number;
    d2: number;
    c: number;
    pis: number;
    pn: number;
    dmet: number;
}

export interface RcbResult {
    rcb: number;
    category: RcbCategory;
    details: string;
}

export const calculateRCBValue = (inputs: RcbInputs): RcbResult => {
    const { d1, d2, c, pis, pn, dmet } = inputs;

    const dprim = Math.sqrt(d1 * d2);
    const finv = (1 - pis / 100) * (c / 100);
    const term1 = 1.4 * Math.pow(finv * dprim, 0.17);
    const term2 = Math.pow(4 * (1 - Math.pow(0.75, pn)) * dmet, 0.17);
    const rcb = term1 + term2;

    let category: RcbCategory;
    if (rcb < 1.36) {
        category = 'Class I (Minimal tümör yükü)';
    } else if (rcb < 3.28) {
        category = 'Class II (Orta derecede yük)';
    } else {
        category = 'Class III (Yaygın tümör yükü)';
    }

    let details = `Tümör yatağı alanı: ${d1} mm X ${d2} mm\n`;
    details += `Kanser alanı tümör selülaritesi: %${c}\n`;
    details += `Tümör alanı in situ yüzdesi: %${pis}\n`;
    details += `Pozitif lenf nodu sayısı: ${pn}\n`;
    if (pn > 0) {
        details += `En büyük metastazın çapı: ${dmet} mm\n`;
    } else {
        details += `En büyük metastazın çapı: Lenf nodunda metastaz yok\n`;
    }
    details += `Rezidüel kanser yükü: ${rcb.toFixed(3)}\n`;
    details += `Rezidüel Kanser Yükü Sınıfı: ${category}\n`;

    return { rcb, category, details };
};
