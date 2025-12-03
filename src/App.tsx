import React from 'react';
import { Layout } from './components/Layout';
import { Toaster } from './components/ui/sonner';

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

export default function App() {
  const [currentPage, setCurrentPage] = React.useState('home');

  // Hash tabanlı navigation (geri/ileri butonları çalışsın)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentPage(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // ilk açılışta URL'ye göre sayfa seç

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page: string) => {
    setCurrentPage(page);
    window.location.hash = page;
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
        return <SinavAnalizi />;

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

      case 'home':
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={navigate}>
        <React.Suspense
          fallback={
            <div className="p-8 text-center text-slate-600">
              Yükleniyor…
            </div>
          }
        >
          {renderPage()}
        </React.Suspense>
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}
