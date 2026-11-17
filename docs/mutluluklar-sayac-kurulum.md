# Mutluluklar — kalıcı anonim dilek sayacı

Sayfa: https://metinciris.com.tr/mutluluklar/

## Ücretsiz kurulum (mevcut Supabase)

1. **Yeni proje açmayın.** Konsensus için kullanılan mevcut Supabase projesine girin.
2. **SQL Editor → New query** menüsünü açın.
3. [`20261117_mutluluklar_dilek_sayaci.sql`](../supabase/migrations/20261117_mutluluklar_dilek_sayaci.sql) dosyasının **tamamını** yapıştırın, **Run** düğmesine basın.
4. Son satırdaki `select public.mutluluklar_sayisi();` sorgusunu ayrıca çalıştırırsanız ilk kurulumda **0** görmelisiniz.
5. GitHub Actions **Deploy to GitHub Pages** iş akışının başarılı olduğunu doğrulayın. Zaten kullanılan `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` Actions Secrets'ından tarayıcıda kullanılabilen **anon/public** değerleri derlemeye aktarılır.
6. `/mutluluklar/` sayfasını yenileyip dilek sayısını ve düğmeyi deneyin.

### Nasıl çalışır?

- Herkese toplam sayıyı veren `mutluluklar_sayisi()` RPC fonksiyonu vardır.
- `mutluluk_dile(uuid)` fonksiyonu, benzersiz tarayıcı UUID'sini **bir defa** kaydeder ve güncel toplam sayıyı döner. Tekrar istekler `ON CONFLICT DO NOTHING` nedeniyle sayıyı artırmaz.
- Tarayıcı, rastgele UUID'yi `localStorage`'da saklar. Kişi adı, iletişim bilgileri veya uygulama tablosunda IP tutulmaz.
- RLS açıktır; `anon` ve `authenticated` rolleri kayıtları listeleyemez, silemez veya doğrudan ekleyemez. Sadece iki kısıtlı RPC çağrılabilir.
- Bu bir **tarayıcı başına bir dilek** önlemidir; kullanıcı farklı tarayıcıdan veya localStorage temizleyerek tekrar oy verebilir. Açık API olduğundan mutlak bot/istismar koruması sağlamaz.
- Supabase API'nin standart hizmet günlükleri platform tarafından ayrıca tutulabilir; uygulama bunlara dokunmaz.
- Yeni ücretli servis ve Edge Function yoktur; çok yoğun/bot trafikte ücretsiz Supabase kotası aşılabilir.

### Sorun giderme

- Sayfada **"Dilek sayısı şu anda görüntülenemiyor."** yazıyorsa önce SQL'in gerçekten mevcut projede çalıştırıldığını kontrol edin.
- Sonra GitHub Actions secrets içindeki mevcut `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerinin tanımlı olduğunu kontrol edin. Gizli anahtarları kimseyle paylaşmayın.
- `/mutluluklar/config.json` herkese açık URL/anon key içerir; **service_role** anahtarı veya DB parolası ASLA eklenmez.
- Supabase SQL Editor'de `select public.mutluluklar_sayisi();` mevcut toplamı kontrol etmek için kullanılabilir.
