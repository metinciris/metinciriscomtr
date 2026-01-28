
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { pushService } from '../services/pushService';
import {
  Calendar,
  Clock,
  Users,
  Video,
  Plus,
  Trash2,
  Edit,
  Download,
  ExternalLink,
  Bell,
  LogIn,
  LogOut,
  Save,
  MousePointer2,
  MessageCircle,
  ChevronDown,
  BookOpen,
  Image as ImageIcon,
  X,
} from 'lucide-react';

/**
 * Istanbul-time safe version:
 * - "Today / Tomorrow" grouping uses Europe/Istanbul date key (NOT UTC).
 * - Date display uses Europe/Istanbul.
 * - Google Calendar / ICS / WhatsApp times are generated from date+time strings without JS Date timezone pitfalls.
 */

type Meeting = {
  id: string | number;
  title: string;
  organizer?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration?: number | null; // minutes
  description?: string | null;
  zoom_link?: string | null;
  zoom_id?: string | null;
  zoom_password?: string | null;
  poster_url?: string | null;
  created_at?: string | null;
};

type MeetingFormData = {
  title: string;
  organizer: string;
  customOrganizer: string;
  date: string;
  time: string;
  duration: number;
  description: string;
  zoomLink: string;
  zoomId: string;
  zoomPassword: string;
  posterUrl: string;
};

const IST_TZ = 'Europe/Istanbul';

const ORGANIZER_EMOJIS: Record<string, string> = {
  'Baş Boyun Patolojisi-Vaka Tartışma Grubu': '🗣️',
  'Dermatopatoloji vaka tartışma grubu': '🧫',
  'Endokrin Vaka Tartışma Grubu': '🧪',
  'Hematopatoloji Vaka Tartışma Grubu': '🩸',
  'Jinekopatoloji vaka tartışma grubu': '🌸',
  'Karaciğer-Pankreas-Biliyer Patoloji Vaka Tartışma Grubu': '🧬',
  'Kemik-Yumuşak doku olgu tartışma': '🦴',
  'Meme Patolojisi Konsensus': '🎗️',
  'Nöropatoloji Vaka Tartışma Grubu': '🧠',
  'Sitopatoloji konsensus grubu': '🔬',
  'Toraks vaka tartışma grubu': '🫁',
  'Üropatoloji Konsensus Grubu': '💧',
  'Diğer': '📁',
};

const ORGANIZER_OPTIONS = [
  'Baş Boyun Patolojisi-Vaka Tartışma Grubu',
  'Dermatopatoloji vaka tartışma grubu',
  'Endokrin Vaka Tartışma Grubu',
  'Hematopatoloji Vaka Tartışma Grubu',
  'Jinekopatoloji vaka tartışma grubu',
  'Karaciğer-Pankreas-Biliyer Patoloji Vaka Tartışma Grubu',
  'Kemik-Yumuşak doku olgu tartışma',
  'Meme Patolojisi Konsensus',
  'Nöropatoloji Vaka Tartışma Grubu',
  'Sitopatoloji konsensus grubu',
  'Toraks vaka tartışma grubu',
  'Üropatoloji Konsensus Grubu',
  'Diğer',
];

function getOrganizerWithEmoji(organizer?: string | null): string {
  const name = organizer || '';
  if (!name) return '';
  const emoji = ORGANIZER_EMOJIS[name] || '';
  return emoji ? `${emoji} ${name}` : name;
}

function normalizeId(id: string | number) {
  return typeof id === 'string' ? id : String(id);
}

function parseYMD(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m, d };
}

function dateKeyInTz(d: Date, timeZone = IST_TZ) {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function formatDateTR(dateString: string): string {
  // Avoid Date("YYYY-MM-DD") timezone quirks by constructing UTC noon and formatting in Istanbul.
  const { y, m, d } = parseYMD(dateString);
  const safe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: IST_TZ,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(safe);
}

function addMinutesToDateTime(dateStr: string, timeStr: string, minutesToAdd: number) {
  const { y, m, d } = parseYMD(dateStr);
  const [hh, mm] = timeStr.split(':').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0)); // timezone-less math
  const next = new Date(base.getTime() + minutesToAdd * 60000);
  const yy = next.getUTCFullYear();
  const mo = String(next.getUTCMonth() + 1).padStart(2, '0');
  const da = String(next.getUTCDate()).padStart(2, '0');
  const h = String(next.getUTCHours()).padStart(2, '0');
  const mi = String(next.getUTCMinutes()).padStart(2, '0');
  return { date: `${yy}-${mo}-${da}`, time: `${h}:${mi}` };
}

function toTimeRange(time: string, durationMinutes: number): string {
  const end = addMinutesToDateTime('2000-01-01', time, durationMinutes).time; // same-day math
  return `${time} - ${end}`;
}

function toCompact(dateStr: string, timeStr: string) {
  const { y, m, d } = parseYMD(dateStr);
  const [hh, mm] = timeStr.split(':').map(Number);
  const yy = String(y).padStart(4, '0');
  const mo = String(m).padStart(2, '0');
  const da = String(d).padStart(2, '0');
  const h = String(hh).padStart(2, '0');
  const mi = String(mm).padStart(2, '0');
  return `${yy}${mo}${da}T${h}${mi}00`;
}

/* ----------------------------- Poster Lightbox ----------------------------- */

function PosterLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
        aria-label="Kapat"
      >
        <X className="w-8 h-8" />
      </button>
      <img
        src={url}
        alt="Toplantı Afişi"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">{icon}</div>
      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">{title}</h2>
    </div>
  );
}

/* --------------------------- Calendar / Share utils ------------------------- */

function buildGoogleCalendarUrl(m: Meeting) {
  const duration = Math.max(15, m.duration ?? 60);
  const start = toCompact(m.date, m.time || '20:00');
  const endParts = addMinutesToDateTime(m.date, m.time || '20:00', duration);
  const end = toCompact(endParts.date, endParts.time);

  let details = (m.description ?? '').trim();
  if (m.organizer) details = `Düzenleyen: ${m.organizer}\n\n${details}`;
  if (m.zoom_link) details += `\n\nZoom: ${m.zoom_link}`;
  if (m.zoom_id) details += `\nZoom ID: ${m.zoom_id}`;
  if (m.zoom_password) details += `\nŞifre: ${m.zoom_password}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: m.title,
    dates: `${start}/${end}`,
    details,
    ctz: IST_TZ,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcs(m: Meeting) {
  const duration = Math.max(15, m.duration ?? 60);
  const start = toCompact(m.date, m.time || '20:00');
  const endParts = addMinutesToDateTime(m.date, m.time || '20:00', duration);
  const end = toCompact(endParts.date, endParts.time);

  let description = (m.description ?? '').replace(/\n/g, '\\n');
  if (m.organizer) description = `Düzenleyen: ${m.organizer}\\n\\n${description}`;
  if (m.zoom_link) description += `\\n\\nZoom: ${m.zoom_link}`;
  if (m.zoom_id) description += `\\nZoom ID: ${m.zoom_id}`;
  if (m.zoom_password) description += `\\nŞifre: ${m.zoom_password}`;

  const location = m.zoom_link ? `LOCATION:${m.zoom_link}` : '';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Konsensus Takip//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${normalizeId(m.id)}@konsensus-takip`,
    `DTSTART;TZID=${IST_TZ}:${start}`,
    `DTEND;TZID=${IST_TZ}:${end}`,
    `SUMMARY:${m.title}`,
    location,
    `DESCRIPTION:${description}`,
    `DTSTAMP:${toCompact(dateKeyInTz(new Date(), 'UTC'), '00:00')}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

function downloadIcs(m: Meeting) {
  const ics = buildIcs(m);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;

  const base = `${m.organizer ? m.organizer + ' - ' : ''}${m.title || 'konsensus-toplanti'}`;
  const filename = base.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
  a.download = `${filename}.ics`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function shareWhatsApp(m: Meeting) {
  const duration = Math.max(15, m.duration ?? 60);
  const endParts = addMinutesToDateTime(m.date, m.time || '20:00', duration);

  const organizer = m.organizer || 'Patoloji Toplantısı';
  let msg = `🔬 *${organizer}* 🔬\n\n`;
  msg += `📋 *${m.title}*\n\n`;
  msg += `📆 *Tarih:* ${formatDateTR(m.date)}\n`;
  msg += `🕐 *Saat:* ${(m.time || '20:00')} - ${endParts.time} (Türkiye)\n`;
  if (m.description) msg += `\n📝 *Açıklama:* ${m.description}\n`;
  if (m.zoom_id || m.zoom_password || m.zoom_link) {
    msg += `\n🔗 *Zoom Bilgileri:*\n`;
    if (m.zoom_link) msg += `• Bağlantı: ${m.zoom_link}\n`;
    if (m.zoom_id) msg += `• ID: ${m.zoom_id}\n`;
    if (m.zoom_password) msg += `• Şifre: ${m.zoom_password}\n`;
  }
  msg += `\n📅 *Google Takvim'e Ekle:*\n${buildGoogleCalendarUrl(m)}`;

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(shareUrl, '_blank');
}

/* ------------------------------- Notifications ------------------------------ */

function NotificationsCard({
  pushEnabled,
  pushLoading,
  togglePush,
}: {
  pushEnabled: boolean;
  pushLoading: boolean;
  togglePush: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-7 border border-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <div className="text-lg font-black text-gray-900">Bildirimler</div>
            <span className={`w-2.5 h-2.5 rounded-full ${pushEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-sm font-semibold text-gray-600">{pushEnabled ? 'Açık' : 'Kapalı'}</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">Toplantılardan 15 dk önce hatırlatma gönderilir.</div>
        </div>

        <button
          onClick={togglePush}
          disabled={pushLoading}
          className={`hidden md:inline-flex items-center justify-center px-4 py-2 rounded-2xl font-black transition ${
            pushEnabled ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
          }`}
        >
          {pushLoading ? 'İşlem…' : pushEnabled ? 'Kapat' : 'Etkinleştir'}
        </button>
      </div>

      <button
        onClick={togglePush}
        disabled={pushLoading}
        className={`md:hidden mt-4 w-full py-3 rounded-2xl font-black transition ${
          pushEnabled ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
        }`}
      >
        {pushLoading ? 'İşlem…' : pushEnabled ? 'Bildirimleri kapat' : 'Bildirimleri etkinleştir'}
      </button>
    </div>
  );
}

/* ------------------------------- Meeting Card ------------------------------ */

function MeetingCard({
  meeting,
  nowKey,
  isAdmin,
  isPast,
  onEdit,
  onDelete,
  onPosterClick,
  onOrganizerClick,
}: {
  meeting: Meeting;
  nowKey: string;
  isAdmin: boolean;
  isPast: boolean;
  onEdit: (m: Meeting) => void;
  onDelete: (id: string | number) => void;
  onPosterClick: (url: string) => void;
  onOrganizerClick: (org: string) => void;
}) {
  const hasPoster = !!meeting.poster_url;
  const duration = Math.max(15, meeting.duration ?? 60);

  const hasIdPw = !!(meeting.zoom_id || meeting.zoom_password);
  const showJoin = !!meeting.zoom_link && !hasIdPw && !isPast;
  const showIdPw = !isPast && hasIdPw;

  const isToday = meeting.date === nowKey;
  const posterButtonOnly = isPast && hasPoster;

  return (
    <div
      className={`relative overflow-hidden border-2 rounded-2xl p-5 transition-all ${
        isPast
          ? 'bg-gray-50 border-gray-200'
          : isToday
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-300 shadow-lg'
            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {meeting.organizer && (
          <button
            onClick={() => onOrganizerClick(meeting.organizer || '')}
            className={`px-2.5 py-1 rounded-full text-xs font-black transition ${
              isPast ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            {getOrganizerWithEmoji(meeting.organizer)}
          </button>
        )}

        {isAdmin && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => onEdit(meeting)}
              className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              title="Düzenle"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(meeting.id)}
              className="p-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition"
              title="Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <div className={`${hasPoster && !isPast ? 'md:col-span-7' : 'md:col-span-12'} flex flex-col`}>
          <h3 className={`text-[20px] sm:text-[22px] md:text-[24px] font-black tracking-tight leading-snug ${isPast ? 'text-gray-700' : 'text-gray-900'}`}>
            {meeting.title}
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold border ${isPast ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
              <Calendar className="w-4 h-4 mr-2" />
              {formatDateTR(meeting.date)}
            </div>
            <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold border ${isPast ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
              <Clock className="w-4 h-4 mr-2" />
              {toTimeRange(meeting.time, duration)}
            </div>
          </div>

          {meeting.description && (
            <p className={`mt-4 text-[13px] sm:text-sm leading-relaxed ${isPast ? 'text-gray-500 italic' : 'text-gray-700'}`}>
              {meeting.description}
            </p>
          )}

          <div className="flex-1" />

          {posterButtonOnly && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={() => onPosterClick(meeting.poster_url!)}
                className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-800 text-sm font-black border border-indigo-100 hover:bg-indigo-100 transition"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Afişi Gör
              </button>
            </div>
          )}

          {!isPast && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              {showJoin && (
                <a
                  href={meeting.zoom_link!}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl transition shadow-md hover:shadow-blue-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Zoom&apos;a Katıl
                </a>
              )}

              {showIdPw && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {meeting.zoom_id && (
                    <div className="bg-gray-100 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700">
                      <span className="font-black text-gray-900">Zoom ID:</span> {meeting.zoom_id}
                    </div>
                  )}
                  {meeting.zoom_password && (
                    <div className="bg-gray-100 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700">
                      <span className="font-black text-gray-900">Şifre:</span> {meeting.zoom_password}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => window.open(buildGoogleCalendarUrl(meeting), '_blank')}
                  className="inline-flex items-center px-3 py-2 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-sm font-black transition border border-blue-100"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Takvime ekle
                </button>

                <button
                  onClick={() => downloadIcs(meeting)}
                  className="inline-flex items-center px-3 py-2 rounded-xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 text-sm font-black transition border border-indigo-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  iCal (.ics) indir
                </button>

                <button
                  onClick={() => shareWhatsApp(meeting)}
                  className="inline-flex items-center px-3 py-2 rounded-xl bg-green-50 text-green-800 hover:bg-green-100 text-sm font-black transition border border-green-100"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp paylaş
                </button>
              </div>
            </div>
          )}
        </div>

        {hasPoster && !isPast ? (
          <div className="md:col-span-5 flex h-full">
            <button
              onClick={() => onPosterClick(meeting.poster_url!)}
              className="w-full h-full rounded-3xl border-2 border-indigo-200 bg-white/70 hover:bg-white transition p-4 shadow-md hover:shadow-lg flex flex-col"
              title="Afişi büyüt"
            >
              <div className="w-full flex-1 rounded-2xl overflow-hidden border border-indigo-200 bg-white shadow-sm">
                <img src={meeting.poster_url!} alt="Toplantı afişi" className="w-full h-full object-cover" loading="lazy" />
              </div>

              <div className="mt-4 flex items-center justify-center">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-800 text-sm font-black rounded-xl border border-indigo-100">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Afişi Gör
                </div>
              </div>

              <div className="text-xs text-indigo-700 font-semibold mt-2 text-center opacity-80">Dokun / tıkla büyüt</div>
            </button>
          </div>
        ) : (
          <div className="hidden md:block md:col-span-5" />
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Admin Panel ------------------------------- */

function AdminPanel({
  isAdmin,
  onLogin,
  onLogout,
}: {
  isAdmin: boolean;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onLogout: () => Promise<void>;
}) {
  const [showLogin, setShowLogin] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [clickCount, setClickCount] = useState(0);
  const [verified, setVerified] = useState(false);

  const handleVerifyClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 3) setVerified(true);
  };

  const resetVerification = () => {
    setClickCount(0);
    setVerified(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) return;

    setLoading(true);
    setError('');
    const ok = await onLogin(credentials.email, credentials.password);
    if (!ok) setError('Geçersiz e-posta veya şifre');
    setLoading(false);
    if (ok) {
      setShowLogin(false);
      setCredentials({ email: '', password: '' });
      resetVerification();
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await onLogout();
    setLoading(false);
  };

  if (isAdmin) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-gray-900">Admin Paneli</h2>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 transition flex items-center font-black"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loading ? 'Çıkış…' : 'Çıkış Yap'}
          </button>
        </div>
        <p className="text-gray-600 mt-2 text-sm">Admin olarak giriş yaptınız. Toplantı ekleyip silebilirsiniz.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-900">Admin Paneli</h2>
        <button
          onClick={() => {
            setShowLogin(!showLogin);
            if (!showLogin) resetVerification();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition flex items-center font-black"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Giriş Yap
        </button>
      </div>

      {showLogin && (
        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black text-gray-700">Fare Doğrulaması</span>
              <span className="text-xs text-gray-500">{clickCount}/3 tık</span>
            </div>

            {verified ? (
              <div className="bg-green-100 text-green-800 py-3 px-4 rounded-xl flex items-center justify-center border-2 border-green-300">
                <span className="text-sm font-black">✅ Tamam</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleVerifyClick}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 py-3 px-4 rounded-xl transition flex items-center justify-center border-2 border-blue-300 font-black"
              >
                <MousePointer2 className="w-5 h-5 mr-2" />
                Buraya {3 - clickCount} kez daha tıklayın
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="E-posta"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!verified}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Şifre"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!verified}
              autoComplete="current-password"
            />
            {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={loading || !verified}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition font-black"
            >
              {loading ? 'Giriş…' : 'Giriş Yap'}
            </button>
          </form>

          {!verified && <p className="text-xs text-gray-500 text-center">Giriş yapmak için önce fare doğrulamasını tamamlayın</p>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Main Page -------------------------------- */

export function Konsensus() {
  const [now, setNow] = useState<Date>(new Date());
  const nowKey = useMemo(() => dateKeyInTz(now, IST_TZ), [now]);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [pushEnabled, setPushEnabled] = useState(!!pushService.getSavedEndpoint());
  const [pushLoading, setPushLoading] = useState(false);

  const [selectedOrganizer, setSelectedOrganizer] = useState<string | null>(null);
  const [activePoster, setActivePoster] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);

  const [formData, setFormData] = useState<MeetingFormData>({
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
      } catch {
        // ignore
      }
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
      } else {
        await pushService.subscribe(['global']);
        setPushEnabled(true);
      }
    } catch (err) {
      alert((err as Error)?.message || String(err));
    } finally {
      setPushLoading(false);
    }
  }, [pushEnabled, pushLoading]);

  const filteredMeetings = useMemo(() => {
    if (!selectedOrganizer) return meetings;
    return meetings.filter((m) => (m.organizer || '') === selectedOrganizer);
  }, [meetings, selectedOrganizer]);

  const { todayMeetings, tomorrowMeetings, futureMeetings, pastMeetings } = useMemo(() => {
    // tomorrow based on Istanbul key as well
    const { y, m, d } = parseYMD(nowKey);
    const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const tomorrow = new Date(base.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowKey = dateKeyInTz(tomorrow, IST_TZ);

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

    return { todayMeetings: t, tomorrowMeetings: to, futureMeetings: fu, pastMeetings: pa.reverse() };
  }, [filteredMeetings, nowKey]);

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
      return !error;
    } catch {
      return false;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!isFormValid()) return;

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

    const editingId = (formData as any).id as string | number | undefined;
    if (editingId) {
      await supabase.from('meetings').update(payload).eq('id', editingId);
    } else {
      await supabase.from('meetings').insert(payload);
    }

    setFormData((prev) => ({
      ...prev,
      title: '',
      organizer: '',
      customOrganizer: '',
      time: '20:00',
      duration: 60,
      description: '',
      zoomLink: '',
      zoomId: '',
      zoomPassword: '',
      posterUrl: '',
      ...({ id: undefined } as any),
    }));

    await fetchMeetings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchMeetings, formData, getFormOrganizer, isFormValid, nowKey]);

  const handleDelete = useCallback(async (id: string | number) => {
    if (!confirm('Bu toplantıyı silmek istediğinize emin misiniz?')) return;
    await supabase.from('meetings').delete().eq('id', id);
    await fetchMeetings();
  }, [fetchMeetings]);

  const handleEdit = useCallback((m: Meeting) => {
    const isKnownOrganizer = ORGANIZER_OPTIONS.includes((m.organizer || '') as any);
    setFormData({
      ...({ id: m.id } as any),
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
  }, [nowKey]);

  return (
    <div className="min-h-screen bg-gray-50">
      {activePoster && <PosterLightbox url={activePoster} onClose={() => setActivePoster(null)} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 sm:p-10 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Patoloji Konsensus Toplantı Takibi
            </h1>
            <p className="mt-3 text-white/90 text-sm sm:text-base font-semibold">
              Telegram kanalımız üzerinden{' '}
              <a
                href="https://t.me/konsensustakip"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 font-black hover:text-white"
              >
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
                  <Users className="w-5 h-5 text-blue-700" />
                  <div className="text-sm sm:text-base font-semibold text-gray-700">
                    Filtre: <span className="font-black text-gray-900">{selectedOrganizer}</span>
                  </div>
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
                <div className="text-gray-500 font-semibold">Yükleniyor…</div>
              ) : todayMeetings.length === 0 ? (
                <div className="text-gray-400 font-semibold">Bugün için toplantı yok.</div>
              ) : (
                <div className="space-y-4">
                  {todayMeetings.map((m) => (
                    <MeetingCard
                      key={normalizeId(m.id)}
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
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
              <SectionTitle title="Yarın" icon={<Calendar className="w-6 h-6" />} />
              {loading ? (
                <div className="text-gray-500 font-semibold">Yükleniyor…</div>
              ) : tomorrowMeetings.length === 0 ? (
                <div className="text-gray-400 font-semibold">Yarın için toplantı yok.</div>
              ) : (
                <div className="space-y-4">
                  {tomorrowMeetings.map((m) => (
                    <MeetingCard
                      key={normalizeId(m.id)}
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
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
              <SectionTitle title="Gelecek Toplantılar" icon={<Calendar className="w-6 h-6" />} />
              {loading ? (
                <div className="text-gray-500 font-semibold">Yükleniyor…</div>
              ) : futureMeetings.length === 0 ? (
                <div className="text-gray-400 font-semibold">Planlanmış toplantı yok.</div>
              ) : (
                <div className="space-y-4">
                  {futureMeetings.map((m) => (
                    <MeetingCard
                      key={normalizeId(m.id)}
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
                  ))}
                </div>
              )}
            </div>

            <div className="lg:hidden bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-2xl bg-yellow-100 text-yellow-800">🏆</div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">En Aktif Gruplar</h2>
              </div>
              <div className="space-y-3">
                {groupStats.map((s, idx) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setSelectedOrganizer(s.name);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition ${
                      selectedOrganizer === s.name ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-blue-50'
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
                        <MeetingCard
                          key={normalizeId(m.id)}
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
                      ))}

                      {pastMeetings.length > 5 && (
                        <div className="pt-2 flex flex-col items-center">
                          <button
                            onClick={() => setShowAllPast((v) => !v)}
                            className="text-sm font-black text-gray-700 hover:text-blue-700 bg-gray-100 hover:bg-blue-50 px-6 py-2 rounded-full transition"
                          >
                            {showAllPast ? 'Daha Az Göster' : 'Tüm Arşivi Göster'}
                          </button>
                          {!showAllPast && <div className="text-xs text-gray-400 mt-2 font-semibold">Son 5 toplantı</div>}
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

            <div className="hidden lg:block bg-white rounded-3xl shadow-xl p-8 border border-gray-100 overflow-hidden relative">
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
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition ${
                      selectedOrganizer === s.name ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 hover:bg-blue-50'
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
              <p className="text-[11px] text-gray-400 mt-6 text-center italic font-semibold">Toplam toplantı sayılarına göre sıralanır.</p>
            </div>

            <AdminPanel isAdmin={isAdmin} onLogin={handleLogin} onLogout={handleLogout} />

            {isAdmin && !authLoading && (
              <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-700" />
                    Toplantı Oluştur / Düzenle
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
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
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
                    <div className="space-y-2">
                      <label className="text-sm font-black text-gray-700">Tarih *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-gray-700">Saat *</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-gray-700">Süre</label>
                      <select
                        value={formData.duration}
                        onChange={(e) => setFormData((p) => ({ ...p, duration: parseInt(e.target.value, 10) }))}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                      >
                        <option value={30}>30 dk</option>
                        <option value={60}>60 dk</option>
                        <option value={90}>90 dk</option>
                        <option value={120}>120 dk</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700">Açıklama</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold resize-none"
                    />
                  </div>

                  <div className="p-4 rounded-3xl bg-blue-50/60 border border-blue-100 space-y-3">
                    <div className="text-xs font-black tracking-widest text-blue-800 uppercase">Zoom</div>
                    <input
                      value={formData.zoomLink}
                      onChange={(e) => setFormData((p) => ({ ...p, zoomLink: e.target.value }))}
                      placeholder="Zoom link (opsiyonel)"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={formData.zoomId}
                        onChange={(e) => setFormData((p) => ({ ...p, zoomId: e.target.value }))}
                        placeholder="Zoom ID (opsiyonel)"
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                      />
                      <input
                        value={formData.zoomPassword}
                        onChange={(e) => setFormData((p) => ({ ...p, zoomPassword: e.target.value }))}
                        placeholder="Şifre (opsiyonel)"
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700">Afiş URL</label>
                    <input
                      value={formData.posterUrl}
                      onChange={(e) => setFormData((p) => ({ ...p, posterUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={!isFormValid()}
                    className="w-full py-3 rounded-2xl font-black bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Konsensus;
