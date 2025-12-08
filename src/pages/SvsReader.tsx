// src/pages/SvsReader.tsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
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
  X,
} from 'lucide-react';

// OpenSeadragon & GeoTIFF CDN'den gelecek
declare global {
  interface Window {
    OpenSeadragon: any;
    GeoTIFF: any;
  }
}

export function SvsReader() {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerInstance = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // OpenSeadragon ve GeoTIFF scriptlerini yükle
  useEffect(() => {
    const loadScript = (src: string, id: string): Promise<void> =>
      new Promise((resolve, reject) => {
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

    const loadScripts = async () => {
      try {
        await loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/openseadragon.min.js',
          'openseadragon-script'
        );
        await loadScript(
          'https://cdn.jsdelivr.net/npm/geotiff@2.1.0/dist-browser/geotiff.js',
          'geotiff-script'
        );
        setScriptsLoaded(true);
      } catch (e) {
        console.error(e);
        setError(
          'Gerekli kütüphaneler yüklenemedi.\nLütfen sayfayı yenileyin.'
        );
      }
    };

    loadScripts();

    return () => {
      if (viewerInstance.current) {
        viewerInstance.current.destroy();
        viewerInstance.current = null;
      }
    };
  }, []);

  // Fullscreen takibi
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const initViewer = useCallback(async (file: File) => {
    if (!viewerRef.current) return;
    if (!window.OpenSeadragon || !window.GeoTIFF) {
      setError(
        'Gerekli kütüphaneler henüz yüklenmedi. Birkaç saniye sonra tekrar deneyin.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    setImageLoaded(false);

    // Eski viewer'ı temizle
    if (viewerInstance.current) {
      viewerInstance.current.destroy();
      viewerInstance.current = null;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();

      const tiff = await window.GeoTIFF.fromArrayBuffer(arrayBuffer);
      const imageCount = await tiff.getImageCount();
      if (imageCount === 0) {
        throw new Error('Dosyada görüntü bulunamadı.');
      }

      // En büyük level'i bul (piksel sayısına göre)
      let targetIndex = 0;
      let maxPixels = 0;
      for (let i = 0; i < imageCount; i++) {
        const img = await tiff.getImage(i);
        const w = img.getWidth();
        const h = img.getHeight();
        const pixels = w * h;
        if (pixels > maxPixels) {
          maxPixels = pixels;
          targetIndex = i;
        }
      }

      const image = await tiff.getImage(targetIndex);
      const origWidth = image.getWidth();
      const origHeight = image.getHeight();

      const fd = image.fileDirectory;
      const samplesPerPixel = image.getSamplesPerPixel();
      const bitsField = fd.BitsPerSample;
      const bits = Array.isArray(bitsField) ? bitsField[0] : bitsField;
      const photometric = fd.PhotometricInterpretation;

      console.log('SVS metadata', {
        origWidth,
        origHeight,
        samplesPerPixel,
        bitsField,
        bits,
        photometric,
        imageCount,
        targetIndex,
      });

      // Büyük görüntüler için otomatik downsample
      const MAX_DIM = 4000; // En uzun kenar en fazla 4000 px
      const scale = Math.min(
        1,
        MAX_DIM / origWidth,
        MAX_DIM / origHeight
      );
      const width = Math.max(1, Math.round(origWidth * scale));
      const height = Math.max(1, Math.round(origHeight * scale));

      console.log('Render size', { width, height, scale });

      // Raster oku (geotiff.js downsample'ı kendi yapacak)
      const rasters = await image.readRasters({
        interleave: true,
        width,
        height,
      });

      const pixelCount = width * height;
      const rgba = new Uint8ClampedArray(pixelCount * 4);

      const normalize16To8 = (v: number) => v >> 8; // ≈ v/257

      if (samplesPerPixel >= 3) {
        // Renkli görüntü (RGB / YCbCr vs.)
        if (bits === 8) {
          const data = rasters as Uint8Array;
          for (let i = 0; i < pixelCount; i++) {
            const src = i * samplesPerPixel;
            const dst = i * 4;
            rgba[dst] = data[src];         // R
            rgba[dst + 1] = data[src + 1]; // G
            rgba[dst + 2] = data[src + 2]; // B
            rgba[dst + 3] = 255;           // A
          }
        } else if (bits === 16) {
          const data = rasters as Uint16Array;
          for (let i = 0; i < pixelCount; i++) {
            const src = i * samplesPerPixel;
            const dst = i * 4;
            rgba[dst] = normalize16To8(data[src]);
            rgba[dst + 1] = normalize16To8(data[src + 1]);
            rgba[dst + 2] = normalize16To8(data[src + 2]);
            rgba[dst + 3] = 255;
          }
        } else {
          console.warn(
            'Beklenmeyen bit derinliği (RGB):',
            bitsField
          );
          throw new Error(
            `Bu SVS bit derinliği şu anda desteklenmiyor: ${bitsField}`
          );
        }
      } else if (samplesPerPixel === 1) {
        // Gri tonlama
        if (bits === 8) {
          const data = rasters as Uint8Array;
          for (let i = 0; i < pixelCount; i++) {
            let val = data[i];
            // WhiteIsZero ise invert et
            if (photometric === 0) {
              val = 255 - val;
            }
            const dst = i * 4;
            rgba[dst] = rgba[dst + 1] = rgba[dst + 2] = val;
            rgba[dst + 3] = 255;
          }
        } else if (bits === 16) {
          const data = rasters as Uint16Array;
          for (let i = 0; i < pixelCount; i++) {
            let v16 = data[i];
            if (photometric === 0) {
              v16 = 65535 - v16;
            }
            const val = normalize16To8(v16);
            const dst = i * 4;
            rgba[dst] = rgba[dst + 1] = rgba[dst + 2] = val;
            rgba[dst + 3] = 255;
          }
        } else {
          console.warn(
            'Beklenmeyen bit derinliği (gri):',
            bitsField
          );
          throw new Error(
            `Bu SVS gri ton bit derinliği şu anda desteklenmiyor: ${bitsField}`
          );
        }
      } else {
        throw new Error(
          `Desteklenmeyen kanal sayısı (SamplesPerPixel = ${samplesPerPixel})`
        );
      }

      // Canvas oluşturup çiz
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context oluşturulamadı.');
      }
      const imageData = new ImageData(rgba, width, height);
      ctx.putImageData(imageData, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');

      // OpenSeadragon viewer
      viewerInstance.current = window.OpenSeadragon({
        element: viewerRef.current,
        prefixUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
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

      viewerInstance.current.addSimpleImage({
        url: dataUrl,
        buildPyramid: true,
      });

      setIsLoading(false);
      setImageLoaded(true);
    } catch (err: any) {
      console.error('SVS yükleme hatası:', err);
      setError(
        err?.message ||
          'Dosya yüklenirken bir hata oluştu.\nDosya formatı desteklenmiyor olabilir.'
      );
      setIsLoading(false);
      setImageLoaded(false);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = [
      '.svs',
      '.tif',
      '.tiff',
      '.ndpi',
      '.scn',
      '.mrxs',
      '.vms',
      '.vmu',
    ];
    const ext = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(ext)) {
      setError(
        `Desteklenmeyen dosya formatı: ${ext}.\nLütfen SVS, TIFF veya benzeri bir dosya seçin.`
      );
      return;
    }

    initViewer(file);
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (!file) return;

      const validExtensions = [
        '.svs',
        '.tif',
        '.tiff',
        '.ndpi',
        '.scn',
        '.mrxs',
        '.vms',
        '.vmu',
      ];
      const ext = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf('.'));

      if (validExtensions.includes(ext)) {
        initViewer(file);
      } else {
        setError(
          `Desteklenmeyen dosya formatı: ${ext}.\nLütfen SVS, TIFF veya benzeri bir dosya seçin.`
        );
      }
    },
    [initViewer]
  );

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

  // inline stiller (senin tema ile uyumlu)
  const styles = {
    page: {
      backgroundColor: '#0a0a0f',
      color: '#ffffff',
      minHeight: '100vh',
      padding: '1rem',
    } as React.CSSProperties,
    header: {
      background:
        'linear-gradient(to right, #1a1a2e, #16213e, #0f3460)',
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
      padding: '1.5rem',
      textAlign: 'center',
    } as React.CSSProperties,
    dropZone: {
      padding: '2rem',
      border: '2px dashed rgba(255, 255, 255, 0.2)',
      borderRadius: '1rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(4px)',
      transition: 'all 0.3s',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    } as React.CSSProperties,
    errorMessage: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '0.875rem',
      marginBottom: '1rem',
      whiteSpace: 'pre-wrap',
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
  };

  return (
    <PageContainer>
      <div id="svs-reader" style={styles.page}>
        <header style={styles.header}>
          <div style={styles.headerTitle}>
            <div style={styles.headerIcon}>
              <Microscope size={28} />
            </div>
            <div>
              <h1 style={styles.h1}>SVS Sanal Mikroskopi</h1>
              <p style={styles.headerDesc}>
                Aperio SVS ve TIFF formatındaki dijital patoloji slaytlarını
                tarayıcınızda görüntüleyin. Dosyalar yalnızca tarayıcınızda
                işlenir, sunucuya yüklenmez.
              </p>
              {!scriptsLoaded && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'rgba(250, 204, 21, 0.8)',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <Loader2
                    size={16}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  <span>Kütüphaneler yükleniyor...</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          ref={containerRef}
          style={styles.viewerContainer}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Toolbar */}
          <div style={styles.toolbar}>
            <div style={styles.fileControls}>
              <label style={styles.uploadButton}>
                <Upload size={18} />
                <span>
                  {scriptsLoaded
                    ? 'Dosya Seç'
                    : 'Kütüphane yükleniyor...'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svs,.tif,.tiff,.ndpi,.scn,.mrxs,.vms,.vmu"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={!scriptsLoaded}
                />
              </label>
              {fileName && (
                <div style={styles.fileNameBadge}>
                  <span
                    style={{
                      maxWidth: '220px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={fileName}
                  >
                    {fileName}
                  </span>
                  <button
                    type="button"
                    style={styles.closeButton}
                    onClick={clearFile}
                    aria-label="Dosyayı kapat"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {fileName && !isLoading && !error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '0.5rem',
                  padding: '0.25rem',
                }}
              >
                <button
                  type="button"
                  style={styles.controlButton}
                  onClick={zoomOut}
                  title="Uzaklaştır"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  type="button"
                  style={styles.controlButton}
                  onClick={zoomIn}
                  title="Yakınlaştır"
                >
                  <ZoomIn size={18} />
                </button>
                <div style={styles.divider} />
                <button
                  type="button"
                  style={styles.controlButton}
                  onClick={resetView}
                  title="Başlangıç görünümü"
                >
                  <Home size={18} />
                </button>
                <div style={styles.divider} />
                <button
                  type="button"
                  style={styles.controlButton}
                  onClick={toggleFullscreen}
                  title="Tam ekran"
                >
                  {isFullscreen ? (
                    <Minimize2 size={18} />
                  ) : (
                    <Maximize2 size={18} />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* OpenSeadragon container */}
          <div ref={viewerRef} style={{ width: '100%', height: '100%' }} />

          {/* Boş durum */}
          {!fileName && !isLoading && !error && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  padding: '2rem',
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(233, 69, 96, 0.2)',
                    borderRadius: '50%',
                    marginBottom: '1rem',
                    display: 'inline-flex',
                  }}
                >
                  <Microscope size={32} />
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    color: '#ffffff',
                    marginBottom: '0.5rem',
                  }}
                >
                  SVS veya TIFF dosyası yükleyin
                </div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: 0,
                  }}
                >
                  Dosyayı buraya sürükleyin veya yukarıdaki butona
                  tıklayın.
                </p>
              </div>
            </div>
          )}

          {/* Yükleniyor */}
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 10,
              }}
            >
              <Loader2
                size={40}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <div
                style={{
                  color: '#ffffff',
                  fontSize: '1.125rem',
                  marginTop: '1rem',
                }}
              >
                Dosya işleniyor...
              </div>
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                  textAlign: 'center',
                }}
              >
                Büyük slaytlar için bu işlem biraz sürebilir. Tüm işlem
                tarayıcınızda gerçekleşir.
              </div>
            </div>
          )}

          {/* Hata */}
          {error && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.75rem',
                  maxWidth: '28rem',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    color: '#f87171',
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={18} />
                  Hata
                </div>
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {error}
                </div>
                <button
                  type="button"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setError(null);
                    setIsLoading(false);
                    setImageLoaded(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    if (viewerInstance.current) {
                      viewerInstance.current.destroy();
                      viewerInstance.current = null;
                    }
                    setFileName(null);
                  }}
                >
                  Yeniden Dene
                </button>
              </div>
            </div>
          )}
        </div>

        <style>
          {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
        </style>
      </div>
    </PageContainer>
  );
}

export default SvsReader;
