import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
    Upload,
    ZoomIn,
    ZoomOut,
    Home,
    Maximize2,
    Minimize2,
    Microscope,
    AlertCircle,
    Loader2,
    X
} from 'lucide-react';

// OpenSeadragon will be loaded via CDN
declare global {
    interface Window {
        OpenSeadragon: any;
        GeoTIFF: any;
    }
}

export function SvsReader() {
    const viewerRef = useRef<HTMLDivElement>(null);
    const viewerInstance = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    // Load OpenSeadragon and GeoTIFF scripts
    useEffect(() => {
        const loadScript = (src: string, id: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (document.getElementById(id)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.id = id;
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });
        };

        const loadScripts = async () => {
            try {
                // Load OpenSeadragon
                await loadScript(
                    'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/openseadragon.min.js',
                    'openseadragon-script'
                );
                // Load GeoTIFF.js
                await loadScript(
                    'https://cdn.jsdelivr.net/npm/geotiff@2.1.0/dist-browser/geotiff.js',
                    'geotiff-script'
                );
                setScriptsLoaded(true);
            } catch (err) {
                setError('Kütüphaneler yüklenemedi. Lütfen sayfayı yenileyin.');
            }
        };

        loadScripts();

        return () => {
            if (viewerInstance.current) {
                viewerInstance.current.destroy();
            }
        };
    }, []);

    // Handle fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const initViewer = useCallback(async (file: File) => {
        if (!viewerRef.current || !window.OpenSeadragon) return;

        setIsLoading(true);
        setError(null);
        setFileName(file.name);

        // Destroy existing viewer
        if (viewerInstance.current) {
            viewerInstance.current.destroy();
            viewerInstance.current = null;
        }

        try {
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Parse with GeoTIFF
            const tiff = await window.GeoTIFF.fromArrayBuffer(arrayBuffer);
            const imageCount = await tiff.getImageCount();

            if (imageCount === 0) {
                throw new Error('Dosyada görüntü bulunamadı.');
            }

            // Get the first (highest resolution) image
            const image = await tiff.getImage(0);
            const width = image.getWidth();
            const height = image.getHeight();

            // Create a custom tile source for OpenSeadragon
            const tileSize = 256;

            // Create viewer
            viewerInstance.current = window.OpenSeadragon({
                element: viewerRef.current,
                prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
                showNavigator: true,
                navigatorPosition: 'BOTTOM_RIGHT',
                navigatorSizeRatio: 0.15,
                showNavigationControl: false,
                gestureSettingsMouse: {
                    scrollToZoom: true,
                    clickToZoom: true,
                    dblClickToZoom: true,
                    flickEnabled: true,
                },
                gestureSettingsTouch: {
                    pinchToZoom: true,
                    flickEnabled: true,
                },
                animationTime: 0.5,
                blendTime: 0.1,
                constrainDuringPan: true,
                maxZoomPixelRatio: 4,
                minZoomLevel: 0.1,
                visibilityRatio: 0.5,
                springStiffness: 10,
            });

            // Read the full image (for smaller files) or use tiled approach
            const rasters = await image.readRasters();
            const rgba = new Uint8ClampedArray(width * height * 4);

            // Handle different band configurations
            const numBands = rasters.length;
            for (let i = 0; i < width * height; i++) {
                if (numBands >= 3) {
                    // RGB or RGBA
                    rgba[i * 4] = rasters[0][i];     // R
                    rgba[i * 4 + 1] = rasters[1][i]; // G
                    rgba[i * 4 + 2] = rasters[2][i]; // B
                    rgba[i * 4 + 3] = numBands >= 4 ? rasters[3][i] : 255; // A
                } else {
                    // Grayscale
                    const val = rasters[0][i];
                    rgba[i * 4] = val;
                    rgba[i * 4 + 1] = val;
                    rgba[i * 4 + 2] = val;
                    rgba[i * 4 + 3] = 255;
                }
            }

            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context oluşturulamadı.');

            const imageData = new ImageData(rgba, width, height);
            ctx.putImageData(imageData, 0, 0);

            // Convert to data URL and add to viewer
            const dataUrl = canvas.toDataURL('image/png');

            viewerInstance.current.addSimpleImage({
                url: dataUrl,
                buildPyramid: true,
            });

            setIsLoading(false);
        } catch (err: any) {
            console.error('SVS loading error:', err);
            setError(err.message || 'Dosya yüklenirken bir hata oluştu.');
            setIsLoading(false);
        }
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            initViewer(file);
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && (file.name.endsWith('.svs') || file.name.endsWith('.tif') || file.name.endsWith('.tiff'))) {
            initViewer(file);
        } else {
            setError('Lütfen geçerli bir SVS veya TIFF dosyası yükleyin.');
        }
    }, [initViewer]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const zoomIn = () => {
        if (viewerInstance.current) {
            viewerInstance.current.viewport.zoomBy(1.5);
            viewerInstance.current.viewport.applyConstraints();
        }
    };

    const zoomOut = () => {
        if (viewerInstance.current) {
            viewerInstance.current.viewport.zoomBy(0.67);
            viewerInstance.current.viewport.applyConstraints();
        }
    };

    const resetView = () => {
        if (viewerInstance.current) {
            viewerInstance.current.viewport.goHome();
        }
    };

    const toggleFullscreen = async () => {
        const container = viewerRef.current?.parentElement;
        if (!container) return;

        if (!document.fullscreenElement) {
            await container.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    };

    const clearFile = () => {
        if (viewerInstance.current) {
            viewerInstance.current.destroy();
            viewerInstance.current = null;
        }
        setFileName(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <PageContainer>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white p-8 md:p-12 mb-8 rounded-xl shadow-2xl border border-[#e94560]/20">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-[#e94560]/20 rounded-xl">
                        <Microscope className="w-10 h-10 text-[#e94560]" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-[#e94560] bg-clip-text text-transparent">
                        SVS Sanal Mikroskopi
                    </h1>
                </div>
                <p className="text-white/80 max-w-3xl text-lg">
                    Aperio SVS ve TIFF formatındaki dijital patoloji slaytlarını tarayıcınızda görüntüleyin.
                    Dosyalar yalnızca tarayıcınızda işlenir, sunucuya yüklenmez.
                </p>
            </div>

            {/* Main Viewer Area */}
            <div
                className="relative bg-[#0a0a0f] rounded-xl overflow-hidden shadow-2xl border border-white/10"
                style={{ minHeight: '70vh' }}
            >
                {/* Toolbar */}
                <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-4">
                    {/* Left: File controls */}
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".svs,.tif,.tiff"
                            onChange={handleFileChange}
                            className="hidden"
                            id="svs-file-input"
                        />
                        <label
                            htmlFor="svs-file-input"
                            className="flex items-center gap-2 px-4 py-2 bg-[#e94560] hover:bg-[#ff6b6b] text-white rounded-lg cursor-pointer transition-all duration-300 shadow-lg hover:shadow-[#e94560]/30"
                        >
                            <Upload className="w-5 h-5" />
                            <span className="hidden sm:inline">Dosya Seç</span>
                        </label>

                        {fileName && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white/90 text-sm">
                                <span className="max-w-[150px] truncate">{fileName}</span>
                                <button
                                    onClick={clearFile}
                                    className="p-1 hover:bg-white/20 rounded transition-colors"
                                    title="Dosyayı Kapat"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: View controls */}
                    {fileName && !isLoading && !error && (
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg p-1">
                            <button
                                onClick={zoomIn}
                                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                                title="Yakınlaştır"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button
                                onClick={zoomOut}
                                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                                title="Uzaklaştır"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <button
                                onClick={resetView}
                                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                                title="Görünümü Sıfırla"
                            >
                                <Home className="w-5 h-5" />
                            </button>
                            <div className="w-px h-6 bg-white/20 mx-1" />
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                                title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
                            >
                                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Drop Zone / Viewer */}
                <div
                    ref={viewerRef}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="w-full h-full"
                    style={{ minHeight: '70vh' }}
                >
                    {/* Empty State */}
                    {!fileName && !isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                            <div className="p-8 border-2 border-dashed border-white/20 rounded-2xl bg-white/5 backdrop-blur-sm transition-all hover:border-[#e94560]/50 hover:bg-[#e94560]/5">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-4 bg-[#e94560]/20 rounded-full">
                                        <Upload className="w-12 h-12 text-[#e94560]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-medium text-white mb-2">
                                            SVS veya TIFF dosyası yükleyin
                                        </p>
                                        <p className="text-sm text-white/50">
                                            Dosyayı buraya sürükleyin veya yukarıdaki butona tıklayın
                                        </p>
                                    </div>
                                    {!scriptsLoaded && (
                                        <div className="flex items-center gap-2 text-yellow-400/80 text-sm mt-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Kütüphaneler yükleniyor...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                            <Loader2 className="w-16 h-16 text-[#e94560] animate-spin mb-4" />
                            <p className="text-white text-lg">Dosya işleniyor...</p>
                            <p className="text-white/50 text-sm mt-2">
                                Büyük dosyalar için bu işlem birkaç dakika sürebilir.
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div className="p-6 bg-red-500/20 border border-red-500/30 rounded-xl max-w-md text-center">
                                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                <p className="text-red-400 font-medium mb-2">Hata</p>
                                <p className="text-white/70 text-sm">{error}</p>
                                <button
                                    onClick={clearFile}
                                    className="mt-4 px-4 py-2 bg-red-500/30 hover:bg-red-500/50 text-white rounded-lg transition-colors"
                                >
                                    Yeniden Dene
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/10">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Microscope className="w-5 h-5 text-[#e94560]" />
                        Desteklenen Formatlar
                    </h3>
                    <p className="text-white/60 text-sm">
                        Aperio SVS, BigTIFF ve standart TIFF formatları desteklenmektedir.
                    </p>
                </div>
                <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/10">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Home className="w-5 h-5 text-[#e94560]" />
                        Navigasyon
                    </h3>
                    <p className="text-white/60 text-sm">
                        Fare tekerleği ile yakınlaştırın, sürükleyerek kaydırın. Çift tıklama ile hızlı zoom.
                    </p>
                </div>
                <div className="p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/10">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-[#e94560]" />
                        Gizlilik
                    </h3>
                    <p className="text-white/60 text-sm">
                        Tüm işlemler tarayıcınızda gerçekleşir. Dosyalarınız sunucuya yüklenmez.
                    </p>
                </div>
            </div>
        </PageContainer>
    );
}

export default SvsReader;
