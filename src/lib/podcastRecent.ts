import { normalizePodcastPmid } from './podcastPreparedAudio';

export interface DatedPodcastArticle {
  pmid?: string;
  date?: string;
}

export interface ObservedPodcastArticle {
  pmid: string;
  firstSeen: string;
}

const months: Record<string, number> = {
  ocak: 1,
  subat: 2,
  şubat: 2,
  mart: 3,
  nisan: 4,
  mayıs: 5,
  mayis: 5,
  haziran: 6,
  temmuz: 7,
  ağustos: 8,
  agustos: 8,
  eylül: 9,
  eylul: 9,
  ekim: 10,
  kasım: 11,
  kasim: 11,
  aralık: 12,
  aralik: 12,
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * translate!D holds the Turkish PubMed date ("14 Ekim 2026").
 * Do not sort that string alphabetically: months/days would be out of order.
 * Unknown dates remain at the end; never guess an ingest timestamp.
 */
export function podcastDateKey(date: string | undefined): string {
  const value = String(date || '').trim();
  const turkish = value.match(/^(\d{1,2})\s+([\p{L}]+)\s+(\d{4})$/u);
  if (turkish) {
    const month = months[turkish[2].toLocaleLowerCase('tr-TR')];
    const day = Number(turkish[1]);
    if (month && day >= 1 && day <= 31) {
      return turkish[3] + '-' + pad(month) + '-' + pad(day);
    }
  }
  const numeric = value.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (numeric) return numeric[1] + '-' + pad(Number(numeric[2])) + '-' + pad(Number(numeric[3]));
  return '0000-00-00';
}

function newestFirst(a: string, b: string): number {
  return Number(b) - Number(a);
}

export function sortCurrentPodcastPmids(articles: readonly DatedPodcastArticle[]): string[] {
  const unique = new Map<string, string>();
  articles.forEach(article => {
    const id = normalizePodcastPmid(article.pmid);
    if (!id) return;
    const key = podcastDateKey(article.date);
    if (!unique.has(id) || key > unique.get(id)!) unique.set(id, key);
  });
  return [...unique.entries()]
    .sort(([a, dateA], [b, dateB]) => dateB.localeCompare(dateA) || newestFirst(a,b))
    .map(([pmid]) => pmid);
}

/**
 * If the new Makale_Havuzu has entries, prioritize their real first-seen
 * timestamps only where a matching translated article is currently visible.
 * Otherwise fall back to the existing 12 x 10 translated article collection.
 */
export function latestPodcastPmids(
  articles: readonly DatedPodcastArticle[],
  observed: readonly ObservedPodcastArticle[] = [],
  count = 10,
): string[] {
  const fallback = sortCurrentPodcastPmids(articles);
  const allowed = new Set(fallback);
  const seen = new Map<string, string>();
  observed.forEach(entry => {
    const id = normalizePodcastPmid(entry.pmid);
    const date = String(entry.firstSeen || '').trim();
    if (allowed.has(id) && date && (!seen.has(id) || date > seen.get(id)!)) {
      seen.set(id, date);
    }
  });
  const priority = [...seen.entries()]
    .sort(([a, dateA], [b, dateB]) => dateB.localeCompare(dateA) || newestFirst(a,b))
    .map(([pmid]) => pmid);
  return [...priority, ...fallback.filter(id => !seen.has(id))].slice(0, Math.max(0, count));
}
