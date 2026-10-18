import { describe, expect, it } from 'vitest';
import { applyPodcastPronunciationRules, podcastRuleIdentity, type PodcastRules } from './podcastPronunciationOverrides';

const article = { journal: 'Modern Pathology', title: 'Ewing ve p53 biyolojisi', pmid: '42874744' };

describe('Podcast Ahenk pronunciation profiles', () => {
  it('normalizes PMID in the article identity', () => {
    expect(podcastRuleIdentity(article)).toBe(
      podcastRuleIdentity({ ...article, pmid: 42874744.0 }),
    );
  });

  it('supports literal general rules and selected article voice overrides', () => {
    const rules: PodcastRules = {
      version: 1, global_speed: 1,
      global: [{ find: 'Ewing', say: 'Yuing', whole_word: true }],
      articles: {
        [podcastRuleIdentity(article)]: { text: 'Ewing, yavas oku.', speed: 0.9 },
      },
    };
    expect(applyPodcastPronunciationRules(article.title, article, rules))
      .toEqual({ text: 'Yuing, yavas oku.', speed: 0.9 });
  });

  it('matches whole Turkish terms and never expands within a longer word', () => {
    const rules: PodcastRules = {
      version: 1, global: [{ find: 'İHK', say: 'immünohistokimya' }], articles: {},
    };
    expect(applyPodcastPronunciationRules('İHK ve önİHK test', article, rules).text)
      .toBe('immünohistokimya ve önİHK test');
  });
});
