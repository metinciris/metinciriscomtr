import React from 'react';
import { Layout } from './components/Layout';
import { Toaster } from 'sonner';
import { SEO } from './components/SEO';
import { validPages } from './data/pages';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * Sayfaları lazy yükle:
 * - Named export olanlar: .then(m => ({ default: m.X }))
 * - Default export olanlar: direkt import()
 */

// Home ve Hasta/Öğrenci/Akademik sayfaları
import { Home } from './pages/Home';

const Iletisim = React.lazy(() =>
  import('./pages/Iletisim').then((m) => ({ default: m.Iletisim })),
);
const ZiyaretMesaji = React.lazy(() =>
  import('./pages/ZiyaretMesaji').then((m) => ({ default: m.ZiyaretMesaji })),
);
const BiyopsiSonucu = React.lazy(() =>
  import('./pages/BiyopsiSonucu').then((m) => ({
    default: m.BiyopsiSonucu,
  })),
);
const BaktigimBiyopsiler = React.lazy(() =>
  import('./pages/BaktigimBiyopsiler').then((m) => ({ default: m.BaktigimBiyopsiler })),
);
const NobetciEczane = React.lazy(() =>
  import('./pages/NobetciEczane').then((m) => ({
    default: m.NobetciEczane,
  })),
);
const DersNotlari = React.lazy(() =>
  import('./pages/DersNotlari').then((m) => ({ default: m.DersNotlari })),
);
const DersProgrami = React.lazy(() =>
  import('./pages/DersProgrami').then((m) => ({ default: m.DersProgrami })),
);
const OgrenciYemek = React.lazy(() =>
  import('./pages/OgrenciYemek').then((m) => ({
    default: m.OgrenciYemek,
  })),
);
const HastaneYemek = React.lazy(() =>
  import('./pages/HastaneYemek').then((m) => ({
    default: m.HastaneYemek,
  })),
);
const Donem3 = React.lazy(() =>
  import('./pages/Donem3').then((m) => ({ default: m.Donem3 })),
);
const Galeri = React.lazy(() =>
  import('./pages/Galeri').then((m) => ({ default: m.Galeri })),
);

// Akademik / diğer
const Portfolyo = React.lazy(() =>
  import('./pages/Portfolyo').then((m) => ({ default: m.Portfolyo })),
);
const SinavAnalizi = React.lazy(() =>
  import('./pages/SinavAnalizi').then((m) => ({
    default: m.SinavAnalizi,
  })),
);
const Yayinlar = React.lazy(() =>
  import('./pages/Yayinlar').then((m) => ({ default: m.Yayinlar })),
);
const Blog = React.lazy(() =>
  import('./pages/Blog').then((m) => ({ default: m.Blog })),
);
const GitHubPage = React.lazy(() =>
  import('./pages/GitHub').then((m) => ({ default: m.GitHub })),
);
const FacebookPage = React.lazy(() =>
  import('./pages/Facebook').then((m) => ({ default: m.Facebook })),
);
const LinkedInPage = React.lazy(() =>
  import('./pages/LinkedIn').then((m) => ({ default: m.LinkedIn })),
);
const DigerCalismalar = React.lazy(() =>
  import('./pages/DigerCalismalar').then((m) => ({
    default: m.DigerCalismalar,
  })),
);
const FetusUzunluklari = React.lazy(() =>
  import('./pages/FetusUzunluklari').then((m) => ({
    default: m.FetusUzunluklari,
  })),
);
const RcbCalculator = React.lazy(() =>
  import('./pages/RcbCalculator').then((m) => ({
    default: m.RcbCalculator,
  })),
);
const Makale = React.lazy(() =>
  import('./pages/Makale').then((m) => ({ default: m.Makale })),
);
const Deprem = React.lazy(() =>
  import('./pages/Deprem').then((m) => ({ default: m.Deprem })),
);

// Default export olan sayfalar (Podcast, GistRaporlama)
const Podcast = React.lazy(() => import('./pages/Podcast'));
const GistRaporlama = React.lazy(() => import('./pages/GistRaporlama'));
const SvsReader = React.lazy(() =>
  import('./pages/SvsReader').then((m) => ({ default: m.SvsReader })),
);
const TaniTuzaklari = React.lazy(() =>
  import('./pages/TaniTuzaklari').then((m) => ({ default: m.TaniTuzaklari })),
);
const AyinVakasi = React.lazy(() =>
  import('./pages/AyinVakasi').then((m) => ({ default: m.AyinVakasi })),
);
const Prizma3D = React.lazy(() =>
  import('./pages/Prizma3D').then((m) => ({ default: m.Prizma3D })),
);
const Finans = React.lazy(() =>
  import('./pages/Finans').then((m) => ({ default: m.Finans })),
);
const NotFound = React.lazy(() =>
  import('./pages/NotFound').then((m) => ({ default: m.NotFound })),
);
const PatolojiMakaleTakip = React.lazy(() =>
  import('./pages/PatolojiMakaleTakip').then((m) => ({ default: m.PatolojiMakaleTakip })),
);
const LenfNoduSayaci = React.lazy(async () => import('./pages/LenfNoduSayaci').then(module => ({ default: module.LenfNoduSayaci })));
const PubMedTrend = React.lazy(() =>
  import('./pages/PubMedTrend').then((m) => ({ default: m.PubMedTrend })),
);
const OnlineTestAnaliz = React.lazy(() =>
  import('./pages/OnlineTestAnaliz').then((m) => ({ default: m.OnlineTestAnaliz })),
);
const EuroMaclar = React.lazy(() =>
  import('./pages/EuroMaclar').then((m) => ({ default: m.EuroMaclar })),
);
const Konsensus = React.lazy(() =>
  import('./pages/Konsensus').then((m) => ({ default: m.Konsensus })),
);
const PubMedMakaleTakvim = React.lazy(() =>
  import('./pages/PubMedMakaleTakvim').then((m) => ({ default: m.PubMedMakaleTakvim })),
);
const AvifConverter = React.lazy(() =>
  import('./pages/AvifConverter').then((m) => ({ default: m.AvifConverter })),
);
const SjogrenRaporlama = React.lazy(() => import('./pages/SjogrenRaporlama'));
const EndoskopiRaporlama = React.lazy(() => import('./pages/EndoskopiRaporlama'));
const TiiabRaporlama = React.lazy(() => import('./pages/TiiabRaporlama'));
const DunyaSaatleri = React.lazy(() =>
  import('./pages/DunyaSaatleri').then((m) => ({ default: m.DunyaSaatleri })),
);

import { trackPageView } from './utils/analytics';

export default function App() {
  const [currentPage, setCurrentPage] = React.useState('home');

  // Sayfa değiştikçe analytics gönder
  React.useEffect(() => {
    trackPageView(currentPage);
  }, [currentPage]);

  // Path'ten sayfa adını çıkar
  const getPageFromPath = (pathname: string): string => {
    // Başındaki slash'ı kaldır, sondaki slash'ı kaldır
    const path = pathname.replace(/^\//, '').replace(/\/$/, '') || 'home';
    return validPages.includes(path) ? path : '404';
  };

  // Path tabanlı navigation (SEO dostu)
  React.useEffect(() => {
    // 1. GitHub Pages 404 yönlendirmesini kontrol et
    const redirectPath = sessionStorage.getItem('spa-redirect-path');
    if (redirectPath) {
      sessionStorage.removeItem('spa-redirect-path');
      const page = getPageFromPath(redirectPath);
      setCurrentPage(page);
      // URL'yi güncelle (browser history'ye ekle)
      window.history.replaceState({ page }, '', redirectPath);
      return;
    }

    // 2. Hash tabanlı URL'ler artık desteklenmiyor - yönlendirme yok
    // Eski hash URL'leri (#sayfa-ismi) artık geçersiz ve işlenmeyecek
    // Bu URL'ler zaten Google indeksinde sorun yaratıyordu

    // 3. Normal path-based routing
    const handlePathChange = () => {
      const page = getPageFromPath(window.location.pathname);
      setCurrentPage(page);
    };

    // Popstate: geri/ileri butonları için
    window.addEventListener('popstate', handlePathChange);
    handlePathChange(); // ilk açılışta URL'ye göre sayfa seç

    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  const navigate = (page: string) => {
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({ page }, '', path);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const renderPage = () => {
    switch (currentPage) {
      // Hasta Bölümü
      case 'iletisim':
        return <Iletisim />;
      case 'ziyaret-mesaji':
        return <ZiyaretMesaji />;
      case 'biyopsi-sonucu':
        return <BiyopsiSonucu />;
      case 'baktigim-biyopsiler':
        return <BaktigimBiyopsiler />;
      case 'nobetci-eczane':
        return <NobetciEczane />;
      case 'hastane-yemek':
        return <HastaneYemek />;

      // Öğrenci Bölümü
      case 'ders-notlari':
        return <DersNotlari />;
      case 'ders-programi':
        return <DersProgrami />;
      case 'ogrenci-yemek':
        return <OgrenciYemek />;
      case 'donem-3':
        return <Donem3 />;
      case 'galeri':
        return <Galeri />;

      // Akademik / diğer
      case 'portfolyo':
        return <Portfolyo />;
      case 'sinav-analizi':
        return <SinavAnalizi onNavigate={navigate} />;

      case 'yayinlar':
        return <Yayinlar />;

      case 'podcast':
        return <Podcast onNavigate={navigate} />;

      case 'blog':
        return <Blog />;

      case 'github':
        return <GitHubPage />;

      case 'facebook':
        return <FacebookPage />;

      case 'linkedin':
        return <LinkedInPage />;

      case 'diger-calismalar':
        return <DigerCalismalar onNavigate={navigate} />;

      case 'fetus-uzunluklari':
        return <FetusUzunluklari />;

      case 'rcb-calculator':
        return <RcbCalculator />;

      case 'gist-raporlama':
        return <GistRaporlama />;

      case 'makale':
        return <Makale onNavigate={navigate} />;

      case 'deprem':
        return <Deprem />;

      case 'svs-reader':
        return <SvsReader />;

      case 'tani-tuzaklari':
        return <TaniTuzaklari />;

      case 'ayin-vakasi':
        return <AyinVakasi />;

      case 'prizma-3d':
        return <Prizma3D />;

      case 'finans':
        return <Finans />;

      case 'makale-takip':
        return <PatolojiMakaleTakip />;

      case 'lenf-nodu':
        return <LenfNoduSayaci />;

      case 'pubmed-trend':
        return <PubMedTrend />;

      case 'online-test-analiz':
        return <OnlineTestAnaliz />;

      case 'euro-maclar':
        return <EuroMaclar />;

      case 'konsensus':
        return <Konsensus />;

      case 'pubmed-makale-takip':
        return <PubMedMakaleTakvim />;

      case 'avif-donusturucu':
        return <AvifConverter />;

      case 'sjogren-raporlama':
        return <SjogrenRaporlama />;

      case 'endoskopi-raporlama':
        return <EndoskopiRaporlama />;

      case 'tiiab-raporlama':
        return <TiiabRaporlama />;

      case 'dunya-saatleri':
        return <DunyaSaatleri />;

      case '404':
        return <NotFound onNavigate={navigate} />;

      case 'home':
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <>
      <SEO currentPage={currentPage} />
      <Layout currentPage={currentPage} onNavigate={navigate}>
        <ErrorBoundary>
          <React.Suspense
            fallback={
              <div className="p-8 space-y-4 animate-pulse" role="status" aria-label="Sayfa yükleniyor">
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
            {renderPage()}
          </React.Suspense>
        </ErrorBoundary>
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}
