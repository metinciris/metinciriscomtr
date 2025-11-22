import React, { useEffect, useState, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Utensils, Star, Sun, Moon, Cloud } from 'lucide-react';

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
  const [skyState, setSkyState] = useState('day');
  const [sunPosition, setSunPosition] = useState({ x: 50, y: 50 });
  const [moonPhase, setMoonPhase] = useState('🌙');
  const [weather, setWeather] = useState<any>(null);
  const [randomQuote, setRandomQuote] = useState({ text: '', author: '', title: '' });
  
  const headerTableRef = useRef<HTMLDivElement>(null);
  const lunchTableRef = useRef<HTMLDivElement>(null);
  const dinnerTableRef = useRef<HTMLDivElement>(null);
  const footerTableRef = useRef<HTMLDivElement>(null);

  const WAIT_TIME = 900; // 15 dakika

  // Rastgele yemek sözleri
  const foodQuotes = [
    {
      text: "Yemek pişirmek, bir hikaye anlatmaktır.",
      author: "Elena Arzak",
      title: "İspanyol şef"
    },
    {
      text: "Yemek yalnızca yemek değildir. Sanat, bilim ve hoşgörüdür.",
      author: "Ferran Adrià",
      title: "İspanyol şef"
    },
    {
      text: "Yemek pişirmek aşkla ilgilidir. Ya aşkla yaparsınız ya da hiç yapmazsınız.",
      author: "Thomas Keller",
      title: "Amerikalı şef"
    },
    {
      text: "İyi yemek, sağlığın temelidir.",
      author: "James Beard",
      title: "Amerikalı şef"
    },
    {
      text: "Mutfak, hayatın kalbidir.",
      author: "Julia Child",
      title: "Amerikalı şef"
    },
    {
      text: "Yemek, sevgiyi paylaşmanın bir yoludur.",
      author: "Jamie Oliver",
      title: "İngiliz şef"
    },
    {
      text: "Basit yemekler genellikle en iyisidir.",
      author: "Auguste Escoffier",
      title: "Fransız şef"
    },
    {
      text: "Yemek pişirmek bir sanattır, yemek bir zevktir.",
      author: "Paul Bocuse",
      title: "Fransız şef"
    },
    {
      text: "Mutfakta mükemmellik aramak, hayatta mükemmellik aramaktır.",
      author: "Jiro Ono",
      title: "Japon sushi ustası"
    },
    {
      text: "Yemek, insanları bir araya getiren evrensel bir dildir.",
      author: "Massimo Bottura",
      title: "İtalyan şef"
    },
    {
      text: "İyi bir yemek, ruhun gıdasıdır.",
      author: "Yotam Ottolenghi",
      title: "İsrailli-İngiliz şef"
    },
    {
      text: "Mutfak, yaratıcılığın sınırsız olduğu yerdir.",
      author: "Gordon Ramsay",
      title: "İskoç şef"
    },
    {
      text: "Yemek pişirmek sabır ve tutku gerektirir.",
      author: "Heston Blumenthal",
      title: "İngiliz şef"
    },
    {
      text: "En güzel anılar, bir sofranın etrafında paylaşılır.",
      author: "Nigella Lawson",
      title: "İngiliz yemek yazarı"
    },
    {
      text: "Yemek, bir kültürün ruhudur.",
      author: "Anthony Bourdain",
      title: "Amerikalı şef ve yazar"
    }
  ];

  // Sayfa yüklendiğinde rastgele söz seç
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
      document.body.removeChild(script);
    };
  }, []);

  // Tabloları çiz
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
        fontSize: 20,
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

  // Gökyüzü animasyonu
  useEffect(() => {
    const updateSky = () => {
      const now = new Date();
      const hour = now.getHours();
      const timeProgress = (hour * 60 + now.getMinutes()) / (24 * 60);

      // Güneş pozisyonu
      const sunX = timeProgress * 100;
      const sunY = 30 + Math.sin(timeProgress * Math.PI) * 40;
      setSunPosition({ x: sunX, y: sunY });

      // Gökyüzü durumu
      if (hour >= 5 && hour < 7) setSkyState('dawn');
      else if (hour >= 7 && hour < 18) setSkyState('day');
      else if (hour >= 18 && hour < 20) setSkyState('dusk');
      else setSkyState('night');

      // Ay fazı
      const phase = calculateMoonPhase(now);
      setMoonPhase(getMoonIcon(phase));
    };

    updateSky();
    const interval = setInterval(updateSky, 60000);
    return () => clearInterval(interval);
  }, []);

  const calculateMoonPhase = (date: Date) => {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    const day = date.getDate();
    if (month < 3) { year--; month += 12; }
    const c = 365.25 * year;
    const e = 30.6 * month;
    let jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    const b = Math.floor(jd);
    return jd - b;
  };

  const getMoonIcon = (phase: number) => {
    const rounded = Math.round(phase * 8) / 8;
    if (rounded <= 0.0625) return "🌑";
    if (rounded <= 0.1875) return "🌒";
    if (rounded <= 0.3125) return "🌓";
    if (rounded <= 0.4375) return "🌔";
    if (rounded <= 0.5625) return "🌕";
    if (rounded <= 0.6875) return "🌖";
    if (rounded <= 0.8125) return "🌗";
    return "🌘";
  };

  // Hava durumu
  useEffect(() => {
    fetch('https://wttr.in/Isparta?format=j1')
      .then(res => res.json())
      .then(data => setWeather(data.current_condition[0]))
      .catch(err => console.error('Hava durumu alınamadı:', err));
  }, []);

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

      // Tabloları yenile
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
      <div className="flex justify-center gap-2 my-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => !disabled && setRating(value)}
            onMouseEnter={() => !disabled && setHovered(value)}
            onMouseLeave={() => !disabled && setHovered(0)}
            disabled={disabled}
            className="transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star
              size={48}
              fill={(hovered || rating) >= value ? '#FFD700' : 'transparent'}
              stroke={(hovered || rating) >= value ? '#FFD700' : '#ccc'}
              className="transition-all"
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
              className="absolute text-[#ffcc00] text-2xl animate-[fly_4s_ease-in-out_infinite]"
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

        {/* Alıntı - Rastgele */}
        <div className="bg-white p-6 rounded-2xl text-center mb-6 shadow-lg">
          {randomQuote.text && (
            <p className="italic text-muted-foreground">
              {randomQuote.text}<br />
              <strong>{randomQuote.author}</strong><br />
              {randomQuote.title}
            </p>
          )}
        </div>

        {/* Başlık Tablosu */}
        <div ref={headerTableRef} className="mb-6" />

        {/* Öğle Yemeği Bölümü */}
        <div className="bg-[#fff9c4] rounded-xl p-6 mb-6 shadow-lg">
          <div ref={lunchTableRef} className="mb-6" />
          
          <div className="border-t border-black/10 pt-6">
            {renderStars(lunchRating, setLunchRating, hoveredLunchStar, setHoveredLunchStar, lunchSubmitted)}
            
            <div className="flex justify-center min-h-[60px]">
              {!lunchSubmitted ? (
                <button
                  onClick={() => handleSubmit('lunch')}
                  disabled={lunchRating === 0}
                  className="bg-[#FFDB31] text-black px-8 py-3 rounded-lg text-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Star size={20} />
                  Öğle Reyting Gönder
                </button>
              ) : (
                <div className="bg-white/70 px-6 py-3 rounded-lg text-[#ff5722] text-xl font-bold shadow">
                  {formatCountdown(lunchCountdown)}
                </div>
              )}
            </div>
            
            {lunchSubmitted && lunchCountdown === WAIT_TIME && (
              <div className="text-center text-[#27AE60] mt-4">
                ✓ Oyunuz kaydedildi! 😊
              </div>
            )}
          </div>
        </div>

        {/* Akşam Yemeği Bölümü */}
        <div className="bg-[#dceeff] rounded-xl p-6 mb-6 shadow-lg">
          <div ref={dinnerTableRef} className="mb-6" />
          
          <div className="border-t border-black/10 pt-6">
            {renderStars(dinnerRating, setDinnerRating, hoveredDinnerStar, setHoveredDinnerStar, dinnerSubmitted)}
            
            <div className="flex justify-center min-h-[60px]">
              {!dinnerSubmitted ? (
                <button
                  onClick={() => handleSubmit('dinner')}
                  disabled={dinnerRating === 0}
                  className="bg-[#FFDB31] text-black px-8 py-3 rounded-lg text-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Star size={20} />
                  Akşam Reyting Gönder
                </button>
              ) : (
                <div className="bg-white/70 px-6 py-3 rounded-lg text-[#ff5722] text-xl font-bold shadow">
                  {formatCountdown(dinnerCountdown)}
                </div>
              )}
            </div>
            
            {dinnerSubmitted && dinnerCountdown === WAIT_TIME && (
              <div className="text-center text-[#27AE60] mt-4">
                ✓ Oyunuz kaydedildi! 😊
              </div>
            )}
          </div>
        </div>

        {/* Alt Tablo */}
        <div ref={footerTableRef} className="mb-6" />

        {/* Bilgilendirme */}
        <div className="bg-white p-6 rounded-xl mb-6 shadow-lg text-center">
          <p className="text-muted-foreground mb-2">
            Bu sayfadaki bilgiler eğlence amaçlıdır. Gerçeği yansıtmayabilir.
          </p>
          <a
            href="https://metinciris.com.tr/pages/ogrenciyemek.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0066cc] hover:underline"
          >
            Üniversite Öğrenci Yemek Menüsü
          </a>
        </div>

        {/* Animasyonlu Gökyüzü Footer */}
        <div className={`relative h-24 overflow-hidden rounded-t-xl transition-all duration-1000 ${
          skyState === 'night' ? 'bg-gradient-to-b from-[#1e1b4b] to-[#312e81]' :
          skyState === 'dawn' ? 'bg-gradient-to-b from-[#757F9A] to-[#D7DDE8]' :
          skyState === 'dusk' ? 'bg-gradient-to-b from-[#e96443] to-[#904e95]' :
          'bg-gradient-to-b from-[#60a5fa] to-[#93c5fd]'
        }`}>
          {/* Yıldızlar */}
          {skyState === 'night' && (
            <>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-[#FFD700] animate-[star-twinkle_4s_infinite_ease-in-out]"
                  style={{
                    left: `${(i * 5 + 8)}%`,
                    top: `${15 + (i % 3) * 10}%`,
                    fontSize: '8px',
                    animationDelay: `${i * 0.3}s`,
                    textShadow: '0 0 8px rgba(255, 215, 0, 0.7)'
                  }}
                >
                  ★
                </div>
              ))}
            </>
          )}

          {/* Güneş */}
          {(skyState === 'day' || skyState === 'dawn' || skyState === 'dusk') && (
            <div
              className="absolute w-6 h-6 bg-[#fbbf24] rounded-full transition-all duration-[2000ms]"
              style={{
                left: `${Math.max(5, Math.min(95, sunPosition.x))}%`,
                top: `${Math.max(10, Math.min(80, sunPosition.y))}%`,
                boxShadow: '0 0 20px #fbbf24'
              }}
            />
          )}

          {/* Ay */}
          {skyState === 'night' && (
            <div
              className="absolute text-2xl transition-all duration-[2000ms]"
              style={{
                left: `${Math.max(5, Math.min(95, (sunPosition.x + 50) % 100))}%`,
                top: `${Math.max(10, Math.min(80, 30 + Math.sin(((sunPosition.x + 50) / 100) * Math.PI) * 40))}%`,
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
              }}
            >
              {moonPhase}
            </div>
          )}

          {/* Bulutlar */}
          {weather && parseInt(weather.weatherCode) >= 116 && (
            <>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-white/50 text-sm animate-[float-cloud_40s_infinite_linear]"
                  style={{
                    left: `${i * 30 + 10}%`,
                    top: `${15 + i * 8}%`,
                    animationDelay: `${i * 8}s`
                  }}
                >
                  ☁
                </div>
              ))}
            </>
          )}

          {/* Ufuk çizgisi */}
          <div className={`absolute bottom-0 left-0 right-0 h-4 transition-all duration-1000 ${
            skyState === 'night'
              ? 'bg-gradient-to-t from-[rgba(31,41,55,0.4)] to-transparent'
              : 'bg-gradient-to-t from-[rgba(139,69,19,0.3)] to-transparent'
          }`} />
        </div>
      </PageContainer>

      <style>{`
        @keyframes fly {
          0% { transform: translateY(100vh); opacity: 1; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
        
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          25% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
          75% { opacity: 0.7; transform: scale(1.1); }
        }
        
        @keyframes float-cloud {
          from { transform: translateX(-50px); }
          to { transform: translateX(calc(100% + 50px)); }
        }
      `}</style>
    </div>
  );
}
