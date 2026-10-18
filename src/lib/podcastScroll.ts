/**
 * Align the active article below both fixed site navigation and the sticky
 * podcast player. Geometry is measured at runtime because translated titles
 * and mobile/desktop player heights can vary.
 */
export function getPodcastArticleScrollTop({
  scrollY,
  articleViewportTop,
  headerHeight,
  playerHeight,
  gap = 16,
}: {
  scrollY: number;
  articleViewportTop: number;
  headerHeight: number;
  playerHeight: number;
  gap?: number;
}): number {
  return Math.max(0, scrollY + articleViewportTop - headerHeight - playerHeight - gap);
}
