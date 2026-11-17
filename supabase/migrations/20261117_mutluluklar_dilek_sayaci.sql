-- Mutluluklar: anonim, tek-seferlik dilek sayacı
-- Yalnızca mevcut Supabase projesine uygulanır; yeni proje / Edge Function gerekmez.
-- Tarayıcı rastgele UUID üretir. İsim, e-posta, telefon, IP alanı tutulmaz.
-- NOT: Bir kullanıcı tarayıcı verisini temizleyerek veya yeni cihazla
-- tekrar dilek gönderebilir. Bu özellik kimlik doğrulama değildir.
--
-- Bu dosyayı mevcut Supabase projenizde SQL Editor > New query > Run
-- üzerinden BİR KEZ çalıştırabilirsiniz. Tekrar çalıştırılması güvenlidir.

create table if not exists public.mutluluk_dilekleri (
    client_token uuid primary key,
    created_at timestamptz not null default now()
);

comment on table public.mutluluk_dilekleri is
    'Sadece rastgele anonim tarayıcı kimlikleri; mutluluklar dilek sayacı.';

alter table public.mutluluk_dilekleri enable row level security;

-- Tabloya doğrudan anon/oturumlu erişimi kapat. Her işlem yetkili RPC ile yapılır.
revoke all on table public.mutluluk_dilekleri from public, anon, authenticated;

-- Sadece toplam sayı okunur; tekil kimlikler hiçbir API yanıtında dönmez.
create or replace function public.mutluluklar_sayisi()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
    select count(*)::bigint from public.mutluluk_dilekleri;
$$;

-- Aynı tarayıcı UUID'si ile tekrar istek idempotenttir.
-- Eşzamanlı tıklamalarda bile PRIMARY KEY ikinci artışı engeller.
create or replace function public.mutluluk_dile(p_token uuid)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
    if p_token is null then
        raise exception 'Geçersiz dilek anahtarı' using errcode = '22023';
    end if;

    insert into public.mutluluk_dilekleri (client_token)
    values (p_token)
    on conflict (client_token) do nothing;

    return (select count(*)::bigint from public.mutluluk_dilekleri);
end;
$$;

-- Fonksiyonlar varsayılan olarak PUBLIC için yürütülebilir olabilir:
-- önce izinleri kaldır, sonra yalnızca gerekli rollere EXECUTE ver.
revoke all on function public.mutluluklar_sayisi() from public, anon, authenticated;
revoke all on function public.mutluluk_dile(uuid) from public, anon, authenticated;

grant execute on function public.mutluluklar_sayisi() to anon, authenticated;
grant execute on function public.mutluluk_dile(uuid) to anon, authenticated;

-- PostgREST yeni RPC tanımlarını hemen görsün.
notify pgrst, 'reload schema';

-- İsteğe bağlı kontrol (SQL Editor için):
-- select public.mutluluklar_sayisi();
