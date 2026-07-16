# Prof. Dr. Metin Çiriş | Tıbbi Patoloji Uzmanı

Bu proje, **[metinciris.com.tr](https://metinciris.com.tr)** için özel olarak geliştirilmiş modern, yüksek performanslı ve SPA (Single Page Application) tabanlı statik bir web uygulamasıdır. İçerisinde sadece genel bilgilendirmeler değil, patoloji profesyonelleri için tanısal ve pratik araçlar da barındırmaktadır.

## 🚀 Özellikler & Modüller

- **SPA ve Statik Üretim:** Özel build script'i ile `index.html` tabanlı, SEO uyumlu ve son derece hızlı istemci taraflı yönlendirme (React SPA).
- **Patoloji Başvuru Merkezi:** Tanısal ve moleküler patolojide sık başvurulan kılavuzların dijital merkezi.
- **PubMed Literatür Takibi (Radar):** NCBI E-utilities entegrasyonu ile otomatik makale taraması ve RSS oluşturma (`/patoloji-radari/rss.xml`).
- **NGS Gen Arama Paneli & Test Seçim Rehberi:** DNA/RNA füzyon panelleri interaktif arama motoru.
- **Raporlama Araçları:** GIST, TİİAB (Bethesda 2023), Sjögren ve Endoskopik biyopsiler için standart rapor oluşturucular.
- **Makroskopi & Klinik Yardımcılar:** Lenf nodu sayacı, RCB hesaplayıcı, VKİ hesaplayıcı, testit GHT marker profilleme aracı ve 3D Prizma.
- **Görüntü İşleme:** AVIF ve HEIC gibi modern resim formatlarını destekleyen tarayıcı içi dönüştürücü, SVS (WSI) görüntüleyici entegrasyonu.
- **Deprem Takip:** AFAD verilerini kullanan anlık deprem haritası.
- **Yerleşik Site İçi Arama:** Harici bir hizmete bağlı kalmadan (sadece `search-index.json` kullanarak) tamamen statik çalışan istemci taraflı arama sistemi.

## 🛠️ Teknolojiler

- **Core:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Radix UI, Vanilla CSS
- **İkon ve Animasyonlar:** Lucide React, Framer Motion
- **Görüntü İşleme ve Medya:** jsquash (tarayıcı içi), heic2any
- **RSS & Data:** Özel node scriptleri ile build-time index ve RSS (`generate-spa-pages.js`)

## 💻 Kurulum ve Geliştirme

Projeyi yerel ortamınızda çalıştırmak için:

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```

3. **Üretim (Production) Build Alın:**
   SPA sayfalarının `dist/` klasörüne kopyalanması, `search-index.json` ve `rss.xml` üretimlerinin tamamlanması için:
   ```bash
   npm run build
   ```

## 📂 Proje Yapısı

- `src/components`: Yeniden kullanılabilir UI bileşenleri (Navbar, Layout, SearchModal vb.).
- `src/pages`: Patoloji araçları, blog ve genel sayfalar (ReferenceCenter, NgsTestSecimi vb.).
- `src/core/data/registry.ts`: Tüm sayfa URL'leri, SEO meta bilgileri ve indeks konfigürasyonları.
- `scripts/`: Vite derlemesi bittikten sonra SPA fallback dosyalarını (404.html vb.) ve JSON/RSS endekslerini oluşturan otomasyon dosyaları.
- `public/`: Statik dosyalar, logolar ve patoloji kılavuz PDF'leri.

## 🔗 Bağlantılar

- **Canlı Web Sitesi:** [metinciris.com.tr](https://metinciris.com.tr)
- **Patoloji Başvuru Merkezi:** [metinciris.com.tr/basvuru-merkezi](https://metinciris.com.tr/basvuru-merkezi)
- **PubMed Literatür Radarı:** [metinciris.com.tr/makale-takip](https://metinciris.com.tr/makale-takip)
- **NGS Rehberi:** [metinciris.com.tr/ngs-test-secimi](https://metinciris.com.tr/ngs-test-secimi)

## 📄 Lisans

Tüm hakları saklıdır. Prof. Dr. İbrahim Metin Çiriş © 2026. Kişisel ve akademik kullanım için tasarlanmıştır.
