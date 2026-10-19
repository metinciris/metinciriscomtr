# Podcast Ahenk Ses Yöneticisi — Windows 10/11

metinciris.com.tr/podcast için, mevcut Ahenk Cep ses motorunu kullanan **yerel Python/Tkinter uygulaması**. Aynı Google Sheets başlıklarını, 24 haneli MP3 dosya adlarını ve GitHub manifestini kullanır.

## Başka bilgisayara güvenli kurulum

1. Resmî kaynaklardan **Python 3.11, 3.12 veya 3.13 (64 bit)** ve **Git for Windows** kurun. Python Launcher (py) varsa otomatik bulunur; ayrıca `python.exe` kontrol edilir.
2. MP3 dönüştürmek için FFmpeg kurun: PowerShell'de `winget install -e --id Gyan.FFmpeg`. Terminali yeniden açınca `ffmpeg -version` ile doğrulayın.
3. Bu klasördeki [kurulum.ps1](kurulum.ps1) dosyasını GitHub üzerinden indirip **içeriğini inceleyin**. Dosyanın bulunduğu dizinde PowerShell açıp `powershell -NoProfile -ExecutionPolicy Bypass -File .\kurulum.ps1` çalıştırın. Kurulum otomatik olarak mevcut 64-bit Python 3.13, 3.12 veya 3.11 sürümünü seçer. Yalnız denetlemek için `powershell -NoProfile -ExecutionPolicy Bypass -File .\kurulum.ps1 -CheckPythonOnly` kullanın. Belirli sürümü zorlamak için `-PythonVersion 3.11` ekleyin. Bu komut, yalnız o PowerShell işlemi için yürütme ilkesini değiştirir; yönetici yetkisi gerekmez.
4. Masaüstünde **Podcast Ahenk Ses Yoneticisi** kısayolu oluşur. Açın, **Ses Motorunu Kur** düğmesine bir kez basın. Tensor/PyTorch bağımlılıkları kendi sanal ortamına kurulur. Model ilk seste Hugging Face `ozgurguler/ahenk-cep-tr` kaynağından gelir.
5. **GitHub'a Gönder** için Git Credential Manager (Git for Windows) tarayıcı oturumu isteyebilir. Uygulama herhangi bir token/parola alanı sağlamaz, parolanızı kaydetmez.

Kodun kaynağı yalnızca `https://github.com/metinciris/metinciriscomtr` olarak sabittir. Kurulum, `git clone --filter=blob:none --sparse` kullanır. Rastgele URL'den `irm | iex` veya benzeri uzaktan script çalıştırma yoktur.

## Ses motoru testi ve kullanıcı dostu arayüz

- Yeni arayüzde solda makale listesi, sağda seçili makalenin okuma metni ve hız ayarı bulunur. Hazır / eksik / yenilenecek sayıları üstte görünür. Bir makaleden diğerine geçince henüz kaydedilmemiş metin taslakları oturum içinde korunur.
- İlk kurulumdan sonra **Test sesi: Ses hazır** düğmesini kullanın. Gerçek Ahenk modeliyle kısa bir ses oluşturur. Bu test yayınlanmış MP3 dosyalarına dokunmaz.
- Windows `pythonw.exe` altında `sys.stdout`/`sys.stderr` boş olabildiğinden ses motorunun çıktısı gerektiğinde `%LOCALAPPDATA%\PodcastAhenk\ahenk_motor.log` dosyasına yönlendirilir. Hatalar `%LOCALAPPDATA%\PodcastAhenk\ahenk_hata.log` içinde ayrıntılı kaydedilir; arayüzde **İşlem kayıtları** sekmesinden klasör açılır.
- Her işlem sırasında hareketli durum çubuğu görünür. Test ve ön dinleme bitmeden **Beğendim** seçeneği etkinleşmez.

## Ses ve okuma iyileştirme

- **Makaleleri Güncelle**: Google Sheets'ten 12 derginin makalelerini alır. Hazır/yeni üretilecek/yenilenecek sesler görünür.
- **Bu Makalenin Okumasını İyileştir**: Bir başlık seçin. Yalnız **seslendirilen metni** düzenleyin; kaynak başlık ve PMID aynı kalır. Noktalama/duraklama ekleyin, 0.80–1.20 hız seçin. **Yeni Okumayı Dinle** ile deneme MP3'ünü işitin; beğenirseniz **Beğendim / Kabul Et**. Eski MP3, onay öncesinde değiştirilmez.
- **Genel Telaffuz**: Bul → Söyle oku sözlüğü tüm uygun seslerde geçerlidir. Örnek: BRG1 → be re ge bir. Yerleşik p53/Ewing gibi düzeltmeler önce uygulanır. İsterseniz genel hız da değiştirilebilir. Kurallar `public/podcast-audio/pronunciation.json` dosyasındadır.
- **Eksik / Eski Sesleri Üret**: 1, 8, 24 veya **Tümü** seçin. İşlem 8'erli gruplarla kayıt yapar, Ahenk modelini bir kez yükler. **Durdur** mevcut partinin tamamlanmasından sonra işlemi keser.
- **GitHub'a Gönder**: MP3 + manifest + telaffuz JSON birlikte, yalnız onayla GitHub'a gönderilir. GitHub main dalı değiştiyse gönderme engellenir; hiçbir zaman `force push` yapılmaz. Push ardından sitedeki standart yayın iş akışı çalışır.
- **GitHub'dan Güncelle**: Yerelde değişiklik yoksa `pull --ff-only` yapar; yerel değişiklikleri sessizce silmez.

**150 gün kuralı:** Güncel listede duran bir ses 150 günü aşınca yenileme sırasına alınır. Yeni MP3 tamamlanana kadar mevcut dosya korunur. Makale listesi tehlikeli biçimde kısalmışsa toplu işlem durdurulur.

**Yerel dosyalar:** Kod `%LOCALAPPDATA%\PodcastAhenk\metinciriscomtr`, sanal ortam `%LOCALAPPDATA%\PodcastAhenk\venv` ve ön dinlemeler `%LOCALAPPDATA%\PodcastAhenk\on_dinleme` altındadır. Aynı bilgisayarda tekrar kurulumda yayımlanmamış yerel telaffuz/MP3 değişiklikleri korunur ve yedeklenir. GitHub aynı dosyayı da değiştirmişse çakışma nedeniyle güncelleme güvenli biçimde durdurulur (zorla üzerine yazılmaz).

**Sınırlama:** Windows 10/11 üzerinde gerçek Ahenk modelinin kurulumu/çıktısı uygulamanın ilk çalıştırılmasında sınanmalıdır. Uygulama ağır paketleri otomatik olarak sessizce kurmaz; yalnız **Ses Motorunu Kur** düğmesiyle kurulur. Kaynak kuralların ve MP3'lerin GitHub'a güvenli aktarılması için yazma izniniz olmalıdır.

Geri bildirim ve kaynak: https://github.com/metinciris/metinciriscomtr/tree/main/windows/podcast-ahenk

## Mevcut kurulumun güncellenmesi

Programı kapatın. `Downloads` klasöründe güncel `kurulum.ps1` dosyasını indirin ve aynı PowerShell komutunu yeniden çalıştırın. Yerel telaffuz sözlüğünüz (ör. `SMARCA4 -> smark-a4`) kaybolmaması için kontrol edilir; uygun ise kurulum dizini yanında zaman damgalı `yedek_*` klasörüne kopyalanır. Program açıldığında önce **Test sesi: Ses hazır** ile modeli sınayın.

## Web ve bilgisayardaki sesleri yan yana karşılaştırma (v1.2)

1. Program metinciris.com.tr/podcast-audio/manifest.json adresindeki **gerçekten yayında olan** MP3 listesini okur. **Web seslerini yenile** ile günceller. GitHub'a yeni ses gönderilmiş olsa da site dağıtımı henüz bitmemiş olabilir.
2. **GitHub seslerini indir** butonu depodaki hazır MP3'leri indirir. Yayımlanmamış yerel sesler ve telaffuz ayarları yedeklenir/korunur. WEB sesi ayrıca dinlendiğinde `%LOCALAPPDATA%\PodcastAhenk\web_mp3` altında saklanır.
3. Sol listede Web/Yerel sütunları; Web'de var, Web'de yok, Yerel yeni, Yerel hazır, Yerel eksik, Yenilenecek filtreleri bulunur.
4. Makale seçilince sağda **WEB / Şu an yayında** ve **BİLGİSAYAR / Yeni ses** kutuları yan yana açılır. İkisini ayrı ayrı dinleyin. Web'e gidecek sesi radio düğmesinden işaretleyin, sonra **Seçtiğim sesi WEB'de yayımla / koru**'ya basın. Her işlem ayrıca onay ister.
5. WEB seçilirse web sitesinde o anda gerçekten çalınan MP3 doğrulanıp GitHub'da o ses yeniden seçilir. Yerel alternatif silinmez. YEREL seçilirse yalnız seçilen yerel MP3 gönderilir.
6. **Toplu üretim** sekmesinden 1, 8, 24 veya tüm eksikleri üretebilir; solda Ctrl/Shift ile birden fazla makale seçip **yalnız seçilen yerel MP3'leri topluca WEB'e gönderebilirsiniz**. Önceden hazırlanmış 79 MP3'ü tekrar sentezlemeniz gerekmez.
7. **Kayıtlar** ve ekran altındaki **HIZLI ERİŞİM** bölümünde loglar, MP3 klasörleri, web sitesi, GitHub ve rehber bağlantıları bulunur.

### Eski `ublic/podcast-audio/...` hatası

Eski sürüm Git durum satırındaki ilk boşluğu yanlışlıkla sildiği için `public/...` yolu `ublic/...` oluyordu. Yeni `git_sync.py` baştaki iki Git durum karakterini korur. `test_git_sync.py` 79 yerel MP3 ile eşzamanlı GitHub güncellemesini geçici Git depolarında test eder.

**Not:** GitHub gönderimi sonrası site güncellemesi zaman alabilir. Sitede gerçekten yayınlanan sürümü görmek için **Web seslerini yenile** kullanın.
