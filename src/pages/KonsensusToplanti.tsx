import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Clock, ExternalLink, Image as ImageIcon, Loader2, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Meeting } from '../components/Konsensus/types';
import {
  buildGoogleCalendarUrl,
  canShowZoomInfo,
  formatDateTR,
  getOrganizerWithEmoji,
  toTimeRange,
} from '../components/Konsensus/utils';

export function KonsensusToplanti() {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const now = useMemo(() => new Date(), []);

  const meetingId = useMemo(() => {
    const match = window.location.pathname.match(/^\/konsensus\/toplanti\/([^/]+)\/?$/);
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  }, []);

  useEffect(() => {
    const fetchMeeting = async () => {
      if (!meetingId) {
        setError('Toplantı bulunamadı.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('get_public_meeting', { p_id: meetingId });
        if (rpcError) throw rpcError;

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          setError('Toplantı bulunamadı.');
        } else {
          setMeeting(row as Meeting);
        }
      } catch (err) {
        console.error('Fetch public meeting error:', err);
        setError('Toplantı bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 font-black">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          Toplantı bilgileri yükleniyor…
        </div>
      </div>
    );
  }

  if (!meeting || error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white border border-red-100 rounded-3xl p-8 shadow-sm text-center">
          <h1 className="text-2xl font-black text-gray-900">Toplantı bulunamadı</h1>
          <p className="mt-3 text-gray-600">{error || 'Bu toplantıya ait kayıt bulunamadı.'}</p>
          <a
            href="/konsensus"
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Konsensus sayfasına dön
          </a>
        </div>
      </div>
    );
  }

  const duration = Math.max(15, meeting.duration ?? 60);
  const zoomVisible = canShowZoomInfo(meeting, new Date());
  const hasZoomLink = !!meeting.zoom_link?.trim();
  const hasZoomId = !!meeting.zoom_id?.trim();
  const hasZoomPassword = !!meeting.zoom_password?.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <a
          href="/konsensus"
          className="inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Tüm toplantılar
        </a>

        <article className="mt-5 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10">
            {meeting.organizer && (
              <div className="inline-flex px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs sm:text-sm font-black">
                {getOrganizerWithEmoji(meeting.organizer)}
              </div>
            )}

            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-gray-900">
              {meeting.title}
            </h1>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-950 font-black">
                <Calendar className="w-5 h-5 text-blue-600" />
                {formatDateTR(meeting.date)}
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-950 font-black">
                <Clock className="w-5 h-5 text-indigo-600" />
                {toTimeRange(meeting.time, duration)} TSİ
              </div>
            </div>

            {meeting.description && (
              <div className="mt-7 p-5 rounded-2xl bg-yellow-50/70 border-l-4 border-blue-500 text-gray-800 whitespace-pre-wrap leading-relaxed">
                {meeting.description}
              </div>
            )}

            {meeting.poster_url && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3 text-sm font-black text-gray-700">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  Toplantı Afişi
                </div>
                <a href={meeting.poster_url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={meeting.poster_url}
                    alt={`${meeting.title} toplantı afişi`}
                    loading="lazy"
                    className="w-full max-h-[900px] object-contain rounded-2xl border border-gray-200 bg-gray-50"
                  />
                </a>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
              {(hasZoomLink || hasZoomId || hasZoomPassword) && zoomVisible ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
                  <div className="flex items-center gap-2 font-black text-emerald-900">
                    <Video className="w-5 h-5 text-emerald-600" />
                    Katılım bilgileri
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {hasZoomLink && (
                      <a
                        href={meeting.zoom_link!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition"
                      >
                        <Video className="w-4 h-4" />
                        Zoom'a Katıl
                      </a>
                    )}
                    {hasZoomId && (
                      <div className="px-4 py-3 rounded-2xl bg-white border border-emerald-100 text-sm font-semibold text-gray-700">
                        <span className="font-black text-gray-900">Zoom ID:</span> {meeting.zoom_id}
                      </div>
                    )}
                    {hasZoomPassword && (
                      <div className="px-4 py-3 rounded-2xl bg-white border border-emerald-100 text-sm font-semibold text-gray-700">
                        <span className="font-black text-gray-900">Şifre:</span> {meeting.zoom_password}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-600">
                  Güncel katılım bilgileri toplantı saatine yaklaşıldığında bu sayfada görünür.
                </div>
              )}

              <button
                onClick={() => window.open(buildGoogleCalendarUrl(meeting, now), '_blank')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-sm font-black transition border border-blue-100"
              >
                <ExternalLink className="w-4 h-4" />
                Takvime ekle
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
