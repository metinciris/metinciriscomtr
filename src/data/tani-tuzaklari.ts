// src/data/tani-tuzaklari.ts

export type Difficulty = "Kolay" | "Orta" | "Zor";
export type Modality = "Genel" | "H&E" | "IHC" | "Moleküler" | "Sitoloji" | "Frozen";
export type SpecimenType = "Biyopsi" | "Rezeksiyon" | "Sitoloji" | "FNA" | "Frozen" | "Genel";

export type OrganSystem =
    | "Genel"
    | "Akciğer"
    | "GİS"
    | "Meme"
    | "Gyn"
    | "Üriner"
    | "Endokrin"
    | "Baş-Boyun"
    | "Deri"
    | "Lenfoid/Hemato"
    | "Yumuşak Doku"
    | "Kemik"
    | "CNS";

export type Category =
    | "Artefakt"
    | "Benign vs Malign"
    | "Inflamasyon"
    | "Mimik"
    | "Grading/Staging"
    | "IHC Tuzakları"
    | "Frozen Tuzakları"
    | "Sitoloji Tuzakları"
    | "Örnekleme"
    | "Raporlama"
    | "Diğer";

export type Reference = {
    label: string;
    url?: string;
    note?: string;
};

export type Pitfall = {
    id: string;
    titleTR: string;
    titleEN?: string;
    organSystem: OrganSystem;
    category: Category;
    modality: Modality;
    specimenType: SpecimenType;
    difficulty: Difficulty;
    tags: string[];
    teaser: string;
    whyItTricks: string[];
    keyClues: string[];
    minimalWorkup: string[];
    reportingTips: string[];
    checklist: string[];
    references?: Reference[];
    updatedAt: string;
};

export const CATEGORIES: Category[] = [
    "Artefakt",
    "Benign vs Malign",
    "Inflamasyon",
    "Mimik",
    "Grading/Staging",
    "IHC Tuzakları",
    "Frozen Tuzakları",
    "Sitoloji Tuzakları",
    "Örnekleme",
    "Raporlama",
    "Diğer",
];

export const MODALITIES: Modality[] = ["Genel", "H&E", "IHC", "Moleküler", "Sitoloji", "Frozen"];

export const SPECIMEN_TYPES: SpecimenType[] = ["Genel", "Biyopsi", "Rezeksiyon", "Sitoloji", "FNA", "Frozen"];

export const ORGAN_SYSTEMS: OrganSystem[] = [
    "Genel",
    "Akciğer",
    "GİS",
    "Meme",
    "Gyn",
    "Üriner",
    "Endokrin",
    "Baş-Boyun",
    "Deri",
    "Lenfoid/Hemato",
    "Yumuşak Doku",
    "Kemik",
    "CNS",
];

export const PITFALLS: Pitfall[] = [
    {
        id: "lung-crush-smallcell",
        titleTR: "Crush artefaktı: küçük hücreli karsinom aşırı tanısı riski",
        titleEN: "Crush artifact mimicking small cell carcinoma",
        organSystem: "Akciğer",
        category: "Artefakt",
        modality: "H&E",
        specimenType: "Biyopsi",
        difficulty: "Orta",
        tags: ["crush", "small cell", "bronş", "artefakt", "biopsy"],
        teaser:
            "Bronş biyopsilerinde ezilme artefaktı; nükleer detayları bozarak küçük hücreli karsinomu taklit edebilir. Doku azlığı riski artırır.",
        whyItTricks: [
            "Nükleer 'molding' benzeri görünüm oluşturabilir.",
            "Kromatin detayı kaybolur; nükleer artefakt 'ince kromatin' gibi algılanabilir.",
            "Küçük örnek + sınırlı IHC olanağı: erken final tanı baskısı doğurur.",
        ],
        keyClues: [
            "Ezilme alanlarını 'yorum dışı' bırakacak şekilde kesit kalitesini değerlendirin.",
            "Nekroz, 'Azzopardi benzeri' bazofilik değişiklikler gibi eşlik eden bulguların tutarlılığını sorgulayın.",
            "Klinik/radyolojik bağlam (santral kitle, lenf nodu paterni, vb.) ile korelasyon kurun.",
        ],
        minimalWorkup: [
            "Ek seviye/derin kesit (doku uygunsa).",
            "Minimal doğrulayıcı panel (kurum pratiğine göre): panCK + nöroendokrin marker(lar) + proliferasyon indeksi.",
            "Klinik korelasyon notu / gerekiyorsa yeniden biyopsi önerisi.",
        ],
        reportingTips: [
            "Artefakt varlığında kesin ifade yerine sınırlılık cümlesi ekleyin.",
            "'Mevcut kesitlerde…' + 'artefakt nedeniyle değerlendirme kısıtlı' gibi risk yönetimi dili kullanın.",
        ],
        checklist: [
            "Doku bütünlüğü uygun mu (crush/cautery)?",
            "Nükleer detaylar güvenilir mi?",
            "Morfoloji–klinik uyumu var mı?",
            "Minimal doğrulama (level/IHC) yapıldı mı?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "meningioma-atypical-grade2",
        titleTR: "Meningiom: Grade 2 (Atipik) Kriterleri ve Beyin İnvazyonu",
        titleEN: "Atypical (Grade 2) Meningioma Criteria & Brain Invasion",
        organSystem: "CNS",
        category: "Grading/Staging",
        modality: "H&E",
        specimenType: "Rezeksiyon",
        difficulty: "Orta",
        tags: ["meningioma", "grade 2", "atypical", "brain invasion", "mitosis"],
        teaser:
            "Meningiomlarda Grade 2 tanısı için ya beyin invazyonu ya da mitotik aktivite/histolojik kriterler (toplam 3) gereklidir. Atlanması rekurrens riskini etkiler.",
        whyItTricks: [
            "Beyin invazyonu, parankim içine giren düzensiz diller şeklinde olmalıdır; basit indentasyon invazyon değildir.",
            "Mitotik sayım (4-19 / 1.6 mm²) dikkatli yapılmazsa grade düşük verilebilir.",
        ],
        keyClues: [
            "Beyin invazyonu tek başına Grade 2 kriteridir (önceden Grade 1 olsa bile).",
            "Diğer kriterler (3 tanesi gerekli): Artmış selülarite, küçük hücreler (yüksek N/C), belirgin nükleol, desen kaybı (sheet-like), nekroz.",
        ],
        minimalWorkup: [
            "Beyin parankimi ile sınır komşuluğu olan alanların geniş örneklenmesi.",
            "Mitotik aktivite için en aktif alanların (hotspot) seçilmesi.",
            "Gerekirse dura/beyin sınırının IHK (GFAP) ile değerlendirilmesi (invazyon vs gliosis).",
        ],
        reportingTips: [
            "Grade 2 kriterlerinden hangilerinin (beyin invazyonu mu, mitoz mu, diğerleri mi) karşılandığı açıkça belirtilmeli.",
        ],
        checklist: [
            "Beyin invazyonu var mı?",
            "Mitoz sayısı 4-19 arası mı?",
            "Diğer 3 minör kriterden (nekroz, selülarite vb.) kaçı var?",
        ],
        references: [],
        updatedAt: "2025-12-17",
    },

    {
        id: "meningioma-fibrous-vs-schwannoma",
        titleTR: "Fibröz Meningiom vs Schwannoma",
        titleEN: "Fibrous Meningioma vs Schwannoma",
        organSystem: "CNS",
        category: "Mimik",
        modality: "H&E",
        specimenType: "Rezeksiyon",
        difficulty: "Orta",
        tags: ["meningioma", "schwannoma", "fibrous", "EMA", "S100"],
        teaser:
            "Fibröz (fibroblastik) meningiom, iğsi hücreli yapısı ve fasiküler büyümesi ile schwannomayı taklit edebilir.",
        whyItTricks: [
            "Her ikisi de iğsi hücrelerden oluşur ve CPA (serebellopontin köşe) bölgesinde yerleşebilir.",
            "Meningiomda whorl (girdap) yapıları az olabilir.",
        ],
        keyClues: [
            "Meningiom: EMA (+), S100 (genellikle -/zayıf), kollajen lifleri zengin.",
            "Schwannoma: S100 (diffüz/güçlü +), EMA (-), Antoni A/B alanları, verocay cisimcikleri, hiyalinize damarlar.",
        ],
        minimalWorkup: [
            "EMA ve S100 paneli genellikle ayrım için yeterlidir.",
            "SOX10 (Schwannoma için daha spesifik).",
        ],
        reportingTips: [
            "IHK sonuçları (EMA vs S100) ile desteklenen tanı.",
        ],
        checklist: [
            "EMA pozitif mi?",
            "S100 diffüz pozitif mi?",
            "Antoni A/B alanları var mı?",
        ],
        references: [],
        updatedAt: "2025-12-17",
    },

    {
        id: "meningioma-molecular-grade3",
        titleTR: "Meningiom: Moleküler (Grade 3) Kriterleri (TERT & CDKN2A/B)",
        titleEN: "Meningioma Molecular Grading (TERT & CDKN2A/B)",
        organSystem: "CNS",
        category: "Grading/Staging",
        modality: "Moleküler",
        specimenType: "Rezeksiyon",
        difficulty: "Zor",
        tags: ["meningioma", "grade 3", "TERT", "CDKN2A", "molecular"],
        teaser:
            "Histolojik olarak benign görünse bile TERT promoter mutasyonu veya CDKN2A/B homozigot kaybı varsa tümör Grade 3 (Malign) kabul edilir.",
        whyItTricks: [
            "Tümör histolojik olarak Grade 1 veya 2 kriterlerini taşıyabilir ama biyolojik davranışı agresiftir.",
            "Moleküler test yapılmazsa 'benign' tanısı ile eksik tedavi/takip riski doğar.",
        ],
        keyClues: [
            "Grade 3 tanımı artık sadece histolojik (anaplazi, >20 mitoz) değil, moleküler kriterleri de kapsar.",
            "TERT promoter mutasyonu veya CDKN2A/B homozigot delesyonu bağımsız kötü prognoz göstergesidir.",
        ],
        minimalWorkup: [
            "Atipik özellik gösteren veya rekürren meningiomlarda moleküler analiz önerisi.",
            "Histolojik grade ile uyumsuz klinik seyirde moleküler test.",
        ],
        reportingTips: [
            "Grade 3 tanı kriteri olarak moleküler bulgunun (varsa) raporda 'entegre tanı' olarak belirtilmesi.",
            "DSÖ 2021 (CNS 5) kriterlerine atıf yapılması.",
        ],
        checklist: [
            "Histoloji benign olsa da moleküler risk faktörleri değerlendirildi mi?",
            "TERT veya CDKN2A/B statüsü biliniyor mu?",
        ],
        references: [],
        updatedAt: "2025-12-17",
    },

    {
        id: "gi-cautery-dysplasia-margin",
        titleTR: "Koter/termal hasar: displazi/kanser izlenimi ve cerrahi sınır tuzağı",
        titleEN: "Cautery artifact mimicking dysplasia/carcinoma at margins",
        organSystem: "GİS",
        category: "Artefakt",
        modality: "H&E",
        specimenType: "Rezeksiyon",
        difficulty: "Orta",
        tags: ["cautery", "margin", "artifact", "overcall", "gi"],
        teaser:
            "Termal hasar nükleer atipi ve stromal değişiklikleri abartılı gösterip 'yüksek dereceli displazi' veya 'pozitif sınır' yorumuna itebilir.",
        whyItTricks: [
            "Nükleer hiperkromazi/uzama, psödostratifikasyon hissi yaratabilir.",
            "Stromal koagülasyon ve çekilme artefaktı invazyon algısını artırabilir.",
            "Sınır değerlendirmesinde 'en kötü alan' yanlılığı (worst-area bias).",
        ],
        keyClues: [
            "Artefakt paterni genellikle 'yüzeysel/kenar ağırlıklı' ve koagülasyon eşliklidir.",
            "Şüpheli alanda gerçek mimari bozulma ve canlı tümör hücresi kriterlerini arayın.",
            "Gerekirse karşı blok/karşı kesit ile korelasyon yapın.",
        ],
        minimalWorkup: [
            "Şüpheli sınır için ek seviye / yeni kesit.",
            "Sınır örnekleme yeterli değilse ek örnekleme önerisi.",
            "Klinik bilgi (endoskopik lokalizasyon, makroskopik sınır) ile korelasyon.",
        ],
        reportingTips: [
            "Sınır yorumlarında 'artefakt' varsa mutlaka not edin.",
            "Netlik yoksa: 'değerlendirme termal hasar nedeniyle kısıtlı' yaklaşımı.",
        ],
        checklist: ["Şüpheli alan artefakt paternine uyuyor mu?", "Sınır örneklemesi yeterli mi?", "Ek seviye istendi mi?"],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "floater-contamination",
        titleTR: "Floater / kontaminasyon: yanlış pozitif tümör odağı tuzağı",
        titleEN: "Tissue floater / contamination",
        organSystem: "Genel",
        category: "Artefakt",
        modality: "H&E",
        specimenType: "Genel",
        difficulty: "Zor",
        tags: ["floater", "contamination", "lab", "qa", "false positive"],
        teaser:
            "Kesitte 'beklenmeyen' tümör odağı (özellikle tek odak) kontaminasyon olabilir. Klinik uyumsuzluk kritik ipucudur.",
        whyItTricks: [
            "Tek kesitte 'küçük tümör odağı' gerçek metastaz/primer sanılabilir.",
            "Klinik uyum kontrol edilmezse rapor hatası yüksek etkili olur.",
            "İmmünohistokimya bile floater'ı 'güçlendirebilir' (yanlış güven).",
        ],
        keyClues: [
            "Odak 'yüzeyde', düzensiz sınırlı ve çevre doku ile anatomik uyumsuz olabilir.",
            "Aynı blokta/derin kesitlerde odağın tekrarlanıp tekrarlanmadığını kontrol edin.",
            "Makro–mikro korelasyon ve örnek sırası/lab akışı şüphesi.",
        ],
        minimalWorkup: [
            "Derin kesit/ek seviye: odak tekrarlanıyor mu?",
            "Gerekirse farklı blok/kasetten yeniden kesit.",
            "Kalite birimi / lab ile kontaminasyon olasılığını değerlendirme.",
        ],
        reportingTips: [
            "Klinik uyumsuzluk varsa 'doğrulama' yapılmadan kesin ifade kullanmaktan kaçının.",
            "Şüphe durumunda yorumun kısıtlılığını ve doğrulama adımlarını rapora yansıtın.",
        ],
        checklist: [
            "Odak beklenen anatomik doku ile uyumlu mu?",
            "Derin kesitte tekrar ediyor mu?",
            "Klinik/radyoloji uyumu var mı?",
            "Lab kontaminasyon olasılığı değerlendirildi mi?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "sampling-error-negative-trap",
        titleTR: "Örnekleme hatası: fokal lezyonda 'benign/negatif' rapor tuzağı",
        titleEN: "Sampling error in focal lesions",
        organSystem: "Genel",
        category: "Örnekleme",
        modality: "Genel",
        specimenType: "Genel",
        difficulty: "Zor",
        tags: ["sampling", "levels", "deeper sections", "discordance"],
        teaser:
            "Lezyon fokalse az seviye/kesit tanıyı kaçırabilir. Klinik şüphe yüksekse 'negatif' rapor yüksek risk taşır.",
        whyItTricks: [
            "Lezyon blokta çok küçük bir odak olabilir.",
            "Kesit seviyeleri lezyonu ıskalayabilir.",
            "Klinik şüphe–patoloji uyumsuzluğu gözden kaçabilir.",
        ],
        keyClues: [
            "Klinik şüphe yüksek, patoloji 'tamamen benign' ise alarm verin.",
            "Makroskopik tarif ile mikroskobik bulgu arasında boşluk var mı?",
        ],
        minimalWorkup: [
            "Ek seviye/derin kesit planı.",
            "Gerekirse ek bloklama / yeniden örnekleme önerisi.",
            "Klinik/radyoloji korelasyonu (discordance yönetimi).",
        ],
        reportingTips: [
            "'Mevcut kesitlerde…' ifadesi ve korelasyon önerisi ekleyin.",
            "Discordance durumunda kontrol stratejisini rapora yazın (ek seviye/yeniden örnekleme).",
        ],
        checklist: [
            "Klinik şüphe yüksek mi?",
            "Kesit/seviye sayısı yeterli mi?",
            "Makro–mikro korelasyon yapıldı mı?",
            "Discordance rapora yansıtıldı mı?",
        ],
        updatedAt: "2025-12-16",
    },

    {
        id: "ihc-nonspecific-falsepositive",
        titleTR: "IHK: non-spesifik boyanma (false positive) ve 'tek marker' tuzağı",
        titleEN: "Non-specific IHC staining / single-marker trap",
        organSystem: "Genel",
        category: "IHC Tuzakları",
        modality: "IHC",
        specimenType: "Genel",
        difficulty: "Orta",
        tags: ["IHC", "false positive", "background", "internal control", "panel"],
        teaser:
            "Zayıf/dağınık boyanma bazen 'pozitif' sanılır. Doğru kompartıman + pattern + internal kontrol ve panel yaklaşımı esastır.",
        whyItTricks: [
            "Arka plan boyanması 'diffüz pozitif' gibi algılanır.",
            "Internal kontrol yoksa yorum güveni düşer.",
            "Tek marker ile final tanıya gitme eğilimi hata üretir.",
        ],
        keyClues: [
            "Boyanma kompartımanı doğru mu (nükleer/sitoplazmik/membranöz)?",
            "Internal kontrol mevcut mu ve beklenen patern gösteriyor mu?",
            "Morfoloji ile IHK uyumlu mu?",
        ],
        minimalWorkup: [
            "Panel yaklaşımı: hedef soruya yönelik, minimal ama anlamlı marker seti.",
            "Kontrol slaytları / internal kontrol değerlendirmesi.",
            "Gerekirse teknik tekrar (özellikle beklenmeyen patern).",
        ],
        reportingTips: [
            "Internal kontrol yoksa raporda sınırlılık belirtin.",
            "Tek marker üzerinden 'kesin tanı' kurmaktan kaçının; morfoloji–panel uyumunu yazın.",
        ],
        checklist: [
            "Internal kontrol var mı?",
            "Doğru kompartımanda boyanma var mı?",
            "Beklenmeyen patern için teknik/klinik kontrol yapıldı mı?",
            "Panel + morfoloji uyumlu mu?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "prostate-adenosis-atrophy-vs-carcinoma",
        titleTR: "Prostat: adenozis/atrofi vs adenokarsinom (küçük asiner proliferasyon tuzağı)",
        titleEN: "Prostate benign mimics vs adenocarcinoma",
        organSystem: "Üriner",
        category: "Benign vs Malign",
        modality: "H&E",
        specimenType: "Biyopsi",
        difficulty: "Zor",
        tags: ["prostate", "atrophy", "adenosis", "ASAP", "basal cells", "AMACR"],
        teaser:
            "Küçük asiner proliferasyonlarda benign mimikler (atrofi/adenozis) 'kanser' gibi algılanabilir; bazal hücre göstergeleri ve morfoloji birlikte yorumlanmalıdır.",
        whyItTricks: [
            "Atrofik bezler küçük ve kalabalık görünebilir.",
            "Bazal hücre markırları teknik/heterojen nedenlerle odak kaçırabilir.",
            "AMACR tek başına güvenli değildir; 'tek marker' tuzağı burada da geçerlidir.",
        ],
        keyClues: [
            "Morfolojik mimiklerde lobüler organizasyon, bazal hücre devamlılığı ipucu olabilir.",
            "Şüpheli odakta nükleer büyüme/nükleol belirginliği ve infiltratif paternin tutarlılığı aranır.",
        ],
        minimalWorkup: [
            "Şüpheli odakta hedeflenmiş bazal hücre marker(lar) + gerekirse ek marker.",
            "Derin kesit: mimik/artefakt ayırımı ve odak sürekliliği için.",
            "Klinik PSA, görüntüleme ve önceki biyopsi ile korelasyon.",
        ],
        reportingTips: [
            "Gerekirse 'ASAP'/şüpheli odak yaklaşımı ve yeniden biyopsi/izlem önerisi ile risk yönetimi.",
            "IHK negatifliği tek başına 'kanser' veya 'benign' demek değildir.",
        ],
        checklist: [
            "İnfiltratif patern var mı?",
            "Nükleol/nükleer atipi tutarlı mı?",
            "Bazal hücre paternini güvenilir değerlendirdin mi?",
            "Derin kesit / panel yaklaşımı uygulandı mı?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "colon-pseudoinvasion",
        titleTR: "Kolon polibi: psödoinvazyon (gland misplacement) vs invaziv adenokarsinom",
        titleEN: "Pseudoinvasion vs invasive carcinoma in polyp",
        organSystem: "GİS",
        category: "Benign vs Malign",
        modality: "H&E",
        specimenType: "Rezeksiyon",
        difficulty: "Zor",
        tags: ["colon", "polyp", "pseudoinvasion", "misplacement", "overcall"],
        teaser:
            "Pedinküllü poliplerde bezlerin submukozaya yer değiştirmesi invazyon gibi görünebilir; aşırı tanı gereksiz tedaviye yol açar.",
        whyItTricks: [
            "Submukozada bez görülmesi otomatik olarak invazyon çağrışımı yapar.",
            "Kanama/fibrozis eşlik edebilir ve 'desmoplazi' ile karışabilir.",
        ],
        keyClues: [
            "Yüzey polip morfolojisiyle bağlantı ve 'misplacement' lehine paternleri arayın.",
            "Gerçek invazyonda beklenen stromal yanıt ve tümör dokusunun davranışı bütüncül değerlendirilir.",
        ],
        minimalWorkup: [
            "Derin kesit/ek seviye ile paternin sürekliliğini değerlendirin.",
            "Gerekirse ek bloklama: pedikül tabanı ve şüpheli alanların temsili.",
        ],
        reportingTips: [
            "Tanı net değilse yorum dilini 'şüpheli'/'kısıtlı' yönetip klinik korelasyon ve ek örnekleme önerin.",
        ],
        checklist: [
            "Submukozal bezler misplacement paternine uyuyor mu?",
            "Gerçek invazyon bulguları tutarlı mı?",
            "Şüpheli alan için ek seviye/ek blok yapıldı mı?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "breast-ecadherin-pitfall",
        titleTR: "Meme: E-cadherin yorumu ve lobüler/duktal ayrımında tuzaklar",
        titleEN: "E-cadherin interpretation pitfalls in breast",
        organSystem: "Meme",
        category: "IHC Tuzakları",
        modality: "IHC",
        specimenType: "Genel",
        difficulty: "Orta",
        tags: ["breast", "E-cadherin", "lobular", "ductal", "p120"],
        teaser:
            "E-cadherin boyası 'tek başına' karar verdirmez; patern/kalite ve morfoloji birlikte ele alınmalıdır.",
        whyItTricks: [
            "Zayıf/parsiyel membranöz boyanma yanlış sınıflamaya neden olabilir.",
            "Teknik değişkenlik ve internal kontrol eksikliği yorum güvenini düşürür.",
        ],
        keyClues: [
            "Internal kontrol (normal duktuslar) uygun mu?",
            "Morfoloji (discohesive büyüme, single-file vb.) ile IHK uyumu var mı?",
        ],
        minimalWorkup: [
            "Gerekirse tamamlayıcı marker(lar) ve panel yaklaşımı.",
            "Teknik şüphede tekrar/alternatif antikor veya yeni kesit.",
        ],
        reportingTips: [
            "Çelişki varsa raporda metod/yorum sınırlılığı belirtilmeli.",
        ],
        checklist: ["Internal kontrol uygun mu?", "Morfoloji uyumlu mu?", "Tek marker ile final karar veriyor musun?"],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "cervix-p16-ki67-trap",
        titleTR: "Serviks: p16/Ki-67 aşırı güven ve reaktif/metaplazi tuzağı",
        titleEN: "Cervix p16/Ki-67 pitfalls",
        organSystem: "Gyn",
        category: "IHC Tuzakları",
        modality: "IHC",
        specimenType: "Biyopsi",
        difficulty: "Orta",
        tags: ["cervix", "p16", "Ki-67", "HSIL", "metaplasia"],
        teaser:
            "p16 ve Ki-67 yararlı surogatlar olsa da tek başına 'yüksek dereceli lezyon' kararı için yeterli olmayabilir.",
        whyItTricks: [
            "Patchy/heterojen p16 boyanma yanlış 'blok pozitif' gibi okunabilir.",
            "Reaktif değişikliklerde proliferasyon artışı abartılı yorumlanabilir.",
        ],
        keyClues: [
            "p16 paterni (yaygın/blok vs odaksal) ve lezyon topografisi değerlendirilmeli.",
            "Morfolojik kriterler temel; IHK destekleyici olmalı.",
        ],
        minimalWorkup: [
            "Şüpheli olgularda ek seviye/ek örnekleme değerlendirmesi.",
            "Gerekirse çoklu marker yaklaşımı ve klinik HPV bağlamı.",
        ],
        reportingTips: [
            "Morfoloji–IHK uyumsuzsa bunu raporda açıkça yazın ve takip/yeniden örnekleme stratejisi önerin.",
        ],
        checklist: ["p16 gerçekten blok paternde mi?", "Ki-67 dağılımı lezyonla uyumlu mu?", "Morfolojiye üstünlük tanıyor musun?"],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "thyroid-niftp-fvptc-sampling",
        titleTR: "Tiroid: NIFTP / FVPTC ayrımında örnekleme ve kriter tuzağı",
        titleEN: "Thyroid NIFTP vs invasive FVPTC pitfalls",
        organSystem: "Endokrin",
        category: "Örnekleme",
        modality: "H&E",
        specimenType: "Rezeksiyon",
        difficulty: "Zor",
        tags: ["thyroid", "NIFTP", "FVPTC", "capsule", "sampling"],
        teaser:
            "Kapsül invazyonu veya gerçek papiller yapılar atlanırsa NIFTP aşırı tanısı/eksik tanısı gelişebilir.",
        whyItTricks: [
            "Kapsül invazyonu çok odaksal olabilir.",
            "Morfolojik kriterler sınır olgularda yorumlayıcı değişkenlik taşır.",
        ],
        keyClues: [
            "Kapsül/perikapsüler alanlarda şüpheli odakları hedefli tarayın.",
            "Papiller yapılar, psammoma cisimleri, gerçek invazyon bulguları sistematik aranmalı.",
        ],
        minimalWorkup: [
            "Kapsülün geniş örneklenmesi.",
            "Şüpheli alanlara ek blok/ek seviye.",
            "Gerekirse moleküler/immün destek.",
        ],
        reportingTips: [
            "Örnekleme sınırları varsa raporda açıkça belirtin.",
            "Tanı kriterleri karşılanmıyorsa ara kategori/yorum dili ile risk yönetimi.",
        ],
        checklist: ["Kapsül yeterli örneklendi mi?", "Şüpheli alanlara ek blok var mı?", "Kriterleri sistematik kontrol ettin mi?"],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "pleura-mesothelioma-vs-metastasis-panel",
        titleTR: "Plevra: mezotelyoma vs metastatik karsinom – panel seçimi ve çapraz boyanma tuzakları",
        titleEN: "Mesothelioma vs metastatic carcinoma IHC panel pitfalls",
        organSystem: "Akciğer",
        category: "IHC Tuzakları",
        modality: "IHC",
        specimenType: "Biyopsi",
        difficulty: "Zor",
        tags: ["pleura", "mesothelioma", "metastasis", "IHC panel"],
        teaser:
            "Tek marker ile mezotelyoma/metastaz ayrımı risklidir. Uygun panel ve patern okuma şarttır.",
        whyItTricks: [
            "Bazı markerlar beklenmedik tümörlerde de pozitif olabilir.",
            "Zayıf/odaksal boyanmalar 'pozitif' diye aşırı yorumlanabilir.",
        ],
        keyClues: [
            "Morfoloji + klinik + panel uyumu birlikte değerlendirilmeli.",
            "Kompartıman ve boyanma dağılımı yorumun merkezinde olmalı.",
        ],
        minimalWorkup: [
            "Panel yaklaşımı (mezotelyal lehine + karsinom lehine marker kombinasyonu).",
            "Internal kontrollerin değerlendirilmesi.",
        ],
        reportingTips: [
            "Panel sonuçlarını 'morfoloji ile birlikte' yorumlayan bir rapor dili kullanın.",
            "Uyumsuzluk varsa: ek marker/ek örnekleme önerin.",
        ],
        checklist: ["Tek marker ile karar verme.", "Internal kontrol var mı?", "Morfoloji–panel tutarlı mı?"],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "ln-benign-inclusions-metastasis",
        titleTR: "Lenf nodu: benign epitel inklüzyonları vs metastaz – 'tek odak' tuzağı",
        titleEN: "Benign epithelial inclusions vs metastasis in lymph node",
        organSystem: "Lenfoid/Hemato",
        category: "Mimik",
        modality: "H&E",
        specimenType: "Rezeksiyon",
        difficulty: "Zor",
        tags: ["lymph node", "inclusion", "metastasis", "false positive"],
        teaser:
            "Lenf nodunda beklenmedik epitel yapıları metastaz sanılabilir. Klinik bağlam ve patern analizi kritik.",
        whyItTricks: [
            "Küçük epitel kümeleri otomatik metastaz çağrışımı yapar.",
            "IHK ile epitel doğrulamak 'metastazı doğrulamak' değildir.",
        ],
        keyClues: [
            "Yerleşim, morfoloji ve çevre stromal reaksiyonun tutarlılığı.",
            "Klinik primer olasılığı ve örnekleme öyküsü.",
        ],
        minimalWorkup: [
            "Ek seviye ile odak sürekliliği.",
            "Gerekirse hedefli IHK; ancak yorum 'morfoloji + klinik' ile birlikte.",
        ],
        reportingTips: [
            "Şüphe halinde 'metastaz lehine/alehine' gerekçeyi yazın; doğrulama planını belirtin.",
        ],
        checklist: ["Odak anatomik olarak beklenen yerde mi?", "Derin kesitte sürüyor mu?", "Klinik bağlam uyumlu mu?"],
        updatedAt: "2025-12-16",
    },

    {
        id: "urine-cytology-reactive-vs-hg",
        titleTR: "İdrar sitolojisi: reaktif atipi vs high-grade ürotelyal karsinom tuzağı",
        titleEN: "Urine cytology reactive atypia vs HGUC pitfall",
        organSystem: "Üriner",
        category: "Sitoloji Tuzakları",
        modality: "Sitoloji",
        specimenType: "Sitoloji",
        difficulty: "Orta",
        tags: ["urine", "cytology", "reactive", "HGUC"],
        teaser:
            "Enflamasyon/taş/işlem sonrası reaktif değişiklikler high-grade ile karışabilir.",
        whyItTricks: [
            "Reaktif hücrelerde nükleer büyüme ve hiperkromazi abartılı görünebilir.",
            "Az hücreli örneklerde değerlendirme güveni düşer.",
        ],
        keyClues: [
            "Örnek yeterliliği ve hücresel arka plan ile birlikte değerlendirme.",
            "Klinik (instrumentasyon, taş, enfeksiyon, önceki tümör) bağlamı.",
        ],
        minimalWorkup: [
            "Gerekirse tekrar örnek (yeterlilik için).",
            "Klinik korelasyon ve takip önerisi.",
        ],
        reportingTips: [
            "Kesin ifade yerine uygun sınıflama dili ve takip önerisi.",
        ],
        checklist: ["Örnek yeterli mi?", "Reaktif neden var mı?", "Klinik öykü biliniyor mu?"],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "frozen-ovary-mucinous-sampling",
        titleTR: "Frozen: over tümörlerinde (özellikle müsinöz) örnekleme ve freezing artefaktı tuzağı",
        titleEN: "Frozen section pitfalls in mucinous ovarian tumors",
        organSystem: "Gyn",
        category: "Frozen Tuzakları",
        modality: "Frozen",
        specimenType: "Frozen",
        difficulty: "Zor",
        tags: ["frozen", "ovary", "mucinous", "sampling", "borderline"],
        teaser:
            "Müsinöz tümörlerde heterojenite yüksektir; frozen'da sınırlı örnekleme 'benign/borderline' altında tanı riskini artırır.",
        whyItTricks: [
            "Heterojen lezyonda küçük frozen örneği temsil gücü düşüktür.",
            "Freezing artefaktı nükleer detayları bozar.",
        ],
        keyClues: [
            "Makroskopik heterojenite ve solid alanlar alarm bulgusudur.",
            "Frozen sonucu mutlaka temsil sınırlılığıyla birlikte düşünülmeli.",
        ],
        minimalWorkup: [
            "Frozen'da hedefli örnekleme: solid/papiller alanlara öncelik.",
            "Kalıcı kesitte geniş örnekleme planı.",
        ],
        reportingTips: [
            "Frozen raporunda temsiliyet sınırlılığı ve kalıcı kesit doğrulaması net yazılmalı.",
        ],
        checklist: ["Lezyon heterojen mi?", "Solid/papiller alan örneklendi mi?", "Frozen sonucu sınırlılık cümlesi içeriyor mu?"],
        references: [],
        updatedAt: "2025-12-16",
    },

    {
        id: "reporting-uncertainty-language",
        titleTR: "Raporlama: belirsizliği yönetme – 'kesin ifade' tuzağı",
        titleEN: "Reporting uncertainty management",
        organSystem: "Genel",
        category: "Raporlama",
        modality: "Genel",
        specimenType: "Genel",
        difficulty: "Orta",
        tags: ["reporting", "uncertainty", "limitations", "discordance"],
        teaser:
            "Belirsiz olguda 'kesin tanı' dili hata riskini artırır. Sınırlılıkları ve doğrulama planını raporlamak kaliteyi yükseltir.",
        whyItTricks: [
            "Klinik beklenti/acele faktörü 'final' dilini zorlayabilir.",
            "Sınırlılık belirtilmezse rapor yanlış güven üretir.",
        ],
        keyClues: [
            "Örnek yetersizliği, artefakt, klinik uyumsuzluk ve panel kısıtlılığı belirsizlik kaynaklarıdır.",
        ],
        minimalWorkup: [
            "Belirsizlik kaynağına yönelik adım: ek seviye, ek örnek, panel, klinik korelasyon.",
        ],
        reportingTips: [
            "'Mevcut kesitlerde…' ve 'değerlendirme şu nedenle kısıtlı…' cümlelerini standardize edin.",
            "Discordance varsa öneriyi net yazın (yeniden örnekleme/izlem).",
        ],
        checklist: ["Belirsizlik kaynağı rapora yazıldı mı?", "Doğrulama planı önerildi mi?", "Klinik korelasyon önerisi var mı?"],
        updatedAt: "2025-12-16",
    },
    {
        id: "thyroid-htt-vs-ptc",
        titleTR: "Hiyalinize Trabeküler Tümör (HTT) vs Papiller Karsinom (PTC)",
        titleEN: "Hyalinizing Trabecular Tumor vs Papillary Thyroid Carcinoma",
        organSystem: "Endokrin",
        category: "Mimik",
        modality: "H&E",
        specimenType: "Rezeksiyon",
        difficulty: "Zor",
        tags: ["thyroid", "HTT", "PTC", "Ki-67", "MIB-1", "membranöz"],
        teaser:
            "HTT, nükleer özellikleri (invajinasyon, oluklaşma) nedeniyle papiller karsinomu taklit eder. Yanlışlıkla PTC tanısı konulabilir.",
        whyItTricks: [
            "PTC'ye benzer nükleer özellikler (oluk, psödoinklüzyon) gösterir.",
            "Trabeküler büyüme paterni bazen folliküler varyant PTC ile karışır.",
        ],
        keyClues: [
            "Belirgin intratrabeküler hiyalinizasyon ve poligonal/uzun hücreler.",
            "Sitoplazmik sarı cisimcikler (yellow bodies) (bazen).",
            "MIB-1 (Ki-67) ile karakteristik membranöz boyanma.",
        ],
        minimalWorkup: [
            "Ki-67 (MIB-1) IHK: Membranöz boyanma HTT için tipiktir (PTC'de nükleer).",
            "Klinik korelasyon (genellikle benign seyirlidir).",
        ],
        reportingTips: [
            "Şüphede kalınırsa 'Hiyalinize Trabeküler Tümör' lehine bulguları belirtin ve Ki-67 desenini not edin.",
        ],
        checklist: [
            "Trabeküler yapı ve hiyalin var mı?",
            "Ki-67 membranöz boyandı mı?",
            "Gerçek papiller yapılar var mı (HTT'de beklenmez)?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },
    {
        id: "thyroid-hashimoto-vs-lymphoma",
        titleTR: "Hashimoto Tiroiditi vs MALT Lenfoma",
        titleEN: "Hashimoto Thyroiditis vs MALT Lymphoma",
        organSystem: "Endokrin",
        category: "Benign vs Malign",
        modality: "Genel",
        specimenType: "Rezeksiyon",
        difficulty: "Orta",
        tags: ["thyroid", "hashimoto", "lymphoma", "MALT", "lymphoepithelial"],
        teaser:
            "Hashimoto zeminindeki yoğun lenfoid infiltrasyon ve germinal merkezler, MALT lenfoma ile karışabilir veya lenfomayı maskeleyebilir.",
        whyItTricks: [
            "Hashimoto'da lenfoid doku yoğundur ve lenfoepitelyal lezyonlar görülebilir.",
            "Reaktif germinal merkezler bazen atipik görünebilir.",
        ],
        keyClues: [
            "Lenfoma lehine: Monoton hücre popülasyonu, geniş interfoliküler alan invazyonu, belirgin lenfoepitelyal lezyonlar.",
            "Hashimoto lehine: Polimorfik infiltrasyon, düzenli germinal merkezler, onkositik metaplazi.",
        ],
        minimalWorkup: [
            "Şüphe halinde IHK paneli: CD20, CD3, CD5, CD10, CD23, Bcl-2, Kappa/Lambda.",
            "Monoklonalite göstergesi (hafif zincir kısıtlılığı).",
        ],
        reportingTips: [
            "Yoğun lenfoid infiltrasyonda 'lenfoproliferatif hastalık' şüphesi varsa mutlaka IHK ile ekarte edildiğini belirtin.",
        ],
        checklist: [
            "Hücre popülasyonu monoton mu?",
            "Lenfoepitelyal lezyonlar belirgin mi?",
            "IHK ile klonalite bakıldı mı?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },
    {
        id: "thyroid-cyst-papillary-mimic",
        titleTR: "Kistik Değişiklikler ve Papiller Hiperplazi (Graves/Nodüler Guatr) vs PTC",
        titleEN: "Cystic changes/Papillary hyperplasia vs PTC",
        organSystem: "Endokrin",
        category: "Benign vs Malign",
        modality: "H&E",
        specimenType: "Biyopsi",
        difficulty: "Orta",
        tags: ["thyroid", "cyst", "papillary hyperplasia", "graves", "mimic"],
        teaser:
            "Graves hastalığında veya kistik dejenere nodüllerde görülen papiller hiperplazi, Sanderson polsterleri papiller karsinom sanılabilir.",
        whyItTricks: [
            "Papiller yapılar mevcuttur.",
            "Nükleer atipi veya optik açıklıklar (artefaktüel) görülebilir.",
        ],
        keyClues: [
            "Benign papiller: Fibrovasküler kor genellikle incedir veya ödemlidir, nükleer özellikler (oluk/inklüzyon) eksiktir veya şüphelidir.",
            "PTC: Gerçek fibrovasküler kor, karakteristik nükleer özellikler, psammoma cisimleri (bazı varyantlarda).",
        ],
        minimalWorkup: [
            "Nükleer özelliklerin (grooves, inclusions) dikkatli değerlendirilmesi.",
            "Gerekirse diffüz/fokal dağılımın ve kapsül ilişkisinin incelenmesi.",
        ],
        reportingTips: [
            "Kistik dejenerasyon ve Sanderson polsterlerinin PTC ile karışabileceği akılda tutulmalı.",
        ],
        checklist: [
            "Nükleer özellikler tam mı (basit açıklık yetmez)?",
            "Klinik Graves öyküsü var mı?",
            "Papillalar gerçek mi (fibrovasküler kor)?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },
    {
        id: "thyroid-medullary-vs-follicular",
        titleTR: "Medüller Karsinom vs Folliküler/Diğer Tümörler",
        titleEN: "Medullary Carcinoma vs Follicular/Other mimics",
        organSystem: "Endokrin",
        category: "Mimik",
        modality: "IHC",
        specimenType: "Biyopsi",
        difficulty: "Orta",
        tags: ["thyroid", "medullary", "calcitonin", "amyloid", "mimic"],
        teaser:
            "Medüller karsinom 'büyük taklitçi'dir; iğsi, plazmasitoid veya folliküler benzeri yapılar oluşturabilir. Atlanması ciddi sonuçlar doğurur.",
        whyItTricks: [
            "Nadir görülür, akla gelmeyebilir.",
            "Folliküler varyantı veya onkositik varyantı diğer tiroid tümörlerini taklit eder.",
        ],
        keyClues: [
            "Tuz-biber kromatin, amiloid varlığı (her zaman olmaz).",
            "Tiroid dışı (nöroendokrin) görünüm.",
        ],
        minimalWorkup: [
            "Şüpheli, atipik veya sınıflandırılamayan her tiroid tümöründe: Kalsitonin (Calcitonin) IHK.",
            "Amiloid (Kongo kırmızısı) yardımcı olabilir.",
            "CEA, Chromogranin, Synaptophysin.",
        ],
        reportingTips: [
            "Tiroid tümörlerinde morfoloji tipik değilse Kalsitonin mutlaka panele eklenmeli.",
        ],
        checklist: [
            "Kromatin nöroendokrin yapıda mı?",
            "Kalsitonin boyandı mı?",
            "Amiloid birikimi var mı?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },
    {
        id: "thyroid-c-cell-hyperplasia",
        titleTR: "C-Hücre Hiperplazisi vs Medüller Mikrokarsinom",
        titleEN: "C-cell hyperplasia vs Medullary microcarcinoma",
        organSystem: "Endokrin",
        category: "Benign vs Malign",
        modality: "IHC",
        specimenType: "Rezeksiyon",
        difficulty: "Zor",
        tags: ["thyroid", "c-cell", "hyperplasia", "microcarcinoma", "MEN"],
        teaser:
            "Fizyolojik veya reaktif C-hücre artışı, neoplastik mikrokarsinom ile karışabilir. MEN sendromu taraması için ayrım kritiktir.",
        whyItTricks: [
            "Her ikisi de Kalsitonin pozitiftir.",
            "Sınır (cut-off) değerleri ve dağılım paterni karışıklık yaratabilir.",
        ],
        keyClues: [
            "Hiperplazi: Follikül içi/perifolliküler sınırlı dağılım, bazal membran aşılmaz.",
            "Karsinom: Stromal invazyon, desmoplazi, nodüler/kümeleşmiş büyüme ve bazal membran ihlali.",
        ],
        minimalWorkup: [
            "Kalsitonin ve Kollajen Tip IV (bazal membran için) kombinasyonu.",
            "Kesitlerin dikkatli taranması (invazyon arayışı).",
        ],
        reportingTips: [
            "Neoplastik olmayan C-hücre artışlarında 'hiperplazi' terimini dikkatli kullanın, fizyolojik de olabilir.",
        ],
        checklist: [
            "Bazal membran intakt mı?",
            "Stromal invazyon var mı?",
            "Nodüler genişleme var mı?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },
    {
        id: "thyroid-parathyroid-mimic",
        titleTR: "İntratiroidal Paratiroid vs Tiroid Nodülü",
        titleEN: "Intrathyroidal Parathyroid vs Thyroid Nodule",
        organSystem: "Endokrin",
        category: "Mimik",
        modality: "IHC",
        specimenType: "Rezeksiyon",
        difficulty: "Orta",
        tags: ["thyroid", "parathyroid", "mimic", "GATA3", "PTH"],
        teaser:
            "Tiroid içinde yerleşmiş paratiroid dokusu, hücresel bir tiroid nodülü (adenom/karsinom) sanılabilir.",
        whyItTricks: [
            "Berrak hücreli veya onkositik değişiklikler tiroid lezyonlarını taklit eder.",
            "Folliküler benzeri yapılar (psödofolliküller) içerebilir.",
        ],
        keyClues: [
            "Kapiller damar ağı zengindir.",
            "Kolloid benzeri materyal olsa da gerçek kolloid değildir.",
        ],
        minimalWorkup: [
            "IHK Paneli: TTF-1, Tiroglobulin (Tiroid) vs PTH, GATA3, Chromogranin (Paratiroid).",
        ],
        reportingTips: [
            "Tanımlanamayan hücresel nodüllerde paratiroid olasılığını aklınızda bulundurun.",
        ],
        checklist: [
            "TTF-1 negatif mi?",
            "PTH veya GATA3 pozitif mi?",
            "Vaskülarizasyon paratiroid ile uyumlu mu?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },
    {
        id: "thyroid-capsular-invasion",
        titleTR: "Folliküler Karsinom: Kapsül İnvazyonu Değerlendirme Tuzakları",
        titleEN: "Follicular Carcinoma: Capsular invasion pitfalls",
        organSystem: "Endokrin",
        category: "Benign vs Malign",
        modality: "H&E",
        specimenType: "Rezeksiyon",
        difficulty: "Zor",
        tags: ["thyroid", "follicular", "capsule", "invasion", "mushroom"],
        teaser:
            "Kapsül invazyonu tanısı için 'transkapsüler' tam kat geçiş veya 'mantar' (mushrooming) paterni gerekir. Teğet kesitler ve biyopsi alanları yanıltabilir.",
        whyItTricks: [
            "Biyopsi/iğne traktına bağlı kapsül düzensizliği invazyon sanılabilir (WHAFFT).",
            "Teğet kesitlerde tümör adaları kapsül içinde gibi görünebilir.",
        ],
        keyClues: [
            "İnvazyon alanında kapsül dışına taşma ve mantar benzeri genişleme.",
            "Reaktif değişikliklerin (siderofajlar, granülasyon) eşlik etmemesi (biyopsi hattı ekarte edilmeli).",
        ],
        minimalWorkup: [
            "Kapsülün tamamının veya çok geniş bir kısmının örneklenmesi.",
            "Şüpheli alanlardan ek derin kesitler (teğet durumu ekarte etmek için).",
        ],
        reportingTips: [
            "Kapsül invazyonu şüpheli ama kesin değilse 'belirsiz malign potansiyelli (UMP)' veya benzeri ara kategoriler düşünülebilir.",
        ],
        checklist: [
            "Kapsül tam kat geçildi mi?",
            "İnvazyon alanında reaktif (biyopsi) bulgusu var mı?",
            "Mantar (mushroom) görüntüsü var mı?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },
    {
        id: "thyroid-oncocytic-features",
        titleTR: "Onkositik Değişiklikler: Malignite vs Metaplazi",
        titleEN: "Oncocytic change: Malignancy vs Metaplasia",
        organSystem: "Endokrin",
        category: "Benign vs Malign",
        modality: "Genel",
        specimenType: "Genel",
        difficulty: "Orta",
        tags: ["thyroid", "oncocytic", "hurthle", "metaplasia", "hashimoto"],
        teaser:
            "Hashimoto veya nodüler guatrda görülen onkositik (Hürthle) nodüller, onkositik karsinom ile karışabilir.",
        whyItTricks: [
            "Onkositik hücreler sitolojik olarak atipik (büyük nükleol) görünebilir.",
            "Solid büyüme paterni gösterebilirler.",
        ],
        keyClues: [
            "Hashimoto zemininde onkositik nodüller genellikle çokludur ve kapsülsüzdür.",
            "Gerçek neoplazmda kapsül ve/veya vasküler invazyon aranmalıdır.",
        ],
        minimalWorkup: [
            "Kapsül varlığı ve invazyonun değerlendirilmesi.",
            "Arka plan tiroid dokusunun incelenmesi (Hashimoto?).",
        ],
        reportingTips: [
            "Zemin Hashimoto ise onkositik nodüllere yaklaşımda daha muhafazakar olunmalı.",
        ],
        checklist: [
            "Lezyon soliter mi multipl mi?",
            "Kapsül/invazyon var mı?",
            "Zeminde tiroidit var mı?",
        ],
        references: [],
        updatedAt: "2025-12-16",
    },
    // Blog arşivindeki gerçek Issues'a dayanan, önceki 26 rehberden farklı 16 tanı tuzağı.
    {
        "id": "renal-tfe3-bap1-false-translocation",
        "titleTR": "Böbrek: TFE3 pozitifliği her zaman translokasyon değildir",
        "titleEN": "Native TFE3 expression vs TFE3-rearranged RCC",
        "organSystem": "Üriner",
        "category": "IHC Tuzakları",
        "modality": "IHC",
        "specimenType": "Rezeksiyon",
        "difficulty": "Zor",
        "tags": [
            "renal",
            "TFE3",
            "BAP1",
            "GPNMB",
            "MiT",
            "translocation RCC"
        ],
        "teaser": "Yüksek dereceli şeffaf hücreli renal hücreli karsinomda, özellikle BAP1 kaybıyla birlikte nükleer TFE3 görülebilir; bu bulgu tek başına TFE3 füzyonu kanıtı değildir.",
        "whyItTricks": [
            "Nükleer TFE3 boyanması gen yeniden düzenlenmesiyle kolayca eşitlenir.",
            "Eozinofilik veya rabdoid yüksek dereceli alanlar MiT ailesi renal tümörleri taklit edebilir.",
            "İHK pozitifliği ile moleküler testin ölçtüğü olay aynı değildir."
        ],
        "keyClues": [
            "Klasik şeffaf hücreli karsinom alanlarını ve BAP1 kaybını iç kontrol eşliğinde yeniden değerlendirin.",
            "GPNMB boyanması destekleyici bağlam sağlar; negatifliği TFE3 füzyonunu tek başına dışlamaz.",
            "Gerçek TFE3 yeniden düzenlenmesi kuşkusunda morfoloji ve klinik verileri birlikte yorumlayın."
        ],
        "minimalWorkup": [
            "Temsil edici yüksek dereceli alanları, BAP1 iç kontrolünü ve TFE3 nükleer boyanma paternini gözden geçirin.",
            "Gerektiğinde TFE3 için valide break-apart FISH veya uygun RNA füzyon analizi yapın."
        ],
        "reportingTips": [
            "TFE3 İHK pozitifliğini “TFE3 yeniden düzenlenmesi” olarak kesinleştirmeyin.",
            "Doğrulama yapılmadıysa moleküler alt tipin belirsizliğini açıkça yazın."
        ],
        "checklist": [
            "Klasik şeffaf hücreli morfoloji var mı?",
            "BAP1 iç kontrolü geçerli mi?",
            "GPNMB ve TFE3 sonuçları birlikte değerlendirildi mi?",
            "Genetik yeniden düzenlenme kanıtlandı mı?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #995",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/995"
            },
            {
                "label": "PubMed PMID: 42925968",
                "url": "https://pubmed.ncbi.nlm.nih.gov/42925968/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "renal-tfeb-ihc-vs-alteration",
        "titleTR": "Böbrek: TFEB İHK pozitifliği, yeniden düzenlenme veya amplifikasyon değildir",
        "titleEN": "TFEB-associated renal neoplasia: immunophenotype vs genomic alteration",
        "organSystem": "Üriner",
        "category": "IHC Tuzakları",
        "modality": "Moleküler",
        "specimenType": "Rezeksiyon",
        "difficulty": "Zor",
        "tags": [
            "renal",
            "TFEB",
            "RNA-ISH",
            "GPNMB",
            "cathepsin K",
            "amplification"
        ],
        "teaser": "TFEB proteini, Katepsin K veya GPNMB pozitifliği TFEB genindeki değişikliğin türünü belirlemez; yeniden düzenlenme ve amplifikasyon ayrı ayrı doğrulanmalıdır.",
        "whyItTricks": [
            "TFEB antikor klonu ve teknik koşullar boyanmayı etkileyebilir.",
            "Katepsin K ve GPNMB farklı renal tümörlerde de pozitif olabilir.",
            "TFEB ile TFE3 ilişkili tümörler fenotipik olarak örtüşebilir."
        ],
        "keyClues": [
            "TFEB yeniden düzenlenmesi ile TFEB amplifikasyonunun farklı genetik olaylar olduğunu koruyun.",
            "İHK sonucu ile RNA-ISH/genetik analiz sonuçları birbiri yerine geçmez.",
            "Klinik, morfoloji ve yaygın renal tümör tiplerinin dışlanması önemlidir."
        ],
        "minimalWorkup": [
            "TFEB, Katepsin K ve GPNMB bulgularını uygun kontrol ve valide protokolle değerlendirin.",
            "Endikasyona göre TFEB FISH veya valide moleküler/RNA yöntemleriyle doğrulama planlayın."
        ],
        "reportingTips": [
            "“TFEB-ilişkili tümör şüphesi” ile “TFEB yeniden düzenlenmesi doğrulanmıştır” ifadelerini ayırın."
        ],
        "checklist": [
            "İHK klonu ve kontrol uygun mu?",
            "TFEB amplifikasyonu ile füzyonu ayrıştırıldı mı?",
            "Moleküler doğrulama var mı?"
        ],
        "references": [
            {
                "label": "PubMed PMID: 42947507",
                "url": "https://pubmed.ncbi.nlm.nih.gov/42947507/"
            },
            {
                "label": "Blog arşivi: GitHub Issue #1013",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1013"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "renal-oncocytic-gpnmb-lot-evt",
        "titleTR": "Onkositik böbrek tümörlerinde GPNMB: LOT, EVT ve kromofob RHK ayrımı",
        "titleEN": "Oncocytic renal neoplasms: GPNMB and integrated differential diagnosis",
        "organSystem": "Üriner",
        "category": "IHC Tuzakları",
        "modality": "IHC",
        "specimenType": "Rezeksiyon",
        "difficulty": "Zor",
        "tags": [
            "renal",
            "GPNMB",
            "LOT",
            "EVT",
            "CK7",
            "CD117",
            "chromophobe"
        ],
        "teaser": "GPNMB pozitifliği LOT veya başka bir onkositik renal tümör için destek olabilir, ancak tanıyı tek başına belirlemez.",
        "whyItTricks": [
            "LOT, EVT, onkositom ve kromofob RHK morfolojik olarak örtüşebilir.",
            "GPNMB, mTOR yolak değişiklikleri ve başka renal neoplazilerde de ekspresse olabilir."
        ],
        "keyClues": [
            "CK7 ve CD117 dağılımını morfolojiyle birlikte değerlendirin.",
            "LOT lehine yaygın CK7 ve çoğunlukla CD117 negatifliği önemlidir; tek marker ile sınıflama yapmayın.",
            "Sınırda olgularda tümörün tamamı ve klinik bağlam değerlidir."
        ],
        "minimalWorkup": [
            "Morfolojik inceleme + CK7 ve CD117 ile başlayın.",
            "Seçilmiş olguda GPNMB, GATA3 ve/veya L1CAM gibi destekleyicileri kullanın; moleküler test kararı bütünleşik veriye dayansın."
        ],
        "reportingTips": [
            "Moleküler olarak tanımlı antite izlenimi verecek kesin ifadelerden, destek yetersizse kaçının."
        ],
        "checklist": [
            "CK7/CD117 paterni nedir?",
            "GPNMB sonucu özgül sanıldı mı?",
            "Morfoloji ve klinik uyumlu mu?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #1021",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1021"
            },
            {
                "label": "PubMed PMID: 35072947",
                "url": "https://pubmed.ncbi.nlm.nih.gov/35072947/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "urothelial-lateral-spread-vs-cis",
        "titleTR": "Papiller ürotelyal karsinom komşuluğunda düz atipi: lateral yayılım mı CIS mi?",
        "titleEN": "Urothelial lateral spread versus separate carcinoma in situ",
        "organSystem": "Üriner",
        "category": "Mimik",
        "modality": "H&E",
        "specimenType": "Rezeksiyon",
        "difficulty": "Zor",
        "tags": [
            "urothelial",
            "papillary",
            "lateral spread",
            "CIS",
            "CK20",
            "p53"
        ],
        "teaser": "Papiller tümöre bitişik düz ürotelyumda neoplastik atipi, bağımsız carcinoma in situ (CIS) odağı yerine tümörün lateral yayılımını temsil edebilir.",
        "whyItTricks": [
            "Düz epiteldeki atipi ayrı CIS odağı olarak aşırı sınıflandırılabilir.",
            "Anormal CK20 veya p53 boyanması bağımsız CIS varlığını ispatlamaz."
        ],
        "keyClues": [
            "Papiller tümör ve düz epitel arasındaki histolojik sürekliliği araştırın.",
            "Atipinin düz epitelde gerçek CIS morfolojik kriterlerini karşılayıp karşılamadığını sorgulayın.",
            "Boyanma paternini bağımsız histolojik kanıtın yerine koymayın."
        ],
        "minimalWorkup": [
            "Papiller tümör-düz ürotelyum geçişini içeren ek kesitler.",
            "Gerekiyorsa CK20/p53 ile destek; karar H&E ve anatomik devamlılığa dayansın."
        ],
        "reportingTips": [
            "Ayrı CIS tanısı destekleniyorsa raporlayın; aksi durumda lateral uzanımı betimleyin ve belirsizliği koruyun."
        ],
        "checklist": [
            "Atipi papiller tümöre devamlı mı?",
            "Bağımsız CIS kriterleri var mı?",
            "CK20/p53 aşırı yorumlandı mı?"
        ],
        "references": [
            {
                "label": "PubMed PMID: 42958923",
                "url": "https://pubmed.ncbi.nlm.nih.gov/42958923/"
            },
            {
                "label": "Blog arşivi: GitHub Issue #1027",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1027"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "urothelial-focal-high-grade-percent",
        "titleTR": "Papiller ürotelyal karsinomda fokal yüksek derece: yüzde eşiği tuzağı",
        "titleEN": "Focal high-grade component in papillary urothelial carcinoma",
        "organSystem": "Üriner",
        "category": "Grading/Staging",
        "modality": "H&E",
        "specimenType": "Rezeksiyon",
        "difficulty": "Orta",
        "tags": [
            "urothelial",
            "papillary",
            "grade",
            "high grade",
            "low grade",
            "5 percent"
        ],
        "teaser": "Sınırlı yüksek dereceli alanın varlığı ve oranı, yalnız tek bir yüzde eşiğine indirgenmeden güncel derecelendirme yaklaşımı ve örnekleme ile değerlendirilmelidir.",
        "whyItTricks": [
            "Küçük yüksek dereceli odaklar kesitler arasında değişken görünebilir.",
            "Ölçüm yöntemi tanımlanmayan yaklaşık yüzde ifadesi yalancı kesinlik yaratır."
        ],
        "keyClues": [
            "Gerçek yüksek dereceli nükleer ve mimari özellikleri dejeneratif atipiden ayırın.",
            "Yüksek dereceli alanın oranını, yaygınlığını ve örnekleme sınırını birlikte belirtin."
        ],
        "minimalWorkup": [
            "Temsil edici tümör alanlarının tamamında derecelendirmeyi gözden geçirin.",
            "Gerekli durumda ek seviye ve ikinci patolog değerlendirmesi."
        ],
        "reportingTips": [
            "Kullanılan WHO/ISUP derecelendirme şeması ve yerel raporlama protokolüne göre dereceyi verin.",
            "Fokal yüksek dereceli komponenti uygun olguda ayrıca belirtin; tek başına %5’i evrensel biyolojik eşik gibi sunmayın."
        ],
        "checklist": [
            "Gerçek yüksek dereceli morfoloji var mı?",
            "Oran temsil edici mi?",
            "Hangi kılavuz/protokol uygulandı?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #851",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/851"
            },
            {
                "label": "PubMed PMID: 41456876",
                "url": "https://pubmed.ncbi.nlm.nih.gov/41456876/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "soft-tissue-stat6-sft-vs-ddlps",
        "titleTR": "Retroperitonda STAT6 pozitif iğsi hücreli tümör: SFT mi DDLPS mi?",
        "titleEN": "STAT6-positive retroperitoneal spindle cell tumor: SFT vs DDLPS",
        "organSystem": "Yumuşak Doku",
        "category": "IHC Tuzakları",
        "modality": "IHC",
        "specimenType": "Biyopsi",
        "difficulty": "Zor",
        "tags": [
            "STAT6",
            "SFT",
            "DDLPS",
            "MDM2",
            "CDK4",
            "retroperitoneum"
        ],
        "teaser": "Nükleer STAT6, solitary fibrous tumor için güçlü destek olsa da bazı dediferansiye liposarkomlar da STAT6 ekspresse edebilir.",
        "whyItTricks": [
            "12q bölgesi amplifikasyonu DDLPS’de STAT6 ekspresyonu oluşturabilir.",
            "Yağ dokusu içermeyen iğsi hücreli biyopsi SFT görünümü verebilir."
        ],
        "keyClues": [
            "Retroperitoneal/perirenal anatomik yerleşim, radyolojik yağlı komponent ve heterojen morfoloji önemlidir.",
            "MDM2/CDK4 İHK destekleyicidir; MDM2 amplifikasyonu ayrı bir genetik bulgudur."
        ],
        "minimalWorkup": [
            "STAT6 ve CD34’ü patern düzeyinde yorumlayın; MDM2/CDK4 desteği ekleyin.",
            "DDLPS olasılığında MDM2 amplifikasyonunu FISH veya valide eşdeğer yöntemle doğrulayın."
        ],
        "reportingTips": [
            "Sadece STAT6 boyanmasına dayanarak SFT tanısı koymayın.",
            "Moleküler veri ve radyolojik korelasyon eksikliğini gerekçeli yazın."
        ],
        "checklist": [
            "Retroperitoneal yerleşim var mı?",
            "MDM2 amplifikasyonu değerlendirildi mi?",
            "STAT6 pozitifliği tek kanıt mı?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #1039",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1039"
            },
            {
                "label": "PubMed PMID: 24457460",
                "url": "https://pubmed.ncbi.nlm.nih.gov/24457460/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "soft-tissue-ddlps-no-fat-core",
        "titleTR": "Yağ içermeyen biyopside dediferansiye liposarkomu kaçırma",
        "titleEN": "Dedifferentiated liposarcoma without adipocytic component in core biopsy",
        "organSystem": "Yumuşak Doku",
        "category": "Örnekleme",
        "modality": "H&E",
        "specimenType": "Biyopsi",
        "difficulty": "Zor",
        "tags": [
            "DDLPS",
            "MDM2",
            "CDK4",
            "biopsy",
            "retroperitoneum",
            "liposarcoma"
        ],
        "teaser": "Dediferansiye liposarkomun küçük biyopsisinde lipomatöz komponent hiç görünmeyebilir; bu durumda tanı radyoloji ve uygun moleküler doğrulamayla yakalanır.",
        "whyItTricks": [
            "Yalnız nonlipogenik iğsi/pleomorfik alan örneklenmiş olabilir.",
            "MDM2 İHK sonucu gen amplifikasyonuyla özdeş değildir."
        ],
        "keyClues": [
            "Retroperitoneal büyük kitlenin görüntülemesinde iyi diferansiye yağlı alan olup olmadığını araştırın.",
            "Farklı diferansiyasyon paternlerinde DDLPS olasılığını dışlamayın."
        ],
        "minimalWorkup": [
            "Radyoloji-patoloji korelasyonu ve uygun ek blok örnekleme.",
            "MDM2 amplifikasyonunun FISH/valide eşdeğer testle araştırılması; bölgeye göre diğer MDM2-amplifiye neoplazileri ayırın."
        ],
        "reportingTips": [
            "Sadece yağ komponenti görülmedi diye DDLPS’yi dışlamayın; raporda biyopsi sınırlılığını belirtin."
        ],
        "checklist": [
            "Görüntüleme incelendi mi?",
            "MDM2 amplifikasyonu var mı?",
            "Başka MDM2-amplifiye tümörler dışlandı mı?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #722",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/722"
            },
            {
                "label": "Blog arşivi: GitHub Issue #1039",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1039"
            },
            {
                "label": "PubMed PMID: 40540926",
                "url": "https://pubmed.ncbi.nlm.nih.gov/40540926/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "soft-tissue-pantrk-negative-ntrk-fusion",
        "titleTR": "Pan-TRK negatifliği NTRK füzyonunu kesin dışlamaz",
        "titleEN": "False-negative pan-TRK immunohistochemistry in NTRK-fusion tumors",
        "organSystem": "Yumuşak Doku",
        "category": "IHC Tuzakları",
        "modality": "Moleküler",
        "specimenType": "Biyopsi",
        "difficulty": "Orta",
        "tags": [
            "NTRK",
            "pan-TRK",
            "fusion",
            "RNA-NGS",
            "spindle cell"
        ],
        "teaser": "Pan-TRK İHK tarama testidir; negatif sonuç özellikle NTRK3 ilişkili füzyonları dışlamak için yeterli olmayabilir.",
        "whyItTricks": [
            "Ekspresyon seviyesi, füzyon partneri, preanalitik etkenler ve antikor klonu duyarlılığı etkiler.",
            "Negatif İHK, ekspresse bir füzyonun bulunmadığının kesin kanıtı sanılabilir."
        ],
        "keyClues": [
            "Morfoloji ve yaş/yerleşim NTRK ilişkili bir tümörü güçlü düşündürüyorsa İHK negatifliğine rağmen kuşku korunur.",
            "Moleküler testin füzyon kapsamı ve RNA kalitesi bilinmelidir."
        ],
        "minimalWorkup": [
            "Uygun morfolojik endikasyonda valide RNA füzyon paneli; alternatif test yöntemi ihtiyacını değerlendirin."
        ],
        "reportingTips": [
            "“Pan-TRK negatif” ile “NTRK füzyonu yok” ifadelerini eşitlemeyin.",
            "RNA sonucu başarısızsa negatif değil, teknik olarak değerlendirilemedi yazın."
        ],
        "checklist": [
            "Klinik/morfolojik kuşku yüksek mi?",
            "Pan-TRK boyasının kontrolü uygun mu?",
            "RNA kalite ve panel kapsamı yeterli mi?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #1038",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1038"
            },
            {
                "label": "PubMed PMID: 35933886",
                "url": "https://pubmed.ncbi.nlm.nih.gov/35933886/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "bone-chondroblastoma-k36m-vs-giantcell",
        "titleTR": "Epifizyal dev hücreli lezyon: Chondroblastoma mı giant cell tumour mü?",
        "titleEN": "Chondroblastoma versus giant cell tumor: H3 K36M and H3 G34W",
        "organSystem": "Kemik",
        "category": "Mimik",
        "modality": "IHC",
        "specimenType": "Biyopsi",
        "difficulty": "Orta",
        "tags": [
            "chondroblastoma",
            "H3 K36M",
            "H3 G34W",
            "giant cell tumour",
            "epiphysis"
        ],
        "teaser": "Dev hücrelerin ve sekonder anevrizmal değişikliğin baskın olduğu küçük örnekte Chondroblastoma, giant cell tumour veya kistik lezyon sanılabilir.",
        "whyItTricks": [
            "Sekonder anevrizmal kemik kisti alttaki solid tümörü örtebilir.",
            "Reaktif dev hücreler neoplastik mononükleer popülasyonla karıştırılabilir."
        ],
        "keyClues": [
            "Yaş, epifiz/apofiz yerleşimi ve matriks bulgularını değerlendirin.",
            "H3.3 K36M pozitifliği chondroblastoma neoplastik mononükleer hücrelerinde nükleer olmalıdır.",
            "Giant cell tumour için H3 G34W (varyant sınırlılıklarıyla) ayrı destekleyici kanıttır."
        ],
        "minimalWorkup": [
            "Radyolojiyle birlikte solid mononükleer alanlardan kesit ve H3.3 K36M; uygun olguda H3 G34W."
        ],
        "reportingTips": [
            "Antikor negatifliğini tanıyı mutlak dışlayan sonuç olarak sunmayın; teknik ve mutasyon varyantlarını değerlendirin."
        ],
        "checklist": [
            "Epifizyal yerleşim var mı?",
            "Solid tümör alanı örneklendi mi?",
            "Mononükleer hücre boyanması değerlendirildi mi?"
        ],
        "references": [
            {
                "label": "PubMed PMID: 24162739",
                "url": "https://pubmed.ncbi.nlm.nih.gov/24162739/"
            },
            {
                "label": "Blog arşivi: GitHub Issue #848",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/848"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "bone-mesenchymal-chondrosarcoma-ncoa2-fish",
        "titleTR": "Mezenkimal kondrosarkomda NCOA2 FISH negatifliği: yanlış dışlama tuzağı",
        "titleEN": "Mesenchymal chondrosarcoma: NCOA2 FISH negative despite fusion",
        "organSystem": "Kemik",
        "category": "Diğer",
        "modality": "Moleküler",
        "specimenType": "Biyopsi",
        "difficulty": "Zor",
        "tags": [
            "mesenchymal chondrosarcoma",
            "HEY1::NCOA2",
            "NCOA2",
            "FISH",
            "RNA-NGS"
        ],
        "teaser": "Bifazik morfoloji güçlü biçimde mezenkimal kondrosarkomu düşündürüyorsa negatif NCOA2 break-apart FISH, HEY1::NCOA2 füzyonunu kesin dışlamaz.",
        "whyItTricks": [
            "Probe tasarımı, kırılma noktası veya teknik kalite nedeniyle FISH negatif olabilir.",
            "Break-apart FISH füzyon partnerini doğrudan tanımlamaz."
        ],
        "keyClues": [
            "İlkel küçük yuvarlak hücreler ile iyi diferansiye hiyalin kıkırdak adalarının birlikteliğini arayın.",
            "Morfoloji-test uyumsuzluğunda alternatif RNA füzyon yöntemi düşünün."
        ],
        "minimalWorkup": [
            "FISH kalitesi ve analiz edilebilir tümör oranını gözden geçirin.",
            "Gerektiğinde HEY1::NCOA2 ve ilişkili füzyonları kapsayan RNA-NGS yöntemi kullanın."
        ],
        "reportingTips": [
            "Negatif FISH’i negatif füzyon taraması gibi raporlamayın; yöntem sınırlılığını belirtin."
        ],
        "checklist": [
            "Bifazik morfoloji var mı?",
            "FISH kontrolü ve tümör oranı uygun mu?",
            "RNA bazlı doğrulama mümkün mü?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #1047",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1047"
            },
            {
                "label": "PubMed PMID: 42967628",
                "url": "https://pubmed.ncbi.nlm.nih.gov/42967628/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "bone-bnct-vs-chordoma",
        "titleTR": "Benign notokordal hücreli tümör mü chordoma mı? İHK tek başına yetmez",
        "titleEN": "Benign notochordal cell tumor versus chordoma",
        "organSystem": "Kemik",
        "category": "Benign vs Malign",
        "modality": "H&E",
        "specimenType": "Biyopsi",
        "difficulty": "Zor",
        "tags": [
            "BNCT",
            "chordoma",
            "brachyury",
            "axial skeleton",
            "destruction"
        ],
        "teaser": "Brachyury ve keratin pozitifliği hem benign notokordal hücreli tümörde hem chordoma’da bulunabilir; kritik ayrım destrüksiyon, matriks ve radyolojidir.",
        "whyItTricks": [
            "Notokordal fenotip maligniteyle eş tutulabilir.",
            "Küçük biyopsi destrüktif invazyonu ve belirgin myxoid lobülleri kaçırabilir."
        ],
        "keyClues": [
            "Kemik destrüksiyonu ve yumuşak doku kitlesi chordoma lehine güçlü bağlam sağlar.",
            "BNCT genellikle intramedüller, iyi sınırlı ve belirgin destrüksiyon göstermeyen bir lezyondur."
        ],
        "minimalWorkup": [
            "BT/MR görüntüleme-patoloji korelasyonu.",
            "Keratin, EMA, brachyury soy doğrulaması için; benign-malign ayrımını sadece bu boyalarla yapmayın."
        ],
        "reportingTips": [
            "Sınırlı örnekte chordoma dışlanamıyorsa tanısal sınırlılığı ve ek örnekleme gereğini açıkça ifade edin."
        ],
        "checklist": [
            "Radyolojik destrüksiyon var mı?",
            "Myxoid-lobüler gelişim görülüyor mu?",
            "İHK sonucu gereğinden fazla yorumlandı mı?"
        ],
        "references": [
            {
                "label": "PubMed PMID: 15166667",
                "url": "https://pubmed.ncbi.nlm.nih.gov/15166667/"
            },
            {
                "label": "Blog arşivi: GitHub Issue #950",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/950"
            },
            {
                "label": "Blog arşivi: GitHub Issue #954",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/954"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "gi-barrett-basal-crypt-dysplasia-p53",
        "titleTR": "Barrett özofagusta bazal kript displazisi: p53 aşırı yorumlama tuzağı",
        "titleEN": "Basal crypt dysplasia in Barrett esophagus: p53 pitfalls",
        "organSystem": "GİS",
        "category": "Benign vs Malign",
        "modality": "IHC",
        "specimenType": "Biyopsi",
        "difficulty": "Zor",
        "tags": [
            "Barrett",
            "basal crypt dysplasia",
            "p53",
            "reactive atypia",
            "IND"
        ],
        "teaser": "Bazal kripte sınırlı sitolojik atipi reaktif değişikliklerle karışabilir; aberrant p53 destekleyicidir ancak tek başına displazi derecesini belirlemez.",
        "whyItTricks": [
            "Yüzey maturasyonu sürerken bazal kriptte displazi gözden kaçabilir.",
            "p53 aşırı ekspresyonu ya da null patern morfolojik kanıt olmadan otomatik displazi sayılabilir."
        ],
        "keyClues": [
            "Atipinin kript-yüzey dağılımını, inflamasyon ve erozyonla ilişkisini inceleyin.",
            "Wild-type p53 paterni displaziyi dışlamaz.",
            "Null p53 için korunmuş internal kontrol gereklidir."
        ],
        "minimalWorkup": [
            "Derin seviyeler, H&E-p53 anatomik eşleştirmesi.",
            "Belirsiz displazide deneyimli gastrointestinal patolog konsültasyonu."
        ],
        "reportingTips": [
            "Displazi için belirsiz (IND) kategori gerektiğinde kullanılmalı; tek başına p53 ile derece yükseltilmemeli."
        ],
        "checklist": [
            "Bazal kriptler dikkatle incelendi mi?",
            "p53 iç kontrolü doğru mu?",
            "Reaktif atipi yeterince değerlendirildi mi?"
        ],
        "references": [
            {
                "label": "PubMed PMID: 42935139",
                "url": "https://pubmed.ncbi.nlm.nih.gov/42935139/"
            },
            {
                "label": "Blog arşivi: GitHub Issue #935",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/935"
            },
            {
                "label": "Blog arşivi: GitHub Issue #821",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/821"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "gi-gastroblastoma-gli1-biphasic",
        "titleTR": "Mide bifazik tümöründe gastroblastoma: GLI1 füzyonu ve taklitçiler",
        "titleEN": "Gastroblastoma: biphasic gastric tumor and GLI1 fusion",
        "organSystem": "GİS",
        "category": "Mimik",
        "modality": "Moleküler",
        "specimenType": "Biyopsi",
        "difficulty": "Zor",
        "tags": [
            "gastroblastoma",
            "GLI1",
            "MALAT1::GLI1",
            "GIST",
            "gastric",
            "biphasic"
        ],
        "teaser": "Bifazik epitelyal-mezenkimal mide tümöründe gastroblastoma düşünülür; GLI1 ile ilişkili değişiklikler tek başına bu histolojik tanıya özgül değildir.",
        "whyItTricks": [
            "Örnekleme yalnız bir komponenti yakalayabilir.",
            "GLI1 füzyonu ile GLI1 amplifikasyonu biyolojik olarak aynı olay değildir.",
            "Farklı mezenkimal ve epitelyal mide tümörleri benzer paternler gösterebilir."
        ],
        "keyClues": [
            "Epitelyal ve iğsi hücreli iki komponenti araştırın.",
            "GIST ve diğer bifazik/mezankimal tümörler için morfoloji ve sınırlı İHK kullanın."
        ],
        "minimalWorkup": [
            "İki komponenti temsil eden bloklar ve hedefli İHK.",
            "Gerekiyorsa GLI1 ilişkili füzyonları kapsayan RNA paneli; amplifikasyonu ayrıca değerlendirin."
        ],
        "reportingTips": [
            "Moleküler değişikliği tanıyla özdeşleştirmeyin; negatif panelin kapsam sınırını belirtin."
        ],
        "checklist": [
            "İki komponent örneklendi mi?",
            "GIST ayırıcı tanısı çalışıldı mı?",
            "Füzyon ile amplifikasyon ayrıldı mı?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #1037",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1037"
            },
            {
                "label": "PubMed PMID: 28731043",
                "url": "https://pubmed.ncbi.nlm.nih.gov/28731043/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "molecular-mtap-loss-ihc-vs-ngs",
        "titleTR": "MTAP kaybı: İHK ile NGS uyumsuzluğunda yorum tuzağı",
        "titleEN": "MTAP protein loss versus genomic deletion: discordant testing",
        "organSystem": "Genel",
        "category": "IHC Tuzakları",
        "modality": "Moleküler",
        "specimenType": "Biyopsi",
        "difficulty": "Orta",
        "tags": [
            "MTAP",
            "IHC",
            "NGS",
            "copy number",
            "CDKN2A",
            "tumor purity"
        ],
        "teaser": "İHK’de MTAP protein kaybı ile NGS’de homozigot delesyon değerlendirmesi yüksek oranda uyum gösterebilse de heterojenite ve düşük tümör oranı yanıltıcı sonuç doğurabilir.",
        "whyItTricks": [
            "İç kontrolü olmayan negatif boyanma gerçek kayıpla karıştırılabilir.",
            "Düşük tümör saflığı NGS kopya sayısı tespitini güçleştirebilir.",
            "Subklonal kayıp ve doku heterojenitesi yöntemler arasında fark oluşturabilir."
        ],
        "keyClues": [
            "İHK’de korunmuş stromal/inflamatuvar iç kontrol ve tümör odaklarını birlikte değerlendirin.",
            "NGS tümör oranı, CNV eşiği ve analitik sınırlılıkları kontrol edin."
        ],
        "minimalWorkup": [
            "H&E üzerinde tümör oranı ve alan eşleştirmesi; İHK iç kontrolünün doğrulanması.",
            "Uyumsuz ve klinik önemi yüksek örnekte ek kesit/alternatif yöntem düşünün."
        ],
        "reportingTips": [
            "Protein kaybını otomatik olarak gen delesyonu veya tedavi uygunluğu saymayın."
        ],
        "checklist": [
            "İHK iç kontrolü var mı?",
            "NGS tümör oranı yeterli mi?",
            "Heterojenite değerlendirildi mi?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #843",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/843"
            },
            {
                "label": "PubMed PMID: 42833292",
                "url": "https://pubmed.ncbi.nlm.nih.gov/42833292/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "molecular-erbb3-tumor-only-germline",
        "titleTR": "Tümör-only NGS: ERBB3 varyantı somatik mi, germline mı?",
        "titleEN": "ERBB3 tumor-only NGS: somatic variant versus germline polymorphism",
        "organSystem": "Genel",
        "category": "Raporlama",
        "modality": "Moleküler",
        "specimenType": "Genel",
        "difficulty": "Zor",
        "tags": [
            "ERBB3",
            "HER3",
            "tumor only",
            "somatic",
            "germline",
            "VUS"
        ],
        "teaser": "Tümör-only panelde ERBB3 varyantı saptanması, bu değişikliğin somatik, onkojenik veya tedavi hedefi olduğu anlamına gelmez.",
        "whyItTricks": [
            "Germline polimorfizmler somatik varyant olarak yanlış sınıflandırılabilir.",
            "ERBB3 varyantı, amplifikasyon ve HER3 protein ekspresyonu birbiriyle eşitlenebilir."
        ],
        "keyClues": [
            "Varyantın popülasyon sıklığı, bilinen patojenitesi ve tümör saflığı/VAF bağlamını ayrı ayrı inceleyin.",
            "Varyantın onkojenisitesi bilinmiyorsa Unknown statüsünü açıkça koruyun."
        ],
        "minimalWorkup": [
            "Güncel popülasyon veritabanı ve somatik onkojenisite kaynağı kontrolü.",
            "Klinik gereksinimde eşleşmiş normal örnekle doğrulama/genetik danışmanlık değerlendirmesi."
        ],
        "reportingTips": [
            "Somatik köken kesin doğrulanmadıysa bu sınırlılığı yazın; Unknown varyantı sessizce kaldırmayın.",
            "Varyant varlığından tek başına HER3 hedefli tedavi endikasyonu çıkarmayın."
        ],
        "checklist": [
            "Germline olasılığı değerlendirildi mi?",
            "Oncogenicity sınıflaması aynen korundu mu?",
            "Tedavi çıkarımı ayrı gerekçelendirildi mi?"
        ],
        "references": [
            {
                "label": "PubMed PMID: 42970860",
                "url": "https://pubmed.ncbi.nlm.nih.gov/42970860/"
            },
            {
                "label": "Blog arşivi: GitHub Issue #1051",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1051"
            }
        ],
        "updatedAt": "2026-11-14"
    },
    {
        "id": "molecular-pancreas-eus-dna-rna-qc",
        "titleTR": "Pankreas EUS biyopsisinde DNA yeterli, RNA yetersiz: yanlış negatif füzyon tuzağı",
        "titleEN": "Pancreatic EUS biopsy: discordant DNA and RNA sequencing adequacy",
        "organSystem": "GİS",
        "category": "Örnekleme",
        "modality": "Moleküler",
        "specimenType": "Biyopsi",
        "difficulty": "Orta",
        "tags": [
            "pancreas",
            "EUS",
            "DNA",
            "RNA",
            "NGS",
            "fusion",
            "QC"
        ],
        "teaser": "Aynı küçük biyopside DNA-NGS çalışabilirken RNA füzyon analizi kalite kontrolünden geçmeyebilir; teknik başarısızlık gerçek negatiflik değildir.",
        "whyItTricks": [
            "Tümör yüzdesinin yeterli olması, RNA bütünlüğünün yeterli olduğu anlamına gelmez.",
            "DNA analizi tamamlandığında bütün moleküler testler tamamlandı sanılabilir."
        ],
        "keyClues": [
            "DNA ve RNA kalite kontrol raporlarını ayrı inceleyin.",
            "FFPE fiksasyon, nekroz, düşük hücre sayısı ve panel kapsamını değerlendirin."
        ],
        "minimalWorkup": [
            "H&E üzerinde tümör oranı ve doku rezervi kontrolü.",
            "RNA yetersizse kalan doku, alternatif blok veya yeniden örnekleme seçeneğini klinik ekiple değerlendirin."
        ],
        "reportingTips": [
            "“Füzyon saptanmadı” yerine, geçersiz analizde “RNA füzyon analizi teknik nedenlerle değerlendirilemedi” deyin."
        ],
        "checklist": [
            "RNA QC gerçekten başarılı mı?",
            "Füzyon panel kapsamı uygun mu?",
            "Alternatif materyal var mı?"
        ],
        "references": [
            {
                "label": "Blog arşivi: GitHub Issue #1088",
                "url": "https://github.com/metinciris/metinciriscomtr/issues/1088"
            },
            {
                "label": "PubMed PMID: 43006245",
                "url": "https://pubmed.ncbi.nlm.nih.gov/43006245/"
            }
        ],
        "updatedAt": "2026-11-14"
    },
];
