import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

describe('Analytics cookie choices', () => {
  let values: Map<string, string>;
  let events: string[];
  beforeEach(() => {
    vi.resetModules();
    values = new Map();
    events = [];
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
      },
      dispatchEvent: (e: Event) => { events.push(e.type); },
      addEventListener: () => {},
    });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('defaults to no analytics consent', async () => {
    const consent = await import('./cookieConsent');
    expect(consent.getAnalyticsConsent()).toBeNull();
  });
  it('persists explicit rejection and supports reopening preferences', async () => {
    const consent = await import('./cookieConsent');
    consent.saveAnalyticsConsent('rejected');
    expect(consent.getAnalyticsConsent()).toBe('rejected');
    expect(values.get(consent.COOKIE_CONSENT_KEY)).toBe('rejected');
    consent.openCookiePreferences();
    expect(events).toEqual([consent.COOKIE_CONSENT_CHANGED, consent.COOKIE_PREFERENCES_OPEN]);
  });
  it('persists acceptance and can revoke it', async () => {
    const consent = await import('./cookieConsent');
    consent.saveAnalyticsConsent('accepted');
    expect(consent.getAnalyticsConsent()).toBe('accepted');
    consent.saveAnalyticsConsent('rejected');
    expect(consent.getAnalyticsConsent()).toBe('rejected');
  });
});
