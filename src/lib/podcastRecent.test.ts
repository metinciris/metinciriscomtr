import { describe, expect, it } from 'vitest';
import { latestPodcastPmids, podcastDateKey } from './podcastRecent';

const articles = [
  { pmid: '42874744', date: '14 Ekim 2026' },
  { pmid: '42874743.0', date: '14 Ekim 2026' },
  { pmid: '42855077', date: '09 Ekim 2026' },
  { pmid: '42811500', date: '30 Eylül 2026' },
  { pmid: '42904842', date: '23 Ekim 2026' },
];

describe('latest podcast titles', () => {
  it('sorts Turkish dates chronologically, not alphabetically', () => {
    expect(podcastDateKey('09 Ekim 2026')).toBe('2026-10-09');
    expect(podcastDateKey('30 Eylül 2026')).toBe('2026-09-30');
    expect(podcastDateKey('14 Ekim 2026')).toBe('2026-10-14');
    expect(latestPodcastPmids(articles, [], 3))
      .toEqual(['42904842', '42874744', '42874743']);
  });

  it('shows the latest ten from the existing translated list when the archive is empty', () => {
    expect(latestPodcastPmids(articles)).toHaveLength(articles.length);
    expect(latestPodcastPmids(articles)[0]).toBe('42904842');
  });

  it('puts a recorded addition first only when it still exists in the translated list', () => {
    expect(latestPodcastPmids(articles, [
      { pmid: '42855077', firstSeen: '2026-10-23T18:00:00' },
      { pmid: '99999999', firstSeen: '2026-10-23T20:00:00' },
    ], 3)).toEqual(['42855077', '42904842', '42874744']);
  });

  it('normalizes old floating-point PMIDs and prevents duplicates', () => {
    expect(latestPodcastPmids([...articles, { pmid: '42874743', date: '14 Ekim 2026' }]))
      .toEqual(['42904842', '42874744', '42874743', '42855077', '42811500']);
  });
});
