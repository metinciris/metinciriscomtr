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
        // 1. Detect Separator
        const cleanCSV = csv.replace(/^\uFEFF/, '');
        const commaCount = (cleanCSV.match(/,/g) || []).length;
        const semicolonCount = (cleanCSV.match(/;/g) || []).length;
        const separator = semicolonCount > commaCount ? ';' : ',';

        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = '';
        let inQuotes = false;

        for (let i = 0; i < cleanCSV.length; i++) {
            const char = cleanCSV[i];
            const nextChar = cleanCSV[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === separator && !inQuotes) {
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
                // Cache buster added to URL
                const cacheBuster = `&t=${Date.now()}`;
                const response = await fetch(SHEET_URL + cacheBuster);
                const csv = await response.text();
                const rows = parseCSV(csv);

                // Identify Columns Dynamically
                const headerRowIndex = rows.findIndex(r => r.some(cell => cell.toLowerCase().includes('tarih')));
                if (headerRowIndex === -1) {
                    setMenu(null);
                    setHasData(false);
                    return;
                }

                const headerRow = rows[headerRowIndex];
                const findCol = (terms: string[]) => headerRow.findIndex(cell =>
                    terms.some(term => cell.toLowerCase().includes(term.toLowerCase()))
                );

                const colIdx = {
                    date: findCol(['tarih']),
                    lunchMenu: findCol(['öğle menü', 'öğle menüsü']),
                    lunchKcal: findCol(['öğle kcal'])
                };

                const normalizeDate = (d: string) => d.replace(/\D/g, '');
                const todayNumeric = normalizeDate(formatDate(new Date()));

                // Find today's row using numeric-only date matching on the correct column
                const todayRow = rows.find((r, idx) => {
                    if (idx <= headerRowIndex) return false;
                    if (r[colIdx.date]) {
                        const rowDateNumeric = normalizeDate(r[colIdx.date]);
                        return rowDateNumeric === todayNumeric;
                    }
                    return false;
                });

                if (todayRow && colIdx.lunchMenu !== -1 && todayRow[colIdx.lunchMenu]) {
                    setMenu({
                        items: todayRow[colIdx.lunchMenu].split('\n').filter(Boolean),
                        kcal: colIdx.lunchKcal !== -1 ? todayRow[colIdx.lunchKcal] || null : null
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
