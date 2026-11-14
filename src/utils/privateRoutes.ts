/** Halka acik konsensus gorunumleri kaldirildi; yonetim yolu calismaya devam eder. */
export function isRetiredConsensusRoute(pathname: string): boolean {
  const path = pathname.replace(/^\/+|\/+$/g, '');
  return path === 'konsensus' || path.startsWith('konsensus/');
}
