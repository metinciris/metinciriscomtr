# Konsensus Supabase RLS / RPC inceleme kaydi (14.11.2026)

Bu PR canli Supabase veritabanina SQL uygulamaz ve policy degistirmez.
Toplantilarin baslangicindan 120 dakika once gorunurluk kurali sunucu fonksiyonlarinda aynen korunur.

## Kaynak kodunda tespit edilenler
- supabase/migrations/20260727_get_public_meetings.sql: SQL RPC, link/ID/sifreyi 120 dk oncesine kadar NULL dondurur.
- supabase/migrations/20260810141000_get_public_meeting.sql: detay RPC ayni 120 dk sinirini uygular.
- src/pages/Konsensus.tsx icindeki RPC basarisizliginda dogrudan meetings SELECT eden fallback kaldirildi.
- Eski migration authenticated rolune SELECT USING (true) verir. Canli politikanin ayni oldugu dogrulanmamistir.
- Yonetim arayuzu VITE_ADMIN_UIDS listesi kontrolu yapar; istemci kontrolu tek basina veritabani yetkilendirmesi degildir.

## Canli panelde yalnizca READ-ONLY inceleme sorgulari
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'meetings';

SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('get_public_meetings', 'get_public_meeting');

SELECT relrowsecurity, relforcerowsecurity
FROM pg_class WHERE oid = 'public.meetings'::regclass;
```

## Kontroller
1. Anonymous kullanici dogrudan meetings SELECT yapamamali, public RPC calismali.
2. Admin olmayan authenticated kullanici tabloyu okumamali veya degistirememeli.
3. Yetkili admin islemleri kesintisiz calismali.
4. RPC baslangictan 121 dakika once NULL, 119 dakika once mevcut degerleri, ertesi gun yeniden NULL dondurmeli.
5. SECURITY DEFINER sahibi, search_path, EXECUTE ve RLS politikasi birlikte denetlenmeli.
6. Push abonelikleri ve bildirim gonderen Edge Function yetkileri ayri denetlenmeli.

Sonraki adim: Canli ortam bulgulari onaylandiktan sonra ayrica ve geri alinabilir sekilde RLS migration hazirlanmali. Bu PR'da yeni SQL migration yoktur.