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
    perineuralInvasion: boolean;
    mitoticActivity: string;
    necrosis: boolean;
    includeMarginsLine: boolean;
    marginsTumorPresent: boolean;
    marginsNote: string;
}

export interface LymphNode {
    id: number;
    location: string;
    metastatic: number;
    total: number;
    metastaticTumorSize: string | number;
    ene: boolean;
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

function getTumorDiagnosisName(size: number): string {
    return size > 10 ? 'Tiroid papiller karsinom' : 'Tiroid papiller mikrokarsinom';
}

function normalizeEncapsulation(enc: string): string {
    if (enc === 'vardır') return 'vardır';
    if (enc === 'Kısmen vardır') return 'vardır (kısmen)';
    return 'yoktur';
}

function sentence(value: string): string {
    if (!value) return '';
    const v = String(value).trim();
    if (!v) return '';
    return /[.!?]$/.test(v) ? v : v + '.';
}

function hasEtOrCapsuleAdhesion(t: Tumor): boolean {
    const opts = t.capsuleEtOptions || [];
    return opts.includes('Tiroid dışı invazyon vardır') || opts.includes('Tiroid kapsülüne yapışıktır');
}

export function requiresMarginsLine(t: Tumor): boolean {
    return hasEtOrCapsuleAdhesion(t) || !!(t.strapMuscle && t.strapMuscle.trim());
}

export function syncTumorDerivedFields(t: Tumor): void {
    if (!t.capsuleEtOptions || !t.capsuleEtOptions.length) {
        t.capsuleEtOptions = ['Tiroid dışı invazyon yoktur'];
    }

    // Tiroid dışı invazyon yoksa Çizgili kas alanı ilgili tümör için temizlenir.
    if (!t.capsuleEtOptions.includes('Tiroid dışı invazyon vardır')) {
        t.strapMuscle = '';
    }

    // Kural: Çizgili kas durumu, tiroid dışı invazyon veya kapsüle yapışıklık varsa
    // cerrahi sınır satırı aynı tümör odağına otomatik eklenir.
    if (requiresMarginsLine(t)) {
        t.includeMarginsLine = true;
    }
}

export function syncAllTumorsDerivedFields(tumors: Tumor[]): void {
    tumors.forEach(syncTumorDerivedFields);
}

function generateFindingsText(t: Tumor, indent: string = ''): string {
    let text = '';

    text += indent + sentence('Tümörde enkapsülasyon ' + normalizeEncapsulation(t.encapsulation)) + '\n';

    let lvi = 'Lenfatik ve/veya venöz invazyon: ' + t.lvInvasion;
    if (t.lvInvasion === 'VARDIR') {
        const lviTypes = [];
        if (t.lymphaticInvasion) lviTypes.push('lenfatik invazyon');
        if (t.angioinvasion) lviTypes.push('anjioinvazyon');
        if (lviTypes.length) lvi += '. İzlenen invazyon tipi: ' + lviTypes.join(' ve ');
        else lvi += '. İnvazyon tipi belirtilmemiştir';
    }
    text += indent + sentence(lvi) + '\n';

    text += indent + sentence('Perinöral invazyon ' + (t.perineuralInvasion ? 'VARDIR' : 'yoktur')) + '\n';

    if (t.mitoticActivity && t.mitoticActivity !== '0') {
        text += indent + sentence('Mitotik aktivite 2 mm² alanda ' + t.mitoticActivity + ' olarak izlenmiştir') + '\n';
    } else {
        text += indent + sentence('Mitotik aktivite izlenmemiştir') + '\n';
    }

    text += indent + sentence('Nekroz ' + (t.necrosis ? 'izlenmiştir' : 'yoktur')) + '\n';

    const opts = t.capsuleEtOptions && t.capsuleEtOptions.length ? t.capsuleEtOptions : ['Tiroid dışı invazyon yoktur'];
    opts.forEach(opt => {
        text += indent + sentence(opt) + '\n';
    });

    if (opts.includes('Tiroid dışı invazyon vardır')) {
        if (t.strapMuscle && t.strapMuscle.trim()) {
            let strapText = String(t.strapMuscle).trim();
            if (strapText === 'invazyonu yoktur') strapText = 'Çizgili kas invazyonu yoktur';
            if (strapText === 'invazyonu VARDIR') strapText = 'Çizgili kas invazyonu VARDIR';
            text += indent + sentence(strapText.replace('vardır', 'VARDIR')) + '\n';
        }
    }

    if (t.includeMarginsLine) {
        text += indent + sentence(t.marginsTumorPresent ? 'Cerrahi sınırlarda tümör VARDIR' : 'Cerrahi sınırlarda tümör yoktur') + '\n';
        if (t.marginsTumorPresent && t.marginsNote && t.marginsNote.trim()) {
            text += indent + sentence('Cerrahi sınır açıklaması: ' + t.marginsNote.trim()) + '\n';
        }
    }

    return text;
}

function collapseTripleNewlines(text: string): string {
    while (text.indexOf('\n\n\n') !== -1) {
        text = text.replace('\n\n\n', '\n\n');
    }
    return text;
}

export function generateThyroidReport(state: ThyroidReportState): string {
    // Make a copy of tumors to safely sync derived fields without side effects on components direct state rendering
    const tumorsCopy = JSON.parse(JSON.stringify(state.tumors)) as Tumor[];
    syncAllTumorsDerivedFields(tumorsCopy);
    
    let report = '';

    report += state.specimenType + ':\n';
    const numericTumorSizes = tumorsCopy.map(t => Number(t.size)).filter(v => Number.isFinite(v) && v > 0);
    const maxSize = numericTumorSizes.length ? Math.max(...numericTumorSizes) : 0;
    report += sentence(maxSize > 0 ? getTumorDiagnosisName(maxSize) : 'Tiroid papiller karsinom') + '\n';
    if (state.freeNote && state.freeNote.trim()) {
        report += sentence(state.freeNote.trim()) + '\n';
    }

    if (tumorsCopy.length === 1) {
        const t = tumorsCopy[0];
        if (t.location) report += sentence('Tümör ' + t.location + ' yerleşimlidir') + '\n';
        if (Number(t.size) > 0) report += sentence("Tümör çapı " + t.size + " mm'dir") + '\n';
        if (t.subtypes.length) report += sentence('Tümör ' + t.subtypes.join(' ve ') + ' histolojisindedir') + '\n';
        if (t.sample) report += sentence('Örnek No: ' + t.sample) + '\n';
        report += '\n' + generateFindingsText(t);
    } else if (tumorsCopy.length > 1) {
        report += sentence('Tümör odaklılığı ' + tumorsCopy.length + ' odaklıdır. Multifokal tümör VARDIR') + '\n\n';
        report += 'Tümör odakları:\n';
        tumorsCopy.forEach((t, i) => {
            const dx = getTumorDiagnosisName(Number(t.size));
            report += (i + 1) + '. Tümör: ' + dx + '\n';
            if (t.location) report += '  ' + sentence('Yerleşim: ' + t.location) + '\n';
            if (Number(t.size) > 0) report += '  ' + sentence('Çap: ' + t.size + ' mm') + '\n';
            if (t.subtypes.length) report += '  ' + sentence('Histoloji: ' + t.subtypes.join(' ve ')) + '\n';
            if (t.sample) report += '  ' + sentence('Örnek No: ' + t.sample) + '\n';
            report += generateFindingsText(t, '  ');
            report += '\n';
        });
    }

    if (state.lymphNodes.length) {
        report += '\nLenf nodları:\n';
        state.lymphNodes.forEach(ln => {
            const total = Number(ln.total || 0);
            const meta = Number(ln.metastatic || 0);
            const locPrefix = ln.location ? ln.location + ' yerleşiminden ' : '';
            if (meta > 0) {
                const metaSize = ln.metastaticTumorSize != null ? String(ln.metastaticTumorSize).trim() : '';
                const ene = ln.ene != null ? !!ln.ene : !!ln.pericapsularInvasion;
                const eneSize = ln.eneSize != null ? String(ln.eneSize).trim() : '';

                report += sentence(locPrefix + total + ' lenf nodunun ' + meta + "'inde metastaz VARDIR (" + meta + '/' + total + ')') + ' ';
                if (metaSize) {
                    report += sentence((meta > 1 ? 'En büyük metastatik tümör çapı ' : 'Metastatik tümör çapı ') + metaSize + ' mm') + ' ';
                }
                report += sentence('Ekstranodal yayılım (ENE) ' + (ene ? 'VARDIR' : 'yoktur'));
                if (ene && eneSize) {
                    report += ' ' + sentence('ENE çapı ' + eneSize + ' mm');
                }
                report += '\n';
            } else {
                report += sentence(locPrefix + total + ' lenf nodu izlenmiştir. Metastaz yoktur (0/' + total + ')') + '\n';
            }
        });
    }

    if (state.backgroundThyroid.length) {
        report += '\n' + sentence('Tümör dışı tiroid parankiminde ' + state.backgroundThyroid.join(', ') + ' izlenmiştir') + '\n';
    }

    return collapseTripleNewlines(report.trim());
}
