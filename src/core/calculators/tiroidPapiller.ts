export interface Tumor {
    id: number;
    location: string;
    size: string | number;
    sample: string;
    subtypes: string[];
    encapsulation: string;
    capsuleEtOptions: string[];
    strapMuscle: string;
    lvInvasion: string;
    lymphaticInvasion: boolean;
    angioinvasion: boolean;
    perineuralInvasion: boolean | null;
    mitoticActivity: string;
    necrosis: boolean | null;
    includeMarginsLine: boolean;
    marginsTumorPresent: boolean | null;
    marginsNote: string;
}

export interface LymphNode {
    id: number;
    location: string;
    metastatic: number | '';
    total: number | '';
    metastaticTumorSize: string | number;
    ene: boolean | null;
    eneSize: string | number;
    pericapsularInvasion?: boolean;
}

export interface ThyroidReportState {
    specimenType: string;
    tumors: Tumor[];
    lymphNodes: LymphNode[];
    backgroundThyroid: string[];
    freeNote: string;
}

export const HISTOLOGIC_SUBTYPES = [
    'Klasik papiller karsinom',
    'Papiller karsinom (alt tip belirtilmedi)',
    'İnfiltratif foliküler alt tip',
    'Onkositik papiller alt tip',
    'Warthin benzeri alt tip',
    'Tall cell alt tip',
    'Hobnail alt tip',
    'Solid alt tip',
    'NIFTP',
    'Diffüz sklerozan alt tip'
];

export const BACKGROUND_THYROID_OPTIONS = [
    'Nodüler guatr',
    'Fokal lenfositik tiroidit',
    'Yaygın lenfositik tiroidit',
    'Hashimoto tiroiditi',
    'Kolloidden zengin'
];

export const TUMOR_LOCATION_EXAMPLES = [
    'Sağ lob', 'Sol lob', 'İstmus', 'Sağ lob üst pol', 'Sağ lob istmus bileşkesi', 'Sağ lob alt pol',
    'Sol lob üst pol', 'Sol lob istmus bileşkesi', 'Sol lob alt pol', 'İstmus sağ lateral', 'İstmus sol lateral'
];

export const CAPSULE_ET_OPTIONS = [
    'Tiroid kapsülüne yapışıktır',
    'Tiroid dışı invazyon vardır',
    'Tiroid dışı invazyon yoktur'
];

export const STRAP_OPTIONS = [
    'Çizgili kas invazyonu yoktur',
    'Çizgili kas invazyonu VARDIR'
];

export function createEmptyTumor(id: number): Tumor {
    return {
        id, location: '', size: '', sample: '', subtypes: [], encapsulation: '',
        capsuleEtOptions: [], strapMuscle: '', lvInvasion: '', lymphaticInvasion: false,
        angioinvasion: false, perineuralInvasion: null, mitoticActivity: '', necrosis: null,
        includeMarginsLine: false, marginsTumorPresent: null, marginsNote: ''
    };
}

export function createEmptyLymphNode(id: number): LymphNode {
    return { id, location: '', metastatic: '', total: '', metastaticTumorSize: '', ene: null, eneSize: '' };
}

const NIFTP_DIAGNOSIS = 'Papiller benzeri nükleer özellikler gösteren non-invaziv folliküler tiroid neoplazisi (NIFTP)';
const UNSPECIFIED_PTC = 'Papiller karsinom (alt tip belirtilmedi)';
const ETE_PRESENT = 'Tiroid dışı invazyon vardır';

function getTumorDiagnosisName(size?: number): string {
    return size !== undefined && size <= 10 ? 'Tiroid papiller mikrokarsinom' : 'Tiroid papiller karsinom';
}

function positiveMeasurement(input: string | number): number | undefined {
    const numeric = Number(String(input).trim().replace(',', '.'));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function sentence(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /[.!?]$/.test(trimmed) ? trimmed : trimmed + '.';
}

export function requiresMarginsLine(t: Tumor): boolean {
    return t.capsuleEtOptions.includes(ETE_PRESENT) ||
        t.capsuleEtOptions.includes('Tiroid kapsülüne yapışıktır') || !!t.strapMuscle.trim();
}

export function syncTumorDerivedFields(t: Tumor): void {
    if (!t.capsuleEtOptions.includes(ETE_PRESENT)) t.strapMuscle = '';
    if (requiresMarginsLine(t)) t.includeMarginsLine = true;
}

export function syncAllTumorsDerivedFields(tumors: Tumor[]): void {
    tumors.forEach(syncTumorDerivedFields);
}

export function hasThyroidFocusDiagnosis(t: Tumor): boolean {
    const known = t.subtypes.filter(s => HISTOLOGIC_SUBTYPES.includes(s));
    return known.includes('NIFTP') ? !known.some(s => s !== 'NIFTP') : known.length > 0;
}

export function hasThyroidFocusInput(t: Tumor): boolean {
    return !!(t.location.trim() || String(t.size).trim() || t.sample.trim() ||
        t.subtypes.length || t.encapsulation || t.lvInvasion || t.capsuleEtOptions.length ||
        t.perineuralInvasion !== null || t.necrosis !== null || t.mitoticActivity.trim() ||
        t.marginsTumorPresent !== null);
}

export function hasValidLymphNodeCounts(ln: LymphNode): boolean {
    return typeof ln.total === 'number' && Number.isInteger(ln.total) && ln.total > 0 &&
        typeof ln.metastatic === 'number' && Number.isInteger(ln.metastatic) &&
        ln.metastatic >= 0 && ln.metastatic <= ln.total;
}

function generateFindings(t: Tumor): string[] {
    const lines: string[] = [];
    if (t.encapsulation.trim()) {
        const value = t.encapsulation === 'Kısmen vardır' ? 'vardır (kısmen)' : t.encapsulation.toLocaleLowerCase('tr');
        lines.push('Tümörde enkapsülasyon ' + value);
    }
    if (t.lvInvasion.trim()) {
        let lvi = 'Lenfatik ve/veya venöz invazyon: ' + t.lvInvasion;
        if (t.lvInvasion === 'VARDIR') {
            const types = [t.lymphaticInvasion && 'lenfatik invazyon', t.angioinvasion && 'anjioinvazyon'].filter(Boolean);
            if (types.length) lvi += '. İzlenen invazyon tipi: ' + types.join(' ve ');
        }
        lines.push(lvi);
    }
    if (typeof t.perineuralInvasion === 'boolean') lines.push('Perinöral invazyon ' + (t.perineuralInvasion ? 'VARDIR' : 'yoktur'));
    if (/^\d+$/.test(t.mitoticActivity.trim())) {
        lines.push('Mitotik aktivite: ' + Number(t.mitoticActivity) + ' mitoz/2 mm²');
    }
    if (typeof t.necrosis === 'boolean') lines.push('Nekroz ' + (t.necrosis ? 'izlenmiştir' : 'yoktur'));
    lines.push(...t.capsuleEtOptions.filter(opt => CAPSULE_ET_OPTIONS.includes(opt)));
    if (t.capsuleEtOptions.includes(ETE_PRESENT) && t.strapMuscle.trim()) {
        lines.push(t.strapMuscle.trim().replace(/^invazyonu /, 'Çizgili kas invazyonu '));
    }
    if ((t.includeMarginsLine || requiresMarginsLine(t)) && typeof t.marginsTumorPresent === 'boolean') {
        lines.push(t.marginsTumorPresent ? 'Cerrahi sınırlarda tümör VARDIR' : 'Cerrahi sınırlarda tümör yoktur');
        if (t.marginsTumorPresent && t.marginsNote.trim()) lines.push('Cerrahi sınır açıklaması: ' + t.marginsNote.trim());
    }
    return lines.map(sentence);
}

function describeFocus(t: Tumor, singleFocus: boolean): string[] {
    const lines: string[] = [];
    if (t.location.trim()) lines.push(singleFocus ? 'Tümör ' + t.location.trim() + ' yerleşimlidir' : 'Yerleşim: ' + t.location.trim());
    if (positiveMeasurement(t.size) !== undefined) {
        lines.push(singleFocus ? "Tümör çapı " + t.size + " mm’dir" : 'Çap: ' + t.size + ' mm');
    }
    const subtypes = t.subtypes.filter(s => HISTOLOGIC_SUBTYPES.includes(s) && s !== 'NIFTP' && s !== UNSPECIFIED_PTC);
    if (subtypes.length) lines.push(singleFocus ? 'Tümör ' + subtypes.join(' ve ') + ' histolojisindedir' : 'Histoloji: ' + subtypes.join(' ve '));
    if (t.sample.trim()) lines.push('Örnek No: ' + t.sample.trim());
    return [...lines.map(sentence), ...generateFindings(t)];
}

export function generateThyroidReport(state: ThyroidReportState): string {
    const confirmed = state.tumors.filter(hasThyroidFocusDiagnosis);
    const carcinomas = confirmed.filter(t => !t.subtypes.includes('NIFTP'));
    const niftps = confirmed.filter(t => t.subtypes.includes('NIFTP'));
    const sections: string[] = [];
    const diagnoses: string[] = [];

    if (carcinomas.length) {
        const sizes = carcinomas.map(t => positiveMeasurement(t.size));
        // Call the whole case a microcarcinoma only if every carcinoma focus has a valid size.
        const maxSize = sizes.every(s => s !== undefined) ? Math.max(...sizes as number[]) : undefined;
        diagnoses.push(sentence(getTumorDiagnosisName(maxSize)));
    }
    if (niftps.length) diagnoses.push(sentence(NIFTP_DIAGNOSIS));
    if (state.freeNote.trim()) diagnoses.push(sentence(state.freeNote));
    if (diagnoses.length) sections.push(diagnoses.join('\n'));

    if (carcinomas.length > 1) {
        sections.push(sentence('Papiller karsinom ' + carcinomas.length + ' odaklıdır. Multifokal papiller karsinom vardır'));
    }
    if (confirmed.length === 1) {
        const lines = describeFocus(confirmed[0], true);
        if (lines.length) sections.push(lines.join('\n'));
    } else if (confirmed.length > 1) {
        if (carcinomas.length) {
            sections.push('Papiller karsinom odakları:\n' + carcinomas.map((t, i) =>
                [i + 1 + '. Odak: ' + getTumorDiagnosisName(positiveMeasurement(t.size)),
                    ...describeFocus(t, false).map(line => '  ' + line)].join('\n')).join('\n\n'));
        }
        if (niftps.length) {
            sections.push('NIFTP odakları:\n' + niftps.map((t, i) =>
                [i + 1 + '. NIFTP odağı', ...describeFocus(t, false).map(line => '  ' + line)].join('\n')).join('\n\n'));
        }
    }

    const nodeLines = state.lymphNodes.filter(hasValidLymphNodeCounts).map(ln => {
        const total = ln.total as number;
        const meta = ln.metastatic as number;
        const loc = ln.location.trim() ? ln.location.trim() + ' yerleşiminden ' : '';
        if (meta === 0) return sentence(loc + total + ' lenf nodu izlenmiştir. Metastaz yoktur (0/' + total + ')');
        const lines = [loc + total + ' lenf nodunun ' + meta + "'inde metastaz VARDIR (" + meta + '/' + total + ')'];
        if (positiveMeasurement(ln.metastaticTumorSize) !== undefined) {
            lines.push((meta > 1 ? 'En büyük metastatik tümör çapı ' : 'Metastatik tümör çapı ') + ln.metastaticTumorSize + ' mm');
        }
        const ene = ln.ene ?? ln.pericapsularInvasion;
        if (typeof ene === 'boolean') lines.push('Ekstranodal yayılım (ENE) ' + (ene ? 'VARDIR' : 'yoktur'));
        if (ene && positiveMeasurement(ln.eneSize) !== undefined) lines.push('ENE çapı ' + ln.eneSize + ' mm');
        return lines.map(sentence).join(' ');
    });
    if (nodeLines.length) sections.push('Lenf nodları:\n' + nodeLines.join('\n'));
    if (state.backgroundThyroid.length) {
        sections.push(sentence('Tümör dışı tiroid parankiminde ' + state.backgroundThyroid.join(', ') + ' izlenmiştir'));
    }
    const body = sections.join('\n\n');
    return body && state.specimenType.trim() ? state.specimenType.trim() + ':\n' + body : body;
}
