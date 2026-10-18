# Podcast Ahenk Ses Yöneticisi — Windows 10/11

metinciris.com.tr/podcast için, mevcut Ahenk Cep ses motorunu kullanan **yerel Python/Tkinter uygulaması**. Aynı Google Sheets başlıklarını, 24 haneli MP3 dosya adlarını ve GitHub manifestini kullanır.

## Başka bilgisayara güvenli kurulum

1. Resmî kaynaklardan **Python 3.11 (64 bit)** ve **Git for Windows** kurun. Python Launcher (py) açık olsun.
2. MP3 dönüştürmek için FFmpeg kurun: PowerShell'de `winget install -e --id Gyan.FFmpeg`. Terminali yeniden açınca `ffmpeg -version` ile doğrulayın.
3. Bu klasördeki [kurulum.ps1](kurulum.ps1) dosyasını GitHub üzerinden indirip **içeriğini inceleyin**. Dosyanın bulunduğu dizinde PowerShell açıp `powershell -NoProfile -ExecutionPolicy Bypass -File .\kurulum.ps1` çalıştırın. Bu komut, yalnız o PowerShell işlemi için yürütme ilkesini değiştirir; yönetici yetkisi gerekmez.
4. Masaüstünde **Podcast Ahenk Ses Yoneticisi** kısayolu oluşur. Açın, **Ses Motorunu Kur** düğmesine bir kez basın. Tensor/PyTorch bağımlılıkları kendi sanal ortamına kurulur. Model ilk seste Hugging Face `ozgurguler/ahenk-cep-tr` kaynağından gelir.
5. **GitHub'a Gönder** için Git Credential Manager (Git for Windows) tarayıcı oturumu isteyebilir. Uygulama herhangi bir token/parola alanı sağlamaz, parolanızı kaydetmez.

Kodun kaynağı yalnızca `https://github.com/metinciris/metinciriscomtr` olarak sabittir. Kurulum, `git clone --filter=blob:none --sparse` kullanır. Rastgele URL'den `irm | iex` veya benzeri uzaktan script çalıştırma yoktur.

## Ses ve okuma iyileştirme

- **Makaleleri Güncelle**: Google Sheets'ten 12 derginin makalelerini alır. Hazır/yeni üretilecek/yenilenecek sesler görünür.
- **Bu Makalenin Okumasını İyileştir**: Bir başlık seçin. Yalnız **seslendirilen metni** düzenleyin; kaynak başlık ve PMID aynı kalır. Noktalama/duraklama ekleyin, 0.80–1.20 hız seçin. **Yeni Okumayı Dinle** ile deneme MP3'ünü işitin; beğenirseniz **Beğendim / Kabul Et**. Eski MP3, onay öncesinde değiştirilmez.
- **Genel Telaffuz**: Bul → Söyle oku sözlüğü tüm uygun seslerde geçerlidir. İsterseniz genel hız da değiştirilebilir. Kurallar `public/podcast-audio/pronunciation.json` dosyasındadır.
- **Eksik / Eski Sesleri Üret**: 1, 8, 24 veya **Tümü** seçin. İşlem 8'erli gruplarla kayıt yapar, Ahenk modelini bir kez yükler. **Durdur** mevcut partinin tamamlanmasından sonra işlemi keser.
- **GitHub'a Gönder**: MP3 + manifest + telaffuz JSON birlikte, yalnız onayla GitHub'a gönderilir. GitHub main dalı değiştiyse gönderme engellenir; hiçbir zaman `force push` yapılmaz. Push ardından sitedeki standart yayın iş akışı çalışır.
- **GitHub'dan Güncelle**: Yerelde değişiklik yoksa `pull --ff-only` yapar; yerel değişiklikleri sessizce silmez.

**150 gün kuralı:** Güncel listede duran bir ses 150 günü aşınca yenileme sırasına alınır. Yeni MP3 tamamlanana kadar mevcut dosya korunur. Makale listesi tehlikeli biçimde kısalmışsa toplu işlem durdurulur.

**Yerel dosyalar:** Kod `%LOCALAPPDATA%\PodcastAhenk\metinciriscomtr`, sanal ortam `%LOCALAPPDATA%\PodcastAhenk\venv` ve ön dinlemeler `%LOCALAPPDATA%\PodcastAhenk\on_dinleme` altındadır. Aynı bilgisayarda ikinci kez kurulum mevcut dosyalar kirliyse durur; değişiklikler korunur.

**Sınırlama:** Windows 10/11 üzerinde gerçek Ahenk modelinin kurulumu/çıktısı uygulamanın ilk çalıştırılmasında sınanmalıdır. Uygulama ağır paketleri otomatik olarak sessizce kurmaz; yalnız **Ses Motorunu Kur** düğmesiyle kurulur. Kaynak kuralların ve MP3'lerin GitHub'a güvenli aktarılması için yazma izniniz olmalıdır.

Geri bildirim ve kaynak: https://github.com/metinciris/metinciriscomtr/tree/main/windows/podcast-ahenk
