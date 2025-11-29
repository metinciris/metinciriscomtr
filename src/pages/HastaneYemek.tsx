import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Star } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

const SHEET_ID = '1dxvTCpd-Yegvh7Zy1QkHC_hIwv9Zrwtld3FASVlMrzw';
const WAIT_TIME = 900; // 15 dakika

type MealType = 'lunch' | 'dinner';

export function HastaneYemek() {
  const [lunchRating, setLunchRating] = useState(0);
  const [dinnerRating, setDinnerRating] = useState(0);

  const [hoveredLunchStar, setHoveredLunchStar] = useState(0);
  const [hoveredDinnerStar, setHoveredDinnerStar] = useState(0);

  const [lunchSubmitted, setLunchSubmitted] = useState(false);
  const [dinnerSubmitted, setDinnerSubmitted] = useState(false);

  const [lunchCountdown, setLunchCountdown] = useState(0);
  const [dinnerCountdown, setDinnerCountdown] = useState(0);

  const lunchTableRef = useRef<HTMLDivElement>(null);
  const dinnerTableRef = useRef<HTMLDivElement>(null);
  const footerTableRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });

  const drawTable = useCallback(
    (element: HTMLDivElement | null, range: string, timestamp: number) => {
      if (!element || !window.google) return;

      const query = new window.google.visualization.Query(
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?range=${range}&t=${timestamp}`
      );

      query.send((response: any) => {
        if (response.isError()) {
          console.error('Veri alınamadı:', response.getMessage());
          return;
        }

        const data = response.getDataTable();
        const table = new window.google.visualization.Table(element);

        table.draw(data, {
          showRowNumber: false,
          width: '100%',
          height: '100%',
          fontSize: 16,
          allowHtml: true,
          alternatingRowStyle: false,
          page: 'disable',
          sort: 'disable',
        });

        // Hücreleri biraz sıkılaştır
        setTimeout(() => {
          const cells = element.querySelectorAll('td, th');
          cells.forEach((cell) => {
            const el = cell as HTMLElement;
            el.style.padding = '6px 8px';
            el.style.fontSize = '14px';
            el.style.textAlign = 'left';
          });
        }, 100);
      });
    },
    []
  );

  const drawAllTables = useCallback(() => {
    const timestamp = Date.now();
    // Öğle: A3:A6, Akşam: A8:A11, Özet: A13:A14
    drawTable(lunchTableRef.current, 'A3:A6', timestamp);
    drawTable(dinnerTableRef.current, 'A8:A11', timestamp);
    drawTable(footerTableRef.current, 'A13:A14', timestamp);
  }, [drawTable]);

  // Google Charts yükleme
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.async = true;
    script.onload = () => {
      if (!window.google) return;
      window.google.charts.load('current', { packages: ['table'] });
      window.google.charts.setOnLoadCallback(drawAllTables);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [drawAllTables]);

  // LocalStorage'dan daha önce oy kullanmış mı kontrol et
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);

    const lunchTimestampRaw = localStorage.getItem('votedTimestampOgle');
    if (lunchTimestampRaw) {
      const ts = parseInt(lunchTimestampRaw, 10);
      const diff = now - ts;
      if (diff < WAIT_TIME) {
        setLunchSubmitted(true);
        setLunchCountdown(WAIT_TIME - diff);
      }
    }

    const dinnerTimestampRaw = localStorage.getItem('votedTimestampAksam');
    if (dinnerTimestampRaw) {
      const ts = parseInt(dinnerTimestampRaw, 10);
      const diff = now - ts;
      if (diff < WAIT_TIME) {
        setDinnerSubmitted(true);
        setDinnerCountdown(WAIT_TIME - diff);
      }
    }
  }, []);

  // Geri sayım sayacı
  useEffect(() => {
    if (!lunchSubmitted && !dinnerSubmitted) return;

    const interval = window.setInterval(() => {
      setLunchCountdown((prev) => {
        if (!lunchSubmitted) return prev;
        if (prev <= 1) {
          setLunchSubmitted(false);
          return 0;
        }
        return prev - 1;
      });

      setDinnerCountdown((prev) => {
        if (!dinnerSubmitted) return prev;
        if (prev <= 1) {
          setDinnerSubmitted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [lunchSubmitted, dinnerSubmitted]);

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `Yeni oy için ${minutes} dk ${secs} sn`;
  };

  const handleSubmit = async (mealType: MealType) => {
    const rating = mealType === 'lunch' ? lunchRating : dinnerRating;
    if (!rating) return;

    const formData = new FormData();
    if (mealType === 'lunch') {
      formData.append('entry.29138823', rating.toString());
    } else {
      formData.append('entry.1125083662', rating.toString());
    }
    formData.append('fvv', '1');
    formData.append('fbzx', '8758087204024587678');
    formData.append('pageHistory', '0');

    try {
      await fetch(
        'https://docs.google.com/forms/d/e/1FAIpQLScvF8JCIgtw85kHqVgyGCKqr66HufEP9h6QFzLxFrs-N4E78A/formResponse',
        {
          method: 'POST',
          body: formData,
          mode: 'no-cors',
        }
      );

      const timestamp = Math.floor(Date.now() / 1000);
      if (mealType === 'lunch') {
        localStorage.setItem('votedTimestampOgle', timestamp.toString());
        setLunchSubmitted(true);
        setLunchCountdown(WAIT_TIME);
        setLunchRating(0);
        setHoveredLunchStar(0);
      } else {
        localStorage.setItem('votedTimestampAksam', timestamp.toString());
        setDinnerSubmitted(true);
        setDinnerCountdown(WAIT_TIME);
        setDinnerRating(0);
        setHoveredDinnerStar(0);
      }
    } catch (error) {
      console.error('Form gönderimi hatası:', error);
    }
  };

  const renderStars = (
    rating: number,
    setRating: (val: number) => void,
    hovered: number,
    setHovered: (val: number) => void,
    disabled: boolean
  ) => {
    return (
      <div className="flex justify-center gap-2 my-3">
        {[1, 2, 3, 4, 5].map((value) => {
          const active = (hovered || rating) >= value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => !disabled && setRating(value)}
              onMouseEnter={() => !disabled && setHovered(value)}
              onMouseLeave={() => !disabled && setHovered(0)}
              className="p-1"
              aria-label={`${value} yıldız`}
            >
              <Star
                size={26}
                className="transition-transform"
                fill={active ? '#FFD700' : 'transparent'}
                stroke={active ? '#FBBF24' : '#D1D5DB'}
                strokeWidth={2}
              />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <PageContainer>
        {/* Tarih ve başlık */}
        <div className="mb-6 rounded-xl bg-white border border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="text-sm sm:text-base text-gray-800 font-medium">
            📅 {formattedDate}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            SDÜ Hastanesi · Bugünkü Yemek Menüsü
          </div>
        </div>

        {/* Öğle yemeği */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-md border border-[#f9e79f]">
          <h2 className="text-lg sm:text-xl font-semibold text-center mb-4 text-gray-800">
            ༻ Öğle Yemeği Menüsü ༺
          </h2>
          <div
            ref={lunchTableRef}
            className="mb-4 text-sm sm:text-base leading-relaxed"
          />

          <div className="pt-4 border-t border-[#f9e79f]/60">
            {renderStars(
              lunchRating,
              setLunchRating,
              hoveredLunchStar,
              setHoveredLunchStar,
              lunchSubmitted
            )}

            <div className="flex justify-center min-h-[48px]">
              {!lunchSubmitted ? (
                <button
                  onClick={() => handleSubmit('lunch')}
                  disabled={lunchRating === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#FFDB31] text-gray-900 text-sm sm:text-base font-semibold shadow hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Star size={18} fill="#000" />
                  Öğle menüsünü oyla
                </button>
              ) : (
                <div className="px-4 py-2 rounded-lg bg-white border border-amber-200 text-amber-700 text-xs sm:text-sm font-medium">
                  {formatCountdown(lunchCountdown)}
                </div>
              )}
            </div>

            {lunchSubmitted && lunchCountdown === WAIT_TIME && (
              <p className="text-center text-emerald-600 text-sm font-semibold mt-3">
                ✓ Oyunuz kaydedildi! 😊
              </p>
            )}
          </div>
        </div>

        {/* Akşam yemeği */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-md border border-[#a9d4f5]">
          <h2 className="text-lg sm:text-xl font-semibold text-center mb-4 text-gray-800">
            ༻ Akşam Yemeği Menüsü ༺
          </h2>
          <div
            ref={dinnerTableRef}
            className="mb-4 text-sm sm:text-base leading-relaxed"
          />

          <div className="pt-4 border-t border-[#a9d4f5]/60">
            {renderStars(
              dinnerRating,
              setDinnerRating,
              hoveredDinnerStar,
              setHoveredDinnerStar,
              dinnerSubmitted
            )}

            <div className="flex justify-center min-h-[48px]">
              {!dinnerSubmitted ? (
                <button
                  onClick={() => handleSubmit('dinner')}
                  disabled={dinnerRating === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#FFDB31] text-gray-900 text-sm sm:text-base font-semibold shadow hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Star size={18} fill="#000" />
                  Akşam menüsünü oyla
                </button>
              ) : (
                <div className="px-4 py-2 rounded-lg bg-white border border-sky-200 text-sky-700 text-xs sm:text-sm font-medium">
                  {formatCountdown(dinnerCountdown)}
                </div>
              )}
            </div>

            {dinnerSubmitted && dinnerCountdown === WAIT_TIME && (
              <p className="text-center text-emerald-600 text-sm font-semibold mt-3">
                ✓ Oyunuz kaydedildi! 😊
              </p>
            )}
          </div>
        </div>

        {/* Genel reyting özeti */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-md border border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
            Genel Reyting Özeti
          </h2>
          <div
            ref={footerTableRef}
            className="text-sm sm:text-base leading-relaxed"
          />
          <p className="mt-2 text-xs text-gray-500">
            Bu özet, ziyaretçilerin yıldız oylamalarından otomatik hesaplanır.
          </p>
        </div>

        {/* Bilgilendirme */}
        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-4 text-xs sm:text-sm text-gray-700 mb-6">
          ⚠️ Bu sayfadaki bilgiler eğlence amaçlıdır; her zaman gerçeği birebir
          yansıtmayabilir.
        </div>

        {/* Öğrenci yemek menüsü linki */}
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200 mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
            🎓 Üniversite Öğrenci Yemek Menüsü
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3">
            SDÜ öğrenci yemekhane menüsünü üniversitenin resmi sayfasından
            takip edebilirsiniz.
          </p>
          <a
            href="https://www.metinciris.com.tr/pages/ogrenciyemek.php"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#0066cc] text-white text-sm sm:text-base font-semibold hover:bg-[#0052a3] transition-colors"
          >
            Öğrenci yemek menüsünü aç
          </a>
        </div>
      </PageContainer>
    </div>
  );
}
