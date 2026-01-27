import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { supabase, Meeting, MeetingFormData } from '../lib/supabase';
import { useMeetings } from '../hooks/useMeetings';
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
    Copy,
    ExternalLink,
    Bell,
    BellOff,
    LogIn,
    LogOut,
    Save,
    MousePointer2,
    AlertTriangle,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    BookOpen,
    Image as ImageIcon,
    X,
} from 'lucide-react';

// Organizer emoji map
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

function getOrganizerWithEmoji(organizer: string): string {
    const emoji = ORGANIZER_EMOJIS[organizer] || '';
    return emoji ? `${emoji} ${organizer}` : organizer;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatTime(time: string, duration: number): string {
    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return `${time} - ${endDate.toTimeString().slice(0, 5)}`;
}

// Meeting Status Types
type MeetingStatus = 'upcoming' | 'countdown' | 'live' | 'finished';

function getMeetingStatus(meeting: Meeting, now: Date): { status: MeetingStatus; diffMinutes: number; diffHours: number } {
    const [hours, minutes] = meeting.time.split(':').map(Number);
    const meetingStart = new Date(meeting.date);
    meetingStart.setHours(hours, minutes, 0, 0);

    const meetingEnd = new Date(meetingStart.getTime() + meeting.duration * 60000);

    if (now > meetingEnd) return { status: 'finished', diffMinutes: 0, diffHours: 0 };
    if (now >= meetingStart && now <= meetingEnd) {
        const diff = Math.floor((now.getTime() - meetingStart.getTime()) / 60000);
        return { status: 'live', diffMinutes: diff, diffHours: 0 };
    }

    const diffToStart = Math.floor((meetingStart.getTime() - now.getTime()) / 60000);
    const h = Math.floor(diffToStart / 60);
    const m = diffToStart % 60;

    // Is it today?
    const isToday = new Date(meeting.date).toDateString() === now.toDateString();

    if (isToday) {
        return { status: 'countdown', diffMinutes: m, diffHours: h };
    }

    return { status: 'upcoming', diffMinutes: m, diffHours: h };
}

function MeetingStatusBadge({ meeting, now }: { meeting: Meeting, now: Date }) {
    const { status, diffMinutes, diffHours } = getMeetingStatus(meeting, now);

    if (status === 'live') {
        return (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse shadow-lg shadow-red-200">
                <span className="w-2 h-2 bg-white rounded-full mr-1.5 "></span>
                CANLI • {diffMinutes} dakikadır
            </div>
        );
    }

    if (status === 'countdown') {
        return (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Clock className="w-3 h-3 mr-1.5" />
                {diffHours > 0 ? `${diffHours} sa ${diffMinutes} dk` : `${diffMinutes} dk`} kaldı
            </div>
        );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mDate = new Date(meeting.date);
    mDate.setHours(0, 0, 0, 0);

    if (mDate.getTime() === today.getTime()) {
        return (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-lg shadow-blue-200">
                BUGÜN
            </div>
        );
    }

    return null;
}

function PosterLightbox({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
            >
                <X className="w-8 h-8" />
            </button>
            <img
                src={url}
                alt="Toplantı Afişi"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

// Meeting Card Component
function MeetingCard({
    meeting,
    isAdmin,
    isPast,
    onDelete,
    onEdit,
    now,
    isTodaySpotlight = false,
    onOrganizerClick,
    onPosterClick
}: {
    meeting: Meeting;
    isAdmin: boolean;
    isPast?: boolean;
    onDelete: (id: string) => void;
    onEdit: (meeting: Meeting) => void;
    now: Date;
    isTodaySpotlight?: boolean;
    onOrganizerClick?: (organizer: string) => void;
    onPosterClick?: (url: string) => void;
}) {
    const isToday = !isPast && (new Date(meeting.date).toDateString() === now.toDateString());

    return (
        <div
            className={`group relative overflow-hidden transition-all duration-300 ${isPast
                ? 'bg-gray-50 border-gray-200 grayscale-[0.5] hover:grayscale-0'
                : isTodaySpotlight
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20 shadow-xl'
                    : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg'
                } border rounded-2xl p-5 mb-4`}
        >
            {/* Spotlight Accent */}
            {isTodaySpotlight && (
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-indigo-500/10 rounded-full blur-3xl" />
            )}

            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {meeting.organizer && (
                            <button
                                onClick={() => onOrganizerClick?.(meeting.organizer)}
                                className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-current transition-all ${isPast ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}`}
                            >
                                {getOrganizerWithEmoji(meeting.organizer)}
                            </button>
                        )}
                        {!isPast && <MeetingStatusBadge meeting={meeting} now={now} />}
                    </div>

                    <h3 className={`font-bold ${isPast ? 'text-gray-600' : 'text-gray-900'} text-xl mb-3 group-hover:text-blue-600 transition-colors`}>
                        {meeting.title}
                    </h3>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
                        <div className="flex items-center text-sm font-medium">
                            <div className={`p-1.5 rounded-lg mr-2 ${isPast ? 'bg-gray-100' : 'bg-blue-50 text-blue-600'}`}>
                                <Calendar className="w-4 h-4" />
                            </div>
                            {formatDate(meeting.date)}
                        </div>
                        <div className="flex items-center text-sm font-medium">
                            <div className={`p-1.5 rounded-lg mr-2 ${isPast ? 'bg-gray-100' : 'bg-indigo-50 text-indigo-600'}`}>
                                <Clock className="w-4 h-4" />
                            </div>
                            {formatTime(meeting.time, meeting.duration)}
                        </div>
                    </div>

                    {meeting.description && (
                        <p className={`mt-4 text-sm leading-relaxed ${isPast ? 'text-gray-500 italic' : 'text-gray-600'}`}>
                            {meeting.description}
                        </p>
                    )}

                    {(meeting.zoom_link || meeting.zoom_id) && !isPast && (
                        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                {meeting.zoom_link && (
                                    <a
                                        href={meeting.zoom_link}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-md hover:shadow-blue-200"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Video className="w-4 h-4 mr-2" />
                                        Zoom'a Katıl
                                    </a>
                                )}
                                {meeting.poster_url && isToday && (
                                    <button
                                        onClick={() => onPosterClick?.(meeting.poster_url!)}
                                        className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-bold rounded-xl transition border border-indigo-100"
                                    >
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Afişi Gör
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-500">
                                {meeting.zoom_id && <div className="bg-gray-100 px-2 py-1 rounded">ID: <span className="text-gray-800">{meeting.zoom_id}</span></div>}
                                {meeting.zoom_password && <div className="bg-gray-100 px-2 py-1 rounded">PW: <span className="text-gray-800">{meeting.zoom_password}</span></div>}
                            </div>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="flex gap-2 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(meeting)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                            title="Düzenle"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(meeting.id)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
                            title="Sil"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function SectionTitle({ title, icon, color = 'blue' }: { title: string, icon: React.ReactNode, color?: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600 bg-blue-100',
        indigo: 'text-indigo-600 bg-indigo-100',
        gray: 'text-gray-500 bg-gray-100',
        red: 'text-red-600 bg-red-100'
    };

    return (
        <div className="flex items-center mb-6">
            <div className={`p-2.5 rounded-xl mr-3 ${colorClasses[color] || colorClasses.blue}`}>
                {icon}
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
        </div>
    );
}

// Meeting List Component
function MeetingList({
    upcomingMeetings,
    pastMeetings,
    isAdmin,
    onDelete,
    onEdit,
    now,
    selectedOrganizer,
    onOrganizerClick,
    onClearFilter,
    onPosterClick
}: {
    upcomingMeetings: Meeting[];
    pastMeetings: Meeting[];
    isAdmin: boolean;
    onDelete: (id: string) => void;
    onEdit: (meeting: Meeting) => void;
    now: Date;
    selectedOrganizer: string | null;
    onOrganizerClick: (organizer: string) => void;
    onClearFilter: () => void;
    onPosterClick: (url: string) => void;
}) {
    const [showPast, setShowPast] = useState(false);
    const [showAllPast, setShowAllPast] = useState(false);

    // Dynamic Filtering
    const filterMeetings = (meetings: Meeting[]) => {
        if (!selectedOrganizer) return meetings;
        return meetings.filter(m => m.organizer === selectedOrganizer);
    };

    const filteredUpcoming = filterMeetings(upcomingMeetings);
    const filteredPast = filterMeetings(pastMeetings);

    const todayMeetings = filteredUpcoming.filter(m => new Date(m.date).toDateString() === now.toDateString());
    const onlyUpcoming = filteredUpcoming.filter(m => new Date(m.date).toDateString() !== now.toDateString());

    const visiblePast = showAllPast ? filteredPast : filteredPast.slice(0, 5);

    return (
        <div className="space-y-10">
            {/* Active Filter Badge */}
            {selectedOrganizer && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center">
                        <Users className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-blue-900 font-medium">
                            Filtre: <strong>{selectedOrganizer}</strong> ({filteredUpcoming.length + filteredPast.length} toplantı)
                        </span>
                    </div>
                    <button
                        onClick={onClearFilter}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-xl shadow-sm transition"
                    >
                        Filtreyi Temizle
                    </button>
                </div>
            )}

            {/* Today's Spotlight */}
            {todayMeetings.length > 0 && (
                <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-indigo-500 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                    <SectionTitle title="GÜNÜN TOPLANTILARI" icon={<Clock className="w-6 h-6" />} color="indigo" />

                    <div className="grid grid-cols-1 gap-6">
                        {todayMeetings.map((meeting) => (
                            <MeetingCard
                                key={meeting.id}
                                meeting={meeting}
                                isAdmin={isAdmin}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                now={now}
                                isTodaySpotlight={true}
                                onOrganizerClick={onOrganizerClick}
                                onPosterClick={onPosterClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Meetings */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <SectionTitle title="YAKLAŞAN TOPLANTILAR" icon={<Calendar className="w-6 h-6" />} color="blue" />

                {onlyUpcoming.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">
                            {selectedOrganizer ? `${selectedOrganizer} için yaklaşan toplantı yok.` : 'Buralar biraz sessiz... Yeni toplantı planlanmamış.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {onlyUpcoming.map((meeting) => (
                            <MeetingCard
                                key={meeting.id}
                                meeting={meeting}
                                isAdmin={isAdmin}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                now={now}
                                onOrganizerClick={onOrganizerClick}
                                onPosterClick={onPosterClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Past Meetings (Collapsible) */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 opacity-90">
                <button
                    onClick={() => setShowPast(!showPast)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <SectionTitle title={`ARŞİV (${filteredPast.length})`} icon={<BookOpen className="w-6 h-6" />} color="gray" />
                    <div className={`p-2 rounded-lg bg-gray-100 transition-transform duration-300 ${showPast ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    </div>
                </button>
                {showPast && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        {filteredPast.length === 0 ? (
                            <p className="text-gray-400 text-center py-8 italic font-medium">Arşiv henüz boş.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-4">
                                    {visiblePast.map((meeting) => (
                                        <MeetingCard
                                            key={meeting.id}
                                            meeting={meeting}
                                            isAdmin={isAdmin}
                                            isPast
                                            onDelete={onDelete}
                                            onEdit={onEdit}
                                            now={now}
                                            onOrganizerClick={onOrganizerClick}
                                            onPosterClick={onPosterClick}
                                        />
                                    ))}
                                </div>

                                {filteredPast.length > 5 && (
                                    <div className="flex flex-col items-center pt-4">
                                        <button
                                            onClick={() => setShowAllPast(!showAllPast)}
                                            className="text-sm font-bold text-gray-600 hover:text-blue-600 bg-gray-100 px-6 py-2 rounded-full transition-all"
                                        >
                                            {showAllPast ? 'Daha Az Göster' : 'Tüm Arşivi Göster'}
                                        </button>
                                        {!showAllPast && <p className="text-center text-xs text-gray-400 mt-3 font-medium">Son 5 toplantı gösteriliyor</p>}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Admin Panel Component
function AdminPanel({
    isAdmin,
    onLogin,
    onLogout,
}: {
    isAdmin: boolean;
    onLogin: (username: string, password: string) => Promise<boolean>;
    onLogout: () => Promise<void>;
}) {
    const [showLogin, setShowLogin] = useState(false);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [verified, setVerified] = useState(false);

    const handleVerifyClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 3) {
            setVerified(true);
        }
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

        const success = await onLogin(credentials.username, credentials.password);
        if (!success) {
            setError('Geçersiz kullanıcı adı veya şifre');
        } else {
            setShowLogin(false);
            setCredentials({ username: '', password: '' });
            resetVerification();
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        setLoading(true);
        await onLogout();
        setLoading(false);
    };

    if (isAdmin) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Admin Paneli</h2>
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {loading ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                    </button>
                </div>
                <p className="text-gray-600 mt-2">Admin olarak giriş yaptınız. Toplantı ekleyip silebilirsiniz.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Admin Paneli</h2>
                <button
                    onClick={() => {
                        setShowLogin(!showLogin);
                        if (!showLogin) resetVerification();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                >
                    <LogIn className="w-4 h-4 mr-2" />
                    Giriş Yap
                </button>
            </div>

            {showLogin && (
                <div className="mt-6 space-y-4">
                    {/* Mouse verification */}
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Fare Doğrulaması</span>
                            <span className="text-xs text-gray-500">{clickCount}/3 tık</span>
                        </div>
                        {verified ? (
                            <div className="bg-green-100 text-green-800 py-3 px-4 rounded-lg flex items-center justify-center border-2 border-green-300">
                                <span className="text-sm font-medium">✅ Fare doğrulaması tamamlandı</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleVerifyClick}
                                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 py-3 px-4 rounded-lg transition flex items-center justify-center border-2 border-blue-300"
                            >
                                <MousePointer2 className="w-5 h-5 mr-2" />
                                Buraya {3 - clickCount} kez daha tıklayın
                            </button>
                        )}
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Kullanıcı adı"
                            value={credentials.username}
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={!verified}
                        />
                        <input
                            type="password"
                            placeholder="Şifre"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={!verified}
                        />
                        {error && <p className="text-red-600 text-sm">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading || !verified}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                        >
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>
                    {!verified && (
                        <p className="text-xs text-gray-500 text-center">
                            Giriş yapmak için önce fare doğrulamasını tamamlayın
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// Main Konsensus Component
export function Konsensus() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [copyMessage, setCopyMessage] = useState('');
    const [pushEnabled, setPushEnabled] = useState(!!pushService.getSavedEndpoint());
    const [pushLoading, setPushLoading] = useState(false);
    const [now, setNow] = useState(new Date());

    const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';

    const { loading, error, addMeeting, deleteMeeting, getUpcomingMeetings, getPastMeetings, refetch } = useMeetings();

    const [formData, setFormData] = useState<MeetingFormData>({
        title: '',
        organizer: '',
        customOrganizer: '',
        date: '',
        time: '20:00',
        duration: 60,
        description: '',
        zoomLink: '',
        zoomId: '',
        zoomPassword: '',
        posterUrl: '',
    });

    const [selectedOrganizer, setSelectedOrganizer] = useState<string | null>(null);
    const [activePoster, setActivePoster] = useState<string | null>(null);

    // Calculate Stats
    const getGroupStats = () => {
        const allMeetings = [...getUpcomingMeetings(), ...getPastMeetings()];
        const stats: Record<string, number> = {};

        allMeetings.forEach(m => {
            if (m.organizer) {
                stats[m.organizer] = (stats[m.organizer] || 0) + 1;
            }
        });

        return Object.entries(stats)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    const groupStats = getGroupStats();

    // Check auth state
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAdmin(!!session);
            setAuthLoading(false);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setIsAdmin(!!session);
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Set default date
    useEffect(() => {
        const now = new Date();
        const turkeyOffset = 3 * 60;
        const localOffset = now.getTimezoneOffset();
        const turkeyTime = new Date(now.getTime() + (turkeyOffset + localOffset) * 60000);
        const dateStr = turkeyTime.toISOString().split('T')[0];

        setFormData((prev) => ({ ...prev, date: prev.date || dateStr }));
    }, []);

    // Auto refetch at 00:05
    useEffect(() => {
        const scheduleRefetch = () => {
            const now = new Date();
            const next = new Date();
            next.setHours(0, 5, 0, 0);
            if (next <= now) next.setDate(next.getDate() + 1);

            const timeout = next.getTime() - now.getTime();
            return setTimeout(async () => {
                await refetch();
                scheduleRefetch();
            }, timeout);
        };

        const timeoutId = scheduleRefetch();
        return () => clearTimeout(timeoutId);
    }, [refetch]);

    // Update real-time state every minute
    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentNow = new Date();
            setNow(currentNow);

            // If it's midnight, refetch to move meetings to past
            if (currentNow.getHours() === 0 && currentNow.getMinutes() === 0) {
                refetch();
            }
        }, 60000);

        return () => clearInterval(intervalId);
    }, [refetch]);

    // Push notification validation
    useEffect(() => {
        const validate = async () => {
            try {
                const valid = await pushService.validateAndRenewSubscription();
                if (!valid && pushEnabled) {
                    setPushEnabled(false);
                }
            } catch (err) {
                console.warn('Subscription validation error:', err);
            }
        };

        validate();
        const interval = setInterval(validate, 6 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [pushEnabled]);

    const togglePush = async () => {
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
            console.error('Toggle push error:', err);
            alert((err as Error)?.message || String(err));
        } finally {
            setPushLoading(false);
        }
    };

    const handleLogin = async (username: string, password: string): Promise<boolean> => {
        try {
            const email = 'admin@patoloji.com';
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                if (error.message.includes('Invalid login credentials') && username === 'admin' && password === 'patol1923') {
                    const { error: signUpError } = await supabase.auth.signUp({ email, password });
                    if (signUpError) return false;
                    setIsAdmin(true);
                    return true;
                }
                return false;
            }

            setIsAdmin(true);
            return true;
        } catch {
            return false;
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
    };

    const getFormOrganizer = () => {
        return formData.organizer === 'Diğer' ? formData.customOrganizer.trim() : formData.organizer.trim();
    };

    const isFormValid = () => {
        return formData.title && formData.date && formData.time;
    };

    const handleSave = async () => {
        if (!isFormValid()) return;

        const organizer = getFormOrganizer();
        const result = await addMeeting({
            title: formData.title,
            organizer,
            date: formData.date,
            time: formData.time,
            duration: formData.duration,
            description: formData.description,
            zoom_link: formData.zoomLink,
            zoom_id: formData.zoomId,
            zoom_password: formData.zoomPassword,
            poster_url: formData.posterUrl,
        });

        if (result.success) {
            setSuccessMessage('Toplantı başarıyla kaydedildi!');
            setTimeout(() => setSuccessMessage(''), 3000);
            setFormData({
                title: '',
                organizer: '',
                customOrganizer: '',
                date: formData.date,
                time: '20:00',
                duration: 60,
                description: '',
                zoomLink: '',
                zoomId: '',
                zoomPassword: '',
                posterUrl: '',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bu toplantıyı silmek istediğinize emin misiniz?')) {
            await deleteMeeting(id);
        }
    };

    const handleEdit = (meeting: Meeting) => {
        const isKnownOrganizer = ORGANIZER_OPTIONS.includes(meeting.organizer);
        setFormData({
            title: meeting.title,
            organizer: isKnownOrganizer ? meeting.organizer : 'Diğer',
            customOrganizer: isKnownOrganizer ? '' : meeting.organizer,
            date: meeting.date,
            time: meeting.time,
            duration: meeting.duration,
            description: meeting.description,
            zoomLink: meeting.zoom_link ?? '',
            zoomId: meeting.zoom_id ?? '',
            zoomPassword: meeting.zoom_password ?? '',
            posterUrl: meeting.poster_url ?? '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const updateField = (field: keyof MeetingFormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Google Calendar URL
    const getGoogleCalendarUrl = useCallback(() => {
        const [year, month, day] = formData.date.split('-').map(Number);
        const [hours, minutes] = formData.time.split(':').map(Number);
        const startDate = new Date(year, month - 1, day, hours, minutes);
        const endDate = new Date(startDate.getTime() + formData.duration * 60000);

        const formatDateTime = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const h = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            return `${y}${m}${d}T${h}${min}00`;
        };

        let details = formData.description;
        const organizer = getFormOrganizer();
        if (organizer) details = `Düzenleyen: ${organizer}\n\n${details}`;
        if (formData.zoomLink) details += `\n\nZoom Bağlantısı: ${formData.zoomLink}`;
        if (formData.zoomId) details += `\nZoom Meeting ID: ${formData.zoomId}`;
        if (formData.zoomPassword) details += `\nZoom Parolası: ${formData.zoomPassword}`;

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: formData.title,
            dates: `${formatDateTime(startDate)}/${formatDateTime(endDate)}`,
            details,
            ctz: 'Europe/Istanbul',
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }, [formData]);

    // iCal file generation
    const generateIcal = useCallback(() => {
        const [year, month, day] = formData.date.split('-').map(Number);
        const [hours, minutes] = formData.time.split(':').map(Number);
        const startDate = new Date(year, month - 1, day, hours, minutes);
        const endDate = new Date(startDate.getTime() + formData.duration * 60000);

        const formatDateTime = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const h = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            return `${y}${m}${d}T${h}${min}00`;
        };

        const organizer = getFormOrganizer();
        let description = formData.description.replace(/\n/g, '\\n');
        if (organizer) description = `Düzenleyen: ${organizer}\\n\\n${description}`;
        if (formData.zoomLink) description += `\\n\\nZoom Bağlantısı: ${formData.zoomLink}`;
        if (formData.zoomId) description += `\\nZoom Meeting ID: ${formData.zoomId}`;
        if (formData.zoomPassword) description += `\\nZoom Parolası: ${formData.zoomPassword}`;

        const location = formData.zoomLink ? `LOCATION:${formData.zoomLink}` : '';

        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Patoloji Toplantı Takvimi//TR',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VTIMEZONE',
            'TZID:Europe/Istanbul',
            'BEGIN:STANDARD',
            'DTSTART:20071028T040000',
            'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
            'TZNAME:+03',
            'TZOFFSETFROM:+0300',
            'TZOFFSETTO:+0300',
            'END:STANDARD',
            'END:VTIMEZONE',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@patoloji-toplanti-takvimi`,
            `DTSTART;TZID=Europe/Istanbul:${formatDateTime(startDate)}`,
            `DTEND;TZID=Europe/Istanbul:${formatDateTime(endDate)}`,
            `SUMMARY:${formData.title}`,
            location,
            `DESCRIPTION:${description}`,
            `DTSTAMP:${formatDateTime(new Date())}`,
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            'END:VEVENT',
            'END:VCALENDAR',
        ]
            .filter(Boolean)
            .join('\r\n');
    }, [formData]);

    const downloadIcal = () => {
        const ical = generateIcal();
        const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const organizer = getFormOrganizer();
        let filename = '';
        if (organizer && formData.title) filename = `${organizer} - ${formData.title}`;
        else if (organizer) filename = organizer;
        else if (formData.title) filename = formData.title;
        else filename = 'patoloji-toplanti';

        filename = filename.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
        a.download = `${filename}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // WhatsApp message
    const getWhatsAppMessage = useCallback(() => {
        const [year, month, day] = formData.date.split('-').map(Number);
        const [hours, minutes] = formData.time.split(':').map(Number);
        const startDate = new Date(year, month - 1, day, hours, minutes);
        const endDate = new Date(startDate.getTime() + formData.duration * 60000);

        const formatDateTr = (date: Date) =>
            date.toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

        const formatTimeTr = (date: Date) => date.toTimeString().slice(0, 5);

        const organizer = getFormOrganizer() || 'Patoloji Toplantısı';
        let msg = `🔬 *${organizer}* 🔬\n\n`;
        msg += `📋 *${formData.title}*\n\n`;
        msg += `📆 *Tarih:* ${formatDateTr(startDate)}\n`;
        msg += `🕐 *Saat:* ${formatTimeTr(startDate)} - ${formatTimeTr(endDate)} (Türkiye Yerel Saat)\n`;

        if (formData.description) msg += `\n📝 *Açıklama:* ${formData.description}\n`;

        if (formData.zoomLink || formData.zoomId) {
            const zoomHeader =
                formData.zoomId && formData.zoomPassword
                    ? '🔗 *Zoom Bilgileri: (ID ve şifre linke gömülü)*'
                    : '🔗 *Zoom Bilgileri:*';
            msg += `\n${zoomHeader}\n`;
            if (formData.zoomLink) msg += `• Bağlantı: ${formData.zoomLink}\n`;
            if (formData.zoomId) msg += `• Meeting ID: ${formData.zoomId}\n`;
            if (formData.zoomPassword) msg += `• Parola: ${formData.zoomPassword}\n`;
        }

        msg += `\n📄 iCalendar takvim dosyası .ics uzantısıyla ektedir.\n`;
        msg += `\n📅 *Google Takvim'e Ekle:*\n${getGoogleCalendarUrl()}`;

        return msg;
    }, [formData, getGoogleCalendarUrl]);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyMessage(`${label} kopyalandı!`);
            setTimeout(() => setCopyMessage(''), 2000);
        } catch {
            setCopyMessage('Kopyalama başarısız');
            setTimeout(() => setCopyMessage(''), 2000);
        }
    };

    const upcomingMeetings = getUpcomingMeetings();
    const pastMeetings = getPastMeetings();

    return (
        <PageContainer>
            {/* Active Poster Lightbox */}
            {activePoster && (
                <PosterLightbox
                    url={activePoster}
                    onClose={() => setActivePoster(null)}
                />
            )}

            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-12 mb-8 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-md mb-6 shadow-xl border border-white/30">
                        <Users className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Patoloji Konsensus Toplantıları</h1>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-white/90 text-sm font-medium">
                        <div className="flex items-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                            <Bell className="w-4 h-4 mr-2" />
                            Bildirim: {notificationPermission === 'granted' ? 'Açık' : 'Kapalı'}
                        </div>
                        <div className="flex items-center bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                            <Clock className="w-4 h-4 mr-2" />
                            Bölge: Europe/Istanbul
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Application Layout: Two Columns on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Column: Meeting Lists (Wider) */}
                <div className="lg:col-span-8 order-2 lg:order-1">
                    {!loading && (
                        <MeetingList
                            upcomingMeetings={upcomingMeetings}
                            pastMeetings={pastMeetings}
                            isAdmin={isAdmin}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            now={now}
                            selectedOrganizer={selectedOrganizer}
                            onOrganizerClick={(org) => {
                                setSelectedOrganizer(org);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            onClearFilter={() => setSelectedOrganizer(null)}
                            onPosterClick={setActivePoster}
                        />
                    )}
                </div>

                {/* Right Column: Actions & Form (Narrower) */}
                <div className="lg:col-span-4 order-1 lg:order-2 space-y-8 lg:sticky lg:top-8">
                    {/* Achievement Stats */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
                        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                            <span className="text-2xl mr-3">🏆</span> En Aktif Gruplar
                        </h2>
                        <div className="space-y-4">
                            {groupStats.map((stat, index) => (
                                <button
                                    key={stat.name}
                                    onClick={() => {
                                        setSelectedOrganizer(stat.name);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`w-full group flex items-center justify-between p-3 rounded-2xl transition-all ${selectedOrganizer === stat.name
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-gray-50 hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="flex items-center overflow-hidden">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 shrink-0 ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                            index === 1 ? 'bg-gray-300 text-gray-800' :
                                                index === 2 ? 'bg-orange-300 text-orange-900' :
                                                    selectedOrganizer === stat.name ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {index + 1}
                                        </span>
                                        <span className={`text-sm font-bold truncate ${selectedOrganizer === stat.name ? 'text-white' : 'text-gray-700'}`}>
                                            {getOrganizerWithEmoji(stat.name)}
                                        </span>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${selectedOrganizer === stat.name ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {stat.count}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-6 text-center italic font-medium">Toplam toplantı sayılarına göre sıralanmıştır.</p>
                    </div>

                    {/* Calendar Actions */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-blue-500/10 rounded-full blur-2xl" />
                        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center">
                            <Calendar className="w-5 h-5 mr-3 text-blue-600" /> Hızlı Erişim
                        </h2>
                        <div className="space-y-4">
                            <button
                                onClick={() => window.open(getGoogleCalendarUrl(), '_blank')}
                                disabled={!isFormValid()}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3.3 rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center disabled:grayscale disabled:opacity-50"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" /> Google Takvim
                            </button>
                            <button
                                onClick={downloadIcal}
                                disabled={!isFormValid()}
                                className="w-full bg-indigo-50 text-indigo-700 px-5 py-3.3 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center disabled:grayscale disabled:opacity-50"
                            >
                                <Download className="w-5 h-5 mr-2" /> iCal (.ics) İndir
                            </button>
                            <button
                                onClick={() => copyToClipboard(getWhatsAppMessage(), 'WhatsApp duyurusu')}
                                disabled={!isFormValid()}
                                className="w-full bg-green-50 text-green-700 px-5 py-3.3 rounded-2xl font-bold hover:bg-green-100 transition-all flex items-center justify-center disabled:grayscale disabled:opacity-50"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp Paylaş
                            </button>
                        </div>
                    </div>

                    {/* Push Notification Control */}
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <Bell className="w-5 h-5 mr-2 text-blue-600" /> Bildirimler
                                </h3>
                                <div className={`w-3 h-3 rounded-full ${pushEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            </div>
                            <p className="text-sm text-gray-500">Toplantılardan 15 dk önce hatırlatma gönderilir.</p>
                            <button
                                onClick={togglePush}
                                disabled={pushLoading}
                                className={`w-full py-3 rounded-2xl font-bold transition-all ${pushEnabled
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                                    }`}
                            >
                                {pushLoading ? 'İşlem yapılıyor...' : pushEnabled ? 'Bildirimleri Kapat' : 'Bildirimleri Etkinleştir'}
                            </button>
                        </div>
                    </div>

                    <AdminPanel isAdmin={isAdmin} onLogin={handleLogin} onLogout={handleLogout} />
                </div>
            </div>

            {/* Bottom Section: Add/Edit Form - Full Width when triggered or at bottom */}
            {isAdmin && (
                <div className="mt-12 bg-white rounded-4xl shadow-2xl p-10 border border-blue-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                        <SectionTitle title="TOPLANTI OLUŞTUR / DÜZENLE" icon={<Plus className="w-6 h-6" />} color="blue" />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setFormData({
                                    title: '', organizer: '', customOrganizer: '', date: '', time: '20:00', duration: 60,
                                    description: '', zoomLink: '', zoomId: '', zoomPassword: '', posterUrl: ''
                                })}
                                className="px-6 py-3 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                            >
                                Temizle
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!isFormValid()}
                                className="px-8 py-3 rounded-2xl font-black bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 transition transform active:scale-95 disabled:grayscale"
                            >
                                <Save className="w-5 h-5 inline mr-2" /> Toplantıyı Kaydet
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Form Inputs */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Düzenleyici</label>
                                    <select
                                        value={formData.organizer}
                                        onChange={(e) => updateField('organizer', e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium transition"
                                    >
                                        <option value="">Seçiniz</option>
                                        {ORGANIZER_OPTIONS.map(o => <option key={o} value={o}>{getOrganizerWithEmoji(o)}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Başlık *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                        placeholder="Toplantı başlığı"
                                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Tarih *</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => updateField('date', e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Saat *</label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => updateField('time', e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Süre</label>
                                    <select
                                        value={formData.duration}
                                        onChange={(e) => updateField('duration', parseInt(e.target.value))}
                                        className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium transition"
                                    >
                                        <option value={30}>30 Dakika</option>
                                        <option value={60}>1 Saat</option>
                                        <option value={90}>1.5 Saat</option>
                                        <option value={120}>2 Saat</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">Açıklama</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium transition resize-none"
                                />
                            </div>

                            <div className="p-6 bg-blue-50/50 rounded-3xl space-y-4">
                                <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest">Zoom Erişimi</h4>
                                <input
                                    type="url"
                                    value={formData.zoomLink}
                                    onChange={(e) => updateField('zoomLink', e.target.value)}
                                    placeholder="Zoom Linki"
                                    className="w-full px-5 py-3 bg-white border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={formData.zoomId}
                                        onChange={(e) => updateField('zoomId', e.target.value)}
                                        placeholder="Meeting ID"
                                        className="px-5 py-3 bg-white border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                    <input
                                        type="text"
                                        value={formData.zoomPassword}
                                        onChange={(e) => updateField('zoomPassword', e.target.value)}
                                        placeholder="Passcode"
                                        className="px-5 py-3 bg-white border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div className="pt-2">
                                    <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-3 italic flex items-center">
                                        <ImageIcon className="w-4 h-4 mr-2" /> Toplantı Afişi (URL)
                                    </h4>
                                    <input
                                        type="url"
                                        value={formData.posterUrl}
                                        onChange={(e) => updateField('posterUrl', e.target.value)}
                                        placeholder="Afiş resim linki (örn: https://.../afis.jpg)"
                                        className="w-full px-5 py-3 bg-white border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                    <p className="text-[10px] text-blue-400 mt-2 ml-1">
                                        * Afiş sadece bugün gerçekleşen toplantılarda görünür.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="space-y-6">
                            <label className="text-sm font-bold text-gray-500 ml-1 uppercase tracking-widest">Canlı Önizleme</label>
                            {isFormValid() ? (
                                <div className="scale-105 origin-top">
                                    <MeetingCard
                                        meeting={{
                                            id: 'preview',
                                            title: formData.title,
                                            organizer: getFormOrganizer(),
                                            date: formData.date,
                                            time: formData.time,
                                            duration: formData.duration,
                                            description: formData.description,
                                            zoom_link: formData.zoomLink,
                                            zoom_id: formData.zoomId,
                                            zoom_password: formData.zoomPassword,
                                            poster_url: formData.posterUrl
                                        }}
                                        isAdmin={false}
                                        onDelete={() => { }}
                                        onEdit={() => { }}
                                        now={now}
                                        isTodaySpotlight={new Date(formData.date).toDateString() === now.toDateString()}
                                        onPosterClick={setActivePoster}
                                    />
                                </div>
                            ) : (
                                <div className="h-full min-h-[300px] border-4 border-dashed border-gray-100 rounded-4xl flex flex-col items-center justify-center text-gray-300">
                                    <Plus className="w-12 h-12 mb-4" />
                                    <p className="font-bold">Bilgileri doldurunca önizleme açılır</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
