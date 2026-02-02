import React from 'react';
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
} from 'lucide-react';
import { Meeting } from './types';
import {
    getOrganizerWithEmoji,
    normalizeId,
    formatDateTR,
    toTimeRange,
    buildGoogleCalendarUrl,
    downloadIcs,
    shareWhatsApp,
} from './utils';

interface MeetingCardProps {
    meeting: Meeting;
    nowKey: string;
    isAdmin: boolean;
    isPast: boolean;
    onEdit: (m: Meeting) => void;
    onDelete: (id: string | number) => void;
    onPosterClick: (url: string) => void;
    onOrganizerClick: (org: string) => void;
}

export function MeetingCard({
    meeting,
    nowKey,
    isAdmin,
    isPast,
    onEdit,
    onDelete,
    onPosterClick,
    onOrganizerClick,
}: MeetingCardProps) {
    const hasPoster = !!meeting.poster_url;
    const duration = Math.max(15, meeting.duration ?? 60);

    const hasIdPw = !!(meeting.zoom_id || meeting.zoom_password);
    const showJoin = !!meeting.zoom_link && !hasIdPw && !isPast;
    const showIdPw = !isPast && hasIdPw;

    const isToday = meeting.date === nowKey;
    const posterButtonOnly = isPast && hasPoster;

    return (
        <div
            className={`relative overflow-hidden border-2 rounded-2xl p-5 transition-all ${isPast
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
                        className={`px-2.5 py-1 rounded-full text-xs font-black transition ${isPast ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
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
                        </button>
                    </div>
                ) : (
                    <div className="hidden md:block md:col-span-5" />
                )}
            </div>
        </div>
    );
}
