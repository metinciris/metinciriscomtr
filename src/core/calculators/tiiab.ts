export interface Feature {
    id: string;
    text: string;
    malignant?: boolean;
}

export interface FeatureGroup {
    title: string;
    features: Feature[];
}

export interface Sample {
    id: number;
    type: 'thyroid' | 'other';
    selectedFeatures: string[];
    customInputs: { [key: string]: string };
    diagnosis: string;
    bethesda3Type?: 'nuclear' | 'structural' | 'both' | '';
    bethesda5Type?: string;
    bethesda6Type?: string;
}

export const THYROID_FEATURE_GROUPS: FeatureGroup[] = [
    {
        title: "Örnekleme Yeterliliği",
        features: [
            { id: "adequate-cellularity", text: "Yeterli hücresellik (>=6 grup, >=10 hücre/grup)" },
            { id: "inadequate-cellularity", text: "Yetersiz hücresellik" },
            { id: "cyst-fluid-only", text: "Sadece kist sıvısı" },
            { id: "blood-only", text: "Sadece kan elemanları" },
            { id: "obscure-blood", text: "Obscüre kan/pıhtı artefaktı" },
            { id: "air-drying", text: "Hava kurutma artefaktı" },
            { id: "adequate-colloid", text: "Bol kolloid (hücre sayısından bağımsız yeterli)" }
        ]
    },
    {
        title: "Hücresel Düzenleme",
        features: [
            { id: "monolayer", text: "Monotabakalı/petek benzeri düzenleme" },
            { id: "microfollicular", text: "Mikrofoliküler yapılar" },
            { id: "macrofollicular", text: "Makrofoliküler fragmanlar" },
            { id: "papillary-like", text: "Papiller benzeri yapılar (kor yok)", malignant: true },
            { id: "3d-clusters", text: "3-boyutlu kümeler" },
            { id: "trabecular", text: "Trabeküler düzenleme" },
            { id: "isolated-cells", text: "İzole/dağınık hücreler" },
            { id: "syncytial", text: "Sinsityal kümeler" },
            { id: "insular", text: "İnsüler düzenleme", malignant: true },
            { id: "solid-pattern", text: "Solid patern", malignant: true },
            { id: "papillary-structures", text: "Papiller yapılar (gerçek fibrovasküler kor)", malignant: true },
            { id: "cellular-swirls", text: "Hücresel girdaplar (swirls)", malignant: true }
        ]
    },
    {
        title: "Nükleer Özellikler",
        features: [
            { id: "normal-nuclei", text: "Normal boyutlu yuvarlak nükleuslar" },
            { id: "nuclear-enlargement", text: "Nükleer büyüme" },
            { id: "nuclear-pleomorphism", text: "Nükleer pleomorfizm", malignant: true },
            { id: "nuclear-overlapping", text: "Nükleer overlapping/crowding", malignant: true },
            { id: "nuclear-molding", text: "Nükleer molding", malignant: true },
            { id: "granular-chromatin", text: "Granüler kromatin" },
            { id: "hyperchromatic", text: "Hiperkromatik kromatin" },
            { id: "prominent-nucleoli", text: "Belirgin nükleol" },
            { id: "marginal-nucleoli", text: "Marginal nükleol" },
            { id: "macronucleoli", text: "Makronükleol", malignant: true },
            { id: "binucleation", text: "Binükleasyon" },
            { id: "multinucleation", text: "Multinükleasyon" },
            { id: "irregular-contour", text: "Düzensiz nükleer kontur", malignant: true },
            { id: "oval-nuclei", text: "Oval/elonge nükleuslar", malignant: true },
            { id: "eccentric-nuclei", text: "Eksantrik yerleşimli nükleuslar", malignant: true },
            { id: "nuclear-grooves", text: "Nükleer groovlar (oluklar)", malignant: true },
            { id: "nuclear-inclusions", text: "İntranükleer psödoinklüzyonlar", malignant: true },
            { id: "ground-glass", text: "Buzlu cam kromatin (powdery)", malignant: true },
            { id: "salt-pepper", text: "Tuz-biber kromatin", malignant: true }
        ]
    },
    {
        title: "Sitoplazmik Özellikler",
        features: [
            { id: "scant-cytoplasm", text: "Dar/sınırlı sitoplazma" },
            { id: "moderate-cytoplasm", text: "Orta miktarda sitoplazma" },
            { id: "abundant-granular", text: "Bol granüler sitoplazma" },
            { id: "oncocytic", text: "Onkositik sitoplazma" },
            { id: "focal-oncocytic", text: "Fokal onkositik sitoplazma" },
            { id: "diffuse-oncocytic", text: "Yaygın onkositik sitoplazma" },
            { id: "clear-vacuolar", text: "Berrak/vakuole sitoplazma" },
            { id: "dense-squamoid", text: "Dens/skuamoid sitoplazma" },
            { id: "plasmacytoid", text: "Plazmositoid sitoplazma" },
            { id: "histiocytoid", text: "Histiositoid özellikler" },
            { id: "hemosiderin", text: "Sitoplazmik hemosiderin" },
            { id: "lipofuscin", text: "Sitoplazmik lipofusin" },
            { id: "columnar", text: "Columnar hücre özellikleri", malignant: true },
            { id: "flame-cells", text: "Flame cells" },
            { id: "hobnail", text: "Hobnail hücreler", malignant: true },
            { id: "tall-cell", text: "Tall cell özellikleri", malignant: true }
        ]
    },
    {
        title: "Kalsifikasyonlar",
        features: [
            { id: "dystrophic-calc", text: "Distrofik kalsifikasyon" },
            { id: "microcalcifications", text: "Mikrokalsifikasyonlar", malignant: true },
            { id: "laminar-bodies", text: "Lameller cisimcikler" },
            { id: "calcified-colloid", text: "Kalsifiye kolloid" },
            { id: "psammoma", text: "Psammom cisimcikleri", malignant: true }
        ]
    },
    {
        title: "Zemin Özellikleri",
        features: [
            { id: "thin-colloid", text: "Bol ince/sulu kolloid" },
            { id: "thick-colloid", text: "Kalın/dens kolloid" },
            { id: "az-kolloid", text: "Az kolloid" },
            { id: "dejenere-kolloid", text: "Dejenere kolloid" },
            { id: "kolloid-yok", text: "Kolloid yok" },
            { id: "lymphocytes", text: "Değişik maturasyonda lenfositler" },
            { id: "histiocytes", text: "Köpüksü makrofajlar" },
            { id: "hemosiderin-macrophages", text: "Hemosiderinli makrofajlar" },
            { id: "multinuclear-giant", text: "Multinükleer dev hücreler" },
            { id: "multinuclear-giant-cell", text: "Multinükleer dev hücre" },
            { id: "bubble-gum", text: "Bubble-gum kolloid", malignant: true },
            { id: "necrosis", text: "Nekroz", malignant: true },
            { id: "mitotic-figures", text: "Mitotik figürler", malignant: true },
            { id: "zemin-diger", text: "Diğer (Görülmedi ise seçme)" }
        ]
    },
    {
        title: "Zemin Özellikleri (Diğer)",
        features: [
            { id: "germinal-centers", text: "Germinal merkez fragmanları" },
            { id: "plasma-cells", text: "Plazma hücreleri" },
            { id: "osteoclast-giant", text: "Osteoklast benzeri dev hücreler" },
            { id: "neutrophils", text: "Nötrofiller" },
            { id: "eosinophils", text: "Eozinofiller" },
            { id: "apoptosis", text: "Apoptoz" },
            { id: "amyloid", text: "Amyloid benzeri materyal", malignant: true },
            { id: "hyaline", text: "Hyalin materyal" },
            { id: "stromal-fragment", text: "Stromal fragman" }
        ]
    },
    {
        title: "Özel Hücre Tipleri",
        features: [
            { id: "cyst-lining", text: "Kist döşeyen hücreler" },
            { id: "regenerative", text: "Rejenere/reparatif değişiklikler" },
            { id: "squamous-metaplasia", text: "Skuamöz metaplazi", malignant: true },
            { id: "oncocytic-metaplasia", text: "Onkositik metaplazi" },
            { id: "spindle-cells", text: "İğsi hücreler" },
            { id: "epithelioid-granulomas", text: "Epiteloid granülomlar" },
            { id: "transgressing-vessels", text: "Transgressing damarlar", malignant: true },
            { id: "small-cell", text: "Küçük hücreli patern", malignant: true },
            { id: "anaplastic", text: "Anaplastik/pleomorfik hücreler", malignant: true }
        ]
    },
    {
        title: "Diğer Özellikler",
        features: [
            { id: "naked-nuclei", text: "Çıplak nükleuslar" },
            { id: "lymphoglandular", text: "Lenfoglandülar cisimcikler" },
            { id: "fibrous-tissue", text: "Fibröz doku fragmanları" },
            { id: "muscle-tissue", text: "Çizgili kas dokusu" },
            { id: "respiratory-epithelium", text: "Solunum epiteli" },
            { id: "ultrasound-gel", text: "Ultrason jel artefaktı" },
            { id: "epidermis-fragment", text: "Epidermis fragmanı" },
            { id: "sutur-lifleri", text: "Sütür lifleri" },
            { id: "foreign-body-giant", text: "Yabancı cisim tipi dev hücreler" },
            { id: "colloid-giant", text: "Kolloid ilişkili dev hücre" }
        ]
    },
    {
        title: "Hücre Bloğu",
        features: [
            { id: "insufficient-pellet", text: "Bloklamada yeterli çökelti oluşmadı" },
            { id: "acellular", text: "Asellüler" },
            { id: "fibrin", text: "Fibrin" },
            { id: "fibrin-thyrocytes", text: "Fibrin içinde dağınık tirositler" },
            { id: "few-thyrocyte-groups", text: "Birkaç grup düzenli yapıda tirosit" },
            { id: "small-round-thyrocytes", text: "Küçük yuvarlak koyu nükleuslu düzgün dizilim gösteren tirosit grupları" },
            { id: "follicle-thyrocytes", text: "Folikül yapmış tirosit grupları" },
            { id: "colloid-cb", text: "Kolloid" },
            { id: "macrophages-cb", text: "Makrofajlar" },
            { id: "giant-cells-suture", text: "Dev hücreler ve sütür lifleri" },
            { id: "microfollicular-solid", text: "Mikrofolikül yapısı ve solid gelişim göstermiş tirosit grupları" },
            { id: "oncocytic-thyrocytes", text: "Onkositik değişiklik göstermiş tirositler" },
            { id: "papillary-thyrocytes", text: "Papiller yapı oluşturmuş tirositler", malignant: true },
            { id: "papiller-yapilar-cb", text: "Papiller yapılar", malignant: true },
            { id: "tall-cells-cb", text: "Tall hücreleri", malignant: true }
        ]
    }
];

export const OTHER_FEATURE_GROUPS: FeatureGroup[] = [
    {
        title: "Alındığı Yer",
        features: [
            { id: "lymph-node", text: "Lenf nodu" },
            { id: "thyroid-lodge", text: "Tiroid loju" },
            { id: "parathyroid", text: "Paratiroid" }
        ]
    },
    {
        title: "Yeterlilik",
        features: [
            { id: "hypocellular", text: "Hiposellüler" },
            { id: "no-lymphocytes", text: "Lenfosit yoktur" },
            { id: "scattered-lymphocytes", text: "Dağınık lenfosit" },
            { id: "diffuse-lymphocytes", text: "Yaygın lenfosit" },
            { id: "no-parathyroid", text: "Paratiroid hücresi yok" },
            { id: "no-thyrocytes", text: "Triosit yoktur" },
            { id: "parathyroid-like", text: "Paratiroid benzeri epitelyal hücre grupları" },
            { id: "thyrocyte-parathyroid-mix", text: "Bir kaç grup tirosit paratirosit ayrımı yapılamayan hücre" },
            { id: "erythrocytes", text: "Eritrositler" },
            { id: "scattered-degenerate", text: "Dağınık dejenere hücreler" },
            { id: "parathyroid-groups", text: "Paratiroid hücre grupları" },
            { id: "regular-thyrocytes", text: "Düzeli tirosit grupları" },
            { id: "diffuse-epithelial", text: "Yaygın epitelyal gruplar" },
            { id: "hemorrhagic", text: "Materyal hemorajiktir" }
        ]
    },
    {
        title: "Atipik Hücre Varlığı",
        features: [
            { id: "no-atypical", text: "Atipik hücre yoktur" },
            { id: "few-atypical", text: "Birkaç atipik hücre" },
            { id: "weak-cohesion", text: "Kohezyonu zayıf ttirositler" },
            { id: "microfollicle-structures", text: "Mikrofolikül yapıları" },
            { id: "mild-oncocytic", text: "Hafif onkositik düzensiz dizilim gösteren tirosit grupları" },
            { id: "follicle-forming", text: "Folikül yapan triosit grupları" },
            { id: "round-dark-degenerate", text: "birkaç grup yuvarlak koyu nükleuslu dejenere tirosit" },
            { id: "small-oncocytic-degenerate", text: "Birkaç küçük grup onkositik dejenere hücre" },
            { id: "groove-structures", text: "Groove yapıları", malignant: true },
            { id: "abortive-papillary", text: "Abortif papiller yapılar", malignant: true },
            { id: "nuclear-enlargement-coarse", text: "Belirgin nükleer irileşme ve kaba kromatinli hücre grupları", malignant: true },
            { id: "intranuclear-pseudo", text: "İntranükleer psödoinklüzyon", malignant: true },
            { id: "tall-cells-atypical", text: "Tall Cell hücreler", malignant: true }
        ]
    },
    {
        title: "Kolloid",
        features: [
            { id: "no-colloid", text: "Yok" },
            { id: "rare-condensed", text: "Nadir kondanse kolloid" },
            { id: "degenerate-colloid", text: "Dejenere kolloid" },
            { id: "colloid-like", text: "Kolloid benzeri kondanse materyal" },
            { id: "background-colloid", text: "Zemin kolloidi" }
        ]
    },
    {
        title: "Makrofaj",
        features: [
            { id: "no-macrophages", text: "Yok" },
            { id: "few-foamy", text: "Az sayıda köpüksü makrofaj" },
            { id: "few-hemosiderin", text: "Az sayıda hemosiderinli makrofaj" },
            { id: "many-foamy", text: "Çok sayıda köpüksü makrofaj" },
            { id: "many-foamy-hemosiderin", text: "Çok sayıda köpüksü ve hemosiderinli makrofaj" },
            { id: "many-hemosiderin", text: "Çok sayıda hemosiderinli makrofaj" },
            { id: "multinuclear-giant-macro", text: "Multinükler dev hücreler" },
            { id: "tingible-body", text: "Tingble body makrofajlar" },
            { id: "stromal-fragments-macro", text: "Stromal fragmanlar" },
            { id: "endothelial", text: "Endotel hücreleri" },
            { id: "fibrin-clusters", text: "Fibrin kümeleri" }
        ]
    },
    {
        title: "Eşlik Eden Diğer Yapılar",
        features: [
            { id: "no-other-structures", text: "Yok" },
            { id: "multinuclear-giant-other", text: "Multinükleer dev hücre" },
            { id: "lymphocytes-maturation", text: "Zeminde çok sayıda değişik maturasyonda lenfosit" },
            { id: "amorphous-material", text: "Amorf materyal" },
            { id: "stromal-fragments-other", text: "Stromal fragmanlar" },
            { id: "striated-muscle", text: "Çizgili kas lifleri" },
            { id: "dystrophic-calcification", text: "Distrofik kalsifikasyon" },
            { id: "fat-tissue", text: "Yağ doku fragmanları" },
            { id: "granuloma-epithelioid", text: "Granülom ile uyumlu epiteloid histiyosit grupları" },
            { id: "stromal-cell-groups", text: "Stromal hücre grupları" },
            { id: "psammoma-body", text: "Psammom cismi" },
            { id: "amyloid-like-structure", text: "Amiloid benzeri yapı" }
        ]
    },
    {
        title: "Hücre Bloğu",
        features: [
            { id: "insufficient-pellet-other", text: "Bloklamada yeterli çökelti oluşmadı" },
            { id: "fibrin-other", text: "Fibrin" },
            { id: "blood-fibrin", text: "Kan ve fibrin" },
            { id: "acellular-other", text: "Asellüler" },
            { id: "hemosiderin-macrophages-cb", text: "Hemosiderinli makrofajlar" },
            { id: "stromal-fragments-cb", text: "Stromal fragmanlar" },
            { id: "histiocytes-cb", text: "Histiyositler" },
            { id: "suture-amorphous", text: "Sütür materyali ve amorf materyal" },
            { id: "suspicious-epithelial", text: "Epitelyal yanaşma gösteren kuşkulu hücreler" },
            { id: "atypical-epithelial-groups", text: "Atipik epitelyal hücre grupları" }
        ]
    }
];

export const BETHESDA_CATEGORIES = [
    "Tanısal Olmayan / Yetersiz (Bethesda Kategori 1)",
    "Benign (Bethesda Kategori 2)",
    "Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3)",
    "Foliküler Neoplazi (Bethesda Kategori 4)",
    "Malignite Şüphesi (Bethesda Kategori 5)",
    "Malign (Bethesda Kategori 6)"
];

export const OTHER_DIAGNOSES = [
    "Benign Sitoloji",
    "Nondiagnostik Sitoloji",
    "Tirosit grupları",
    "Önemi belirsiz atipi",
    "Kist içeriği",
    "MALİGNİTE YÖNÜNDEN KUŞKULU SİTOLOJİ",
    "MALİGN SİTOLOJİ"
];

export const BETHESDA_5_OPTIONS = [
    "Papiller karsinom yönünden kuşkuludur.",
    "Onkositik özellikler gösteren maligniteler açısından kuşkuludur.",
    "Medüller karsinom açısından kuşkuludur."
];

export const BETHESDA_6_OPTIONS = [
    "Papiller karsinom ile uyumludur.",
    "Onkositik özellikler gösteren maligniteler ile uyumludur.",
    "Medüller karsinom ile uyumludur.",
    "Anaplastik karsinom ile uyumludur."
];

export const generateSuggestedDiagnosis = (sample: Sample): string => {
    if (sample.type === 'other') return "Benign Sitoloji";
    const features = sample.selectedFeatures;
    const hasAdequateFeatures = features.includes('adequate-cellularity') || features.includes('adequate-colloid');

    if (!hasAdequateFeatures && (
        features.includes('inadequate-cellularity') ||
        features.includes('cyst-fluid-only') ||
        features.includes('blood-only') ||
        features.includes('obscure-blood') ||
        features.includes('air-drying')
    )) {
        return "Tanısal Olmayan / Yetersiz (Bethesda Kategori 1)";
    }

    const malignantScore = features.filter(f =>
        ['papillary-structures', 'cellular-swirls', 'nuclear-grooves', 'nuclear-inclusions',
            'ground-glass', 'salt-pepper', 'bubble-gum', 'psammoma', 'hobnail', 'tall-cell',
            'necrosis', 'mitotic-figures', 'anaplastic'].includes(f)
    ).length;

    if (malignantScore >= 3 || features.includes('papillary-structures')) return "Malign (Bethesda Kategori 6)";
    if (malignantScore >= 2 || features.includes('nuclear-grooves') || features.includes('nuclear-inclusions')) return "Malignite Şüphesi (Bethesda Kategori 5)";
    if (features.includes('microfollicular') && features.includes('minimal-colloid')) return "Foliküler Neoplazi (Bethesda Kategori 4)";
    if (features.includes('nuclear-enlargement') || features.includes('cyst-lining')) return "Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3)";

    return "Benign (Bethesda Kategori 2)";
};

const getFeatureText = (featureId: string): string => {
    const allFeatures = [...THYROID_FEATURE_GROUPS, ...OTHER_FEATURE_GROUPS].flatMap(group => group.features);
    const feature = allFeatures.find(f => f.id === featureId);
    if (feature) {
        if (feature.id === 'lymphocytes') return "Değişik maturasyonda lenfositler";
        if (feature.id === 'histiocytes') return "Çok sayıda köpüksü makrofaj";
        if (feature.id === 'hemosiderin-macrophages') return "Çok sayıda hemosiderinli makrofaj";
        return feature.text;
    }
    return featureId;
};

export const generateTiiabReport = (samples: Sample[]): string => {
    let report = '';
    const sortedSamples = [...samples].sort((a, b) => a.id - b.id);

    sortedSamples.forEach((sample, index) => {
        if (index > 0) report += '\n\n';

        if (sample.type === 'thyroid') {
            let diagnosis = sample.diagnosis || generateSuggestedDiagnosis(sample);
            if (diagnosis === "Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3)" && sample.bethesda3Type) {
                const typeMap = {
                    nuclear: 'Nükleer atipi',
                    structural: 'Yapısal atipi',
                    both: 'Yapısal ve Nükleer atipi'
                };
                diagnosis += ` (${typeMap[sample.bethesda3Type]})`;
            }
            report += `${sample.id}- (Örnek NO:${sample.id}) Tiroid; İnce iğne aspirasyon biyopsisi; Sıvı bazlı sitoloji: ${diagnosis}\n`;
            if (diagnosis.includes("Kategori 5") && sample.bethesda5Type) {
                report += `     - ${sample.bethesda5Type}\n`;
            }
            if (diagnosis.includes("Kategori 6") && sample.bethesda6Type) {
                report += `     - ${sample.bethesda6Type}\n`;
            }

            const groups = [
                { label: 'Yeterlilik', names: ['Örnekleme Yeterliliği'] },
                { label: 'Yapısal ve hücresel özellikler', names: ['Hücresel Düzenleme', 'Nükleer Özellikler', 'Sitoplazmik Özellikler'] },
                { label: 'Diğer', names: ['Zemin Özellikleri', 'Zemin Özellikleri (Diğer)', 'Özel Hücre Tipleri', 'Kalsifikasyonlar', 'Diğer Özellikler'] }
            ];

            groups.forEach(group => {
                const featuresStr: string[] = [];
                group.names.forEach(name => {
                    const g = THYROID_FEATURE_GROUPS.find(tg => tg.title === name);
                    if (g) {
                        featuresStr.push(...sample.selectedFeatures.filter(f => g.features.some(gf => gf.id === f)).map(getFeatureText));
                        if (sample.customInputs[g.title]) featuresStr.push(sample.customInputs[g.title]);
                    }
                });

                if (group.label === 'Diğer' && featuresStr.length === 0) return;
                report += `     - ${group.label}: ${featuresStr.length > 0 ? featuresStr.join(', ') + '.' : 'Görülmedi.'}\n`;
            });

            const cbGroup = THYROID_FEATURE_GROUPS.find(g => g.title === 'Hücre Bloğu');
            if (cbGroup) {
                const featuresStr = sample.selectedFeatures.filter(f => cbGroup.features.some(gf => gf.id === f)).map(getFeatureText);
                if (sample.customInputs['Hücre Bloğu']) featuresStr.push(sample.customInputs['Hücre Bloğu']);
                if (featuresStr.length > 0) report += `     - Hücre Bloğu: ${featuresStr.join(', ') + '.'}\n`;
            }
        } else {
            const locationFeatures = sample.selectedFeatures.filter(f => f.includes('lymph-node') || f.includes('thyroid-lodge') || f.includes('parathyroid'));
            const location = locationFeatures.length > 0 ? getFeatureText(locationFeatures[0]) : 'Belirtilmemiş';
            report += `${sample.id}- (Örnek NO:${sample.id}) ${location}; İnce iğne aspirasyon biyopsisi; Sıvı bazlı sitoloji: ${sample.diagnosis || "Benign Sitoloji"}\n`;

            OTHER_FEATURE_GROUPS.forEach(group => {
                const featuresStr = sample.selectedFeatures.filter(f => group.features.some(gf => gf.id === f)).map(getFeatureText);
                if (sample.customInputs[group.title]) featuresStr.push(sample.customInputs[group.title]);
                if (featuresStr.length > 0) report += `     - ${group.title === 'Hücre Bloğu' ? 'Hücre Bloğu' : group.title}: ${featuresStr.join(', ') + '.'}\n`;
            });
        }
    });

    const histochemistryCount = samples.length === 1 ? 3 : samples.length === 2 ? 6 : samples.length === 3 ? 9 : 10;
    report += `\nAyırıcı tanı amacıyla ${histochemistryCount} adet histokimyasal boyası: Papanicolaou, Giemsa, ayrıca Hematoksilen Eozin çalışılmıştır. Örnekler, direkt yayma ve SurePath Sıvı bazlı yöntemle değerlendirilmiştir.`;

    return report;
};
