type MeetingRecord = {
  id: string | number;
  title: string;
  organizer?: string | null;
  date: string;
  time?: string | null;
  duration?: number | null;
  description?: string | null;
  poster_url?: string | null;
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: MeetingRecord | null;
  old_record: MeetingRecord | null;
};

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_API = 'https://www.googleapis.com/calendar/v3';
const TIME_ZONE = 'Europe/Istanbul';

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required secret: ${name}`);
  return value;
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function textToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const tokenUri = credentials.token_uri || 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);

  const header = textToBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = textToBase64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: GOOGLE_SCOPE,
      aud: tokenUri,
      iat: now - 30,
      exp: now + 3600,
    }),
  );

  const unsignedJwt = `${header}.${claims}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedJwt),
  );

  const assertion = `${unsignedJwt}.${bytesToBase64Url(new Uint8Array(signature))}`;
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(`Google token request failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data.access_token as string;
}

async function deterministicEventId(meetingId: string | number): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(String(meetingId)),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `konsensus${hex.slice(0, 48)}`;
}

function addMinutesLocal(date: string, time: string, durationMinutes: number) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    throw new Error(`Invalid meeting date/time: ${date} ${time}`);
  }

  const value = new Date(
    Date.UTC(year, month - 1, day, hour, minute, 0, 0) + durationMinutes * 60_000,
  );

  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`,
    time: `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`,
  };
}

function buildMeetingDetailUrl(meeting: MeetingRecord, publicUrl: string): string {
  const base = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
  return new URL(
    `konsensus/toplanti/${encodeURIComponent(String(meeting.id))}`,
    base,
  ).toString();
}

function buildDescription(meeting: MeetingRecord, publicUrl: string): string {
  const parts: string[] = [];

  if (meeting.organizer?.trim()) {
    parts.push(`Düzenleyen: ${meeting.organizer.trim()}`);
  }

  if (meeting.description?.trim()) {
    parts.push(meeting.description.trim());
  }

  parts.push(`Güncel katılım bilgileri:\n${buildMeetingDetailUrl(meeting, publicUrl)}`);

  if (meeting.poster_url?.trim()) {
    parts.push(`Toplantı Afişi:\n${meeting.poster_url.trim()}`);
  }

  return parts.join('\n\n');
}

async function buildGoogleEvent(meeting: MeetingRecord, publicUrl: string) {
  if (!meeting.id || !meeting.title?.trim() || !meeting.date) {
    throw new Error('Meeting is missing id, title, or date');
  }

  const time = meeting.time?.trim() || '20:00';
  const duration = Math.max(15, Number(meeting.duration) || 60);
  const end = addMinutesLocal(meeting.date, time, duration);

  return {
    id: await deterministicEventId(meeting.id),
    summary: meeting.title.trim(),
    description: buildDescription(meeting, publicUrl),
    start: {
      dateTime: `${meeting.date}T${time}:00`,
      timeZone: TIME_ZONE,
    },
    end: {
      dateTime: `${end.date}T${end.time}:00`,
      timeZone: TIME_ZONE,
    },
    status: 'confirmed',
    transparency: 'opaque',
    extendedProperties: {
      private: {
        source: 'konsensus-supabase',
        meeting_id: String(meeting.id),
      },
    },
  };
}

async function googleFetch(
  accessToken: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  return fetch(`${GOOGLE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function upsertEvent(
  accessToken: string,
  calendarId: string,
  meeting: MeetingRecord,
  publicUrl: string,
) {
  const event = await buildGoogleEvent(meeting, publicUrl);
  const eventId = event.id;
  const calendar = encodeURIComponent(calendarId);
  const encodedEventId = encodeURIComponent(eventId);

  const updateResponse = await googleFetch(
    accessToken,
    'PUT',
    `/calendars/${calendar}/events/${encodedEventId}?sendUpdates=none`,
    event,
  );

  if (updateResponse.ok) return { action: 'updated', eventId };

  if (updateResponse.status !== 404) {
    const errorText = await updateResponse.text();
    throw new Error(`Google event update failed (${updateResponse.status}): ${errorText}`);
  }

  const insertResponse = await googleFetch(
    accessToken,
    'POST',
    `/calendars/${calendar}/events?sendUpdates=none`,
    event,
  );

  if (insertResponse.ok) return { action: 'created', eventId };

  if (insertResponse.status === 409) {
    const retryResponse = await googleFetch(
      accessToken,
      'PUT',
      `/calendars/${calendar}/events/${encodedEventId}?sendUpdates=none`,
      event,
    );
    if (retryResponse.ok) return { action: 'updated-after-conflict', eventId };

    const retryText = await retryResponse.text();
    throw new Error(`Google event conflict recovery failed (${retryResponse.status}): ${retryText}`);
  }

  const errorText = await insertResponse.text();
  throw new Error(`Google event insert failed (${insertResponse.status}): ${errorText}`);
}

async function deleteEvent(
  accessToken: string,
  calendarId: string,
  meeting: MeetingRecord,
) {
  const eventId = await deterministicEventId(meeting.id);
  const response = await googleFetch(
    accessToken,
    'DELETE',
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
  );

  if (response.ok || response.status === 404 || response.status === 410) {
    return { action: response.ok ? 'deleted' : 'already-absent', eventId };
  }

  const errorText = await response.text();
  throw new Error(`Google event delete failed (${response.status}): ${errorText}`);
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const expectedSecret = getRequiredEnv('CONSENSUS_CALENDAR_WEBHOOK_SECRET');
    const suppliedSecret = request.headers.get('x-consensus-webhook-secret') || '';

    if (suppliedSecret !== expectedSecret) {
      return jsonResponse(401, { ok: false, error: 'Unauthorized' });
    }

    const calendarId = getRequiredEnv('GOOGLE_CALENDAR_ID');
    const publicUrl = getRequiredEnv('CONSENSUS_PUBLIC_URL');
    const credentials = JSON.parse(
      getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_JSON'),
    ) as ServiceAccountCredentials;

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
    }

    const payload = (await request.json()) as WebhookPayload;
    if (payload.schema !== 'public' || payload.table !== 'meetings') {
      return jsonResponse(400, { ok: false, error: 'Unexpected webhook source' });
    }

    if (!['INSERT', 'UPDATE', 'DELETE'].includes(payload.type)) {
      return jsonResponse(400, { ok: false, error: 'Unsupported webhook event' });
    }

    const meeting = payload.type === 'DELETE' ? payload.old_record : payload.record;
    if (!meeting?.id) {
      return jsonResponse(400, { ok: false, error: 'Webhook payload has no meeting record' });
    }

    const accessToken = await getGoogleAccessToken(credentials);
    const result = payload.type === 'DELETE'
      ? await deleteEvent(accessToken, calendarId, meeting)
      : await upsertEvent(accessToken, calendarId, meeting, publicUrl);

    console.log('Consensus calendar sync', {
      webhookType: payload.type,
      meetingId: String(meeting.id),
      ...result,
    });

    return jsonResponse(200, { ok: true, ...result });
  } catch (error) {
    console.error('Consensus calendar sync failed', error);
    return jsonResponse(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
