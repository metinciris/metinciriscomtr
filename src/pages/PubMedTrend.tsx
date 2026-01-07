import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import {
    TrendingUp,
    Search,
    Plus,
    Trash2,
    Play,
    RotateCcw,
    Info,
    Loader2,
    Lightbulb,
    AlertCircle,
} from 'lucide-react';
import {
    searchPubMed20Years,
    getSpellingSuggestions,
    clearQueue,
    clearCache,
    type YearlyCount,
    type SpellingSuggestion,
} from '../services/pubmedApi';

// Color palette for different search terms
const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F',
    '#FFBB28', '#FF8042', '#0088FE', '#00C49F', '#d45555',
    '#9b59b6', '#3498db', '#1abc9c', '#e74c3c', '#f1c40f',
];

// Default search suggestions
const DEFAULT_SUGGESTIONS = [
    'immunohistochemistry',
    'histochemistry',
    'next generation sequencing',
    'digital pathology',
    'artificial intelligence pathology',
];

interface SearchRow {
    id: string;
    term: string;
    isSearching: boolean;
    data: YearlyCount[];
    color: string;
    suggestion: SpellingSuggestion | null;
    showSuggestion: boolean;
}

interface ChartDataPoint {
    year: number;
    [key: string]: number | undefined;
}

export function PubMedTrend() {
    const [searchRows, setSearchRows] = useState<SearchRow[]>(() => {
        // Initialize with 3 empty rows
        return Array.from({ length: 3 }, (_, i) => ({
            id: `row-${Date.now()}-${i}`,
            term: '',
            isSearching: false,
            data: [],
            color: COLORS[i % COLORS.length],
            suggestion: null,
            showSuggestion: false,
        }));
    });

    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const suggestionTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
    const colorIndexRef = useRef(3); // Start from 3 since first 3 are used

    // Generate chart data from all search rows
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 19;
        const years = Array.from({ length: 20 }, (_, i) => startYear + i);

        const activeRows = searchRows.filter(row => row.data.length > 0);

        const newChartData: ChartDataPoint[] = years.map(year => {
            const point: ChartDataPoint = { year };
            activeRows.forEach(row => {
                const yearData = row.data.find(d => d.year === year);
                if (yearData && !yearData.loading) {
                    point[row.term] = yearData.count;
                }
            });
            return point;
        });

        setChartData(newChartData);
    }, [searchRows]);

    // Handle term input change with debounced spell check
    const handleTermChange = useCallback((rowId: string, value: string) => {
        setSearchRows(prev =>
            prev.map(row =>
                row.id === rowId
                    ? { ...row, term: value, showSuggestion: false, suggestion: null }
                    : row
            )
        );

        // Clear existing timeout
        if (suggestionTimeoutRef.current[rowId]) {
            clearTimeout(suggestionTimeoutRef.current[rowId]);
        }

        // Debounced spell check
        if (value.length >= 3) {
            suggestionTimeoutRef.current[rowId] = setTimeout(async () => {
                try {
                    const suggestion = await getSpellingSuggestions(value);
                    if (suggestion) {
                        setSearchRows(prev =>
                            prev.map(row =>
                                row.id === rowId
                                    ? { ...row, suggestion, showSuggestion: true }
                                    : row
                            )
                        );
                    }
                } catch (e) {
                    // Ignore spell check errors
                }
            }, 800);
        }
    }, []);

    // Accept spelling suggestion
    const acceptSuggestion = useCallback((rowId: string, corrected: string) => {
        setSearchRows(prev =>
            prev.map(row =>
                row.id === rowId
                    ? { ...row, term: corrected, suggestion: null, showSuggestion: false }
                    : row
            )
        );
    }, []);

    // Search a single row
    const searchRow = useCallback(async (rowId: string) => {
        const row = searchRows.find(r => r.id === rowId);
        if (!row || !row.term.trim() || row.isSearching) return;

        const term = row.term.trim();

        // Check if already searched with same term
        if (row.data.length > 0 && searchRows.some(r => r.id === rowId && r.term === term && r.data.length > 0)) {
            toast.info('Bu terim zaten arandı');
            return;
        }

        setSearchRows(prev =>
            prev.map(r =>
                r.id === rowId ? { ...r, isSearching: true, data: [] } : r
            )
        );

        try {
            await searchPubMed20Years(
                term,
                (progress) => {
                    setSearchRows(prev =>
                        prev.map(r => {
                            if (r.id !== rowId) return r;

                            // Update data progressively
                            const newData = [...r.data];
                            const existingIndex = newData.findIndex(d => d.year === progress.year);

                            if (existingIndex >= 0) {
                                newData[existingIndex] = { year: progress.year, count: progress.count, loading: false };
                            } else {
                                newData.push({ year: progress.year, count: progress.count, loading: false });
                            }

                            // Sort by year
                            newData.sort((a, b) => a.year - b.year);

                            return { ...r, data: newData };
                        })
                    );
                }
            );

            setSearchRows(prev =>
                prev.map(r =>
                    r.id === rowId ? { ...r, isSearching: false } : r
                )
            );

            toast.success(`"${term}" için 20 yıllık veri yüklendi`);
        } catch (error) {
            setSearchRows(prev =>
                prev.map(r =>
                    r.id === rowId ? { ...r, isSearching: false } : r
                )
            );
            toast.error(`Arama hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        }
    }, [searchRows]);

    // Clear a single row
    const clearRow = useCallback((rowId: string) => {
        setSearchRows(prev =>
            prev.map(row =>
                row.id === rowId
                    ? { ...row, data: [], isSearching: false, suggestion: null, showSuggestion: false }
                    : row
            )
        );
    }, []);

    // Add new search row
    const addRow = useCallback((termValue: string = '') => {
        const newRow: SearchRow = {
            id: `row-${Date.now()}-${Math.random()}`,
            term: termValue,
            isSearching: false,
            data: [],
            color: COLORS[colorIndexRef.current % COLORS.length],
            suggestion: null,
            showSuggestion: false,
        };
        colorIndexRef.current++;
        setSearchRows(prev => [...prev, newRow]);

        // If a term was provided, trigger search automatically
        if (termValue) {
            setTimeout(() => searchRow(newRow.id), 100);
        }
    }, [searchRow]);

    // Handle suggestion chip click
    const handleSuggestedTermClick = useCallback((term: string) => {
        // Find first empty row
        const emptyRow = searchRows.find(row => !row.term.trim() && !row.isSearching);

        if (emptyRow) {
            handleTermChange(emptyRow.id, term);
            // Optional: trigger search immediately
            setTimeout(() => searchRow(emptyRow.id), 100);
        } else {
            // Add new row with the term
            addRow(term);
        }
        toast.success(`"${term}" eklendi`);
    }, [searchRows, handleTermChange, searchRow, addRow]);

    // Remove a row
    const removeRow = useCallback((rowId: string) => {
        if (searchRows.length <= 1) {
            toast.warning('En az bir arama satırı olmalı');
            return;
        }
        setSearchRows(prev => prev.filter(row => row.id !== rowId));
    }, [searchRows.length]);

    // Bulk search all non-empty rows
    const bulkSearch = useCallback(async () => {
        const rowsToSearch = searchRows.filter(row => row.term.trim() && !row.isSearching && row.data.length === 0);

        if (rowsToSearch.length === 0) {
            toast.info('Aranacak boş satır yok');
            return;
        }

        toast.info(`${rowsToSearch.length} terim sıraya alındı...`);

        // Search all sequentially to respect throttling
        for (const row of rowsToSearch) {
            await searchRow(row.id);
        }
    }, [searchRows, searchRow]);

    // Clear all
    const clearAll = useCallback(() => {
        clearQueue();
        clearCache();
        setSearchRows(prev =>
            prev.map(row => ({
                ...row,
                data: [],
                isSearching: false,
                suggestion: null,
                showSuggestion: false,
            }))
        );
        toast.success('Tüm veriler temizlendi');
    }, []);

    // Get active series for legend
    const activeTerms = searchRows.filter(row => row.data.length > 0 || row.isSearching);

    // Build table data
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 19;
    const tableYears = Array.from({ length: 20 }, (_, i) => startYear + i);

    return (
        <PageContainer>
            {/* Header */}
            <div
                className="p-12 mb-10 rounded-3xl shadow-xl border-b-8 border-purple-900/20"
                style={{
                    background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
                    color: 'white',
                }}
            >
                <div className="flex items-center gap-6 mb-6">
                    <div className="p-5 bg-purple-500 rounded-3xl shadow-2xl rotate-3">
                        <TrendingUp size={42} color="white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black m-0 tracking-tight" style={{ color: 'white' }}>
                            PubMed Trend Analizi
                        </h1>
                        <p className="text-purple-200 text-xl font-medium m-0 opacity-90">
                            Yayın Trendlerini Keşfedin
                        </p>
                    </div>
                </div>
                <p className="max-w-3xl text-xl opacity-80 leading-relaxed font-normal" style={{ color: 'white' }}>
                    Farklı arama terimleri için son 20 yıldaki PubMed yayın sayılarını karşılaştırın.
                    Veriler yıl yıl yüklenerek grafikte görselleştirilir.
                </p>
            </div>

            {/* Info Banner */}
            <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
                <Info className="text-purple-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-purple-800">
                    <strong>Kullanım:</strong> Arama kutularına terim yazın ve "Ara" butonuna tıklayın.
                    Her terim grafikte ayrı bir çizgi olarak gösterilir. Throttle sistemi sayesinde
                    rate limit sorunları minimize edilir. Aynı terim tekrar aranırsa önbellekten hızlı yüklenir.
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={24} className="text-purple-600" />
                    Yayın Trendi Grafiği
                </h2>

                {activeTerms.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="year"
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => value.toLocaleString('tr-TR')}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value: number) => [value.toLocaleString('tr-TR'), '']}
                                labelFormatter={(label) => `Yıl: ${label}`}
                            />
                            <Legend
                                formatter={(value) => {
                                    const row = searchRows.find(r => r.term === value);
                                    if (row?.isSearching) {
                                        return `${value} (yükleniyor...)`;
                                    }
                                    return value;
                                }}
                            />
                            {activeTerms.map(row => (
                                <Line
                                    key={row.id}
                                    type="monotone"
                                    dataKey={row.term}
                                    stroke={row.color}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: row.color }}
                                    activeDot={{ r: 5 }}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <div className="text-center">
                            <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Grafik görmek için bir arama yapın</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Search Rows Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Search size={24} className="text-blue-600" />
                        Arama Terimleri
                    </h2>

                    {/* Suggested Terms Chips */}
                    <div className="mb-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Lightbulb size={14} className="text-amber-500" />
                            Hızlı Arama Önerileri
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSuggestedTermClick(suggestion)}
                                    className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {searchRows.map((row, index) => (
                            <div key={row.id} className="relative group p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    {/* Color indicator */}
                                    <div
                                        className="w-1.5 h-12 rounded-full shrink-0"
                                        style={{ backgroundColor: row.color }}
                                    />

                                    {/* Input */}
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={row.term}
                                            onChange={(e) => handleTermChange(row.id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && row.term.trim() && !row.isSearching) {
                                                    searchRow(row.id);
                                                }
                                            }}
                                            placeholder="Arama terimi girin..."
                                            className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-slate-800 bg-white shadow-sm font-medium transition-all"
                                            disabled={row.isSearching}
                                        />

                                        {/* Suggestion dropdown */}
                                        {row.showSuggestion && row.suggestion && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-amber-100 rounded-2xl shadow-xl z-20 p-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-amber-50 rounded-full text-amber-600">
                                                        <Lightbulb size={18} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Öneri:</p>
                                                        <button
                                                            onClick={() => acceptSuggestion(row.id, row.suggestion!.corrected)}
                                                            className="text-lg font-black text-blue-600 hover:text-blue-800 transition-colors underline decoration-2 decoration-blue-200 underline-offset-4"
                                                        >
                                                            {row.suggestion.corrected}
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => setSearchRows(prev =>
                                                            prev.map(r => r.id === row.id ? { ...r, showSuggestion: false } : r)
                                                        )}
                                                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Search button */}
                                    <button
                                        onClick={() => searchRow(row.id)}
                                        disabled={row.isSearching || !row.term.trim()}
                                        className={`px-16 py-4 text-lg font-black rounded-2xl flex items-center justify-center gap-3 shrink-0 transition-all active:scale-95 shadow-xl
                                            ${row.isSearching || !row.term.trim()
                                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
                                            }`}
                                    >
                                        {row.isSearching ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <Search size={24} strokeWidth={3} />
                                        )}
                                        ARA
                                    </button>

                                    {/* Action buttons wrapper */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => clearRow(row.id)}
                                            disabled={row.isSearching}
                                            className="p-4 bg-white text-slate-400 border border-slate-100 rounded-2xl hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50 transition-all shadow-sm"
                                            title="Temizle"
                                        >
                                            <RotateCcw size={20} />
                                        </button>

                                        {searchRows.length > 1 && (
                                            <button
                                                onClick={() => removeRow(row.id)}
                                                disabled={row.isSearching}
                                                className="p-4 bg-white text-slate-400 border border-slate-100 rounded-2xl hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-all shadow-sm"
                                                title="Sil"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Progress indicator */}
                                {row.isSearching && (
                                    <div className="mt-4 flex items-center gap-4 p-3 bg-blue-50/80 rounded-xl border border-blue-100/50">
                                        <div className="flex items-center gap-2 font-black text-blue-700 text-sm">
                                            <div className="relative">
                                                <Loader2 size={16} className="animate-spin" />
                                                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
                                            </div>
                                            <span className="tracking-tighter uppercase font-black">Aranıyor...</span>
                                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-lg text-xs leading-none">
                                                {row.data.length}/20 yıl
                                            </span>
                                        </div>
                                        <div className="flex-1 h-2 bg-blue-200/50 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                                                style={{ width: `${(row.data.length / 20) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
                    <button
                        onClick={() => addRow()}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Arama Ekle
                    </button>

                    <button
                        onClick={bulkSearch}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2 transition-colors"
                    >
                        <Play size={18} />
                        Toplu Ara
                    </button>

                    <button
                        onClick={clearAll}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 flex items-center gap-2 transition-colors"
                    >
                        <Trash2 size={18} />
                        Hepsini Temizle
                    </button>
                </div>
            </div>

            {/* Data Table Section */}
            {activeTerms.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-x-auto">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertCircle size={24} className="text-purple-600" />
                        Yıllık Veri Tablosu
                    </h2>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 font-semibold text-slate-600 bg-slate-50 sticky left-0">
                                    Yıl
                                </th>
                                {activeTerms.map(row => (
                                    <th
                                        key={row.id}
                                        className="text-right py-3 px-4 font-semibold bg-slate-50"
                                        style={{ color: row.color }}
                                    >
                                        {row.term}
                                        {row.isSearching && ' ⏳'}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableYears.map(year => (
                                <tr key={year} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-2 px-4 font-medium text-slate-700 sticky left-0 bg-white">
                                        {year}
                                    </td>
                                    {activeTerms.map(row => {
                                        const yearData = row.data.find(d => d.year === year);
                                        return (
                                            <td key={row.id} className="text-right py-2 px-4">
                                                {yearData ? (
                                                    yearData.loading ? (
                                                        <span className="inline-block w-16 h-4 bg-slate-200 animate-pulse rounded" />
                                                    ) : yearData.error ? (
                                                        <span className="text-red-500">Hata</span>
                                                    ) : (
                                                        <span className="font-medium text-slate-700">
                                                            {yearData.count.toLocaleString('tr-TR')}
                                                        </span>
                                                    )
                                                ) : row.isSearching ? (
                                                    <span className="inline-block w-16 h-4 bg-slate-200 animate-pulse rounded" />
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer Info */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-4 text-slate-600 leading-relaxed text-sm">
                    <Info className="text-purple-600 shrink-0 mt-1" size={20} />
                    <div>
                        <p className="mb-2">
                            <strong>Teknik Bilgiler:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-500">
                            <li>Veriler NCBI PubMed E-utilities API üzerinden çekilmektedir</li>
                            <li>Son 20 yıl ({startYear}-{currentYear}) için yayın sayıları gösterilir</li>
                            <li>Rate limit aşımını önlemek için istekler kuyruğa alınır (max 3 eşzamanlı)</li>
                            <li>Aynı terim tekrar arandığında önbellekten hızlı yüklenir</li>
                            <li>Yanlış yazımlarda ESpell API ile öneri sunulur</li>
                        </ul>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
