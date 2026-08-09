# Konsensus Google Calendar entegrasyonu

## Amaç

`meetings` tablosu tek kaynak olarak kalır. Google Calendar yalnızca yayınlanan bir ayna takvimdir.

Akış:

`Konsensus Yönetim -> Supabase meetings -> sunucu tarafı senkron -> Google Calendar -> takipçiler`

Bu tasarımda kullanıcılar Google Takvim'i bir kez takip eder; toplantı ekleme, tarih/saat değiştirme ve silme işlemleri daha sonra merkezi sistemden yönetilir.

## Yayın hesabı ve takvim

Yayın hesabı: `patolojikonsensus@gmail.com`

Takvim adı: **Patoloji Konsensus**

Takvim kimliği:

```text
a6f960d17e45d61857426577e15c58493e76f69fdf8e62ae11d2ae238140d82e@group.calendar.google.com
```

Takvim herkese açık ve takipçiler için yalnız görüntülenebilir kalır. Frontend yalnız herkese açık Google Calendar abonelik URL'sini kullanır.

## Etkinlik içeriği

Google Calendar etkinlikleri reklam veya kişisel site yönlendirmesi içermemelidir. Güncel katılım bilgileri için nötr takip sayfası kullanılır:

```text
https://konsensus.bolt.host/
```

`metinciris.com.tr/konsensus` bu entegrasyonda etkinlik açıklamasına eklenmez; yedek sistem olarak bağımsız kalır.

Zoom bağlantısı, toplantı kimliği ve parola Google Calendar'a kalıcı olarak yazılmaz. Böylece mevcut zaman kontrollü Zoom görünürlüğü korunur.

## Frontend yapılandırması

`.env` içinde:

```env
VITE_CONSENSUS_CALENDAR_URL=https://calendar.google.com/...
```

Bu değer tanımlı değilse `/konsensus` sayfasında Google Takvim butonu gösterilmez.

## Kimlik doğrulama modeli

Senkronizasyon için kullanıcı OAuth/refresh-token akışı yerine ayrı bir **Google Cloud service account** kullanılacaktır.

- Google Cloud projesinde Calendar API etkinleştirilir.
- `konsensus-calendar-sync` benzeri bir service account oluşturulur.
- `Patoloji Konsensus` takvimi bu service-account e-posta adresiyle paylaşılır.
- Service account'a yalnız **Etkinliklerde değişiklik yapma / Make changes to events** yetkisi verilir; paylaşımı yönetme yetkisi verilmez.
- Service-account JSON anahtarı yalnız sunucu tarafı secret olarak saklanır.
- Private key, JSON anahtar dosyası veya başka kimlik bilgileri repository'ye ya da `VITE_` değişkenlerine yazılmaz.

Bu modelde OAuth consent screen, kullanıcı oturumu ve refresh token gerekmez.

## Senkronizasyon için planlanan alan

`meetings` tablosunda her toplantıyı Google etkinliği ile eşleştirmek için sunucu tarafında bir `google_event_id` alanı tutulmalıdır.

Önerilen davranış:

- INSERT -> Google etkinliği oluştur, `google_event_id` kaydet.
- UPDATE -> mevcut Google etkinliğini güncelle.
- DELETE -> Google etkinliğini sil.
- Tekrar denemelerde aynı toplantının ikinci kez oluşturulmaması için işlem idempotent olmalıdır.

## Güvenlik

Aşağıdaki değerler hiçbir zaman `VITE_` değişkeni veya repository dosyası olarak tutulmamalıdır:

- Google service-account private key
- Service-account JSON credential
- Sunucu tarafı erişim tokenları

Bunlar yalnız Supabase Edge Function secrets alanında tutulmalıdır.

## Uygulama sırası

1. Ayrı Google hesabı oluştur. ✅
2. Bu hesapta `Patoloji Konsensus` adlı ayrı takvim oluştur. ✅
3. Takvimi herkese açık, yalnız görüntülenebilir biçimde paylaş ve abonelik URL'sini al. ✅
4. Google Cloud projesinde Calendar API'yi etkinleştir.
5. `konsensus-calendar-sync` service account oluştur.
6. `Patoloji Konsensus` takvimini service account ile `Make changes to events` yetkisiyle paylaş.
7. Service-account credential bilgisini Supabase secret olarak ekle.
8. `meetings.google_event_id` alanını ekle.
9. Supabase Edge Function ile create/update/delete senkronunu ekle.
10. Mevcut gelecek toplantıları ilk kez Google Calendar'a aktar.
11. Public Google Calendar abonelik URL'sini deployment ortamına ekle.
