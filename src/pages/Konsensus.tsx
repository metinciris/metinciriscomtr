import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { pushService } from '../services/pushService';
import {
  Calendar,
  Clock,
  ChevronDown,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { RelatedPages } from '../components/RelatedPages';

import { Meeting, IST_TZ } from '../components/Konsensus/types';
import {
  getOrganizerWithEmoji,
  normalizeId,
  dateKeyInTz,
  parseYMD,
  getMeetingStatus,
  canShowZoomInfo,
  canShowPoster,
} from '../components/Konsensus/utils';

import { MeetingCard } from '../components/Konsensus/MeetingCard';
import { MonthlyCalendar } from '../components/Konsensus/MonthlyCalendar';
import { NotificationsCard } from '../components/Konsensus/NotificationsCard';
import { PosterLightbox } from '../components/Konsensus/PosterLightbox';
import { Toast, ToastType } from '../components/Konsensus/Toast';
import { WeeklyCalendarBanner } from '../components/Konsensus/WeeklyCalendarBanner';

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

  const [pushEnabled, setPushEnabled] = useState(!!pushService.getSavedEndpoint());
  const [pushLoading, setPushLoading] = useState(false);

  const [selectedOrganizer, setSelectedOrganizer] = useState<string | null>(null);
  const [activePoster, setActivePoster] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const isFetchingRef = useRef(false);

  const fetchMeetings = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_meetings');

      if (!rpcError && rpcData) {
        setMeetings(rpcData as Meeting[]);
      } else {
        // Fallback to table query with client-side masking until RPC migration is executed in Supabase SQL Editor
        const { data, error } = await supabase
          .from('meetings')
          .select('id, title, organizer, date, time, duration, description, poster_url, zoom_link, zoom_id, zoom_password')
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (!error && data) {
          const currentTime = new Date();
          const sanitized = (data as Meeting[]).map((m) => {
            const zoomVisible = canShowZoomInfo(m, currentTime);
            const posterVisible = canShowPoster(m, currentTime);
            const has_zoom_info = Boolean(
              (m.zoom_link && m.zoom_link.trim()) ||
              (m.zoom_id && m.zoom_id.trim()) ||
              (m.zoom_password && m.zoom_password.trim())
            );

            return {
              ...m,
              has_zoom_info,
              zoom_link: zoomVisible ? m.zoom_link : null,
              zoom_id: zoomVisible ? m.zoom_id : null,
              zoom_password: zoomVisible ? m.zoom_password : null,
              poster_url: posterVisible ? m.poster_url : null,
            };
          });
          setMeetings(sanitized);
        }
      }
    } catch (err) {
      console.error('Fetch public meetings error:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchMeetings();

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMeetings();
      }
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMeetings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  const handleDayClick = useCallback((dateKey: string) => {
    const m = meetings.find(meeting => meeting.date === dateKey);
    if (!m) return;

    if (dateKey < nowKey) {
      if (!showPast) setShowPast(true);
      setTimeout(() => {
        const el = document.getElementById(`meeting-${normalizeId(m.id)}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      const el = document.getElementById(`meeting-${normalizeId(m.id)}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [meetings, nowKey, showPast]);

  const dummyCallback = useCallback(() => {}, []);

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

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              bildirim alın. Toplantılardan önce bildirim gönderilir.
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

            <WeeklyCalendarBanner meetings={meetings} now={now} onDayClick={handleDayClick} />

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
                        isAdmin={false}
                        isPast={false}
                        onEdit={dummyCallback}
                        onDelete={dummyCallback}
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
                        isAdmin={false}
                        isPast={false}
                        onEdit={dummyCallback}
                        onDelete={dummyCallback}
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
                        isAdmin={false}
                        isPast={false}
                        onEdit={dummyCallback}
                        onDelete={dummyCallback}
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
                            isAdmin={false}
                            isPast={true}
                            onEdit={dummyCallback}
                            onDelete={dummyCallback}
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
          </div>
        </div>
      </div>

      <RelatedPages
        pages={[
          {
            title: "Dünya Saatleri",
            subtitle: "Zaman dilimi ve toplantı planlayıcı",
            page: "dunya-saatleri",
            color: "bg-blue-600"
          },
          {
            title: "Tıbbi Patoloji Uzmanlık Portfolyosu",
            subtitle: "Uzmanlık alanları ve akademik çalışmalar",
            page: "portfolyo",
            color: "bg-indigo-600"
          }
        ]}
      />
    </div>
  );
}
