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


## Windows v1.3 — Basit ses merkezi

Önceki ayrıntılı v1.2 arayüzünün kaynak dosyası korunur, ancak masaüstü
kısayolu artık daha sade ve hızlı `simple_manager.py` programını açar.

**Sol tarafta** doğrudan şu filtreler bulunur: Hepsi, WEB'de olanlar,
WEB'de olmayanlar, PC'de olanlar, PC'de olmayanlar ve Yüklemeye hazır.
Dergi seçimi ikincil filtredir. Her makalenin **Seç** kutusuna bir kez
tıklayarak istediğiniz kadar MP3 işaretleyebilirsiniz; Görünenleri seç
düğmesi toplu seçim içindir.

**Sağ tarafta** WEB ve PC kayıtları iki kutuda dinlenir. Altındaki metni,
telaffuzu ve okuma hızını değiştirebilir; yeni denemeyi dinleyip yalnız
beğendiğiniz MP3'ü yerelde kabul edebilirsiniz. WEB sesini işaretlemek
yayını korur, PC sesini işaretlemek onay sonrası bu sesi web'e gönderir.

**Tek tıkla eksikleri üret:** PC'de olmayan kayıtları sekizli gruplarla
Ahenk modeli üzerinden hazırlar. Fiziksel olarak zaten mevcut MP3'leri
yeniden üretmez, hiçbir sesi otomatik yayımlamaz.

**Seçerek yükle:** Solda işaretlenen PC MP3'leri sekizli gruplarla
GitHub'a gönderilir. Diğer sesler bilgisayarda korunur. Kullanıcı
onayı olmadan hiçbir MP3 GitHub'a gönderilmez.

**Manifest kurtarma:** Bir MP3 dosyası mevcut ama manifest kaydı
kaybolmuşsa, uygulama onu yine PC'de var olarak gösterir. Yedek alıp
makalenin kimliğini (dergi + başlık + PMID) doğrular, eksik kaydı
yayınlama öncesinde kurtarır; kimliği doğrulanmayan dosyayı hiçbir
zaman doğrudan yayımlamaz. Kurtarılmış MP3'ün üretilirken kullanılan
telaffuzu bilinmeyebileceğinden fingerprint'i `unknown-recovered`
olarak işaretlenir. Kullanıcı dinleyip onaylamalıdır.

**Donmaları önleme:** Makale seçimi ve filtreler Tk ana iş parçacığında
Git, internet, web MP3 indirme veya ses motorunu başlatma işlemi yapmaz.
Bu işlemler ayrı bir iş parçacığında ilerler; işlem çubuğu ve kısa
durum metni görünür. Hata mesajları `%LOCALAPPDATA%\PodcastAhenk\ahenk_hata.log`
içindedir. **Loglar** ana ekranda, **MP3 klasörü** ve **WEB sitesi** yanındadır.

**Eski MP3'ler için güvenlik:** Windows'ta yerel ses üretiminde artık
sahipsiz MP3 dosyaları otomatik silinmez. Bu koruma yerel yönetici
içindir; GitHub Actions sunucu temizleme politikası aynı kalır.

**Kurulum:** Güncel `kurulum.ps1` dosyasını `Downloads` klasörüne
indirip doğruladıktan sonra PowerShell ile çalıştırın. Önceden
üretilmiş 79/92 MP3'ü yeniden sentezlemeniz gerekmez. İlk işlem olarak
`GitHub seslerini indir / eşitle`, ardından filtrelerle hazır
sesleri gözden geçirmenizi öneririz.

## Windows v1.4 — yalnızca iki ana adım

**1. WEB'DE EKSİK TÜM SESLERİ HAZIRLA**

Gerçek sitedeki `https://metinciris.com.tr/podcast-audio/manifest.json` listesini ve güncel Google Sheets makalelerini okur. WEB'de zaten mevcut sesleri yeniden üretmez. WEB'de eksik olup PC'de mevcut MP3 dosyalarını aynen kullanır. Yalnız iki tarafta da eksik olanları Ahenk modeliyle sekizli partiler hâlinde üretir. Manifest kaydı eksikse yedekli olarak kurtarır. Bu adım **GitHub'a MP3 göndermez** ve sitede hiçbir sesi değiştirmez.

**2. HAZIR SESLERİ WEB'E YÜKLE**

Yüklemeden hemen önce gerçek siteye tekrar bakar. WEB'de eksik bütün sesler PC'de hazır değilse gönderme başlamaz; önce birinci adımı tamamlamanız istenir. Eksiklerin hepsi hazırsa açık bir onay penceresi çıkar. Ardından yalnız WEB'de eksik makalelerin MP3'leri GitHub'a sekizli gruplarla gönderilir; WEB'de hâlihazırda çalınan sesler değiştirilmez. Eski, hazırlanmamış veya seçilmemiş PC kayıtları korunur.

**Yükleme durumu:** Program üstündeki ayrı alanlarda `Hazırlanan MP3`, `GitHub'a gönderilen` ve `WEB'de doğrulanan` sayıları gösterilir. GitHub'a gönderilmek, web sitesinde yayımlanmakla aynı şey değildir: GitHub Pages dağıtımı zaman alabilir. Uygulama sitenin gerçek manifestini yaklaşık 15 saniyede bir tekrar kontrol ederek yalnız **tam olarak eşleşen ses kayıtlarını** `WEB'de doğrulandı` olarak sayar. Yaklaşık 10 dakika sonunda hâlâ bekleyen olursa manuel `WEB durumunu kontrol et` ile tekrar bakılabilir.

**Durumun korunması:** Gönderim durumu `%LOCALAPPDATA%\PodcastAhenk\web_yayin_durumu.json` dosyasında saklanır. Program yeniden açıldığında son durumu gösterir; bitmemiş WEB dağıtımını yeniden kontrol etmeyi dener. Sonraki denemelerde web sitesinde hâlihazırda görünür olmuş sesler yeniden hedeflenmez.

**İsteğe bağlı düzeltmeler:** Alt bölümde makaleyi seçerek WEB / PC MP3'lerini dinleyebilir, tek başlığı farklı telaffuzla yeniden üretebilir ve beğendiğiniz sürümü PC'ye kaydedebilirsiniz. Eski gelişmiş `simple_manager.py` ve `podcast_ahenk_gui.py` dosyaları GitHub'da geri dönüş için korunur.

**Güvenlik:** Bu iki adımlı sürüm, erişilemeyen bir WEB listesini `0 ses` sanıp bütün kayıtları yeniden üretmez veya topluca yayımlamaz. WEB kimlikleri yanlışsa işlem durur. Her bir GitHub gönderim partisi tamamlandıktan sonra sayılar kaydedilir; başarısız yüklemede eski PC MP3 dosyaları silinmez. Tüm sesleri yayımlamadan önce onay penceresi gösterilir.

## Windows v1.4 — yeni okuma ve bekleyen sesler

**Üretilip WEB'de henüz görünmeyenler:** Ana ekranda `PC hazır / WEB'de yok` sayacı ve `Hazır, WEB'de olmayan sesleri göster` düğmesi vardır. Aynı listeye `Üretildi, WEB'de yok` filtresinden de erişilebilir. `PC ✓` yerel MP3'ün hazır olduğunu belirtir. `GitHub ✓` ise bu uygulamanın kaydettiği gönderim başarı durumudur; web yayını henüz doğrulanmamıştır. `Gönderim kaydı bulunmayan` ifadesi GitHub'da dosya yok anlamına gelmez; başka PC veya GitHub Actions sesi göndermiş olabilir. Web sayımları en son başarıyla okunan site manifestine dayanır.

**Terim sözlüğü:** Ana ekranda genel telaffuz düzeltmelerinin ilk üçü ve toplam kural sayısı görünür. `Gör / düzenle` veya üstteki `Terim sözlüğü` düğmesiyle tüm kurallar açılır. Örnek: `SMARCA4 → smark-a4`. Makaleye özel okuma metni ve hız değişiklikleri ayrı tutulur.

**Yeni okumayı üret ve dinle:** Seçili makale WEB'de yayımlanmış olsa da `Hepsi` listesinden açılarak yeni okuma hazırlanabilir. Her denemede farklı geçici MP3 dosyası üretilir; Windows oynatıcısındaki önceki ses açık kalsa bile üzerine yazılmaz. MP3 üretildiği halde oynatıcı açılamazsa dosya korunur, `Tekrar dinle` ve `Beğendim, PC'ye kaydet` kullanılabilir. Yalnız `Beğendim` sonrasında kabul edilmiş yerel MP3 değişir; **WEB sesi otomatik değişmez**. İstenen PC sürümü siteye ayrı bir yayın onayıyla gönderilir. Devam eden yükleme/senkronizasyon sırasında ön dinleme başlatılmıyorsa ekranda nedeni gösterilir.

**Güvenlik:** Ön dinlemeler `%LOCALAPPDATA%\PodcastAhenk\on_dinleme` klasörüne yazılır. Eski yerel MP3'ler ve telaffuz kuralları kullanıcı onayı olmadan silinmez. Ayrıntılı hata `%LOCALAPPDATA%\PodcastAhenk\ahenk_hata.log` dosyasına, olay kaydı `ahenk_islem.log` dosyasına yazılır.
