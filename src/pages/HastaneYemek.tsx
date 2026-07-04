import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import { PageContainer } from '../components/PageContainer';
import { Star, Cloud, Thermometer, Wind, Sparkles, Utensils, Moon, Coffee, Heart, MessageSquare, Info, ExternalLink, Calendar, ChevronRight } from 'lucide-react';
import { StarExplosion } from '../components/StarExplosion';
import { StudentLunchMenu } from '../components/StudentLunchMenu';
import { toast } from 'sonner';

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

  const [showLunchExplosion, setShowLunchExplosion] = useState(false);
  const [showDinnerExplosion, setShowDinnerExplosion] = useState(false);

  // Helper to clean HTML from Google Sheet cells
  const cleanHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });

  const [weatherText, setWeatherText] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [sheetData, setSheetData] = useState<{
    lunchVoteCount: string;
    dinnerVoteCount: string;
    lunchStats: string;
    lunchMenu: string[];
    dinnerStats: string;
    dinnerMenu: string[];
    summary: string;
    monthlySummary: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveWeather = useCallback(async () => {
    setWeatherLoading(true);

    try {
      const lat = 37.7648;
      const lon = 30.5566;
      const tz = 'Europe/Istanbul';

      const url =
        'https://api.open-meteo.com/v1/forecast' +
        '?latitude=' + lat +
        '&longitude=' + lon +
        '&hourly=temperature_2m,apparent_temperature,weathercode,precipitation,precipitation_probability,windspeed_10m' +
        '&forecast_days=2' +
        '&timezone=' + encodeURIComponent(tz);

      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Hava servisi yanıt vermedi');
      }

      const data = await response.json();
      const h = data.hourly;

      if (!h || !Array.isArray(h.time) || !h.time.length) {
        throw new Error('Saatlik hava verisi bulunamadı');
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');

      const localKey =
        now.getFullYear() + '-' +
        pad(now.getMonth() + 1) + '-' +
        pad(now.getDate()) + 'T' +
        pad(now.getHours()) + ':00';

      let start = h.time.indexOf(localKey);

      if (start === -1) {
        start = h.time.findIndex((t: string) => t > localKey);
      }

      if (start === -1) {
        throw new Error('Uygun saat bulunamadı');
      }

      const win: Array<{
        hour: string;
        temp: number;
        feel: number;
        code: number;
        rain: number;
        pop: number;
        wind: number;
      }> = [];

      for (let i = start; i < h.time.length && win.length < 6; i++) {
        win.push({
          hour: h.time[i].slice(11, 16),
          temp: h.temperature_2m[i],
          feel: h.apparent_temperature[i],
          code: h.weathercode[i],
          rain: h.precipitation[i] || 0,
          pop: h.precipitation_probability[i] || 0,
          wind: h.windspeed_10m[i] || 0
        });
      }

      if (!win.length) {
        throw new Error('Değerlendirilecek hava penceresi bulunamadı');
      }

      const first = win[0];

      const feel = Math.round(first.feel);
      const wind = Math.round(first.wind || 0);
      const popMax = Math.max(...win.map(x => x.pop || 0));
      const codes = win.map(x => x.code);

      const currentHour = parseInt(
        new Intl.DateTimeFormat('tr-TR', {
          hour: 'numeric',
          hour12: false,
          timeZone: 'Europe/Istanbul'
        }).format(now),
        10
      );

      const currentMonth = parseInt(
        new Intl.DateTimeFormat('tr-TR', {
          month: 'numeric',
          timeZone: 'Europe/Istanbul'
        }).format(now),
        10
      );

      const isNight = currentHour >= 20 || currentHour < 6;

      // Basit ay fazı hesabı: tarayıcıda hızlı çalışır, harici API gerektirmez.
      const synodicMonth = 29.53058867;
      const knownNewMoon = new Date(2000, 0, 6, 18, 14).getTime();
      const daysSinceKnownNewMoon = (now.getTime() - knownNewMoon) / 86400000;
      const moonAge = ((daysSinceKnownNewMoon % synodicMonth) + synodicMonth) % synodicMonth;
      const isFullMoonish = moonAge >= 13 && moonAge <= 17;

      const anyRain = codes.some(c =>
        (c >= 51 && c <= 57) ||
        (c >= 61 && c <= 67) ||
        (c >= 80 && c <= 82)
      );

      const anySnow = codes.some(c =>
        (c >= 71 && c <= 77) ||
        c === 85 ||
        c === 86
      );

      const anyThunder = codes.some(c => c >= 95);
      const anyFog = codes.some(c => c >= 45 && c <= 48);
      const anyCloud = codes.some(c => c === 2 || c === 3);

      let durum = 'açık';
      let emoji = isNight ? (isFullMoonish ? '🌕' : '✨') : '☀️';
      let acilis = isNight
        ? (isFullMoonish ? 'Bu gece mehtap var gibi 🌕' : 'Gökyüzü yıldız moduna geçmiş ✨')
        : 'Güneş yüzünü göstermiş 🌞';

      if (anyThunder) {
        durum = 'gök gürültülü';
        emoji = '⛈️';
        acilis = 'Gökyüzü biraz dram peşinde 😅';
      } else if (anySnow) {
        durum = 'karlı';
        emoji = '❄️';
        acilis = 'Kış “ben buradayım” diyor ❄️';
      } else if (anyRain) {
        durum = 'yağışlı';
        emoji = '🌧️';
        acilis = isNight ? 'Geceye şemsiye eşlik edebilir ☂️' : 'Şemsiye kulak kabartsın ☂️';
      } else if (anyFog) {
        durum = 'sisli';
        emoji = '🌫️';
        acilis = 'Şehir hafif gizem modunda 🕵️‍♂️';
      } else if (anyCloud) {
        durum = 'bulutlu';
        emoji = isNight ? '☁️' : '☁️';
        acilis = isNight ? 'Bulutlar gece vardiyasında ☁️' : 'Bulutlar toplantı yapmış ☁️';
      }

      let yagis = '';

      if (anyRain || anySnow || anyThunder) {
        yagis =
          'Önümüzdeki saatlerde %' +
          popMax +
          ' ihtimalle ' +
          (anySnow ? 'kar' : 'yağmur') +
          '.';
      } else {
        yagis = isNight
          ? 'Yağış görünmüyor; gece sakin duruyor. 🌙'
          : 'Şemsiye şimdilik dinlenebilir. ☂️🙂';
      }

      let tavsiye = '';

      if (feel <= 7) {
        tavsiye = '🧥 Mont iyi fikir.';
      } else if (popMax >= 30 && (anyRain || anySnow)) {
        tavsiye = '☂️ Şemsiye/kapüşon mantıklı.';
      } else {
        tavsiye = isNight ? '🌙 Hafif serinlik olabilir, abartmadan çık.' : '🙂 Rahat giy, abartma.';
      }

      const nowText = new Intl.DateTimeFormat('tr-TR', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Europe/Istanbul'
      }).format(new Date());

      let ispartaNotu = '';
      if (isNight && isFullMoonish && !anyRain && !anySnow && !anyFog && !anyCloud) {
        ispartaNotu = ' Eğirdir Gölü tarafında mehtap hayali kurdurur.';
      } else if (currentMonth >= 6 && currentMonth <= 8 && feel >= 28) {
        ispartaNotu = ' Gül diyarında gölge kıymetli.';
      } else if (currentMonth >= 12 || currentMonth <= 2) {
        ispartaNotu = ' Davraz tarafı “montu unutma” diye fısıldar.';
      } else if (currentMonth >= 3 && currentMonth <= 5) {
        ispartaNotu = ' Isparta baharı kendini hissettiriyor.';
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        ispartaNotu = ' Göller yöresi sonbahar havasına yakışır.';
      }

      let karsilama = '';
      if (currentHour >= 22 && currentHour < 24) {
        karsilama = ' İyi geceler.';
      } else if (currentHour >= 0 && currentHour < 4) {
        karsilama = ' Tatlı rüyalar, saat gece yarısını geçti.';
      } else if (currentHour >= 10 && currentHour < 12) {
        karsilama = ' Öğle yemeği vakti yaklaşıyor, afiyet olsun.';
      } else if (currentHour >= 12 && currentHour < 14) {
        karsilama = ' Afiyet olsun, reyting vermeyi unutma.';
      } else if (currentHour >= 14 && currentHour < 17) {
        karsilama = ' Menüye reyting verdiniz mi?';
      }

      const msg =
        emoji + ' ' + acilis +
        ' Isparta’da hava ' + durum + '. ' +
        'Hissedilen ~' + feel + '°C. ' +
        yagis + ' ' +
        tavsiye +
        ispartaNotu + ' ' +
        'Rüzgar ' + wind + ' km/sa.' +
        karsilama + ' ' +
        '(Güncelleme: ' + nowText + ')';

      setWeatherText(msg);

    } catch (error) {
      console.error('Hava verisi çekme hatası:', error);
      setWeatherText(
        '🌦️ Hava durumuna birazdan bakacağım; şu an bulutlarla toplantıdayım.'
      );
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveWeather();
  }, [fetchLiveWeather]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=663023417`);
      const text = await response.text();

      // Basic CSV parser for single-column Google Sheets export
      const rows = text.split('\n').map(row => {
        // Cleaning quotes from CSV export
        return row.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      });

      const voteParts = cleanHtml(rows[0] || '')
        .split(/\s+/)
        .map(part => part.trim())
        .filter(Boolean);

      const lunchVoteCount = voteParts[0] || '';
      const dinnerVoteCount = voteParts[1] || '';

      setSheetData({
        lunchVoteCount,
        dinnerVoteCount,
        lunchStats: rows[2] || '',
        lunchMenu: [rows[3], rows[4], rows[5]].filter(Boolean),
        dinnerStats: rows[7] || '',
        dinnerMenu: [rows[8], rows[9], rows[10]].filter(Boolean),
        summary: rows[12] || '',
        monthlySummary: rows[13] || ''
      });
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
        setShowLunchExplosion(true);
      } else {
        localStorage.setItem('votedTimestampAksam', timestamp.toString());
        setDinnerSubmitted(true);
        setDinnerCountdown(WAIT_TIME);
        setDinnerRating(0);
        setHoveredDinnerStar(0);
        setShowDinnerExplosion(true);
      }

      toast.success('Değerlendirmeniz alındı. Teşekkürler!');

      // Oylama sonrası tabloyu yenile (Google Sheets'in güncellenmesi için kısa bir gecikme)
      setTimeout(() => {
        fetchData();
      }, 1500);

    } catch (error) {
      console.error('Form gönderimi hatası:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
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
      <div className="flex justify-center gap-3 my-4">
        {[1, 2, 3, 4, 5].map((value) => {
          const active = (hovered || rating) >= value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => !disabled && setRating(value)}
              onMouseEnter={() => !disabled && setHovered(value)}
              onMouseLeave={() => !disabled && setHovered(0)}
              className="group relative p-1 transition-transform active:scale-75"
              aria-label={`${value} yıldız`}
            >
              <Star
                size={34}
                className={`transition-all duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'scale-100'}`}
                fill={active ? '#FBBF24' : 'transparent'}
                stroke={active ? '#F59E0B' : '#CBD5E1'}
                strokeWidth={active ? 2.5 : 2}
              />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageContainer>
        {/* SEO-friendly hidden content */}
        <div className="sr-only" aria-hidden="false">
          <h1>SDÜ Hastane Yemek Listesi - Süleyman Demirel Üniversitesi Hastanesi Günlük Menü</h1>
          <p>Isparta Süleyman Demirel Üniversitesi (SDÜ) Araştırma ve Uygulama Hastanesi günlük yemek menüsü. Metin Çiriş tarafından hazırlanan güncel yemekhane portalı.</p>
        </div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#303f9f] to-[#1976d2] rounded-3xl p-8 md:p-12 mb-8 text-white shadow-xl text-center"
        >
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-2xl md:text-5xl font-black mb-4 tracking-tight">SDÜ Hastane Menüsü</h1>
            <div className="flex flex-col items-center">
              <div className="text-sm uppercase tracking-widest opacity-80 mb-1 font-bold italic">Bugün</div>
              <div className="text-xl md:text-2xl font-black italic">{formattedDate.split(' ')[0]} {formattedDate.split(' ')[1]} {formattedDate.split(' ').slice(2).join(' ')}</div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#3f51b5]/30 rounded-full blur-3xl"></div>
        </motion.div>

        {/* AI Weather/Greeting Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0 w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-500">
              {weatherLoading ? (
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <Cloud size={30} className="absolute animate-pulse" />
                  <Sparkles size={16} className="absolute -top-1 -right-1 animate-bounce" />
                </div>
              ) : (
                <Cloud size={32} />
              )}
            </div>

            <div className="text-slate-600 leading-relaxed italic font-medium">
              {weatherLoading ? (
                <div className="flex items-center gap-2">
                  <span className="inline-block animate-spin">☀️</span>
                  <span className="inline-block animate-bounce">☁️</span>
                  <span className="inline-block animate-pulse">💧</span>
                  <span>Hava durumuna bakıyorum...</span>
                </div>
              ) : (
                `"${weatherText}"`
              )}
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Menü yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Lunch Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              <div className="bg-[#e65100] p-6 text-white text-center">
                <div className="flex justify-between items-center mb-2">
                  {sheetData?.lunchVoteCount ? (
                    <motion.div
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
                      className="flex items-center gap-2 text-white select-none cursor-default"
                      title="Öğle menüsü oy sayısı"
                    >
                      <MessageSquare size={30} className="drop-shadow-sm opacity-95" strokeWidth={2.4} />
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-2xl md:text-3xl font-black drop-shadow-sm tabular-nums">{cleanHtml(sheetData.lunchVoteCount)}</span>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.22em] opacity-90">oy</span>
                      </div>
                    </motion.div>
                  ) : (
                    <Utensils size={24} className="opacity-90" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-widest bg-black/20 px-2 py-1 rounded">ÖĞLE</span>
                </div>
                <h2 className="text-2xl font-black italic">Öğle Yemeği Menüsü</h2>
                {sheetData?.lunchStats && (
                  <div className="mt-3 text-sm font-bold bg-white/20 p-3 rounded-xl inline-block text-white border border-white/30 backdrop-blur-sm">
                    {cleanHtml(sheetData.lunchStats)}
                  </div>
                )}
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="space-y-4 flex-grow">
                  {sheetData?.lunchMenu.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform border border-orange-200">
                        <Heart size={20} className="fill-current" />
                      </div>
                      <span className="text-slate-800 font-bold text-lg text-left leading-tight">{cleanHtml(item)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">MENÜYÜ DEĞERLENDİR</h3>
                  {renderStars(lunchRating, setLunchRating, hoveredLunchStar, setHoveredLunchStar, lunchSubmitted)}
                  <div className="mt-4 relative min-h-[48px] flex justify-center">
                    <StarExplosion active={showLunchExplosion} onComplete={() => setShowLunchExplosion(false)} />
                    {!lunchSubmitted ? (
                      <button
                        onClick={() => handleSubmit('lunch')}
                        disabled={lunchRating === 0}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#e65100] hover:bg-[#ef6c00] text-white font-black shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Star size={20} fill="currentColor" />
                        <span>REYTINGIMI GÖNDER</span>
                      </button>
                    ) : (
                      <div className="w-full px-6 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold flex items-center justify-center gap-2">
                        <Calendar size={18} />
                        {formatCountdown(lunchCountdown)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Dinner Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -5 }}
              className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              <div className="bg-[#673ab7] p-6 text-white text-center">
                <div className="flex justify-between items-center mb-2">
                  {sheetData?.dinnerVoteCount ? (
                    <motion.div
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
                      className="flex items-center gap-2 text-white select-none cursor-default"
                      title="Akşam menüsü oy sayısı"
                    >
                      <MessageSquare size={30} className="drop-shadow-sm opacity-95" strokeWidth={2.4} />
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-2xl md:text-3xl font-black drop-shadow-sm tabular-nums">{cleanHtml(sheetData.dinnerVoteCount)}</span>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.22em] opacity-90">oy</span>
                      </div>
                    </motion.div>
                  ) : (
                    <Moon size={24} className="opacity-90" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-widest bg-black/10 px-2 py-1 rounded">AKŞAM</span>
                </div>
                <h2 className="text-2xl font-black italic">Akşam Yemeği Menüsü</h2>
                {sheetData?.dinnerStats && (
                  <div className="mt-3 text-sm font-bold bg-white/30 p-3 rounded-xl inline-block text-white border border-white/20">
                    {cleanHtml(sheetData.dinnerStats)}
                  </div>
                )}
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="space-y-4 flex-grow">
                  {sheetData?.dinnerMenu.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform border border-indigo-200">
                        <Heart size={20} className="fill-current" />
                      </div>
                      <span className="text-slate-800 font-bold text-lg text-left leading-tight">{cleanHtml(item)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">MENÜYÜ DEĞERLENDİR</h3>
                  {renderStars(dinnerRating, setDinnerRating, hoveredDinnerStar, setHoveredDinnerStar, dinnerSubmitted)}
                  <div className="mt-4 relative min-h-[48px] flex justify-center">
                    <StarExplosion active={showDinnerExplosion} onComplete={() => setShowDinnerExplosion(false)} />
                    {!dinnerSubmitted ? (
                      <button
                        onClick={() => handleSubmit('dinner')}
                        disabled={dinnerRating === 0}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#673ab7] hover:bg-[#5e35b1] text-white font-black shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Star size={20} fill="currentColor" />
                        <span>REYTINGIMI GÖNDER</span>
                      </button>
                    ) : (
                      <div className="w-full px-6 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold flex items-center justify-center gap-2">
                        <Calendar size={18} />
                        {formatCountdown(dinnerCountdown)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* AI Analysis Sections */}
        {!isLoading && sheetData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {sheetData.summary && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-emerald-100 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Sparkles size={80} />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  🤖 Bugünün Yapay Zeka Değerlendirmesi
                </h2>
                <div className="text-slate-600 leading-relaxed font-medium relative z-10">
                  {cleanHtml(sheetData.summary)}
                </div>
              </div>
            )}

            {sheetData.monthlySummary && (
              <div className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white relative group">
                <div className="absolute top-0 right-0 p-4 text-white/5">
                  <Coffee size={80} />
                </div>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  🤖 Aylık Yapay Zeka Özeti
                </h2>
                <div className="text-slate-300 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sheetData.monthlySummary) }} />
              </div>
            )}
          </div>
        )}

        {/* Student Menu Integration */}
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-grow bg-slate-200"></div>
            <h2 className="text-slate-400 font-black uppercase tracking-widest text-sm text-center">Ayrıca Göz Atın</h2>
            <div className="h-px flex-grow bg-slate-200"></div>
          </div>
          <StudentLunchMenu />

          <div className="flex justify-center mt-6">
            <button
              onClick={() => window.location.href = '/ogrenci-yemek'}
              className="group flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#16A085] text-[#16A085] rounded-2xl font-black hover:bg-[#16A085] hover:text-white transition-all shadow-sm"
            >
              <span>Tüm Öğrenci Menüleri</span>
              <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Disclaimer Footer - At the bottom */}
        <div className="mt-12 mb-8 bg-slate-200/50 backdrop-blur-sm rounded-3xl p-6 text-center text-slate-500 text-xs font-bold flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span>Feragatname & Bilgilendirme</span>
          </div>
          <p>Bu platform tamamen eğlence ve kişisel proje amaçlıdır. Veriler resmi SDÜ kaynakları ile farklılık gösterebilir.</p>
          <div className="mt-2 text-[10px] opacity-70">
            © 2026 Metin Çiriş Portalı · Tüm Hakları Saklıdır
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
