import React, { useState } from 'react';
import { LogIn, LogOut, MousePointer2 } from 'lucide-react';

interface AdminPanelProps {
    isAdmin: boolean;
    onLogin: (email: string, password: string) => Promise<boolean>;
    onLogout: () => Promise<void>;
}

export function AdminPanel({ isAdmin, onLogin, onLogout }: AdminPanelProps) {
    const [showLogin, setShowLogin] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [clickCount, setClickCount] = useState(0);
    const [verified, setVerified] = useState(false);

    const handleVerifyClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 3) setVerified(true);
    };

    const resetVerification = () => {
        setClickCount(0);
        setVerified(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verified) return;

        setLoading(true);
        setError('');
        const ok = await onLogin(credentials.email, credentials.password);
        if (!ok) setError('Geçersiz e-posta veya şifre');
        setLoading(false);
        if (ok) {
            setShowLogin(false);
            setCredentials({ email: '', password: '' });
            resetVerification();
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        await onLogout();
        setLoading(false);
    };

    if (isAdmin) {
        return (
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-900">Admin Paneli</h2>
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 transition flex items-center font-black"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {loading ? 'Çıkış…' : 'Çıkış Yap'}
                    </button>
                </div>
                <p className="text-gray-600 mt-2 text-sm">Admin olarak giriş yaptınız. Toplantı ekleyip silebilirsiniz.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-900">Admin Paneli</h2>
                <button
                    onClick={() => {
                        setShowLogin(!showLogin);
                        if (!showLogin) resetVerification();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition flex items-center font-black"
                >
                    <LogIn className="w-4 h-4 mr-2" />
                    Giriş Yap
                </button>
            </div>

            {showLogin && (
                <div className="mt-6 space-y-4">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-black text-gray-700">Fare Doğrulaması</span>
                            <span className="text-xs text-gray-500">{clickCount}/3 tık</span>
                        </div>

                        {verified ? (
                            <div className="bg-green-100 text-green-800 py-3 px-4 rounded-xl flex items-center justify-center border-2 border-green-300">
                                <span className="text-sm font-black">✅ Tamam</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleVerifyClick}
                                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 py-3 px-4 rounded-xl transition flex items-center justify-center border-2 border-blue-300 font-black"
                            >
                                <MousePointer2 className="w-5 h-5 mr-2" />
                                Buraya {3 - clickCount} kez daha tıklayın
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            placeholder="E-posta"
                            value={credentials.email}
                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={!verified}
                            autoComplete="email"
                        />
                        <input
                            type="password"
                            placeholder="Şifre"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={!verified}
                            autoComplete="current-password"
                        />
                        {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading || !verified}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition font-black"
                        >
                            {loading ? 'Giriş…' : 'Giriş Yap'}
                        </button>
                    </form>

                    {!verified && <p className="text-xs text-gray-500 text-center">Giriş yapmak için önce fare doğrulamasını tamamlayın</p>}
                </div>
            )}
        </div>
    );
}
