import { BASE_URL, PAGE_REGISTRY } from '../data/registry';

export const getCanonicalUrl = (slug: string): string => {
    // Enforce trailing slashes policy (ON)
    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const cleanSlug = slug.replace(/^\/|\/$/g, '');
    return cleanSlug ? `${base}/${cleanSlug}/` : `${base}/`;
};

export const getStructuredData = (pageId: string) => {
    const page = PAGE_REGISTRY[pageId] || PAGE_REGISTRY.home;
    const isHome = pageId === 'home';
    const canonical = getCanonicalUrl(page.slug);

    // Ana navigasyon öğeleri (Registry'den dinamik olarak da üretilebilir ama burada sabit tutuyoruz)
    const navigationItems = [
        { name: "Ana Sayfa", url: `${BASE_URL}/` },
        { name: "Biyopsi Sonucu", url: `${BASE_URL}/biyopsi-sonucu/` },
        { name: "İletişim", url: `${BASE_URL}/iletisim/` },
        { name: "Ders Notları", url: `${BASE_URL}/ders-notlari/` },
        { name: "Yayınlar", url: `${BASE_URL}/yayinlar/` },
        { name: "Tanı Tuzakları", url: `${BASE_URL}/tani-tuzaklari/` },
        { name: "Ayın Vakası", url: `${BASE_URL}/ayin-vakasi/` },
        { name: "SVS Mikroskopi", url: `${BASE_URL}/svs-reader/` },
        { name: "PubMed Trend", url: `${BASE_URL}/pubmed-trend/` },
        { name: "PubMed Takip", url: `${BASE_URL}/pubmed-makale-takip/` },
        { name: "AVIF Dönüştürücü", url: `${BASE_URL}/avif-donusturucu/` },
        { name: "Konsensus", url: `${BASE_URL}/konsensus/` },
        { name: "Diğer Çalışmalar", url: `${BASE_URL}/diger-calismalar/` }
    ];

    const baseStructuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${BASE_URL}/#website`,
                "url": BASE_URL,
                "name": "Prof Dr Metin Çiriş",
                "description": "SDÜ Tıp Fakültesi Tıbbi Patoloji Anabilim Dalı",
                "inLanguage": "tr-TR",
                "publisher": {
                    "@id": `${BASE_URL}/#person`
                }
            },
            {
                "@type": "Person",
                "@id": `${BASE_URL}/#person`,
                "name": "Prof Dr Metin Çiriş",
                "jobTitle": "Profesör Doktor",
                "worksFor": {
                    "@type": "Organization",
                    "name": "Süleyman Demirel Üniversitesi Tıp Fakültesi",
                    "department": "Tıbbi Patoloji Anabilim Dalı"
                },
                "url": BASE_URL,
                "image": `${BASE_URL}/img/metinciris.avif`,
                "sameAs": [
                    "https://www.linkedin.com/in/metinciris",
                    "https://github.com/metinciris"
                ]
            },
            {
                "@type": "WebPage",
                "@id": canonical,
                "url": canonical,
                "name": page.title,
                "description": page.description,
                "isPartOf": {
                    "@id": `${BASE_URL}/#website`
                },
                "inLanguage": "tr-TR"
            },
            {
                "@type": "SiteNavigationElement",
                "@id": `${BASE_URL}/#navigation`,
                "name": "Ana Navigasyon",
                "hasPart": navigationItems.map((item, index) => ({
                    "@type": "SiteNavigationElement",
                    "position": index + 1,
                    "name": item.name,
                    "url": item.url
                }))
            },
            !isHome ? {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Ana Sayfa",
                        "item": `${BASE_URL}/`
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": page.title.split(' | ')[0],
                        "item": canonical
                    }
                ]
            } : null
        ].filter(Boolean)
    };

    return baseStructuredData;
};
