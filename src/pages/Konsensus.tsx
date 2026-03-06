import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { pushService } from '../services/pushService';
import {
  Calendar,
  Clock,
  Plus,
  Save,
  ChevronDown,
  BookOpen,
  Loader2,
  GraduationCap,
  Microscope,
  FileText,
  Users
} from 'lucide-react';
import { RelatedPages } from '../components/RelatedPages';

import { Meeting, MeetingFormData, IST_TZ, ORGANIZER_OPTIONS } from '../components/Konsensus/types';
import {
  getOrganizerWithEmoji,
  normalizeId,
  dateKeyInTz,
  parseYMD,
  shareWhatsApp,
  getMeetingStatus
} from '../components/Konsensus/utils';


import { MeetingCard } from '../components/Konsensus/MeetingCard';
import { MonthlyCalendar } from '../components/Konsensus/MonthlyCalendar';
import { AdminPanel } from '../components/Konsensus/AdminPanel';
import { NotificationsCard } from '../components/Konsensus/NotificationsCard';
import { PosterLightbox } from '../components/Konsensus/PosterLightbox';
import { Toast, ToastType } from '../components/Konsensus/Toast';

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">{icon}</div>
      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">{title}</h2>
    </div>
  );
}

export function Konsensus() {
  const [now, setNow] = useState<Date>(new Date());
  const nowKey = useMemo(() => dateKeyInTz(now, IST_TZ), [now]);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [pushEnabled, setPushEnabled] = useState(!!pushService.getSavedEndpoint());
  const [pushLoading, setPushLoading] = useState(false);

  const [selectedOrganizer, setSelectedOrganizer] = useState<string | null>(null);
  const [activePoster, setActivePoster] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [formData, setFormData] = useState<MeetingFormData & { id?: string | number }>({
    title: '',
    organizer: '',
    customOrganizer: '',
    date: nowKey,
    time: '20:00',
    duration: 60,
    description: '',
    zoomLink: '',
    zoomId: '',
    zoomPassword: '',
    posterUrl: '',
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const getFormOrganizer = useCallback(() => {
    return formData.organizer === 'Diğer' ? formData.customOrganizer.trim() : formData.organizer.trim();
  }, [formData.organizer, formData.customOrganizer]);

  const isFormValid = useCallback(() => !!(formData.title && formData.date && formData.time), [formData.title, formData.date, formData.time]);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!alive) return;
      setIsAdmin(!!session);
      setAuthLoading(false);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return;
      setIsAdmin(!!session);
      setAuthLoading(false);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('meetings').select('*').order('date', { ascending: true }).order('time', { ascending: true });
    if (!error) setMeetings((data as Meeting[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    const validate = async () => {
      try {
        const valid = await pushService.validateAndRenewSubscription();
        if (!valid && pushEnabled) setPushEnabled(false);
      } catch { /* ignore */ }
    };
    validate();
    const interval = setInterval(validate, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pushEnabled]);

  const togglePush = useCallback(async () => {
    if (pushLoading) return;
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await pushService.unsubscribe();
        setPushEnabled(false);
        showToast('Bildirimler kapatıldı', 'info');
      } else {
        await pushService.subscribe(['global']);
        setPushEnabled(true);
        showToast('Bildirimler başarıyla açıldı');
      }
    } catch (err) {
      showToast((err as Error)?.message || 'Bildirim ayarı değiştirilemedi', 'error');
    } finally {
      setPushLoading(false);
    }
  }, [pushEnabled, pushLoading]);

  const filteredMeetings = useMemo(() => {
    if (!selectedOrganizer) return meetings;
    return meetings.filter((m) => (m.organizer || '') === selectedOrganizer);
  }, [meetings, selectedOrganizer]);

  const { todayMeetings, tomorrowMeetings, futureMeetings, pastMeetings } = useMemo(() => {
    const { y, m, d } = parseYMD(nowKey);
    const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const tomorrowKey = dateKeyInTz(new Date(base.getTime() + 24 * 60 * 60 * 1000), IST_TZ);

    const t: Meeting[] = [];
    const to: Meeting[] = [];
    const fu: Meeting[] = [];
    const pa: Meeting[] = [];

    for (const m of filteredMeetings) {
      if (!m.date) continue;
      if (m.date < nowKey) pa.push(m);
      else if (m.date === nowKey) t.push(m);
      else if (m.date === tomorrowKey) to.push(m);
      else fu.push(m);
    }

    // Sort today's meetings: Live > Upcoming > Past
    t.sort((a, b) => {
      const statusA = getMeetingStatus(a, now);
      const statusB = getMeetingStatus(b, now);

      const score = (s: any) => {
        if (s.isLive) return 0;
        if (s.isUpcoming) return 1;
        return 2;
      };

      const scoreA = score(statusA);
      const scoreB = score(statusB);

      if (scoreA !== scoreB) return scoreA - scoreB;
      return (a.time || '').localeCompare(b.time || '');
    });

    return { todayMeetings: t, tomorrowMeetings: to, futureMeetings: fu, pastMeetings: pa.reverse() };
  }, [filteredMeetings, nowKey, now]);


  const groupStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const m of meetings) {
      const org = (m.organizer || '').trim();
      if (!org) continue;
      stats[org] = (stats[org] || 0) + 1;
    }
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [meetings]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Giriş başarılı');
      return true;
    } catch (error) {
      showToast('Giriş başarısız', 'error');
      return false;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    showToast('Çıkış yapıldı', 'info');
  }, []);

  const handleSave = useCallback(async () => {
    if (!isFormValid() || actionLoading) return;
    setActionLoading(true);

    try {
      const organizer = getFormOrganizer();
      const payload = {
        title: formData.title,
        organizer: organizer || null,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        description: formData.description || null,
        zoom_link: formData.zoomLink || null,
        zoom_id: formData.zoomId || null,
        zoom_password: formData.zoomPassword || null,
        poster_url: formData.posterUrl || null,
      };

      if (formData.id) {
        const { error } = await supabase.from('meetings').update(payload).eq('id', formData.id);
        if (error) throw error;
        showToast('Toplantı güncellendi');
      } else {
        const { error } = await supabase.from('meetings').insert(payload);
        if (error) throw error;
        showToast('Yeni toplantı eklendi');
      }

      setFormData({
        title: '',
        organizer: '',
        customOrganizer: '',
        date: nowKey,
        time: '20:00',
        duration: 60,
        description: '',
        zoomLink: '',
        zoomId: '',
        zoomPassword: '',
        posterUrl: '',
      });

      await fetchMeetings();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showToast('İşlem başarısız', 'error');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  }, [fetchMeetings, formData, getFormOrganizer, isFormValid, nowKey, actionLoading]);

  const handleDelete = useCallback(async (id: string | number) => {
    if (!confirm('Bu toplantıyı silmek istediğinize emin misiniz?') || actionLoading) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
      showToast('Toplantı silindi', 'info');
      await fetchMeetings();
    } catch (error) {
      showToast('Silme işlemi başarısız', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [fetchMeetings, actionLoading]);

  const handleEdit = useCallback((m: Meeting) => {
    const isKnownOrganizer = ORGANIZER_OPTIONS.includes((m.organizer || '') as any);
    setFormData({
      id: m.id,
      title: m.title || '',
      organizer: isKnownOrganizer ? (m.organizer || '') : 'Diğer',
      customOrganizer: isKnownOrganizer ? '' : (m.organizer || ''),
      date: m.date || nowKey,
      time: m.time || '20:00',
      duration: m.duration ?? 60,
      description: m.description ?? '',
      zoomLink: m.zoom_link ?? '',
      zoomId: m.zoom_id ?? '',
      zoomPassword: m.zoom_password ?? '',
      posterUrl: m.poster_url ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Düzenleme modu aktif', 'info');
  }, [nowKey]);

  const handleDayClick = useCallback((dateKey: string) => {
    // Find the first meeting on this day
    const m = meetings.find(meeting => meeting.date === dateKey);
    if (!m) return;

    if (dateKey < nowKey) {
      if (!showPast) setShowPast(true);
      // Give state a moment to update
      setTimeout(() => {
        const el = document.getElementById(`meeting-${normalizeId(m.id)}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      const el = document.getElementById(`meeting-${normalizeId(m.id)}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [meetings, nowKey, showPast]);

  return (
    <div className="min-h-screen bg-gray-50">
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
        <h2>Patoloji Konsensus Toplantı Takibi</h2>
        <p>
          Tıbbi patoloji topluluklarının düzenlediği bilimsel toplantıları, vaka tartışmalarını ve konsensus oturumlarını takip edin. Toplantı tarihleri, Zoom linkleri ve arşivlenmiş oturum detaylarına erişin.
        </p>
      </div>
      {activePoster && <PosterLightbox url={activePoster} onClose={() => setActivePoster(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 sm:p-10 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Patoloji Konsensus Toplantı Takibi
            </h1>
            <p className="mt-3 text-white/90 text-sm sm:text-base font-semibold">
              Telegram kanalımız üzerinden{' '}
              <a href="https://t.me/konsensustakip" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 font-black hover:text-white">
                (tıklayın)
              </a>{' '}
              bildirim alın. Toplantılardan 15 dakika önce bildirim gönderilir.
            </p>

            <div className="mt-6 lg:hidden text-left">
              <NotificationsCard pushEnabled={pushEnabled} pushLoading={pushLoading} togglePush={togglePush} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            {selectedOrganizer && (
              <div className="bg-white border border-blue-100 rounded-3xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    Filtre: <span className="font-black text-gray-900">{getOrganizerWithEmoji(selectedOrganizer)}</span>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrganizer(null)}
                  className="text-sm font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-2xl transition"
                >
                  Filtreyi Temizle
                </button>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
              <SectionTitle title="Bugün" icon={<Clock className="w-6 h-6" />} />
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500 font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin" /> Toplantı Listesi Hazırlanıyor…
                </div>
              ) : todayMeetings.length === 0 ? (
                <div className="text-gray-400 font-semibold">Bugün için toplantı yok.</div>
              ) : (
                <div className="space-y-4">
                  {todayMeetings.map((m) => (
                    <div key={normalizeId(m.id)} id={`meeting-${normalizeId(m.id)}`}>
                      <MeetingCard
                        meeting={m}
                        nowKey={nowKey}
                        isAdmin={isAdmin}
                        isPast={false}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPosterClick={setActivePoster}
                        onOrganizerClick={(org) => {
                          setSelectedOrganizer(org);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
              <SectionTitle title="Yarın" icon={<Calendar className="w-6 h-6" />} />
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500 font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin" /> Toplantı Listesi Hazırlanıyor…
                </div>
              ) : tomorrowMeetings.length === 0 ? (
                <div className="text-gray-400 font-semibold">Yarın için toplantı yok.</div>
              ) : (
                <div className="space-y-4">
                  {tomorrowMeetings.map((m) => (
                    <div key={normalizeId(m.id)} id={`meeting-${normalizeId(m.id)}`}>
                      <MeetingCard
                        meeting={m}
                        nowKey={nowKey}
                        isAdmin={isAdmin}
                        isPast={false}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPosterClick={setActivePoster}
                        onOrganizerClick={(org) => {
                          setSelectedOrganizer(org);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
              <SectionTitle title="Gelecek Toplantılar" icon={<Calendar className="w-6 h-6" />} />
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500 font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin" /> Toplantı Listesi Hazırlanıyor…
                </div>
              ) : futureMeetings.length === 0 ? (
                <div className="text-gray-400 font-semibold">Planlanmış toplantı yok.</div>
              ) : (
                <div className="space-y-4">
                  {futureMeetings.map((m) => (
                    <div key={normalizeId(m.id)} id={`meeting-${normalizeId(m.id)}`}>
                      <MeetingCard
                        meeting={m}
                        nowKey={nowKey}
                        isAdmin={isAdmin}
                        isPast={false}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPosterClick={setActivePoster}
                        onOrganizerClick={(org) => {
                          setSelectedOrganizer(org);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
              <button onClick={() => setShowPast((v) => !v)} className="w-full flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-gray-100 text-gray-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Arşiv ({pastMeetings.length})</h2>
                </div>
                <div className={`p-2 rounded-xl bg-gray-100 transition-transform ${showPast ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                </div>
              </button>

              {showPast && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                  {pastMeetings.length === 0 ? (
                    <div className="text-gray-400 font-semibold">Arşiv boş.</div>
                  ) : (
                    <>
                      {(showAllPast ? pastMeetings : pastMeetings.slice(0, 5)).map((m) => (
                        <div key={normalizeId(m.id)} id={`meeting-${normalizeId(m.id)}`}>
                          <MeetingCard
                            meeting={m}
                            nowKey={nowKey}
                            isAdmin={isAdmin}
                            isPast={true}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onPosterClick={setActivePoster}
                            onOrganizerClick={(org) => {
                              setSelectedOrganizer(org);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          />
                        </div>
                      ))}
                      {pastMeetings.length > 5 && (
                        <div className="pt-2 flex flex-col items-center">
                          <button
                            onClick={() => setShowAllPast((v) => !v)}
                            className="text-sm font-black text-gray-700 hover:text-blue-700 bg-gray-100 hover:bg-blue-50 px-6 py-2 rounded-full transition"
                          >
                            {showAllPast ? 'Daha Az Göster' : 'Tüm Arşivi Göster'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-8">
            <div className="hidden lg:block">
              <NotificationsCard pushEnabled={pushEnabled} pushLoading={pushLoading} togglePush={togglePush} />
            </div>

            <MonthlyCalendar meetings={meetings} onDayClick={handleDayClick} />

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">🏆</span> En Aktif Gruplar
              </h2>
              <div className="space-y-3">
                {groupStats.map((s, idx) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setSelectedOrganizer(s.name);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition ${selectedOrganizer === s.name ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 hover:bg-blue-50'
                      }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className={`w-7 h-7 rounded-full grid place-items-center text-xs font-black shrink-0 ${selectedOrganizer === s.name ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-black truncate">{getOrganizerWithEmoji(s.name)}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${selectedOrganizer === s.name ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <AdminPanel isAdmin={isAdmin} onLogin={handleLogin} onLogout={handleLogout} />

            {isAdmin && !authLoading && (
              <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-700" />
                    {formData.id ? 'Toplantı Düzenle' : 'Toplantı Oluştur'}
                  </h3>
                  <button
                    onClick={() =>
                      setFormData({
                        title: '',
                        organizer: '',
                        customOrganizer: '',
                        date: nowKey,
                        time: '20:00',
                        duration: 60,
                        description: '',
                        zoomLink: '',
                        zoomId: '',
                        zoomPassword: '',
                        posterUrl: '',
                      })
                    }
                    className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 font-black hover:bg-gray-200 transition text-sm"
                  >
                    Temizle
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700">Düzenleyici</label>
                    <select
                      value={formData.organizer}
                      onChange={(e) => setFormData((p) => ({ ...p, organizer: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                    >
                      <option value="">Seçiniz</option>
                      {ORGANIZER_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {getOrganizerWithEmoji(o)}
                        </option>
                      ))}
                    </select>
                    {formData.organizer === 'Diğer' && (
                      <input
                        value={formData.customOrganizer}
                        onChange={(e) => setFormData((p) => ({ ...p, customOrganizer: e.target.value }))}
                        placeholder="Özel düzenleyici"
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700">Başlık *</label>
                    <input
                      value={formData.title}
                      onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Toplantı başlığı"
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-black text-gray-500 block mb-1">Tarih *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-500 block mb-1">Saat *</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-500 block mb-1">Süre</label>
                      <div className="flex gap-2">
                        <select
                          value={[30, 45, 60, 90, 120, 180].includes(formData.duration) ? formData.duration : 'custom'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              setFormData((p) => ({ ...p, duration: 0 }));
                            } else {
                              setFormData((p) => ({ ...p, duration: parseInt(val, 10) }));
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-semibold"
                        >
                          {[30, 45, 60, 90, 120, 180].map(d => <option key={d} value={d}>{d} dk</option>)}
                          <option value="custom">Diğer</option>
                        </select>
                        {![30, 45, 60, 90, 120, 180].includes(formData.duration) && (
                          <input
                            type="number"
                            value={formData.duration === 0 ? '' : formData.duration}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                              setFormData((p) => ({ ...p, duration: val }));
                            }}
                            className="w-20 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-semibold text-center"
                            placeholder="dk"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700">Açıklama</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-base resize-none shadow-sm"
                      placeholder="Toplantı hakkında detaylı bilgi..."
                    />
                  </div>

                  <div className="p-4 rounded-3xl bg-blue-50/60 border border-blue-100 space-y-3">
                    <div className="text-xs font-black tracking-widest text-blue-800 uppercase">Zoom Detayları</div>
                    <input
                      value={formData.zoomLink}
                      onChange={(e) => setFormData((p) => ({ ...p, zoomLink: e.target.value }))}
                      placeholder="Zoom Link"
                      className="w-full px-4 py-2 rounded-xl bg-white border border-blue-100 font-semibold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={formData.zoomId}
                        onChange={(e) => setFormData((p) => ({ ...p, zoomId: e.target.value }))}
                        placeholder="ID"
                        className="w-full px-4 py-2 rounded-xl bg-white border border-blue-100 font-semibold"
                      />
                      <input
                        value={formData.zoomPassword}
                        onChange={(e) => setFormData((p) => ({ ...p, zoomPassword: e.target.value }))}
                        placeholder="Şifre"
                        className="w-full px-4 py-2 rounded-xl bg-white border border-blue-100 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-gray-700">Afiş URL</label>
                    <input
                      value={formData.posterUrl}
                      onChange={(e) => setFormData((p) => ({ ...p, posterUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                    {formData.posterUrl && (
                      <div className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 p-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Afiş Önizleme</p>
                        <img
                          src={formData.posterUrl}
                          alt="Önizleme"
                          className="w-full h-32 object-cover rounded-xl"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={!isFormValid() || actionLoading}
                    className="w-full py-4 rounded-2xl font-black bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {formData.id ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RelatedPages
        pages={[
          {
            title: "Dünya Saatleri",
            subtitle: "Zaman dilimi ve toplantı planlayıcı",
            page: "dunya-saatleri",
            color: "bg-slate-800",
            icon: Users
          },
          {
            title: "Portfolyo",
            subtitle: "Akademik özgeçmiş ve çalışma alanları",
            page: "portfolyo",
            color: "bg-purple-600",
            icon: GraduationCap
          },
          {
            title: "Makale Özetleri",
            subtitle: "Günlük PubMed makale özetleri",
            page: "makale",
            color: "bg-indigo-600",
            icon: FileText
          }
        ]}
      />
    </div>
  );
}

export default Konsensus;
