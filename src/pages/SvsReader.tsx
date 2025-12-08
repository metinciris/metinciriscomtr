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
  Shield,
  Cpu,
} from 'lucide-react';

// OpenSeadragon & GeoTIFF UMD (CDN'den)
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

    // Eski viewer’ı temizle
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

      // En büyük level’i bul (piksel sayısına göre)
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
      const photometric = fd.PhotometricInterpretation;

      console.log('SVS metadata', {
        origWidth,
        origHeight,
        samplesPerPixel,
        bitsField,
        photometric,
        imageCount,
        targetIndex,
      });

      // RAM patlamasın diye en uzun kenarı sınırla
      const MAX_DIM = 4000; // istersen artırabilirsin
      const scale = Math.min(
        1,
        MAX_DIM / origWidth,
        MAX_DIM / origHeight
      );
      const width = Math.max(1, Math.round(origWidth * scale));
      const height = Math.max(1, Math.round(origHeight * scale));

      console.log('Render size', { width, height, scale });

      // YCbCr / palette / RGB fark etmeksizin RGB'ye çevir
      const rgb: any = await image.readRGB({
        width,
        height,
        interleave: true,
      });

      const data = rgb as Uint8Array; // [R,G,B,R,G,B,...]
      const pixelCount = width * height;
      const rgba = new Uint8ClampedArray(pixelCount * 4);

      for (let i = 0; i < pixelCount; i++) {
        const src = i * 3;
        const dst = i * 4;
        rgba[dst] = data[src];
        rgba[dst + 1] = data[src + 1];
        rgba[dst + 2] = data[src + 2];
        rgba[dst + 3] = 255;
      }

      // Canvas’a çiz
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

  // Stil – daha modern layout
  const styles = {
    pageOuter: {
      background:
        'radial-gradient(circle at top left, #1e293b 0, #020617 45%, #000 100%)',
      color: '#e5e7eb',
      minHeight: '100vh',
      padding: '2rem 1rem 3rem',
    } as React.CSSProperties,
    pageInner: {
      maxWidth: '1200px',
      margin: '0 auto',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '1.75rem 1.75rem 1.5rem',
      borderRadius: '1rem',
      border: '1px solid rgba(148, 163, 184, 0.4)',
      background:
        'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.65))',
      boxShadow: '0 20px 40px rgba(15,23,42,0.6)',
      marginBottom: '1.75rem',
    } as React.CSSProperties,
    headerTop: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as React.CSSProperties,
    headerTitleBlock: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      flex: '1 1 260px',
    } as React.CSSProperties,
    headerIcon: {
      padding: '0.8rem',
      borderRadius: '0.9rem',
      background:
        'radial-gradient(circle at 30% 10%, rgba(248,250,252,0.18), rgba(15,23,42,0.8))',
      border: '1px solid rgba(248,250,252,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,
    h1: {
      fontSize: '1.9rem',
      lineHeight: 1.2,
      fontWeight: 700,
      margin: 0,
      background:
        'linear-gradient(to right, #f9fafb, #e5e7eb, #f97316)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    } as React.CSSProperties,
    headerDesc: {
      marginTop: '0.35rem',
      fontSize: '0.95rem',
      maxWidth: '30rem',
      color: 'rgba(226,232,240,0.85)',
    } as React.CSSProperties,
    headerBadges: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
    } as React.CSSProperties,
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.4rem 0.7rem',
      borderRadius: '999px',
      border: '1px solid rgba(148,163,184,0.45)',
      fontSize: '0.75rem',
      color: 'rgba(226,232,240,0.9)',
      backgroundColor: 'rgba(15,23,42,0.6)',
      backdropFilter: 'blur(10px)',
    } as React.CSSProperties,
    scriptsLoading: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      fontSize: '0.8rem',
      color: 'rgba(252,211,77,0.9)',
      marginTop: '0.25rem',
    } as React.CSSProperties,
    mainLayout: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    } as React.CSSProperties,
    viewerCard: {
      position: 'relative',
      borderRadius: '1rem',
      border: '1px solid rgba(148,163,184,0.45)',
      background:
        'radial-gradient(circle at top left, rgba(15,23,42,0.95), rgba(15,23,42,0.98))',
      boxShadow: '0 20px 40px rgba(15,23,42,0.7)',
      overflow: 'hidden',
      minHeight: '480px',
      height: imageLoaded ? '68vh' : '60vh',
      maxHeight: 'calc(100vh - 220px)',
    } as React.CSSProperties,
    viewerContainer: {
      width: '100%',
      height: '100%',
    } as React.CSSProperties,
    toolbar: {
      position: 'absolute',
      top: '0.85rem',
      left: '0.85rem',
      right: '0.85rem',
      zIndex: 20,
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.75rem',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as React.CSSProperties,
    fileControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap',
    } as React.CSSProperties,
    uploadButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.95rem',
      borderRadius: '999px',
      border: '1px solid rgba(248,250,252,0.15)',
      background:
        'linear-gradient(135deg, #f97316, #ec4899)',
      color: '#f9fafb',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: 500,
      boxShadow: '0 12px 25px rgba(236,72,153,0.35)',
      transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    } as React.CSSProperties,
    fileNameBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.4rem 0.7rem',
      borderRadius: '999px',
      border: '1px solid rgba(148,163,184,0.6)',
      backgroundColor: 'rgba(15,23,42,0.9)',
      color: 'rgba(226,232,240,0.9)',
      fontSize: '0.75rem',
      maxWidth: '260px',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,
    fileNameText: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    } as React.CSSProperties,
    chip: {
      padding: '0.18rem 0.45rem',
      borderRadius: '999px',
      backgroundColor: 'rgba(34,197,94,0.15)',
      color: 'rgba(74,222,128,0.95)',
      fontSize: '0.7rem',
      fontWeight: 500,
    } as React.CSSProperties,
    closeButton: {
      padding: '0.15rem',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: 'rgba(148,163,184,0.9)',
      borderRadius: '999px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } as React.CSSProperties,
    viewControls: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.25rem',
      borderRadius: '999px',
      border: '1px solid rgba(148,163,184,0.6)',
      backgroundColor: 'rgba(15,23,42,0.85)',
      backdropFilter: 'blur(12px)',
    } as React.CSSProperties,
    controlButton: {
      padding: '0.4rem',
      borderRadius: '999px',
      border: 'none',
      background: 'transparent',
      color: 'rgba(226,232,240,0.9)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.15s ease',
    } as React.CSSProperties,
    divider: {
      width: '1px',
      height: '1.35rem',
      backgroundColor: 'rgba(148,163,184,0.6)',
    } as React.CSSProperties,
    emptyOverlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    } as React.CSSProperties,
    emptyBox: {
      pointerEvents: 'auto',
      padding: '2.25rem 2rem',
      borderRadius: '1rem',
      border: '1px dashed rgba(148,163,184,0.7)',
      background:
        'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.96))',
      textAlign: 'center',
      maxWidth: '420px',
    } as React.CSSProperties,
    emptyIconWrap: {
      padding: '0.9rem',
      borderRadius: '999px',
      backgroundColor: 'rgba(59,130,246,0.15)',
      border: '1px solid rgba(96,165,250,0.6)',
      display: 'inline-flex',
      marginBottom: '0.75rem',
    } as React.CSSProperties,
    emptyTitle: {
      margin: 0,
      fontSize: '1.2rem',
      fontWeight: 600,
      color: '#f9fafb',
    } as React.CSSProperties,
    emptyText: {
      marginTop: '0.4rem',
      fontSize: '0.85rem',
      color: 'rgba(148,163,184,0.9)',
    } as React.CSSProperties,
    loadingOverlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(15,23,42,0.92)',
      zIndex: 10,
    } as React.CSSProperties,
    loadingText: {
      color: '#f9fafb',
      fontSize: '1rem',
      marginTop: '0.8rem',
    } as React.CSSProperties,
    loadingSub: {
      color: 'rgba(148,163,184,0.9)',
      fontSize: '0.8rem',
      marginTop: '0.35rem',
    } as React.CSSProperties,
    errorOverlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    } as React.CSSProperties,
    errorBox: {
      padding: '1.5rem 1.75rem',
      borderRadius: '1rem',
      border: '1px solid rgba(248,113,113,0.8)',
      background:
        'radial-gradient(circle at top left, rgba(127,29,29,0.95), rgba(15,23,42,0.95))',
      maxWidth: '420px',
      textAlign: 'center',
    } as React.CSSProperties,
    errorTitle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      color: '#fecaca',
      fontWeight: 600,
      marginBottom: '0.4rem',
    } as React.CSSProperties,
    errorText: {
      fontSize: '0.8rem',
      color: 'rgba(254,242,242,0.9)',
      marginBottom: '0.9rem',
      whiteSpace: 'pre-wrap',
    } as React.CSSProperties,
    retryButton: {
      padding: '0.45rem 1.1rem',
      borderRadius: '999px',
      border: 'none',
      backgroundColor: 'rgba(248,113,113,0.9)',
      color: '#111827',
      fontSize: '0.8rem',
      fontWeight: 600,
      cursor: 'pointer',
    } as React.CSSProperties,
    infoGrid: {
      marginTop: '1.5rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1rem',
    } as React.CSSProperties,
    infoCard: {
      padding: '1.1rem 1.2rem',
      borderRadius: '0.9rem',
      border: '1px solid rgba(148,163,184,0.4)',
      background:
        'linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))',
      boxShadow: '0 10px 25px rgba(15,23,42,0.6)',
    } as React.CSSProperties,
    infoTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.85rem',
      fontWeight: 600,
      color: '#e5e7eb',
      marginBottom: '0.35rem',
    } as React.CSSProperties,
    infoText: {
      fontSize: '0.8rem',
      color: 'rgba(148,163,184,0.95)',
      lineHeight: 1.5,
    } as React.CSSProperties,
  };

  return (
    <PageContainer>
      <div style={styles.pageOuter}>
        <div style={styles.pageInner}>
          {/* HEADER */}
          <header style={styles.header}>
            <div style={styles.headerTop}>
              <div style={styles.headerTitleBlock}>
                <div style={styles.headerIcon}>
                  <Microscope size={26} />
                </div>
                <div>
                  <h1 style={styles.h1}>SVS Sanal Mikroskopi</h1>
                  <p style={styles.headerDesc}>
                    Aperio SVS ve TIFF formatlı dijital patoloji slaytlarını
                    doğrudan tarayıcınızda görüntüleyin. Dosyalar sadece
                    cihazınızda işlenir.
                  </p>
                  {!scriptsLoaded && (
                    <div style={styles.scriptsLoading}>
                      <Loader2
                        size={14}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                      <span>Kütüphaneler yükleniyor...</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.headerBadges}>
                <span style={styles.badge}>
                  <Cpu size={13} />
                  <span>İstemci taraflı işleme</span>
                </span>
                <span style={styles.badge}>
                  <Shield size={13} />
                  <span>Veri sunucuya çıkmaz</span>
                </span>
              </div>
            </div>
          </header>

          <main style={styles.mainLayout}>
            {/* VIEWER CARD */}
            <section
              ref={containerRef}
              style={styles.viewerCard}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Toolbar */}
              <div style={styles.toolbar}>
                {/* Sol: dosya kontrolleri */}
                <div style={styles.fileControls}>
                  <label style={styles.uploadButton}>
                    <Upload size={16} />
                    <span>
                      {scriptsLoaded ? 'Slayt Yükle' : 'Yükleniyor...'}
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
                      <span style={styles.chip}>yerel dosya</span>
                      <span style={styles.fileNameText} title={fileName}>
                        {fileName}
                      </span>
                      <button
                        type="button"
                        style={styles.closeButton}
                        onClick={clearFile}
                        aria-label="Dosyayı kapat"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Sağ: görünüm kontrolleri */}
                {fileName && !isLoading && !error && (
                  <div style={styles.viewControls}>
                    <button
                      type="button"
                      style={styles.controlButton}
                      onClick={zoomOut}
                      title="Uzaklaştır"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button
                      type="button"
                      style={styles.controlButton}
                      onClick={zoomIn}
                      title="Yakınlaştır"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <div style={styles.divider} />
                    <button
                      type="button"
                      style={styles.controlButton}
                      onClick={resetView}
                      title="Başlangıç görünümü"
                    >
                      <Home size={16} />
                    </button>
                    <div style={styles.divider} />
                    <button
                      type="button"
                      style={styles.controlButton}
                      onClick={toggleFullscreen}
                      title="Tam ekran"
                    >
                      {isFullscreen ? (
                        <Minimize2 size={16} />
                      ) : (
                        <Maximize2 size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* OpenSeadragon container */}
              <div ref={viewerRef} style={styles.viewerContainer} />

              {/* Boş durum */}
              {!fileName && !isLoading && !error && (
                <div style={styles.emptyOverlay}>
                  <div style={styles.emptyBox}>
                    <div style={styles.emptyIconWrap}>
                      <Microscope size={26} />
                    </div>
                    <h2 style={styles.emptyTitle}>SVS veya TIFF dosyası ekle</h2>
                    <p style={styles.emptyText}>
                      Büyük patoloji slaytlarını bile tarayıcı üzerinde
                      inceleyin. Dosyayı buraya sürükleyip bırakabilir veya
                      yukarıdaki “Slayt Yükle” butonunu kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* Yükleniyor */}
              {isLoading && (
                <div style={styles.loadingOverlay}>
                  <Loader2
                    size={38}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  <div style={styles.loadingText}>Slayt işleniyor…</div>
                  <div style={styles.loadingSub}>
                    Büyük (.svs) dosyalarda çözümleme ve yeniden ölçekleme birkaç
                    saniye sürebilir.
                  </div>
                </div>
              )}

              {/* Hata */}
              {error && (
                <div style={styles.errorOverlay}>
                  <div style={styles.errorBox}>
                    <div style={styles.errorTitle}>
                      <AlertCircle size={18} />
                      Görüntü yüklenemedi
                    </div>
                    <div style={styles.errorText}>{error}</div>
                    <button
                      type="button"
                      style={styles.retryButton}
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
                      Tekrar dene
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* ALT BİLGİ KARTLARI */}
            <section style={styles.infoGrid}>
              <article style={styles.infoCard}>
                <div style={styles.infoTitle}>
                  <Microscope size={16} />
                  <span>Desteklenen formatlar</span>
                </div>
                <p style={styles.infoText}>
                  Aperio SVS, BigTIFF, NDPI ve standart TIFF türevleri
                  desteklenir. Çok katmanlı (pyramidal) slaytlarda otomatik
                  olarak en büyük çözünürlüklü seviye kullanılır.
                </p>
              </article>

              <article style={styles.infoCard}>
                <div style={styles.infoTitle}>
                  <Cpu size={16} />
                  <span>Performans & ölçekleme</span>
                </div>
                <p style={styles.infoText}>
                  Büyük slaytlarda tarayıcı belleğini korumak için en uzun kenar
                  yaklaşık 4&nbsp;000 piksele yeniden ölçeklenir. Bu ayar istenirse
                  kod içinde kolayca artırılabilir.
                </p>
              </article>

              <article style={styles.infoCard}>
                <div style={styles.infoTitle}>
                  <Shield size={16} />
                  <span>Gizlilik</span>
                </div>
                <p style={styles.infoText}>
                  Tüm işleme işlemleri tarayıcınızda gerçekleşir. Dosyalar
                  sunucuya yüklenmez, saklanmaz veya üçüncü taraflarla
                  paylaşılmaz; sekmeyi kapattığınızda bellekten silinir.
                </p>
              </article>
            </section>
          </main>

          {/* Spinner animasyonu */}
          <style>
            {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            @media (max-width: 640px) {
              #svs-reader-main {
                height: 60vh !important;
              }
            }
          `}
          </style>
        </div>
      </div>
    </PageContainer>
  );
}

export default SvsReader;
