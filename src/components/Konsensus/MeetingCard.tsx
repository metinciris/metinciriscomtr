import React, { useEffect, useState } from 'react';
import {
    Calendar,
    Clock,
    Edit,
    Trash2,
    Image as ImageIcon,
    Video,
    ExternalLink,
    Download,
    MessageCircle,
    Activity,
    Timer,
} from 'lucide-react';
import { Meeting, IST_TZ } from './types';
import {
    getOrganizerWithEmoji,
    formatDateTR,
    toTimeRange,
    buildGoogleCalendarUrl,
    downloadIcs,
    shareWhatsApp,
    getMeetingStatus,
    getCountdownString,
    parseYMD,
    MONTH_NAMES,
    dateKeyInTz,
    canShowZoomInfo,
    canShowPoster,
    getZoomVisibilityCountdown,
} from './utils';

interface MeetingCardProps {
    meeting: Meeting;
    nowKey: string;
    isAdmin: boolean;
    isPast: boolean; // This refers to meetings before today
    onEdit: (m: Meeting) => void;
    onDelete: (id: string | number) => void;
    onPosterClick: (url: string) => void;
    onOrganizerClick: (org: string) => void;
}

export function MeetingCard({
    meeting,
    nowKey,
    isAdmin,
    isPast: isArchived,
    onEdit,
    onDelete,
    onPosterClick,
    onOrganizerClick,
}: MeetingCardProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const { isLive, isUpcoming, isPastToday, meetingStart } = getMeetingStatus(meeting, now);

    // Total "past" state covers both archived and today's finished meetings
    const isActuallyPast = isArchived || isPastToday;

    const zoomVisible = isAdmin || canShowZoomInfo(meeting, now);
    const posterVisible = isAdmin || canShowPoster(meeting, now);

    const hasPoster = posterVisible && !!meeting.poster_url;
    const duration = Math.max(15, meeting.duration ?? 60);

    const hasZoomLink = !!(meeting.zoom_link && meeting.zoom_link.trim());
    const hasZoomId = !!(meeting.zoom_id && meeting.zoom_id.trim());
    const hasZoomPassword = !!(meeting.zoom_password && meeting.zoom_password.trim());
    const hasZoomInfo = Boolean(meeting.has_zoom_info || hasZoomLink || hasZoomId || hasZoomPassword);
    const showActionsSection = isAdmin || !isArchived;

    const posterButtonOnly = isActuallyPast && hasPoster;

    const tomorrowKey = React.useMemo(() => {
        const { y, m, d } = parseYMD(nowKey);
        const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        return dateKeyInTz(new Date(base.getTime() + 24 * 60 * 60 * 1000), IST_TZ);
    }, [nowKey]);

    const { dayStr, monthStr } = React.useMemo(() => {
        const { m, d } = parseYMD(meeting.date);
        const day = String(d).padStart(2, '0');
        const month = MONTH_NAMES[m - 1] ? MONTH_NAMES[m - 1].slice(0, 3).toUpperCase() : '';
        return { dayStr: day, monthStr: month };
    }, [meeting.date]);

    return (
        <div
            className={`relative overflow-hidden border-4 rounded-2xl p-5 transition-all ${isActuallyPast
                ? 'bg-gray-100/60 border-gray-200 opacity-70 shadow-none'
                : isLive
                    ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-600 shadow-xl ring-2 ring-green-600/20'
                    : isUpcoming
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-500 shadow-lg'
                        : 'bg-white border-gray-300 hover:border-blue-500 hover:shadow-lg'
                }`}
        >
            {isLive && (
                <div className="absolute top-0 right-0">
                    <div className="bg-green-600 text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg animate-pulse">
                        <Activity className="w-3 h-3" />
                        CANLI YAYINDA
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-4">
                {meeting.organizer && (
                    <button
                        onClick={() => onOrganizerClick(meeting.organizer || '')}
                        className={`px-2.5 py-1 rounded-full text-xs font-black transition ${isActuallyPast ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                    >
                        {getOrganizerWithEmoji(meeting.organizer)}
                    </button>
                )}

                {meeting.date === nowKey && (
                    <div className="flex items-center px-2.5 py-1 rounded-full bg-amber-400 text-amber-955 text-[10px] font-black tracking-wider uppercase shadow-sm border border-amber-500 animate-pulse">
                        BUGÜN
                    </div>
                )}

                {meeting.date === tomorrowKey && (
                    <div className="flex items-center px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black tracking-wider uppercase shadow-sm border border-emerald-600">
                        YARIN
                    </div>
                )}

                {isUpcoming && meetingStart && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black tracking-wider uppercase border border-orange-200 shadow-sm">
                        <Timer className="w-3 h-3" />
                        {getCountdownString(meetingStart, now)}
                    </div>
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

            <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Sol Taraf: Tarih Kartı */}
                <div className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center border text-center shadow-md ${
                    isActuallyPast
                        ? 'bg-gray-200 text-gray-400 border-gray-300'
                        : isLive
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-600 shadow-lg animate-pulse'
                            : meeting.date === nowKey
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-orange-500 shadow-md'
                                : meeting.date === tomorrowKey
                                    ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white border-emerald-500 shadow-md'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-indigo-600 shadow-md'
                }`}>
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black leading-none">{dayStr}</span>
                    <span className="text-[10px] sm:text-xs md:text-sm font-black tracking-widest uppercase mt-0.5 opacity-90">{monthStr}</span>
                </div>

                {/* Sağ Taraf: Detaylar ve Afiş Grid'i */}
                <div className="flex-1 min-w-0 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        <div className={`${hasPoster && !isActuallyPast ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col`}>
                            <h3 className={`text-[20px] sm:text-[22px] md:text-[24px] font-black tracking-tight leading-snug ${isActuallyPast ? 'text-gray-550' : 'text-gray-900'}`}>
                                {meeting.title}
                            </h3>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-black border ${
                                    isActuallyPast 
                                        ? 'bg-gray-100 border-gray-200 text-gray-500' 
                                        : 'bg-blue-50 border-blue-100 text-blue-900 shadow-sm'
                                }`}>
                                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                    {formatDateTR(meeting.date)}
                                </div>
                                <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-black border ${
                                    isActuallyPast 
                                        ? 'bg-gray-100 border-gray-200 text-gray-500' 
                                        : 'bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm'
                                }`}>
                                    <Clock className="w-4 h-4 mr-2 text-indigo-600" />
                                    <span>{toTimeRange(meeting.time, duration)}</span>
                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                                        isActuallyPast
                                            ? 'bg-gray-200 text-gray-500'
                                            : 'bg-indigo-200 text-indigo-800'
                                    }`}>
                                        TSİ
                                    </span>
                                </div>
                            </div>

                            {meeting.description && (
                                <div className={`mt-4 p-4 rounded-2xl border-l-[6px] ${isActuallyPast
                                    ? 'bg-gray-100/40 border-gray-300 text-gray-400 italic shadow-none'
                                    : 'bg-yellow-50/60 border-blue-500 text-gray-800 shadow-sm'
                                    }`}>
                                    <p className="text-[14px] sm:text-[15px] md:text-[16px] font-medium leading-relaxed whitespace-pre-wrap">
                                        {meeting.description}
                                    </p>
                                </div>
                            )}

                            <div className="flex-1" />

                            {isArchived && hasPoster && (
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

                            {showActionsSection && (
                                <div className="mt-5 pt-4 border-t border-gray-100 space-y-4">
                                    {!hasZoomInfo ? (
                                        <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-600">
                                            Güncel toplantı bilgilerini bu sayfadan takip edin.
                                        </div>
                                    ) : !zoomVisible ? (
                                        <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 space-y-1.5 shadow-sm">
                                            <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                                                <Video className="w-4 h-4 text-amber-600 shrink-0" />
                                                <span>Zoom bilgileri henüz gizli</span>
                                            </div>
                                            <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                                                Toplantı başlamadan 2 saat önce bağlantı, ID ve parola görünecek.
                                            </p>
                                            {getZoomVisibilityCountdown(meeting, now) && (
                                                <div className="pt-1 text-xs font-black text-amber-900 flex items-center gap-1.5">
                                                    <Timer className="w-3.5 h-3.5 text-amber-700" />
                                                    <span>{getZoomVisibilityCountdown(meeting, now)}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-1 shadow-sm">
                                                <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                                                    <Video className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>Zoom bağlantısı yayınlandı!</span>
                                                </div>
                                                {isUpcoming && meetingStart && (
                                                    <p className="text-xs font-semibold text-emerald-800">
                                                        Toplantıya {getCountdownString(meetingStart, now).replace('BAŞLIYOR (Son ', 'son ')}
                                                    </p>
                                                )}
                                                {isLive && (
                                                    <p className="text-xs font-bold text-emerald-800">
                                                        Toplantı şu anda canlı devam ediyor.
                                                    </p>
                                                )}
                                            </div>

                                            {hasZoomLink && (
                                                <a
                                                    href={meeting.zoom_link!}
                                                    className={`inline-flex items-center px-6 py-3 text-sm font-black rounded-xl transition shadow-md ${
                                                        isLive
                                                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                                    }`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Video className="w-4 h-4 mr-2" />
                                                    {isLive ? 'Canlı Yayına Katıl' : 'Zoom\'a Katıl'}
                                                </a>
                                            )}

                                            {(hasZoomId || hasZoomPassword) && (
                                                <div className="flex flex-wrap gap-2">
                                                    {hasZoomId && (
                                                        <div className="bg-gray-100 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700">
                                                            <span className="font-black text-gray-900">Zoom ID:</span> {meeting.zoom_id}
                                                        </div>
                                                    )}

                                                    {hasZoomPassword && (
                                                        <details className="bg-gray-100 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700" open={isAdmin}>
                                                            <summary className="cursor-pointer font-black text-blue-700">
                                                                Şifreyi Göster
                                                            </summary>
                                                            <div className="mt-1">
                                                                <span className="font-black text-gray-900">Şifre:</span> {meeting.zoom_password}
                                                            </div>
                                                        </details>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            onClick={() => window.open(buildGoogleCalendarUrl(meeting, now), '_blank')}
                                            className="inline-flex items-center px-3 py-2 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-sm font-black transition border border-blue-100"
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Takvime ekle
                                        </button>

                                        <button
                                            onClick={() => downloadIcs(meeting, now)}
                                            className="inline-flex items-center px-3 py-2 rounded-xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 text-sm font-black transition border border-indigo-100"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            iCal (.ics) indir
                                        </button>

                                        <button
                                            onClick={() => shareWhatsApp(meeting, now)}
                                            className="inline-flex items-center px-3 py-2 rounded-xl bg-green-50 text-green-800 hover:bg-green-100 text-sm font-black transition border border-green-100"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            WhatsApp paylaş
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {hasPoster && !isArchived ? (
                            <div className="lg:col-span-6 flex h-full">
                                <button
                                    onClick={() => onPosterClick(meeting.poster_url!)}
                                    className={`w-full h-full rounded-3xl border-2 bg-white/70 hover:bg-white transition p-4 shadow-md hover:shadow-lg flex flex-col ${isLive ? 'border-green-300' : 'border-indigo-200'}`}
                                    title="Afişi büyüt"
                                >
                                    <div className={`w-full flex-1 rounded-2xl overflow-hidden border bg-white shadow-sm ${isLive ? 'border-green-200' : 'border-indigo-200'}`}>
                                        <img src={meeting.poster_url!} alt="Toplantı afişi" className="w-full h-full object-contain" loading="lazy" />
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="hidden lg:block lg:col-span-6" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

