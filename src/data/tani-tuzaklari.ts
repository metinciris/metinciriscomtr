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

  // Blog arşivinden doğrudan doğrulanan yeni ayırıcı tanı tuzakları.
  {
    "id": "renal-tfe3-not-fusion",
    "titleTR": "TFE3 pozitifliği: BAP1 kayıplı şeffaf hücreli RHK mi, TFE3 füzyonlu RHK mi?",
    "organSystem": "Üriner",
    "category": "IHC Tuzakları",
    "modality": "Moleküler",
    "specimenType": "Biyopsi",
    "difficulty": "Zor",
    "tags": [
      "TFE3",
      "BAP1",
      "GPNMB"
    ],
    "teaser": "BAP1 kaybı olan yüksek dereceli şeffaf hücreli RHK'de nükleer TFE3 pozitifliği, yeniden düzenlenme göstermeden oluşabilir.",
    "whyItTricks": [
      "TFE3 boyanması tek başına füzyon kanıtı değildir.",
      "Tek bir immün veya moleküler sonuç, morfolojiyle karşılaştırılmadığında aşırı sınıflamaya yol açabilir."
    ],
    "keyClues": [
      "BAP1 negatifliğini sağlam iç kontrol ile doğrulayın; özgül olmayan GPNMB bulgularını tümör morfolojisiyle karşılaştırın.",
      "Klinik, radyolojik ve örnekleme bağlamıyla korelasyon kurun."
    ],
    "minimalWorkup": [
      "Sınıflama için gerekli olguda FISH ya da doğrulanmış RNA füzyon analizi.",
      "Boyanmanın doğru tümör hücrelerinde ve uygun iç kontrolle değerlendirildiğinden emin olun."
    ],
    "reportingTips": [
      "TFE3 immünreaktivitesi ile gen yeniden düzenlenmesini farklı raporlayın.",
      "Sınırlı veya doğrulanmamış bulguları raporda açıkça belirtin."
    ],
    "checklist": [
      "Ayırıcı tanıyı yönlendiren morfolojik özellikler gösterildi mi?",
      "BAP1 negatifliğini sağlam iç kontrol ile doğrulayın; özgül olmayan GPNMB bulgularını tümör morfolojisiyle karşılaştırın.",
      "Sınıflama için gerekli olguda FISH ya da doğrulanmış RNA füzyon analizi.",
      "Tanı kesinliğinin sınırları rapora yansıtıldı mı?"
    ],
    "references": [
      {
        "label": "Kaynak blog: GitHub Issue #995",
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
    "id": "renal-tfeb-test-discordance",
    "titleTR": "TFEB pozitif renal tümör: yeniden düzenlenme mi, amplifikasyon mu?",
    "organSystem": "Üriner",
    "category": "IHC Tuzakları",
    "modality": "Moleküler",
    "specimenType": "Biyopsi",
    "difficulty": "Zor",
    "tags": [
      "TFEB",
      "GPNMB",
      "RNA-ISH"
    ],
    "teaser": "TFEB İHK, katepsin K veya RNA-ISH pozitifliği, hangi genetik değişikliğin bulunduğunu tek başına belirlemez.",
    "whyItTricks": [
      "Füzyon ve amplifikasyon ayrı moleküler kategorilerdir.",
      "Tek bir immün veya moleküler sonuç, morfolojiyle karşılaştırılmadığında aşırı sınıflamaya yol açabilir."
    ],
    "keyClues": [
      "Antikor klonunu ve TFEB RNA-ISH sonucunun ifade ettiği ekspresyonu ayırın.",
      "Klinik, radyolojik ve örnekleme bağlamıyla korelasyon kurun."
    ],
    "minimalWorkup": [
      "Gerektiğinde doğrulanmış FISH veya moleküler kopya sayısı/füzyon analizi.",
      "Boyanmanın doğru tümör hücrelerinde ve uygun iç kontrolle değerlendirildiğinden emin olun."
    ],
    "reportingTips": [
      "Protein veya RNA ekspresyonunu doğrulanmış füzyon olarak raporlamayın.",
      "Sınırlı veya doğrulanmamış bulguları raporda açıkça belirtin."
    ],
    "checklist": [
      "Ayırıcı tanıyı yönlendiren morfolojik özellikler gösterildi mi?",
      "Antikor klonunu ve TFEB RNA-ISH sonucunun ifade ettiği ekspresyonu ayırın.",
      "Gerektiğinde doğrulanmış FISH veya moleküler kopya sayısı/füzyon analizi.",
      "Tanı kesinliğinin sınırları rapora yansıtıldı mı?"
    ],
    "references": [
      {
        "label": "Kaynak blog: GitHub Issue #1013",
        "url": "https://github.com/metinciris/metinciriscomtr/issues/1013"
      },
      {
        "label": "PubMed PMID: 42947507",
        "url": "https://pubmed.ncbi.nlm.nih.gov/42947507/"
      }
    ],
    "updatedAt": "2026-11-14"
  },
  {
    "id": "renal-pt3a-stage-trap",
    "titleTR": "Renal hücreli karsinomda pT3a: tümör çıkıntısı mı, gerçek sinüs/yağ invazyonu mu?",
    "organSystem": "Üriner",
    "category": "Grading/Staging",
    "modality": "H&E",
    "specimenType": "Rezeksiyon",
    "difficulty": "Zor",
    "tags": [
      "pT3a",
      "renal sinüs",
      "yağ invazyonu"
    ],
    "teaser": "Düzgün tümör çıkıntısı otomatik sinüs veya perirenal yağ invazyonu değildir.",
    "whyItTricks": [
      "Anatomik kompartımanlara özgü evreleme kriterleri vardır.",
      "Tek bir immün veya moleküler sonuç, morfolojiyle karşılaştırılmadığında aşırı sınıflamaya yol açabilir."
    ],
    "keyClues": [
      "Sinüs yağını, renal ven dallarını ve perirenal yağ ilişkisini ayrı örnekleyin.",
      "Klinik, radyolojik ve örnekleme bağlamıyla korelasyon kurun."
    ],
    "minimalWorkup": [
      "Şüpheli alanlarda ek kesit ve gerektiğinde endotelyal belirteçlerle doğrulama.",
      "Boyanmanın doğru tümör hücrelerinde ve uygun iç kontrolle değerlendirildiğinden emin olun."
    ],
    "reportingTips": [
      "Evreyi değiştiren yapıyı ve bulguyu açıkça belirtin.",
      "Sınırlı veya doğrulanmamış bulguları raporda açıkça belirtin."
    ],
    "checklist": [
      "Ayırıcı tanıyı yönlendiren morfolojik özellikler gösterildi mi?",
      "Sinüs yağını, renal ven dallarını ve perirenal yağ ilişkisini ayrı örnekleyin.",
      "Şüpheli alanlarda ek kesit ve gerektiğinde endotelyal belirteçlerle doğrulama.",
      "Tanı kesinliğinin sınırları rapora yansıtıldı mı?"
    ],
    "references": [
      {
        "label": "Kaynak blog: GitHub Issue #1022",
        "url": "https://github.com/metinciris/metinciriscomtr/issues/1022"
      },
      {
        "label": "PubMed PMID: 29878933",
        "url": "https://pubmed.ncbi.nlm.nih.gov/29878933/"
      }
    ],
    "updatedAt": "2026-11-14"
  },
  {
    "id": "renal-oncocytic-gpnmb",
    "titleTR": "GPNMB pozitif onkositik böbrek tümörü: LOT mu, EVT mi, kromofob RHK mi?",
    "organSystem": "Üriner",
    "category": "IHC Tuzakları",
    "modality": "IHC",
    "specimenType": "Rezeksiyon",
    "difficulty": "Zor",
    "tags": [
      "GPNMB",
      "LOT",
      "EVT",
      "onkositom"
    ],
    "teaser": "GPNMB tek başına LOT veya başka bir onkositik renal tümör için özgül değildir.",
    "whyItTricks": [
      "CK7/CD117 ve morfolojinin farklı kombinasyonları örtüşebilir.",
      "Tek bir immün veya moleküler sonuç, morfolojiyle karşılaştırılmadığında aşırı sınıflamaya yol açabilir."
    ],
    "keyClues": [
      "Vakuoller, CK7/CD117 ve multifokalite bulgularını birlikte inceleyin.",
      "Klinik, radyolojik ve örnekleme bağlamıyla korelasyon kurun."
    ],
    "minimalWorkup": [
      "Seçilmiş panel: CK7, CD117, gerektiğinde GPNMB, GATA3, katepsin K.",
      "Boyanmanın doğru tümör hücrelerinde ve uygun iç kontrolle değerlendirildiğinden emin olun."
    ],
    "reportingTips": [
      "GPNMB pozitifliği temel alınarak kesin alt tip atamayın.",
      "Sınırlı veya doğrulanmamış bulguları raporda açıkça belirtin."
    ],
    "checklist": [
      "Ayırıcı tanıyı yönlendiren morfolojik özellikler gösterildi mi?",
      "Vakuoller, CK7/CD117 ve multifokalite bulgularını birlikte inceleyin.",
      "Seçilmiş panel: CK7, CD117, gerektiğinde GPNMB, GATA3, katepsin K.",
      "Tanı kesinliğinin sınırları rapora yansıtıldı mı?"
    ],
    "references": [
      {
        "label": "Kaynak blog: GitHub Issue #1021",
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
    "id": "stat6-sft-vs-ddlps",
    "titleTR": "STAT6 pozitif retroperitoneal tümör: SFT mi, dediferansiye liposarkom mu?",
    "organSystem": "Yumuşak Doku",
    "category": "Mimik",
    "modality": "IHC",
    "specimenType": "Biyopsi",
    "difficulty": "Zor",
    "tags": [
      "STAT6",
      "SFT",
      "MDM2",
      "DDLPS"
    ],
    "teaser": "Retroperitoneal dediferansiye liposarkom STAT6 pozitif olabilir.",
    "whyItTricks": [
      "İğsi hücreli DDLPS'nin nonlipojenik alanı SFT'ye benzeyebilir.",
      "Tek bir immün veya moleküler sonuç, morfolojiyle karşılaştırılmadığında aşırı sınıflamaya yol açabilir."
    ],
    "keyClues": [
      "Radyolojik yağlı komponenti ve SFT benzeri damar paternini değerlendirin.",
      "Klinik, radyolojik ve örnekleme bağlamıyla korelasyon kurun."
    ],
    "minimalWorkup": [
      "Uygun olguda MDM2 amplifikasyonunu doğrulanmış yöntemle araştırın.",
      "Boyanmanın doğru tümör hücrelerinde ve uygun iç kontrolle değerlendirildiğinden emin olun."
    ],
    "reportingTips": [
      "STAT6 pozitifliğini NAB2::STAT6 füzyonu gibi sunmayın.",
      "Sınırlı veya doğrulanmamış bulguları raporda açıkça belirtin."
    ],
    "checklist": [
      "Ayırıcı tanıyı yönlendiren morfolojik özellikler gösterildi mi?",
      "Radyolojik yağlı komponenti ve SFT benzeri damar paternini değerlendirin.",
      "Uygun olguda MDM2 amplifikasyonunu doğrulanmış yöntemle araştırın.",
      "Tanı kesinliğinin sınırları rapora yansıtıldı mı?"
    ],
    "references": [
      {
        "label": "Kaynak blog: GitHub Issue #1039",
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
    "id": "pulmonary-ehe-keratin",
    "titleTR": "Akciğerde keratin pozitif epiteloid lezyon: karsinom mu, EHE mi?",
    "organSystem": "Akciğer",
    "category": "Mimik",
    "modality": "IHC",
    "specimenType": "Biyopsi",
    "difficulty": "Zor",
    "tags": [
      "EHE",
      "keratin",
      "CAMTA1",
      "CD31"
    ],
    "teaser": "Fokal keratin pozitif EHE, metastatik karsinom sanılabilir.",
    "whyItTricks": [
      "Miksohiyalin stromada intrastoplazmik lümen/vakuol vasküler farklılaşma ipucudur.",
      "Tek bir immün veya moleküler sonuç, morfolojiyle karşılaştırılmadığında aşırı sınıflamaya yol açabilir."
    ],
    "keyClues": [
      "CD31 ve ERG'yi tümör hücrelerinde; CAMTA1'i nükleer paternde değerlendirin.",
      "Klinik, radyolojik ve örnekleme bağlamıyla korelasyon kurun."
    ],
    "minimalWorkup": [
      "Gerektiğinde uygun füzyon analizi ile doğrulayın.",
      "Boyanmanın doğru tümör hücrelerinde ve uygun iç kontrolle değerlendirildiğinden emin olun."
    ],
    "reportingTips": [
      "CAMTA1 immünboyasını WWTR1::CAMTA1 füzyon sonucu olarak ifade etmeyin.",
      "Sınırlı veya doğrulanmamış bulguları raporda açıkça belirtin."
    ],
    "checklist": [
      "Ayırıcı tanıyı yönlendiren morfolojik özellikler gösterildi mi?",
      "CD31 ve ERG'yi tümör hücrelerinde; CAMTA1'i nükleer paternde değerlendirin.",
      "Gerektiğinde uygun füzyon analizi ile doğrulayın.",
      "Tanı kesinliğinin sınırları rapora yansıtıldı mı?"
    ],
    "references": [
      {
        "label": "Kaynak blog: GitHub Issue #1035",
        "url": "https://github.com/metinciris/metinciriscomtr/issues/1035"
      },
      {
        "label": "PubMed PMID: 34090171",
        "url": "https://pubmed.ncbi.nlm.nih.gov/34090171/"
      }
    ],
    "updatedAt": "2026-11-14"
  },
  {
    "id": "alknegative-imt-fusions",
    "titleTR": "ALK negatif İMT: reaktif lezyon mu, ROS1/NTRK füzyonlu tümör mü?",
    "organSystem": "Yumuşak Doku",
    "category": "Mimik",
    "modality": "Moleküler",
    "specimenType": "Biyopsi",
    "difficulty": "Zor",
    "tags": [
      "İMT",
      "ALK",
      "ROS1",
      "NTRK3"
    ],
    "teaser": "ALK negatifliği morfolojik olarak olası inflamatuar miyofibroblastik tümörü dışlamaz.",
    "whyItTricks": [
      "İnflamasyon reaktif ve neoplastik iğsi hücrelerin ayrımını maskeleyebilir.",
      "Tek bir immün veya moleküler sonuç, morfolojiyle karşılaştırılmadığında aşırı sınıflamaya yol açabilir."
    ],
    "keyClues": [
      "Miyofibroblastik morfoloji ve inflamasyonun dağılımını inceleyin.",
      "Klinik, radyolojik ve örnekleme bağlamıyla korelasyon kurun."
    ],
    "minimalWorkup": [
      "ALK, SMA/desmin ve gerekli olguda ROS1, pan-TRK ile RNA füzyon analizi.",
      "Boyanmanın doğru tümör hücrelerinde ve uygun iç kontrolle değerlendirildiğinden emin olun."
    ],
    "reportingTips": [
      "Negatif tarama boyası ile moleküler füzyon yokluğunu eşitlemeyin.",
      "Sınırlı veya doğrulanmamış bulguları raporda açıkça belirtin."
    ],
    "checklist": [
      "Ayırıcı tanıyı yönlendiren morfolojik özellikler gösterildi mi?",
      "Miyofibroblastik morfoloji ve inflamasyonun dağılımını inceleyin.",
      "ALK, SMA/desmin ve gerekli olguda ROS1, pan-TRK ile RNA füzyon analizi.",
      "Tanı kesinliğinin sınırları rapora yansıtıldı mı?"
    ],
    "references": [
      {
        "label": "Kaynak blog: GitHub Issue #1032",
        "url": "https://github.com/metinciris/metinciriscomtr/issues/1032"
      },
      {
        "label": "PubMed PMID: 40282503",
        "url": "https://pubmed.ncbi.nlm.nih.gov/40282503/"
      }
    ],
    "updatedAt": "2026-11-14"
  },
  {
    "id": "pantrk-negative-ntrk",
    "titleTR": "Pan-TRK negatif boyanma NTRK füzyonunu dışlar mı?",
    "organSystem": "Yumuşak Doku",
    "category": "IHC Tuzakları",
    "modality": "Moleküler",
    "specimenType": "Biyopsi",
    "difficulty": "Zor",
    "tags": [
      "Pan-TRK",
      "NTRK3",
      "RNA-NGS"
    ],
    "teaser": "Pan-TRK immünohistokimya negatifliği, özellikle NTRK3 füzyonunu tamamen dışlamaz.",
    "whyItTricks": [
      "Antikor klonu, doku kalitesi ve ekspresyon düzeyi yanlış negatiflik oluşturabilir.",
      "Tek bir immün veya moleküler sonuç, morfolojiyle karşılaştırılmadığında aşırı sınıflamaya yol açabilir."
    ],
    "keyClues": [
      "Morfolojinin ve hücre soyunun NTRK ilişkili tümörü düşündürüp düşündürmediğine bakın.",
      "Klinik, radyolojik ve örnekleme bağlamıyla korelasyon kurun."
    ],
    "minimalWorkup": [
      "Güçlü şüphede kapsaması uygun RNA tabanlı füzyon analizi.",
      "Boyanmanın doğru tümör hücrelerinde ve uygun iç kontrolle değerlendirildiğinden emin olun."
    ],
    "reportingTips": [
      "Boyayı moleküler füzyon analiziyle eşdeğer göstermeyin.",
      "Sınırlı veya doğrulanmamış bulguları raporda açıkça belirtin."
    ],
    "checklist": [
      "Ayırıcı tanıyı yönlendiren morfolojik özellikler gösterildi mi?",
      "Morfolojinin ve hücre soyunun NTRK ilişkili tümörü düşündürüp düşündürmediğine bakın.",
      "Güçlü şüphede kapsaması uygun RNA tabanlı füzyon analizi.",
      "Tanı kesinliğinin sınırları rapora yansıtıldı mı?"
    ],
    "references": [
      {
        "label": "Kaynak blog: GitHub Issue #1038",
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
      "id": "urothelial-cis-vs-lateral-spread",
      "titleTR": "Papiller ürotelyal karsinomda düz atipi: CIS mi, lateral yayılım mı?",
      "organSystem": "Üriner",
      "category": "Mimik",
      "modality": "H&E",
      "specimenType": "Rezeksiyon",
      "difficulty": "Zor",
      "tags": [
        "ayırıcı tanı",
        "1027"
      ],
      "teaser": "Papiller tümörün komşu düz epitelde devamı ayrı CIS odağıyla karışabilir.",
      "whyItTricks": [
        "Papiller tümörün komşu düz epitelde devamı ayrı CIS odağıyla karışabilir.",
        "Sınırlı örneklem tek bulguya aşırı güven yaratabilir."
      ],
      "keyClues": [
        "CK20/p53 anormalliği ayrı CIS varlığını tek başına göstermez.",
        "Klinik ve anatomik bağlamı sorgulayın."
      ],
      "minimalWorkup": [
        "Papiller tümör ile düz alan arasında H&E devamlılığını ve yeterli örneklemeyi araştırın.",
        "Gerekirse ek kesit veya uzman konsültasyonu alın."
      ],
      "reportingTips": [
        "Morfoloji ile test sonucunun uyumunu açıklayın.",
        "Tanısal sınırlılığı açık belirtin."
      ],
      "checklist": [
        "Şüpheli odağın morfolojik karşılığı var mı?",
        "CK20/p53 anormalliği ayrı CIS varlığını tek başına göstermez.",
        "Papiller tümör ile düz alan arasında H&E devamlılığını ve yeterli örneklemeyi araştırın.",
        "Raporun kesinliği kullanılan yöntemle uyumlu mu?"
      ],
      "references": [
        {
          "label": "Kaynak blog yazısı #1027",
          "url": "https://github.com/metinciris/metinciriscomtr/issues/1027"
        }
      ],
      "updatedAt": "2026-11-14"
    },
    {
      "id": "barrett-basal-crypt-dysplasia",
      "titleTR": "Barrett özofagusunda bazal kript displazisi: p53 ve reaktif atipi",
      "organSystem": "GİS",
      "category": "Benign vs Malign",
      "modality": "IHC",
      "specimenType": "Biyopsi",
      "difficulty": "Zor",
      "tags": [
        "ayırıcı tanı",
        "935"
      ],
      "teaser": "Yüzey olgunlaşması bazal kript displazisini dışlamaz.",
      "whyItTricks": [
        "Yüzey olgunlaşması bazal kript displazisini dışlamaz.",
        "Sınırlı örneklem tek bulguya aşırı güven yaratabilir."
      ],
      "keyClues": [
        "Anormal p53 tek başına displazi tanısı değildir; wild-type p53 displaziyi dışlamaz.",
        "Klinik ve anatomik bağlamı sorgulayın."
      ],
      "minimalWorkup": [
        "H&E'de bazal kriptleri ve p53 paternini karşılaştırın; belirsiz olguda konsültasyon düşünün.",
        "Gerekirse ek kesit veya uzman konsültasyonu alın."
      ],
      "reportingTips": [
        "Morfoloji ile test sonucunun uyumunu açıklayın.",
        "Tanısal sınırlılığı açık belirtin."
      ],
      "checklist": [
        "Şüpheli odağın morfolojik karşılığı var mı?",
        "Anormal p53 tek başına displazi tanısı değildir; wild-type p53 displaziyi dışlamaz.",
        "H&E'de bazal kriptleri ve p53 paternini karşılaştırın; belirsiz olguda konsültasyon düşünün.",
        "Raporun kesinliği kullanılan yöntemle uyumlu mu?"
      ],
      "references": [
        {
          "label": "Kaynak blog yazısı #935",
          "url": "https://github.com/metinciris/metinciriscomtr/issues/935"
        }
      ],
      "updatedAt": "2026-11-14"
    },
    {
      "id": "gastric-netg3-vs-minen",
      "titleTR": "Mide NET G3 mü, MiNEN mi? Glandüler mimari tuzağı",
      "organSystem": "GİS",
      "category": "Mimik",
      "modality": "IHC",
      "specimenType": "Biyopsi",
      "difficulty": "Zor",
      "tags": [
        "ayırıcı tanı",
        "1015"
      ],
      "teaser": "Gland benzeri yapı ayrı adenokarsinom komponenti olduğunu kanıtlamaz.",
      "whyItTricks": [
        "Gland benzeri yapı ayrı adenokarsinom komponenti olduğunu kanıtlamaz.",
        "Sınırlı örneklem tek bulguya aşırı güven yaratabilir."
      ],
      "keyClues": [
        "Ki-67 proliferasyonu NET G3 ve NEC ayrımı için tek başına yeterli değildir.",
        "Klinik ve anatomik bağlamı sorgulayın."
      ],
      "minimalWorkup": [
        "Ayrı non-nöroendokrin hücre komponentini ve nöroendokrin diferansiyasyonu morfolojide araştırın.",
        "Gerekirse ek kesit veya uzman konsültasyonu alın."
      ],
      "reportingTips": [
        "Morfoloji ile test sonucunun uyumunu açıklayın.",
        "Tanısal sınırlılığı açık belirtin."
      ],
      "checklist": [
        "Şüpheli odağın morfolojik karşılığı var mı?",
        "Ki-67 proliferasyonu NET G3 ve NEC ayrımı için tek başına yeterli değildir.",
        "Ayrı non-nöroendokrin hücre komponentini ve nöroendokrin diferansiyasyonu morfolojide araştırın.",
        "Raporun kesinliği kullanılan yöntemle uyumlu mu?"
      ],
      "references": [
        {
          "label": "Kaynak blog yazısı #1015",
          "url": "https://github.com/metinciris/metinciriscomtr/issues/1015"
        }
      ],
      "updatedAt": "2026-11-14"
    },
    {
      "id": "bone-telangiectatic-vs-abc",
      "titleTR": "Kanlı kemik lezyonu: anevrizmal kemik kisti mi, telenjiektatik osteosarkom mu?",
      "organSystem": "Kemik",
      "category": "Benign vs Malign",
      "modality": "H&E",
      "specimenType": "Biyopsi",
      "difficulty": "Zor",
      "tags": [
        "ayırıcı tanı",
        "870"
      ],
      "teaser": "Sıvı-sıvı seviyesi ve kistik boşluk her iki tümörde bulunabilir.",
      "whyItTricks": [
        "Sıvı-sıvı seviyesi ve kistik boşluk her iki tümörde bulunabilir.",
        "Sınırlı örneklem tek bulguya aşırı güven yaratabilir."
      ],
      "keyClues": [
        "Kalın septalardaki malign hücreler ve neoplastik osteoid esas ayırıcı ipucudur.",
        "Klinik ve anatomik bağlamı sorgulayın."
      ],
      "minimalWorkup": [
        "Görüntüleme ile solid septaları hedefleyin; gerektiğinde USP6 araştırın.",
        "Gerekirse ek kesit veya uzman konsültasyonu alın."
      ],
      "reportingTips": [
        "Morfoloji ile test sonucunun uyumunu açıklayın.",
        "Tanısal sınırlılığı açık belirtin."
      ],
      "checklist": [
        "Şüpheli odağın morfolojik karşılığı var mı?",
        "Kalın septalardaki malign hücreler ve neoplastik osteoid esas ayırıcı ipucudur.",
        "Görüntüleme ile solid septaları hedefleyin; gerektiğinde USP6 araştırın.",
        "Raporun kesinliği kullanılan yöntemle uyumlu mu?"
      ],
      "references": [
        {
          "label": "Kaynak blog yazısı #870",
          "url": "https://github.com/metinciris/metinciriscomtr/issues/870"
        }
      ],
      "updatedAt": "2026-11-14"
    },
    {
      "id": "bone-gctb-vs-chondroblastoma",
      "titleTR": "Epifizde dev hücreli lezyon: GCTB mi, kondroblastom mu?",
      "organSystem": "Kemik",
      "category": "Mimik",
      "modality": "IHC",
      "specimenType": "Biyopsi",
      "difficulty": "Zor",
      "tags": [
        "ayırıcı tanı",
        "850"
      ],
      "teaser": "Osteoklast tipi dev hücreler her iki lezyonda da izlenebilir.",
      "whyItTricks": [
        "Osteoklast tipi dev hücreler her iki lezyonda da izlenebilir.",
        "Sınırlı örneklem tek bulguya aşırı güven yaratabilir."
      ],
      "keyClues": [
        "G34W ve K36M boyanması uygun mononükleer neoplastik hücrelerde değerlendirilmelidir.",
        "Klinik ve anatomik bağlamı sorgulayın."
      ],
      "minimalWorkup": [
        "H&E ve radyolojik yerleşimle birlikte H3 mutasyon-spesifik İHK'yi yorumlayın.",
        "Gerekirse ek kesit veya uzman konsültasyonu alın."
      ],
      "reportingTips": [
        "Morfoloji ile test sonucunun uyumunu açıklayın.",
        "Tanısal sınırlılığı açık belirtin."
      ],
      "checklist": [
        "Şüpheli odağın morfolojik karşılığı var mı?",
        "G34W ve K36M boyanması uygun mononükleer neoplastik hücrelerde değerlendirilmelidir.",
        "H&E ve radyolojik yerleşimle birlikte H3 mutasyon-spesifik İHK'yi yorumlayın.",
        "Raporun kesinliği kullanılan yöntemle uyumlu mu?"
      ],
      "references": [
        {
          "label": "Kaynak blog yazısı #850",
          "url": "https://github.com/metinciris/metinciriscomtr/issues/850"
        }
      ],
      "updatedAt": "2026-11-14"
    },
    {
      "id": "soft-mdm2-stain-vs-amplification",
      "titleTR": "MDM2 pozitif adipositik lezyon: liposarkom mu, anisometrik hücreli lipom mu?",
      "organSystem": "Yumuşak Doku",
      "category": "IHC Tuzakları",
      "modality": "Moleküler",
      "specimenType": "Biyopsi",
      "difficulty": "Zor",
      "tags": [
        "ayırıcı tanı",
        "999"
      ],
      "teaser": "Anisometrik hücreli lipom, MDM2 gen amplifikasyonu olmadan MDM2 boyanması gösterebilir.",
      "whyItTricks": [
        "Anisometrik hücreli lipom, MDM2 gen amplifikasyonu olmadan MDM2 boyanması gösterebilir.",
        "Sınırlı örneklem tek bulguya aşırı güven yaratabilir."
      ],
      "keyClues": [
        "Protein ekspresyonunu moleküler amplifikasyonla eşitlemeyin.",
        "Klinik ve anatomik bağlamı sorgulayın."
      ],
      "minimalWorkup": [
        "Morfoloji, RB1 ve şüpheli olguda valide MDM2 amplifikasyon testini değerlendirin.",
        "Gerekirse ek kesit veya uzman konsültasyonu alın."
      ],
      "reportingTips": [
        "Morfoloji ile test sonucunun uyumunu açıklayın.",
        "Tanısal sınırlılığı açık belirtin."
      ],
      "checklist": [
        "Şüpheli odağın morfolojik karşılığı var mı?",
        "Protein ekspresyonunu moleküler amplifikasyonla eşitlemeyin.",
        "Morfoloji, RB1 ve şüpheli olguda valide MDM2 amplifikasyon testini değerlendirin.",
        "Raporun kesinliği kullanılan yöntemle uyumlu mu?"
      ],
      "references": [
        {
          "label": "Kaynak blog yazısı #999",
          "url": "https://github.com/metinciris/metinciriscomtr/issues/999"
        }
      ],
      "updatedAt": "2026-11-14"
    },
    {
      "id": "lung-kras-g12c-vs-g12y",
      "titleTR": "KRAS G12C PCR sonucunda G12Y çapraz reaksiyon tuzağı",
      "organSystem": "Akciğer",
      "category": "IHC Tuzakları",
      "modality": "Moleküler",
      "specimenType": "Biyopsi",
      "difficulty": "Zor",
      "tags": [
        "ayırıcı tanı",
        "1054"
      ],
      "teaser": "Bazı PCR testleri KRAS G12Y varyantını G12C olarak yanlış çağırabilir.",
      "whyItTricks": [
        "Bazı PCR testleri KRAS G12Y varyantını G12C olarak yanlış çağırabilir.",
        "Sınırlı örneklem tek bulguya aşırı güven yaratabilir."
      ],
      "keyClues": [
        "Aynı yöntem tekrarında aynı sistematik çapraz reaksiyon sürebilir.",
        "Klinik ve anatomik bağlamı sorgulayın."
      ],
      "minimalWorkup": [
        "Tedavi kararını değiştirecek uyumsuzluğu ortogonal valide moleküler yöntemle doğrulayın.",
        "Gerekirse ek kesit veya uzman konsültasyonu alın."
      ],
      "reportingTips": [
        "Morfoloji ile test sonucunun uyumunu açıklayın.",
        "Tanısal sınırlılığı açık belirtin."
      ],
      "checklist": [
        "Şüpheli odağın morfolojik karşılığı var mı?",
        "Aynı yöntem tekrarında aynı sistematik çapraz reaksiyon sürebilir.",
        "Tedavi kararını değiştirecek uyumsuzluğu ortogonal valide moleküler yöntemle doğrulayın.",
        "Raporun kesinliği kullanılan yöntemle uyumlu mu?"
      ],
      "references": [
        {
          "label": "Kaynak blog yazısı #1054",
          "url": "https://github.com/metinciris/metinciriscomtr/issues/1054"
        }
      ],
      "updatedAt": "2026-11-14"
    },
    {
      "id": "effusion-trps1-vs-mullerian",
      "titleTR": "Seröz efüzyonda TRPS1 pozitifliği: meme mi, Müllerian karsinom mu?",
      "organSystem": "Gyn",
      "category": "Mimik",
      "modality": "IHC",
      "specimenType": "Sitoloji",
      "difficulty": "Zor",
      "tags": [
        "ayırıcı tanı",
        "779"
      ],
      "teaser": "TRPS1 pozitifliği yalnız başına meme kökenini kanıtlamaz.",
      "whyItTricks": [
        "TRPS1 pozitifliği yalnız başına meme kökenini kanıtlamaz.",
        "Sınırlı örneklem tek bulguya aşırı güven yaratabilir."
      ],
      "keyClues": [
        "Seröz Müllerian karsinomlarda da TRPS1 boyanması olabilir.",
        "Klinik ve anatomik bağlamı sorgulayın."
      ],
      "minimalWorkup": [
        "SOX17, PAX8, WT1 ve GATA3 paneli ile morfolojiyi birlikte yorumlayın.",
        "Gerekirse ek kesit veya uzman konsültasyonu alın."
      ],
      "reportingTips": [
        "Morfoloji ile test sonucunun uyumunu açıklayın.",
        "Tanısal sınırlılığı açık belirtin."
      ],
      "checklist": [
        "Şüpheli odağın morfolojik karşılığı var mı?",
        "Seröz Müllerian karsinomlarda da TRPS1 boyanması olabilir.",
        "SOX17, PAX8, WT1 ve GATA3 paneli ile morfolojiyi birlikte yorumlayın.",
        "Raporun kesinliği kullanılan yöntemle uyumlu mu?"
      ],
      "references": [
        {
          "label": "Kaynak blog yazısı #779",
          "url": "https://github.com/metinciris/metinciriscomtr/issues/779"
        }
      ],
      "updatedAt": "2026-11-14"
    },
];
