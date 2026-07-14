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
        { name: "Blog", url: `${BASE_URL}/blog/` },
        { name: "Tanı Tuzakları", url: `${BASE_URL}/tani-tuzaklari/` },
        { name: "Ayın Vakası", url: `${BASE_URL}/ayin-vakasi/` },
        { name: "SVS Mikroskopi", url: `${BASE_URL}/svs-reader/` },
        { name: "Konsensus", url: `${BASE_URL}/konsensus/` },
        { name: "Diğer Çalışmalar", url: `${BASE_URL}/diger-calismalar/` }
    ];

    // Doğrulanmış sameAs bağlantıları (projede var olan gerçek adresler)
    const sameAsLinks = [
        "https://www.linkedin.com/in/patoloji",
        "https://github.com/metinciris",
        "https://fb.com/patoloji"
    ];

    const personEntity = {
        "@type": "Person",
        "@id": `${BASE_URL}/#person`,
        "name": "Prof. Dr. İbrahim Metin Çiriş",
        "alternateName": "Prof Dr Metin Çiriş",
        "jobTitle": "Tıbbi Patoloji Uzmanı",
        "description": "Tanısal patoloji, moleküler patoloji ve dijital patoloji alanlarında çalışan tıbbi patoloji uzmanı.",
        "url": BASE_URL,
        "image": `${BASE_URL}/img/metinciris.avif`,
        "knowsAbout": [
            "Tıbbi patoloji",
            "Tanısal patoloji",
            "Moleküler patoloji",
            "Dijital patoloji",
            "İmmünohistokimya",
            "Kanser biyobelirteçleri",
            "Patoloji raporlaması"
        ],
        "sameAs": sameAsLinks
    };

    const websiteEntity = {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        "url": BASE_URL,
        "name": "Prof. Dr. İbrahim Metin Çiriş",
        "description": "Tıbbi patoloji uzmanının profesyonel web sitesi",
        "inLanguage": "tr-TR",
        "publisher": {
            "@id": `${BASE_URL}/#person`
        }
    };

    const webPageEntity = {
        "@type": isHome ? "ProfilePage" : "WebPage",
        "@id": canonical,
        "url": canonical,
        "name": page.title,
        "description": page.description,
        "isPartOf": {
            "@id": `${BASE_URL}/#website`
        },
        "inLanguage": "tr-TR",
        ...(isHome ? { "mainEntity": { "@id": `${BASE_URL}/#person` } } : {})
    };

    const navigationEntity = {
        "@type": "SiteNavigationElement",
        "@id": `${BASE_URL}/#navigation`,
        "name": "Ana Navigasyon",
        "hasPart": navigationItems.map((item, index) => ({
            "@type": "SiteNavigationElement",
            "position": index + 1,
            "name": item.name,
            "url": item.url
        }))
    };

    const breadcrumbEntity = !isHome ? {
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
    } : null;

    return {
        "@context": "https://schema.org",
        "@graph": [
            websiteEntity,
            personEntity,
            webPageEntity,
            navigationEntity,
            breadcrumbEntity
        ].filter(Boolean)
    };
};
