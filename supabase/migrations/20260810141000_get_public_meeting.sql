-- Public single-meeting RPC for dynamic consensus detail pages.
-- Unlike get_public_meetings(), poster_url is returned for the requested meeting
-- regardless of age so archived posters can be viewed on demand.
-- Zoom details keep the existing 2-hour visibility window.

CREATE OR REPLACE FUNCTION public.get_public_meeting(p_id TEXT)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    organizer TEXT,
    "date" TEXT,
    "time" TEXT,
    duration INT,
    description TEXT,
    poster_url TEXT,
    has_zoom_info BOOLEAN,
    zoom_link TEXT,
    zoom_id TEXT,
    zoom_password TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        m.id::text AS id,
        m.title,
        m.organizer,
        m.date,
        m.time,
        m.duration,
        m.description,
        m.poster_url,
        (
            (m.zoom_link IS NOT NULL AND TRIM(m.zoom_link) <> '') OR
            (m.zoom_id IS NOT NULL AND TRIM(m.zoom_id) <> '') OR
            (m.zoom_password IS NOT NULL AND TRIM(m.zoom_password) <> '')
        ) AS has_zoom_info,
        CASE
            WHEN (
                (NOW() AT TIME ZONE 'Europe/Istanbul') >= (
                    (m.date || ' ' || COALESCE(NULLIF(m.time, ''), '20:00') || ':00')::timestamp
                    - INTERVAL '120 minutes'
                )
                AND (NOW() AT TIME ZONE 'Europe/Istanbul') < ((m.date::date + INTERVAL '1 day')::timestamp)
            ) THEN m.zoom_link
            ELSE NULL
        END AS zoom_link,
        CASE
            WHEN (
                (NOW() AT TIME ZONE 'Europe/Istanbul') >= (
                    (m.date || ' ' || COALESCE(NULLIF(m.time, ''), '20:00') || ':00')::timestamp
                    - INTERVAL '120 minutes'
                )
                AND (NOW() AT TIME ZONE 'Europe/Istanbul') < ((m.date::date + INTERVAL '1 day')::timestamp)
            ) THEN m.zoom_id
            ELSE NULL
        END AS zoom_id,
        CASE
            WHEN (
                (NOW() AT TIME ZONE 'Europe/Istanbul') >= (
                    (m.date || ' ' || COALESCE(NULLIF(m.time, ''), '20:00') || ':00')::timestamp
                    - INTERVAL '120 minutes'
                )
                AND (NOW() AT TIME ZONE 'Europe/Istanbul') < ((m.date::date + INTERVAL '1 day')::timestamp)
            ) THEN m.zoom_password
            ELSE NULL
        END AS zoom_password
    FROM public.meetings AS m
    WHERE m.id::text = p_id
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_meeting(TEXT) TO anon, authenticated, service_role;
