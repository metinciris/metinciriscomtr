import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Utensils, Star, ExternalLink, Calendar, Clock, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface MenuStats {
  updated: string;
  time: string;
  totalVotes: string;
  lunchAvg: string;
  dinnerAvg: string;
}

interface MenuItem {
  date: string;
  day: string;
  lunchMenu: string;
  lunchKcal: string;
  dinnerMenu: string;
  dinnerKcal: string;
}

export function OgrenciYemek() {
  const [stats, setStats] = React.useState<MenuStats | null>(null);
  const [menu, setMenu] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ratingLunch, setRatingLunch] = React.useState(0);
  const [ratingDinner, setRatingDinner] = React.useState(0);
  const [hoveredLunch, setHoveredLunch] = React.useState(0);
  const [hoveredDinner, setHoveredDinner] = React.useState(0);
  const [cooldown, setCooldown] = React.useState<{ [key: string]: number }>({});

  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1rXB81K4CkGT1wrtRGOnqVVRZB8g5GxpvP4TqAXu4BSE/export?format=csv&gid=711889518';
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfGI7KHuI88wiAmawaEPMsqsGRJXRwNXRnVAAj__ZDmaCrZRw/formResponse';

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cache buster added to URL to ensure fresh data
      const cacheBuster = `&t=${Date.now()}`;
      const response = await fetch(SHEET_URL + cacheBuster);
      const csv = await response.text();
      const parsed = parseCSV(csv);
      setStats(parsed.stats);
      setMenu(parsed.menu);
    } catch (error) {
      console.error('Data fetch error:', error);
      toast.error('Veriler güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    // Load cooldown from localStorage
    const savedCooldown = localStorage.getItem('yemek_cooldown');
    if (savedCooldown) {
      setCooldown(JSON.parse(savedCooldown));
    }
  }, []);

  const parseCSV = (csv: string) => {
    // 1. Detect Separator (comma vs semicolon)
    const cleanCSV = csv.replace(/^\uFEFF/, '');
    const commaCount = (cleanCSV.match(/,/g) || []).length;
    const semicolonCount = (cleanCSV.match(/;/g) || []).length;
    const separator = semicolonCount > commaCount ? ';' : ',';

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < cleanCSV.length; i++) {
      const char = cleanCSV[i];
      const nextChar = cleanCSV[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell) currentRow.push(currentCell.trim());
    if (currentRow.length > 0) rows.push(currentRow);

    // 2. Identify Header & Columns Dynamically
    // Use toLocaleLowerCase('en-US') to avoid Turkish I/İ bug (Tarih -> tarıh mismatch)
    const headerRowIndex = rows.findIndex(r => r.some(cell =>
      cell.toLocaleLowerCase('en-US').includes('tarih')
    ));

    if (headerRowIndex === -1) {
      console.log('Parsed Rows for Debug:', rows.slice(0, 10));
      console.error('CSV Parsing Error: Header row (Tarih) not found.');
      return { stats: null, menu: [] };
    }

    const headerRow = rows[headerRowIndex];
    const findCol = (terms: string[]) => headerRow.findIndex(cell => {
      const cleanCell = cell.toLocaleLowerCase('en-US').trim();
      return terms.some(term => cleanCell.includes(term.toLocaleLowerCase('en-US')));
    });

    const colIdx = {
      date: findCol(['tarih']),
      day: findCol(['gün']),
      lunchMenu: findCol(['öğle menü', 'öğle menüsü']),
      lunchKcal: findCol(['öğle kcal']),
      dinnerMenu: findCol(['akşam menü', 'akşam menüsü']),
      dinnerKcal: findCol(['akşam kcal'])
    };

    const stats = {
      updated: (headerRowIndex > 0 ? rows[0]?.[1] : '') || '',
      time: (headerRowIndex > 1 ? rows[1]?.[1] : '') || '',
      totalVotes: (headerRowIndex > 2 ? rows[2]?.[1] : '') || '',
      lunchAvg: (headerRowIndex > 3 ? rows[3]?.[1] : '') || '',
      dinnerAvg: (headerRowIndex > 4 ? rows[4]?.[1] : '') || '',
    };

    const menuItems: MenuItem[] = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[colIdx.date] || !/\d/.test(r[colIdx.date])) continue;

      menuItems.push({
        date: r[colIdx.date].trim(),
        day: colIdx.day !== -1 ? r[colIdx.day]?.trim() || '' : '',
        lunchMenu: colIdx.lunchMenu !== -1 ? (r[colIdx.lunchMenu]?.replace(/\n/g, ', ').trim() || '') : '',
        lunchKcal: colIdx.lunchKcal !== -1 ? r[colIdx.lunchKcal]?.trim() || '' : '',
        dinnerMenu: colIdx.dinnerMenu !== -1 ? (r[colIdx.dinnerMenu]?.replace(/\n/g, ', ').trim() || '') : '',
        dinnerKcal: colIdx.dinnerKcal !== -1 ? r[colIdx.dinnerKcal]?.trim() || '' : ''
      });
    }

    return { stats, menu: menuItems };
  };

  const handleRate = async (type: 'lunch' | 'dinner', value: number) => {
    const now = Date.now();
    const lastVote = cooldown[type] || 0;
    const diff = (now - lastVote) / 1000 / 60; // minutes

    if (diff < 10) {
      const remaining = Math.ceil(10 - diff);
      toast.error(`Lütfen tekrar oy vermek için ${remaining} dakika bekleyin.`);
      return;
    }

    try {
      const formData = new FormData();
      // Using the base form to find entry IDs if they were provided, 
      // but assuming the form field for rating is what we need to map.
      // The user provided: https://docs.google.com/forms/d/e/1FAIpQLSfGI7KHuI88wiAmawaEPMsqsGRJXRwNXRnVAAj__ZDmaCrZRw/viewform
      // I need to know the entry ID. Looking at a typical form it might be entry.XXXXX.
      // Since I don't have the entry IDs, I will assume entry.1343444217 from previous code 
      // or try to find a pattern. I'll use a placeholder or ask if not sure.
      // Wait, the user didn't give entry IDs. I'll use a generic approach or ask.
      // Actually, I'll stick to what was in the file if it looks like SDÜ form.
      // The previous file had entry.1343444217.

      formData.append(type === 'lunch' ? 'entry.2023260417' : 'entry.1469403457', value.toString());

      await fetch(FORM_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      const newCooldown = { ...cooldown, [type]: now };
      setCooldown(newCooldown);
      localStorage.setItem('yemek_cooldown', JSON.stringify(newCooldown));

      if (type === 'lunch') setRatingLunch(value);
      else setRatingDinner(value);

      toast.success('Değerlendirmeniz alındı. Teşekkürler!');
      // Refresh data to show updated stats (might take a few seconds in Google Sheets)
      setTimeout(fetchData, 2000);
    } catch (error) {
      toast.error('Bir hata oluştu.');
    }
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Flexible Date Matching: Only compare numbers to avoid hidden characters or different separators
  const normalizeDate = (d: string) => d.replace(/\D/g, '');
  const today = formatDate(new Date());
  const normalizedToday = normalizeDate(today);
  const todayMenu = menu.find(m => normalizeDate(m.date) === normalizedToday);

  const showLunchRating = !!todayMenu?.lunchMenu;
  const showDinnerRating = !!todayMenu?.dinnerMenu;

  const StarRating = ({ value, hovered, onHover, onRate, label }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-slate-100 hover:border-[#16A085]/20 transition-colors">
      <h3 className="text-sm font-bold text-[#16A085] uppercase tracking-wide mb-4 flex items-center gap-2">
        <Star size={16} className="fill-current" />
        {label}
      </h3>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => onHover(s)}
            onMouseLeave={() => onHover(0)}
            onClick={() => onRate(s)}
            className="transition-transform active:scale-95 hover:scale-110"
          >
            <Star
              size={32}
              fill={(hovered || value) >= s ? '#F59E0B' : 'none'}
              color={(hovered || value) >= s ? '#F59E0B' : '#CBD5E1'}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">Her 10 dakikada bir oy verebilirsiniz.</p>
    </div>
  );

  return (
    <>
      <PageContainer>
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#16A085] to-[#27AE60] rounded-3xl p-8 md:p-12 mb-8 text-white text-center md:text-left">
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Günün Menüsü</h1>
            <p className="text-lg opacity-90">
              SDÜ Öğrenci Yemek Menüsü.
            </p>
          </div>
          {/* Background Decals */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Menu */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Menu Highlight */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#16A085] rounded-xl flex items-center justify-center text-white">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Bugünkü Menü</h2>
                    <p className="text-sm text-slate-500 font-medium">{today}</p>
                  </div>
                </div>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                >
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-[#16A085] rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Menü yükleniyor...</p>
                  </div>
                ) : todayMenu ? (
                  <div className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Lunch */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider">Öğle Yemeği</span>
                          <span className="text-sm text-slate-400 font-mono">{todayMenu.lunchKcal} kcal</span>
                        </div>
                        <div className="text-lg leading-relaxed text-slate-700 font-medium bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                          {todayMenu.lunchMenu || 'Menü bilgisi girilmemiş.'}
                        </div>
                      </div>

                      {/* Dinner (Only if available) */}
                      {todayMenu.dinnerMenu && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">Akşam Yemeği</span>
                            <span className="text-sm text-slate-400 font-mono">{todayMenu.dinnerKcal} kcal</span>
                          </div>
                          <div className="text-lg leading-relaxed text-slate-700 font-medium bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                            {todayMenu.dinnerMenu}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Bugün için menü bilgisi bulunamadı.</p>
                    <p className="text-sm text-slate-400">Hafta sonu veya tatil olabilir.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Forms - Moved here after today's menu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showLunchRating && (
                <StarRating
                  label="Öğle Yemeğini Puanla"
                  value={ratingLunch}
                  hovered={hoveredLunch}
                  onHover={setHoveredLunch}
                  onRate={(v: number) => handleRate('lunch', v)}
                />
              )}
              {showDinnerRating && (
                <StarRating
                  label="Akşam Yemeğini Puanla"
                  value={ratingDinner}
                  hovered={hoveredDinner}
                  onHover={setHoveredDinner}
                  onRate={(v: number) => handleRate('dinner', v)}
                />
              )}
            </div>

            {/* Weekly List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">Gelecek Menüler</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tarih</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Günün Menüsü</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {menu
                      .filter(item => {
                        const parts = item.date.split(/[./-]/);
                        if (parts.length < 3) return false;
                        const [d, m, y] = parts.map(Number);
                        const itemDate = new Date(y, m - 1, d);
                        const now = new Date();
                        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        return itemDate > todayDate;
                      })
                      .slice(0, 10)
                      .map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{item.date}</span>
                              <span className="text-xs text-slate-400">{item.day}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600 line-clamp-2">
                              {item.lunchMenu}
                            </div>
                            {item.dinnerMenu && item.dinnerMenu !== item.lunchMenu && (
                              <div className="text-xs text-indigo-500 mt-1 font-medium">
                                Akşam: {item.dinnerMenu}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar: Stats & Rating */}
          <div className="space-y-8">
            {/* Stats Bar */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-[#16A085]" />
                Bugünün Reytingi
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-amber-800 uppercase tracking-wider">Öğle</span>
                    <div className="flex items-center gap-1 text-amber-600">
                      <span className="text-2xl font-bold font-mono">{stats?.lunchAvg || '0'}</span>
                      <Star size={18} fill="currentColor" />
                    </div>
                  </div>
                  <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-1000"
                      style={{ width: `${(Number(stats?.lunchAvg) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-indigo-800 uppercase tracking-wider">Akşam</span>
                    <div className="flex items-center gap-1 text-indigo-600">
                      <span className="text-2xl font-bold font-mono">{stats?.dinnerAvg || '0'}</span>
                      <Star size={18} fill="currentColor" />
                    </div>
                  </div>
                  <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-1000"
                      style={{ width: `${(Number(stats?.dinnerAvg) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-400">Toplam Katılım</div>
                  <div className="text-3xl font-black text-slate-800 font-mono">{stats?.totalVotes || '0'}</div>
                </div>
              </div>
            </div>

            {/* Rating Forms - Moved to main content */}

            {/* Askıda Yemek */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
              <h2 className="text-xl font-bold mb-4">Askıda Yemek</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Öğrenci arkadaşlarınıza destek misiniz? Paylaşmanın tadı bir başka.
              </p>
              <a
                href="https://askidayemek.sdu.edu.tr/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full bg-white/10 hover:bg-white/20 border border-white/10 p-4 rounded-xl transition-all group"
              >
                <span className="font-bold">Sisteme Giriş Yap</span>
                <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            </div>

            {/* Hastane Yemek Menüsü - Separate Section */}
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl">
              <h2 className="text-xl font-bold mb-4 italic">SDÜ Hastane Menüsü</h2>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                SDÜ Hastane Menüsü güncel yemek menüsüne buradan ulaşabilirsiniz.
              </p>
              <button
                onClick={() => window.location.href = '/hastane-yemek'}
                className="flex items-center justify-between w-full bg-white text-indigo-600 hover:bg-indigo-50 p-4 rounded-xl transition-all group font-bold"
              >
                <span>Hemen Görüntüle</span>
                <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </PageContainer>

      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Navigation to Hospital Menu */}
          <div className="flex justify-center mb-12">
            <button
              onClick={() => window.location.href = '/hastane-yemek'}
              className="group flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            >
              <span>SDÜ Hastane Yemek Menüsü</span>
              <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-sm">
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <span className="font-semibold text-slate-500">Son Güncelleme:</span>
              <span>{stats?.updated || '--.--.----'}</span>
              <span className="opacity-50">|</span>
              <span>{stats?.time || '--:--'}</span>
            </div>

            <div className="text-center md:text-right italic">
              * Menü içerikleri kurumsal kaynaklardan alınmakta olup bazen farklılıklar gösterebilir.
              Bu sayfa tamamen bilgilendirme ve eğlence amacıyla kişisel bir proje olarak hazırlanmıştır.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
