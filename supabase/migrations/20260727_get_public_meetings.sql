-- Migration: Create get_public_meetings RPC and restrict direct SELECT on meetings table

CREATE OR REPLACE FUNCTION public.get_public_meetings()
RETURNS TABLE (
    id TEXT,
    title TEXT,
    organizer TEXT,
    date TEXT,
    time TEXT,
    duration INT,
    description TEXT,
    poster_url TEXT,
    has_zoom_info BOOLEAN,
    zoom_link TEXT,
    zoom_id TEXT,
    zoom_password TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    now_ist TIMESTAMP;
BEGIN
    -- Current time in Europe/Istanbul
    now_ist := NOW() AT TIME ZONE 'Europe/Istanbul';

    RETURN QUERY
    SELECT
        m.id::text AS id,
        m.title,
        m.organizer,
        m.date,
        m.time,
        m.duration,
        m.description,
        CASE
            WHEN (now_ist < ((m.date::date + INTERVAL '31 days')::timestamp)) THEN m.poster_url
            ELSE NULL
        END AS poster_url,
        (
            (m.zoom_link IS NOT NULL AND TRIM(m.zoom_link) != '') OR
            (m.zoom_id IS NOT NULL AND TRIM(m.zoom_id) != '') OR
            (m.zoom_password IS NOT NULL AND TRIM(m.zoom_password) != '')
        ) AS has_zoom_info,
        CASE
            WHEN (
                now_ist >= ((m.date || ' ' || COALESCE(NULLIF(m.time, ''), '20:00') || ':00')::timestamp - INTERVAL '120 minutes')
                AND now_ist < ((m.date::date + INTERVAL '1 day')::timestamp)
            ) THEN m.zoom_link
            ELSE NULL
        END AS zoom_link,
        CASE
            WHEN (
                now_ist >= ((m.date || ' ' || COALESCE(NULLIF(m.time, ''), '20:00') || ':00')::timestamp - INTERVAL '120 minutes')
                AND now_ist < ((m.date::date + INTERVAL '1 day')::timestamp)
            ) THEN m.zoom_id
            ELSE NULL
        END AS zoom_id,
        CASE
            WHEN (
                now_ist >= ((m.date || ' ' || COALESCE(NULLIF(m.time, ''), '20:00') || ':00')::timestamp - INTERVAL '120 minutes')
                AND now_ist < ((m.date::date + INTERVAL '1 day')::timestamp)
            ) THEN m.zoom_password
            ELSE NULL
        END AS zoom_password
    FROM public.meetings m
    ORDER BY m.date ASC, m.time ASC;
END;
$$;

-- Grant execution permission on RPC to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_meetings() TO anon, authenticated, service_role;

-- Enable Row Level Security on meetings table
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Drop existing public read policies if any
DROP POLICY IF EXISTS "Public meetings are viewable by everyone" ON public.meetings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.meetings;
DROP POLICY IF EXISTS "Allow anon read access" ON public.meetings;

-- Restrict direct SELECT on meetings table to authenticated users (admin panel)
CREATE POLICY "Authenticated users can read meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (true);
