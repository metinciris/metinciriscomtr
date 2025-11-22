import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
                <div className="container flex justify-between items-center py-4">
                    <Link to="/" className="text-xl font-bold tracking-tight">
                        Metin Ciriş
                    </Link>

                    <div className="flex gap-8 text-sm font-medium text-gray-600">
                        <NavLink to="/">Ana Sayfa</NavLink>
                        <NavLink to="/hakkimda">Hakkımda</NavLink>
                        <NavLink to="/blog">Blog</NavLink>
                        <NavLink to="/iletisim">İletişim</NavLink>
                    </div>
                </div>
            </nav>

            <main className="flex-grow">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
                <div className="container text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Prof. Dr. İ. Metin Çiriş. Tüm hakları saklıdır.</p>
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
            className={`transition-colors hover:text-black ${isActive ? 'text-black font-semibold' : ''}`}
        >
            {children}
        </Link>
    );
};

export default Layout;
