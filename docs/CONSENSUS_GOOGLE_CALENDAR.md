# Konsensus Google Calendar entegrasyonu

## Amaç

`meetings` tablosu tek kaynak olarak kalır. Google Calendar yalnızca yayınlanan bir ayna takvimdir.

Akış:

`Konsensus Yönetim -> Supabase meetings -> Edge Function -> Google Calendar -> takipçiler`

Bu tasarımda kullanıcılar Google Takvim'i bir kez takip eder; toplantı ekleme, tarih/saat değiştirme ve silme işlemleri daha sonra merkezi sistemden yönetilir.

## Yayın hesabı ve takvim

Yayın hesabı: `patolojikonsensus@gmail.com`

Takvim adı: **Patoloji Konsensus**

Takvim kimliği:

```text
a6f960d17e45d61857426577e15c58493e76f69fdf8e62ae11d2ae238140d82e@group.calendar.google.com
```

Service account:

```text
konsensus-calendar-sync@patoloji-konsensus.iam.gserviceaccount.com
```

Takvim herkese açık ve takipçiler için yalnız görüntülenebilir kalır. Service account'a yalnız **Etkinliklerde değişiklik yapma / Make changes to events** yetkisi verilir.

## Etkinlik içeriği

Google Calendar etkinlikleri reklam veya kişisel site yönlendirmesi içermemelidir. Güncel katılım bilgileri için nötr takip sayfası kullanılır:

```text
https://konsensus.bolt.host/
```

`metinciris.com.tr/konsensus` bu entegrasyonda etkinlik açıklamasına eklenmez; yedek sistem olarak bağımsız kalır.

Zoom bağlantısı, toplantı kimliği ve parola Google Calendar'a kalıcı olarak yazılmaz. Böylece mevcut zaman kontrollü Zoom görünürlüğü korunur.

## Frontend yapılandırması

Deployment `.env` içinde public abonelik bağlantısı tanımlanır:

```env
VITE_CONSENSUS_CALENDAR_URL=https://calendar.google.com/calendar/u/0?cid=YTZmOTYwZDE3ZTQ1ZDYxODU3NDI2NTc3ZTE1YzU4NDkzZTc2ZjY5ZmRmOGU2MmFlMTFkMmFlMjM4MTQwZDgyZUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t
```

Bu değer tanımlı değilse `/konsensus` sayfasında Google Takvim butonu gösterilmez.

## Kimlik doğrulama modeli

Senkronizasyon kullanıcı OAuth/refresh-token akışı yerine Google Cloud **service account** ile yapılır.

- Google Calendar API etkin olmalıdır.
- Service account JSON anahtarı yalnız Supabase secret olarak saklanır.
- Private key veya JSON anahtar dosyası repository'ye ya da `VITE_` değişkenlerine yazılmaz.
- Edge Function yalnız `calendar.events` OAuth kapsamını ister.

Bu modelde OAuth consent screen, kullanıcı oturumu ve refresh token gerekmez.

## Deterministik Google event ID

`meetings.google_event_id` sütunu eklenmez. Her toplantının Supabase `id` değerinden SHA-256 tabanlı, Google Calendar tarafından kabul edilen stabil bir event ID üretilir.

Bunun yararları:

- INSERT/UPDATE webhook tekrarları duplicate etkinlik oluşturmaz.
- Ek bir veritabanı sütunu gerekmez.
- `google_event_id` yazılması nedeniyle ikinci bir UPDATE webhook döngüsü oluşmaz.
- DELETE sırasında aynı event ID yeniden hesaplanabilir.

## Edge Function secrets

Supabase Dashboard -> Edge Functions -> Secrets alanında aşağıdaki secret'lar bulunmalıdır:

```text
GOOGLE_CALENDAR_ID
GOOGLE_SERVICE_ACCOUNT_JSON
CONSENSUS_PUBLIC_URL
CONSENSUS_CALENDAR_WEBHOOK_SECRET
```

Değerler:

```text
GOOGLE_CALENDAR_ID=a6f960d17e45d61857426577e15c58493e76f69fdf8e62ae11d2ae238140d82e@group.calendar.google.com
CONSENSUS_PUBLIC_URL=https://konsensus.bolt.host/
```

`GOOGLE_SERVICE_ACCOUNT_JSON`, Google Cloud'dan indirilen JSON anahtar dosyasının **tam içeriğidir**. Bu içerik GitHub'a yüklenmez.

`CONSENSUS_CALENDAR_WEBHOOK_SECRET` rastgele ve uzun bir değerdir. Aynı değer Database Webhook'un `x-consensus-webhook-secret` HTTP header'ında kullanılır.

## Edge Function

Kod:

```text
supabase/functions/sync-consensus-calendar/index.ts
```

Fonksiyon yalnız Database Webhook'tan çağrılır. Supabase JWT doğrulaması bu fonksiyon için kapalıdır; bunun yerine `x-consensus-webhook-secret` zorunludur.

Fonksiyon davranışı:

- INSERT -> deterministik ID ile event oluştur / varsa güncelle.
- UPDATE -> aynı event'i güncelle.
- DELETE -> aynı event'i sil; zaten yoksa başarılı kabul et.
- Google Calendar daveti göndermez (`sendUpdates=none`).

## Database Webhook

Supabase Dashboard -> Database -> Webhooks bölümünde `public.meetings` tablosu için bir webhook oluşturulur.

Events:

```text
INSERT
UPDATE
DELETE
```

HTTP method:

```text
POST
```

URL:

```text
https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/sync-consensus-calendar
```

Header:

```text
x-consensus-webhook-secret: <CONSENSUS_CALENDAR_WEBHOOK_SECRET ile aynı değer>
```

## Uygulama sırası

1. Ayrı Google hesabı oluştur. ✅
2. `Patoloji Konsensus` takvimini oluştur. ✅
3. Takvimi herkese açık, yalnız görüntülenebilir paylaş. ✅
4. Google Calendar API'yi etkinleştir. ✅
5. `konsensus-calendar-sync` service account oluştur. ✅
6. Takvimi service account ile `Make changes to events` yetkisiyle paylaş. ✅
7. Google Cloud'da service account JSON key oluştur.
8. Supabase secrets değerlerini ekle.
9. Edge Function'ı deploy et.
10. `meetings` INSERT/UPDATE/DELETE Database Webhook'unu oluştur.
11. Tek bir test toplantısı ile create/update/delete senkronunu doğrula.
12. Mevcut gelecek toplantıları backfill et.
13. Public Google Calendar abonelik URL'sini deployment ortamına ekle.
