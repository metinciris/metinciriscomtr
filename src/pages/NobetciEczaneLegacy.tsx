import React, { useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { AqiFace, IspartaAirPollenBanner, aqiCategory, withOpacity } from '../components/IspartaAirPollenBanner';
import { Building2, Phone, Clock, AlertCircle, ExternalLink, MapPin } from 'lucide-react';

const ECZANELERI_IFRAME_SRC = 'https://eczaneleri.net/asset/eczane/js/iframe/iframe.js';

// Bu iframe farkli bir domainden gelir: parent sayfa iframe'in scrollHeight
// degerini okuyamaz. Sağlayici postMessage ile boyut bildirirse otomatik uyarlanir.
// Bildirmiyorsa Isparta Merkez'deki listeye uygun kompakt bir yukseklik kullanilir.
const DESKTOP_IFRAME_HEIGHT = 1000;
const MOBILE_IFRAME_HEIGHT = 1200;
const LONG_LIST_HEIGHT = 1850;

const responsiveIframeHeight = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
    ? MOBILE_IFRAME_HEIGHT
    : DESKTOP_IFRAME_HEIGHT;

// AQI rengi beyazla karistirilip tek, opak bir arka plan tonu uretilir.
// Sayfanin alt zemini gorunmez; bolgesel acik-koyu gradient yoktur.
function pastelAqiColor(hex: string): string {
  const mix = 0.22;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const soft = (value: number) => Math.round(255 * (1 - mix) + value * mix);
  return `rgb(${soft(r)}, ${soft(g)}, ${soft(b)})`;
}

export function NobetciEczane() {
  const now = new Date();

  // Türkçe tarih
  const today = now.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // İngilizce tarih: 30 November 2025 Sunday
  const day = now.getDate();
  const year = now.getFullYear();
  const monthEn = now.toLocaleDateString('en-US', { month: 'long' });
  const weekdayEn = now.toLocaleDateString('en-US', { weekday: 'long' });
  const todayEn = `${day} ${monthEn} ${year} ${weekdayEn}`;

  const [isLoading, setIsLoading] = React.useState(true);
  const [frameHeight, setFrameHeight] = React.useState(responsiveIframeHeight);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [currentAqi, setCurrentAqi] = React.useState<number | null>(null);
  const currentAir = aqiCategory(currentAqi);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Eczaneleri.NET widget kurulumu
  useEffect(() => {
    const frameInitially = responsiveIframeHeight();
    let iframe: HTMLIFrameElement | null = null;
    let heightReported = false;

    // Iframe saglayicisi guvenilir bir boyut bildirimi gonderirse
    // gercek icerik boyunu kullan; diger mesajlari yok say.
    const onMessage = (event: MessageEvent) => {
      if (!iframe?.contentWindow || event.source !== iframe.contentWindow) return;
      if (event.origin !== 'https://eczaneleri.net' && event.origin !== 'https://www.eczaneleri.net') return;
      let payload: unknown = event.data;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload) as unknown; } catch { return; }
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
      const msg = payload as Record<string, unknown>;
      const reported = msg.height ?? msg.contentHeight ?? msg.scrollHeight;
      const height = typeof reported === 'string' ? Number(reported) : reported;
      if (typeof height !== 'number' || !Number.isFinite(height) || height < 500 || height > 4000) return;
      heightReported = true;
      setFrameHeight(Math.ceil(height + 12));
    };
    const onViewportResize = () => {
      if (!heightReported) setFrameHeight(responsiveIframeHeight());
    };
    window.addEventListener('message', onMessage);
    window.addEventListener('resize', onViewportResize);

    (window as any).pharmacyiFrame = {
      color1: '00d2d3',
      color2: '17a2b8',
      city: 'isparta',   // sadece Isparta
      county: 'merkez',  // Isparta merkez
      type: 'default-iframe',
      width: 768,        // px cinsinden (max-w-3xl boyutuna uygun)
      height: frameInitially // sağlayıcının kendi iframe ölçüsü için ilk yükseklik
    };

    const script = document.createElement('script');
    script.src = ECZANELERI_IFRAME_SRC;
    script.async = true;
    document.body.appendChild(script);

    let observer: MutationObserver | null = null;

    const checkIframe = () => {
      const embedded = containerRef.current?.querySelector('iframe') ?? null;
      if (!embedded) return false;
      iframe = embedded;
      embedded.title = 'Isparta Merkez nöbetçi eczaneleri';
      embedded.addEventListener('load', () => setIsLoading(false));
      return true;
    };

    if (!checkIframe() && containerRef.current) {
      observer = new MutationObserver(() => {
        if (checkIframe()) {
          observer?.disconnect();
        }
      });
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // 6 saniyelik yedek zaman aşımı (eğer dış kaynak yüklenemezse sayfa takılı kalmasın)
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 6000);

    return () => {
      try {
        document.body.removeChild(script);
      } catch { }
      if (observer) {
        observer.disconnect();
      }
      clearTimeout(fallbackTimeout);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('resize', onViewportResize);
      delete (window as any).pharmacyiFrame;
    };
  }, []);

  // Kisa listeyi gereksiz uzatmaz; uzun gunlerde kullanici tek tikla
  // iframe gorunum alanini genisletebilir.
  const visibleIframeHeight = isExpanded ? Math.max(frameHeight, LONG_LIST_HEIGHT) : frameHeight;
  const iframeContainerStyle = {
    '--pharmacy-iframe-height': String(visibleIframeHeight) + 'px',
    ...(isLoading ? {
      position: 'absolute' as const,
      opacity: 0,
      pointerEvents: 'none' as const,
      height: 0,
    } : {}),
  } as React.CSSProperties;

  return (
    <PageContainer>
      {/* SEO-friendly hidden description for bots */}
      <div
        aria-hidden="false"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0'
        }}
      >
        <h2>Isparta Nöbetçi Eczaneler ve Eczane Listesi</h2>
        <p>
          Isparta Merkez'deki günlük nöbetçi eczanelere anında ulaşın. Eczane adresleri, telefon numaraları ve yol tarifleri ile nöbetçi listesini güncel olarak takip edin.
        </p>
      </div>
      <div className="bg-gradient-to-r from-[#990000] to-[#8B0000] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Isparta Nöbetçi Eczane</h1>
        <p className="text-white/90">
          Isparta Merkez Nöbetçi Eczaneler
        </p>
      </div>

      {/* Tarih Bilgisi */}
      <div className="bg-[#00A6D6] text-white p-6 mb-8">
        <div className="flex items-center gap-3">
          <Clock size={32} />
          <div>
            <h3 className="text-white mb-1">Bugünün Tarihi</h3>
            <p className="text-white/90 m-0">{today}</p>
            <p className="text-white/80 m-0 text-sm mt-1">{todayEn}</p>
          </div>
        </div>
      </div>

      {/* Guncel AQI rengiyle tek tonlu arka plan, koyu goz/agizli belirgin yuzler.
          Kucuk hava kalitesi karti ayni kalir; veri yoksa notr arka plan vardir. */}
      <section
        aria-label="Isparta Merkez nöbetçi eczaneleri"
        className="relative isolate mb-8 overflow-hidden rounded-2xl border px-3 py-7 shadow-sm sm:px-8 sm:py-9"
        style={{
          borderColor: currentAir ? withOpacity(currentAir.color, 0.58) : '#D6E9E9',
          backgroundColor: currentAir ? pastelAqiColor(currentAir.color) : '#FAFCFD',
        }}
      >
        {/* Her ikonu aynı güncel hava kalitesi durumu belirler.
            Oda/eczane iframe'i üzerindeki tıklamalar etkilenmez.
            Dar ekranlarda yer kaybını önlemek için ikonlar gösterilmez. */}
        {currentAir && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"
          >
            <div className="absolute left-3 top-[8%] opacity-[0.62]">
              <AqiFace index={currentAir.icon} size={116} label="" darkDetails />
            </div>
            <div className="absolute right-3 top-[16%] opacity-[0.60]">
              <AqiFace index={currentAir.icon} size={120} label="" darkDetails />
            </div>
            <div className="absolute left-5 bottom-[25%] opacity-[0.54]">
              <AqiFace index={currentAir.icon} size={104} label="" darkDetails />
            </div>
            <div className="absolute right-4 bottom-[9%] opacity-[0.56]">
              <AqiFace index={currentAir.icon} size={114} label="" darkDetails />
            </div>
          </div>
        )}
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Widget konteyneri – script burayı dolduracak */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 my-4 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#990000] mb-3"></div>
              <p className="text-muted-foreground text-center font-medium text-sm m-0">
                Güncel nöbetçi eczane bilgisi çekiliyor...
              </p>
            </div>
          )}
          <style dangerouslySetInnerHTML={{ __html: `
            .pharmacy-container iframe {
              display: block;
              width: 100% !important;
              height: var(--pharmacy-iframe-height, 1000px) !important;
              min-height: 0 !important;
              border: none !important;
            }
          `}} />
          <div
            ref={containerRef}
            className="pharmacy-container w-full overflow-hidden"
            style={iframeContainerStyle}
          />
          {!isLoading && (
            <div className="mt-2 text-center">
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded(value => !value)}
                className="text-xs font-medium text-[#0F6F7E] underline underline-offset-2 hover:text-[#17A2B8]"
              >
                {isExpanded ? 'Listeyi daralt' : 'Liste uzunsa genişlet'}
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Kaynak: Eczaneleri.NET. Güncel bilgileri Isparta Eczacılar Odası'ndan doğrulayın.
          </p>
        </div>
      </section>

      {/* Isparta Merkez icin kompakt hava kalitesi ve polen tahmini */}
      <IspartaAirPollenBanner onAqiChange={setCurrentAqi} />

      {/* Ana Yönlendirme Kartı */}
      <div className="bg-white p-12 mb-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-4">Resmi Nöbetçi Eczane Listesi</h2>
          <p className="text-muted-foreground mb-8">
            Isparta'daki güncel nöbetçi eczane listesi için
            aşağıdaki butona tıklayarak Isparta Eczacılar Odası resmi web sitesini ziyaret edebilirsiniz.
          </p>

          <a
            href="https://www.ispartaeo.org.tr/nobetci-eczaneler"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#990000] text-white px-12 py-6 hover:bg-[#8B0000] transition-colors text-xl"
          >
            <ExternalLink size={28} />
            <span>Eczacılar Odası Isparta Güncel Nöbetçi Eczaneler web sayfası için Tıklayın</span>
          </a>

          <p className="text-muted-foreground mt-6">
            Liste her gün Isparta Eczacılar Odası tarafından güncellenmektedir.
          </p>
        </div>
      </div>

      {/* Uyarı */}
      <div className="bg-[#FFF3E0] border-l-4 border-[#FF8C00] p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-[#FF8C00] flex-shrink-0" size={24} />
          <div>
            <h3 className="mb-2">Önemli Bilgilendirme</h3>
            <p className="text-muted-foreground m-0">
              Nöbetçi eczane bilgileri değişebilir. Gitmeden önce eczaneyi arayarak doğrulama
              yapmanız önerilir. Acil durumlar için 112'yi arayabilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* Özellikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 text-center">
          <div className="bg-[#00A6D6] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <MapPin size={32} />
          </div>
          <h3 className="mb-2">Isparta Merkez</h3>
          <p className="text-muted-foreground m-0">
            Isparta Merkez nöbetçi eczaneleri
          </p>
        </div>

        <div className="bg-white p-6 text-center">
          <div className="bg-[#27AE60] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <Clock size={32} />
          </div>
          <h3 className="mb-2">Güncel Bilgi</h3>
          <p className="text-muted-foreground m-0">
            Her gün güncellenen nöbetçi listesi
          </p>
        </div>

        <div className="bg-white p-6 text-center">
          <div className="bg-[#990000] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <h3 className="mb-2">Resmi Kaynak</h3>
          <p className="text-muted-foreground m-0">
            Isparta Eczacılar Odası'ndan kontrol edin
          </p>
        </div>
      </div>

      {/* Yararlı Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#990000] w-12 h-12 flex items-center justify-center text-white">
              <Building2 size={24} />
            </div>
            <h3>Nöbetçi Eczane Hakkında</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Nöbetçi eczaneler, normal mesai saatleri dışında ve resmi tatillerde vatandaşların
            ilaç ihtiyaçlarını karşılamak üzere görevlendirilmiş eczanelerdir.
          </p>
          <p className="text-muted-foreground mb-4">
            Nöbetçi eczaneler sabah 08:30'dan ertesi gün sabah 08:30'a kadar 24 saat boyunca
            kesintisiz hizmet vermektedir.
          </p>
          <div className="bg-[#F5F5F5] p-4">
            <h4 className="mb-3">Eczaneye Giderken Unutmayın:</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-[#990000]">•</span>
                <span>Reçetenizi yanınıza alın</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#990000]">•</span>
                <span>Kimlik belgenizi unutmayın</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#990000]">•</span>
                <span>Gitmeden önce arayarak doğrulayın</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#990000]">•</span>
                <span>İlaç adını ve dozunu bilin</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white p-8">
          <h3 className="text-white mb-4">Acil Durum İletişim</h3>
          <div className="space-y-4">
            <div className="border-b border-white/20 pb-4">
              <h4 className="text-white mb-2">Acil Sağlık Hizmetleri</h4>
              <a href="tel:112" className="text-white hover:underline inline-flex items-center gap-2">
                <Phone size={20} />
                <span className="text-white">112</span>
              </a>
            </div>
            <div className="border-b border-white/20 pb-4">
              <h4 className="text-white mb-2">Isparta Eczacılar Odası</h4>
              <a href="tel:02462183232" className="text-white hover:underline inline-flex items-center gap-2">
                <Phone size={20} />
                <span className="text-white">0246 218 32 32</span>
              </a>
            </div>
            <div>
              <h4 className="text-white mb-2">Zehir Danışma Merkezi</h4>
              <a href="tel:114" className="text-white hover:underline inline-flex items-center gap-2">
                <Phone size={20} />
                <span className="text-white">114</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Web Sitesi Hakkında */}
      <div className="bg-white p-8">
        <div className="max-w-3xl mx-auto">
          <h3 className="mb-4">Isparta Eczacılar Odası</h3>
          <p className="text-muted-foreground mb-6">
            Isparta Eczacılar Odası, Isparta ilinde faaliyet gösteren eczacıların meslek kuruluşudur.
            Nöbetçi eczane listesi oda tarafından düzenlenmekte ve her gün güncellenmektedir.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://www.ispartaeo.org.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#00A6D6] text-white px-6 py-3 hover:bg-[#0078D4] transition-colors inline-flex items-center gap-2"
            >
              <ExternalLink size={20} />
              Eczacılar Odası Ana Sayfa
            </a>
            <a
              href="https://www.ispartaeo.org.tr/nobetci-eczaneler"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#990000] text-white px-6 py-3 hover:bg-[#8B0000] transition-colors inline-flex items-center gap-2"
            >
              <Building2 size={20} />
              Nöbetçi Eczaneler Listesi
            </a>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
