create or replace function public.sync_consensus_calendar_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_secret text;
  payload jsonb;
  request_id bigint;
begin
  select decrypted_secret
    into webhook_secret
  from vault.decrypted_secrets
  where name = 'consensus_calendar_webhook_secret'
  limit 1;

  if webhook_secret is null then
    raise exception 'consensus_calendar_webhook_secret not found in Vault';
  end if;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record',
      case
        when TG_OP = 'DELETE' then null
        else to_jsonb(NEW)
      end,
    'old_record',
      case
        when TG_OP = 'INSERT' then null
        else to_jsonb(OLD)
      end
  );

  select net.http_post(
    url := 'https://anawjzyrgxtfxqzczwwm.supabase.co/functions/v1/sync-consensus-calendar',
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-consensus-webhook-secret', webhook_secret
    ),
    timeout_milliseconds := 10000
  )
  into request_id;

  return null;
end;
$$;

drop trigger if exists sync_consensus_calendar_webhook
on public.meetings;

create trigger sync_consensus_calendar_webhook
after insert or update or delete
on public.meetings
for each row
execute function public.sync_consensus_calendar_trigger();
