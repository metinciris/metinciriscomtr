export type BmiCategory = 'Zayıf' | 'Normal Kilolu' | 'Fazla Kilolu' | 'I. Derece Obez' | 'II. Derece Obez' | 'III. Derece Obez (Morbid)';

export interface BmiResult {
    bmi: number;
    category: BmiCategory;
    color: string;
}

export const calculateBMI = (weight: number, heightCm: number): BmiResult => {
    const heightInMeters = heightCm / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    let category: BmiCategory;
    let color: string;

    if (bmi < 18.5) {
        category = 'Zayıf';
        color = 'text-blue-500';
    } else if (bmi < 25) {
        category = 'Normal Kilolu';
        color = 'text-green-500';
    } else if (bmi < 30) {
        category = 'Fazla Kilolu';
        color = 'text-yellow-500';
    } else if (bmi < 35) {
        category = 'I. Derece Obez';
        color = 'text-orange-500';
    } else if (bmi < 40) {
        category = 'II. Derece Obez';
        color = 'text-red-500';
    } else {
        category = 'III. Derece Obez (Morbid)';
        color = 'text-red-700';
    }

    return { bmi, category, color };
};

export const getBmiBodyWidth = (bmi: number): number => {
    if (bmi < 18.5) return 30 + (bmi / 18.5) * 20; // 30-50 arası (Zayıf)
    if (bmi < 25) return 50 + ((bmi - 18.5) / 6.5) * 15; // 50-65 arası (Normal)
    if (bmi < 30) return 65 + ((bmi - 25) / 5) * 20; // 65-85 arası (Fazla Kilolu)
    return Math.min(85 + ((bmi - 30) / 10) * 35, 130); // 85-130 arası (Obez)
};
