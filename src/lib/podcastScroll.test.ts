import { describe, expect, it } from 'vitest';
import { getPodcastArticleScrollTop } from './podcastScroll';

describe('podcast active article scrolling', () => {
  it('keeps desktop article below the fixed header and sticky player', () => {
    const y = getPodcastArticleScrollTop({
      scrollY: 760,
      articleViewportTop: 420,
      headerHeight: 64,
      playerHeight: 236,
    });
    expect(y).toBe(864);
  });

  it('adapts automatically when the title makes the player taller', () => {
    const shortTitle = getPodcastArticleScrollTop({
      scrollY: 500,
      articleViewportTop: 400,
      headerHeight: 64,
      playerHeight: 160,
    });
    const longTitle = getPodcastArticleScrollTop({
      scrollY: 500,
      articleViewportTop: 400,
      headerHeight: 64,
      playerHeight: 260,
    });
    expect(shortTitle - longTitle).toBe(100);
  });

  it('never scrolls above the start of the page', () => {
    expect(getPodcastArticleScrollTop({
      scrollY: 0,
      articleViewportTop: 30,
      headerHeight: 80,
      playerHeight: 400,
    })).toBe(0);
  });
});
