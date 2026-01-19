import React, { useEffect, useState } from 'react';
import { Utensils } from 'lucide-react';

interface MenuData {
    date: string;
    items: string[];
    kcal: string | null;
    source: string;
    updatedAt: string;
}

export function StudentLunchMenu() {
    const [menu, setMenu] = useState<MenuData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/data/ogrenci-ogle-menu.json')
            .then((res) => {
                if (!res.ok) throw new Error('Menu not found');
                return res.json();
            })
            .then((data: MenuData) => {
                // Only show if it's today's menu and items exist
                const now = new Date();
                const todayStr = new Intl.DateTimeFormat('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }).format(now).replace(/\//g, '.');

                if (data.date === todayStr && data.items && data.items.length > 0) {
                    setMenu(data);
                } else {
                    setMenu(null);
                }
            })
            .catch((err) => {
                console.error('Error fetching student menu:', err);
                setMenu(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading || !menu) return null;

    return (
        <div className="bg-white rounded-xl p-5 shadow-md border border-[#98FB98] mb-6">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-[#98FB98]/30 rounded-lg text-green-700">
                    <Utensils size={20} />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                    🎓 Öğrenci Öğle Menüsü (SDÜ)
                </h2>
            </div>

            <div className="space-y-1 mb-4">
                {menu.items.map((item, index) => (
                    <p key={index} className="text-sm sm:text-base text-gray-700 font-medium border-l-2 border-[#98FB98] pl-3 py-0.5">
                        {item}
                    </p>
                ))}
                {menu.kcal && (
                    <p className="text-xs sm:text-sm text-gray-500 italic mt-2 pl-3">
                        ({menu.kcal} kcal)
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">
                    Güncelleme: {new Date(menu.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <a
                    href={menu.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                >
                    Resmi Liste
                </a>
            </div>
        </div>
    );
}
