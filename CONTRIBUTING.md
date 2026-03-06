# Katkıda Bulunma Rehberi (CONTRIBUTING)

Bu projeye katkıda bulunmak istediğiniz için teşekkürler! Yerel ortamda çalışırken ve değişikliklerinizi gönderirken lütfen aşağıdaki adımları izleyin.

## 🛠️ Yerel Çalışma Akışı

1. **Dal (Branch) Oluşturun:**
   Yeni bir özellik veya hata düzeltmesi için her zaman ana daldan (`main`) yeni bir dal ayırın.
   ```bash
   git checkout -b ozellik/yeni-ozellik-adi
   ```

2. **Kod Standartları:**
   - Yazım kurallarına ve mevcut kod yapısına uyun.
   - Değişikliklerinizi yaparken `npm run dev` ile canlı olarak test edin.

3. **Değişiklikleri Kaydedin (Commit):**
   Anlamlı ve kısa commit mesajları kullanın.
   ```bash
   git add .
   git commit -m "feat: yeni bileşen eklendi"
   ```

4. **GitHub'a Gönderin (Push):**
   ```bash
   git push origin ozellik/yeni-ozellik-adi
   ```

## 🚀 GitHub Senkronizasyonu

- Değişikliklerinizi ana dala (`main`) merge etmeden önce bir Pull Request (PR) açın.
- PR açıklamasında yaptığınız değişiklikleri kısaca özetleyin.

## ⚠️ Önemli Notlar

- `.env` gibi hassas bilgi içeren dosyaları asla GitHub'a yüklemeyin.
- `node_modules` ve `dist` klasörlerinin `.gitignore` içinde olduğundan emin olun.
