import React from 'react';

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
        'Aktif inflamasyon vardır',
        'Kript absesi vardır',
        'Kript distorsiyonu vardır',
        'Granülom yapısı izlenmemiştir'
    ],
    [BiopsyLocation.Kolon]: [
        'Displazi yoktur',
        'Düşük dereceli displazi vardır',
        'Yüksek dereceli displazi vardır',
        'Aktif inflamasyon vardır',
        'Kript absesi vardır',
        'Kript distorsiyonu vardır',
        'Granülom yapısı izlenmemiştir',
        'Lenfoid agregat vardır'
    ]
};

export enum AdditionalFeature {
    Polyp = 'polip',
    Ulcer = 'ülser',
    Mass = 'kitle',
    Erosion = 'erozyon',
    Lesion = 'lezyon',
    Tumor = 'tümör',
}

export interface BiopsyFindings {
    inflammation: string;
    activation: string;
    atrophy: string;
    hp: string;
    intestinalMetaplasia: string;
    eosinophilCount?: string;
}

export interface StomachFeatures {
    foveolarHyperplasia: boolean;
    lymphoidFollicle: boolean;
    activeLymphoidFollicle: boolean;
    superficialUlcer: boolean;
    noDysplasia: boolean;
    fundicGlandDilatation: boolean;
    synaptophysin?: 'none' | 'linear' | 'micronodular';
}

export interface EsophagusFeatures {
    gobletCellMetaplasiaPresent: boolean;
    gobletCellMetaplasiaAbsent: boolean;
    hpNegative: boolean;
    noDysplasia: boolean;
    activeInflammation: boolean;
    foveolarHyperplasia: boolean;
    noEosinophils: boolean;
    ulcerativeInflammation: boolean;
    hyperplasticPolyp: boolean;
    eosinophilsPresent: boolean;
    eosinophilCount?: string;
}

export interface DuodenumFeatures {
    marsh0: boolean;
    marsh1: boolean;
    marsh3a: boolean;
    marsh3b: boolean;
    marsh3c: boolean;
    noIntraepithelialLymphocytes: boolean;
    hasIntraepithelialLymphocytes: boolean;
    noVillusAtrophy: boolean;
    mildVillusAtrophy: boolean;
    severeVillusAtrophy: boolean;
    completeVillusAtrophy: boolean;
    eosinophilCount?: string;
}

export interface Biopsy {
    id: string;
    location: BiopsyLocation;
    subLocation: string;
    sequence: number;
    findings: BiopsyFindings;
    additionalFeatures: AdditionalFeature[];
    additionalFeatureText: string;
    customNotes: string[];
    customDiagnosis?: string;
    normalAppearance: boolean;
    edematous: boolean;
    fundicGlandPolyp: boolean;
    stomachFeatures?: StomachFeatures;
    esophagusFeatures?: EsophagusFeatures;
    duodenumFeatures?: DuodenumFeatures;
    stains?: {
        pas?: boolean;
        pasAB?: boolean;
        warthinStarry?: boolean;
        synaptophysin?: boolean;
        cd3?: boolean;
    };
    eosinophilCount?: string;
    customStains?: string[];
    ibdDca?: {
        d: number;
        c: number;
        a: number;
    };
    showIbdDca?: boolean;
}

export const DiagnosisOptions = {
    [BiopsyLocation.Ozefagus]: [
        'Normal görünümlü özofagus mukozası',
        'Çok katlı yassı epitel - Glandüler mukoza geçişi',
        'Aktif özofajit',
        'Glandüler mukoza',
        'Ülseröz inflamasyon'
    ],
    [BiopsyLocation.Mide]: [
        'Normal görünümlü mide mukozası',
        'Normal görünümlü korpus mukozası',
        'Normal görünümlü antrum mukozası',
        'Ödemli mide mukozası',
        'Ülseröz gastrit',
        'Eroziv gastrit',
        'Hiperplastik polip',
        'Fundik gland polipi',
        'Fundik gland polipleri',
        'Tübüler adenom'
    ],
    [BiopsyLocation.Duodenum]: [
        'Normal',
        'Ödemli Normal',
        'Kronik nonspesifik',
        'Ülseröz inflamasyon',
        'Gastrik foveolar metaplazi',
        'Hiperplastik polip',
        'MARSH-1',
        'MARSH-3a',
        'MARSH-3b',
        'MARSH-3c'
    ],
    [BiopsyLocation.Ileum]: [
        'Normal görünümlü ileum mukozası',
        'Ödemli ileum mukozası',
        'Aktif ileit',
        'Hafif aktif ileit',
        'Lenfoid hiperplazi',
        'Ülseröz ileit'
    ],
    [BiopsyLocation.Kolon]: [
        'Normal görünümlü kolon mukozası',
        'Normal görünümlü rektum mukozası',
        'Yüzeyel kolon mukozası',
        'Ödemli kolon mukozası',
        'Hiperplastik polip',
        'Tübüler adenom',
        'Tübülovillöz adenom',
        'İnflamatuar psödopolip',
        'Kolorektal adenokarsinom'
    ]
};

export const LocationOptions = {
    [BiopsyLocation.Ozefagus]: {
        locations: ['Özofagus', 'Distal özofagus', 'Z çizgisi'],
        subLocations: ['Polip', 'Kitle', 'Tümör', 'Ülser', 'Lezyon']
    },
    [BiopsyLocation.Mide]: {
        locations: ['Korpus', 'Antrum', 'Kardiya', 'Fundus', 'Mide', 'Anastomoz'],
        subLocations: ['Polip', 'Kitle', 'Tümör', 'Ülser', 'Lezyon']
    },
    [BiopsyLocation.Duodenum]: {
        locations: ['Duodenum', 'Bulbus'],
        subLocations: ['İkinci kısım', 'Polip', 'Ülser', 'Tümör']
    },
    [BiopsyLocation.Ileum]: {
        locations: ['Terminal ileum', 'İleum', 'İlioçekal valv'],
        subLocations: ['Polip', 'Kitle', 'Tümör', 'Ülser', 'Lezyon']
    },
    [BiopsyLocation.Kolon]: {
        locations: [
            'İlioçekal valv',
            'Çekum',
            'Çıkan kolon',
            'Transvers kolon',
            'Hepatik fleksura',
            'İnen kolon',
            'Sigmoid kolon',
            'Rektosigmoid kolon',
            'Rektum',
            'Anastomoz'
        ],
        subLocations: ['Proksimal', 'Orta', 'Distal', 'Polip', 'Kitle', 'Tümör', 'Ülser', 'Lezyon']
    }
};

export interface DuodenumDiagnosisMapping {
    location: string;
    diagnosis: string;
    reportDiagnosis: string;
    notes: string[];
}

export const DuodenumDiagnosisMappings: DuodenumDiagnosisMapping[] = [
    {
        location: 'Duodenum',
        diagnosis: 'Normal',
        reportDiagnosis: 'Normal görünümlü duedonum mukozası',
        notes: [
            'Marsh Tip 0',
            'İntraepitelyal lenfosit artışı yoktur',
            'Villuslarda atrofi yoktur'
        ]
    },
    {
        location: 'Duodenum',
        diagnosis: 'Ödemli Normal',
        reportDiagnosis: 'Ödemli duedonum mukozası',
        notes: [
            'Marsh Tip 0',
            'İntraepitelyal lenfosit artışı yoktur',
            'Villuslarda atrofi yoktur'
        ]
    },
    {
        location: 'Duodenum',
        diagnosis: 'Kronik nonspesifik',
        reportDiagnosis: 'Kronik nonspesifik duedenit',
        notes: []
    },
    {
        location: 'Bulbus',
        diagnosis: 'Normal',
        reportDiagnosis: 'Normal görünümlü bulbus mukozası',
        notes: [
            'Marsh Tip 0',
            'İntraepitelyal lenfosit artışı yoktur',
            'Villuslarda atrofi yoktur'
        ]
    },
    {
        location: 'Bulbus',
        diagnosis: 'Ödemli Normal',
        reportDiagnosis: 'Ödemli bulbus mukozası',
        notes: [
            'Marsh Tip 0',
            'İntraepitelyal lenfosit artışı yoktur',
            'Villuslarda atrofi yoktur'
        ]
    },
    {
        location: 'Bulbus',
        diagnosis: 'Kronik nonspesifik',
        reportDiagnosis: 'Kronik nonspesifik bulbit',
        notes: []
    },
    {
        location: 'Duodenum',
        diagnosis: 'MARSH-1',
        reportDiagnosis: 'Kronik duedenit',
        notes: [
            'Marsh Tip 1',
            'İntraepitelyal lenfosit artışı vardır',
            'Villuslarda atrofi yoktur'
        ]
    },
    {
        location: 'Bulbus',
        diagnosis: 'MARSH-1',
        reportDiagnosis: 'Kronik bulbit',
        notes: [
            'Marsh Tip 1',
            'İntraepitelyal lenfosit artışı vardır',
            'Villuslarda atrofi yoktur'
        ]
    },
    {
        location: 'Duodenum',
        diagnosis: 'MARSH-3a',
        reportDiagnosis: 'Kronik duedenit',
        notes: [
            'Marsh Tip 3a',
            'İntraepitelyal lenfosit artışı vardır',
            'Villuslarda hafif atrofi vardır'
        ]
    },
    {
        location: 'Bulbus',
        diagnosis: 'MARSH-3a',
        reportDiagnosis: 'Kronik bulbit',
        notes: [
            'Marsh Tip 3a',
            'İntraepitelyal lenfosit artışı vardır',
            'Villuslarda hafif atrofi vardır'
        ]
    },
    {
        location: 'Duodenum',
        diagnosis: 'MARSH-3b',
        reportDiagnosis: 'Kronik duedenit',
        notes: [
            'Marsh Tip 3b',
            'İntraepitelyal lenfosit artışı vardır',
            'Villuslarda belirgin atrofi vardır'
        ]
    },
    {
        location: 'Bulbus',
        diagnosis: 'MARSH-3b',
        reportDiagnosis: 'Kronik bulbit',
        notes: [
            'Marsh Tip 3b',
            'İntraepitelyal lenfosit artışı vardır',
            'Villuslarda belirgin atrofi vardır'
        ]
    },
    {
        location: 'Duodenum',
        diagnosis: 'MARSH-3c',
        reportDiagnosis: 'Kronik duedenit',
        notes: [
            'Marsh Tip 3c',
            'İntraepitelyal lenfosit artışı vardır',
            'Villuslarda komplet atrofi vardır'
        ]
    },
    {
        location: 'Bulbus',
        diagnosis: 'MARSH-3c',
        reportDiagnosis: 'Kronik bulbit',
        notes: [
            'Marsh Tip 3c',
            'İntraepitelyal lenfosit artışı vardır',
            'Villuslarda komplet atrofi vardır'
        ]
    }
];
