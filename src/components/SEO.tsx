import { useEffect } from 'react';

interface SEOProps {
    currentPage: string;
}

const PAGE_METADATA: Record<string, { title: string; description: string }> = {
    home: {
        title: 'Prof Dr Metin Çiriş | SDÜ Tıbbi Patoloji',
        description: 'Prof Dr Metin Çiriş – Süleyman Demirel Üniversitesi Tıp Fakültesi Tıbbi Patoloji Anabilim Dalı. Hasta bilgilendirme, biyopsi sonuçları ve akademik yayınlar.'
    },
    iletisim: {
        title: 'İletişim | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş ile iletişime geçin. Adres, telefon ve konum bilgileri.'
    },
    'ziyaret-mesaji': {
        title: 'Ziyaretçi Mesajı | Prof Dr Metin Çiriş',
        description: 'Ziyaretçilerimizden gelen mesajlar ve geri bildirimler.'
    },
    'biyopsi-sonucu': {
        title: 'Biyopsi Sonucu Sorgulama | Prof Dr Metin Çiriş',
        description: 'Biyopsi sonuçlarınızı online olarak sorgulayın ve bilgilendirme metinlerini okuyun.'
    },
    'baktigim-biyopsiler': {
        title: 'Baktığım Biyopsiler | Prof Dr Metin Çiriş',
        description: 'Metin Çiriş tarafından incelenen biyopsi türleri ve uzmanlık alanları.'
    },
    'nobetci-eczane': {
        title: 'Nöbetçi Eczaneler | Prof Dr Metin Çiriş',
        description: 'Güncel nöbetçi eczane listesi.'
    },
    'hastane-yemek': {
        title: 'Hastane Yemek Listesi | Prof Dr Metin Çiriş',
        description: 'SDÜ Hastanesi günlük yemek listesi.'
    },
    'ders-notlari': {
        title: 'Ders Notları | Prof Dr Metin Çiriş',
        description: 'Tıbbi Patoloji ders notları ve eğitim materyalleri.'
    },
    'ders-programi': {
        title: 'Ders Programı | Prof Dr Metin Çiriş',
        description: 'Tıp Fakültesi güncel ders programı.'
    },
    'ogrenci-yemek': {
        title: 'Öğrenci Yemek Listesi | Prof Dr Metin Çiriş',
        description: 'SDÜ öğrenci yemekhanesi günlük menüsü.'
    },
    'donem-3': {
        title: 'Dönem 3 Patoloji | Prof Dr Metin Çiriş',
        description: 'Dönem 3 öğrencileri için patoloji kaynakları ve duyurular.'
    },
    galeri: {
        title: 'Galeri | Prof Dr Metin Çiriş',
        description: 'Akademik ve sosyal etkinliklerden fotoğraflar.'
    },
    portfolyo: {
        title: 'Portfolyo | Prof Dr Metin Çiriş',
        description: 'Akademik özgeçmiş, çalışmalar ve projeler.'
    },
    'sinav-analizi': {
        title: 'Sınav Analizi | Prof Dr Metin Çiriş',
        description: 'Patoloji sınav sonuçları ve başarı analizleri.'
    },
    yayinlar: {
        title: 'Yayınlar | Prof Dr Metin Çiriş',
        description: 'Uluslararası ve ulusal akademik yayınlar listesi.'
    },
    podcast: {
        title: 'Patoloji Podcast | Prof Dr Metin Çiriş',
        description: 'Tıbbi patoloji üzerine sesli anlatımlar ve tartışmalar.'
    },
    blog: {
        title: 'Blog | Prof Dr Metin Çiriş',
        description: 'Güncel tıbbi gelişmeler ve patoloji üzerine yazılar.'
    },
    github: {
        title: 'Açık Kaynak Projeler | Prof Dr Metin Çiriş',
        description: 'Metin Çiriş tarafından geliştirilen açık kaynaklı yazılımlar.'
    },
    facebook: {
        title: 'Facebook | Prof Dr Metin Çiriş',
        description: 'Sosyal medya paylaşımları ve duyurular.'
    },
    linkedin: {
        title: 'LinkedIn | Prof Dr Metin Çiriş',
        description: 'Profesyonel ağ ve akademik bağlantılar.'
    },
    'diger-calismalar': {
        title: 'Diğer Çalışmalar | Prof Dr Metin Çiriş',
        description: 'Farklı alanlardaki proje ve akademik çalışmalar.'
    },
    'fetus-uzunluklari': {
        title: 'Fetus Uzunlukları Hesaplama | Prof Dr Metin Çiriş',
        description: 'Fetal ölçüm ve patoloji hesaplama aracı.'
    },
    'rcb-calculator': {
        title: 'Residual Cancer Burden Hesaplayıcı | Prof Dr Metin Çiriş',
        description: 'Meme kanseri tedavi sonrası RCB hesaplama aracı.'
    },
    'gist-raporlama': {
        title: 'GIST Raporlama Rehberi | Prof Dr Metin Çiriş',
        description: 'Gastrointestinal stromal tümörler için raporlama kriterleri.'
    },
    makale: {
        title: 'Günün Makalesi | Prof Dr Metin Çiriş',
        description: 'Günün öne çıkan patoloji makalesi ve Pubmed özetleri.'
    },
    deprem: {
        title: 'Deprem Takibi | Prof Dr Metin Çiriş',
        description: 'Anlık deprem verileri ve Isparta çevresi sismik hareketler.'
    },
    'svs-reader': {
        title: 'SVS Mikroskopi | Prof Dr Metin Çiriş',
        description: 'Online sanal mikroskopi ve SVS dosya görüntüleyici.'
    },
    'tani-tuzaklari': {
        title: 'Patoloji Tanı Tuzakları | Prof Dr Metin Çiriş',
        description: 'Patolojide sık yapılan hatalar ve tanısal ipuçları.'
    },
    'ayin-vakasi': {
        title: 'Ayın Vakası | Prof Dr Metin Çiriş',
        description: 'Ayın ilginç patoloji vakası ve sanal mikroskopi incelemesi.'
    },
    'prizma-3d': {
        title: '3D Prizma Görselleştirme | Prof Dr Metin Çiriş',
        description: 'Makroskobik örnekleme için 3 boyutlu görselleştirme aracı.'
    },
    'makale-takip': {
        title: 'Patoloji Makale Takibi | Prof Dr Metin Çiriş',
        description: 'Güncel patoloji literatürü takip sistemi.'
    },
    'lenf-nodu': {
        title: 'Lenf Nodu Sayacı | Prof Dr Metin Çiriş',
        description: 'Patoloji makroskopi için pratik lenf nodu sayım aracı.'
    },
    finans: {
        title: 'Finansal Göstergeler | Prof Dr Metin Çiriş',
        description: 'Canlı ekonomik veriler ve makro göstergeler.'
    },
    '404': {
        title: 'Sayfa Bulunamadı | Prof Dr Metin Çiriş',
        description: 'Aradığınız sayfa mevcut değil.'
    }
};

export const SEO: React.FC<SEOProps> = ({ currentPage }) => {
    useEffect(() => {
        const meta = PAGE_METADATA[currentPage] || PAGE_METADATA.home;

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

        // Update Open Graph tags for better SEO
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', meta.title);

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.setAttribute('content', meta.description);

    }, [currentPage]);

    return null;
};
