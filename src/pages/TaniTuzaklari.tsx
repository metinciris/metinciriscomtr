import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { PageContainer } from "../components/PageContainer";
import { MetroTile } from "../components/MetroTile";
import { motion, AnimatePresence } from "motion/react";
import {
    PITFALLS,
    ORGAN_SYSTEMS,
    type Pitfall,
    type OrganSystem,
} from "../data/tani-tuzaklari";

/**
 * Tanı Hataları & Tuzaklar - Metro UI Redesign
 * - Veri: src/data/tani-tuzaklari.ts
 * - UI: Metro Tile Grid + Detail Modal
 */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

/* Color Mapping for Organ Systems - Using hex codes for inline styles */
const ORGAN_COLORS: Record<OrganSystem, string> = {
    "Genel": "#475569",      // Slate-600
    "Akciğer": "#0284c7",    // Sky-600
    "GİS": "#d97706",        // Amber-600
    "Meme": "#db2777",       // Pink-600
    "Gyn": "#e11d48",        // Rose-600
    "Üriner": "#ca8a04",     // Yellow-600
    "Endokrin": "#9333ea",   // Purple-600
    "Baş-Boyun": "#ea580c",  // Orange-600
    "Deri": "#78716c",       // Stone-500
    "Lenfoid/Hemato": "#b91c1c", // Red-700
    "Yumuşak Doku": "#059669",   // Emerald-600
    "Kemik": "#525252",      // Neutral-600
    "CNS": "#4f46e5",        // Indigo-600
};

/* Filter Chip Components */
function pillBase() {
    return "px-3 py-2 rounded-xl text-sm font-extrabold border shadow-sm transition-colors focus:outline-none focus-visible:ring-2 active:scale-[0.98] [-webkit-tap-highlight-color:transparent]";
}

function pillSelectedStyle(bg: string): React.CSSProperties {
    return {
        backgroundColor: bg,
        borderColor: "rgba(0,0,0,0.15)",
        color: "#ffffff",
    };
}

function pillUnselectedStyle(): React.CSSProperties {
    return {
        backgroundColor: "rgba(255,255,255,0.9)",
        borderColor: "rgba(0,0,0,0.10)",
        color: "#0f172a",
    };
}

function useLocalStorageStringArray(key: string, fallback: string[] = []) {
    const [value, setValue] = useState<string[]>(() => {
        try {
            if (typeof window === "undefined") return fallback;
            const raw = window.localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed;
            return fallback;
        } catch {
            return fallback;
        }
    });

    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // ignore
        }
    }, [key, value]);

    return [value, setValue] as const;
}


export function TaniTuzaklari() {
    const [q, setQ] = useState("");
    const deferredQ = useDeferredValue(q);

    const [orgSet, setOrgSet] = useState<Set<OrganSystem>>(new Set());

    const [favIdsArr, setFavIdsArr] = useLocalStorageStringArray("tuzaklar:favs", []);
    const favIds = useMemo(() => new Set(favIdsArr), [favIdsArr]);
    const [onlyFavs, setOnlyFavs] = useState(false);

    const [selectedPitfall, setSelectedPitfall] = useState<Pitfall | null>(null);

    // Initial load hash check
    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const hash = window.location.hash?.replace("#", "").trim();
            if (!hash) return;
            const id = decodeURIComponent(hash);
            const found = PITFALLS.find((p) => p.id === id);
            if (found) {
                setSelectedPitfall(found);
            }
        } catch {
            // ignore
        }
    }, []);

    // Update hash on selection
    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            if (selectedPitfall) {
                window.history.replaceState(null, "", `#${selectedPitfall.id}`);
            } else {
                // Sayfa hash'ini koru (F5 için kritik) - Ana sayfaya (pathname) dönmemeli
                window.history.replaceState(null, "", "#tani-tuzaklari");
            }
        } catch {
            // ignore
        }
    }, [selectedPitfall]);

    const stats = useMemo(() => {
        const total = PITFALLS.length;
        const orgs = new Set(PITFALLS.map((x) => x.organSystem)).size;
        return { total, orgs };
    }, []);

    const filtered = useMemo(() => {
        const query = deferredQ.trim().toLowerCase();

        const hitQuery = (p: Pitfall) => {
            if (!query) return true;
            const inTitle = p.titleTR.toLowerCase().includes(query) || (p.titleEN?.toLowerCase().includes(query) ?? false);
            const inTags = p.tags.some((t) => t.toLowerCase().includes(query));
            const inTeaser = p.teaser.toLowerCase().includes(query);
            return inTitle || inTags || inTeaser;
        };

        const hitSet = <T,>(set: Set<T>, value: T) => set.size === 0 || set.has(value);
        const hitFav = (p: Pitfall) => !onlyFavs || favIds.has(p.id);

        const list = PITFALLS.filter((p) => {
            return (
                hitQuery(p) &&
                hitSet(orgSet, p.organSystem) &&
                hitFav(p)
            );
        });

        // Default sort: Title A-Z (Turkish aware)
        const sorted = [...list].sort((a, b) => a.titleTR.localeCompare(b.titleTR, "tr"));

        return sorted;
    }, [deferredQ, orgSet, onlyFavs, favIds]);

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (orgSet.size) n += 1;
        if (onlyFavs) n += 1;
        return n;
    }, [orgSet.size, onlyFavs]);

    function resetFilters() {
        setQ("");
        setOrgSet(new Set());
        setOnlyFavs(false);
    }

    function toggleFavorite(id: string, e?: React.MouseEvent) {
        e?.stopPropagation();
        setFavIdsArr((prev) => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id);
            else s.add(id);
            return Array.from(s);
        });
    }

    function toggleSet<T>(value: T, set: Set<T>, setter: React.Dispatch<React.SetStateAction<Set<T>>>) {
        setter((prev) => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    }


    return (
        <PageContainer>
            <div className="w-full pb-20">
                {/* HERO Header - Metro Style */}
                <div className="mb-8">
                    <div className="flex flex-col gap-2">
                        <div className="text-4xl md:text-5xl font-light tracking-tight text-gray-800">
                            Patoloji <span className="font-bold">Tanı Tuzakları</span>
                        </div>
                        <div className="text-lg text-gray-600 font-light max-w-2xl">
                            Günlük pratikte karşılaşılan zorluklar, yanıltıcı görüntüler ve pratik çözüm ipuçları.
                        </div>
                    </div>
                </div>

                {/* Controls Area */}
                <div className="mb-8 space-y-4">
                    {/* Search & Stats */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Tuzak ara (örn: crush, p16, frozen)..."
                            className="flex-1 px-5 py-4 text-lg rounded-none bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-0 transition-colors shadow-sm outline-none"
                        />
                        <div className="flex gap-2 shrink-0">
                            <div className="px-4 py-2 bg-gray-100 border text-gray-600 flex flex-col items-center justify-center min-w-[5rem]">
                                <span className="text-xs font-bold uppercase tracking-wider">Kart</span>
                                <span className="text-xl font-black">{stats.total}</span>
                            </div>
                            <div className="px-4 py-2 bg-gray-100 border text-gray-600 flex flex-col items-center justify-center min-w-[5rem]">
                                <span className="text-xs font-bold uppercase tracking-wider">Sonuç</span>
                                <span className="text-xl font-black text-[#2563eb]">{filtered.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <button
                            onClick={() => setOnlyFavs(!onlyFavs)}
                            className={`px-4 py-2 text-sm font-bold uppercase tracking-wide border-2 transition-all ${onlyFavs
                                ? 'bg-[#fbbf24] border-[#fbbf24] text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-[#fbbf24] hover:text-[#f59e0b]'
                                }`}
                        >
                            {onlyFavs ? "★ Favoriler Aktif" : "☆ Favoriler"}
                        </button>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-sm font-bold uppercase tracking-wide bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                Temizle
                            </button>
                        )}
                    </div>

                    {/* Organ System Filters */}
                    <div className="flex flex-wrap gap-1">
                        {ORGAN_SYSTEMS.map(org => {
                            const isActive = orgSet.has(org);
                            return (
                                <button
                                    key={org}
                                    onClick={() => toggleSet(org, orgSet, setOrgSet)}
                                    className={`px-3 py-1.5 text-xs font-bold transition-all border ${isActive
                                        ? 'bg-gray-800 text-white border-gray-800'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {org}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* METRO GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[200px]">
                    {filtered.map(p => {
                        const isFav = favIds.has(p.id);
                        const colorHex = ORGAN_COLORS[p.organSystem] || "#6b7280";

                        return (
                            <MetroTile
                                key={p.id}
                                title={p.titleTR}
                                subtitle={p.titleEN || p.organSystem}
                                color=""
                                style={{ backgroundColor: colorHex }}
                                size="medium"
                                className="h-full min-h-[200px]"
                                onClick={() => setSelectedPitfall(p)}
                            >
                                <div className="absolute top-4 right-4 z-20">
                                    <button
                                        onClick={(e) => toggleFavorite(p.id, e)}
                                        className="text-white/80 hover:text-white transition-colors text-2xl"
                                        title={isFav ? "Favoriden çıkar" : "Favoriye ekle"}
                                    >
                                        {isFav ? "★" : "☆"}
                                    </button>
                                </div>
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="bg-black/20 px-2 py-0.5 text-[10px] uppercase font-bold text-white rounded">
                                        {p.category}
                                    </span>
                                </div>
                            </MetroTile>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            <div className="text-6xl mb-4">:(</div>
                            <div className="text-xl font-light">Aradığınız kriterlere uygun sonuç bulunamadı.</div>
                        </div>
                    )}
                </div>
            </div>

            {/* DETAIL MODAL */}
            <AnimatePresence>
                {selectedPitfall && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 9999 }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPitfall(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            layoutId={`pitfall-${selectedPitfall.id}`}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none shadow-2xl relative flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div
                                className="p-6 sm:p-8 text-white sticky top-0 z-10"
                                style={{ backgroundColor: ORGAN_COLORS[selectedPitfall.organSystem] || '#6b7280' }}
                            >
                                <button
                                    onClick={() => setSelectedPitfall(null)}
                                    className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light leading-none"
                                >
                                    ×
                                </button>

                                <div className="flex gap-2 mb-2 opacity-90 text-sm font-bold uppercase tracking-wider">
                                    <span>{selectedPitfall.organSystem}</span>
                                    <span>•</span>
                                    <span>{selectedPitfall.category}</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">
                                    {selectedPitfall.titleTR}
                                </h1>
                                {selectedPitfall.titleEN && (
                                    <h2 className="text-xl font-light opacity-90 italic">
                                        {selectedPitfall.titleEN}
                                    </h2>
                                )}
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 sm:p-8 space-y-8 text-gray-800">

                                {/* Teaser */}
                                <div className="text-lg sm:text-xl font-light leading-relaxed border-l-4 border-[#3b82f6] pl-4 text-gray-700">
                                    {selectedPitfall.teaser}
                                </div>

                                {/* Main Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Column: Problem & Clues */}
                                    <div className="space-y-6">
                                        <section>
                                            <h3 className="text-[#dc2626] font-bold uppercase tracking-wider text-sm mb-3 border-b border-red-100 pb-1">
                                                Neden Yanıltır?
                                            </h3>
                                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                                {selectedPitfall.whyItTricks.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </section>

                                        <section>
                                            <h3 className="text-[#059669] font-bold uppercase tracking-wider text-sm mb-3 border-b border-[#a7f3d0] pb-1">
                                                Ayırıcı İpuçları
                                            </h3>
                                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                                {selectedPitfall.keyClues.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </section>
                                    </div>

                                    {/* Right Column: Workup & Reporting */}
                                    <div className="space-y-6">
                                        <section>
                                            <h3 className="text-[#2563eb] font-bold uppercase tracking-wider text-sm mb-3 border-b border-[#bfdbfe] pb-1">
                                                Minimal Çalışma
                                            </h3>
                                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                                {selectedPitfall.minimalWorkup.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </section>

                                        <section>
                                            <h3 className="text-[#4f46e5] font-bold uppercase tracking-wider text-sm mb-3 border-b border-[#c7d2fe] pb-1">
                                                Raporlama
                                            </h3>
                                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                                {selectedPitfall.reportingTips.map((item, i) => (
                                                    <li key={i}>{item}</li>
                                                ))}
                                            </ul>
                                        </section>
                                    </div>
                                </div>

                                {/* Checklist Box */}
                                <div className="bg-gray-50 p-6 rounded-none border-l-4 border-gray-800">
                                    <h3 className="text-gray-900 font-black uppercase text-sm mb-4">
                                        Hızlı Kontrol Listesi
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {selectedPitfall.checklist.map((item, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                                                    <span className="text-gray-300 text-xs">✓</span>
                                                </div>
                                                <span className="text-gray-700 font-medium">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer: Tags & Meta */}
                                <div className="pt-6 border-t border-gray-100 text-sm text-gray-500 flex flex-col gap-4">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPitfall.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center opacity-75 text-xs">
                                        <span>Zorluk: {selectedPitfall.difficulty}</span>
                                        <span>Son Güncelleme: {selectedPitfall.updatedAt}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PageContainer>
    );
}
