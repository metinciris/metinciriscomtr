import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { motion, AnimatePresence } from 'motion/react';
import {
    Image as ImageIcon,
    Upload,
    Download,
    Check,
    AlertCircle,
    Loader2,
    FileArchive,
    Trash2,
    Layers,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Move,
    Columns,
    X
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import encode, { init } from '@jsquash/avif/encode';

interface ConversionItem {
    id: string;
    file: File;
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    resultBlob?: Blob;
    error?: string;
    originalSize: number;
    newSize?: number;
    previewUrl: string;
    resultUrl?: string;
    width?: number;
    height?: number;
}

export function AvifConverter() {
    const [items, setItems] = useState<ConversionItem[]>([]);
    const [quality, setQuality] = useState(40); // User's example uses 40
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ConversionItem | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isEngineReady, setIsEngineReady] = useState(false);

    // Initialize AVIF Engine
    useEffect(() => {
        const loadEngine = async () => {
            try {
                await init();
                setIsEngineReady(true);
            } catch (err) {
                console.error('Failed to initialize AVIF engine:', err);
            }
        };
        loadEngine();
    }, []);

    // Auto-start processing
    useEffect(() => {
        if (!isProcessing && isEngineReady && items.some(item => item.status === 'pending')) {
            processNext();
        }
    }, [items, isProcessing, isEngineReady]);

    const generateId = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const newItems: ConversionItem[] = [];
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const id = generateId(file);
            if (items.some(item => item.id === id)) return;

            newItems.push({
                id,
                file,
                name: file.name,
                status: 'pending',
                progress: 0,
                originalSize: file.size,
                previewUrl: URL.createObjectURL(file),
            });
        });

        setItems(prev => [...prev, ...newItems]);
    };

    const processNext = async () => {
        const nextItem = items.find(item => item.status === 'pending');
        if (!nextItem) {
            setIsProcessing(false);
            return;
        }

        setIsProcessing(true);
        updateItemStatus(nextItem.id, 'processing');

        try {
            const img = new Image();
            img.src = nextItem.previewUrl;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context could not be created');

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Convert to AVIF using new API (v2+)
            const avifBuffer = await encode(imageData, { quality });
            const resultBlob = new Blob([avifBuffer], { type: 'image/avif' });
            const resultUrl = URL.createObjectURL(resultBlob);

            setItems(prev => prev.map(item =>
                item.id === nextItem.id
                    ? {
                        ...item,
                        status: 'completed',
                        resultBlob,
                        resultUrl,
                        newSize: resultBlob.size,
                        progress: 100,
                        width: img.width,
                        height: img.height
                    }
                    : item
            ));
        } catch (error: any) {
            console.error('Conversion error:', error);
            updateItemStatus(nextItem.id, 'error', error.message || 'Dönüştürme hatası');
        } finally {
            setIsProcessing(false);
        }
    };

    const updateItemStatus = (id: string, status: ConversionItem['status'], error?: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, status, error } : item
        ));
    };

    const downloadAllAsZip = async () => {
        const completedItems = items.filter(item => item.status === 'completed' && item.resultBlob);
        if (completedItems.length === 0) return;

        const zip = new JSZip();
        completedItems.forEach(item => {
            const fileName = item.name.replace(/\.[^/.]+$/, "") + ".avif";
            zip.file(fileName, item.resultBlob!);
        });

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "avif-images.zip");
    };

    const removeFile = (id: string) => {
        setItems(prev => {
            const item = prev.find(i => i.id === id);
            if (item) {
                URL.revokeObjectURL(item.previewUrl);
                if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
            }
            return prev.filter(i => i.id !== id);
        });
    };

    const clearAll = () => {
        items.forEach(item => {
            URL.revokeObjectURL(item.previewUrl);
            if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        });
        setItems([]);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const completedCount = items.filter(i => i.status === 'completed').length;
    const isAllDone = items.length > 0 && completedCount === items.length;

    return (
        <PageContainer>
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white p-10 md:p-14 mb-10 shadow-2xl">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <ImageIcon className="w-8 h-8" />
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">Grafik Araçları</span>
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black mb-4 leading-tight"
                    >
                        AVIF Dönüştürücü
                    </motion.h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl">
                        Resimlerinizi modern AVIF formatına dönüştürerek kaliteden ödün vermeden dosya boyutlarını küçültün.
                        {!isEngineReady && <span className="block mt-2 font-bold text-amber-300">AVIF Motoru yükleniyor...</span>}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-emerald-600" />
                            Ayarlar
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-600">Kalite</label>
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold">%{quality}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <p className="text-xs text-gray-400 italic">
                                Yüksek değerler daha iyi kalite ve daha büyük dosya boyutu sağlar. Genellikle 30-50 idealdir.
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" />
                                Resim Seç
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFiles(e.target.files)}
                            />

                            <button
                                disabled={!isAllDone}
                                onClick={downloadAllAsZip}
                                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${isAllDone
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <FileArchive className="w-5 h-5" />
                                Hepsini ZIP İndir
                            </button>

                            {items.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="w-full py-2 text-red-500 hover:text-red-600 font-semibold text-sm flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Listeyi Temizle
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats / Info */}
                    {items.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-800 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Check className="w-20 h-20" />
                            </div>
                            <h4 className="text-sm font-medium text-emerald-400 uppercase tracking-wider mb-4">Özet</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-2xl font-black">{items.length}</div>
                                    <div className="text-xs text-white/60">Toplam Dosya</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black">{completedCount}</div>
                                    <div className="text-xs text-white/60">Tamamlanan</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* List Panel */}
                <div className="lg:col-span-2">
                    <div
                        className={`min-h-[500px] bg-white rounded-3xl shadow-xl border-2 border-dashed transition-all p-4 ${isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200'
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            handleFiles(e.dataTransfer.files);
                        }}
                    >
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-10">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                                    <Upload className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">Dosyalarınızı buraya bırakın</h3>
                                <p className="text-gray-400 max-w-xs">
                                    Veya "Resim Seç" butonunu kullanarak bilgisayarınızdan dosya yükleyin.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {items.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100 rounded-2xl p-3 flex items-center gap-4 transition-all"
                                        >
                                            <div
                                                className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                                                onClick={() => item.status === 'completed' && setSelectedItem(item)}
                                            >
                                                <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-800 truncate text-sm" title={item.name}>
                                                        {item.name}
                                                    </h4>
                                                    {item.status === 'completed' && (
                                                        <Check className="w-4 h-4 text-emerald-500" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                                    <span>{formatSize(item.originalSize)}</span>
                                                    {item.newSize && (
                                                        <>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <span className="text-emerald-600 font-bold">{formatSize(item.newSize)}</span>
                                                            <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded-md font-bold">
                                                                -%{Math.round((1 - item.newSize / item.originalSize) * 100)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {item.status === 'processing' && (
                                                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold px-3">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        İşleniyor
                                                    </div>
                                                )}

                                                {item.status === 'completed' && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedItem(item)}
                                                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                                            title="Kıyasla (Önce/Sonra)"
                                                        >
                                                            <Columns className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => item.resultBlob && saveAs(item.resultBlob, item.name.replace(/\.[^/.]+$/, "") + ".avif")}
                                                            className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                                                            title="İndir"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => removeFile(item.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    title="Kaldır"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comparison Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <ComparisonModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        formatSize={formatSize}
                    />
                )}
            </AnimatePresence>
        </PageContainer>
    );
}

interface ComparisonModalProps {
    item: ConversionItem;
    onClose: () => void;
    formatSize: (n: number) => string;
}

function ComparisonModal({ item, onClose, formatSize }: ComparisonModalProps) {
    const [split, setSplit] = useState(50);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const lastPos = useRef({ x: 0, y: 0 });

    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY;
        const zoomSpeed = 0.1;
        const newScale = Math.min(Math.max(scale - delta * zoomSpeed * 0.01, 0.1), 10);
        setScale(newScale);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('.split-handle')) return;
        setIsDragging(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
    };

    const handleSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSplit(parseInt(e.target.value));
    };

    const smaller = item.newSize && item.originalSize
        ? Math.round((1 - item.newSize / item.originalSize) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-10 backdrop-blur-sm"
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
            <div className="relative w-full h-full max-w-7xl flex flex-col bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
                {/* Modal Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Columns className="w-5 h-5 text-emerald-400" />
                            Görünüm Kıyasla
                        </h2>
                        <p className="text-sm text-white/50">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                            <div className="text-center">
                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Orijinal</div>
                                <div className="text-sm font-bold text-white">{formatSize(item.originalSize)}</div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center">
                                <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">AVIF</div>
                                <div className="text-sm font-bold text-emerald-400">{item.newSize ? formatSize(item.newSize) : '-'}</div>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="bg-emerald-500 text-slate-900 text-xs font-black px-2 py-1 rounded-lg">
                                -%{smaller}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Viewport */}
                <div
                    ref={viewportRef}
                    className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
                    onWheel={handleWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    <div
                        className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
                        }}
                    >
                        {/* Under: Original */}
                        <img
                            src={item.previewUrl}
                            alt="Original"
                            className="max-w-none shadow-2xl pointer-events-none"
                            style={{
                                width: item.width ? `${item.width}px` : 'auto',
                                height: item.height ? `${item.height}px` : 'auto',
                            }}
                        />

                        {/* Top: AVIF with Clip Path */}
                        <img
                            src={item.resultUrl}
                            alt="AVIF"
                            className="absolute max-w-none shadow-2xl pointer-events-none"
                            style={{
                                width: item.width ? `${item.width}px` : 'auto',
                                height: item.height ? `${item.height}px` : 'auto',
                                clipPath: `inset(0 0 0 ${split}%)`
                            }}
                        />
                    </div>

                    {/* Labels */}
                    <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10 pointer-events-none">
                        ORİJİNAL
                    </div>
                    <div className="absolute top-6 right-6 px-3 py-1.5 bg-emerald-600/60 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10 pointer-events-none">
                        AVIF
                    </div>

                    {/* Split Slider UI */}
                    <div
                        className="absolute inset-y-0 z-10 pointer-events-none"
                        style={{ left: `${split}%` }}
                    >
                        <div className="absolute inset-y-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transform -translate-x-1/2" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center pointer-events-auto cursor-ew-resize border-4 border-slate-900 group split-handle">
                            <Move className="w-4 h-4 text-slate-900 group-hover:scale-110 transition-transform" />
                        </div>
                    </div>

                    {/* Split Control Input (Invisible Layer for dragging) */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={split}
                        onChange={handleSplitChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 pointer-events-auto"
                    />
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-black/20 flex flex-wrap items-center justify-center gap-3 backdrop-blur-xl">
                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                        <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} className="p-3 text-white/70 hover:text-white transition-colors" title="Uzaklaştır"><ZoomOut className="w-5 h-5" /></button>
                        <div className="flex items-center px-4 text-sm font-bold text-white/50 w-20 justify-center">
                            %{Math.round(scale * 100)}
                        </div>
                        <button onClick={() => setScale(s => Math.min(10, s + 0.2))} className="p-3 text-white/70 hover:text-white transition-colors" title="Yakınlaştır"><ZoomIn className="w-5 h-5" /></button>
                    </div>

                    <button
                        onClick={resetView}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/5"
                    >
                        <Maximize2 className="w-5 h-5" />
                        Görünümü Sıfırla
                    </button>

                    <button
                        onClick={() => item.resultBlob && saveAs(item.resultBlob, item.name.replace(/\.[^/.]+$/, "") + ".avif")}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20"
                    >
                        <Download className="w-5 h-5" />
                        AVIF Olarak İndir
                    </button>

                    <div className="flex md:hidden items-center gap-3 text-white mt-4 w-full justify-around border-t border-white/5 pt-4">
                        <div className="text-center">
                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Orijinal</div>
                            <div className="text-sm font-bold">{formatSize(item.originalSize)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">AVIF</div>
                            <div className="text-sm font-bold text-emerald-400">-{smaller}%</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
