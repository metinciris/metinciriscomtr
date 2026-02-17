import React, { useEffect, useState, useCallback } from 'react';
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

  const [sheetData, setSheetData] = useState<{
    weather: string;
    lunchStats: string;
    lunchMenu: string[];
    dinnerStats: string;
    dinnerMenu: string[];
    summary: string;
    monthlySummary: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

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

      setSheetData({
        weather: rows[0] || '',
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
        <div className="relative overflow-hidden bg-gradient-to-br from-[#303f9f] to-[#1976d2] rounded-3xl p-8 md:p-12 mb-8 text-white shadow-xl text-center">
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
        </div>

        {/* AI Weather/Greeting Section */}
        {sheetData?.weather && (
          <div className="mb-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="shrink-0 w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-500">
                <Cloud size={32} />
              </div>
              <div className="text-slate-600 leading-relaxed italic font-medium">
                "{cleanHtml(sheetData.weather)}"
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Menü yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Lunch Card */}
            <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-[#e65100] p-6 text-white text-center">
                <div className="flex justify-between items-center mb-2">
                  <Utensils size={24} className="opacity-90" />
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
            </div>

            {/* Dinner Card */}
            <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-[#673ab7] p-6 text-white text-center">
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
            </div>
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
                  Yapay Zeka Değerlendirmesi
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
                  Yapay Zeka Özeti
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

        {/* Disclaimer Footer - At the very bottom */}
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
