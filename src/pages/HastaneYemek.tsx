import React, { useEffect, useState, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Star } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

export function HastaneYemek() {
  const [lunchRating, setLunchRating] = useState(0);
  const [dinnerRating, setDinnerRating] = useState(0);
  const [lunchSubmitted, setLunchSubmitted] = useState(false);
  const [dinnerSubmitted, setDinnerSubmitted] = useState(false);
  const [lunchCountdown, setLunchCountdown] = useState(0);
  const [dinnerCountdown, setDinnerCountdown] = useState(0);
  const [hoveredLunchStar, setHoveredLunchStar] = useState(0);
  const [hoveredDinnerStar, setHoveredDinnerStar] = useState(0);
  const [randomQuote, setRandomQuote] = useState({ text: '', author: '', title: '' });

  const headerTableRef = useRef<HTMLDivElement>(null);
  const lunchTableRef = useRef<HTMLDivElement>(null);
  const dinnerTableRef = useRef<HTMLDivElement>(null);
  const footerTableRef = useRef<HTMLDivElement>(null);

  const WAIT_TIME = 900; // 15 dakika

  // Rastgele yemek sözleri
  const foodQuotes = [
    { text: "Yemek pişirmek, bir hikaye anlatmaktır.", author: "Elena Arzak", title: "İspanyol şef" },
    { text: "Yemek yalnızca yemek değildir. Sanat, bilim ve hoşgörüdür.", author: "Ferran Adrià", title: "İspanyol şef" },
    { text: "Yemek pişirmek aşkla ilgilidir. Ya aşkla yaparsınız ya da hiç yapmazsınız.", author: "Thomas Keller", title: "Amerikalı şef" },
    { text: "Yemek, insanların bir araya gelmesi için bir bahane olmalıdır.", author: "Michael Pollan", title: "Amerikalı yazar ve aktivist" },
    { text: "İyi yemek, sağlığın temelidir.", author: "James Beard", title: "Amerikalı şef" },
    { text: "Mutfak, hayatın kalbidir.", author: "Julia Child", title: "Amerikalı şef" },
    { text: "Yemek, sevgiyi paylaşmanın bir yoludur.", author: "Jamie Oliver", title: "İngiliz şef" },
    { text: "Basit yemekler genellikle en iyisidir.", author: "Auguste Escoffier", title: "Fransız şef" }
  ];

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * foodQuotes.length);
    setRandomQuote(foodQuotes[randomIndex]);
  }, []);

  // Google Charts yükle
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.async = true;
    script.onload = () => {
      window.google.charts.load('current', { packages: ['table'] });
      window.google.charts.setOnLoadCallback(drawAllTables);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const drawAllTables = () => {
    const timestamp = new Date().getTime();
    drawTable(headerTableRef.current, 'A1:A1', timestamp);
    drawTable(lunchTableRef.current, 'A2:A6', timestamp, '#fff9c4');
    drawTable(dinnerTableRef.current, 'A7:A11', timestamp, '#dceeff');
    drawTable(footerTableRef.current, 'A12:A15', timestamp);
  };

  const drawTable = (element: HTMLDivElement | null, range: string, timestamp: number, bgColor?: string) => {
    if (!element || !window.google) return;

    const query = new window.google.visualization.Query(
      `https://docs.google.com/spreadsheets/d/1dxvTCpd-Yegvh7Zy1QkHC_hIwv9Zrwtld3FASVlMrzw/gviz/tq?range=${range}&timestamp=${timestamp}`
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
        fontSize: 24, // Daha büyük font
        allowHtml: true,
        alternatingRowStyle: false,
        page: 'disable',
        sort: 'disable'
      });

      if (bgColor) {
        setTimeout(() => {
          const cells = element.querySelectorAll('td, th');
          cells.forEach(cell => {
            (cell as HTMLElement).style.backgroundColor = bgColor;
            (cell as HTMLElement).style.borderColor = bgColor;
            (cell as HTMLElement).style.padding = '16px'; // Daha büyük padding
            (cell as HTMLElement).style.fontSize = '24px'; // Daha büyük font
            (cell as HTMLElement).style.textAlign = 'center';
          });
        }, 100);
      } else {
        setTimeout(() => {
          const cells = element.querySelectorAll('td, th');
          cells.forEach(cell => {
            (cell as HTMLElement).style.padding = '16px';
            (cell as HTMLElement).style.fontSize = '24px';
            (cell as HTMLElement).style.textAlign = 'center';
          });
        }, 100);
      }
    });
  };

  // LocalStorage kontrolleri
  useEffect(() => {
    const lunchTimestamp = localStorage.getItem('votedTimestampOgle');
    const dinnerTimestamp = localStorage.getItem('votedTimestampAksam');
    const currentTime = Math.floor(Date.now() / 1000);

    if (lunchTimestamp) {
      const timeLeft = WAIT_TIME - (currentTime - parseInt(lunchTimestamp));
      if (timeLeft > 0) {
        setLunchCountdown(timeLeft);
        setLunchSubmitted(true);
      }
    }

    if (dinnerTimestamp) {
      const timeLeft = WAIT_TIME - (currentTime - parseInt(dinnerTimestamp));
      if (timeLeft > 0) {
        setDinnerCountdown(timeLeft);
        setDinnerSubmitted(true);
      }
    }
  }, []);

  // Geri sayım
  useEffect(() => {
    if (lunchCountdown > 0) {
      const timer = setTimeout(() => setLunchCountdown(lunchCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (lunchSubmitted) {
      setLunchSubmitted(false);
    }
  }, [lunchCountdown]);

  useEffect(() => {
    if (dinnerCountdown > 0) {
      const timer = setTimeout(() => setDinnerCountdown(dinnerCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (dinnerSubmitted) {
      setDinnerSubmitted(false);
    }
  }, [dinnerCountdown]);

  const handleSubmit = async (mealType: 'lunch' | 'dinner') => {
    const rating = mealType === 'lunch' ? lunchRating : dinnerRating;

    if (rating === 0) {
      alert('Lütfen bir değerlendirme yapınız!');
      return;
    }

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
      await fetch('https://docs.google.com/forms/d/e/1FAIpQLScvF8JCIgtw85kHqVgyGCKqr66HufEP9h6QFzLxFrs-N4E78A/formResponse', {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      const timestamp = Math.floor(Date.now() / 1000);
      if (mealType === 'lunch') {
        localStorage.setItem('votedTimestampOgle', timestamp.toString());
        setLunchSubmitted(true);
        setLunchCountdown(WAIT_TIME);
        setLunchRating(0);
      } else {
        localStorage.setItem('votedTimestampAksam', timestamp.toString());
        setDinnerSubmitted(true);
        setDinnerCountdown(WAIT_TIME);
        setDinnerRating(0);
      }

      setTimeout(() => drawAllTables(), 1000);
    } catch (error) {
      console.error('Form gönderimi hatası:', error);
    }
  };

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `Yeni oy için 😉 ${minutes} dk ${secs} sn`;
  };

  const renderStars = (
    rating: number,
    setRating: (val: number) => void,
    hovered: number,
    setHovered: (val: number) => void,
    disabled: boolean
  ) => {
    return (
      <div className="flex justify-center gap-3 my-6">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => !disabled && setRating(value)}
            onMouseEnter={() => !disabled && setHovered(value)}
            onMouseLeave={() => !disabled && setHovered(0)}
            disabled={disabled}
            className="transition-all hover:scale-125 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star
              size={56}
              fill={(hovered || rating) >= value ? '#FFD700' : 'transparent'}
              stroke={(hovered || rating) >= value ? '#FFD700' : '#ccc'}
              strokeWidth={2}
              className="transition-all drop-shadow-lg"
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <PageContainer>
        {/* Animasyonlu yıldızlar arka plan */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute text-[#ffcc00] text-3xl animate-[fly_4s_ease-in-out_infinite]"
              style={{
                left: `${Math.random() * 100}vw`,
                animationDelay: `${Math.random() * 2}s`,
                top: '-50px'
              }}
            >
              ★
            </div>
          ))}
        </div>

        {/* Alıntı */}
        <div className="bg-white p-8 rounded-2xl text-center mb-8 shadow-xl border-2 border-gray-100">
          {randomQuote.text && (
            <div>
              <p className="italic text-gray-700 text-lg mb-3">
                "{randomQuote.text}"
              </p>
              <p className="font-bold text-gray-900">{randomQuote.author}</p>
              <p className="text-gray-600 text-sm">{randomQuote.title}</p>
            </div>
          )}
        </div>

        {/* Resimler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <img
              src="https://metinciris.com.tr/resim/yemek1.jpg"
              alt="Yemek 1"
              className="w-full h-auto rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <img
              src="https://metinciris.com.tr/resim/yemek2.jpg"
              alt="Yemek 2"
              className="w-full h-auto rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* Başlık Tablosu */}
        <div ref={headerTableRef} className="mb-8 bg-white p-4 rounded-xl shadow-lg" />

        {/* Öğle Yemeği Bölümü */}
        <div className="bg-[#fff9c4] rounded-2xl p-8 mb-8 shadow-2xl border-4 border-[#f9e79f]">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">🍽️ Öğle Yemeği Menüsü 🍽️</h2>
          <div ref={lunchTableRef} className="mb-8 bg-white/50 p-4 rounded-xl" />

          <div className="border-t-4 border-[#f9e79f] pt-8">
            {renderStars(lunchRating, setLunchRating, hoveredLunchStar, setHoveredLunchStar, lunchSubmitted)}

            <div className="flex justify-center min-h-[70px]">
              {!lunchSubmitted ? (
                <button
                  onClick={() => handleSubmit('lunch')}
                  disabled={lunchRating === 0}
                  className="bg-[#FFDB31] text-black px-12 py-4 rounded-xl text-2xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 hover:scale-105"
                >
                  <Star size={28} fill="#000" />
                  Öğle Reyting Gönder
                </button>
              ) : (
                <div className="bg-white px-8 py-4 rounded-xl text-[#ff5722] text-2xl font-bold shadow-xl">
                  {formatCountdown(lunchCountdown)}
                </div>
              )}
            </div>

            {lunchSubmitted && lunchCountdown === WAIT_TIME && (
              <div className="text-center text-[#27AE60] text-xl mt-6 font-bold">
                ✓ Oyunuz kaydedildi! 😊
              </div>
            )}
          </div>
        </div>

        {/* Akşam Yemeği Bölümü */}
        <div className="bg-[#dceeff] rounded-2xl p-8 mb-8 shadow-2xl border-4 border-[#a9d4f5]">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">🌙 Akşam Yemeği Menüsü 🌙</h2>
          <div ref={dinnerTableRef} className="mb-8 bg-white/50 p-4 rounded-xl" />

          <div className="border-t-4 border-[#a9d4f5] pt-8">
            {renderStars(dinnerRating, setDinnerRating, hoveredDinnerStar, setHoveredDinnerStar, dinnerSubmitted)}

            <div className="flex justify-center min-h-[70px]">
              {!dinnerSubmitted ? (
                <button
                  onClick={() => handleSubmit('dinner')}
                  disabled={dinnerRating === 0}
                  className="bg-[#FFDB31] text-black px-12 py-4 rounded-xl text-2xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 hover:scale-105"
                >
                  <Star size={28} fill="#000" />
                  Akşam Reyting Gönder
                </button>
              ) : (
                <div className="bg-white px-8 py-4 rounded-xl text-[#ff5722] text-2xl font-bold shadow-xl">
                  {formatCountdown(dinnerCountdown)}
                </div>
              )}
            </div>

            {dinnerSubmitted && dinnerCountdown === WAIT_TIME && (
              <div className="text-center text-[#27AE60] text-xl mt-6 font-bold">
                ✓ Oyunuz kaydedildi! 😊
              </div>
            )}
          </div>
        </div>

        {/* Alt Tablo */}
        <div ref={footerTableRef} className="mb-8 bg-white p-4 rounded-xl shadow-lg" />

        {/* Bilgilendirme */}
        <div className="bg-gradient-to-r from-[#FFF3E0] to-[#FFE0B2] p-8 rounded-2xl mb-8 shadow-xl border-l-8 border-[#FF8C00]">
          <p className="text-gray-800 mb-4 text-lg text-center font-medium">
            ⚠️ Bu sayfadaki bilgiler eğlence amaçlıdır. Gerçeği yansıtmayabilir.
          </p>
          <div className="text-center">
            <a
              href="https://metinciris.com.tr/pages/ogrenciyemek.php"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#0066cc] text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-[#0052a3] transition-colors shadow-lg"
            >
              📚 Üniversite Öğrenci Yemek Menüsü
            </a>
          </div>
        </div>
      </PageContainer>

      <style>{`
        @keyframes fly {
          0% { transform: translateY(100vh); opacity: 1; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
