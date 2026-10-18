# Podcast hazır sesler — düşük yükte aşamalı üretim

Podcast'te **hazır MP3** varsa hemen oynatılır; yoksa **Ahenk Cep** ziyaretçinin
tarayıcısında ses üretir. Ses motoru seçimi ve tarayıcının alternatif TTS'si yoktur.
Google Sheets (`A1:F132`, `gid=1109640564`) tek veri kaynağıdır.

## Kademeli üretim

GitHub Actions `.github/workflows/podcast-audio.yml` Pazartesi, Çarşamba
ve Cuma **05:21 UTC**'de ve manuel `workflow_dispatch` ile çalışabilir.
Her çalışmada **en fazla 5 başlık** hazırlanır; farklı dergilerin eksik
kayıtlarına sırayla öncelik verilir. Böylece ilk 5 ile sınırlı kalınmaz:
güncel listedeki diğer başlıklar da haftalar içinde hazır hâle gelir.

Önce yalnız Python standart kütüphanesiyle Google Sheets ve manifest kontrol
edilir. Eksik veya 90 günü geçmiş kayıt yoksa **PyTorch/ONNX/model indirilmez**,
GitHub commit'i ve GitHub Pages dağıtımı yapılmaz. Eksik dosyalar yenileme
gerektiren seslerden önce işlenir. Eski fakat hâlâ listede bulunan MP3,
yenisi hazır olana kadar kullanılmaya devam eder.

## Saklama ve güvenlik

- Başlığı değişmeyen, geçerli MP3 tekrar üretilmez.
- 90 günü geçen sesler en fazla 5'lik partilerle **yenilenir**.
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
