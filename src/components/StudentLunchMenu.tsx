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
    const [menu, setMenu] = useState<{ items: string[], kcal: string | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(true);

    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1rXB81K4CkGT1wrtRGOnqVVRZB8g5GxpvP4TqAXu4BSE/export?format=csv&gid=711889518';

    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const parseCSV = (csv: string) => {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = '';
        let inQuotes = false;

        for (let i = 0; i < csv.length; i++) {
            const char = csv[i];
            const nextChar = csv[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                currentRow.push(currentCell.trim());
                currentCell = '';
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') i++;
                currentRow.push(currentCell.trim());
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        if (currentCell) currentRow.push(currentCell.trim());
        if (currentRow.length > 0) rows.push(currentRow);
        return rows;
    };

    useEffect(() => {
        const fetchMenu = async () => {
            setLoading(true);
            setHasData(true);
            try {
                const response = await fetch(SHEET_URL);
                const csv = await response.text();
                const rows = parseCSV(csv);

                const today = formatDate(new Date());
                const todayRow = rows.find(r => r[0] === today);

                if (todayRow && todayRow[2]) {
                    setMenu({
                        items: todayRow[2].split('\n').filter(Boolean),
                        kcal: todayRow[3] || null
                    });
                } else {
                    setMenu(null);
                    setHasData(false);
                }
            } catch (error) {
                console.error('Error fetching student menu:', error);
                setMenu(null);
                setHasData(false);
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, []);

    if (loading) return null;

    if (!hasData || !menu) {
        return (
            <div className="bg-white rounded-xl p-5 shadow-md border border-slate-200 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <Utensils size={20} />
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                        🎓 Öğrenci Öğle Menüsü (SDÜ) - {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                    </h2>
                </div>
                <div className="py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-sm text-gray-500 italic">Bugün için menü bilgisi henüz girilmemiş.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-5 shadow-md border border-[#98FB98] mb-6">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-[#98FB98]/30 rounded-lg text-green-700">
                    <Utensils size={20} />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                    🎓 Öğrenci Öğle Menüsü (SDÜ) - {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
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
                    Kaynak: SDÜ Yemekhane
                </span>
                <a
                    href="https://yemekhane.sdu.edu.tr/tr/yemek-listesi.html"
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
