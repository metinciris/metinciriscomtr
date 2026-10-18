/** Shared browser fallback for the Windows / GitHub Ahenk pronunciation rules.
 * The audio files always take priority. The rules only affect synthesis.
 */
import { normalizePodcastPmid, type PreparedPodcastArticle } from './podcastPreparedAudio';

export type PodcastRule = {
  find: string;
  say: string;
  whole_word?: boolean;
};
export type PodcastRules = {
  version: 1;
  global: PodcastRule[];
  articles: Record<string, { text?: string; speed?: number }>;
  global_speed?: number;
};

const EMPTY: PodcastRules = { version: 1, global: [], articles: {}, global_speed: 1 };
let cache: Promise<PodcastRules> | null = null;

function validSpeed(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    && value >= 0.8 && value <= 1.2 ? value : 1;
}

function validate(raw: unknown): PodcastRules {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY;
  const input = raw as Partial<PodcastRules>;
  if (input.version !== 1 || !Array.isArray(input.global) ||
      !input.articles || typeof input.articles !== 'object' || Array.isArray(input.articles)) return EMPTY;
  return input as PodcastRules;
}

export async function loadPodcastPronunciationRules(): Promise<PodcastRules> {
  if (!cache) {
    cache = fetch('/podcast-audio/pronunciation.json', { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error('Pronunciation rules unavailable');
        return res.json() as Promise<unknown>;
      })
      .then(validate)
      .catch(() => EMPTY);
  }
  return cache;
}

export function podcastRuleIdentity(article: PreparedPodcastArticle): string {
  return JSON.stringify([
    article.journal.trim(),
    article.title.trim(),
    normalizePodcastPmid(article.pmid),
  ]);
}

function escapeLiteral(value: string): string {
  return value.replace(/[\]\[(){}.*+?^$|\\]/g, '\\$&');
}

export function applyPodcastPronunciationRules(
  baseText: string,
  article: PreparedPodcastArticle,
  rules: PodcastRules,
): { text: string; speed: number } {
  const custom = rules.articles[podcastRuleIdentity(article)];
  let text = typeof custom?.text === 'string' && custom.text.trim()
    ? custom.text
    : baseText;

  for (const item of rules.global) {
    if (!item || typeof item.find !== 'string' ||
        typeof item.say !== 'string' || !item.find.trim()) continue;
    let regex: RegExp;
    try {
      const escaped = escapeLiteral(item.find);
      const pattern = item.whole_word === false
        ? escaped
        : '(?<![\\p{L}\\p{N}_])' + escaped + '(?![\\p{L}\\p{N}_])';
      regex = new RegExp(pattern, 'giu');
    } catch {
      continue;
    }
    text = text.replace(regex, () => item.say);
  }

  const speed = validSpeed(custom?.speed ?? rules.global_speed);
  return { text, speed };
}
