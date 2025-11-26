export enum BiopsyLocation {
    Ozefagus = 'Özofagus',
    Mide = 'Mide',
    Duodenum = 'Duodenum/Bulbus',
    Ileum = 'İleum',
    Kolon = 'Kolon',
}

export const PredefinedNotes = {
    [BiopsyLocation.Ozefagus]: [
        'Displazi yoktur',
        'Goblet hücre metaplazisi yoktur',
        'Goblet hücre metaplazisi vardır',
        'HP: (-)',
        'Mukozada aktif inflamasyon vardır',
        'Foveolar hiperplazi vardır',
        'Eozinofil yoktur',
        'Ülseröz inflamasyon izlenmiştir',
        'Hiperplastik polip'
    ],
    [BiopsyLocation.Mide]: [
        'Displazi yoktur',
        'Foveolar hiperplazi vardır',
        'Lenfoid folikül vardır',
        'Germinal merkezi aktif lenfoid folikül vardır',
        'Yüzeyel ülser vardır',
        'Fundik glandlarda dilatasyon vardır',
        'Nöroendokrin hücre hiperplazisi yoktur (Sinaptofizin ile)',
        'Lineer nöroendokrin hücre hiperplazisi (Sinaptofizin ile)',
        'Mikronodüler nöroendokrin hücre hiperplazisi (Sinaptofizin ile)'
    ],
    [BiopsyLocation.Duodenum]: [
        'İntraepitelyal lenfosit artışı yoktur',
        'İntraepitelyal lenfosit artışı vardır',
        'Villuslarda atrofi yoktur',
        'Villuslarda hafif atrofi vardır',
        'Villuslarda belirgin atrofi vardır',
        'Villuslarda komplet atrofi vardır',
        'Displazi yoktur',
        'Gastrik foveolar metaplazi vardır',
        'PNL aktivasyonu vardır',
        'Brunner gland hiperplazisi vardır'
    ],
    [BiopsyLocation.Ileum]: [
        'Lenfoid hiperplazi vardır',
        'Displazi yoktur'
    ],
    [BiopsyLocation.Kolon]: [
        'Displazi yoktur',
        'Aktivasyon yoktur',
        'Aktivasyon mevcuttur',
        'Kript distorsiyonu yoktur',
        'Kript distorsiyonu vardır',
        'Bazal plazmositoz yoktur',
        'Bazal plazmositoz vardır',
        'Hiperplastik polip',
        'Sessile serrated lezyon',
        'Tubuler adenom',
        'Tubulovillöz adenom',
        'Villöz adenom'
    ],
};

export const DiagnosisOptions = {
    [BiopsyLocation.Ozefagus]: [
        'Normal görünümlü özofagus mukozası',
        'Reflü özofajit',
        'Barrett özofagus',
        'Eozinofilik özofajit',
        'Kandida özofajiti',
        'İnflamasyon bulguları',
        'Hiperplastik polip',
    ],
    [BiopsyLocation.Mide]: [
        'Normal görünümlü mide mukozası',
        'Kronik gastrit',
        'Kronik aktif gastrit',
        'Reaktif gastropati',
        'Atrofik gastrit',
        'İntestinal metaplazi',
        'Fundik gland polibi',
        'Hiperplastik polip',
        'Nöroendokrin hücre hiperplazisi',
    ],
    [BiopsyLocation.Duodenum]: [
        'Normal görünümlü duodenum mukozası',
        'Kronik duodenit',
        'Kronik aktif duodenit',
        'Çölyak hastalığı (Marsh 1)',
        'Çölyak hastalığı (Marsh 2)',
        'Çölyak hastalığı (Marsh 3a)',
        'Çölyak hastalığı (Marsh 3b)',
        'Çölyak hastalığı (Marsh 3c)',
        'Gastrik foveolar metaplazi',
        'Brunner gland hiperplazisi',
    ],
    [BiopsyLocation.Ileum]: [
        'Normal görünümlü terminal ileum mukozası',
        'Kronik ileit',
        'Kronik aktif ileit',
        'Lenfoid hiperplazi',
    ],
    [BiopsyLocation.Kolon]: [
        'Normal görünümlü kolon mukozası',
        'Kronik kolit',
        'Kronik aktif kolit',
        'Mikroskopik kolit (Kollajenöz)',
        'Mikroskopik kolit (Lenfositik)',
        'Hiperplastik polip',
        'Sessile serrated lezyon',
        'Tubuler adenom',
        'Tubulovillöz adenom',
        'Villöz adenom',
    ],
};

export const DuodenumDiagnosisMappings = {
    Normal: 'Normal görünümlü duodenum mukozası',
    KronikDuodenit: 'Kronik duodenit',
    KronikAktifDuodenit: 'Kronik aktif duodenit',
    CeliacMarsh1: 'Çölyak hastalığı (Marsh 1)',
    CeliacMarsh2: 'Çölyak hastalığı (Marsh 2)',
    CeliacMarsh3a: 'Çölyak hastalığı (Marsh 3a)',
    CeliacMarsh3b: 'Çölyak hastalığı (Marsh 3b)',
    CeliacMarsh3c: 'Çölyak hastalığı (Marsh 3c)',
    GastrikFoveolarMetaplazi: 'Gastrik foveolar metaplazi',
    BrunnerGlandHiperplazisi: 'Brunner gland hiperplazisi',
};

export const LocationOptions = {
    [BiopsyLocation.Ozefagus]: ['Proksimal', 'Orta', 'Distal', 'Gastroözofageal bileşke'],
    [BiopsyLocation.Mide]: ['Kardia', 'Fundus', 'Korpus', 'Antrum', 'Pilor', 'İnsisura angularis'],
    [BiopsyLocation.Duodenum]: ['Bulbus', 'D2', 'D3'],
    [BiopsyLocation.Ileum]: ['Terminal ileum'],
    [BiopsyLocation.Kolon]: ['Çekum', 'Asendan kolon', 'Hepatik fleksura', 'Transvers kolon', 'Splenik fleksura', 'İnen kolon', 'Sigmoid kolon', 'Rektum', 'Anal kanal'],
};

export type Severity = '-' | '+' | '++' | '+++' | 'Yapılmadı' | null;

export interface Biopsy {
    id: string;
    location: BiopsyLocation;
    subLocation: string;
    sequence: number;
    findings: {
        inflammation: Severity;
        activation: Severity;
        atrophy: Severity;
        hp: Severity;
        intestinalMetaplasia: Severity;
    };
    additionalFeatures: string[];
    customNotes: string[];
    normalAppearance: boolean;
    edematous: boolean;
    fundicGlandPolyp: boolean;
    additionalFeatureText: string;
    eosinophilCount: string;
    customDiagnosis: string;
    duodenumDiagnosis: string;
    pieceCount: number;
    stains: string[];
    severity: string | null;
}
