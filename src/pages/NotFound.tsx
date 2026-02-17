import React, { useState, useEffect } from 'react';
import { Home, AlertTriangle, ChevronRight, Search, FileText, Activity, Layers, Mail, MessageSquare, Utensils, Clock } from 'lucide-react';

interface NotFoundProps {
    onNavigate?: (page: string) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onNavigate }) => {
    const [countdown, setCountdown] = useState(15);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (onNavigate) {
                        onNavigate('home');
                    } else {
                        window.location.hash = 'home';
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onNavigate]);

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
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center" role="main">
            {/* Animated 404 Hero */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 blur-3xl opacity-15 animate-pulse rounded-full scale-150" />
                <div className="relative z-10 flex items-center justify-center">
                    <span className="text-[8rem] md:text-[10rem] font-black bg-gradient-to-br from-slate-800 via-red-600 to-orange-500 bg-clip-text text-transparent leading-none select-none">
                        404
                    </span>
                </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
                Aradığınız Sayfayı Bulamadık
            </h1>
            <p className="max-w-md text-slate-500 mb-4 leading-relaxed">
                Üzgünüz, aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
            </p>

            {/* Auto-redirect countdown */}
            <div className="flex items-center gap-2 mb-8 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} aria-hidden="true" />
                <span>{countdown} saniye içinde anasayfaya yönlendirileceksiniz</span>
            </div>

            {/* Suggested Pages */}
            <div className="w-full max-w-4xl mb-8">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Popüler Sayfalar
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {links.map((link) => (
                        <button
                            key={link.target}
                            onClick={() => handleLinkClick(link.target)}
                            aria-label={`${link.label} sayfasına git`}
                            className="group flex items-center p-3 gap-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 hover:scale-[1.02] transition-all duration-200 text-left active:scale-100"
                        >
                            <div
                                style={{ backgroundColor: link.color }}
                                className="p-2.5 rounded-lg text-white group-hover:scale-110 transition-transform shadow-md shrink-0"
                            >
                                <link.icon className="w-5 h-5 text-white" aria-hidden="true" />
                            </div>
                            <span className="font-medium text-slate-700 text-sm leading-tight flex-1">{link.label}</span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transform group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => handleLinkClick('home')}
                aria-label="Anasayfaya dön"
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full font-bold shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-none"
            >
                <Home className="w-5 h-5 text-white" aria-hidden="true" />
                <span className="text-white">Anasayfaya Dön</span>
            </button>
        </div>
    );
};

export default NotFound;
