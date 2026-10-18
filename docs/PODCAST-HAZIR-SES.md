# Podcast hazır sesler — düşük yükte aşamalı üretim

Podcast'te **hazır MP3** varsa hemen oynatılır; yoksa **Ahenk Cep** ziyaretçinin
tarayıcısında ses üretir. Ses motoru seçimi ve tarayıcının alternatif TTS'si yoktur.
Google Sheets (`A1:F132`, `gid=1109640564`) tek veri kaynağıdır.

## Kademeli üretim

GitHub Actions `.github/workflows/podcast-audio.yml` Pazartesi, Çarşamba
ve Cuma **05:21 UTC**'de ve manuel `workflow_dispatch` ile çalışabilir.
Her çalışmada **en fazla 8 başlık** hazırlanır; 12 derginin
hazır ses kapsamı dengelenerek eksik kayıtlara öncelik verilir. Böylece ilk 5 ile sınırlı kalınmaz:
güncel listedeki diğer başlıklar da haftalar içinde hazır hâle gelir.

Önce yalnız Python standart kütüphanesiyle Google Sheets ve manifest kontrol
edilir. Eksik veya 150 günü geçmiş kayıt yoksa **PyTorch/ONNX/model indirilmez**,
GitHub commit'i ve GitHub Pages dağıtımı yapılmaz. Eksik dosyalar yenileme
gerektiren seslerden önce işlenir. Eski fakat hâlâ listede bulunan MP3,
yenisi hazır olana kadar kullanılmaya devam eder.

## Saklama ve güvenlik

- Başlığı değişmeyen ve 150 günden genç geçerli MP3 tekrar üretilmez.
- 150 günü geçen sesler en fazla 8'lik partilerle **yenilenir**;
  150. günde doğrudan silinmez.
- Google Sheets'ten çıkan makalelerin sesleri ve sahipsiz dosyalar, ancak
  kaynak başarıyla kontrol edildikten ve yeni seçilen sesler üretildikten
  sonra silinir.
- Google Sheets okunamaz veya şüpheli biçimde eksik gelirse kayıtlar korunur.
- Üretim sırasında tek bir hata dahi oluşursa canlı manifest ve eski
  dosyalar değiştirilmez.
- Yalnızca değişiklik olduğunda GitHub'a commit ve GitHub Pages yayını yapılır.

Ahenk Cep CPU, nötr üslup, 16 adım kullanılır; H&E, Ewing, p53 gibi
seslendirme düzeltmeleri `scripts/render_podcast_audio.py` içinde
`src/lib/ahenkPronunciation.ts` ile eş tutulur. Telif ve atıflar:
`docs/PODCAST-AHENK-CEP.md`.

### Sorun giderme
GitHub Actions: `Podcast - Ahenk Cep hazir sesler`
- Başta `ready/total`, seçilen parti ve temizlenecek kayıtların sayısı görünür.
- Dosya eşleştirme başlık + normalleştirilmiş PMID ile yapılır
  (`42874744.0` → `42874744`).
- Yayınlanmış ses sayısı `public/podcast-audio/manifest.json` içindeki
  `entries` uzunluğudur.
- İlk 5 dahil bütün mevcut sesler korunarak yenileri eklenir.

### Kapasite ve dergi temposu (18 Ekim 2026)

Google Sheets `translate!A1:F132`: **12 dergi × 10 başlık = 120 makale**.
Hazır arşivin üst sınırı yaklaşık 120 kısa MP3 dosyasıdır; listedeki
makaleler zamanla değişir. Bazı dergilerde 10 makale 1–2 haftaya, diğerlerinde
2–3 aya yayılabilir. Bu yüzden 8 MP3 × 3 gün = haftada **en fazla 24 kayıt**
ile küçük ama daha kapsayıcı partiler kullanılır. Liste hiç değişmese mevcut
120 başlığa yaklaşık 5 haftada ulaşılabilir; gerçek hız yeni eklenen makalelere
bağlıdır.

150 gün sonrasında ses **yeniden sentezleme sırasına** girer; dergide hâlâ
listeleniyorsa beklerken mevcut MP3 kullanılmaya devam edilir.
Artık listede olmayan başlığın MP3'ü, güvenli kaynak kontrolünden sonra silinir.
Dergiler arasında adil sıra için her bir derginin hazır MP3 sayısı dikkate alınır.
