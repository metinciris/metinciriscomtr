# Blog dahili bağlantı otomasyonu — çalışma ve YZ denetimi

Bu belge gelecek yıllarda aynı GitHub Issue yazıları güncellendiğinde bağlantıların nereden geldiğini anlamak ve ChatGPT ile düzenlemek için tutulur.

## Dosyalar
- `scripts/link-differential-headings.mjs`: Açık `Blog` Issue'larını tarar ve uygun ayırıcı tanı başlıkları için "hakkında daha fazlasını oku" bağlantıları ekler.
- `.github/workflows/differential-diagnosis-links.yml`: Salı 09.41 Türkiye saati (06.41 UTC) planlı çalıştırma ve manuel başlatma.
- `scripts/suggest-internal-links.mjs`: Yalnızca benzerlik önerileri üretir.
- `.github/workflows/blog-internal-links.yml`: Salı 09.23 Türkiye saati (06.23 UTC) öneri raporu.
- GitHub Issue **Blog bağlantı denetim günlüğü (YZ kontrol kuyruğu)**: Her yeni otomatik bağlantının kaynak/hedef numarası, gerekçesi ve inceleme durumu.

## Bağlantı oluşturma
1. Yalnız açık ve `Blog` etiketli Issue'lar kaynak ve hedef alınır.
2. Kaynak yazıdaki `Ayırıcı tanı` başlığının bir alt düzeyindeki başlık incelenir.
3. Hedef blog yazısının temel adıyla birebir normalize edilmiş eşleşme aranır; birden fazla aday varsa otomatik işlem yapılmaz.
4. Kaynak kendi kendine bağlanmaz, mevcut URL yeniden eklenmez.
5. Bağlantı bilimsel paragrafa dokunulmadan ilgili alt bölümün sonunda mavi kutu içinde "hakkında daha fazlasını oku" olarak gösterilir.
6. Bir çalışmada en fazla 15 Issue, bir Issue'da en fazla 3 bağlantı eklenir.
7. YZ modeli kullanılmaz: bu aşama deterministik kural tabanlı eşleştirmedir.

## ChatGPT ile sonraki inceleme
Denetim günlüğünde **YZ incelemesi bekliyor** kaydı, *YZ tarafından doğrulandı* anlamına gelmez. Gelecekte bağlantıları ChatGPT'ye kontrol ettirirken; kaynak/hedef tanı uyumu, WHO terminolojisi, eş adlar, klinik uygunluk, hedef adresin açılması, duplikasyon ve tarihsel değişiklikler değerlendirilmeli. Uygunsuz bağlantılar yalnızca ilgili Issue'dan düzeltilmeli; otomasyon kuralı gerekiyorsa ayrıca değiştirilmelidir.

## Yıllar sonra Issue güncellemesi
- Issue numarası kalıcı referanstır. Başlık değişince URL slug'ı değişebilir; eski bağlantılar ayrıca kontrol edilmelidir.
- Yeni tarama var olan bağlantıyı tekrar eklemez; fakat mevcut bağlantıların doğruluğunu ve kırık bağlantıları otomatik onarmaz.
- Kaynak Issue'nun geçmişi GitHub üzerinde korunur. Otomasyon günlüğünün eski kayıtları da Issue sürüm geçmişinde bulunabilir.
- Eski içerik güncellendiğinde otomatik eklenmiş bağlantılar editöryal incelemeden geçirilmelidir.
- Özellikle başka başlığa taşınmış, kapatılmış veya yeniden sınıflandırılmış tümörler için **insan/YZ denetimi** gereklidir.

## Gelecekte YZ'den istenecek komut
> `metinciris/metinciriscomtr` deposundaki "Blog bağlantı denetim günlüğü (YZ kontrol kuyruğu)" Issue'sunu ve `scripts/link-differential-headings.mjs` dosyasını incele. Otomatik eklenen bağlantıların tıbbi bağlamını, hedef URL'lerini, WHO sınıflamasına uygunluğunu ve yinelenmelerini kontrol et. Hataları kaynak ve hedef Issue numaralarıyla raporla. Orijinal bilimsel metni değiştirmeden önce önerileri göster; doğrulanmış olanları denetim günlüğünde işaretle.

## Önemli
GitHub Actions'a ChatGPT API bağlantısı henüz kurulmuş değildir. Sistem **YZ incelemesi için kayıt üretir**; kendiliğinden ChatGPT incelemesi yapmaz.
