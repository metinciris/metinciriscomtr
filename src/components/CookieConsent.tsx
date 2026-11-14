import { useEffect, useState } from 'react';
import { COOKIE_CONSENT_KEY, COOKIE_PREFERENCES_OPEN, getAnalyticsConsent, saveAnalyticsConsent } from '../utils/cookieConsent';

/** Kabul ve ret esit erisilebilir; tercih sonradan degistirilebilir. */
export function CookieConsent() {
  const [visible, setVisible] = useState(() => getAnalyticsConsent() === null);
  const [details, setDetails] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(() => getAnalyticsConsent() === 'accepted');

  useEffect(() => {
    const open = () => {
      setAnalyticsAllowed(getAnalyticsConsent() === 'accepted');
      setDetails(true);
      setVisible(true);
    };
    const sync = (event: StorageEvent) => {
      if (event.key !== COOKIE_CONSENT_KEY && event.key !== null) return;
      const choice = getAnalyticsConsent();
      setAnalyticsAllowed(choice === 'accepted');
      setVisible(choice === null);
    };
    window.addEventListener(COOKIE_PREFERENCES_OPEN, open);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_OPEN, open);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const decide = (allowed: boolean) => {
    saveAnalyticsConsent(allowed ? 'accepted' : 'rejected');
    setAnalyticsAllowed(allowed);
    setVisible(false);
    setDetails(false);
  };
  if (!visible) return null;
  return (
    <aside role="region" aria-labelledby="cookie-consent-title"
      className="fixed bottom-3 left-3 right-3 z-[110] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl text-slate-900">
      <h2 id="cookie-consent-title" className="text-lg font-bold mb-2">Çerez tercihleriniz</h2>
      <p className="text-sm text-slate-700 leading-relaxed mb-3">
        Sitenin temel işlevleri için gerekli yerel depolama kullanılır. Google Analytics yalnızca açık onayınızla yüklenir.
        Reddetmeniz siteyi kullanmanıza engel değildir. Ayrıntılar için
        <a href="/cerez-politikasi/" className="font-semibold text-blue-700 underline ml-1">Çerez Politikası</a> sayfasını inceleyiniz.
      </p>
      {details && (
        <div className="mb-4 rounded-xl border border-slate-200 p-3 space-y-3">
          <div className="flex justify-between gap-4 text-sm">
            <span><strong>Gerekli depolama</strong><span className="block text-xs text-slate-600">Temel site işlevleri</span></span>
            <span className="text-slate-600 text-xs">Etkin</span>
          </div>
          <label className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 cursor-pointer text-sm">
            <span><strong>Analitik (Google Analytics)</strong><span className="block text-xs text-slate-600">İsteğe bağlı ziyaret istatistikleri</span></span>
            <input type="checkbox" checked={analyticsAllowed}
              onChange={(event) => setAnalyticsAllowed(event.target.checked)}
              className="h-5 w-5 accent-blue-700" aria-label="Google Analytics'e izin ver" />
          </label>
          <button type="button" onClick={() => decide(analyticsAllowed)}
            className="w-full rounded-xl border border-blue-700 bg-blue-700 px-4 py-2.5 text-white font-semibold hover:bg-blue-800">
            Seçimimi Kaydet
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button type="button" onClick={() => decide(false)}
          className="rounded-xl border border-slate-500 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100">
          Reddet
        </button>
        <button type="button" onClick={() => decide(true)}
          className="rounded-xl border border-blue-700 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">
          Kabul Et
        </button>
        <button type="button" onClick={() => setDetails((prev) => !prev)} aria-expanded={details}
          className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          {details ? 'Ayrıntıları kapat' : 'Tercihler'}
        </button>
      </div>
    </aside>
  );
}
