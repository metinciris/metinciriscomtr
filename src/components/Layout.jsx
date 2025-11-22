import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
        window.scrollTo(0, 0);
    }, [location]);

    return (
        <div className="min-h-screen bg-dark-900 text-white font-sans selection:bg-primary selection:text-white">
            <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-dark-900/90 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'}`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold tracking-tighter">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            METİN CİRİŞ
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <NavLink to="/">Ana Sayfa</NavLink>
                        <NavLink to="/hakkimda">Hakkımda</NavLink>
                        <NavLink to="/blog">Blog</NavLink>
                        <NavLink to="/iletisim">İletişim</NavLink>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white focus:outline-none"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden absolute w-full bg-dark-900/95 backdrop-blur-xl transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="flex flex-col items-center py-8 space-y-6">
                        <NavLink to="/">Ana Sayfa</NavLink>
                        <NavLink to="/hakkimda">Hakkımda</NavLink>
                        <NavLink to="/blog">Blog</NavLink>
                        <NavLink to="/iletisim">İletişim</NavLink>
                    </div>
                </div>
            </nav>

            <main className="pt-24 min-h-screen">
                {children}
            </main>

            <footer className="bg-dark-800 py-12 border-t border-white/5">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-gray-400 mb-4">Prof. Dr. İ. Metin Çiriş &copy; {new Date().getFullYear()}</p>
                    <div className="flex justify-center space-x-6">
                        <a href="https://github.com/metinciris" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">GitHub</a>
                        <a href="https://linkedin.com/in/metinciris" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors">LinkedIn</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const NavLink = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`text-sm font-medium tracking-wide transition-all duration-300 hover:text-primary ${isActive ? 'text-primary' : 'text-gray-300'}`}
        >
            {children}
        </Link>
    );
};

export default Layout;
