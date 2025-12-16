import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { PageContainer } from "../components/PageContainer";
import {
    PITFALLS,
    CATEGORIES,
    MODALITIES,
    ORGAN_SYSTEMS,
    SPECIMEN_TYPES,
    type Pitfall,
    type Category,
    type Modality,
    type OrganSystem,
    type SpecimenType,
    type Difficulty,
} from "../data/tani-tuzaklari";

/**
 * Tanı Hataları & Tuzaklar
 * - Veri: src/data/tani-tuzaklari.ts
 * - UI: filtre + arama + favori + permalink + accordion
 */

type SortKey = "updatedDesc" | "titleAsc" | "difficultyAsc";

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function pillBase() {
    return "px-3 py-2 rounded-xl text-sm font-extrabold border shadow-sm transition-colors focus:outline-none focus-visible:ring-2 active:scale-[0.98] [-webkit-tap-highlight-color:transparent]";
}

function pillSelectedStyle(bg: string): React.CSSProperties {
    return {
        backgroundColor: bg,
        borderColor: "rgba(0,0,0,0.15)",
        color: "#0f172a",
    };
}

function pillUnselectedStyle(): React.CSSProperties {
    return {
        backgroundColor: "rgba(255,255,255,0.9)",
        borderColor: "rgba(0,0,0,0.10)",
        color: "#0f172a",
    };
}

function badgeStyle(kind: "a" | "b" | "c" | "d") {
    const map = {
        a: { bg: "rgba(2,132,199,0.10)", fg: "#075985", bd: "rgba(2,132,199,0.20)" },
        b: { bg: "rgba(99,102,241,0.10)", fg: "#3730a3", bd: "rgba(99,102,241,0.20)" },
        c: { bg: "rgba(15,23,42,0.04)", fg: "#0f172a", bd: "rgba(0,0,0,0.08)" },
        d: { bg: "rgba(16,185,129,0.10)", fg: "#065f46", bd: "rgba(16,185,129,0.20)" },
    };
    return map[kind];
}

function difficultyBadge(d: Difficulty) {
    const map: Record<Difficulty, { bg: string; fg: string; bd: string }> = {
        Kolay: { bg: "rgba(34,197,94,0.18)", fg: "#065f46", bd: "rgba(34,197,94,0.25)" },
        Orta: { bg: "rgba(245,158,11,0.18)", fg: "#92400e", bd: "rgba(245,158,11,0.25)" },
        Zor: { bg: "rgba(239,68,68,0.18)", fg: "#991b1b", bd: "rgba(239,68,68,0.25)" },
    };
    return map[d];
}

function safeDateLabel(iso: string) {
    return iso;
}

function toggleSet<T>(value: T, set: Set<T>, setter: React.Dispatch<React.SetStateAction<Set<T>>>) {
    setter((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
    });
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

function sectionTitle(title: string, subtitle?: string) {
    return (
        <div className="mb-3">
            <div className="text-sm font-extrabold tracking-tight text-slate-900">{title}</div>
            {subtitle ? <div className="text-xs font-semibold text-slate-600 mt-0.5">{subtitle}</div> : null}
        </div>
    );
}

async function copyText(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

function difficultyRank(d: Difficulty) {
    return d === "Kolay" ? 1 : d === "Orta" ? 2 : 3;
}

export function TaniTuzaklari() {
    const [q, setQ] = useState("");
    const deferredQ = useDeferredValue(q);

    const [catSet, setCatSet] = useState<Set<Category>>(new Set());
    const [modSet, setModSet] = useState<Set<Modality>>(new Set());
    const [orgSet, setOrgSet] = useState<Set<OrganSystem>>(new Set());
    const [specSet, setSpecSet] = useState<Set<SpecimenType>>(new Set());
    const [difficulty, setDifficulty] = useState<Difficulty | "Hepsi">("Hepsi");

    const [sortKey, setSortKey] = useState<SortKey>("updatedDesc");

    const [favIdsArr, setFavIdsArr] = useLocalStorageStringArray("tuzaklar:favs", []);
    const favIds = useMemo(() => new Set(favIdsArr), [favIdsArr]);
    const [onlyFavs, setOnlyFavs] = useState(false);

    const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const hash = window.location.hash?.replace("#", "").trim();
            if (!hash) return;
            const id = decodeURIComponent(hash);
            const exists = PITFALLS.some((p) => p.id === id);
            if (exists) {
                setOpenIds(new Set([id]));
                setTimeout(() => {
                    const el = document.getElementById(`pitfall-${id}`);
                    el?.scrollIntoView({ block: "start", behavior: "smooth" });
                }, 50);
            }
        } catch {
            // ignore
        }
    }, []);

    const stats = useMemo(() => {
        const total = PITFALLS.length;
        const cats = new Set(PITFALLS.map((x) => x.category)).size;
        const orgs = new Set(PITFALLS.map((x) => x.organSystem)).size;
        const ihc = PITFALLS.filter((x) => x.modality === "IHC").length;
        const lastUpdated = PITFALLS.map((x) => x.updatedAt).sort((a, b) => (a < b ? 1 : -1))[0];
        return { total, cats, orgs, ihc, lastUpdated };
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
        const hitDiff = (p: Pitfall) => difficulty === "Hepsi" || p.difficulty === difficulty;
        const hitFav = (p: Pitfall) => !onlyFavs || favIds.has(p.id);

        const list = PITFALLS.filter((p) => {
            return (
                hitQuery(p) &&
                hitSet(catSet, p.category) &&
                hitSet(modSet, p.modality) &&
                hitSet(orgSet, p.organSystem) &&
                hitSet(specSet, p.specimenType) &&
                hitDiff(p) &&
                hitFav(p)
            );
        });

        const sorted = [...list].sort((a, b) => {
            if (sortKey === "updatedDesc") return a.updatedAt < b.updatedAt ? 1 : -1;
            if (sortKey === "titleAsc") return a.titleTR.localeCompare(b.titleTR, "tr");
            if (sortKey === "difficultyAsc") return difficultyRank(a.difficulty) - difficultyRank(b.difficulty);
            return 0;
        });

        return sorted;
    }, [deferredQ, catSet, modSet, orgSet, specSet, difficulty, sortKey, onlyFavs, favIds]);

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (catSet.size) n += 1;
        if (modSet.size) n += 1;
        if (orgSet.size) n += 1;
        if (specSet.size) n += 1;
        if (difficulty !== "Hepsi") n += 1;
        if (onlyFavs) n += 1;
        return n;
    }, [catSet.size, modSet.size, orgSet.size, specSet.size, difficulty, onlyFavs]);

    function resetFilters() {
        setQ("");
        setCatSet(new Set());
        setModSet(new Set());
        setOrgSet(new Set());
        setSpecSet(new Set());
        setDifficulty("Hepsi");
        setOnlyFavs(false);
        setSortKey("updatedDesc");
    }

    function toggleFavorite(id: string) {
        setFavIdsArr((prev) => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id);
            else s.add(id);
            return Array.from(s);
        });
    }

    function expandAll() {
        setOpenIds(new Set(filtered.map((x) => x.id)));
    }

    function collapseAll() {
        setOpenIds(new Set());
    }

    async function copyPermalink(id: string) {
        if (typeof window === "undefined") return;
        const url = new URL(window.location.href);
        url.hash = encodeURIComponent(id);
        const ok = await copyText(url.toString());
        if (!ok) {
            window.location.hash = encodeURIComponent(id);
        }
    }

    return (
        <PageContainer>
            <div className="w-full">
                {/* HERO */}
                <div
                    className="rounded-2xl border shadow-sm overflow-hidden"
                    style={{
                        background: "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(16,185,129,0.10))",
                        borderColor: "rgba(0,0,0,0.10)",
                    }}
                >
                    <div className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="min-w-0">
                                <div className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                                    Patoloji Tanı Tuzakları
                                </div>
                                <div className="mt-1 text-sm font-semibold text-slate-700">
                                    Veri odaklı kartlar • filtre/arama/favori • pratik check-list
                                </div>
                                <div className="mt-2 text-xs font-semibold text-slate-600">
                                    Eğitim amaçlıdır. Klinik bağlam, korelasyon ve kurum SOP'leri esastır.
                                </div>
                                <div className="mt-1 text-xs font-semibold text-slate-600">
                                    Son güncelleme: {stats.lastUpdated}
                                </div>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { k: "Kart", v: stats.total },
                                    { k: "Kategori", v: stats.cats },
                                    { k: "Organ", v: stats.orgs },
                                    { k: "IHC", v: stats.ihc },
                                    { k: "Favori", v: favIds.size },
                                ].map((x) => (
                                    <div
                                        key={x.k}
                                        className="px-3 py-2 rounded-xl border shadow-sm bg-white/80"
                                        style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                    >
                                        <div className="text-[11px] font-extrabold text-slate-700">{x.k}</div>
                                        <div className="text-xl font-black text-slate-900 leading-none">{x.v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Arama + Aksiyonlar */}
                        <div className="mt-4 grid gap-3 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <div className="text-[11px] font-extrabold text-slate-700 mb-1">Ara</div>
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Örn: crush, floater, p16, E-cadherin, sampling, frozen…"
                                    className="w-full px-4 py-3 rounded-xl border shadow-sm bg-white/90 text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-blue-400/50"
                                    style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                />
                                <div className="mt-2 text-xs font-semibold text-slate-600">
                                    Filtreler: {activeFilterCount ? `${activeFilterCount} aktif` : "aktif filtre yok"} • Sonuç:{" "}
                                    <span className="font-black text-slate-900">{filtered.length}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setOnlyFavs((v) => !v)}
                                        className={pillBase()}
                                        style={onlyFavs ? pillSelectedStyle("rgba(245,158,11,0.22)") : pillUnselectedStyle()}
                                    >
                                        {onlyFavs ? "Sadece favoriler: Açık" : "Sadece favoriler: Kapalı"}
                                    </button>
                                    <button
                                        onClick={resetFilters}
                                        className={pillBase()}
                                        style={pillUnselectedStyle()}
                                        title="Tüm filtreleri ve aramayı sıfırla"
                                    >
                                        Sıfırla
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={expandAll} className={pillBase()} style={pillUnselectedStyle()}>
                                        Hepsini aç
                                    </button>
                                    <button onClick={collapseAll} className={pillBase()} style={pillUnselectedStyle()}>
                                        Hepsini kapa
                                    </button>
                                </div>

                                <div>
                                    <div className="text-[11px] font-extrabold text-slate-700 mb-1">Sırala</div>
                                    <select
                                        value={sortKey}
                                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                                        className="w-full px-3 py-3 rounded-xl border shadow-sm bg-white/90 text-slate-900 font-extrabold outline-none"
                                        style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                    >
                                        <option value="updatedDesc">Güncellik (Yeni → Eski)</option>
                                        <option value="titleAsc">Başlık (A → Z)</option>
                                        <option value="difficultyAsc">Zorluk (Kolay → Zor)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Filtre chip alanı */}
                        <div className="mt-5 grid gap-3 lg:grid-cols-2">
                            <div className="rounded-2xl border p-4 bg-white/75" style={{ borderColor: "rgba(0,0,0,0.10)" }}>
                                {sectionTitle("Kategori", "Birden fazla seçebilirsiniz (seçim yoksa: Hepsi)")}
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map((c) => {
                                        const active = catSet.has(c);
                                        return (
                                            <button
                                                key={c}
                                                onClick={() => toggleSet(c, catSet, setCatSet)}
                                                className={pillBase()}
                                                style={active ? pillSelectedStyle("rgba(59,130,246,0.22)") : pillUnselectedStyle()}
                                                aria-pressed={active}
                                            >
                                                {c}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-2xl border p-4 bg-white/75" style={{ borderColor: "rgba(0,0,0,0.10)" }}>
                                {sectionTitle("Organ sistemi", "Birden fazla seçebilirsiniz")}
                                <div className="flex flex-wrap gap-2">
                                    {ORGAN_SYSTEMS.map((o) => {
                                        const active = orgSet.has(o);
                                        return (
                                            <button
                                                key={o}
                                                onClick={() => toggleSet(o, orgSet, setOrgSet)}
                                                className={pillBase()}
                                                style={active ? pillSelectedStyle("rgba(16,185,129,0.20)") : pillUnselectedStyle()}
                                                aria-pressed={active}
                                            >
                                                {o}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-2xl border p-4 bg-white/75" style={{ borderColor: "rgba(0,0,0,0.10)" }}>
                                {sectionTitle("Mod", "H&E / IHC / Frozen / Sitoloji vb.")}
                                <div className="flex flex-wrap gap-2">
                                    {MODALITIES.map((m) => {
                                        const active = modSet.has(m);
                                        return (
                                            <button
                                                key={m}
                                                onClick={() => toggleSet(m, modSet, setModSet)}
                                                className={pillBase()}
                                                style={active ? pillSelectedStyle("rgba(99,102,241,0.20)") : pillUnselectedStyle()}
                                                aria-pressed={active}
                                            >
                                                {m}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-2xl border p-4 bg-white/75" style={{ borderColor: "rgba(0,0,0,0.10)" }}>
                                {sectionTitle("Örnek tipi + Zorluk", "Örnek tipi çoklu; zorluk tekli")}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {SPECIMEN_TYPES.map((s) => {
                                        const active = specSet.has(s);
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => toggleSet(s, specSet, setSpecSet)}
                                                className={pillBase()}
                                                style={active ? pillSelectedStyle("rgba(2,132,199,0.18)") : pillUnselectedStyle()}
                                                aria-pressed={active}
                                            >
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {(["Hepsi", "Kolay", "Orta", "Zor"] as const).map((d) => {
                                        const active = difficulty === d;
                                        return (
                                            <button
                                                key={d}
                                                onClick={() => setDifficulty(d)}
                                                className={pillBase()}
                                                style={active ? pillSelectedStyle("rgba(245,158,11,0.20)") : pillUnselectedStyle()}
                                                aria-pressed={active}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LISTE */}
                <div className="mt-6">
                    {sectionTitle(
                        `Kartlar (${filtered.length})`,
                        "Başlığa tıklayın: detaylar açılır. Sağdan favori ve link kopyalama işlemleri yapılır."
                    )}

                    <div className="space-y-3">
                        {filtered.map((p) => {
                            const isOpen = openIds.has(p.id);
                            const db = difficultyBadge(p.difficulty);

                            const cat = badgeStyle("a");
                            const mod = badgeStyle("b");
                            const org = badgeStyle("d");
                            const tag = badgeStyle("c");

                            const isFav = favIds.has(p.id);

                            return (
                                <div
                                    key={p.id}
                                    id={`pitfall-${p.id}`}
                                    className="rounded-2xl border shadow-sm overflow-hidden bg-white"
                                    style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                >
                                    <div
                                        className="w-full px-4 py-4 flex flex-col gap-2"
                                        style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
                                    >
                                        {/* Header row */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className="px-2 py-1 rounded-lg border text-[11px] font-extrabold"
                                                style={{ backgroundColor: cat.bg, color: cat.fg, borderColor: cat.bd }}
                                            >
                                                {p.category}
                                            </span>
                                            <span
                                                className="px-2 py-1 rounded-lg border text-[11px] font-extrabold"
                                                style={{ backgroundColor: org.bg, color: org.fg, borderColor: org.bd }}
                                            >
                                                {p.organSystem}
                                            </span>
                                            <span
                                                className="px-2 py-1 rounded-lg border text-[11px] font-extrabold"
                                                style={{ backgroundColor: mod.bg, color: mod.fg, borderColor: mod.bd }}
                                            >
                                                {p.modality}
                                            </span>
                                            <span
                                                className="px-2 py-1 rounded-lg border text-[11px] font-extrabold"
                                                style={{ backgroundColor: "rgba(0,0,0,0.03)", color: "#0f172a", borderColor: "rgba(0,0,0,0.10)" }}
                                            >
                                                {p.specimenType}
                                            </span>
                                            <span
                                                className="px-2 py-1 rounded-lg border text-[11px] font-extrabold"
                                                style={{ backgroundColor: db.bg, color: db.fg, borderColor: db.bd }}
                                            >
                                                {p.difficulty}
                                            </span>

                                            <span className="text-[11px] font-semibold text-slate-500 ml-auto">
                                                güncellendi: {safeDateLabel(p.updatedAt)}
                                            </span>

                                            <button
                                                onClick={() => toggleFavorite(p.id)}
                                                className={pillBase()}
                                                style={isFav ? pillSelectedStyle("rgba(245,158,11,0.22)") : pillUnselectedStyle()}
                                                title={isFav ? "Favoriden çıkar" : "Favoriye ekle"}
                                            >
                                                {isFav ? "★ Favori" : "☆ Favori"}
                                            </button>

                                            <button
                                                onClick={() => copyPermalink(p.id)}
                                                className={pillBase()}
                                                style={pillUnselectedStyle()}
                                                title="Bu karta link kopyala"
                                            >
                                                Link
                                            </button>
                                        </div>

                                        {/* Title + teaser + toggle */}
                                        <button
                                            onClick={() => {
                                                setOpenIds((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(p.id)) next.delete(p.id);
                                                    else next.add(p.id);
                                                    return next;
                                                });

                                                try {
                                                    if (typeof window !== "undefined") {
                                                        const url = new URL(window.location.href);
                                                        url.hash = encodeURIComponent(p.id);
                                                        window.history.replaceState({}, "", url.toString());
                                                    }
                                                } catch {
                                                    // ignore
                                                }
                                            }}
                                            className="w-full text-left"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-base md:text-lg font-black text-slate-900 leading-tight">
                                                        {p.titleTR}
                                                        {p.titleEN ? (
                                                            <span className="ml-2 text-sm font-extrabold text-slate-500">({p.titleEN})</span>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-1 text-sm font-semibold text-slate-700">{p.teaser}</div>

                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {p.tags.slice(0, 8).map((t) => (
                                                            <span
                                                                key={t}
                                                                className="px-2 py-1 rounded-lg border text-[11px] font-extrabold"
                                                                style={{ backgroundColor: tag.bg, color: tag.fg, borderColor: tag.bd }}
                                                            >
                                                                #{t}
                                                            </span>
                                                        ))}
                                                        {p.tags.length > 8 ? (
                                                            <span className="text-[11px] font-bold text-slate-500">+{p.tags.length - 8}</span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div
                                                    className={cn("shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center font-black")}
                                                    style={{
                                                        backgroundColor: isOpen ? "rgba(59,130,246,0.12)" : "rgba(0,0,0,0.03)",
                                                        borderColor: "rgba(0,0,0,0.10)",
                                                        color: "#0f172a",
                                                    }}
                                                    aria-hidden="true"
                                                >
                                                    {isOpen ? "–" : "+"}
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    {isOpen ? (
                                        <div className="px-4 pb-4">
                                            <div className="grid lg:grid-cols-3 gap-3 mt-2">
                                                <div
                                                    className="rounded-2xl border p-4"
                                                    style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)" }}
                                                >
                                                    <div className="text-sm font-black text-slate-900">Neden yanıltır?</div>
                                                    <ul className="mt-2 space-y-1">
                                                        {p.whyItTricks.map((x, i) => (
                                                            <li key={i} className="text-sm font-semibold text-slate-800">
                                                                • {x}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div
                                                    className="rounded-2xl border p-4"
                                                    style={{ backgroundColor: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)" }}
                                                >
                                                    <div className="text-sm font-black text-slate-900">Ayırıcı ipuçları</div>
                                                    <ul className="mt-2 space-y-1">
                                                        {p.keyClues.map((x, i) => (
                                                            <li key={i} className="text-sm font-semibold text-slate-800">
                                                                • {x}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div
                                                    className="rounded-2xl border p-4"
                                                    style={{ backgroundColor: "rgba(59,130,246,0.06)", borderColor: "rgba(59,130,246,0.15)" }}
                                                >
                                                    <div className="text-sm font-black text-slate-900">Minimal çalışma</div>
                                                    <ul className="mt-2 space-y-1">
                                                        {p.minimalWorkup.map((x, i) => (
                                                            <li key={i} className="text-sm font-semibold text-slate-800">
                                                                • {x}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="grid lg:grid-cols-2 gap-3 mt-3">
                                                <div
                                                    className="rounded-2xl border p-4"
                                                    style={{ backgroundColor: "rgba(0,0,0,0.02)", borderColor: "rgba(0,0,0,0.08)" }}
                                                >
                                                    <div className="text-sm font-black text-slate-900">Raporlama ipuçları</div>
                                                    <ul className="mt-2 space-y-1">
                                                        {p.reportingTips.map((x, i) => (
                                                            <li key={i} className="text-sm font-semibold text-slate-800">
                                                                • {x}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div
                                                    className="rounded-2xl border p-4"
                                                    style={{ backgroundColor: "rgba(2,132,199,0.06)", borderColor: "rgba(2,132,199,0.15)" }}
                                                >
                                                    <div className="text-sm font-black text-slate-900">Hızlı kontrol listesi</div>
                                                    <ul className="mt-2 space-y-1">
                                                        {p.checklist.map((x, i) => (
                                                            <li key={i} className="text-sm font-semibold text-slate-800">
                                                                • {x}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {p.references?.length ? (
                                                <div
                                                    className="mt-3 rounded-2xl border p-4"
                                                    style={{ backgroundColor: "rgba(0,0,0,0.02)", borderColor: "rgba(0,0,0,0.08)" }}
                                                >
                                                    <div className="text-sm font-black text-slate-900">Kaynak / Reference</div>
                                                    <ul className="mt-2 space-y-2">
                                                        {p.references.map((r, idx) => (
                                                            <li key={`${p.id}-ref-${idx}`} className="text-sm font-semibold text-slate-800">
                                                                •{" "}
                                                                {r.url ? (
                                                                    <a className="underline text-blue-700" href={r.url} target="_blank" rel="noreferrer">
                                                                        {r.label}
                                                                    </a>
                                                                ) : (
                                                                    <span>{r.label}</span>
                                                                )}
                                                                {r.note ? <div className="text-xs font-semibold text-slate-600 mt-0.5">{r.note}</div> : null}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}

                        {filtered.length === 0 ? (
                            <div
                                className="rounded-2xl border p-6 text-slate-800 font-semibold bg-white"
                                style={{ borderColor: "rgba(0,0,0,0.10)" }}
                            >
                                Sonuç yok. Arama terimini değiştirin veya filtreleri temizleyin.
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-6 text-xs font-semibold text-slate-600">
                    Not: Bu sayfa eğitim amaçlı checklist/pitfall hatırlatıcısıdır. Tanı/tedavi kararı için kurum SOP'leri ve resmi
                    kılavuzlar esastır.
                </div>
            </div>
        </PageContainer>
    );
}
