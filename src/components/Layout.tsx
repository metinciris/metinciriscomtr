import React from 'react';
import { Menu, Home, User, GraduationCap, BookOpen } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Ana Sayfa', path: 'home', icon: Home },
    { name: 'Hakkımda', path: 'ben-kimim', icon: User },
    { name: 'Akademik', path: 'yayinlar', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Header */}
      <header className="bg-[#1e1e1e] text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20 md:h-16">
            {/* Logo + isim */}
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              {/* YENİ: metinciris.jpg avatarı */}
              <div className="w-12 h-12 bg-[#00A6D6] rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src="/img/metinciris.jpg"
                  alt="Prof. Dr. Metin Çiriş"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
<h1 className="m-0 leading-tight text-lg md:text-xl">
  Prof Dr Metin Çiriş
</h1>
<p
  className="text-white/70 m-0 mt-0.5"
  style={{ fontSize: '0.75rem' }}
>
  SDÜ Tıp Fakültesi Tıbbi Patoloji
</p>

              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
                    currentPage === item.path
                      ? 'bg-[#0078D4] text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
<button
  type="button"
  className="md:hidden p-2 hover:bg-white/10 rounded"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
  aria-expanded={mobileMenuOpen}
>
  <Menu aria-hidden="true" size={24} />
</button>

          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 flex items-center space-x-2 transition-colors ${
                    currentPage === item.path
                      ? 'bg-[#0078D4] text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] text-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3>Prof Dr Metin Çiriş</h3>
              <p className="text-white/70 mt-2">
                Süleyman Demirel Üniversitesi
                <br />
                Tıp Fakültesi Tıbbi Patoloji Anabilim Dalı
              </p>
            </div>
            <div>
              <h4>Hızlı Erişim</h4>
              <div className="flex flex-col space-y-2 mt-2">
                <button
                  onClick={() => onNavigate('iletisim')}
                  className="text-white/70 hover:text-white text-left transition-colors"
                >
                  İletişim
                </button>
                <button
                  onClick={() => onNavigate('ders-programi')}
                  className="text-white/70 hover:text-white text-left transition-colors"
                >
                  Ders Programı
                </button>
                <button
                  onClick={() => onNavigate('yayinlar')}
                  className="text-white/70 hover:text-white text-left transition-colors"
                >
                  Yayınlar
                </button>
               </div>
            </div>
            <div>
              <h4>İletişim Bilgileri</h4>
              <div className="text-white/70 mt-2 space-y-1">
                <p className="m-0">
                  <a
                    href="mailto:ibrahimciris@sdu.edu.tr"
                    className="hover:text-white transition-colors"
                  >
                    ibrahimciris@sdu.edu.tr
                  </a>
                </p>
                <p className="m-0 mt-4">
                  <a
                    href="https://www.linkedin.com/in/patoloji"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    LinkedIn: linkedin.com/in/patoloji
                  </a>
                </p>
                <p className="m-0">
                  <a
                    href="https://fb.com/patoloji"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Facebook: fb.com/patoloji
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-6 text-center text-white/60">
           <p className="m-0">
          © {currentYear} Prof Dr Metin Çiriş - SDÜ Tıp Fakültesi Tıbbi Patoloji
        </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
