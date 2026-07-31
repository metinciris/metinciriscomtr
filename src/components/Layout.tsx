import React, { useState } from 'react';
import {
  Menu,
  Home,
  Users,
  FileText,
  BookOpen,
  GraduationCap,
  Wrench,
  ChevronUp,
  ChevronRight,
  ChevronDown,
  X,
  Search,
} from 'lucide-react';
import { SearchModal } from './SearchModal';
import { PAGE_REGISTRY, getPagesByGroup, getNavLabel, type NavGroup } from '../core/data/registry';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const BASE_URL = 'https://metinciris.com.tr';

/** Nav item href helper */
function navHref(path: string): string {
  return path === 'home' ? '/' : `/${path}/`;
}

/** Mega menü hub tanımları */
const NAV_HUBS: { id: NavGroup; label: string; icon: React.ElementType }[] = [
  { id: 'hastalar', label: 'Hastalar', icon: Users },
  { id: 'raporlama', label: 'Raporlama', icon: FileText },
  { id: 'egitim', label: 'Eğitim', icon: GraduationCap },
  { id: 'akademik', label: 'Akademik', icon: BookOpen },
  { id: 'araclar', label: 'Araçlar', icon: Wrench },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [openMobileHub, setOpenMobileHub] = React.useState<NavGroup | null>(null);
  const [activeHub, setActiveHub] = React.useState<NavGroup | null>(null);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  // Scroll-to-top butonu göster/gizle
  React.useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Menü dışına tıklandığında kapat
  const menuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveHub(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+K / Cmd+K arama kısayolu
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const pageName = getNavLabel(currentPage);

  // Mevcut sayfanın hangi hub'a ait olduğunu bul
  const currentGroup = PAGE_REGISTRY[currentPage]?.navGroup;

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setActiveHub(null);
    setMobileMenuOpen(false);
    setOpenMobileHub(null);
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Skip to content — Erişilebilirlik */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[999] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-[#0078D4] focus:text-white focus:rounded"
      >
        İçeriğe geç
      </a>

      {/* Header Wrapper to reserve space and prevent CLS */}
      <div className="h-20 md:h-16 w-full" aria-hidden="true" />
      <header
        className="bg-[#1e1e1e]/80 backdrop-blur-md text-white fixed top-0 left-0 right-0 z-50 shadow-lg border-b border-white/5 transition-colors duration-300"
        role="banner"
      >
        <div className="container mx-auto px-4 max-w-none">
          <div className="flex items-center justify-between h-20 md:h-16" ref={menuRef}>
            {/* Logo + isim - Left side */}
            <a
              href="/"
              className="flex items-center space-x-3 min-h-[48px] py-2 px-2 no-underline text-white"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home');
              }}
              aria-label="Ana sayfaya git"
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-[#00A6D6] rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src="/img/avatar-96.avif"
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Ana navigasyon">
              {/* Ana Sayfa */}
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}
                aria-current={currentPage === 'home' ? 'page' : undefined}
                className={`px-3 py-2 flex items-center space-x-1.5 transition-colors no-underline rounded text-sm ${
                  currentPage === 'home'
                    ? 'bg-[#0078D4] text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Home size={16} aria-hidden="true" />
                <span>Ana Sayfa</span>
              </a>

              {/* Hub dropdown'ları */}
              {NAV_HUBS.map((hub) => {
                const hubPages = getPagesByGroup(hub.id);
                const isHubActive = currentGroup === hub.id;
                const isOpen = activeHub === hub.id;
                const Icon = hub.icon;

                return (
                  <div key={hub.id} className="relative">
                    <button
                      onClick={() => setActiveHub(isOpen ? null : hub.id)}
                      onKeyDown={(e) => e.key === 'Escape' && setActiveHub(null)}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      className={`px-3 py-2 flex items-center space-x-1.5 transition-colors rounded text-sm focus:outline-none focus:ring-2 focus:ring-white/20 ${
                        isHubActive
                          ? 'bg-[#0078D4] text-white'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{hub.label}</span>
                      <ChevronDown
                        size={14}
                        aria-hidden="true"
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown panel */}
                    {isOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 w-56 bg-[#1e1e1e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-[200] animate-fade-in"
                        role="menu"
                      >
                        {hubPages.map((page) => (
                          <a
                            key={page.id}
                            href={navHref(page.id)}
                            onClick={(e) => { e.preventDefault(); handleNavClick(page.id); }}
                            aria-current={currentPage === page.id ? 'page' : undefined}
                            role="menuitem"
                            className={`block px-4 py-2.5 text-sm transition-colors no-underline ${
                              currentPage === page.id
                                ? 'text-[#0078D4] bg-blue-600/10'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {page.navLabel ?? page.id}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Arama */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-3 py-1.5 ml-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center space-x-2 text-sm"
                aria-label="Sitede ara (Ctrl+K)"
                title="Sitede ara (Ctrl+K)"
              >
                <Search size={18} />
                <span className="hidden lg:inline text-xs text-white/60">Ara</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-white/70 bg-white/10 border border-white/20 rounded">
                  Ctrl+K
                </kbd>
              </button>
            </nav>

            {/* Mobil: Arama + Hamburger */}
            <div className="flex md:hidden items-center space-x-1">
              <button
                type="button"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded focus:outline-none"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Sitede ara"
              >
                <Search size={22} />
              </button>
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
        </div>
      </header>

      {/* Mobil Menü Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-[#1e1e1e]/95 backdrop-blur-xl flex flex-col pt-24 px-4 overflow-y-auto animate-fade-in">
          {/* Kapat butonu */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-6 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
            aria-label="Menüyü kapat"
          >
            <X size={32} />
          </button>

          <nav className="flex flex-col space-y-2" aria-label="Mobil navigasyon">
            {/* Ana Sayfa */}
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}
              className={`flex items-center space-x-3 p-4 rounded-xl transition-all no-underline text-xl font-medium ${
                currentPage === 'home'
                  ? 'bg-blue-600/20 text-[#0078D4]'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home size={24} />
              <span>Ana Sayfa</span>
            </a>

            {/* Hub accordion'ları */}
            {NAV_HUBS.map((hub) => {
              const hubPages = getPagesByGroup(hub.id);
              const isOpen = openMobileHub === hub.id;
              const Icon = hub.icon;

              return (
                <div key={hub.id}>
                  <button
                    onClick={() => setOpenMobileHub(isOpen ? null : hub.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-xl font-medium focus:outline-none ${
                      currentGroup === hub.id
                        ? 'bg-blue-600/20 text-[#0078D4]'
                        : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={24} />
                      <span>{hub.label}</span>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Accordion içeriği */}
                  {isOpen && (
                    <div className="ml-4 mt-1 flex flex-col space-y-1">
                      {hubPages.map((page) => (
                        <a
                          key={page.id}
                          href={navHref(page.id)}
                          onClick={(e) => { e.preventDefault(); handleNavClick(page.id); }}
                          className={`block px-4 py-3 rounded-lg text-base transition-all no-underline ${
                            currentPage === page.id
                              ? 'text-[#0078D4] bg-blue-600/10'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {page.navLabel ?? page.id}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-auto mb-12 pt-8 text-center text-white/40 text-sm">
            <p>© {currentYear} Prof Dr Metin Çiriş</p>
          </div>
        </div>
      )}

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
                <span itemProp="name">{pageName}</span>
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
        className={`fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#1e1e1e] text-white shadow-lg hover:bg-[#333] hover:scale-110 active:scale-95 transition-all duration-300 ${
          showScrollTop
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
