import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Copy, FileText, CheckCircle, Microscope, RotateCcw, Plus, Trash2, LayoutGrid } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { toast } from 'sonner';
import { RelatedPages } from '../components/RelatedPages';

interface Feature {
    id: string;
    text: string;
    malignant?: boolean;
}

interface FeatureGroup {
    title: string;
    features: Feature[];
}

interface Sample {
    id: number;
    type: 'thyroid' | 'other';
    selectedFeatures: string[];
    customInputs: { [key: string]: string };
    diagnosis: string;
    bethesda3Type?: 'nuclear' | 'structural' | 'both' | '';
    bethesda5Type?: string;
    bethesda6Type?: string;
}

const TiiabRaporlama: React.FC = () => {
    const [samples, setSamples] = useState<Sample[]>([
        { id: 1, type: 'thyroid', selectedFeatures: [], customInputs: {}, diagnosis: '', bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' }
    ]);
    const [activeSample, setActiveSample] = useState<number>(1);
    const [copiedToClipboard, setCopiedToClipboard] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const [lastModifiedSample, setLastModifiedSample] = useState<number | null>(null);
    const [lastModifiedTime, setLastModifiedTime] = useState<number>(Date.now());

    // Load saved data from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem('thyroidFNAData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setSamples(parsed.samples || samples);
                setActiveSample(parsed.activeSample || 1);
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }, []);

    // Save data to localStorage
    useEffect(() => {
        localStorage.setItem('thyroidFNAData', JSON.stringify({
            samples,
            activeSample
        }));
    }, [samples, activeSample]);

    // Auto-scroll to active sample in report
    useEffect(() => {
        if (reportRef.current) {
            const activeSampleElement = reportRef.current.querySelector(`[data-sample-id="${activeSample}"]`);
            if (activeSampleElement) {
                const reportContainer = reportRef.current;
                const elementTop = (activeSampleElement as HTMLElement).offsetTop;
                const scrollPosition = Math.max(0, elementTop - 100);

                reportContainer.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeSample]);

    const thyroidFeatureGroups: FeatureGroup[] = [
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
                { id: "papillary-like", text: "Papiller benzeri yapılar (kor yok)" },
                { id: "3d-clusters", text: "3-boyutlu kümeler" },
                { id: "trabecular", text: "Trabeküler düzenleme" },
                { id: "isolated-cells", text: "İzole/dağınık hücreler" },
                { id: "syncytial", text: "Sinsityal kümeler" },
                { id: "insular", text: "İnsüler düzenleme" },
                { id: "solid-pattern", text: "Solid patern" },
                { id: "papillary-structures", text: "Papiller yapılar (gerçek fibrovasküler kor)", malignant: true },
                { id: "cellular-swirls", text: "Hücresel girdaplar (swirls)", malignant: true }
            ]
        },
        {
            title: "Nükleer Özellikler",
            features: [
                { id: "normal-nuclei", text: "Normal boyutlu yuvarlak nükleuslar" },
                { id: "nuclear-enlargement", text: "Nükleer büyüme" },
                { id: "nuclear-pleomorphism", text: "Nükleer pleomorfizm" },
                { id: "nuclear-overlapping", text: "Nükleer overlapping/crowding" },
                { id: "nuclear-molding", text: "Nükleer molding" },
                { id: "granular-chromatin", text: "Granüler kromatin" },
                { id: "hyperchromatic", text: "Hiperkromatik kromatin" },
                { id: "prominent-nucleoli", text: "Belirgin nükleol" },
                { id: "marginal-nucleoli", text: "Marginal nükleol" },
                { id: "macronucleoli", text: "Makronükleol" },
                { id: "binucleation", text: "Binükleasyon" },
                { id: "multinucleation", text: "Multinükleasyon" },
                { id: "irregular-contour", text: "Düzensiz nükleer kontur" },
                { id: "oval-nuclei", text: "Oval/elonge nükleuslar" },
                { id: "eccentric-nuclei", text: "Eksantrik yerleşimli nükleuslar" },
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
                { id: "columnar", text: "Columnar hücre özellikleri" },
                { id: "flame-cells", text: "Flame cells" },
                { id: "hobnail", text: "Hobnail hücreler", malignant: true },
                { id: "tall-cell", text: "Tall cell özellikleri", malignant: true }
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
                { id: "amyloid", text: "Amyloid benzeri materyal" },
                { id: "hyaline", text: "Hyalin materyal" },
                { id: "stromal-fragment", text: "Stromal fragman" }
            ]
        },
        {
            title: "Özel Hücre Tipleri",
            features: [
                { id: "cyst-lining", text: "Kist döşeyen hücreler" },
                { id: "regenerative", text: "Rejenere/reparatif değişiklikler" },
                { id: "squamous-metaplasia", text: "Skuamöz metaplazi" },
                { id: "oncocytic-metaplasia", text: "Onkositik metaplazi" },
                { id: "spindle-cells", text: "İğsi hücreler" },
                { id: "epithelioid-granulomas", text: "Epiteloid granülomlar" },
                { id: "transgressing-vessels", text: "Transgressing damarlar" },
                { id: "small-cell", text: "Küçük hücreli patern" },
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
            title: "Kalsifikasyonlar",
            features: [
                { id: "dystrophic-calc", text: "Distrofik kalsifikasyon" },
                { id: "microcalcifications", text: "Mikrokalsifikasyonlar" },
                { id: "laminar-bodies", text: "Lameller cisimcikler" },
                { id: "calcified-colloid", text: "Kalsifiye kolloid" },
                { id: "psammoma", text: "Psammom cisimcikleri", malignant: true }
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
                { id: "papillary-thyrocytes", text: "Papiller yapı oluşturmuş tirositler" },
                { id: "papiller-yapilar-cb", text: "Papiller yapılar" },
                { id: "tall-cells-cb", text: "Tall hücreleri" }
            ]
        }
    ];

    const otherFeatureGroups: FeatureGroup[] = [
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

    const bethesdaCategories = [
        "Tanısal Olmayan / Yetersiz (Bethesda Kategori 1)",
        "Benign (Bethesda Kategori 2)",
        "Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3)",
        "Foliküler Neoplazi (Bethesda Kategori 4)",
        "Malignite Şüphesi (Bethesda Kategori 5)",
        "Malign (Bethesda Kategori 6)"
    ];

    const otherDiagnoses = [
        "Benign Sitoloji",
        "Nondiagnostik Sitoloji",
        "Tirosit grupları",
        "Önemi belirsiz atipi",
        "Kist içeriği",
        "MALİGNİTE YÖNÜNDEN KUŞKULU SİTOLOJİ",
        "MALİGN SİTOLOJİ"
    ];

    const bethesda5Options = [
        "Papiller karsinom yönünden kuşkuludur.",
        "Onkositik özellikler gösteren maligniteler açısından kuşkuludur.",
        "Medüller karsinom açısından kuşkuludur."
    ];

    const bethesda6Options = [
        "Papiller karsinom ile uyumludur.",
        "Onkositik özellikler gösteren maligniteler ile uyumludur.",
        "Medüller karsinom ile uyumludur.",
        "Anaplastik karsinom ile uyumludur."
    ];

    const getCurrentSample = () => {
        return samples.find(s => s.id === activeSample) || samples[0];
    };

    const addSample = () => {
        if (samples.length < 5) {
            const newId = Math.max(...samples.map(s => s.id)) + 1;
            setSamples([...samples, {
                id: newId,
                type: 'thyroid',
                selectedFeatures: [],
                customInputs: {},
                diagnosis: '',
                bethesda3Type: '',
                bethesda5Type: '',
                bethesda6Type: ''
            }]);
            setActiveSample(newId);
        }
    };

    const toggleSampleType = (sampleId: number) => {
        setSamples(samples.map(sample =>
            sample.id === sampleId
                ? { ...sample, type: sample.type === 'thyroid' ? 'other' : 'thyroid', selectedFeatures: [], customInputs: {}, diagnosis: '', bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' }
                : sample
        ));
    };

    const updateBethesda5Type = (value: string) => {
        setSamples(samples.map(sample =>
            sample.id === activeSample ? { ...sample, bethesda5Type: value } : sample
        ));
    };

    const updateBethesda6Type = (value: string) => {
        setSamples(samples.map(sample =>
            sample.id === activeSample ? { ...sample, bethesda6Type: value } : sample
        ));
    };

    const toggleFeature = (featureId: string) => {
        setLastModifiedSample(activeSample);
        setLastModifiedTime(Date.now());

        setSamples(samples.map(sample =>
            sample.id === activeSample
                ? {
                    ...sample,
                    selectedFeatures: sample.selectedFeatures.includes(featureId)
                        ? sample.selectedFeatures.filter(f => f !== featureId)
                        : [...sample.selectedFeatures, featureId]
                }
                : sample
        ));
    };

    const updateCustomInput = (groupTitle: string, value: string) => {
        setLastModifiedSample(activeSample);
        setLastModifiedTime(Date.now());

        setSamples(samples.map(sample =>
            sample.id === activeSample
                ? {
                    ...sample,
                    customInputs: { ...sample.customInputs, [groupTitle]: value }
                }
                : sample
        ));
    };

    const updateDiagnosis = (diagnosis: string) => {
        setLastModifiedSample(activeSample);
        setLastModifiedTime(Date.now());

        setSamples(samples.map(sample =>
            sample.id === activeSample
                ? { ...sample, diagnosis, bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' }
                : sample
        ));
    };

    const updateBethesda3Type = (type: 'nuclear' | 'structural' | 'both' | '') => {
        setSamples(samples.map(sample =>
            sample.id === activeSample
                ? { ...sample, bethesda3Type: type }
                : sample
        ));
    };

    // Clear the modification highlight after 3 seconds
    useEffect(() => {
        if (lastModifiedSample !== null) {
            const timer = setTimeout(() => {
                setLastModifiedSample(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [lastModifiedTime]);

    const generateSuggestedDiagnosis = () => {
        const currentSample = getCurrentSample();
        if (currentSample.type === 'other') return "Benign Sitoloji";
        const features = currentSample.selectedFeatures;
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
        const allFeatures = [...thyroidFeatureGroups, ...otherFeatureGroups].flatMap(group => group.features);
        const feature = allFeatures.find(f => f.id === featureId);
        if (feature) {
            if (feature.id === 'lymphocytes') return "Değişik maturasyonda lenfositler";
            if (feature.id === 'histiocytes') return "Çok sayıda köpüksü makrofaj";
            if (feature.id === 'hemosiderin-macrophages') return "Çok sayıda hemosiderinli makrofaj";
            return feature.text;
        }
        return featureId;
    };

    const generateReport = (): string => {
        let report = '';
        const sortedSamples = [...samples].sort((a, b) => a.id - b.id);

        sortedSamples.forEach((sample, index) => {
            if (index > 0) report += '\n\n';

            if (sample.type === 'thyroid') {
                let diagnosis = sample.diagnosis || generateSuggestedDiagnosis();
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
                    const features: string[] = [];
                    group.names.forEach(name => {
                        const g = thyroidFeatureGroups.find(tg => tg.title === name);
                        if (g) {
                            features.push(...sample.selectedFeatures.filter(f => g.features.some(gf => gf.id === f)).map(getFeatureText));
                            if (sample.customInputs[g.title]) features.push(sample.customInputs[g.title]);
                        }
                    });
                    report += `     - ${group.label}: ${features.length > 0 ? features.join(', ') + '.' : 'Görülmedi.'}\n`;
                });

                const cbGroup = thyroidFeatureGroups.find(g => g.title === 'Hücre Bloğu');
                if (cbGroup) {
                    const features = sample.selectedFeatures.filter(f => cbGroup.features.some(gf => gf.id === f)).map(getFeatureText);
                    if (sample.customInputs['Hücre Bloğu']) features.push(sample.customInputs['Hücre Bloğu']);
                    if (features.length > 0) report += `     - Hücre Bloğu: ${features.join(', ') + '.'}\n`;
                }
            } else {
                const locationFeatures = sample.selectedFeatures.filter(f => f.includes('lymph-node') || f.includes('thyroid-lodge') || f.includes('parathyroid'));
                const location = locationFeatures.length > 0 ? getFeatureText(locationFeatures[0]) : 'Belirtilmemiş';
                report += `${sample.id}- (Örnek NO:${sample.id}) ${location}; İnce iğne aspirasyon biyopsisi; Sıvı bazlı sitoloji: ${sample.diagnosis || "Benign Sitoloji"}\n`;

                otherFeatureGroups.forEach(group => {
                    const features = sample.selectedFeatures.filter(f => group.features.some(gf => gf.id === f)).map(getFeatureText);
                    if (sample.customInputs[group.title]) features.push(sample.customInputs[group.title]);
                    if (features.length > 0) report += `     - ${group.title === 'Hücre Bloğu' ? 'Hücre Bloğu' : group.title}: ${features.join(', ') + '.'}\n`;
                });
            }
        });

        const histochemistryCount = samples.length === 1 ? 3 : samples.length === 2 ? 6 : samples.length === 3 ? 9 : 10;
        report += `\nAyırıcı tanı amacıyla ${histochemistryCount} adet histokimyasal boyası: Papanicolaou, Giemsa, ayrıca Hematoksilen Eozin çalışılmıştır. Örnekler, direkt yayma ve SurePath Sıvı bazlı yöntemle değerlendirilmiştir.`;

        return report;
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generateReport());
            setCopiedToClipboard(true);
            toast.success("Rapor kopyalandı");
            setTimeout(() => setCopiedToClipboard(false), 2000);
        } catch (error) {
            console.error('Failed to copy info:', error);
        }
    };

    const clearAll = () => {
        if (window.confirm("Bu örnek temizlenecek?")) {
            setSamples(samples.map(sample => sample.id === activeSample ? { ...sample, selectedFeatures: [], customInputs: {}, diagnosis: '', bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' } : sample));
        }
    };

    const clearAllSamples = () => {
        if (window.confirm("Bütün örnekler temizlenecek?")) {
            setSamples([{ id: 1, type: 'thyroid', selectedFeatures: [], customInputs: {}, diagnosis: '', bethesda3Type: '', bethesda5Type: '', bethesda6Type: '' }]);
            setActiveSample(1);
        }
    };

    const getDiagnosisStyles = (diag: string) => {
        if (diag.includes('Kategori 1')) return 'border-yellow-400 bg-yellow-50 text-yellow-800 focus:ring-yellow-500';
        if (diag.includes('Kategori 2')) return 'border-green-400 bg-green-50 text-green-800 focus:ring-green-500';
        if (diag.includes('Kategori 6')) return 'border-purple-400 bg-purple-50 text-purple-800 focus:ring-purple-500';
        return 'border-red-400 bg-red-50 text-red-800 focus:ring-red-500';
    };

    const getSampleButtonStyles = (sample: Sample) => {
        const diagnosis = sample.diagnosis || (sample.type === 'thyroid' ? generateSuggestedDiagnosis() : "Benign Sitoloji");
        const isActive = sample.id === activeSample;

        let colorClass = 'blue';
        if (sample.type === 'other') colorClass = 'green';
        else if (diagnosis.includes('Kategori 1')) colorClass = 'yellow';
        else if (diagnosis.includes('Kategori 2')) colorClass = 'green';
        else if (diagnosis.includes('Kategori 6')) colorClass = 'purple';
        else colorClass = 'red';

        if (isActive) return `bg-${colorClass}-600 text-white shadow-lg`;
        return `bg-${colorClass}-100 text-${colorClass}-800 hover:bg-${colorClass}-200`;
    };

    const currentSample = getCurrentSample();
    const currentFeatureGroups = currentSample.type === 'thyroid' ? thyroidFeatureGroups : otherFeatureGroups;
    const currentDiagnoses = currentSample.type === 'thyroid' ? bethesdaCategories : otherDiagnoses;

    return (
        <PageContainer>
            <div className="min-h-screen bg-slate-50 pb-20">
                {/* Header */}
                <div className="bg-white border-b border-slate-200">
                    <div className="w-full mx-auto px-4 py-3 md:py-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                                    <Microscope className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                                        TİİAB Raporlama Sistemi
                                    </h1>
                                    <p className="text-xs font-medium text-slate-500">
                                        Tiroid İnce İğne Aspirasyon Biyopsisi (Bethesda 2023)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                                {samples.map(sample => (
                                    <button
                                        key={sample.id}
                                        onClick={() => setActiveSample(sample.id)}
                                        className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${getSampleButtonStyles(sample)}`}
                                    >
                                        {sample.id}. {sample.type === 'thyroid' ? 'Tiroid' : 'Diğer'}
                                    </button>
                                ))}
                                {samples.length < 5 && (
                                    <button
                                        onClick={addSample}
                                        className="p-2.5 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                    <div className="w-full mx-auto px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleSampleType(activeSample)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${currentSample.type === 'thyroid'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                                    }`}
                            >
                                {currentSample.type === 'thyroid' ? "Diğer Sitoloji'ye Çevir" : "Tiroid Sitoloji'ye Çevir"}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearAll}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> Örneği Sıfırla
                            </button>
                            <button
                                onClick={clearAllSamples}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg shadow-rose-100"
                            >
                                <Trash2 className="w-4 h-4" /> Tümünü Temizle
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full mx-auto px-4 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Left: Features */}
                        <div className="lg:col-span-9 space-y-4">
                            {/* Tanı Seçimi */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">Tanı ve Kategori</h3>
                                        <p className="text-xs font-medium text-slate-500">Bulgulara göre otomatik önerilir</p>
                                    </div>
                                    <select
                                        value={currentSample.diagnosis || generateSuggestedDiagnosis()}
                                        onChange={(e) => updateDiagnosis(e.target.value)}
                                        className={`w-full md:w-auto px-6 py-3 text-sm md:text-base font-bold border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-opacity-20 transition-all ${currentSample.type === 'thyroid'
                                            ? getDiagnosisStyles(currentSample.diagnosis || generateSuggestedDiagnosis())
                                            : 'border-emerald-400 bg-emerald-50 text-emerald-800 focus:ring-emerald-500'
                                            }`}
                                    >
                                        {currentDiagnoses.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                {/* Bethesda 3 Type Requirement */}
                                {(currentSample.diagnosis === "Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3)" ||
                                    (!currentSample.diagnosis && generateSuggestedDiagnosis() === "Önemi Belirsiz Atipi (AUS) (Bethesda Kategori 3)")) && (
                                        <div className="mb-6 p-6 bg-amber-50 rounded-2xl border border-amber-200 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-4">Rapor Başlığına Eklenecek Atipi Türü:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { id: 'nuclear', label: 'Nükleer atipi' },
                                                    { id: 'structural', label: 'Yapısal atipi' },
                                                    { id: 'both', label: 'Yapısal ve Nükleer atipi' }
                                                ].map(type => (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => updateBethesda3Type(type.id as any)}
                                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${currentSample.bethesda3Type === type.id
                                                            ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-100'
                                                            : 'bg-white border-amber-200 text-amber-800 hover:border-amber-400'
                                                            }`}
                                                    >
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {/* Bethesda 5 Type Requirement */}
                                {(currentSample.diagnosis === "Malignite Şüphesi (Bethesda Kategori 5)" ||
                                    (!currentSample.diagnosis && generateSuggestedDiagnosis() === "Malignite Şüphesi (Bethesda Kategori 5)")) && (
                                        <div className="mb-6 p-6 bg-red-50 rounded-2xl border border-red-200 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-sm font-black text-red-800 uppercase tracking-widest mb-4">Tanı Detayı:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {bethesda5Options.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => updateBethesda5Type(opt)}
                                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${currentSample.bethesda5Type === opt
                                                            ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-100'
                                                            : 'bg-white border-red-200 text-red-800 hover:border-red-400'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {/* Bethesda 6 Type Requirement */}
                                {(currentSample.diagnosis === "Malign (Bethesda Kategori 6)" ||
                                    (!currentSample.diagnosis && generateSuggestedDiagnosis() === "Malign (Bethesda Kategori 6)")) && (
                                        <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-200 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-sm font-black text-purple-800 uppercase tracking-widest mb-4">Tanı Detayı:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {bethesda6Options.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => updateBethesda6Type(opt)}
                                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${currentSample.bethesda6Type === opt
                                                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100'
                                                            : 'bg-white border-purple-200 text-purple-800 hover:border-purple-400'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>

                            {/* Masonry-like Features Grid */}
                            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 3xl:columns-6 gap-4 space-y-4">
                                {currentFeatureGroups.map(group => (
                                    <div key={group.title} className="break-inside-avoid bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
                                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-indigo-600" />
                                            {group.title}
                                        </h3>
                                        <div className="flex flex-col gap-1.5 mb-3">
                                            {group.features.map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => toggleFeature(f.id)}
                                                    className={`w-full p-2 text-left text-[13px] font-bold rounded-xl transition-all border-2 ${currentSample.selectedFeatures.includes(f.id)
                                                        ? f.malignant
                                                            ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100'
                                                            : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                        : f.malignant
                                                            ? 'bg-rose-50 border-rose-100 text-rose-800 hover:border-rose-300'
                                                            : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-white'
                                                        }`}
                                                >
                                                    {f.text}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Ek notlar..."
                                            value={currentSample.customInputs[group.title] || ''}
                                            onChange={(e) => updateCustomInput(group.title, e.target.value)}
                                            className="w-full px-3 py-2 text-[13px] font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Preview (Sticky) */}
                        <div className="lg:col-span-3 lg:sticky lg:top-20 h-fit">
                            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xl shadow-indigo-100/50 overflow-hidden flex flex-col">
                                <div className="p-4 bg-slate-900 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-400" />
                                        <span className="font-black text-white uppercase tracking-widest text-xs">Rapor Önizleme</span>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${copiedToClipboard ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-indigo-400 hover:text-white'
                                            }`}
                                    >
                                        {copiedToClipboard ? 'KOPYALANDI!' : 'KOPYALA'}
                                    </button>
                                </div>
                                <div
                                    ref={reportRef}
                                    className="p-4 bg-white overflow-y-auto max-h-[70vh] md:max-h-[80vh] font-mono text-[13px] leading-relaxed text-slate-800"
                                >
                                    {generateReport().split('\n').map((line, i) => {
                                        const isActiveLine = line.includes(`${activeSample}-`);
                                        return (
                                            <div
                                                key={i}
                                                data-sample-id={isActiveLine ? activeSample : undefined}
                                                className={`mb-1 ${isActiveLine ? 'bg-indigo-50 border-l-4 border-indigo-600 pl-2 py-1 rounded-r-md' : ''}`}
                                            >
                                                {line || '\u00A0'}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-100">
                                    <button
                                        onClick={copyToClipboard}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-black text-base transition-all shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 group"
                                    >
                                        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        Raporu Kopyala
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <RelatedPages
                pages={[
                    {
                        title: "Sjögren Raporlama",
                        subtitle: "Minör tükrük bezi biyopsisi raporlama aracı",
                        page: "sjogren-raporlama",
                        color: "bg-indigo-600",
                        icon: Microscope
                    },
                    {
                        title: "GİST Raporlama",
                        subtitle: "Gastrointestinal Stromal Tümör raporlama aracı",
                        page: "gist-raporlama",
                        color: "bg-purple-600",
                        icon: FileText
                    },
                    {
                        title: "Endoskopi Raporlama",
                        subtitle: "Gastrointestinal sistem biyopsileri raporlama aracı",
                        page: "endoskopi-raporlama",
                        color: "bg-blue-600",
                        icon: LayoutGrid
                    }
                ]}
            />
        </PageContainer>
    );
};

export default TiiabRaporlama;
