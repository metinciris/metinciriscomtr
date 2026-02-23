/**
 * generate-spa-pages.js
 * 
 * Bu script build sonrası çalışarak her sayfa için 
 * index.html kopyası oluşturur. Bu sayede GitHub Pages
 * doğrudan 200 status code döner (404 redirect yerine).
 * 
 * SEO için çok önemli! Her sayfa kendi <title> ve <meta description>
 * değerlerini alır, böylece Googlebot JavaScript çalıştırmadan
 * bile doğru meta verileri görür.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Sayfa meta verileri (SEO.tsx ile senkron) ---
const PAGE_METADATA = {
    iletisim: {
        title: 'İletişim | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş ile iletişime geçin. SDÜ Tıp Fakültesi Tıbbi Patoloji - adres, telefon ve konum bilgileri.'
    },
    'ziyaret-mesaji': {
        title: 'Ziyaretçi Mesajı | Prof Dr Metin Çiriş',
        description: 'Ziyaretçilerimizden gelen mesajlar ve geri bildirimler.'
    },
    'biyopsi-sonucu': {
        title: 'Biyopsi Sonucu Sorgulama | Prof Dr Metin Çiriş',
        description: 'Biyopsi sonuçlarınızı online olarak sorgulayın. Patoloji raporu açıklama ve bilgilendirme metinleri.'
    },
    'baktigim-biyopsiler': {
        title: 'Baktığım Biyopsiler | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş tarafından incelenen biyopsi türleri ve uzmanlık alanları.'
    },
    'nobetci-eczane': {
        title: 'Isparta Nöbetçi Eczaneler | Prof Dr Metin Çiriş',
        description: 'Isparta Merkez ve tüm ilçeler için güncel nöbetçi eczane listesi. Adres, telefon ve harita bilgileriyle anlık eczane takibi.'
    },
    'hastane-yemek': {
        title: 'SDÜ Hastane Yemek Listesi - Bugünkü Öğle ve Akşam Menüsü | Metin Çiriş',
        description: 'SDÜ hastane yemek listesi - Süleyman Demirel Üniversitesi Hastanesi günlük öğle ve akşam yemeği menüsü.'
    },
    'ders-notlari': {
        title: 'Patoloji Ders Notları | Prof Dr Metin Çiriş',
        description: 'Tıbbi Patoloji ders notları, slaytlar ve eğitim materyalleri. Tıp fakültesi öğrencileri için.'
    },
    'ders-programi': {
        title: 'Tıp Fakültesi Ders Programı | Prof Dr Metin Çiriş',
        description: 'SDÜ Tıp Fakültesi güncel ders programı ve akademik takvim.'
    },
    'ogrenci-yemek': {
        title: 'SDÜ Öğrenci Yemek Listesi | Prof Dr Metin Çiriş',
        description: 'Süleyman Demirel Üniversitesi öğrenci yemekhanesi günlük menüsü.'
    },
    'donem-3': {
        title: 'Dönem 3 Patoloji Dersleri | Prof Dr Metin Çiriş',
        description: 'Tıp fakültesi 3. dönem öğrencileri için patoloji kaynakları, ders notları ve duyurular.'
    },
    galeri: {
        title: 'Fotoğraf Galerisi | Prof Dr Metin Çiriş',
        description: 'Akademik etkinlikler, kongreler ve sosyal aktivitelerden fotoğraflar.'
    },
    portfolyo: {
        title: 'Akademik Portfolyo | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş akademik özgeçmiş, araştırma projeleri ve profesyonel deneyim.'
    },
    'sinav-analizi': {
        title: 'Patoloji Sınav Analizi | Prof Dr Metin Çiriş',
        description: 'Patoloji sınav sonuçları, başarı analizleri ve istatistikler.'
    },
    yayinlar: {
        title: 'Akademik Yayınlar | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş uluslararası ve ulusal hakemli dergilerdeki akademik yayınları.'
    },
    podcast: {
        title: 'Patoloji Podcast | Prof Dr Metin Çiriş',
        description: 'Tıbbi patoloji üzerine Türkçe sesli anlatımlar, vaka tartışmaları ve eğitim içerikleri.'
    },
    blog: {
        title: 'Patoloji Blog | Prof Dr Metin Çiriş',
        description: 'Güncel tıbbi gelişmeler, patoloji haberleri ve bilimsel yazılar.'
    },
    github: {
        title: 'Açık Kaynak Projeler | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş tarafından geliştirilen açık kaynaklı tıbbi yazılımlar ve araçlar.'
    },
    facebook: {
        title: 'Facebook | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş sosyal medya paylaşımları ve duyurular.'
    },
    linkedin: {
        title: 'LinkedIn | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş profesyonel ağ ve akademik bağlantılar.'
    },
    'diger-calismalar': {
        title: 'Diğer Çalışmalar | Prof Dr Metin Çiriş',
        description: 'Patoloji dışı proje ve akademik çalışmalar, yazılım geliştirme projeleri.'
    },
    'fetus-uzunluklari': {
        title: 'Fetus Uzunlukları Hesaplama | Prof Dr Metin Çiriş',
        description: 'Gebelik haftasına göre fetal ölçüm hesaplama aracı. Patoloji ve perinatoloji için.'
    },
    'rcb-calculator': {
        title: 'RCB Hesaplayıcı - Residual Cancer Burden | Prof Dr Metin Çiriş',
        description: 'Meme kanseri neoadjuvan tedavi sonrası Residual Cancer Burden (RCB) hesaplama aracı.'
    },
    'gist-raporlama': {
        title: 'GIST Raporlama Rehberi | Prof Dr Metin Çiriş',
        description: 'Gastrointestinal stromal tümör (GIST) patoloji raporlama kriterleri ve rehberi.'
    },
    makale: {
        title: 'Günün Patoloji Makalesi | Prof Dr Metin Çiriş',
        description: 'Her gün güncellenen PubMed patoloji makaleleri ve Türkçe özetler.'
    },
    deprem: {
        title: 'Isparta ve Türkiye Deprem Takibi | Prof Dr Metin Çiriş',
        description: 'Anlık deprem verileri, Isparta ve çevresi sismik aktivite takibi. AFAD verileriyle canlı sarsıntı analizi.'
    },
    'svs-reader': {
        title: 'SVS Sanal Mikroskopi | Prof Dr Metin Çiriş',
        description: 'Online SVS dosya görüntüleyici. Dijital patoloji ve sanal mikroskopi aracı.'
    },
    'tani-tuzaklari': {
        title: 'Patoloji Tanı Tuzakları | Prof Dr Metin Çiriş',
        description: 'Patolojide sık yapılan tanı hataları, pitfalls ve ayırıcı tanı ipuçları.'
    },
    'ayin-vakasi': {
        title: 'Ayın Patoloji Vakası | Prof Dr Metin Çiriş',
        description: 'Her ay güncellenen ilginç patoloji vakası ve sanal mikroskopi incelemesi.'
    },
    'prizma-3d': {
        title: '3D Prizma - Makroskopi Aracı | Prof Dr Metin Çiriş',
        description: 'Patoloji makroskopi için 3 boyutlu görselleştirme ve örnekleme aracı.'
    },
    'makale-takip': {
        title: 'Patoloji Literatür Takibi | Prof Dr Metin Çiriş',
        description: 'Güncel patoloji literatürü ve yeni yayın takip sistemi.'
    },
    'lenf-nodu': {
        title: 'Lenf Nodu Sayacı | Prof Dr Metin Çiriş',
        description: 'Patoloji makroskopi için pratik lenf nodu sayım ve kayıt aracı.'
    },
    finans: {
        title: 'Ekonomik Göstergeler & Finans Paneli | Prof Dr Metin Çiriş',
        description: 'Canlı döviz kurları, altın fiyatları ve kripto piyasa verileri. Türkiye makro ekonomik göstergeleri.'
    },
    'pubmed-trend': {
        title: 'PubMed Trend Analizi | Prof Dr Metin Çiriş',
        description: 'Son 20 yılın PubMed yayın trendlerini analiz edin ve karşılaştırın.'
    },
    'online-test-analiz': {
        title: 'Online Test Sınav Analizi | Prof Dr Metin Çiriş',
        description: 'Tarayıcı üzerinden hızlı ve güvenilir optik form analiz sistemi.'
    },
    'euro-maclar': {
        title: 'Avrupa Kupaları Maç Takibi | Prof Dr Metin Çiriş',
        description: 'Basketbol EuroLeague, EuroCup ve Voleybol CEV Şampiyonlar Ligi sonuçları.'
    },
    konsensus: {
        title: 'Patoloji Konsensus Toplantı Takibi | Prof Dr Metin Çiriş',
        description: 'Tıbbi patoloji konsensus toplantılarını canlı takip edin. Toplantı takvimi ve vaka tartışma arşivi.'
    },
    'pubmed-makale-takip': {
        title: 'PubMed Patoloji Günlük Makale Takibi | Prof Dr Metin Çiriş',
        description: 'Dünyaca ünlü patoloji dergilerinden en güncel makaleleri PubMed üzerinden takip edin.'
    },
    'avif-donusturucu': {
        title: 'AVIF Dönüştürücü | Prof Dr Metin Çiriş',
        description: 'Resimlerinizi modern AVIF formatına dönüştürerek kaliteden ödün vermeden dosya boyutlarını küçültün.'
    },
    'sjogren-raporlama': {
        title: 'Sjögren Raporlama Aracı | Prof Dr Metin Çiriş',
        description: 'Minör tükrük bezi biyopsileri için Sjögren sendromu raporlama kriterleri ve otomatik rapor oluşturucu.'
    },
    'endoskopi-raporlama': {
        title: 'Endoskopi Raporlama Aracı | Prof Dr Metin Çiriş',
        description: 'Gastrointestinal sistem endoskopik biyopsileri için standartlaştırılmış patoloji raporlama aracı.'
    },
    'tiiab-raporlama': {
        title: 'TİİAB Raporlama Aracı | Prof Dr Metin Çiriş',
        description: 'Tiroid ince iğne aspirasyon biyopsileri (TİİAB) için Bethesda 2023 kriterlerine uygun otomatik raporlama aracı.'
    },
    'dunya-saatleri': {
        title: 'Dünya Saatleri | Prof Dr Metin Çiriş',
        description: 'Dünya saat dilimleri haritası ve toplantı zamanlama aracı.'
    },
    'patoloji-sozlugu': {
        title: 'Patoloji Sözlüğü | Prof Dr Metin Çiriş',
        description: 'Patoloji raporlarında sık karşılaşılan tıbbi terimlerin açıklamaları ve hasta bilgilendirme rehberi.'
    }
};

// Shared page listeyi src/data/pages.ts'den oku
const pagesFilePath = join(__dirname, '..', 'src', 'data', 'pages.ts');
const pagesFileContent = readFileSync(pagesFilePath, 'utf8');

const match = pagesFileContent.match(/export const validPages = \s*\[([\s\S]*?)\];/);
if (!match) {
    console.error('❌ src/data/pages.ts okunamadı veya formatı hatalı!');
    process.exit(1);
}

const validPages = match[1]
    .split(',')
    .map(p => p.trim().replace(/['"]/g, '').trim())
    .filter(p => p && p !== 'home');

const distDir = join(__dirname, '..', 'dist');
const indexPath = join(distDir, 'index.html');

console.log('🚀 SPA sayfaları oluşturuluyor (sayfa bazlı meta verileriyle)...\n');

if (!existsSync(indexPath)) {
    console.error('❌ dist/index.html bulunamadı! Önce "npm run build" çalıştırın.');
    process.exit(1);
}

const indexContent = readFileSync(indexPath, 'utf8');

const DEFAULT_TITLE = 'Prof Dr Metin Çiriş | SDÜ Tıbbi Patoloji';
const BASE_URL = 'https://metinciris.com.tr';

let created = 0;
let metaInjected = 0;

for (const page of validPages) {
    const pageDir = join(distDir, page);
    const pagePath = join(pageDir, 'index.html');

    if (!existsSync(pageDir)) {
        mkdirSync(pageDir, { recursive: true });
    }

    let pageContent = indexContent;
    const meta = PAGE_METADATA[page];

    if (meta) {
        // <title> değiştir
        pageContent = pageContent.replace(
            /<title>.*?<\/title>/,
            `<title>${meta.title}</title>`
        );

        // <meta name="description"> değiştir
        pageContent = pageContent.replace(
            /<meta name="description"[\s\S]*?\/>/,
            `<meta name="description" content="${meta.description}" />`
        );

        // <link rel="canonical"> değiştir
        pageContent = pageContent.replace(
            /<link rel="canonical" href=".*?" \/>/,
            `<link rel="canonical" href="${BASE_URL}/${page}/" />`
        );

        // Open Graph title ve description değiştir
        pageContent = pageContent.replace(
            /<meta property="og:title" content=".*?" \/>/,
            `<meta property="og:title" content="${meta.title}" />`
        );
        pageContent = pageContent.replace(
            /<meta property="og:description"[\s\S]*?\/>/,
            `<meta property="og:description" content="${meta.description}" />`
        );
        pageContent = pageContent.replace(
            /<meta property="og:url" content=".*?" \/>/,
            `<meta property="og:url" content="${BASE_URL}/${page}/" />`
        );

        // Twitter Card değiştir
        pageContent = pageContent.replace(
            /<meta name="twitter:title" content=".*?" \/>/,
            `<meta name="twitter:title" content="${meta.title}" />`
        );
        pageContent = pageContent.replace(
            /<meta name="twitter:description"[\s\S]*?\/>/,
            `<meta name="twitter:description" content="${meta.description}" />`
        );

        // Hreflang güncelle
        pageContent = pageContent.replace(
            /<link rel="alternate" hreflang="tr" href=".*?" \/>/,
            `<link rel="alternate" hreflang="tr" href="${BASE_URL}/${page}/" />`
        );
        pageContent = pageContent.replace(
            /<link rel="alternate" hreflang="x-default" href=".*?" \/>/,
            `<link rel="alternate" hreflang="x-default" href="${BASE_URL}/${page}/" />`
        );

        metaInjected++;
        console.log(`  ✓ /${page}/index.html  [META ✅]`);
    } else {
        console.log(`  ✓ /${page}/index.html  [meta yok, varsayılan]`);
    }

    writeFileSync(pagePath, pageContent, 'utf8');
    created++;
}

console.log(`\n✅ ${created} sayfa başarıyla oluşturuldu!`);
console.log(`📊 ${metaInjected} sayfaya özel meta verileri enjekte edildi.`);
console.log('📦 GitHub Pages artık tüm sayfalara 200 status code ile yanıt verecek.\n');
