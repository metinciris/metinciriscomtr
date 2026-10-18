import { describe, expect, it } from 'vitest';
import { indexPreparedPodcastAudio, normalizePodcastPmid, podcastAudioKey } from './podcastPreparedAudio';

const article = {
  title: 'MAP2K1 mutasyonlu melanositik tümörler',
  journal: 'Modern Pathology',
  pmid: '42874744',
};
const filename = 'f9f2808d0c0c3b4646a99767.mp3';

describe('Podcast prepared Ahenk MP3 matching', () => {
  it('matches the already-published Python float PMID with browser PMID', () => {
    const index = indexPreparedPodcastAudio({
      version: 1,
      entries: {
        one: { ...article, pmid: '42874744.0', file: filename },
      },
    });
    expect(index.get(podcastAudioKey(article))).toBe('/podcast-audio/' + filename);
  });

  it('normalizes integer, floating-point and text PMIDs', () => {
    expect(normalizePodcastPmid(42874744)).toBe('42874744');
    expect(normalizePodcastPmid('42874744.0')).toBe('42874744');
    expect(normalizePodcastPmid('42874744.00')).toBe('42874744');
    expect(normalizePodcastPmid('42874744')).toBe('42874744');
  });

  it('rejects stale/wrong-title files and unsafe paths', () => {
    const index = indexPreparedPodcastAudio({
      version: 1,
      entries: {
        correct: { ...article, pmid: '42874744.0', file: filename },
        unsafe: { ...article, title: 'Another title', file: '../hack.mp3' },
      },
    });
    expect(index.get(podcastAudioKey({ ...article, title: 'Another title' }))).toBeUndefined();
    expect(index.get(podcastAudioKey({ ...article, pmid: '42874745' }))).toBeUndefined();
    expect(index.size).toBe(1);
  });

  it('keeps distinct identical titles from different journals when there is no PMID', () => {
    const first = { journal: 'Modern Pathology', title: 'No PMID article', pmid: '' };
    const second = { ...first, journal: 'Nature' };
    expect(podcastAudioKey(first)).not.toBe(podcastAudioKey(second));
  });

  it('handles a missing or malformed manifest safely', () => {
    expect(indexPreparedPodcastAudio(null).size).toBe(0);
    expect(indexPreparedPodcastAudio({ version: 2, entries: {} }).size).toBe(0);
    expect(indexPreparedPodcastAudio({ version: 1, entries: null }).size).toBe(0);
  });
});
