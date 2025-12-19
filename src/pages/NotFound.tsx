import React from 'react';
import { Home, AlertTriangle, ChevronRight, Search, FileText, Activity, Layers, Mail, MessageSquare, Utensils } from 'lucide-react';

interface NotFoundProps {
    onNavigate?: (page: string) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onNavigate }) => {
    const links = [
        { label: 'Anasayfa', icon: Home, target: 'home', color: '#00A6D6' },
        { label: 'Patoloji Tanı Tuzakları', icon: Search, target: 'tani-tuzaklari', color: '#f59e0b' },
        { label: 'Baktığım Biyopsiler', icon: FileText, target: 'baktigim-biyopsiler', color: '#0078D4' },
        { label: 'SVS Mikroskopi Reader', icon: Layers, target: 'svs-reader', color: '#8E44AD' },
        { label: 'Deprem Takibi', icon: Activity, target: 'deprem', color: '#dc2626' },
        { label: 'Blog / Yayınlar', icon: MessageSquare, target: 'blog', color: '#9333ea' },
        { label: 'İletişim', icon: Mail, target: 'iletisim', color: '#0ea5e9' },
        { label: 'Hastane Yemek', icon: Utensils, target: 'hastane-yemek', color: '#16A085' },
    ];

    const handleLinkClick = (target: string) => {
        if (onNavigate) {
            onNavigate(target);
        } else {
            window.location.hash = target;
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
            {/* Animated 404 Icon */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-400 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                <AlertTriangle className="w-24 h-24 text-red-500 relative z-10 mx-auto" strokeWidth={1.5} />
            </div>

            <h1 className="text-6xl font-black text-slate-800 mb-2 tracking-tighter">404</h1>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Aradığınız Sayfayı Bulamadık</h2>
            <p className="max-w-md text-slate-500 mb-12 leading-relaxed">
                Üzgünüz, aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir. Aşağıdaki hızlı bağlantıları kullanarak sitenin en popüler bölümlerine göz atabilirsiniz.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
                {links.map((link) => (
                    <button
                        key={link.target}
                        onClick={() => handleLinkClick(link.target)}
                        className="group flex items-center p-4 pl-6 gap-8 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-2xl hover:border-slate-300 hover:scale-[1.03] transition-all duration-300 text-left active:scale-100"
                    >
                        <div
                            style={{ backgroundColor: link.color }}
                            className="p-3 rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg shrink-0"
                        >
                            <link.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <span className="font-semibold text-slate-800 block leading-tight">{link.label}</span>
                            <span className="text-xs text-slate-400">Gitmek için tıklayın</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transform group-hover:translate-x-1 transition-all" />
                    </button>
                ))}
            </div>

            <button
                onClick={() => handleLinkClick('home')}
                style={{ backgroundColor: '#4f46e5' }}
                className="mt-12 px-8 py-4 text-white rounded-full font-bold shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-none ring-offset-2 hover:ring-2 hover:ring-indigo-300"
            >
                <Home className="w-5 h-5 text-white" />
                <span className="text-white">Anasayfaya Dön</span>
            </button>

            <div className="mt-16 text-slate-400 text-sm italic">
                "Aradığınız şey belki de sizi başka bir yerde bekliyordur."
            </div>
        </div>
    );
};


export default NotFound;
