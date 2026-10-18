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
