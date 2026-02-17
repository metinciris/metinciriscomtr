import { useEffect } from 'react';

interface SEOProps {
    currentPage: string;
}

const BASE_URL = 'https://metinciris.com.tr';

const PAGE_METADATA: Record<string, { title: string; description: string; keywords?: string }> = {
    home: {
        title: 'Prof Dr Metin Çiriş | SDÜ Tıbbi Patoloji',
        description: 'Prof Dr Metin Çiriş – Süleyman Demirel Üniversitesi Tıp Fakültesi Tıbbi Patoloji Anabilim Dalı. Hasta bilgilendirme, biyopsi sonuçları ve akademik yayınlar.',
        keywords: 'patoloji, biyopsi, SDÜ, Süleyman Demirel Üniversitesi, Metin Çiriş, tıbbi patoloji, Isparta'
    },
    iletisim: {
        title: 'İletişim | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş ile iletişime geçin. SDÜ Tıp Fakültesi Tıbbi Patoloji - adres, telefon ve konum bilgileri.',
        keywords: 'iletişim, adres, telefon, SDÜ patoloji, Metin Çiriş iletişim'
    },
    'ziyaret-mesaji': {
        title: 'Ziyaretçi Mesajı | Prof Dr Metin Çiriş',
        description: 'Ziyaretçilerimizden gelen mesajlar ve geri bildirimler.',
        keywords: 'ziyaretçi mesajları, geri bildirim, hasta yorumları'
    },
    'biyopsi-sonucu': {
        title: 'Biyopsi Sonucu Sorgulama | Prof Dr Metin Çiriş',
        description: 'Biyopsi sonuçlarınızı online olarak sorgulayın. Patoloji raporu açıklama ve bilgilendirme metinleri.',
        keywords: 'biyopsi sonucu, patoloji raporu, biyopsi sorgulama, patoloji sonucu'
    },
    'baktigim-biyopsiler': {
        title: 'Baktığım Biyopsiler | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş tarafından incelenen biyopsi türleri ve uzmanlık alanları. Tiroid, meme, gastrointestinal patoloji.',
        keywords: 'biyopsi türleri, patoloji uzmanlığı, tiroid biyopsi, meme patoloji'
    },
    'nobetci-eczane': {
        title: 'Isparta Nöbetçi Eczaneler | Prof Dr Metin Çiriş',
        description: 'Isparta Merkez ve tüm ilçeler için güncel nöbetçi eczane listesi. Adres, telefon ve harita bilgileriyle anlık eczane takibi.',
        keywords: 'nöbetçi eczane, Isparta eczane, gece eczane, Isparta nöbetçi eczaneler, eczane telefon'
    },
    'hastane-yemek': {
        title: 'SDÜ Hastane Yemek Listesi - Bugünkü Öğle ve Akşam Menüsü | Metin Çiriş',
        description: 'SDÜ hastane yemek listesi - Süleyman Demirel Üniversitesi Hastanesi günlük öğle ve akşam yemeği menüsü. Anlık güncellenen yemek tarifesi, kalori bilgileri ve kullanıcı puanlaması. Isparta SDÜ Tıp Fakültesi yemekhane menüsü.',
        keywords: 'sdü hastane yemek, sdü hastane yemek listesi, metin çiriş yemek, metin ciriş, süleyman demirel üniversitesi hastane yemek, isparta hastane yemek menüsü, sdu hastane yemek, sdü yemekhane, hastane günlük menü, sdu tip fakultesi yemek, sdü araştırma hastanesi yemek'
    },
    'ders-notlari': {
        title: 'Patoloji Ders Notları | Prof Dr Metin Çiriş',
        description: 'Tıbbi Patoloji ders notları, slaytlar ve eğitim materyalleri. Tıp fakültesi öğrencileri için.',
        keywords: 'patoloji ders notları, tıp eğitimi, patoloji slaytları, ders materyalleri'
    },
    'ders-programi': {
        title: 'Tıp Fakültesi Ders Programı | Prof Dr Metin Çiriş',
        description: 'SDÜ Tıp Fakültesi güncel ders programı ve akademik takvim.',
        keywords: 'ders programı, tıp fakültesi, akademik takvim, SDÜ tıp'
    },
    'ogrenci-yemek': {
        title: 'SDÜ Öğrenci Yemek Listesi | Prof Dr Metin Çiriş',
        description: 'Süleyman Demirel Üniversitesi öğrenci yemekhanesi günlük menüsü.',
        keywords: 'öğrenci yemek, SDÜ yemekhane, kampüs yemek'
    },
    'donem-3': {
        title: 'Dönem 3 Patoloji Dersleri | Prof Dr Metin Çiriş',
        description: 'Tıp fakültesi 3. dönem öğrencileri için patoloji kaynakları, ders notları ve duyurular.',
        keywords: 'dönem 3, patoloji dersi, tıp öğrencisi, preklinik patoloji'
    },
    galeri: {
        title: 'Fotoğraf Galerisi | Prof Dr Metin Çiriş',
        description: 'Akademik etkinlikler, kongreler ve sosyal aktivitelerden fotoğraflar.',
        keywords: 'galeri, fotoğraflar, akademik etkinlik, kongre'
    },
    portfolyo: {
        title: 'Akademik Portfolyo | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş akademik özgeçmiş, araştırma projeleri ve profesyonel deneyim.',
        keywords: 'akademik cv, özgeçmiş, araştırma projeleri, akademik kariyer'
    },
    'sinav-analizi': {
        title: 'Patoloji Sınav Analizi | Prof Dr Metin Çiriş',
        description: 'Patoloji sınav sonuçları, başarı analizleri ve istatistikler.',
        keywords: 'sınav analizi, patoloji sınavı, başarı oranı, sınav istatistikleri'
    },
    yayinlar: {
        title: 'Akademik Yayınlar | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş uluslararası ve ulusal hakemli dergilerdeki akademik yayınları.',
        keywords: 'akademik yayınlar, makaleler, SCI yayınlar, patoloji araştırma'
    },
    podcast: {
        title: 'Patoloji Podcast | Prof Dr Metin Çiriş',
        description: 'Tıbbi patoloji üzerine Türkçe sesli anlatımlar, vaka tartışmaları ve eğitim içerikleri.',
        keywords: 'patoloji podcast, tıp podcast, sesli eğitim, vaka tartışması'
    },
    blog: {
        title: 'Patoloji Blog | Prof Dr Metin Çiriş',
        description: 'Güncel tıbbi gelişmeler, patoloji haberleri ve bilimsel yazılar.',
        keywords: 'patoloji blog, tıbbi yazılar, bilimsel haberler, sağlık blog'
    },
    github: {
        title: 'Açık Kaynak Projeler | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş tarafından geliştirilen açık kaynaklı tıbbi yazılımlar ve araçlar.',
        keywords: 'açık kaynak, github, tıbbi yazılım, patoloji araçları'
    },
    facebook: {
        title: 'Facebook | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş sosyal medya paylaşımları ve duyurular.',
        keywords: 'facebook, sosyal medya, duyurular'
    },
    linkedin: {
        title: 'LinkedIn | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş profesyonel ağ ve akademik bağlantılar.',
        keywords: 'linkedin, profesyonel ağ, akademik network'
    },
    'diger-calismalar': {
        title: 'Diğer Çalışmalar | Prof Dr Metin Çiriş',
        description: 'Patoloji dışı proje ve akademik çalışmalar, yazılım geliştirme projeleri.',
        keywords: 'projeler, yan çalışmalar, yazılım projeleri'
    },
    'fetus-uzunluklari': {
        title: 'Fetus Uzunlukları Hesaplama | Prof Dr Metin Çiriş',
        description: 'Gebelik haftasına göre fetal ölçüm hesaplama aracı. Patoloji ve perinatoloji için.',
        keywords: 'fetus uzunluğu, fetal ölçüm, gebelik haftası, perinatal patoloji'
    },
    'rcb-calculator': {
        title: 'RCB Hesaplayıcı - Residual Cancer Burden | Prof Dr Metin Çiriş',
        description: 'Meme kanseri neoadjuvan tedavi sonrası Residual Cancer Burden (RCB) hesaplama aracı.',
        keywords: 'RCB hesaplama, residual cancer burden, meme kanseri, neoadjuvan tedavi'
    },
    'gist-raporlama': {
        title: 'GIST Raporlama Rehberi | Prof Dr Metin Çiriş',
        description: 'Gastrointestinal stromal tümör (GIST) patoloji raporlama kriterleri ve rehberi.',
        keywords: 'GIST, gastrointestinal stromal tümör, patoloji raporlama, GIST kriterleri'
    },
    makale: {
        title: 'Günün Patoloji Makalesi | Prof Dr Metin Çiriş',
        description: 'Her gün güncellenen PubMed patoloji makaleleri ve Türkçe özetler.',
        keywords: 'günün makalesi, patoloji literatür, PubMed, bilimsel makale'
    },
    deprem: {
        title: 'Isparta ve Türkiye Deprem Takibi | Prof Dr Metin Çiriş',
        description: 'Anlık deprem verileri, Isparta ve çevresi sismik aktivite takibi. AFAD verileriyle canlı sarsıntı analizi ve harita desteği.',
        keywords: 'deprem, Isparta deprem, sismik aktivite, AFAD deprem, son depremler, deprem haritası'
    },
    'svs-reader': {
        title: 'SVS Sanal Mikroskopi | Prof Dr Metin Çiriş',
        description: 'Online SVS dosya görüntüleyici. Dijital patoloji ve sanal mikroskopi aracı.',
        keywords: 'SVS reader, sanal mikroskopi, dijital patoloji, WSI görüntüleyici'
    },
    'tani-tuzaklari': {
        title: 'Patoloji Tanı Tuzakları | Prof Dr Metin Çiriş',
        description: 'Patolojide sık yapılan tanı hataları, pitfalls ve ayırıcı tanı ipuçları.',
        keywords: 'tanı tuzakları, patoloji pitfalls, ayırıcı tanı, tanı hataları'
    },
    'ayin-vakasi': {
        title: 'Ayın Patoloji Vakası | Prof Dr Metin Çiriş',
        description: 'Her ay güncellenen ilginç patoloji vakası ve sanal mikroskopi incelemesi.',
        keywords: 'ayın vakası, patoloji vaka, sanal mikroskopi, eğitim vakası'
    },
    'prizma-3d': {
        title: '3D Prizma - Makroskopi Aracı | Prof Dr Metin Çiriş',
        description: 'Patoloji makroskopi için 3 boyutlu görselleştirme ve örnekleme aracı.',
        keywords: '3D prizma, makroskopi, patoloji görselleştirme, 3 boyutlu'
    },
    'makale-takip': {
        title: 'Patoloji Literatür Takibi | Prof Dr Metin Çiriş',
        description: 'Güncel patoloji literatürü ve yeni yayın takip sistemi.',
        keywords: 'literatür takip, patoloji yayınlar, yeni makaleler, bilimsel takip'
    },
    'lenf-nodu': {
        title: 'Lenf Nodu Sayacı | Prof Dr Metin Çiriş',
        description: 'Patoloji makroskopi için pratik lenf nodu sayım ve kayıt aracı.',
        keywords: 'lenf nodu sayacı, makroskopi, patoloji araç, lenf nodu sayımı'
    },
    finans: {
        title: 'Ekonomik Göstergeler & Finans Paneli | Prof Dr Metin Çiriş',
        description: 'Canlı döviz kurları (Dolar, Euro), altın fiyatları ve kripto piyasa verileri. Türkiye makro ekonomik göstergeleri ve anlık piyasa takibi.',
        keywords: 'ekonomik göstergeler, döviz kuru, enflasyon, faiz oranı, dolar tl, altın fiyatları, borsa'
    },
    'pubmed-trend': {
        title: 'PubMed Trend Analizi | Prof Dr Metin Çiriş',
        description: 'Son 20 yılın PubMed yayın trendlerini analiz edin ve karşılaştırın.',
        keywords: 'PubMed trend, yayın analizi, bilimsel trend, literatür istatistik'
    },
    'online-test-analiz': {
        title: 'Online Test Sınav Analizi | Prof Dr Metin Çiriş',
        description: 'Tarayıcı üzerinden hızlı ve güvenilir optik form analiz sistemi. DAT dosyalarınızı analiz edin.',
        keywords: 'online sınav analizi, test analizi, optik form, patoloji eğitim'
    },
    'euro-maclar': {
        title: 'Avrupa Kupaları Maç Takibi | Prof Dr Metin Çiriş',
        description: 'Basketbol EuroLeague, EuroCup ve Voleybol CEV Şampiyonlar Ligi sonuçları. Temsilcilerimizin Avrupa sahnesindeki maç programı ve canlı skorları.',
        keywords: 'avrupa kupaları, euroleague, basketbol, voleybol, türk takımları, maç takibi, fenerbahçe, anadolu efes, vakıfbank'
    },
    'konsensus': {
        title: 'Patoloji Konsensus Toplantı Takibi | Prof Dr Metin Çiriş',
        description: 'Tıbbi patoloji konsensus toplantılarını canlı takip edin. Toplantı takvimi, Zoom erişim linkleri ve vaka tartışma arşivi.',
        keywords: 'patoloji konsensus, toplantı takibi, patoloji eğitim, online toplantı, patoloji vakaları'
    },
    'pubmed-makale-takip': {
        title: 'PubMed Patoloji Günlük Makale Takibi | Prof Dr Metin Çiriş',
        description: 'Dünyaca ünlü patoloji dergilerinden en güncel makaleleri PubMed üzerinden takip edin. Günlük makale akışı, Türkçe özetler ve vaka takibi için profesyonel literatür aracı.',
        keywords: 'patoloji makale, PubMed takip, günlük patoloji, tıp literatürü, makale özetleri, patoloji yayınları'
    },
    'avif-donusturucu': {
        title: 'AVIF Dönüştürücü | Prof Dr Metin Çiriş',
        description: 'Resimlerinizi modern AVIF formatına dönüştürerek kaliteden ödün vermeden dosya boyutlarını küçültün. Tamamen tarayıcı bazlı ve güvenli.',
        keywords: 'avif dönüştürücü, resim sıkıştırma, avif converter, kaliteli resim dönüştürme, online avif'
    },
    'sjogren-raporlama': {
        title: 'Sjögren Raporlama Aracı | Prof Dr Metin Çiriş',
        description: 'Minör tükrük bezi biyopsileri için Sjögren sendromu raporlama kriterleri ve otomatik rapor oluşturucu.',
        keywords: 'sjögren raporlama, minör tükrük bezi, patoloji raporu, fokus skoru, sjögren sendromu'
    },
    'tiiab-raporlama': {
        title: 'TİİAB Raporlama Aracı | Prof Dr Metin Çiriş',
        description: 'Tiroid ince iğne aspirasyon biyopsileri (TİİAB) için Bethesda 2023 kriterlerine uygun otomatik raporlama ve tanı destek aracı.',
        keywords: 'TİİAB raporlama, tiroid biyopsi, Bethesda 2023, patoloji raporu, tiroid ince iğne'
    },
    'endoskopi-raporlama': {
        title: 'Endoskopi Raporlama Aracı | Prof Dr Metin Çiriş',
        description: 'Gastrointestinal sistem endoskopik biyopsileri için standartlaştırılmış patoloji raporlama aracı.',
        keywords: 'endoskopi raporlama, mide biyopsisi, kolon biyopsisi, patoloji raporu, GİS patoloji'
    },
    'dunya-saatleri': {
        title: 'Dünya Saatleri | Prof Dr Metin Çiriş',
        description: 'Dünya saat dilimleri haritası ve toplantı zamanlama aracı. Avrupa ve Amerika şehirlerinin anlık saatleri, gece/gündüz görselleştirmesi.',
        keywords: 'dünya saatleri, saat dilimleri, toplantı planlama, timezone, world clock'
    },
    '404': {
        title: 'Sayfa Bulunamadı | Prof Dr Metin Çiriş',
        description: 'Aradığınız sayfa mevcut değil.'
    }
};

// JSON-LD Yapısal Veri
const getStructuredData = (currentPage: string, meta: { title: string; description: string }) => {
    // Ana navigasyon öğeleri - arama motorlarında sitelinks olarak görünecek
    const navigationItems = [
        { name: "Ana Sayfa", url: `${BASE_URL}/` },
        { name: "Biyopsi Sonucu", url: `${BASE_URL}/biyopsi-sonucu` },
        { name: "İletişim", url: `${BASE_URL}/iletisim` },
        { name: "Ders Notları", url: `${BASE_URL}/ders-notlari` },
        { name: "Yayınlar", url: `${BASE_URL}/yayinlar` },
        { name: "Tanı Tuzakları", url: `${BASE_URL}/tani-tuzaklari` },
        { name: "Ayın Vakası", url: `${BASE_URL}/ayin-vakasi` },
        { name: "SVS Mikroskopi", url: `${BASE_URL}/svs-reader` },
        { name: "PubMed Trend", url: `${BASE_URL}/pubmed-trend` },
        { name: "PubMed Takip", url: `${BASE_URL}/pubmed-makale-takip` },
        { name: "AVIF Dönüştürücü", url: `${BASE_URL}/avif-donusturucu` },
        { name: "Konsensus", url: `${BASE_URL}/konsensus` },
        { name: "Diğer Çalışmalar", url: `${BASE_URL}/diger-calismalar` }
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
                "@id": `${BASE_URL}/${currentPage === 'home' ? '' : currentPage}`,
                "url": currentPage === 'home' ? BASE_URL : `${BASE_URL}/${currentPage}`,
                "name": meta.title,
                "description": meta.description,
                "isPartOf": {
                    "@id": `${BASE_URL}/#website`
                },
                "inLanguage": "tr-TR"
            },
            // Site Navigasyon Öğesi - Arama motorlarına alt sayfaları tanıtır
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
            // Breadcrumb - Sayfa hiyerarşisini gösterir
            currentPage !== 'home' ? {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Ana Sayfa",
                        "item": BASE_URL
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": meta.title.split(' | ')[0],
                        "item": `${BASE_URL}/${currentPage}`
                    }
                ]
            } : null
        ].filter(Boolean)
    };

    return JSON.stringify(baseStructuredData);
};


export const SEO: React.FC<SEOProps> = ({ currentPage }) => {
    useEffect(() => {
        const meta = PAGE_METADATA[currentPage] || PAGE_METADATA.home;
        const canonicalUrl = currentPage === 'home' ? BASE_URL : `${BASE_URL}/${currentPage}`;

        // Update Title
        document.title = meta.title;

        // Update Meta Description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', meta.description);
        } else {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            metaDescription.setAttribute('content', meta.description);
            document.head.appendChild(metaDescription);
        }

        // Update Keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (meta.keywords) {
            if (metaKeywords) {
                metaKeywords.setAttribute('content', meta.keywords);
            } else {
                metaKeywords = document.createElement('meta');
                metaKeywords.setAttribute('name', 'keywords');
                metaKeywords.setAttribute('content', meta.keywords);
                document.head.appendChild(metaKeywords);
            }
        }

        // Update Canonical Link
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            canonicalLink.setAttribute('href', canonicalUrl);
        } else {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            canonicalLink.setAttribute('href', canonicalUrl);
            document.head.appendChild(canonicalLink);
        }

        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', meta.title);

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.setAttribute('content', meta.description);

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) {
            ogUrl.setAttribute('content', canonicalUrl);
        } else {
            const newOgUrl = document.createElement('meta');
            newOgUrl.setAttribute('property', 'og:url');
            newOgUrl.setAttribute('content', canonicalUrl);
            document.head.appendChild(newOgUrl);
        }

        // Update Twitter Card URL
        let twitterUrl = document.querySelector('meta[name="twitter:url"]');
        if (!twitterUrl) {
            twitterUrl = document.createElement('meta');
            twitterUrl.setAttribute('name', 'twitter:url');
            document.head.appendChild(twitterUrl);
        }
        twitterUrl.setAttribute('content', canonicalUrl);

        // Update JSON-LD Structured Data
        let jsonLdScript = document.querySelector('script[type="application/ld+json"]');
        if (jsonLdScript) {
            jsonLdScript.textContent = getStructuredData(currentPage, meta);
        } else {
            jsonLdScript = document.createElement('script');
            jsonLdScript.setAttribute('type', 'application/ld+json');
            jsonLdScript.textContent = getStructuredData(currentPage, meta);
            document.head.appendChild(jsonLdScript);
        }

        // Add hreflang for Turkish
        let hreflang = document.querySelector('link[hreflang="tr"]');
        if (!hreflang) {
            hreflang = document.createElement('link');
            hreflang.setAttribute('rel', 'alternate');
            hreflang.setAttribute('hreflang', 'tr');
            hreflang.setAttribute('href', canonicalUrl);
            document.head.appendChild(hreflang);
        } else {
            hreflang.setAttribute('href', canonicalUrl);
        }

    }, [currentPage]);

    return null;
};
