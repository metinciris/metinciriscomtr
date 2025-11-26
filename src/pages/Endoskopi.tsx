import React, { useMemo, useState } from "react";
import { PageContainer } from "../components/PageContainer";

type BiopsyLocation = "Özofagus" | "Mide" | "Duodenum/Bulbus" | "İleum" | "Kolon";

type Severity = "hafif" | "orta" | "şiddetli" | null;

interface Biopsy {
    id: number;
    location: BiopsyLocation;
    subLocation: string;
    pieceCount: number;
    diagnosis: string;
    notes: string[];
    stains: string[];
    severity: Severity;
}

const LOCATION_OPTIONS: BiopsyLocation[] = [
    "Özofagus",
    "Mide",
    "Duodenum/Bulbus",
    "İleum",
    "Kolon",
];

const PREDEFINED_NOTES: Record<BiopsyLocation, string[]> = {
    Özofagus: [
        "Displazi yoktur",
        "Goblet hücre metaplazisi yoktur",
        "Goblet hücre metaplazisi vardır",
        "HP: (-)",
    ],
    Mide: [
        "Kronik aktif gastrit",
        "İntestinal metaplazi yoktur",
        "İntestinal metaplazi vardır",
        "HP: (+)",
        "HP: (-)",
    ],
    "Duodenum/Bulbus": [
        "Villus mimarisi korunmuştur",
        "İntraepitelyal lenfosit artışı yoktur",
        "İntraepitelyal lenfosit artışı vardır",
    ],
    İleum: [
        "Mukozada belirgin patoloji izlenmedi",
    ],
    Kolon: [
        "Kronik kolit",
        "Aktivasyon yoktur",
        "Aktivasyon mevcuttur",
    ],
};

const AUTO_STAINS: Record<BiopsyLocation, string[]> = {
    Özofagus: ["PAS+AB"],
    Mide: ["PAS+AB", "Warthin Starry"],
    "Duodenum/Bulbus": ["PAS"],
    İleum: [],
    Kolon: [],
};

const SEVERITY_LABEL: Record<Exclude<Severity, null>, string> = {
    hafif: "Hafif",
    orta: "Orta",
    şiddetli: "Şiddetli",
};

export function Endoskopi() {
    const [biopsies, setBiopsies] = useState<Biopsy[]>([]);
    const [location, setLocation] = useState<BiopsyLocation>("Mide");
    const [subLocation, setSubLocation] = useState("");
    const [pieceCount, setPieceCount] = useState<number>(1);
    const [diagnosis, setDiagnosis] = useState("");
    const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
    const [customNote, setCustomNote] = useState("");
    const [selectedStains, setSelectedStains] = useState<string[]>([]);
    const [severity, setSeverity] = useState<Severity>(null);
    const [copied, setCopied] = useState(false);

    const resetForm = () => {
        setLocation("Mide");
        setSubLocation("");
        setPieceCount(1);
        setDiagnosis("");
        setSelectedNotes([]);
        setCustomNote("");
        setSelectedStains([]);
        setSeverity(null);
    };

    const handleToggleNote = (note: string) => {
        setSelectedNotes((prev) =>
            prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
        );
    };

    const handleToggleStain = (stain: string) => {
        setSelectedStains((prev) =>
            prev.includes(stain) ? prev.filter((s) => s !== stain) : [...prev, stain]
        );
    };

    const handleAddCustomNote = () => {
        const trimmed = customNote.trim();
        if (!trimmed) return;
        if (!selectedNotes.includes(trimmed)) {
            setSelectedNotes((prev) => [...prev, trimmed]);
        }
        setCustomNote("");
    };

    const handleAddBiopsy = () => {
        if (!diagnosis.trim()) return;

        const allNotes = selectedNotes;
        const allStains = selectedStains.length
            ? selectedStains
            : AUTO_STAINS[location] || [];

        const newBiopsy: Biopsy = {
            id: Date.now(),
            location,
            subLocation: subLocation.trim(),
            pieceCount: pieceCount || 1,
            diagnosis: diagnosis.trim(),
            notes: allNotes,
            stains: allStains,
            severity,
        };

        setBiopsies((prev) => [...prev, newBiopsy]);
        resetForm();
    };

    const handleDeleteBiopsy = (id: number) => {
        setBiopsies((prev) => prev.filter((b) => b.id !== id));
    };

    const handleResetAll = () => {
        setBiopsies([]);
        resetForm();
    };

    const reportText = useMemo(() => {
        if (!biopsies.length) return "";

        return biopsies
            .map((b, index) => {
                const idx = index + 1;
                const locStr = b.subLocation
                    ? `${b.location}, ${b.subLocation}`
                    : b.location;

                const severityStr =
                    b.severity && SEVERITY_LABEL[b.severity]
                        ? ` (${SEVERITY_LABEL[b.severity]})`
                        : "";

                const header = `${idx}- ${locStr}, endoskopik biyopsi: ${b.diagnosis}${severityStr}.`;

                const pieceLine = `Örnek sayısı: ${b.pieceCount}.`;

                const notesStr = b.notes.length
                    ? "Notlar: " + b.notes.join("; ") + "."
                    : "";

                const stainStr = b.stains.length
                    ? "Ek çalışmalar: " + b.stains.join(", ") + "."
                    : "";

                return [header, pieceLine, notesStr, stainStr]
                    .filter(Boolean)
                    .join(" ");
            })
            .join("\n\n");
    }, [biopsies]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(reportText);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error("Kopyalama hatası", err);
        }
    };

    return (
        <PageContainer>
            <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white p-12 mb-8 rounded-xl shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-white mb-4 text-4xl font-bold">Endoskopi Raporlama</h1>
                        <p className="text-white/90 max-w-3xl text-lg">
                            Sık rastlanılan gastrointestinal sistem endoskopi raporlama aracı.
                        </p>
                    </div>
                    <button
                        onClick={handleResetAll}
                        className="text-sm px-4 py-2 bg-red-500/20 border border-red-400/50 text-red-100 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                        Hepsini Sıfırla
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol taraf: form */}
                <section className="space-y-4">
                    <div className="bg-white rounded-xl shadow p-6 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                            Biyopsi Bilgileri
                        </h2>

                        {/* Lokasyon & sublokasyon */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lokasyon
                                </label>
                                <select
                                    value={location}
                                    onChange={(e) =>
                                        setLocation(e.target.value as BiopsyLocation)
                                    }
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                >
                                    {LOCATION_OPTIONS.map((loc) => (
                                        <option key={loc} value={loc}>
                                            {loc}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sublokasyon
                                </label>
                                <input
                                    value={subLocation}
                                    onChange={(e) => setSubLocation(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                    placeholder="Örn: Antrum, Korpus..."
                                />
                            </div>
                        </div>

                        {/* Parça sayısı, tanı, şiddet */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Biyopsi sayısı
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={pieceCount}
                                    onChange={(e) => setPieceCount(Number(e.target.value) || 1)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanı
                                </label>
                                <input
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                    placeholder="Örn: Kronik aktif gastrit"
                                />
                            </div>
                        </div>

                        {/* Şiddet seçimi */}
                        <div>
                            <span className="block text-sm font-medium text-gray-700 mb-2">
                                Şiddet (opsiyonel)
                            </span>
                            <div className="inline-flex rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {(["hafif", "orta", "şiddetli"] as Severity[]).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() =>
                                            setSeverity((prev) => (prev === s ? null : s))
                                        }
                                        className={`px-4 py-2 text-sm transition-colors ${severity === s
                                                ? "bg-blue-600 text-white"
                                                : "bg-white text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        {SEVERITY_LABEL[s as Exclude<Severity, null>]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notlar */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">
                                Hazır Notlar ({location})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {PREDEFINED_NOTES[location]?.map((note) => (
                                    <button
                                        key={note}
                                        type="button"
                                        onClick={() => handleToggleNote(note)}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedNotes.includes(note)
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        {note}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    value={customNote}
                                    onChange={(e) => setCustomNote(e.target.value)}
                                    className="flex-1 rounded-lg border-gray-300 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                    placeholder="Ek not ekle..."
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomNote}
                                    className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors"
                                >
                                    Not Ekle
                                </button>
                            </div>
                        </div>

                        {/* Boyalar */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Ek Boyalar</p>
                            <div className="flex flex-wrap gap-2">
                                {(AUTO_STAINS[location] || []).map((stain) => (
                                    <button
                                        key={stain}
                                        type="button"
                                        onClick={() => handleToggleStain(stain)}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedStains.includes(stain)
                                                ? "bg-green-600 text-white border-green-600"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        {stain}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">
                                Herhangi bir boya seçmezsen, bu lokasyon için varsayılan
                                oto-boyalar rapora eklenecek.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Formu Temizle
                            </button>
                            <button
                                type="button"
                                onClick={handleAddBiopsy}
                                className="px-6 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                            >
                                Biyopsiyi Ekle
                            </button>
                        </div>
                    </div>

                    {/* Eklenen biyopsiler listesi */}
                    {biopsies.length > 0 && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                Eklenen Biyopsiler
                            </h3>
                            <div className="space-y-3 max-h-96 overflow-auto pr-2">
                                {biopsies.map((b, index) => (
                                    <div
                                        key={b.id}
                                        className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="text-sm text-gray-700 space-y-1">
                                            <div className="font-semibold text-gray-900">
                                                {index + 1}. {b.location}
                                                {b.subLocation ? `, ${b.subLocation}` : ""} (
                                                {b.pieceCount} parça)
                                            </div>
                                            <div><span className="font-medium">Tanı:</span> {b.diagnosis}</div>
                                            {b.severity && (
                                                <div><span className="font-medium">Şiddet:</span> {SEVERITY_LABEL[b.severity]}</div>
                                            )}
                                            {b.notes.length > 0 && (
                                                <div><span className="font-medium">Notlar:</span> {b.notes.join("; ")}</div>
                                            )}
                                            {b.stains.length > 0 && (
                                                <div><span className="font-medium">Ek boyalar:</span> {b.stains.join(", ")}</div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteBiopsy(b.id)}
                                            className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Sağ taraf: rapor önizleme */}
                <section className="bg-white rounded-xl shadow p-6 flex flex-col h-fit sticky top-24">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            Rapor Metni
                        </h2>
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!reportText}
                            className={`px-4 py-2 text-sm rounded-lg border transition-all ${reportText
                                    ? "border-blue-500 text-blue-600 hover:bg-blue-50 font-medium"
                                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {copied ? "Kopyalandı!" : "Panoya Kopyala"}
                        </button>
                    </div>

                    <textarea
                        readOnly
                        value={reportText}
                        className="w-full h-[500px] text-sm font-mono rounded-lg border border-gray-200 p-4 resize-none focus:outline-none bg-gray-50"
                        placeholder="Biyopsi ekledikçe rapor burada oluşacak..."
                    />

                    <p className="text-xs text-gray-500 mt-3 text-center">
                        Oluşan metni HIS / rapor ekranına direkt yapıştırabilirsiniz.
                    </p>
                </section>
            </div>
        </PageContainer>
    );
}
