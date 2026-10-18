# Podcast hazır ses pilotu

Podcast sayfasında önce hazır MP3 denenir. Ses yoksa Ahenk Cep tarayıcıda üretir; o da olmazsa tarayıcı sesi kullanılır.

Kaynak, sitede kullanılan aynı Google Sheets (A1:F132 / gid=1109640564) tablosudur.
İlk 5 makale başlığı seçilir. `scripts/render_podcast_audio.py` ve
`.github/workflows/podcast-audio.yml` her gün 05:21 UTC'de verileri kontrol eder.
Kaynak değişmezse MP3 dosyaları tekrar üretilmez; 90 gün geçmiş dosyalar
yenilenir. Artık ilk 5 içinde olmayan veya kaynaktan kalkmış dosyalar,
yalnızca başarılı kaynak okuması ve ses üretimi tamamlanınca silinir.
Kaynak erişilemezse mevcut kayıtlar korunur.

Üretim: Ahenk Cep (CPU, neutral style, 16 steps, seed 0);
kaynak lisansları ve veri atıfları için `docs/PODCAST-AHENK-CEP.md`.
MP3 dosyaları `public/podcast-audio/` altında saklanır ve GitHub Pages tarafından
statik sunulur. GitHub Actions'ın sonucu main'e aktarması mevcut Pages
deploy iş akışını tetikler.

Daha geniş kapsam için önce GitHub Actions CPU süresi, depolama ve günlük
çalışmanın işleme maliyetini kontrol edin. Bu pilotta kullanıcıya ses dosyası
sunulmaması halinde mevcut canlı Ahenk okuma aynen devam eder.

## Hazır MP3 eşleştirmesi ve otomatik oynatma

Ses motoru seçim menüsü bulunmaz. Podcast uygulaması önce
`/podcast-audio/manifest.json` listesini (5 saniyelik zaman aşımıyla)
ve Google Sheets makalelerini paralel yükler. Başlık ve normalleştirilmiş
PubMed numarası aynıysa hazır MP3 çalınır, sonraki dosya önden yüklenir.
Hazır MP3 yoksa veya dosya çalınamıyorsa yalnızca Ahenk Cep ile
tarayıcıda ses üretilir; sistem sesine otomatik geçilmez.

**2026-10-18 hatası:** İlk üretilen kayıtların PMID'leri Python tarafında
`42874744.0` biçiminde, web arayüzünde ise `42874744` olarak
saklanmıştı. Bu yüzden MP3 mevcut olsa bile bulunamıyordu.
`src/lib/podcastPreparedAudio.ts` eski manifestleri de okuyabilen
normalleştirme sağlar. `scripts/render_podcast_audio.py` bundan sonra
tam sayı biçiminde PMID yazar. Bu düzeltme ses ve makale başlıklarını
değiştirmez. `src/lib/podcastPreparedAudio.test.ts` ve
`scripts/test_render_podcast_audio.py` aynı davranışı sınar.
