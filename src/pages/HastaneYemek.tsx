import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Star, Sparkles, Utensils, Moon, Coffee, MessageSquare, Info, Calendar, ChevronRight } from 'lucide-react';
import { StarExplosion } from '../components/StarExplosion';
import { StudentLunchMenu } from '../components/StudentLunchMenu';
import { toast } from 'sonner';

declare global {
  interface Window {
    google: any;
  }
}

const SHEET_ID = '1dxvTCpd-Yegvh7Zy1QkHC_hIwv9Zrwtld3FASVlMrzw';
const GID = '663023417';
const WAIT_TIME = 900; // 15 dakika

type MealType = 'lunch' | 'dinner';

type SheetData = {
  lunchStats: string;
  lunchMenu: string[];
  dinnerStats: string;
  dinnerMenu: string[];
  aiDaily: string;      // A13
  aiMonthly: string;    // A14 (boş değilse gösterilecek)
};

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

  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  /**
   * CSV çıktı bazen hücre içinde newline taşıyor (A7'deki gibi).
   * out:csv bunu satır gibi bölebiliyor -> indeks kayıyor.
   * Bu normalize: newline'ı tek satıra indirip, satırları güvenli hale getirir.
   */
// CSV satırlarını güvenli diziye çevir
const normalizeCsvRows = (rawText: string) => {
  const rows = rawText
    .replace(/\r/g, '')
    .split('\n')
    .map(r => r.trim())
    .map(row => row.replace(/^"|"$/g, '').replace(/""/g, '"'));

  // Bazı gviz çıktılarında başlık olabiliyor
  const first = (rows[0] ?? '').trim().toLowerCase();
  const looksLikeHeader = first === 'a' || first === 'column a';
  return looksLikeHeader ? rows.slice(1) : rows;
};

const fetchData = useCallback(async () => {
  setIsLoading(true);
  try {
    const res = await fetch('/hastane-menu.json', { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`hastane-menu.json HTTP ${res.status}`);
    }

    const data = await res.json();

    setSheetData({
      lunchStats: data.lunchStats || '',
      lunchMenu: Array.isArray(data.lunchMenu) ? data.lunchMenu : [],
      dinnerStats: data.dinnerStats || '',
      dinnerMenu: Array.isArray(data.dinnerMenu) ? data.dinnerMenu : [],
      aiDaily: data.aiDaily || '',
      aiMonthly: data.aiMonthly || '',
    });
  } catch (e) {
    console.error('Menu JSON fetch error:', e);
    setSheetData({
      lunchStats: '',
      lunchMenu: [],
      dinnerStats: '',
      dinnerMenu: [],
      aiDaily: '',
      aiMonthly: '',
    });
  } finally {
    setIsLoading(false);
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
        <div className="sr-only" aria-hidden="false">
          <h1>SDÜ Hastane Yemek Listesi - Süleyman Demirel Üniversitesi Hastanesi Günlük Menü</h1>
          <p>Isparta Süleyman Demirel Üniversitesi (SDÜ) Araştırma ve Uygulama Hastanesi günlük yemek menüsü.</p>
        </div>

        {/* ✅ Kompakt Sticky Header */}
        <div className="sticky top-3 z-40 mb-5">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="font-black text-slate-800 whitespace-nowrap">
                SDÜ Hastane Menüsü
              </div>
              <div className="flex-1 text-center font-black text-slate-700 truncate">
                Bugün {formattedDate}
              </div>
              <div className="w-6" aria-hidden="true" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Menü yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Lunch Card */}
            <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-[#ff9800] p-6 text-white">
                <div className="flex justify-between items-center mb-2">
                  <Utensils size={24} className="opacity-90" />
                  <span className="text-xs font-bold uppercase tracking-widest bg-black/20 px-2 py-1 rounded">ÖĞLE</span>
                </div>
                <h2 className="text-2xl font-black italic">Öğle Yemeği Menüsü</h2>
                {sheetData?.lunchStats && (
                  <div className="mt-3 text-sm font-bold bg-white/30 p-3 rounded-xl inline-block text-white border border-white/20">
                    {cleanHtml(sheetData.lunchStats)}
                  </div>
                )}
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="space-y-4 flex-grow">
                  {sheetData?.lunchMenu.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform border border-orange-200">
                        <ChevronRight size={20} />
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
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#ff9800] hover:bg-[#f57c00] text-white font-black shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
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
            </div>

            {/* Dinner Card */}
            <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-[#673ab7] p-6 text-white">
                <div className="flex justify-between items-center mb-2">
                  <Moon size={24} className="opacity-90" />
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
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform border border-indigo-200">
                        <ChevronRight size={20} />
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
            </div>
          </div>
        )}

        {/* ✅ AI Analysis Sections */}
        {!isLoading && sheetData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {sheetData.aiDaily && cleanHtml(sheetData.aiDaily) !== '' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-emerald-100 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Sparkles size={80} />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  Yapay Zeka Değerlendirmesi
                </h2>
                <div className="text-slate-600 leading-relaxed font-medium relative z-10">
                  {cleanHtml(sheetData.aiDaily)}
                </div>
              </div>
            )}

            {sheetData.aiMonthly && cleanHtml(sheetData.aiMonthly) !== '' && (
              <div className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white relative group">
                <div className="absolute top-0 right-0 p-4 text-white/5">
                  <Coffee size={80} />
                </div>
                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  Aylık Yapay Zeka Menü Değerlendirmesi
                </h2>
                <div
                  className="text-slate-300 leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ __html: sheetData.aiMonthly }}
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-grow bg-slate-200"></div>
            <h2 className="text-slate-400 font-black uppercase tracking-widest text-sm">Ayrıca Göz Atın</h2>
            <div className="h-px flex-grow bg-slate-200"></div>
          </div>
          <StudentLunchMenu />
        </div>

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
