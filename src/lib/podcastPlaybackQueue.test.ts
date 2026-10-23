import { describe, expect, it } from 'vitest';
import {
  buildPodcastJournalQueue,
  buildPodcastPlaybackQueue,
  nextPodcastQueueIndex,
  podcastQueueProgress,
} from './podcastPlaybackQueue';

const articles = [
  { pmid: '100' }, // journal 1
  { pmid: '200' },
  { pmid: '300' }, // journal 2
  { pmid: '400.0' },
  { pmid: '500' }, // journal 3
];

describe('podcast listening order', () => {
  it('plays newest first, then journals in their original order without repeats', () => {
    const queue = buildPodcastPlaybackQueue(articles, ['500', '200', '400', '500']);
    expect(queue).toEqual({ indexes: [4, 1, 3, 0, 2], recentCount: 3 });
    expect(new Set(queue.indexes).size).toBe(articles.length);
    expect(queue.indexes.map(index => articles[index].pmid))
      .toEqual(['500', '200', '400.0', '100', '300']);
  });

  it('continues through the remaining newest titles before returning to the first journal', () => {
    const queue = buildPodcastPlaybackQueue(articles, ['500', '200', '400']);
    const clickedRecent = 1; // user clicked the second newest article
    expect(nextPodcastQueueIndex(queue, clickedRecent)).toBe(3);
    expect(nextPodcastQueueIndex(queue, 2)).toBe(0);
    expect(nextPodcastQueueIndex(queue, queue.indexes.length - 1)).toBeUndefined();
    expect(podcastQueueProgress(queue, 0)).toBe('Son Eklenenler · 1/3');
    expect(podcastQueueProgress(queue, 3)).toBe('Dergiler · 1/2');
  });

  it('keeps journal-only click behaviour and ignores missing recent PMIDs', () => {
    expect(buildPodcastJournalQueue(5).indexes).toEqual([0, 1, 2, 3, 4]);
    expect(buildPodcastPlaybackQueue(articles, ['999', '500']).indexes)
      .toEqual([4, 0, 1, 2, 3]);
  });

  it('skips journal duplicates of a recent PMID', () => {
    const repeated = [...articles, { pmid: '500' }];
    const queue = buildPodcastPlaybackQueue(repeated, ['500']);
    expect(queue.indexes).toEqual([4, 0, 1, 2, 3]);
  });

  it('supports empty article lists', () => {
    const queue = buildPodcastPlaybackQueue([], ['500']);
    expect(queue).toEqual({ indexes: [], recentCount: 0 });
    expect(podcastQueueProgress(queue, 0)).toBe('');
  });
});
