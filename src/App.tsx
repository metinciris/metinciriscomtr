/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';

import { Layout } from './components/Layout';
import { Toaster } from 'sonner';
import { SEO } from './components/SEO';
import { PAGE_REGISTRY, validPages, getNavLabel } from './core/data/registry';
import { ErrorBoundary } from './components/ErrorBoundary';
import { trackPageView } from './utils/analytics';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComponent = React.LazyExoticComponent<React.ComponentType<any>>;

/**
 * Sayfa bileşenlerini cache'le.
 * React.lazy() her zaman aynı referansı döndürmeli — render içinde
 * yeni React.lazy() çağırmak React'in component type'ı değişmiş
 * sanmasına ve her seferinde unmount/remount yapmasına neden olur.
 */
const lazyCache: Record<string, LazyComponent> = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notFoundLazy: LazyComponent = React.lazy(() =>
  import('./pages/NotFound').then(m => ({ default: m.NotFound }))
);

function getLazy(pageId: string): LazyComponent {
  if (!lazyCache[pageId]) {
    if (pageId === 'konsensus-toplanti') {
      lazyCache[pageId] = React.lazy(() =>
        import('./pages/KonsensusToplanti').then(m => ({ default: m.KonsensusToplanti }))
      );
      return lazyCache[pageId];
    }

    const meta = PAGE_REGISTRY[pageId];
    if (meta?.load) {
      lazyCache[pageId] = React.lazy(meta.load);
    } else {
      lazyCache[pageId] = notFoundLazy;
    }
  }
  return lazyCache[pageId];
}

export default function App() {
  const [currentPage, setCurrentPage] = React.useState('home');
  const [routeAnnouncement, setRouteAnnouncement] = React.useState('');

  // Sayfa değiştikçe analytics gönder, odağı <main> öğesine taşı ve ekran okuyucuya bildir
  React.useEffect(() => {
    const registryPage = currentPage === 'konsensus-toplanti' ? 'konsensus' : currentPage;
    trackPageView(registryPage);

    const pageLabel = getNavLabel(registryPage);
    setRouteAnnouncement(`${pageLabel} sayfası yüklendi.`);

    // Klavye odağını ana içeriğe geçir (a11y)
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.setAttribute('tabindex', '-1');
      mainEl.focus({ preventScroll: true });
    }
  }, [currentPage]);

  // Path'ten sayfa adını çıkar
  const getPageFromPath = React.useCallback((pathname: string): string => {
    const path = pathname.replace(/^\/+|\/+$/g, '') || 'home';

    // Blog ana sayfası, sayfalama ve tekil yazı adresleri
    if (path === 'blog' || path.startsWith('blog/')) {
      return 'blog';
    }

    // Konsensus toplantı detay sayfası: /konsensus/toplanti/:id
    if (/^konsensus\/toplanti\/[^/]+$/.test(path)) {
      return 'konsensus-toplanti';
    }

    return validPages.includes(path) ? path : '404';
  }, []);

  // Path tabanlı navigation (SEO dostu)
  React.useEffect(() => {
    // 1. GitHub Pages 404 yönlendirmesini kontrol et
    const redirectPath = sessionStorage.getItem('spa-redirect-path');

    if (redirectPath) {
      sessionStorage.removeItem('spa-redirect-path');
      const page = getPageFromPath(redirectPath);
      setCurrentPage(page);
      window.history.replaceState({ page }, '', redirectPath);
      return;
    }

    // 2. Normal path-based routing
    const handlePathChange = () => {
      const page = getPageFromPath(window.location.pathname);
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePathChange);
    handlePathChange();

    return () => window.removeEventListener('popstate', handlePathChange);
  }, [getPageFromPath]);

  const navigate = React.useCallback((page: string) => {
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({ page }, '', path);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const registryPage = currentPage === 'konsensus-toplanti' ? 'konsensus' : currentPage;
  const pageMeta = PAGE_REGISTRY[registryPage];

  // getLazy her zaman aynı React.lazy referansını döndürür — cache sayesinde
  const Page = getLazy(currentPage);

  const pageProps = pageMeta?.onNavigateProp ? { onNavigate: navigate } : {};

  return (
    <>
      <SEO currentPage={registryPage} />

      {/* Ekran okuyucular için dinamik yönlendirme duyurusu (a11y) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {routeAnnouncement}
      </div>

      <Layout currentPage={registryPage} onNavigate={navigate}>
        <ErrorBoundary>
          <React.Suspense
            fallback={
              <div
                className="p-8 space-y-4 animate-pulse"
                role="status"
                aria-label="Sayfa yükleniyor"
              >
                <div className="h-8 bg-slate-200 rounded-lg w-1/3 mx-auto" />
                <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="h-32 bg-slate-200 rounded-xl" />
                  <div className="h-32 bg-slate-200 rounded-xl" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
                <span className="sr-only">Yükleniyor…</span>
              </div>
            }
          >
            <Page {...pageProps} />
          </React.Suspense>
        </ErrorBoundary>
      </Layout>

      <Toaster position="top-right" />
    </>
  );
}
