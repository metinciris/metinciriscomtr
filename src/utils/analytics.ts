/** Google Analytics yalnizca acik onaydan sonra yuklenir. */
import { COOKIE_CONSENT_CHANGED, COOKIE_CONSENT_KEY, getAnalyticsConsent } from './cookieConsent';

const GA_ID = 'G-VPRW46LHZ7';
let started = false;
let loaded = false;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function disableGA(value: boolean): void {
  (window as unknown as Record<string, unknown>)['ga-disable-' + GA_ID] = value;
}

function deleteGACookies(): void {
  const host = window.location.hostname.split('.');
  const domains = [undefined, ...host.slice(0, -1).map((_, i) => host.slice(i).join('.'))];
  const names = document.cookie.split(';').map((p) => p.trim().split('=')[0])
    .filter((n) => n === '_ga' || n.startsWith('_ga_') || n === '_gid' || n.startsWith('_gat'));
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
    }
  }
}

function applyConsent(userChanged = false): void {
  const accepted = getAnalyticsConsent() === 'accepted';
  disableGA(!accepted);
  if (!accepted) {
    window.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied' });
    deleteGACookies();
    return;
  }
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
  }
  window.gtag('consent', 'update', {
    analytics_storage: 'granted', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
  });
  if (!loaded) {
    loaded = true;
    window.gtag('config', GA_ID, { send_page_view: false });
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    script.async = true;
    script.id = 'consent-google-analytics';
    document.head.appendChild(script);
  }
  if (userChanged) window.gtag('event', 'page_view',
    { page_title: document.title, page_location: window.location.href });
}

export function initializeAnalytics(): void {
  if (typeof window === 'undefined' || started) return;
  started = true;
  applyConsent();
  window.addEventListener(COOKIE_CONSENT_CHANGED, () => applyConsent(true));
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === COOKIE_CONSENT_KEY || event.key === null) applyConsent();
  });
}

export function trackEvent(eventName: string, params: Record<string, string | number | boolean> = {}): void {
  if (typeof window === 'undefined' || getAnalyticsConsent() !== 'accepted') return;
  try {
    window.gtag?.('event', eventName, params);
  } catch {
    // Analitik hatasi sayfayi etkilemez.
  }
}

export function trackPageView(pageName: string): void {
  if (typeof window === 'undefined') return;
  trackEvent('page_view', { page_title: pageName, page_location: window.location.href });
}

export function trackClick(label: string, category = 'engagement'): void {
  trackEvent('click', { event_category: category, event_label: label });
}
