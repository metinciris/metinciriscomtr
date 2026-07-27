import React, { useState } from 'react';
import { Menu, Home, User, BookOpen, ChevronUp, ChevronRight, X, Search } from 'lucide-react';
import { SearchModal } from './SearchModal';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

/** Sayfa adından görüntü adı üret */
const PAGE_NAMES: Record<string, string> = {
  home: 'Ana Sayfa',
  'basvuru-merkezi': 'Başvuru Merkezi',
  iletisim: 'İletişim',
  'biyopsi-sonucu': 'Biyopsi Sonucu',
  'baktigim-biyopsiler': 'Baktığım Biyopsiler',
  'nobetci-eczane': 'Nöbetçi Eczane',
  'hastane-yemek': 'Hastane Yemek',
  'ders-programi': 'Ders Programı',
  'ogrenci-yemek': 'Öğrenci Yemek',
  'donem-3': 'Dönem 3',
  galeri: 'Galeri',
  portfolyo: 'Portfolyo',
  'sinav-analizi': 'Sınav Analizi',
  yayinlar: 'Yayınlar',
  podcast: 'Podcast',
  blog: 'Blog',
  github: 'GitHub',
  facebook: 'Facebook',
  universite: 'SDÜ ve Üniversite',
  'diger-calismalar': 'Diğer Çalışmalar',
  'fetus-uzunluklari': 'Fetus Uzunlukları',
  'rcb-calculator': 'RCB Calculator',
  'gist-raporlama': 'GİST Raporlama',
  makale: 'Makale',
  deprem: 'Deprem',
  'svs-reader': 'SVS Reader',
  'tani-tuzaklari': 'Tanı Tuzakları',
  'ayin-vakasi': 'Ayın Vakası',
  'prizma-3d': 'Prizma 3D',
  finans: 'Finans',
  'makale-takip': 'Makale Takip',
  'lenf-nodu': 'Lenf Nodu',
  'pubmed-trend': 'PubMed Trend',
  'online-test-analiz': 'Online Test Analiz',
  'euro-maclar': 'Euro Maçlar',
  konsensus: 'Konsensüs',
  'konsensus-yonetim': 'Konsensüs Yönetim',
  'pubmed-makale-takip': 'PubMed Makale Takip',
  'avif-donusturucu': 'AVIF Dönüştürücü',
  'sjogren-raporlama': 'Sjögren Raporlama',
  'endoskopi-raporlama': 'Endoskopi Raporlama',
  'tiiab-raporlama': 'TİİAB Raporlama',
  'dunya-saatleri': 'Dünya Saatleri',
  'patoloji-sozlugu': 'Patoloji Sözlüğü',
  'vki-hesaplama': 'VKİ Hesaplama',
  'geri-sayim': 'Geri Sayım',
  'mitoz-donusturucu': 'Mitoz Dönüştürücü',
  'hematoloji-hesaplayici': 'Hematoloji Hesaplayıcı',
  'testis-ght-ihk': 'Testis GHT İHK',
  'tiroid-papiller-karsinom': 'Tiroid Papiller Karsinom',
  ngs: 'NGS Gen Arama',
  'ngs-test-secimi': 'NGS Test Seçimi',
  'meme-her2': 'Meme HER2',
};

const BASE_URL = 'https://metinciris.com.tr';

/** Nav item href helper */
function navHref(path: string): string {
  return path === 'home' ? '/' : `/${path}/`;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  // Scroll-to-top butonu göster/gizle
  React.useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const navItems = [
    { name: 'Ana Sayfa', path: 'home', icon: Home },
    { name: 'Biyopsi', path: 'baktigim-biyopsiler', icon: User },
  ];

  const pageName = PAGE_NAMES[currentPage] || currentPage;

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Skip to content — Erişilebilirlik */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[999] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-[#0078D4] focus:text-white focus:rounded"
      >
        İçeriğe geç
      </a>

      {/* Header */}
      {/* Header Wrapper to reserve space and prevent CLS */}
      <div className="h-20 md:h-16 w-full" aria-hidden="true" />
      <header className="bg-[#1e1e1e]/80 backdrop-blur-md text-white fixed top-0 left-0 right-0 z-50 shadow-lg border-b border-white/5 transition-colors duration-300" role="banner">
        <div className="container mx-auto px-4 max-w-none">
          <div className="flex items-center justify-between h-20 md:h-16">
            {/* Logo + isim - Left side — real <a> for SEO */}
            <a
              href="/"
              className="flex items-center space-x-3 min-h-[48px] py-2 px-2 no-underline text-white"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('home');
              }}
              aria-label="Ana sayfaya git"
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-[#00A6D6] rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src="/img/metinciris.avif"
                  alt="Prof. Dr. Metin Çiriş"
                  className="w-full h-full object-cover"
                  width={48}
                  height={48}
                />
              </div>
              <div>
                <div className="m-0 leading-tight text-lg md:text-xl font-bold">
                  Prof Dr Metin Çiriş
                </div>
                <p
                  className="text-white/70 m-0 mt-0.5"
                  style={{ fontSize: '0.75rem' }}
                >
                  Tıbbi Patoloji Uzmanı
                </p>
              </div>
            </a>

            {/* Desktop Navigation - Right side — real <a> elements */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Ana navigasyon">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={navHref(item.path)}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.path);
                  }}
                  aria-current={currentPage === item.path ? 'page' : undefined}
                  className={`px-4 py-2 flex items-center space-x-2 transition-colors no-underline ${currentPage === item.path
                    ? 'bg-[#0078D4] text-white'
                    : 'text-white/80 hover:bg-white/10'
                    }`}
                  style={{ backgroundColor: currentPage === item.path ? '#0078D4' : 'transparent' }}
                >
                  <item.icon size={18} aria-hidden="true" />
                  <span>{item.name}</span>
                </a>
              ))}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 ml-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Sitede ara"
              >
                <Search size={20} />
              </button>
            </nav>

            <div className="flex md:hidden items-center space-x-1">
              {/* Mobile Search Button */}
              <button
                type="button"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded focus:outline-none"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Sitede ara"
              >
                <Search size={22} />
              </button>
              
              {/* Mobile Menu Button */}
              <button
                type="button"
                className="p-2 hover:bg-white/10 rounded focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                aria-expanded={mobileMenuOpen}
              >
                <Menu aria-hidden="true" size={24} />
              </button>
            </div>
          </div>

          {/* Mobile Navigation Overlay */}
          {mobileMenuOpen && (
            <div
              className={`fixed inset-0 z-[100] bg-[#1e1e1e]/95 backdrop-blur-xl flex flex-col pt-24 px-6 animate-fade-in`}
            >
              {/* Close Button at top-right */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-6 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
                aria-label="Menüyü kapat"
              >
                <X size={32} />
              </button>

              <nav className="flex flex-col space-y-6" aria-label="Mobil navigasyon">
                {navItems.map((item, index) => (
                  <a
                    key={item.path}
                    href={navHref(item.path)}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-2xl font-medium flex items-center space-x-4 p-4 rounded-xl transition-all animate-slide-down no-underline ${currentPage === item.path
                      ? 'bg-blue-600/20 text-[#0078D4]'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                    style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                  >
                    <item.icon size={28} />
                    <span>{item.name}</span>
                  </a>
                ))}
              </nav>

              <div className="mt-auto mb-12 text-center text-white/40 text-sm">
                <p>© {currentYear} Prof Dr Metin Çiriş</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumb — Ana sayfa hariç */}
      {currentPage !== 'home' && currentPage !== '404' && currentPage !== 'hematoloji-hesaplayici' && (
        <nav
          aria-label="Breadcrumb"
          className="container mx-auto px-4 py-2"
        >
          <ol
            className="flex items-center gap-1 text-sm text-slate-500"
            itemScope
            itemType="https://schema.org/BreadcrumbList"
          >
            <li
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              <a
                href={`${BASE_URL}/`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('home');
                }}
                className="hover:text-slate-800 transition-colors bg-transparent border-none p-0 cursor-pointer inline-flex items-center"
                itemProp="item"
              >
                <span itemProp="name">Ana Sayfa</span>
              </a>
              <meta itemProp="position" content="1" />
            </li>
            <ChevronRight size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
            <li
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              aria-current="page"
            >
              <a
                href={`${BASE_URL}/${currentPage}/`}
                onClick={(e) => e.preventDefault()}
                className="text-slate-700 font-medium border-none p-0 cursor-default"
                itemProp="item"
              >
                <span itemProp="name">
                  {pageName}
                </span>
              </a>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>
      )}

      {/* Main Content */}
      <main id="main-content" className="min-h-[calc(100vh-8rem)]">{children}</main>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        aria-label="Sayfanın başına dön"
        className={`fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#1e1e1e] text-white shadow-lg hover:bg-[#333] hover:scale-110 active:scale-95 transition-all duration-300 ${showScrollTop
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
      >
        <ChevronUp size={22} aria-hidden="true" />
      </button>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] text-white mt-12" role="contentinfo">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3>Prof Dr Metin Çiriş</h3>
              <p className="text-white/70 mt-2">
                Tıbbi Patoloji Uzmanı
              </p>
            </div>
            <div>
              <h4>Hızlı Erişim</h4>
              <div className="flex flex-col space-y-2 mt-2">
                <a
                  href="/iletisim/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('iletisim');
                  }}
                  className="text-white/70 hover:text-white transition-colors no-underline"
                >
                  İletişim
                </a>
                <a
                  href="/yayinlar/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('yayinlar');
                  }}
                  className="text-white/70 hover:text-white transition-colors no-underline"
                >
                  Yayınlar
                </a>
                <a
                  href="/blog/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('blog');
                  }}
                  className="text-white/70 hover:text-white transition-colors no-underline"
                >
                  Blog
                </a>
              </div>
            </div>
            <div>
              <h4>İletişim Bilgileri</h4>
              <div className="text-white/70 mt-2 flex flex-col items-start">
                <a
                  href="mailto:ibrahimciris@sdu.edu.tr"
                  className="hover:text-white transition-colors flex items-center min-h-[48px] py-2"
                >
                  ibrahimciris@sdu.edu.tr
                </a>
                <a
                  href="https://www.linkedin.com/in/patoloji"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center min-h-[48px] py-2"
                >
                  LinkedIn: linkedin.com/in/patoloji
                </a>
                <a
                  href="https://fb.com/patoloji"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center min-h-[48px] py-2"
                >
                  Facebook: fb.com/patoloji
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-6 text-center text-white/60">
            <p className="m-0">
              © {currentYear} Prof Dr Metin Çiriş – Tıbbi Patoloji Uzmanı
            </p>
          </div>
        </div>
      </footer>

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onNavigate={onNavigate} 
      />
    </div>
  );
}
