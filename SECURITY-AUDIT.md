# Güvenlik İnceleme Raporu (Security Audit Report)

**Proje:** Metin Çiriş Web Sitesi (`metinciriscomtr`)  
**Tarih:** 22 Temmuz 2026  
**Kapsam:** Pasif Kod ve Yapılandırma Güvenlik Analizi  
**Yöntem:** Dinamik exploit çalıştırmadan, tamamen statik kod analizi, bağımlılık denetimi ve mimari güvenlik değerlendirmesi.

---

## Özet Tablo

| Kimlik | Önem | Durum | Bileşen | Kısa açıklama |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | High | Confirmed | `src/pages/Konsensus.tsx` | Supabase oturumu olan tüm kullanıcıların istemci tarafında admin kabul edilmesi |
| **SEC-002** | High | Confirmed | `src/lib/supabase.ts`, `Konsensus.tsx` | Toplantı listesi çekilirken `select('*')` ile Zoom şifresi ve yetkili alanların public istemciye iletilmesi |
| **SEC-003** | Medium | Configuration verification required | `Supabase RLS & Edge Functions` | Backend RLS ve Edge Function kimlik doğrulama politikalarının repoda bulunmaması |
| **SEC-004** | High | Confirmed | `package.json` (DOMPurify, Lodash, Vite vb.) | Bağımlılıklarda bilinen yüksek ve orta önemde güvenlik açıkları |
| **SEC-005** | Medium | Confirmed | `src/pages/Blog.tsx` | DOMPurify sanitization işleminin ReactMarkdown / rehype-raw öncesi yapılması ve güncel olmayan sanitizer |
| **SEC-006** | Medium | Confirmed | `src/pages/OgrenciYemek.tsx`, `HastaneYemek.tsx` | Google Forms harici oy endpoint'inde yetkilendirme olmaması ve istemci taraflı cooldown aşımı |
| **SEC-007** | Low | Hardening | `package.json` | Bağımlılıklarda jenerik/joker (`*`) sürüm kullanımı |
| **SEC-008** | Low | Hardening | `.github/workflows/*.yml` | GitHub Actions adımlarında tag kullanımı ve SHA sabitlemesi eksikliği |
| **SEC-009** | Low | Hardening | `vercel.json`, `index.html` | Platformlar arasında Content-Security-Policy (CSP) uyumsuzluğu ve eksiklikleri |
| **SEC-010** | Informational | Confirmed | `.env`, `src/services/pushService.ts` | `VITE_` takılı çevre değişkenlerinin istemci paketine açık şekilde dahil olması |
| **SEC-011** | Informational | Hardening | `src/pages/SvsReader.tsx` | CDN üzerinden harici JS kütüphaneleri (OpenSeadragon, GeoTIFF) yüklenmesi ve SRI eksikliği |

---

## Ayrıntılı Güvenlik Bulguları

### SEC-001: Supabase Oturumu Açan Tüm Kullanıcıların Admin Kabul Edilmesi

* **Kimlik:** SEC-001
* **Önem:** High
* **Durum:** Confirmed
* **Dosya ve satır:** [Konsensus.tsx](file:///c:/yenisitem/src/pages/Konsensus.tsx#L93-L111)
* **İlgili kod:**
  ```typescript
  const check = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!alive) return;
    setIsAdmin(!!session);
    setAuthLoading(false);
  };
  ```
* **Saldırganın ihtiyaç duyduğu erişim:** Herhangi bir Supabase hesabı oluşturabilen veya geçerli bir Supabase oturumuna sahip kullanıcı.
* **Olası etki:** Supabase projesinde public kullanıcı kaydı (signup) açık ise, kayıt olan her kullanıcı ön arayüzde admin paneline erişir ve toplantı ekleme/silme/düzenleme butonlarını görür. Supabase RLS politikaları da sadece `auth.role() = 'authenticated'` kontrolü yapıyorsa veritabanındaki toplantı verilerini değiştirebilir/silebilir.
* **Mevcut korumalar:** `AdminPanel.tsx` içerisinde basit bir 3 tık "fare doğrulaması" (client-side captcha mantığı) vardır ancak bu sadece UI form açılışını geciktirir, oturum durumunu engellemez.
* **Kesin düzeltme:** `isAdmin` kontrolü sadece `!!session` ile değil, kullanıcının e-posta adresi (allowlist), Supabase `app_metadata.role === 'admin'` veya kullanıcının UID'sinin sabit admin UID ile eşleşmesi ile doğrulanmalıdır:
  ```typescript
  const ADMIN_UID = import.meta.env.VITE_ADMIN_UID;
  setIsAdmin(session?.user?.id === ADMIN_UID);
  ```
* **Düzeltmenin yan etkileri:** Yalnızca tanımlı admin kullanıcısı yönetim arayüzünü kullanabilir.
* **Regresyon testi:** Admin e-postası dışında yeni bir Supabase hesabı ile giriş yapıldığında admin yetkilerinin verilmediği doğrulanmalıdır.

---

### SEC-002: Hassas Verilerin (`zoom_password`) Public İstemciye Açılması

* **Kimlik:** SEC-002
* **Önem:** High
* **Durum:** Confirmed
* **Dosya ve satır:** [Konsensus.tsx](file:///c:/yenisitem/src/pages/Konsensus.tsx#L118-L123), [supabase.ts](file:///c:/yenisitem/src/lib/supabase.ts#L11-L25)
* **İlgili kod:**
  ```typescript
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('date', { ascending: true });
  ```
* **Saldırganın ihtiyaç duyduğu erişim:** Herhangi bir kimlik doğrulamasız anonim web ziyaretçisi.
* **Olası etki:** `meetings` tablosundaki tüm sütunlar (`zoom_password`, `zoom_id`, `zoom_link` dahil) public API isteğiyle çekilmektedir. Özel toplantı şifreleri veya hassas alanlar yetkisiz kişilerin eline geçebilir.
* **Mevcut korumalar:** Yok (Tüm alanlar `select('*')` ile çekilmektedir).
* **Kesin düzeltme:** Public sorgularda `zoom_password` sütunu çekilmemeli veya hassas bilgiler ayrı bir korumalı tabloda/view'da tutulmalıdır. İstemci tarafında varsayılan okumada sütunlar açıkça listelenmelidir:
  ```typescript
  await supabase
    .from('meetings')
    .select('id, title, organizer, date, time, duration, description, poster_url, zoom_link, zoom_id');
  ```
* **Düzeltmenin yan etkileri:** `zoom_password` alanı public listelemede gelmeyecektir.
* **Regresyon testi:** Anonim kullanıcı ağ isteklerini incelediğinde `zoom_password` yanıtında görülmemelidir.

---

### SEC-003: Supabase RLS ve Edge Function Politikalarının Doğrulama Gereksinimi

* **Kimlik:** SEC-003
* **Önem:** Medium
* **Durum:** Configuration verification required
* **Dosya ve satır:** [src/lib/supabase.ts](file:///c:/yenisitem/src/lib/supabase.ts), [src/services/pushService.ts](file:///c:/yenisitem/src/services/pushService.ts#L4-L61)
* **İlgili kod:**
  ```typescript
  const SAVE_SUB_URL = import.meta.env.VITE_SAVE_SUB_URL || '';
  const SEND_PUSH_URL = import.meta.env.VITE_SEND_PUSH_URL || '';
  ```
* **Saldırganın ihtiyaç duyduğu erişim:** Anonim web kullanıcısı veya API istemcisi.
* **Olası etki:**
  1. Supabase veritabanındaki RLS (Row Level Security) politikaları kod reposunda yer almamaktadır. Eğer RLS kapatılmışsa veya `anon` role INSERT/UPDATE/DELETE izni verilmişse, herkes veritabanını değiştirebilir.
  2. `SEND_PUSH_URL` (Push bildirim gönderme Edge Function'ı) kimlik doğrulaması ve yetki kontrolü yapmıyorsa, harici bir kişi bu endpoint'e istek atarak tüm abonelere sahte/spam push bildirimi gönderebilir.
* **Mevcut korumalar:** Bilinmiyor (Backend yapılandırması repository dışında Supabase Dashboard üzerindedir).
* **Kesin düzeltme:**
  1. `meetings` tablosu için RLS aktif edilmeli: Anonim/Public sadece `SELECT` yapabilmeli; `INSERT`, `UPDATE`, `DELETE` sadece Admin UID'sine kısıtlanmalıdır.
  2. `send-notification` Edge Function endpoint'inde `Authorization: Bearer <ADMIN_SERVICE_KEY/JWT>` doğrulaması zorunlu kılınmalıdır.
* **Düzeltmenin yan etkileri:** Yetkisiz API istekleri 401/403 hatası alacaktır.
* **Regresyon testi:** Anonim istemciden yapılan `insert` veya `send-notification` isteklerinin reddedildiği doğrulanmalıdır.

---

### SEC-004: Üçüncü Taraf Bağımlılıklarda Bilinen Güvenlik Açıkları

* **Kimlik:** SEC-004
* **Önem:** High
* **Durum:** Confirmed
* **Dosya ve satır:** [package.json](file:///c:/yenisitem/package.json#L7-L48)
* **İlgili kod:**
  ```json
  "dompurify": "^3.3.0",
  "vite": "^6.4.1",
  "sharp": "^0.34.5"
  ```
* **Saldırganın ihtiyaç duyduğu erişim:** Bağımlılıklardaki ilgili zafiyete göre değişir (Örn. XSS için zararlı Markdown/HTML girdisi).
* **Olası etki:** `npm audit` çıktısına göre:
  * `dompurify` (<=3.4.11): Prototype pollution, mXSS ve sanitization bypass zafiyetleri (GHSA-v2wj-7wpq-c8vv, GHSA-cjmm-f4jc-qw8r vb.).
  * `lodash` (<=4.17.23): Code injection ve prototype pollution.
  * `vite` (<=6.4.2): Geliştirme sunucusunda path traversal ve keyfi dosya okuma.
  * `sharp` (<0.35.0): `libvips` kaynaklı bellek zafiyetleri.
* **Mevcut korumalar:** Yok. Paket sürümleri geride kalmıştır.
* **Kesin düzeltme:** Güvenli minör/yamalı sürümlere güncelleme yapılmalıdır (`npm update dompurify vite lodash sharp`). Kırıcı değişiklik olmaması için majör sürümler dikkatle test edilmelidir.
* **Düzeltmenin yan etkileri:** Bazı paket güncellemeleri derleme veya test aşamasında uyumluluk kontrolleri gerektirebilir.
* **Regresyon testi:** `npm audit --omit=dev` çalıştırılarak üretim paketlerinde 0 yüksek/orta derece zafiyet kaldığı doğrulanmalıdır.

---

### SEC-005: HTML/Markdown Temizleme (Sanitization) Mantığı ve Paket Sürümü

* **Kimlik:** SEC-005
* **Önem:** Medium
* **Durum:** Confirmed
* **Dosya ve satır:** [src/pages/Blog.tsx](file:///c:/yenisitem/src/pages/Blog.tsx#L815-L921)
* **İlgili kod:**
  ```typescript
  const sanitizedBody = useMemo(
    () => DOMPurify.sanitize(post.body.replace(/\r\n/g, '\n')),
    [post.body],
  );
  // ...
  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
    {sanitizedBody}
  </ReactMarkdown>
  ```
* **Saldırganın ihtiyaç duyduğu erişim:** GitHub Issue oluşturabilen veya blog içeriği yazabilen yetkili/yetkisiz kullanıcı.
* **Olası etki:** Ham Markdown dizesi DOMPurify ile temizlendikten sonra `ReactMarkdown` ve `rehypeRaw`'a aktarılmaktadır. HTML ayrıştırması DOMPurify temizliğinden **sonra** yapıldığı için, rehype-raw aşamasında yeniden oluşturulan düğümler mXSS (mutation XSS) riskine yol açabilir. Ayrıca DOMPurify paket sürümü zafiyet barındırmaktadır.
* **Mevcut korumalar:** `DOMPurify.sanitize` çağrısı yapılmaktadır.
* **Kesin düzeltme:**
  1. `dompurify` paketi en son güvenli sürüme güncellenmelidir.
  2. HTML sanitization işlemi Markdown AST ayrıştırmasından sonra `rehype-sanitize` eklentisi ile yapılmalı veya DOMPurify doğrudan HTML düğümlerine uygulanmalıdır:
     ```typescript
     import rehypeSanitize from 'rehype-sanitize';
     <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
       {post.body}
     </ReactMarkdown>
     ```
* **Düzeltmenin yan etkileri:** İzin verilmeyen güvenli olmayan HTML etiketleri/öznitelikleri blog yazılarında filtrelenir.
* **Regresyon testi:** Blog yazılarındaki güvenli HTML yapı formatlarının düzgün görüntülendiği denetlenmelidir.

---

### SEC-006: Google Forms Yemek Oy Endpoint'inde Yetkilendirme ve Hız Sınırı Eksikliği

* **Kimlik:** SEC-006
* **Önem:** Medium
* **Durum:** Confirmed
* **Dosya ve satır:** [OgrenciYemek.tsx](file:///c:/yenisitem/src/pages/OgrenciYemek.tsx#L168-L217), `HastaneYemek.tsx`
* **İlgili kod:**
  ```typescript
  const lastVote = cooldown[type] || 0;
  // ...
  await fetch(FORM_URL, {
    method: 'POST',
    body: formData,
    mode: 'no-cors'
  });
  ```
* **Saldırganın ihtiyaç duyduğu erişim:** Anonim istemci.
* **Olası etki:** Oy kullanma kısıtlaması (10 dakika) yalnızca istemci tarafında `localStorage` ile tutulmaktadır. Kullanıcı `localStorage` verisini silerek veya cURL/Postman ile doğrudan Google Form URL'ine İstek atarak binlerce sahte oy gönderebilir, yemek derecelendirme istatistiklerini manipüle edebilir.
* **Mevcut korumalar:** `localStorage` tabanlı istemci kontrolü (`yemek_cooldown`).
* **Gizlilik Değerlendirmesi:** Google Sheet / Form public bağlantısı kullanıcının kişisel Gmail hesabına veya yetkilerine erişim **vermez**. Ancak form yanıt endpoint'i herkese açıktır.
* **Kesin düzeltme:** Hassas derecelendirmeler için bir backend API / Cloudflare Worker / Cloud Function üzerinden Rate Limiting (IP tabanlı hız sınırı) veya CAPTCHA doğrulaması uygulanmalıdır.
* **Düzeltmenin yan etkileri:** Doğrudan Google Form yerine ara bir yetkili endpoint gerektirir.
* **Regresyon testi:** Ardışık oy kullanma denemelerinin sunucu tarafında engellendiği doğrulanmalıdır.

---

### SEC-007: Bağımlılıklarda Joker (`*`) Sürüm Belirteçleri

* **Kimlik:** SEC-007
* **Önem:** Low
* **Durum:** Hardening
* **Dosya ve satır:** [package.json](file:///c:/yenisitem/package.json#L16-L30)
* **İlgili kod:**
  ```json
  "clsx": "*",
  "motion": "*",
  "tailwind-merge": "*"
  ```
* **Saldırganın ihtiyaç duyduğu erişim:** Supply-chain / Paket deposu (npm registry).
* **Olası etki:** `*` kullanımı, `npm install` sırasında ilgili paketin yayınlanmış en son majör sürümünün çekilmesine neden olur. Bu durum, uyumsuz kırıcı değişikliklerin (breaking changes) veya zararlı yeni paket sürümlerinin projeye otomatik olarak girmesine yol açabilir.
* **Mevcut korumalar:** `package-lock.json` kilit dosyası mevcuttur.
* **Kesin düzeltme:** Joker sürümler spesifik sabit/semver sürümlerle değiştirilmelidir (ör. `"clsx": "^2.1.1"`).
* **Düzeltmenin yan etkileri:** Yok.
* **Regresyon testi:** `npm ci` komutunun sorunsuz çalıştığı teyit edilmelidir.

---

### SEC-008: GitHub Actions Sürümlerinin Tag ile Sabitlenmesi

* **Kimlik:** SEC-008
* **Önem:** Low
* **Durum:** Hardening
* **Dosya ve satır:** [.github/workflows/deploy.yml](file:///c:/yenisitem/.github/workflows/deploy.yml#L42-L95), `update-euro-data.yml`
* **İlgili kod:**
  ```yaml
  uses: actions/checkout@v4
  uses: actions/setup-node@v4
  ```
* **Saldırganın ihtiyaç duyduğu erişim:** Üçüncü taraf GitHub Action deposunu ele geçiren saldırgan.
* **Olası etki:** `v4` gibi mutable tag'ler (değiştirilebilir etiketler), eylem deposunda tag kaydırılırsa zararlı kod çalıştırılmasına zemin hazırlayabilir (Supply chain attack).
* **Mevcut korumalar:** `permissions` minimum yetki ilkesine uygun tanımlanmıştır.
* **Kesin düzeltme:** Kritik CI/CD eylemleri tam commit SHA ile sabitlenmelidir:
  ```yaml
  uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
  ```
* **Düzeltmenin yan etkileri:** Güncellemeler manuel SHA takibi gerektirir (Dependabot otomatik yönetebilir).
* **Regresyon testi:** Workflow derleme adımlarının başarıyla çalıştığı doğrulanmalıdır.

---

### SEC-009: Güvenlik Başlıklarında (Security Headers) CSP Eksikliği ve Uyumsuzluğu

* **Kimlik:** SEC-009
* **Önem:** Low
* **Durum:** Hardening
* **Dosya ve satır:** [netlify.toml](file:///c:/yenisitem/netlify.toml#L12), [vercel.json](file:///c:/yenisitem/vercel.json#L8-L37)
* **İlgili kod:**
  `netlify.toml` içerisinde katı CSP varken, `vercel.json` içerisinde Content-Security-Policy başlığı yer almamaktadır.
* **Saldırganın ihtiyaç duyduğu erişim:** İstemci tarafında kod enjekte etmeye çalışan saldırgan.
* **Olası etki:** Vercel veya alternatif bir platformda yayına alındığında varsayılan olarak CSP koruması bulunmayacaktır. Ayrıca Netlify üzerindeki mevcut CSP'de `'unsafe-inline'` kullanılmaktadır.
* **Mevcut korumalar:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` tanımlıdır.
* **Kesin düzeltme:**
  1. `vercel.json` dosyasına da CSP başlığı eklenmelidir.
  2. CSP başlığı öncelikle `Content-Security-Policy-Report-Only` modunda test edilerek tüm harici kaynaklar (Google Fonts, Supabase, GitHub API, PubMed) doğrulanmalıdır.
* **Düzeltmenin yan etkileri:** Dış servislerin engellenmesi durumunda arayüz bileşenleri yüklenemeyebilir.
* **Regresyon testi:** Tarayıcı konsolunda CSP ihlal uyarısı (violation report) olmamalıdır.

---

### SEC-010: İstemci Çevre Değişkenlerinin (`VITE_*`) İncelemesi ve Sınıflandırılması

* **Kimlik:** SEC-010
* **Önem:** Informational
* **Durum:** Confirmed
* **Dosya ve satır:** [.env](file:///c:/yenisitem/.env#L1-L12)
* **İlgili kod:**
  ```env
  VITE_GITHUB_REPO_OWNER=metinciris
  VITE_GITHUB_REPO_NAME=metinciriscomtr
  VITE_API_RATE_LIMIT=60
  VITE_PUBMED_API_KEY=92f...
  VITE_SUPABASE_URL=https://anawjzyrgxtfxqzczwwm.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbG...
  VITE_VAPID_PUBLIC_KEY=BGVL...
  VITE_SAVE_SUB_URL=https://anawjzyrgxtfxqzczwwm.functions.supabase.co/save-subscription
  VITE_SEND_PUSH_URL=https://anawjzyrgxtfxqzczwwm.functions.supabase.co/send-notification
  ```
* **İnceleme ve Gruplandırma:**

1. **Public Olması Normal Değişkenler:**
   * `VITE_GITHUB_REPO_OWNER`, `VITE_GITHUB_REPO_NAME`, `VITE_API_RATE_LIMIT`: Genel yapılandırma değerleridir, gizlilik riski taşımaz.
   * `VITE_VAPID_PUBLIC_KEY`: Push bildirimleri için açık anahtardır (Public Key), client'ta bulunması standarttır.

2. **Public Olabilir Ancak Backend/RLS İle Korunmalı Değişkenler:**
   * `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Supabase istemci mimarisinin parçasıdır. Anonim key client'ta bulunabilir; ancak veritabanı RLS politikaları ile korunmalıdır.
   * `VITE_SAVE_SUB_URL` & `VITE_SEND_PUSH_URL`: Edge Function URL'leridir. İstemcide bulunur ancak backend tarafında kimlik doğrulama gerektirmelidir.

3. **Kesinlikle Client Tarafında Bulunmamalı:**
   * `VITE_PUBMED_API_KEY`: PubMed API anahtarı istemci JavaScript paketine dahil edilmiştir. Kötü niyetli kişilerce alınıp kota tüketilebilir. İdeal olarak GitHub Actions build aşamasında veya proxy üzerinden kullanılmalıdır.

4. **Kullanılmayan Değişkenler:**
   * İnceleme sonucunda tüm tanımlı değişkenlerin referansı mevcuttur.

---

### SEC-011: SVS Okuyucuda Harici CDN Kütüphane Yüklemesi (SRI Eksikliği)

* **Kimlik:** SEC-011
* **Önem:** Informational
* **Durum:** Hardening
* **Dosya ve satır:** [src/pages/SvsReader.tsx](file:///c:/yenisitem/src/pages/SvsReader.tsx#L80-L87)
* **İlgili kod:**
  ```typescript
  await loadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/openseadragon.min.js',
    'openseadragon-script'
  );
  ```
* **Saldırganın ihtiyaç duyduğu erişim:** CDN sunucusuna veya DNS yönlendirmesine müdahale eden saldırgan.
* **Olası etki:** Harici CDN'lerden dinamik olarak yüklenen JavaScript dosyalarında Subresource Integrity (`integrity="sha384-..."`) özniteliği bulunmamaktadır. CDN hacklenirse istemcide zararlı kod çalışabilir.
* **Mevcut korumalar:** Güvenilir CDN'ler (cdnjs, jsdelivr) kullanılmaktadır.
* **Kesin düzeltme:** İlgili kütüphaneler npm paketi olarak projeye dahil edilmeli veya `integrity` hash kontrolü eklenmelidir.
* **Düzeltmenin yan etkileri:** Yok.
* **Regresyon testi:** SVS görüntüleyicinin slaytları sorunsuz açtığı doğrulanmalıdır.

---

## Önerilen Eylem Planı ve Öncelik Listesi

### 1. Hemen Düzeltilmesi Gerekenler (Kritik & Yüksek Öncelik)
1. **Supabase Yönetici Yetkilendirmesi (SEC-001):** `Konsensus.tsx` içerisinde `setIsAdmin(!!session)` mantığını değiştirip sabit Admin UID veya yetkili e-posta kontrolü eklemek.
2. **Supabase Hassas Veri Sızıntısı (SEC-002):** `fetchMeetings` fonksiyonunda `select('*')` yerine açık sütun isimleri belirtilerek `zoom_password` verisini anonim listeden çıkarmak.
3. **Güvenlik Yamaları (SEC-004):** `dompurify`, `lodash`, `vite`, `sharp` paketlerini yamalanmış güvenli sürümlerine güncellemek.

### 2. Bir Ay İçinde Yapılması Gerekenler (Orta Öncelik)
1. **Supabase RLS & Edge Function Kontrolü (SEC-003):** Supabase Dashboard üzerinden `meetings` tablosunun RLS politikalarını doğrulamak ve `send-notification` Edge Function'ına yetki kontrolü eklemek.
2. **Blog Sanitization Mimarisi (SEC-005):** `rehype-sanitize` eklentisini ekleyerek HTML temizleme işlemini Markdown AST pipeline'ına taşımak.
3. **Yemek Oylama Endpoint Güvenliği (SEC-006):** Google Form oy endpoint'ine sunucu taraflı hız sınırı/CAPTCHA koruması planlamak.
4. **Bağımlılık Sürüm Sabitlemesi (SEC-007):** `package.json` içindeki `*` sürümlerini spesifik majör/minör sürümlere sabitlemek.

### 3. İsteğe Bağlı Güvenlik Sertleştirmeleri (Düşük & İnfosal)
1. **GitHub Actions SHA Sabitlemesi (SEC-008):** Workflow eylemlerini tam commit SHA değerleri ile sabitlemek.
2. **CSP Başlıklarının Eşitlenmesi (SEC-009):** `vercel.json` ve `netlify.toml` yapılandırmalarında CSP kurallarını raporlama modunda test edip tam uyumlu hale getirmek.
3. **PubMed API Key İzolasyonu (SEC-010):** PubMed isteklerini istemciden doğrudan atmak yerine build-time statik veri üretimine veya proxy'ye kaydırmak.
4. **CDN SRI Eklenmesi (SEC-011):** Harici script yüklemelerine Subresource Integrity hash'leri eklemek veya npm bağımlılığına dönüştürmek.

---

## Kalan Riskler ve İnceleme Sınırları

* **Backend ve Veritabanı Yapılandırması:** Supabase veritabanı RLS (Row Level Security) SQL politikaları, PostgreSQL yetki rolleri ve Supabase Edge Functions kaynak kodları bu depoda yer almadığı için canlı sunucu tarafındaki politikalar kesin olarak doğrulanamamıştır.
* **Google Hizmet Yönetimi:** Kullanılan Google Sheet ve Google Form bağlantılarının Google Cloud / Workspace konsolundaki paylaşım ayarları pasif kod incelemesiyle doğrulanamaz.
* **Canlı HTTP Başlıkları:** Üretim ortamındaki (Cloudflare, Netlify, Vercel) canlı HTTP yanıt başlıkları aktif ağ istekleriyle taranmamış, sadece repository içerisindeki statik konfigürasyon dosyaları (`netlify.toml`, `vercel.json`, `index.html`) incelenmiştir.

---
*Rapor Sonu.*
