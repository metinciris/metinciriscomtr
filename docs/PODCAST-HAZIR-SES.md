# Podcast hazır sesler — günlük EMA Lightning üretimi

Podcast'te **hazır MP3** varsa hemen oynatılır; eksikse ziyaretçinin tarayıcısındaki **Ahenk Cep** mevcut yedek motor olarak kalır. **GitHub Actions'ın sunucu tarafında ürettiği yeni MP3'lerin motoru EMA Lightning'dir.** Bu ayrım bilinçlidir: Windows Podcast Ahenk uygulamasının kurulu varsayılanı ve ziyaretçi tarayıcısı değiştirilmez.

Google Sheets (`A1:F132`, `gid=1109640564`) tek makale kaynağıdır.

## Günlük üretim

GitHub Actions: `.github/workflows/podcast-audio.yml`

- Her gün **02:21 UTC / 05:21 Türkiye saati** çalışır (Türkiye UTC+3).
- Bir seferde **en fazla 24 başlık** üretir. 12 derginin ses kapsamını dengeleyen sıra korunur.
- Girdi taraması, model kurulmadan yapılır; eksik veya yenilenmesi gereken kayıt yoksa PyTorch/EMA indirilmez.
- Model: `ema-lightning==1.1.2`, `EMA(device="cpu")`, sabit `seed=0`; GitHub-hosted Ubuntu'da GPU bulunmadığından WebGPU demosundaki GPU hızını beklemeyin.
- CPU bağımlılıkları `scripts/podcast-ema-requirements.txt` içindedir.
- Yeni klipler `public/podcast-audio/manifest.json` üzerinden mevcut site oynatıcısında değişiklik gerektirmeden sunulur.
- Mevcut Ahenk Cep sesleri, EMA kaydı tamamlanıncaya kadar çalınmaya devam eder. Model sürümü fingerprint'e dahil olduğu için başlıklar **kademeli** yenilenir; hepsi aynı anda zorla silinmez.
- 150 günü geçen fakat hâlâ listede olan MP3, yenisi sentezleninceye kadar korunur.
- Sentez veya Google Sheets doğrulaması başarısız olursa mevcut manifest ve MP3 dosyaları değiştirilmez. Siteye yalnız başarılı üretimlerin commit'i ve dağıtımı yapılır.
- H&E, p53, Ewing gibi terimler için kayıtlı telaffuz ve kişisel okuma hızı düzeltmeleri kullanılır.

## Çalıştırma ve doğrulama

GitHub → Actions → **Podcast - EMA Lightning gunluk sesler** → **Run workflow**.
Daha sonra günlük zamanlama otomatik ilerler. Üretim özetinde `ready/total`, `missing`, `refresh`, seçilen parti görünür. Üretimden sonra yeni MP3'ler GitHub'a kaydedilir ve Pages yapısı yeniden yayımlanır.

**Not:** GitHub tarafındaki program normal bir CPU Python çalışmasıdır. Hugging Face WebGPU demosuna API üzerinden bağlanılmaz. EMA'nın GPU karşılaştırmalarındaki 440x hız bu koşulda garanti değildir.

## Saklama ve güvenlik

- Google Sheets eksik veya bozuk yanıt verirse herhangi bir silme yapılmaz.
- Geçersiz MP3 veya başarısız toplu üretim eski kayıtları bozamaz.
- 150 günlük yenileme politikası, mevcut dosya kimlikleri ve PubMed bağlantıları değişmez.
- Windows'ta saat 12:30'da çalışan Podcast Ahenk görevine dokunulmaz. Aynı dosyaları eş zamanlı yayımlamayı önlemek için yeni sesler önce GitHub'da aranır.
- EMA modeli ve kodu: https://github.com/canberk7/ema-lightning (Apache-2.0); Türkçe normalizasyon motoru: normalizer-tr.

