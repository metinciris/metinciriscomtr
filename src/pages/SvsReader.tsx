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
  AlertTriangle
} from 'lucide-react';
import './SvsReader.css';

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

  /* ... inside SvsReader component ... */
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Slayt işleniyor...');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDownscaled, setIsDownscaled] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  // Son seçilen görüntü için meta veriler (hata mesajında kullanacağız)
  const lastMetaRef = useRef<{
    width?: number;
    height?: number;
    compression?: number;
    fileSizeMB?: number;
  }>({});

  // ... (useEffects remain same) ...
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
        setError('Gerekli kütüphaneler yüklenemedi.\nLütfen sayfayı yenileyin.');
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

  const initViewer = useCallback(async (file: File, forceFullResolution = false) => {
    if (!viewerRef.current) return;
    if (!window.OpenSeadragon || !window.GeoTIFF) {
      setError('Gerekli kütüphaneler henüz yüklenmedi. Birkaç saniye sonra tekrar deneyin.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Dosya analiz ediliyor...');
    setError(null);
    setFileName(file.name);
    setCurrentFile(file);
    setImageLoaded(false);
    setIsDownscaled(false);
    setIsWarningDismissed(false);

    // Meta bilgileri baştan temizle
    lastMetaRef.current = {
      fileSizeMB: file.size / (1024 * 1024),
    };

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

      // SVS içindeki tüm katmanları (levels) tarayalım
      const levels: { index: number; width: number; height: number; pixels: number }[] = [];

      for (let i = 0; i < imageCount; i++) {
        const img = await tiff.getImage(i);
        const w = img.getWidth();
        const h = img.getHeight();
        levels.push({ index: i, width: w, height: h, pixels: w * h });
      }

      // Piksel sayısına göre büyükten küçüğe sırala
      levels.sort((a, b) => b.pixels - a.pixels);

      const fullResLevel = levels[0];
      const origWidth = fullResLevel.width;
      const origHeight = fullResLevel.height;

      // Meta kaydı
      const mainImage = await tiff.getImage(fullResLevel.index);
      const fd = mainImage.fileDirectory;
      const compression = (fd as any).Compression as number | undefined;

      lastMetaRef.current.width = origWidth;
      lastMetaRef.current.height = origHeight;
      lastMetaRef.current.compression = compression;

      // Aperio JPEG2000 kontrolü
      if (compression === 33003 || compression === 33005) {
        throw new Error(`Unknown compression method identifier: ${compression} (Aperio JPEG2000)`);
      }

      // --- AKILLI KATMAN SEÇİMİ ---
      let targetLevel = fullResLevel;

      // Güvenli sınır: Örneğin 5000px genişlik (yaklaşık 20-25 MP).
      // Tarayıcılar genellikle 4096x4096px veya 8192x8192px texture limitine sahiptir.
      // 5000px çoğu modern cihaz için güvenli ve hızlıdır.
      const SAFE_MAX_DIM = 5000;

      if (!forceFullResolution) {
        // En büyükten başlayarak, güvenli sınıra uyan İLK (en detaylı) katmanı bul
        const safeLevel = levels.find(
          (l) => l.width <= SAFE_MAX_DIM && l.height <= SAFE_MAX_DIM
        );

        if (safeLevel) {
          targetLevel = safeLevel;
        } else {
          // Eğer hiçbiri sınıra uymuyorsa (çok nadir), en küçüğünü alalım ki açabilsin
          targetLevel = levels[levels.length - 1];
        }

        // Eğer seçtiğimiz katman, asıl katmandan daha küçükse "downscaled" modundayız
        if (targetLevel.index !== fullResLevel.index) {
          setIsDownscaled(true);
          setLoadingMessage('Bellek optimizasyonu: Uygun katman seçiliyor...');
          // Kısa bir gecikme ekleyelim ki kullanıcı mesajı fark edebilsin (opsiyonel)
          await new Promise((r) => setTimeout(r, 600));
        }
      } else {
        setLoadingMessage('Tam çözünürlük yükleniyor (Zorla)...');
      }

      console.log('Selected Level:', targetLevel, 'Full Res:', fullResLevel);

      // Seçilen görüntüyü al
      const image = await tiff.getImage(targetLevel.index);
      const width = targetLevel.width;
      const height = targetLevel.height;

      setLoadingMessage('Görüntü oluşturuluyor...');

      // RGB verisini oku
      // Artık ekstra scale işlemi yapmıyoruz çünkü zaten uygun boyuttaki image'i seçtik.
      const rgb: any = await image.readRGB({
        interleave: true,
      });

      const data = rgb as Uint8Array;
      const pixelCount = width * height;
      const rgba = new Uint8ClampedArray(pixelCount * 4);

      // Alpha kanalı ekle (RGB -> RGBA)
      // Bu döngü, seçilen level makul boyutta olduğu sürece çok hızlıdır.
      for (let i = 0; i < pixelCount; i++) {
        const src = i * 3;
        const dst = i * 4;
        rgba[dst] = data[src];
        rgba[dst + 1] = data[src + 1];
        rgba[dst + 2] = data[src + 2];
        rgba[dst + 3] = 255;
      }

      // Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context oluşturulamadı.');

      const imageData = new ImageData(rgba, width, height);
      ctx.putImageData(imageData, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');

      setLoadingMessage('Görüntüleyici başlatılıyor...');

      viewerInstance.current = window.OpenSeadragon({
        element: viewerRef.current,
        prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
        showNavigator: true,
        navigatorPosition: 'BOTTOM_RIGHT',
        navigatorSizeRatio: 0.15,
        gestureSettingsMouse: {
          scrollToZoom: true,
          clickToZoom: true,
          dblClickToZoom: true,
          flickEnabled: true,
        },
        animationTime: 0.5,
        blendTime: 0.1,
        constrainDuringPan: true,
        maxZoomPixelRatio: 4,
        minZoomLevel: 0.1,
        visibilityRatio: 0.5,
      });

      viewerInstance.current.addSimpleImage({
        url: dataUrl,
        buildPyramid: true, // OSD kendi piramidini oluşturur (akıcı zoom için)
      });

      setIsLoading(false);
      setImageLoaded(true);

    } catch (err: any) {
      console.error('SVS yükleme hatası:', err);
      // Hata yönetimi (aynen korundu, sadece loading state kapama ekli)
      const meta = lastMetaRef.current;
      const mb = (meta.fileSizeMB ?? 0).toFixed(1);
      const dim = meta.width ? `Orj. Boyut: ${meta.width}x${meta.height}` : '';

      const msg = String(err?.message || '');

      if (
        msg.includes('Array buffer') ||
        msg.includes('Out of memory') ||
        err?.name === 'RangeError'
      ) {
        setError(
          `Tarayıcı bellek hatası!\n\n` +
          `Bu dosya çok büyük (${mb} MB, ${dim}) ve cihazınızın belleği yetersiz kaldı.\n` +
          `Lütfen sayfayı yenileyip tekrar deneyin.`
        );
      } else if (msg.includes('Unknown compression') || msg.includes('JPEG2000')) {
        setError(
          `Desteklenmeyen sıkıştırma (Aperio JP2).\n` +
          `Bu format tarayıcıda açılamaz. Lütfen standart SVS/TIFF kullanın.`
        );
      } else {
        setError(`Bir hata oluştu: ${msg}`);
      }

      setIsLoading(false);
      setImageLoaded(false);
    }
  }, []);

  /* ... handlers ... */

  // ... (handleFileChange, handleDrop, etc remain same, skipping to render for brevity in thought, but need to be careful with replace)

  // Wait, I need to be careful about not deleting the helper functions above initViewer if I start replace from line 39.
  // The tool asks for StartLine and EndLine.
  // I will replace the state declarations and `initViewer` function.
  // Then I will need another replacement for the JSX to show `loadingMessage`.

  // Actually, I can do it in one go if I include the helper functions in the replacement or just carefully target the block.
  // The provided `ReplacementContent` above starts with state decls (line 39) and covers `initViewer`.
  // I need to check where `initViewer` ends in the original file. 
  // `initViewer` ends at line 336. 
  // `handleFileChange` starts at 349.
  // So I should replace from line 39 to 336.

  // But wait, I also need to update the JSX to use `loadingMessage` variable.
  // The JSX is at the bottom (lines 446-698).
  // So I should simple do TWO replacements.
  // 1. State + initViewer
  // 2. JSX update

  // Let's do step 1: State + initViewer logic. (Lines 39 - 336)



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

    initViewer(file, false); // Varsayılan: Güvenli mod
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
        initViewer(file, false);
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

  const reloadFullRes = () => {
    if (currentFile) {
      if (confirm("DİKKAT: Tam çözünürlük modu çok yüksek RAM kullanır ve tarayıcınızı kilitleyebilir.\n\nDevam etmek istiyor musunuz?")) {
        initViewer(currentFile, true);
      }
    }
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
    setCurrentFile(null);
    setError(null);
    setImageLoaded(false);
    setIsDownscaled(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <PageContainer>
      <div className="svs-page-outer">
        <div className="svs-page-inner">
          {/* HEADER */}
          <header className="svs-header">
            <div className="svs-header-top">
              <div className="svs-header-title-block">
                <div className="svs-header-icon">
                  <Microscope size={26} />
                </div>
                <div>
                  <h1 className="svs-h1">SVS Sanal Mikroskopi</h1>
                  <p className="svs-header-desc">
                    Aperio SVS ve TIFF formatlı dijital patoloji slaytlarını
                    doğrudan tarayıcınızda görüntüleyin. Dosyalar sadece
                    cihazınızda işlenir.
                  </p>
                  {!scriptsLoaded && (
                    <div className="svs-scripts-loading">
                      <Loader2
                        size={14}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                      <span>Kütüphaneler yükleniyor...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="svs-header-badges">
                <span className="svs-badge">
                  <Cpu size={13} />
                  <span>İstemci taraflı işleme</span>
                </span>
                <span className="svs-badge">
                  <Shield size={13} />
                  <span>Veri sunucuya çıkmaz</span>
                </span>
              </div>
            </div>
          </header>

          <main className="svs-main-layout">
            {/* VIEWER CARD */}
            <section
              ref={containerRef}
              className={`svs-viewer-card ${imageLoaded ? 'loaded' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Toolbar */}
              <div className="svs-toolbar">
                {/* Sol: dosya kontrolleri (Tam ekranda gizle) */}
                {!isFullscreen && (
                  <div className="svs-file-controls">
                    <label className="svs-upload-button">
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
                      <div className="svs-file-name-badge">
                        <span className="svs-chip">yerel dosya</span>
                        <span className="svs-file-name-text" title={fileName}>
                          {fileName}
                        </span>
                        <button
                          type="button"
                          className="svs-close-button"
                          onClick={clearFile}
                          aria-label="Dosyayı kapat"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sağ: görünüm kontrolleri */}
                {fileName && !isLoading && !error && (
                  <div className="svs-view-controls">
                    <button
                      type="button"
                      className="svs-control-button"
                      onClick={zoomOut}
                      title="Uzaklaştır"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button
                      type="button"
                      className="svs-control-button"
                      onClick={zoomIn}
                      title="Yakınlaştır"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <div className="svs-divider" />
                    <button
                      type="button"
                      className="svs-control-button"
                      onClick={resetView}
                      title="Başlangıç görünümü"
                    >
                      <Home size={16} />
                    </button>
                    <div className="svs-divider" />
                    <button
                      type="button"
                      className="svs-control-button"
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
              <div ref={viewerRef} className="svs-viewer-container" />

              {/* Boş durum */}
              {!fileName && !isLoading && !error && (
                <div className="svs-empty-overlay">
                  <div className="svs-empty-box">
                    <div className="svs-empty-icon-wrap">
                      <Microscope size={26} />
                    </div>
                    <h2 className="svs-empty-title">SVS veya TIFF dosyası ekle</h2>
                    <p className="svs-empty-text">
                      Büyük patoloji slaytlarını bile tarayıcı üzerinde
                      inceleyin. Dosyayı buraya sürükleyip bırakabilir veya
                      yukarıdaki “Slayt Yükle” butonunu kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* Yükleniyor */}
              {isLoading && (
                <div className="svs-loading-overlay">
                  <Loader2
                    size={38}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  <div className="svs-loading-text">{loadingMessage}</div>
                  <div className="svs-loading-sub">
                    Büyük dosyalarda işlem birkaç saniye sürebilir.
                  </div>
                </div>
              )}

              {/* Hata */}
              {error && (
                <div className="svs-error-overlay">
                  <div className="svs-error-box">
                    <div className="svs-error-title">
                      <AlertCircle size={18} />
                      Görüntü yüklenemedi
                    </div>
                    <div className="svs-error-text">{error}</div>
                    <button
                      type="button"
                      className="svs-retry-button"
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
                        setCurrentFile(null);
                      }}
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              )}

              {/* Warning Badge (Optimized Level) */}
              {isDownscaled && !isLoading && !error && !isWarningDismissed && (
                <div className="svs-warning-badge">
                  <AlertTriangle size={14} />
                  <span>Yüksek performans için optimize edilmiş katman yüklendi.</span>
                  <div className="svs-warning-actions">
                    <button
                      className="svs-warning-btn"
                      onClick={reloadFullRes}
                    >
                      Orijinalini Zorla (Riskli)
                    </button>
                    <button
                      className="svs-warning-btn-secondary"
                      onClick={() => setIsWarningDismissed(true)}
                    >
                      Bu şekilde kalsın
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* ALT BİLGİ KARTLARI */}
            <section className="svs-info-grid">
              <article className="svs-info-card">
                <div className="svs-info-title">
                  <Microscope size={16} />
                  <span>Desteklenen formatlar</span>
                </div>
                <p className="svs-info-text">
                  Aperio SVS, BigTIFF, NDPI ve standart TIFF türevleri
                  desteklenir. Çok katmanlı (pyramidal) slaytlarda otomatik
                  olarak en büyük çözünürlüklü seviye kullanılır.
                </p>
              </article>

              <article className="svs-info-card">
                <div className="svs-info-title">
                  <Cpu size={16} />
                  <span>Performans & ölçekleme</span>
                </div>
                <p className="svs-info-text">
                  Büyük slaytlarda tarayıcı belleğini korumak için en uzun kenar
                  4000 piksele indirgenir. Daha güçlü bir cihazınız varsa yukarıdaki
                  "Orijinalini Dene" seçeneği ile sınırı kaldırabilirsiniz.
                </p>
              </article>

              <article className="svs-info-card">
                <div className="svs-info-title">
                  <Shield size={16} />
                  <span>Gizlilik</span>
                </div>
                <p className="svs-info-text">
                  Tüm işleme adımları tarayıcınızda gerçekleşir. Dosyalar
                  sunucuya yüklenmez, saklanmaz veya üçüncü taraflarla
                  paylaşılmaz; sekmeyi kapattığınızda bellekten silinir.
                </p>
              </article>
            </section>
          </main>
        </div>
      </div>
    </PageContainer>
  );
}

export default SvsReader;
