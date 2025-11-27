import React from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Iletisim } from './pages/Iletisim';
import { ZiyaretMesaji } from './pages/ZiyaretMesaji';
import { BiyopsiSonucu } from './pages/BiyopsiSonucu';
import { BenKimim } from './pages/BenKimim';
import { NobetciEczane } from './pages/NobetciEczane';
import { DersNotlari } from './pages/DersNotlari';
import { DersProgrami } from './pages/DersProgrami';
import { OgrenciYemek } from './pages/OgrenciYemek';
import { HastaneYemek } from './pages/HastaneYemek';
import { Donem3 } from './pages/Donem3';
import { Portfolyo } from './pages/Portfolyo';
import { SinavAnalizi } from './pages/SinavAnalizi';
import { Yayinlar } from './pages/Yayinlar';
import Profil from './pages/Profil';
import { Blog } from './pages/Blog';
import { GitHub } from './pages/GitHub';
import { Facebook } from './pages/Facebook';
import { LinkedIn } from './pages/LinkedIn';
import { DigerCalismalar } from './pages/DigerCalismalar';
import { FetusUzunluklari } from './pages/FetusUzunluklari';
import { RcbCalculator } from './pages/RcbCalculator';
import GistRaporlama from './pages/GistRaporlama';
import { Galeri } from './pages/Galeri';

import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentPage, setCurrentPage] = React.useState('home');

  // Handle browser back/forward buttons
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentPage(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Set initial page based on URL hash

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
      case 'ben-kimim':
        return <BenKimim />;
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
      case 'portfolyo':
        return <Portfolyo />;
      case 'sinav-analizi':
        return <SinavAnalizi />;

      // Akademik Bölümü
      case 'yayinlar':
        return <Yayinlar />;
      case 'profil':
        return <Profil onNavigate={navigate} />;

      case 'blog':
        return <Blog />;

      case 'github':
        return <GitHub />;

      case 'facebook':
        return <Facebook />;

      case 'linkedin':
        return <LinkedIn />;

      case 'diger-calismalar':
        return <DigerCalismalar onNavigate={navigate} />;

      case 'fetus-uzunluklari':
        return <FetusUzunluklari />;

      case 'rcb-calculator':
        return <RcbCalculator />;

      case 'gist-raporlama':
        return <GistRaporlama />;

      case 'home':
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={navigate}>
        {renderPage()}
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}
