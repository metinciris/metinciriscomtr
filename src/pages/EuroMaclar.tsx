export type Sport = "basketball" | "volleyball";
export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export interface Match {
  id: string;
  competition: { id: string; name: string; sport: Sport; season?: string };
  match_date: string; // ISO string
  home_team: { name: string; badge?: string };
  away_team: { name: string; badge?: string };
  home_score?: number;
  away_score?: number;
  status: MatchStatus;
  venue?: string;
  round?: string;
  country?: string;
  raw_status?: string;
}

type TheSportsDbEvent = {
  idEvent: string;
  strSport: string;
  idLeague: string;
  strLeague: string;
  strSeason?: string | null;
  intRound?: string | null;

  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;

  intHomeScore?: string | null;
  intAwayScore?: string | null;

  dateEvent?: string | null;
  strTime?: string | null;
  strTimeLocal?: string | null;
  strTimestamp?: string | null;

  strVenue?: string | null;
  strCountry?: string | null;

  strStatus?: string | null;      // NS / FT / LIVE vb
  strPostponed?: string | null;   // "no" / "yes"
};

const API_KEY = import.meta.env.VITE_THESPORTSDB_KEY ?? "123";
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// Avrupa kupaları lig ID’leri
export const LEAGUES = [
  { id: "4546", label: "EuroLeague", sport: "basketball" as const },
  { id: "4547", label: "EuroCup", sport: "basketball" as const },
  { id: "4548", label: "BCL", sport: "basketball" as const },
  { id: "5607", label: "FIBA Europe Cup", sport: "basketball" as const },

  { id: "5616", label: "CEV Champions League", sport: "volleyball" as const },
  { id: "5615", label: "CEV Cup", sport: "volleyball" as const },
  { id: "5614", label: "CEV Challenge Cup", sport: "volleyball" as const },
];

function mapSport(s: string): Sport {
  return s?.toLowerCase() === "volleyball" ? "volleyball" : "basketball";
}

function mapStatus(e: TheSportsDbEvent): MatchStatus {
  if ((e.strPostponed ?? "").toLowerCase() === "yes") return "postponed";
  const st = (e.strStatus ?? "").toUpperCase();
  if (st === "FT" || st === "AOT" || st === "AP") return "finished";
  if (st === "NS") return "scheduled";
  if (st) return "live";
  return "scheduled";
}

/**
 * TheSportsDB’de zaman alanları bazen tutarsız olabiliyor.
 * Pratik çözüm: dateEvent + (strTimeLocal varsa onu) yoksa strTime; o da yoksa strTimestamp.
 * YYYY-MM-DDTHH:mm:ss (timezone’suz) => tarayıcı local timezone’da yorumlar (İstanbul’da düzgün görünür).
 */
function toIsoDate(e: TheSportsDbEvent): string {
  const date = e.dateEvent ?? (e.strTimestamp ? e.strTimestamp.slice(0, 10) : null);
  const time =
    e.strTimeLocal ??
    e.strTime ??
    (e.strTimestamp ? e.strTimestamp.slice(11, 19) : "00:00:00");

  if (!date) return new Date().toISOString();
  return new Date(`${date}T${time}`).toISOString();
}

function toNum(x?: string | null): number | undefined {
  if (x == null || x === "") return undefined;
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TheSportsDB fetch failed: ${res.status} ${url}`);
  return res.json();
}

export async function fetchLeagueMatches(leagueId: string): Promise<Match[]> {
  const nextUrl = `${BASE}/eventsnextleague.php?id=${leagueId}`;
  const pastUrl = `${BASE}/eventspastleague.php?id=${leagueId}`;

  const [next, past] = await Promise.all([fetchJson(nextUrl), fetchJson(pastUrl)]);
  const events: TheSportsDbEvent[] = [...(next?.events ?? []), ...(past?.events ?? [])];

  // dedupe by idEvent
  const map = new Map<string, TheSportsDbEvent>();
  for (const e of events) if (e?.idEvent) map.set(e.idEvent, e);

  return Array.from(map.values()).map((e) => ({
    id: e.idEvent,
    competition: {
      id: e.idLeague,
      name: e.strLeague,
      sport: mapSport(e.strSport),
      season: e.strSeason ?? undefined,
    },
    match_date: toIsoDate(e),
    home_team: { name: e.strHomeTeam, badge: e.strHomeTeamBadge ?? undefined },
    away_team: { name: e.strAwayTeam, badge: e.strAwayTeamBadge ?? undefined },
    home_score: toNum(e.intHomeScore),
    away_score: toNum(e.intAwayScore),
    status: mapStatus(e),
    venue: e.strVenue ?? undefined,
    round: e.intRound ?? undefined,
    country: e.strCountry ?? undefined,
    raw_status: e.strStatus ?? undefined,
  }));
}

// Basit 10 dk cache (dummy yok!)
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function fetchAllMatches(): Promise<Match[]> {
  const cacheKey = "eurocups_cache_v1";
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const obj = JSON.parse(cached);
      if (obj?.ts && Date.now() - obj.ts < CACHE_TTL_MS && Array.isArray(obj.data)) {
        return obj.data as Match[];
      }
    }
  } catch {
    // ignore cache errors
  }

  const perLeague = await Promise.all(LEAGUES.map((l) => fetchLeagueMatches(l.id)));
  const all = perLeague.flat();

  // sort by date
  all.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: all }));
  } catch {
    // ignore
  }

  return all;
}
