# Konsensus Google Calendar entegrasyonu

## Amaç

`meetings` tablosu tek kaynak olarak kalır. Google Calendar yalnızca yayınlanan bir ayna takvimdir.

Akış:

`Konsensus Yönetim -> Supabase meetings -> sunucu tarafı senkron -> Google Calendar -> takipçiler`

Bu tasarımda kullanıcılar Google Takvim'i bir kez takip eder; toplantı ekleme, tarih/saat değiştirme ve silme işlemleri daha sonra merkezi sistemden yönetilir.

## Hesap modeli

Kişisel Google hesabı kullanılmamalıdır. Yalnızca bu servis için ayrı, ücretsiz bir Google hesabı kullanılmalıdır (ör. `patolojikonsensus@gmail.com`).

- Kişisel Gmail adresi frontend'e veya git geçmişine yazılmaz.
- OAuth client secret, refresh token ve benzeri kimlik bilgileri yalnız sunucu tarafı secret olarak tutulur.
- Frontend yalnız herkese açık takvim abonelik URL'sini görür.
- Takvim adı önerisi: **Patoloji Konsensus**.

## Frontend yapılandırması

`.env` içinde:

```env
VITE_CONSENSUS_CALENDAR_URL=https://calendar.google.com/...
```

Bu değer tanımlı değilse `/konsensus` sayfasında Google Takvim butonu gösterilmez.

## Senkronizasyon için planlanan alan

`meetings` tablosunda her toplantıyı Google etkinliği ile eşleştirmek için sunucu tarafında bir `google_event_id` alanı tutulmalıdır.

Önerilen davranış:

- INSERT -> Google etkinliği oluştur, `google_event_id` kaydet.
- UPDATE -> mevcut Google etkinliğini güncelle.
- DELETE -> Google etkinliğini sil.
- Tekrar denemelerde aynı toplantının ikinci kez oluşturulmaması için işlem idempotent olmalıdır.

## Güvenlik

Aşağıdaki değerler hiçbir zaman `VITE_` değişkeni veya repository dosyası olarak tutulmamalıdır:

- Google OAuth client secret
- Google OAuth refresh token
- Google service-account private key (ileride kullanılırsa)

Bunlar yalnız Supabase/hosting sunucu tarafı secrets alanında tutulmalıdır.

## Uygulama sırası

1. Ayrı Google hesabı oluştur.
2. Bu hesapta `Patoloji Konsensus` adlı ayrı takvim oluştur.
3. Takvimi herkese açık, yalnız görüntülenebilir biçimde paylaş ve abonelik URL'sini al.
4. `VITE_CONSENSUS_CALENDAR_URL` değerini deployment ortamına ekle.
5. Google Cloud projesinde Calendar API'yi etkinleştir.
6. Sunucu tarafı OAuth/offline erişimi yapılandır.
7. `meetings` -> Google Calendar create/update/delete senkronunu ekle.
8. Mevcut toplantıları ilk kez Google Calendar'a aktar.

