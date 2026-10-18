/** Match prepared MP3 titles across Google Sheets / Python / JavaScript.
 *
 * Google Sheets serializes PMIDs as numeric floats in Python ("42874744.0"),
 * whereas JavaScript presents the same number as "42874744". Normalize
 * BOTH formats before matching, including legacy manifests already published.
 * An exact title + normalized PMID prevents playing the wrong article.
 */
export type PreparedPodcastArticle = {
  title: string;
  journal: string;
  pmid?: string | number | null;
};

type PreparedEntry = PreparedPodcastArticle & { file: string };

export function normalizePodcastPmid(value: string | number | null | undefined): string {
  const trimmed = String(value ?? '').trim();
  return /^[0-9]+[.]0+$/.test(trimmed) ? trimmed.replace(/[.]0+$/, '') : trimmed;
}

export function podcastAudioKey(article: PreparedPodcastArticle): string {
  const pmid = normalizePodcastPmid(article.pmid);
  // For records without a PMID, the journal disambiguates repeated titles.
  return JSON.stringify([
    article.title.trim(),
    pmid ? 'pmid:' + pmid : 'journal:' + article.journal.trim(),
  ]);
}

export function indexPreparedPodcastAudio(raw: unknown): Map<string, string> {
  const result = new Map<string, string>();
  if (!raw || typeof raw !== 'object') return result;
  const manifest = raw as { version?: unknown; entries?: unknown };
  if (manifest.version !== 1 || !manifest.entries ||
      typeof manifest.entries !== 'object' || Array.isArray(manifest.entries)) return result;

  for (const item of Object.values(manifest.entries)) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Partial<PreparedEntry>;
    if (typeof entry.title !== 'string' || !entry.title.trim() ||
        typeof entry.journal !== 'string' ||
        !(typeof entry.pmid === 'string' || typeof entry.pmid === 'number' || entry.pmid == null) ||
        typeof entry.file !== 'string' || !/^[a-f0-9]{24}[.]mp3$/.test(entry.file)) continue;
    result.set(podcastAudioKey({
      title: entry.title,
      journal: entry.journal,
      pmid: entry.pmid,
    }), '/podcast-audio/' + entry.file);
  }
  return result;
}
