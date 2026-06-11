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
import { Meeting } from './types';
import {
    getOrganizerWithEmoji,
    formatDateTR,
    toTimeRange,
    buildGoogleCalendarUrl,
    downloadIcs,
    shareWhatsApp,
    getMeetingStatus,
    getCountdownString,
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

    const hasPoster = !!meeting.poster_url;
    const duration = Math.max(15, meeting.duration ?? 60);

    const hasZoomLink = !!(meeting.zoom_link && meeting.zoom_link.trim());
    const hasZoomId = !!(meeting.zoom_id && meeting.zoom_id.trim());
    const hasZoomPassword = !!(meeting.zoom_password && meeting.zoom_password.trim());
    const hasZoomInfo = hasZoomLink || hasZoomId || hasZoomPassword;

    const showJoin = hasZoomLink && !isActuallyPast;
    const showZoomInfo = hasZoomInfo && !isActuallyPast;

    const posterButtonOnly = isActuallyPast && hasPoster;

    return (
        <div
            className={`relative overflow-hidden border-2 rounded-2xl p-5 transition-all ${isActuallyPast
                ? 'bg-gray-50 border-gray-300 opacity-80'
                : isLive
                    ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-600 shadow-xl ring-2 ring-green-600/20'
                    : isUpcoming
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-400 shadow-lg'
                        : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-lg'
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

            <div className="flex flex-wrap items-center gap-2 mb-3">
                {meeting.organizer && (
                    <button
                        onClick={() => onOrganizerClick(meeting.organizer || '')}
                        className={`px-2.5 py-1 rounded-full text-xs font-black transition ${isActuallyPast ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                    >
                        {getOrganizerWithEmoji(meeting.organizer)}
                    </button>
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

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                <div className={`${hasPoster && !isActuallyPast ? 'md:col-span-6' : 'md:col-span-12'} flex flex-col`}>
                    <h3 className={`text-[20px] sm:text-[22px] md:text-[24px] font-black tracking-tight leading-snug ${isActuallyPast ? 'text-gray-700' : 'text-gray-900'}`}>
                        {meeting.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold border ${isActuallyPast ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDateTR(meeting.date)}
                        </div>
                        <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold border ${isActuallyPast ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
                            <Clock className="w-4 h-4 mr-2" />
                            {toTimeRange(meeting.time, duration)}
                        </div>
                    </div>

                    {meeting.description && (
                        <div className={`mt-4 p-4 rounded-2xl border-l-[6px] ${isActuallyPast
                            ? 'bg-gray-100/50 border-gray-300 text-gray-500 italic'
                            : 'bg-yellow-50/60 border-blue-500 text-gray-800 shadow-sm'
                            }`}>
                            <p className="text-[14px] sm:text-[15px] md:text-[16px] font-medium leading-relaxed">
                                {meeting.description}
                            </p>
                        </div>
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

                    {!isActuallyPast && (
                        <div className="mt-5 pt-4 border-t border-gray-100">
                            {showZoomInfo ? (
                                <>
                                    {showJoin && (
                                        <a
                                            href={meeting.zoom_link!}
                                            className={`inline-flex items-center px-6 py-3 text-sm font-black rounded-xl transition shadow-md ${isLive
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
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {hasZoomId && (
                                                <div className="bg-gray-100 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700">
                                                    <span className="font-black text-gray-900">Zoom ID:</span> {meeting.zoom_id}
                                                </div>
                                            )}

                                            {hasZoomPassword && (
                                                <details className="bg-gray-100 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700">
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

                                    <div className="mt-3 text-xs font-semibold text-gray-500">
                                        Toplantı bilgileri değişirse güncel ayrıntılar bu sayfada paylaşılır.
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-600">
                                    Ayrıntıları ve güncel toplantı bilgilerini bu sayfadan takip edin.
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

                {hasPoster && !isActuallyPast ? (
                    <div className="md:col-span-6 flex h-full">
                        <button
                            onClick={() => onPosterClick(meeting.poster_url!)}
                            className={`w-full h-full rounded-3xl border-2 bg-white/70 hover:bg-white transition p-4 shadow-md hover:shadow-lg flex flex-col ${isLive ? 'border-green-300' : 'border-indigo-200'}`}
                            title="Afişi büyüt"
                        >
                            <div className={`w-full flex-1 rounded-2xl overflow-hidden border bg-white shadow-sm ${isLive ? 'border-green-200' : 'border-indigo-200'}`}>
                                <img src={meeting.poster_url!} alt="Toplantı afişi" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="hidden md:block md:col-span-6" />
                )}
            </div>
        </div>
    );
}
