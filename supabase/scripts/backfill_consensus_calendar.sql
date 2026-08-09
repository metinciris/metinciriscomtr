-- One-time/re-runnable backfill for existing upcoming meetings.
-- Does not UPDATE the meetings table, so unrelated UPDATE triggers/notifications are not fired.
-- Safe to rerun because the Edge Function uses deterministic Google event IDs.

with webhook_secret as (
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'consensus_calendar_webhook_secret'
  limit 1
), upcoming as (
  select
    m.id,
    m.title,
    m.organizer,
    m.date,
    m.time,
    m.duration,
    m.description,
    s.decrypted_secret as webhook_secret
  from public.meetings m
  cross join webhook_secret s
  where (
    m.date || ' ' || coalesce(nullif(m.time, ''), '20:00')
  )::timestamp >= (now() at time zone 'Europe/Istanbul')
)
select
  id,
  title,
  date,
  time,
  net.http_post(
    url := 'https://anawjzyrgxtfxqzczwwm.supabase.co/functions/v1/sync-consensus-calendar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-consensus-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'meetings',
      'schema', 'public',
      'record', jsonb_build_object(
        'id', id,
        'title', title,
        'organizer', organizer,
        'date', date,
        'time', time,
        'duration', duration,
        'description', description
      ),
      'old_record', null
    ),
    timeout_milliseconds := 10000
  ) as request_id
from upcoming
order by date, time;
