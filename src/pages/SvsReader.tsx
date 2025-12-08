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
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerInstance = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

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
        setImageLoaded(false);

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
            setImageLoaded(true);
        } catch (err: any) {
            console.error('SVS loading error:', err);
            setError(err.message || 'Dosya yüklenirken bir hata oluştu. Dosya formatı desteklenmiyor olabilir.');
            setIsLoading(false);
        }
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file extension
            const validExtensions = ['.svs', '.tif', '.tiff', '.ndpi', '.scn', '.mrxs', '.vms', '.vmu'];
            const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (!validExtensions.includes(ext)) {
                setError(`Desteklenmeyen dosya formatı: ${ext}. Lütfen SVS, TIFF veya benzeri bir dosya seçin.`);
                return;
            }
            initViewer(file);
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            const validExtensions = ['.svs', '.tif', '.tiff', '.ndpi', '.scn', '.mrxs', '.vms', '.vmu'];
            const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            if (validExtensions.includes(ext)) {
                initViewer(file);
            } else {
                setError(`Desteklenmeyen dosya formatı: ${ext}. Lütfen SVS, TIFF veya benzeri bir dosya seçin.`);
            }
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
        const container = containerRef.current;
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
        setImageLoaded(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Styles object to avoid CSS conflicts
    const styles = {
        page: {
            backgroundColor: '#0a0a0f',
            color: '#ffffff',
            minHeight: '100vh',
            padding: '1rem',
        } as React.CSSProperties,
        header: {
            background: 'linear-gradient(to right, #1a1a2e, #16213e, #0f3460)',
            color: '#ffffff',
            padding: '2rem',
            marginBottom: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(233, 69, 96, 0.2)',
        } as React.CSSProperties,
        headerTitle: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
        } as React.CSSProperties,
        headerIcon: {
            padding: '0.75rem',
            backgroundColor: 'rgba(233, 69, 96, 0.2)',
            borderRadius: '0.75rem',
        } as React.CSSProperties,
        h1: {
            fontSize: '2rem',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #ffffff, #e94560)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
        } as React.CSSProperties,
        headerDesc: {
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '48rem',
            fontSize: '1rem',
            lineHeight: 1.6,
            margin: 0,
        } as React.CSSProperties,
        viewerContainer: {
            position: 'relative',
            backgroundColor: '#0a0a0f',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: imageLoaded ? 'calc(100vh - 200px)' : '70vh',
            minHeight: '500px',
        } as React.CSSProperties,
        toolbar: {
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            right: '1rem',
            zIndex: 20,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
        } as React.CSSProperties,
        fileControls: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        } as React.CSSProperties,
        uploadButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#e94560',
            color: '#ffffff',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
        } as React.CSSProperties,
        fileNameBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(4px)',
            borderRadius: '0.5rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.875rem',
        } as React.CSSProperties,
        closeButton: {
            padding: '0.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '0.25rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        } as React.CSSProperties,
        viewControls: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            borderRadius: '0.5rem',
            padding: '0.25rem',
        } as React.CSSProperties,
        controlButton: {
            padding: '0.5rem',
            color: '#ffffff',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
        } as React.CSSProperties,
        divider: {
            width: '1px',
            height: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            margin: '0 0.25rem',
        } as React.CSSProperties,
        viewer: {
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0f',
        } as React.CSSProperties,
        emptyState: {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
        } as React.CSSProperties,
        dropZone: {
            padding: '2rem',
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s',
            textAlign: 'center',
        } as React.CSSProperties,
        dropIcon: {
            padding: '1rem',
            backgroundColor: 'rgba(233, 69, 96, 0.2)',
            borderRadius: '50%',
            marginBottom: '1rem',
        } as React.CSSProperties,
        dropTitle: {
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#ffffff',
            marginBottom: '0.5rem',
        } as React.CSSProperties,
        dropSubtitle: {
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0,
        } as React.CSSProperties,
        loadingState: {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 10,
        } as React.CSSProperties,
        loadingText: {
            color: '#ffffff',
            fontSize: '1.125rem',
            marginTop: '1rem',
        } as React.CSSProperties,
        loadingSubtext: {
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.875rem',
            marginTop: '0.5rem',
        } as React.CSSProperties,
        errorState: {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
        } as React.CSSProperties,
        errorBox: {
            padding: '1.5rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.75rem',
            maxWidth: '28rem',
            textAlign: 'center',
        } as React.CSSProperties,
        errorTitle: {
            color: '#f87171',
            fontWeight: 500,
            marginBottom: '0.5rem',
        } as React.CSSProperties,
        errorMessage: {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
        } as React.CSSProperties,
        retryButton: {
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.3)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
        } as React.CSSProperties,
        infoGrid: {
            marginTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
        } as React.CSSProperties,
        infoCard: {
            padding: '1.5rem',
            background: 'linear-gradient(to bottom right, #1a1a2e, #16213e)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
        } as React.CSSProperties,
        infoTitle: {
            color: '#ffffff',
            fontWeight: 600,
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
        } as React.CSSProperties,
        infoText: {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            margin: 0,
        } as React.CSSProperties,
        scriptsLoading: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(250, 204, 21, 0.8)',
            fontSize: '0.875rem',
            marginTop: '0.5rem',
        } as React.CSSProperties,
    };

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerTitle}>
                    <div style={styles.headerIcon}>
                        <Microscope style={{ width: 40, height: 40, color: '#e94560' }} />
                    </div>
                    <h1 style={styles.h1}>
                        SVS Sanal Mikroskopi
                    </h1>
                </div>
                <p style={styles.headerDesc}>
                    Aperio SVS ve TIFF formatındaki dijital patoloji slaytlarını tarayıcınızda görüntüleyin.
                    Dosyalar yalnızca tarayıcınızda işlenir, sunucuya yüklenmez.
                </p>
            </div>

            {/* Main Viewer Area */}
            <div
                ref={containerRef}
                style={styles.viewerContainer}
            >
                {/* Toolbar */}
                <div style={styles.toolbar}>
                    {/* Left: File controls */}
                    <div style={styles.fileControls}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".svs,.tif,.tiff,.ndpi,.scn,.mrxs,.vms,.vmu"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="svs-file-input"
                        />
                        <label
                            htmlFor="svs-file-input"
                            style={styles.uploadButton}
                        >
                            <Upload style={{ width: 20, height: 20 }} />
                            <span>Dosya Seç</span>
                        </label>

                        {fileName && (
                            <div style={styles.fileNameBadge}>
                                <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
                                <button
                                    onClick={clearFile}
                                    style={styles.closeButton}
                                    title="Dosyayı Kapat"
                                >
                                    <X style={{ width: 16, height: 16 }} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: View controls */}
                    {fileName && !isLoading && !error && (
                        <div style={styles.viewControls}>
                            <button
                                onClick={zoomIn}
                                style={styles.controlButton}
                                title="Yakınlaştır"
                            >
                                <ZoomIn style={{ width: 20, height: 20 }} />
                            </button>
                            <button
                                onClick={zoomOut}
                                style={styles.controlButton}
                                title="Uzaklaştır"
                            >
                                <ZoomOut style={{ width: 20, height: 20 }} />
                            </button>
                            <button
                                onClick={resetView}
                                style={styles.controlButton}
                                title="Görünümü Sıfırla"
                            >
                                <Home style={{ width: 20, height: 20 }} />
                            </button>
                            <div style={styles.divider} />
                            <button
                                onClick={toggleFullscreen}
                                style={styles.controlButton}
                                title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
                            >
                                {isFullscreen ? <Minimize2 style={{ width: 20, height: 20 }} /> : <Maximize2 style={{ width: 20, height: 20 }} />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Drop Zone / Viewer */}
                <div
                    ref={viewerRef}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={styles.viewer}
                >
                    {/* Empty State */}
                    {!fileName && !isLoading && (
                        <div style={styles.emptyState}>
                            <div style={styles.dropZone}>
                                <div style={styles.dropIcon}>
                                    <Upload style={{ width: 48, height: 48, color: '#e94560' }} />
                                </div>
                                <p style={styles.dropTitle}>
                                    SVS veya TIFF dosyası yükleyin
                                </p>
                                <p style={styles.dropSubtitle}>
                                    Dosyayı buraya sürükleyin veya yukarıdaki butona tıklayın
                                </p>
                                {!scriptsLoaded && (
                                    <div style={styles.scriptsLoading}>
                                        <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                                        <span>Kütüphaneler yükleniyor...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div style={styles.loadingState}>
                            <Loader2 style={{ width: 64, height: 64, color: '#e94560', animation: 'spin 1s linear infinite' }} />
                            <p style={styles.loadingText}>Dosya işleniyor...</p>
                            <p style={styles.loadingSubtext}>
                                Büyük dosyalar için bu işlem birkaç dakika sürebilir.
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div style={styles.errorState}>
                            <div style={styles.errorBox}>
                                <AlertCircle style={{ width: 48, height: 48, color: '#f87171', margin: '0 auto 1rem' }} />
                                <p style={styles.errorTitle}>Hata</p>
                                <p style={styles.errorMessage}>{error}</p>
                                <button
                                    onClick={clearFile}
                                    style={styles.retryButton}
                                >
                                    Yeniden Dene
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section - Only show when no image is loaded */}
            {!imageLoaded && (
                <div style={styles.infoGrid}>
                    <div style={styles.infoCard}>
                        <h3 style={styles.infoTitle}>
                            <Microscope style={{ width: 20, height: 20, color: '#e94560' }} />
                            Desteklenen Formatlar
                        </h3>
                        <p style={styles.infoText}>
                            Aperio SVS, BigTIFF, NDPI ve standart TIFF formatları desteklenmektedir.
                        </p>
                    </div>
                    <div style={styles.infoCard}>
                        <h3 style={styles.infoTitle}>
                            <Home style={{ width: 20, height: 20, color: '#e94560' }} />
                            Navigasyon
                        </h3>
                        <p style={styles.infoText}>
                            Fare tekerleği ile yakınlaştırın, sürükleyerek kaydırın. Çift tıklama ile hızlı zoom.
                        </p>
                    </div>
                    <div style={styles.infoCard}>
                        <h3 style={styles.infoTitle}>
                            <AlertCircle style={{ width: 20, height: 20, color: '#e94560' }} />
                            Gizlilik
                        </h3>
                        <p style={styles.infoText}>
                            Tüm işlemler tarayıcınızda gerçekleşir. Dosyalarınız sunucuya yüklenmez.
                        </p>
                    </div>
                </div>
            )}

            {/* Add keyframes for spin animation */}
            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default SvsReader;
