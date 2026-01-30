import React, { useState, useRef, useEffect } from 'react';
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
    Layers
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import encode from '@jsquash/avif';

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
}

export function AvifConverter() {
    const [items, setItems] = useState<ConversionItem[]>([]);
    const [quality, setQuality] = useState(70);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Auto-start processing when items are added
    useEffect(() => {
        if (!isProcessing && items.some(item => item.status === 'pending')) {
            processNext();
        }
    }, [items, isProcessing]);

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
            // Load image into a canvas or ImageData
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

            // Convert to AVIF
            const avifBuffer = await encode(imageData, { quality });
            const resultBlob = new Blob([avifBuffer], { type: 'image/avif' });

            setItems(prev => prev.map(item =>
                item.id === nextItem.id
                    ? { ...item, status: 'completed', resultBlob, newSize: resultBlob.size, progress: 100 }
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

    const downloadOne = (item: ConversionItem) => {
        if (!item.resultBlob) return;
        const fileName = item.name.replace(/\.[^/.]+$/, "") + ".avif";
        saveAs(item.resultBlob, fileName);
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
            if (item) URL.revokeObjectURL(item.previewUrl);
            return prev.filter(i => i.id !== id);
        });
    };

    const clearAll = () => {
        items.forEach(item => URL.revokeObjectURL(item.previewUrl));
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
                        Tamamen tarayıcı bazlı çalışır, görselleriniz sunucuya yüklenmez.
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
                                min="0"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <p className="text-xs text-gray-400 italic">
                                Düşük değerler daha küçük dosya boyutu, yüksek değerler daha iyi kalite sağlar.
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
                            {isAllDone && (
                                <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                                    Tüm dosyalar başarıyla dönüştürüldü!
                                </div>
                            )}
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
                                            <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
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
                                                            <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded-md">
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
                                                    <button
                                                        onClick={() => downloadOne(item)}
                                                        className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                                                        title="İndir"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {item.status === 'error' && (
                                                    <div className="flex items-center gap-1 text-red-500 text-xs p-2" title={item.error}>
                                                        <AlertCircle className="w-4 h-4" />
                                                        Hata
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
        </PageContainer>
    );
}
