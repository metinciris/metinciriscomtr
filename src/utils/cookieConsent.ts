/** Opt-in analytics tercihi; varsayilan olarak izin verilmez. */
export type AnalyticsConsent = 'accepted' | 'rejected' | null;
export const COOKIE_CONSENT_KEY = 'metinciris_analytics_consent_v1';
export const COOKIE_CONSENT_CHANGED = 'metinciris:analytics-consent-changed';
export const COOKIE_PREFERENCES_OPEN = 'metinciris:cookie-preferences-open';

let volatileConsent: AnalyticsConsent = null;

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return volatileConsent;
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === 'accepted' || value === 'rejected') return value;
    return null;
  } catch {
    // Bazi tarayicilarda depolama kapali olabilir.
  }
  return volatileConsent;
}

export function saveAnalyticsConsent(value: Exclude<AnalyticsConsent, null>): void {
  volatileConsent = value;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    // Bu oturum icin bellek tercihi kullanilir.
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED));
}

export function openCookiePreferences(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(COOKIE_PREFERENCES_OPEN));
}
