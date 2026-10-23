import { normalizePodcastPmid } from './podcastPreparedAudio';

export interface PodcastQueueArticle {
  pmid?: string | number | null;
}

export interface PodcastPlaybackQueue {
  /** Indexes into the original journal-order article array. */
  indexes: number[];
  /** Number of recent titles before playback moves to the journal list. */
  recentCount: number;
}

/**
 * Read the ten newest visible titles first, then every remaining article in
 * the original journal order. A recent title must not play twice.
 */
export function buildPodcastPlaybackQueue(
  articles: readonly PodcastQueueArticle[],
  recentPmids: readonly string[],
): PodcastPlaybackQueue {
  const firstByPmid = new Map<string, number>();
  articles.forEach((article, index) => {
    const pmid = normalizePodcastPmid(article.pmid);
    if (pmid && !firstByPmid.has(pmid)) firstByPmid.set(pmid, index);
  });

  const recentIndexes: number[] = [];
  const playedPmids = new Set<string>();
  recentPmids.forEach(raw => {
    const pmid = normalizePodcastPmid(raw);
    const index = firstByPmid.get(pmid);
    if (pmid && index !== undefined && !playedPmids.has(pmid)) {
      playedPmids.add(pmid);
      recentIndexes.push(index);
    }
  });

  const journalIndexes: number[] = [];
  articles.forEach((article, index) => {
    const pmid = normalizePodcastPmid(article.pmid);
    if (!pmid || !playedPmids.has(pmid)) journalIndexes.push(index);
  });

  return {
    indexes: [...recentIndexes, ...journalIndexes],
    recentCount: recentIndexes.length,
  };
}

/** Clicking an ordinary journal card preserves the traditional journal order. */
export function buildPodcastJournalQueue(articleCount: number): PodcastPlaybackQueue {
  return {
    indexes: Array.from({ length: Math.max(0, articleCount) }, (_, i) => i),
    recentCount: 0,
  };
}

export function nextPodcastQueueIndex(
  queue: PodcastPlaybackQueue,
  queuePosition: number,
): number | undefined {
  return queue.indexes[queuePosition + 1];
}

export function podcastQueueProgress(
  queue: PodcastPlaybackQueue,
  queuePosition: number,
): string {
  if (!queue.indexes.length) return '';
  if (queuePosition < queue.recentCount) {
    return `Son Eklenenler · ${queuePosition + 1}/${queue.recentCount}`;
  }
  return `Dergiler · ${queuePosition - queue.recentCount + 1}/${queue.indexes.length - queue.recentCount}`;
}
