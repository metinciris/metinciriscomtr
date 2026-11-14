import { describe, expect, it } from 'vitest';
import { isRetiredConsensusRoute } from './privateRoutes';

describe('Public consensus routes retired', () => {
  it.each([
    '/konsensus',
    '/konsensus/',
    '/konsensus/toplanti/42/',
    '/konsensus/toplanti/2026-kasim',
    'konsensus/toplanti/test',
  ])('hides publicly listed meeting path %s', (path) => {
    expect(isRetiredConsensusRoute(path)).toBe(true);
  });

  it.each([
    '/konsensus-yonetim',
    '/konsensus-yonetim/',
    '/blog/',
    '/',
    '/konsensushaber/',
  ])('preserves unrelated and management route %s', (path) => {
    expect(isRetiredConsensusRoute(path)).toBe(false);
  });
});
