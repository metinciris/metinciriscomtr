export const BASE_URL = 'https://metinciris.com.tr';

export interface PageMetadata {
    slug: string;
    title: string;
    description: string;
    keywords?: string;
    noindex?: boolean;
    lastmod?: string;
    priority?: number;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export const PAGE_REGISTRY: Record<string, PageMetadata> = {
    home: {
        slug: '',
        title: 'Prof. Dr. İbrahim Metin Çiriş | Tıbbi Patoloji Uzmanı',
        description: 'Prof. Dr. İbrahim Metin Çiriş – Tanısal patoloji, moleküler patoloji, dijital patoloji, bilimsel yayınlar, patoloji notları ve hasta bilgilendirme kaynaklarını içeren profesyonel web sitesi.',
        keywords: 'patoloji, biyopsi, tıbbi patoloji, Metin Çiriş, tanısal patoloji, moleküler patoloji, dijital patoloji, patoloji uzmanı',
        lastmod: '2026-07-16',
        priority: 1.0,
        changefreq: 'weekly'
    },
    'basvuru-merkezi': {
        slug: 'basvuru-merkezi',
        title: 'Patoloji Başvuru Merkezi | Prof. Dr. Metin Çiriş',
        description: 'Tanısal rehberler, moleküler patoloji kılavuzları, raporlama araçları ve güncel literatür seçkilerinin derlendiği merkezi referans kaynağı.',
        keywords: 'patoloji rehberleri, tanısal patoloji, moleküler patoloji, raporlama, patoloji araçları',
        lastmod: '2026-07-16',
        priority: 0.9,
        changefreq: 'weekly'
    },
    iletisim: {
        slug: 'iletisim',
        title: 'İletişim | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş ile iletişime geçin. SDÜ Tıp Fakültesi Tıbbi Patoloji - adres, telefon ve konum bilgileri.',
        keywords: 'iletişim, adres, telefon, SDÜ patoloji, Metin Çiriş iletişim',
        lastmod: '2026-07-16',
        priority: 0.9,
        changefreq: 'monthly'
    },
    'ziyaret-mesaji': {
        slug: 'ziyaret-mesaji',
        title: 'Ziyaretçi Mesajı | Prof Dr Metin Çiriş',
        description: 'Ziyaretçilerimizden gelen mesajlar ve geri bildirimler.',
        keywords: 'ziyaretçi mesajları, geri bildirim, hasta yorumları',
        lastmod: '2026-07-16',
        priority: 0.6,
        changefreq: 'monthly'
    },
    'biyopsi-sonucu': {
        slug: 'biyopsi-sonucu',
        title: 'Biyopsi Sonucu Sorgulama | Prof Dr Metin Çiriş',
        description: 'Biyopsi sonuçlarınızı online olarak sorgulayın. Patoloji raporu açıklama ve bilgilendirme metinleri.',
        keywords: 'biyopsi sonucu, patoloji raporu, biyopsi sorgulama, patoloji sonucu',
        lastmod: '2026-07-16',
        priority: 0.9,
        changefreq: 'monthly'
    },
    'baktigim-biyopsiler': {
        slug: 'baktigim-biyopsiler',
        title: 'Baktığım Biyopsiler | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş tarafından incelenen biyopsi türleri ve uzmanlık alanları. Tiroid, meme, gastrointestinal patoloji.',
        keywords: 'biyopsi türleri, patoloji uzmanlığı, tiroid biyopsi, meme patoloji',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'monthly'
    },
    'nobetci-eczane': {
        slug: 'nobetci-eczane',
        title: 'Isparta Nöbetçi Eczaneler | Prof Dr Metin Çiriş',
        description: 'Isparta Merkez ve tüm ilçeler için güncel nöbetçi eczane listesi. Adres, telefon ve harita bilgileriyle anlık eczane takibi.',
        keywords: 'nöbetçi eczane, Isparta eczane, gece eczane, Isparta nöbetçi eczaneler, eczane telefon',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'daily'
    },
    'hastane-yemek': {
        slug: 'hastane-yemek',
        title: 'SDÜ Hastane Yemek Listesi - Bugünkü Öğle ve Akşam Menüsü | Metin Çiriş',
        description: 'SDÜ hastane yemek listesi - Süleyman Demirel Üniversitesi Hastanesi günlük öğle ve akşam yemeği menüsü. Anlık güncellenen yemek tarifesi, kalori bilgileri ve kullanıcı puanlaması. Isparta SDÜ Tıp Fakültesi yemekhane menüsü.',
        keywords: 'sdü hastane yemek, sdü hastane yemek listesi, metin çiriş yemek, metin ciriş, süleyman demirel üniversitesi hastane yemek, isparta hastane yemek menüsü, sdu hastane yemek, sdü yemekhane, hastane günlük menü, sdu tip fakultesi yemek, sdü araştırma hastanesi yemek',
        lastmod: '2026-07-16',
        priority: 0.6,
        changefreq: 'daily'
    },
    'ders-notlari': {
        slug: 'ders-notlari',
        title: 'Patoloji Ders Notları | Prof Dr Metin Çiriş',
        description: 'Tıbbi Patoloji ders notları, slaytlar and eğitim materyalleri. Tıp fakültesi öğrencileri için.',
        keywords: 'patoloji ders notları, tıp eğitimi, patoloji slaytları, ders materyalleri',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'weekly'
    },
    'ders-programi': {
        slug: 'ders-programi',
        title: 'Tıp Fakültesi Ders Programı | Prof Dr Metin Çiriş',
        description: 'SDÜ Tıp Fakültesi güncel ders programı ve akademik takvim.',
        keywords: 'ders programı, tıp fakültesi, akademik takvim, SDÜ tıp',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'weekly'
    },
    'ogrenci-yemek': {
        slug: 'ogrenci-yemek',
        title: 'SDÜ Öğrenci Yemek Listesi | Prof Dr Metin Çiriş',
        description: 'Süleyman Demirel Üniversitesi öğrenci yemekhanesi günlük menüsü.',
        keywords: 'öğrenci yemek, SDÜ yemekhane, kampüs yemek',
        lastmod: '2026-07-16',
        priority: 0.6,
        changefreq: 'daily'
    },
    'donem-3': {
        slug: 'donem-3',
        title: 'Dönem 3 Patoloji Dersleri | Prof Dr Metin Çiriş',
        description: 'Tıp fakültesi 3. dönem öğrencileri için patoloji kaynakları, ders notları ve duyurular.',
        keywords: 'dönem 3, patoloji dersi, tıp öğrencisi, preklinik patoloji',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'weekly'
    },
    galeri: {
        slug: 'galeri',
        title: 'Fotoğraf Galerisi | Prof Dr Metin Çiriş',
        description: 'Akademik etkinlikler, kongreler ve sosyal aktivitelerden fotoğraflar.',
        keywords: 'galeri, fotoğraflar, akademik etkinlik, kongre',
        lastmod: '2026-07-16',
        priority: 0.5,
        changefreq: 'monthly'
    },
    portfolyo: {
        slug: 'portfolyo',
        title: 'Akademik Portfolyo | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş akademik özgeçmiş, araştırma projeleri ve profesyonel deneyim.',
        keywords: 'akademik cv, özgeçmiş, araştırma projeleri, akademik kariyer',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'monthly'
    },
    'sinav-analizi': {
        slug: 'sinav-analizi',
        title: 'Patoloji Sınav Analizi | Prof Dr Metin Çiriş',
        description: 'Patoloji sınav sonuçları, başarı analizleri ve istatistikler.',
        keywords: 'sınav analizi, patoloji sınavı, başarı oranı, sınav istatistikleri',
        lastmod: '2026-07-16',
        priority: 0.6,
        changefreq: 'monthly'
    },
    yayinlar: {
        slug: 'yayinlar',
        title: 'Akademik Yayınlar | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş uluslararası ve ulusal hakemli dergilerdeki akademik yayınları.',
        keywords: 'akademik yayınlar, makaleler, SCI yayınlar, patoloji araştırma',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'monthly'
    },
    podcast: {
        slug: 'podcast',
        title: 'Patoloji Podcast | Prof Dr Metin Çiriş',
        description: 'Tıbbi patoloji üzerine Türkçe sesli anlatımlar, vaka tartışmaları ve eğitim içerikleri.',
        keywords: 'patoloji podcast, tıp podcast, sesli eğitim, vaka tartışması',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'weekly'
    },
    blog: {
        slug: 'blog',
        title: 'Patoloji Blog | Prof Dr Metin Çiriş',
        description: 'Güncel tıbbi gelişmeler, patoloji haberleri ve bilimsel yazılar.',
        keywords: 'patoloji blog, tıbbi yazılar, bilimsel haberler, sağlık blog',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'weekly'
    },
    github: {
        slug: 'github',
        title: 'Açık Kaynak Projeler | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş tarafından geliştirilen açık kaynaklı tıbbi yazılımlar ve araçlar.',
        keywords: 'açık kaynak, github, tıbbi yazılım, patoloji araçları',
        lastmod: '2026-07-16',
        priority: 0.5,
        changefreq: 'monthly'
    },
    facebook: {
        slug: 'facebook',
        title: 'Facebook | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş sosyal medya paylaşımları ve duyurular.',
        keywords: 'facebook, sosyal medya, duyurular',
        lastmod: '2026-07-16',
        priority: 0.4,
        changefreq: 'monthly'
    },
    linkedin: {
        slug: 'linkedin',
        title: 'LinkedIn | Prof Dr Metin Çiriş',
        description: 'Prof Dr Metin Çiriş profesyonel ağ ve akademik bağlantılar.',
        keywords: 'linkedin, profesyonel ağ, akademik network',
        lastmod: '2026-07-16',
        priority: 0.4,
        changefreq: 'monthly'
    },
    universite: {
        slug: 'universite',
        title: 'SDÜ ve Öğrenci Kaynakları | Prof. Dr. Metin Çiriş',
        description: 'Tıp fakültesi dönemine ait patoloji ders notları, öğrenci kaynakları, kampüs içerikleri ve eğitim materyalleri arşivi.',
        keywords: 'SDÜ, üniversite, ders notları, patoloji eğitim, Süleyman Demirel Üniversitesi, kampüs',
        lastmod: '2026-07-14',
        priority: 0.5,
        changefreq: 'monthly'
    },
    'diger-calismalar': {
        slug: 'diger-calismalar',
        title: 'Diğer Çalışmalar | Prof Dr Metin Çiriş',
        description: 'Patoloji dışı proje ve akademik çalışmalar, yazılım geliştirme projeleri.',
        keywords: 'projeler, yan çalışmalar, yazılım projeleri',
        lastmod: '2026-07-16',
        priority: 0.6,
        changefreq: 'monthly'
    },
    'fetus-uzunluklari': {
        slug: 'fetus-uzunluklari',
        title: 'Fetus Uzunlukları Hesaplama | Prof Dr Metin Çiriş',
        description: 'Gebelik haftasına göre fetal ölçüm hesaplama aracı. Patoloji ve perinatoloji için.',
        keywords: 'fetus uzunluğu, fetal ölçüm, gebelik haftası, perinatal patoloji',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'monthly'
    },
    'rcb-calculator': {
        slug: 'rcb-calculator',
        title: 'RCB Hesaplayıcı - Residual Cancer Burden | Prof Dr Metin Çiriş',
        description: 'Meme kanseri neoadjuvan tedavi sonrası Residual Cancer Burden (RCB) hesaplama aracı.',
        keywords: 'RCB hesaplama, residual cancer burden, meme kanseri, neoadjuvan tedavi',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'monthly'
    },
    'gist-raporlama': {
        slug: 'gist-raporlama',
        title: 'GIST Raporlama Rehberi | Prof Dr Metin Çiriş',
        description: 'Gastrointestinal stromal tümör (GIST) patoloji raporlama kriterleri ve rehberi.',
        keywords: 'GIST, gastrointestinal stromal tümör, patoloji raporlama, GIST kriterleri',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'monthly'
    },
    makale: {
        slug: 'makale',
        title: 'Günün Patoloji Makalesi | Prof Dr Metin Çiriş',
        description: 'Her gün güncellenen PubMed patoloji makaleleri ve Türkçe özetler.',
        keywords: 'günün makalesi, patoloji literatür, PubMed, bilimsel makale',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'daily'
    },
    deprem: {
        slug: 'deprem',
        title: 'Isparta ve Türkiye Deprem Takibi | Prof Dr Metin Çiriş',
        description: 'Anlık deprem verileri, Isparta ve çevresi sismik aktivite takibi. AFAD verileriyle canlı sarsıntı analizi ve harita desteği.',
        keywords: 'deprem, Isparta deprem, sismik aktivite, AFAD deprem, son depremler, deprem haritası',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'hourly'
    },
    'svs-reader': {
        slug: 'svs-reader',
        title: 'SVS Sanal Mikroskopi | Prof Dr Metin Çiriş',
        description: 'Online SVS dosya görüntüleyici. Dijital patoloji ve sanal mikroskopi aracı.',
        keywords: 'SVS reader, sanal mikroskopi, dijital patoloji, WSI görüntüleyici',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'monthly'
    },
    'tani-tuzaklari': {
        slug: 'tani-tuzaklari',
        title: 'Patoloji Tanı Tuzakları | Prof Dr Metin Çiriş',
        description: 'Patolojide sık yapılan tanı hataları, pitfalls ve ayırıcı tanı ipuçları.',
        keywords: 'tanı tuzakları, patoloji pitfalls, ayırıcı tanı, tanı hataları',
        lastmod: '2026-07-16',
        priority: 0.9,
        changefreq: 'weekly'
    },
    'ayin-vakasi': {
        slug: 'ayin-vakasi',
        title: 'Ayın Patoloji Vakası | Prof Dr Metin Çiriş',
        description: 'Her ay güncellenen ilginç patoloji vakası ve sanal mikroskopi incelemesi.',
        keywords: 'ayın vakası, patoloji vaka, sanal mikroskopi, eğitim vakası',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'monthly'
    },
    'prizma-3d': {
        slug: 'prizma-3d',
        title: '3D Prizma - Makroskopi Aracı | Prof Dr Metin Çiriş',
        description: 'Patoloji makroskopi için 3 boyutlu görselleştirme ve örnekleme aracı.',
        keywords: '3D prizma, makroskopi, patoloji görselleştirme, 3 boyutlu',
        lastmod: '2026-07-16',
        priority: 0.6,
        changefreq: 'monthly'
    },
    'makale-takip': {
        slug: 'makale-takip',
        title: 'Patoloji Literatür Takibi | Prof Dr Metin Çiriş',
        description: 'Güncel patoloji literatürü ve yeni yayın takip sistemi.',
        keywords: 'literatür takip, patoloji yayınlar, yeni makaleler, bilimsel takip',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'daily'
    },
    'lenf-nodu': {
        slug: 'lenf-nodu',
        title: 'Lenf Nodu Sayacı | Prof Dr Metin Çiriş',
        description: 'Patoloji makroskopi için pratik lenf nodu sayım ve kayıt aracı.',
        keywords: 'lenf nodu sayacı, makroskopi, patoloji araç, lenf nodu sayımı',
        lastmod: '2026-07-16',
        priority: 0.6,
        changefreq: 'monthly'
    },
    finans: {
        slug: 'finans',
        title: 'Ekonomik Göstergeler & Finans Paneli | Prof Dr Metin Çiriş',
        description: 'Canlı döviz kurları (Dolar, Euro), altın fiyatları ve kripto piyasa verileri. Türkiye makro ekonomik göstergeleri ve anlık piyasa takibi.',
        keywords: 'ekonomik göstergeler, döviz kuru, enflasyon, faiz oranı, dolar tl, altın fiyatları, borsa',
        lastmod: '2026-07-16',
        priority: 0.6,
        changefreq: 'hourly'
    },
    'pubmed-trend': {
        slug: 'pubmed-trend',
        title: 'PubMed Trend Analizi | Prof Dr Metin Çiriş',
        description: 'Son 20 yılın PubMed yayın trendlerini analiz edin ve karşılaştırın.',
        keywords: 'PubMed trend, yayın analizi, bilimsel trend, literatür istatistik',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'weekly'
    },
    'online-test-analiz': {
        slug: 'online-test-analiz',
        title: 'Online Test Sınav Analizi | Prof Dr Metin Çiriş',
        description: 'Tarayıcı üzerinden hızlı ve güvenilir optik form analiz sistemi. DAT dosyalarınızı analiz edin.',
        keywords: 'online sınav analizi, test analizi, optik form, patoloji eğitim',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'monthly'
    },
    'euro-maclar': {
        slug: 'euro-maclar',
        title: 'Avrupa Kupaları Maç Takibi | Prof Dr Metin Çiriş',
        description: 'Basketbol EuroLeague, EuroCup ve Voleybol CEV Şampiyonlar Ligi sonuçları. Temsilcilerimizin Avrupa sahnesindeki maç programı ve canlı skorları.',
        keywords: 'avrupa kupaları, euroleague, basketbol, voleybol, türk takımları, maç takibi, fenerbahçe, anadolu efes, vakıfbank',
        lastmod: '2026-07-16',
        priority: 0.6,
        changefreq: 'daily'
    },
    'konsensus': {
        slug: 'konsensus',
        title: 'Patoloji Konsensus Toplantı Takibi | Prof Dr Metin Çiriş',
        description: 'Tıbbi patoloji konsensus toplantılarını canlı takip edin. Toplantı takvimi, Zoom erişim linkleri ve vaka tartışma arşivi.',
        keywords: 'patoloji konsensus, toplantı takibi, patoloji eğitim, online toplantı, patoloji vakaları',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'daily'
    },
    'pubmed-makale-takip': {
        slug: 'pubmed-makale-takip',
        title: 'PubMed Patoloji Günlük Makale Takibi | Prof Dr Metin Çiriş',
        description: 'Dünyaca ünlü patoloji dergilerinden en güncel makaleleri PubMed üzerinden takip edin. Günlük makale akışı, Türkçe özetler ve vaka takibi için profesyonel literatür aracı.',
        keywords: 'patoloji makale, PubMed takip, günlük patoloji, tıp literatürü, makale özetleri, patoloji yayınları',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'daily'
    },
    'avif-donusturucu': {
        slug: 'avif-donusturucu',
        title: 'AVIF Dönüştürücü | Prof Dr Metin Çiriş',
        description: 'Resimlerinizi modern AVIF formatına dönüştürerek kaliteden ödün vermeden dosya boyutlarını küçültün. Tamamen tarayıcı bazlı ve güvenli.',
        keywords: 'avif dönüştürücü, resim sıkıştırma, avif converter, kaliteli resim dönüştürme, online avif',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'monthly'
    },
    'sjogren-raporlama': {
        slug: 'sjogren-raporlama',
        title: 'Sjögren Raporlama Aracı | Prof Dr Metin Çiriş',
        description: 'Minör tükrük bezi biyopsileri için Sjögren sendromu raporlama kriterleri ve otomatik rapor oluşturucu.',
        keywords: 'sjögren raporlama, minör tükrük bezi, patoloji raporu, fokus skoru, sjögren sendromu',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'monthly'
    },
    'tiiab-raporlama': {
        slug: 'tiiab-raporlama',
        title: 'TİİAB Raporlama Aracı | Prof Dr Metin Çiriş',
        description: 'Tiroid ince iğne aspirasyon biyopsileri (TİİAB) için Bethesda 2023 kriterlerine uygun otomatik raporlama ve tanı destek aracı.',
        keywords: 'TİİAB raporlama, tiroid biyopsi, Bethesda 2023, patoloji raporu, tiroid ince iğne',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'monthly'
    },
    'endoskopi-raporlama': {
        slug: 'endoskopi-raporlama',
        title: 'Endoskopi Raporlama Aracı | Prof Dr Metin Çiriş',
        description: 'Gastrointestinal sistem endoskopik biyopsileri için standartlaştırılmış patoloji raporlama aracı.',
        keywords: 'endoskopi raporlama, mide biyopsisi, kolon biyopsisi, patoloji raporu, GİS patoloji',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'monthly'
    },
    'dunya-saatleri': {
        slug: 'dunya-saatleri',
        title: 'Dünya Saatleri | Prof Dr Metin Çiriş',
        description: 'Dünya saat dilimleri haritası ve toplantı zamanlama aracı. Avrupa ve Amerika şehirlerinin anlık saatleri, gece/gündüz görselleştirmesi.',
        keywords: 'dünya saatleri, saat dilimleri, toplantı planlama, timezone, world clock',
        lastmod: '2026-07-16',
        priority: 0.5,
        changefreq: 'monthly'
    },
    ngs: {
        slug: 'ngs',
        title: 'NGS Gen Arama Paneli | Prof Dr Metin Çiriş',
        description: 'Tıbbi patolojide kullanılan Pan-Kanser DNA Paneli ve RNA Füzyon Paneli gen kapsamı, mutasyon, TMB ve MSI dahil kapsamlı değerlendirme. Tümör tiplerine göre hedeflenebilir moleküler biyobelirteçler.',
        keywords: 'NGS gen paneli, patoloji NGS, kapsamlı genomik profilleme, RNA füzyon paneli, TMB, MSI',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'monthly'
    },
    'ngs-test-secimi': {
        slug: 'ngs-test-secimi',
        title: 'NGS Test Seçimi ve Örnek Gönderim Rehberi | Prof Dr Metin Çiriş',
        description: 'Moleküler patoloji laboratuvarına gönderilecek olan doku örneklerinin seçimi, preanalitik süreçleri ve test paneli endikasyonları hakkında rehber.',
        keywords: 'NGS test seçimi, örnek gönderimi, doku seçimi, fiksasyon süresi, preanalitik süreçler',
        lastmod: '2026-07-16',
        priority: 0.8,
        changefreq: 'monthly'
    },
    'patoloji-sozlugu': {
        slug: 'patoloji-sozlugu',
        title: 'Patoloji Sözlüğü ve Terim Açıklayıcı | Prof. Dr. Metin Çiriş',
        description: 'Patoloji raporunuzdaki tıbbi terimleri anlayın. Atipi, displazi, benign, malign gibi terimlerin açıklamaları ve otomatik rapor açıklayıcı araç.',
        keywords: 'patoloji sözlüğü, tıbbi terimler, patoloji raporu, hasta rehberi, atipi, benign, malign',
        lastmod: '2026-07-16',
        priority: 0.7,
        changefreq: 'monthly'
    },
    'vki-hesaplama': {
        slug: 'vki-hesaplama',
        title: 'Vücut Kitle İndeksi (VKİ) Hesaplama | Prof Dr Metin Çiriş',
        description: 'Boy ve kilo bilgilerinizi girerek Vücut Kitle İndeksinizi (VKİ) hesaplayın. İdeal kilo ve sağlık durumu değerlendirmesi.',
        keywords: 'vki hesaplama, vki, vücut kitle indeksi, ideal kilo hesaplama, obezite testi',
        lastmod: '2026-02-27',
        priority: 0.7,
        changefreq: 'monthly'
    },
    'testis-ght-ihk': {
        slug: 'testis-ght-ihk',
        title: 'Testis GHT İHK Uyum Yardımcısı | Prof Dr Metin Çiriş',
        description: 'Testis germ hücreli tümörlerinde İHK, serum markerları, yaş ve morfolojik ipuçlarına göre komponent profil uyumu ve kritik mimik uyarıları oluşturan statik yardımcı araç.',
        keywords: 'testis tümörü, germ hücreli tümör, immünohistokimya, seminom, embriyonel karsinom, yolk sac, koryokarsinom, patoloji',
        lastmod: '2026-06-05',
        priority: 0.8,
        changefreq: 'monthly'
    },
    'tiroid-papiller-karsinom': {
        slug: 'tiroid-papiller-karsinom',
        title: 'Tiroid Papiller Karsinom Rapor Oluşturucu | Prof Dr Metin Çiriş',
        description: 'Tiroid papiller karsinom vakaları için histopatolojik bulgulara dayalı, tümör odakları ve lenf nodu metastazı hesaplayıp raporlayan otomatik rapor oluşturucu.',
        keywords: 'tiroid kanseri, papiller karsinom, patoloji raporu, tiroid patolojisi, lenf nodu metastazı, tümör odağı',
        lastmod: '2026-06-12',
        priority: 0.8,
        changefreq: 'monthly'
    },

    'meme-her2': {
        slug: 'meme-her2',
        title: 'Meme Karsinomunda HER2 IHK Skorlama Algoritması | Prof Dr Metin Çiriş',
        description: 'Patologlar için adım adım HER2 IHK skorlama algoritması: HER2-null, ultralow, low, equivocal ve positive kategorileri. Eğitim ve raporlama destek aracı.',
        keywords: 'HER2 IHK, her2 skorlama, her2-low, her2-ultralow, meme kanseri, patoloji, immunohistokimya, ISH, refleks ISH',
        lastmod: '2026-07-06',
        priority: 0.8,
        changefreq: 'monthly'
    },
};

export const getPages = () => Object.values(PAGE_REGISTRY);
export const getPageBySlug = (slug: string) => Object.values(PAGE_REGISTRY).find(p => p.slug === slug);
export const getPageById = (id: string) => PAGE_REGISTRY[id];
