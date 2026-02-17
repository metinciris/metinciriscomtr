/**
 * Basit analytics event tracking yardımcısı.
 * Google Analytics (gtag.js) kuruluysa olayları gönderir.
 */

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

/**
 * Google Analytics'e özel olay gönder.
 * @param eventName  Olay adı (ör. "page_view", "click_contact")
 * @param params     Ekstra parametreler
 */
export function trackEvent(
    eventName: string,
    params: Record<string, string | number | boolean> = {},
) {
    try {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', eventName, params);
        }
    } catch {
        // Analytics asla sayfayı bozmamalı
    }
}

/**
 * Sayfa görüntüleme olayı gönder.
 */
export function trackPageView(pageName: string) {
    trackEvent('page_view', {
        page_title: pageName,
        page_location: window.location.href,
    });
}

/**
 * Tıklama olayı gönder.
 */
export function trackClick(label: string, category = 'engagement') {
    trackEvent('click', {
        event_category: category,
        event_label: label,
    });
}
