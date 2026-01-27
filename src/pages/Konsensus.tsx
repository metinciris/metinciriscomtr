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

function getMeetingStatus(meeting: Meeting, now: Date): { status: MeetingStatus; diffMinutes: number } {
    const [hours, minutes] = meeting.time.split(':').map(Number);
    const meetingStart = new Date(meeting.date);
    meetingStart.setHours(hours, minutes, 0, 0);

    const meetingEnd = new Date(meetingStart.getTime() + meeting.duration * 60000);

    if (now > meetingEnd) return { status: 'finished', diffMinutes: 0 };
    if (now >= meetingStart && now <= meetingEnd) {
        const diff = Math.floor((now.getTime() - meetingStart.getTime()) / 60000);
        return { status: 'live', diffMinutes: diff };
    }

    const diffToStart = Math.floor((meetingStart.getTime() - now.getTime()) / 60000);
    if (diffToStart <= 60 && diffToStart > 0) {
        return { status: 'countdown', diffMinutes: diffToStart };
    }

    return { status: 'upcoming', diffMinutes: diffToStart };
}

function StatusBadge({ meeting, now }: { meeting: Meeting, now: Date }) {
    const { status, diffMinutes } = getMeetingStatus(meeting, now);

    if (status === 'live') {
        return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse border border-red-200">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5 "></span>
                CANLI • {diffMinutes} dakikadır
            </div>
        );
    }

    if (status === 'countdown') {
        return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                <Clock className="w-3 h-3 mr-1" />
                Başlamasına {diffMinutes} dk kaldı
            </div>
        );
    }

    // Check if it's today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mDate = new Date(meeting.date);
    mDate.setHours(0, 0, 0, 0);

    if (mDate.getTime() === today.getTime()) {
        return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                BUGÜN
            </div>
        );
    }

    return null;
}

// Meeting Card Component
function MeetingCard({
    meeting,
    isAdmin,
    isPast,
    onDelete,
    onEdit,
    now
}: {
    meeting: Meeting;
    isAdmin: boolean;
    isPast?: boolean;
    onDelete: (id: string) => void;
    onEdit: (meeting: Meeting) => void;
    now: Date;
}) {
    const isToday = !isPast && (new Date(meeting.date).toDateString() === now.toDateString());

    return (
        <div
            className={`border-l-4 ${isPast ? 'border-gray-400 bg-gray-50' : isToday ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100 animate-in fade-in duration-500' : 'border-blue-500 bg-blue-50'} p-4 rounded-r-lg mb-4`}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {meeting.organizer && (
                            <div className={`text-sm ${isPast ? 'text-gray-600' : 'text-blue-700'} font-medium`}>
                                {getOrganizerWithEmoji(meeting.organizer)}
                            </div>
                        )}
                        {!isPast && <StatusBadge meeting={meeting} now={now} />}
                    </div>
                    <h3 className={`font-semibold ${isPast ? 'text-gray-700' : 'text-blue-900'} text-lg mb-2`}>
                        {meeting.title}
                    </h3>
                    <div className={`space-y-2 ${isPast ? 'text-gray-600' : 'text-blue-800'}`}>
                        <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(meeting.date)}
                        </div>
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {formatTime(meeting.time, meeting.duration)} (Europe/Istanbul)
                        </div>
                        {meeting.description && <p className="mt-2">{meeting.description}</p>}
                        {(meeting.zoom_link || meeting.zoom_id) && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                {meeting.zoom_link && (
                                    <div className="flex items-center">
                                        <Video className="w-4 h-4 mr-2" />
                                        <a
                                            href={meeting.zoom_link}
                                            className="text-blue-600 hover:underline font-medium"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Zoom Bağlantısı
                                        </a>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
                                    {meeting.zoom_id && <div><span className="opacity-70">ID:</span> {meeting.zoom_id}</div>}
                                    {meeting.zoom_password && <div><span className="opacity-70">Parola:</span> {meeting.zoom_password}</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2 ml-4">
                        <button
                            onClick={() => onEdit(meeting)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                            title="Düzenle"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(meeting.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
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

// Meeting List Component
function MeetingList({
    upcomingMeetings,
    pastMeetings,
    isAdmin,
    onDelete,
    onEdit,
    now
}: {
    upcomingMeetings: Meeting[];
    pastMeetings: Meeting[];
    isAdmin: boolean;
    onDelete: (id: string) => void;
    onEdit: (meeting: Meeting) => void;
    now: Date;
}) {
    const [showPast, setShowPast] = useState(false);

    return (
        <div className="space-y-6 mb-8">
            {/* Upcoming Meetings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Yaklaşan Toplantılar
                </h2>
                {upcomingMeetings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Yaklaşan toplantı bulunmuyor.</p>
                ) : (
                    upcomingMeetings.map((meeting) => (
                        <MeetingCard
                            key={meeting.id}
                            meeting={meeting}
                            isAdmin={isAdmin}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            now={now}
                        />
                    ))
                )}
            </div>

            {/* Past Meetings (Collapsible) */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <button
                    onClick={() => setShowPast(!showPast)}
                    className="w-full flex items-center justify-between text-xl font-semibold text-gray-900 mb-4"
                >
                    <span className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-gray-500" />
                        Geçmiş Toplantılar ({pastMeetings.length})
                    </span>
                    {showPast ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {showPast && (
                    <>
                        {pastMeetings.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Geçmiş toplantı bulunmuyor.</p>
                        ) : (
                            pastMeetings.slice(0, 10).map((meeting) => (
                                <MeetingCard
                                    key={meeting.id}
                                    meeting={meeting}
                                    isAdmin={isAdmin}
                                    isPast
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                    now={now}
                                />
                            ))
                        )}
                    </>
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
    });

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
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-12 mb-8 rounded-xl shadow-lg">
                <div className="flex items-center justify-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h1 className="text-white mb-4 text-4xl font-bold text-center">Patoloji Konsensus Toplantıları</h1>
                <p className="text-white/90 max-w-3xl text-lg text-center mx-auto">
                    Bildirim izni: <span className="font-medium">{notificationPermission}</span>
                </p>
            </div>

            {/* Push Notification Toggle */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={togglePush}
                            disabled={pushLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center"
                        >
                            {pushEnabled ? <BellOff className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                            {pushEnabled ? 'Bildirimleri Kapat' : 'Bildirimleri Aç'}
                        </button>
                        <span className="text-sm text-gray-600">
                            Durum: <span className="font-medium">{pushEnabled ? 'Açık' : 'Kapalı'}</span>
                            <br />
                            <span className="text-xs">
                                Toplantılardan 15 dakika önce bildirim gönderilir.{' '}
                                <a href="https://t.me/konsensustakip" target="_blank" className="text-blue-600 hover:underline">
                                    Telegram kanalı
                                </a>
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Success/Copy Messages */}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                    {successMessage}
                </div>
            )}
            {copyMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
                    {copyMessage}
                </div>
            )}

            {/* Loading/Error States */}
            {loading && (
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Toplantılar yükleniyor...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                    <p className="text-red-800">Hata: {error}</p>
                    <button
                        onClick={refetch}
                        className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                        Tekrar Dene
                    </button>
                </div>
            )}

            {/* Meeting List */}
            {!loading && (
                <MeetingList
                    upcomingMeetings={upcomingMeetings}
                    pastMeetings={pastMeetings}
                    isAdmin={isAdmin}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    now={now}
                />
            )}

            {/* Meeting Form + Preview (Two Column Layout) */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Meeting Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                            <Plus className="w-6 h-6 mr-2 text-blue-600" />
                            Toplantı Bilgileri
                        </h2>
                        {isAdmin && isFormValid() && (
                            <button
                                onClick={handleSave}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center font-semibold"
                            >
                                <Save className="w-4 h-4 mr-2" /> Kaydet
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Organizer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Etkinlik Düzenleyen</label>
                            <select
                                value={formData.organizer}
                                onChange={(e) => updateField('organizer', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                                <option value="">Seçiniz...</option>
                                {ORGANIZER_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {getOrganizerWithEmoji(opt)}
                                    </option>
                                ))}
                            </select>
                            {formData.organizer === 'Diğer' && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Grup Adı</label>
                                    <input
                                        type="text"
                                        value={formData.customOrganizer}
                                        onChange={(e) => updateField('customOrganizer', e.target.value)}
                                        placeholder="Örn. Patoloji Eğitim Toplantısı"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Etkinlik Adı *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="ör. Meme Patolojisi Konsensus Toplantısı"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" /> Tarih *
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => updateField('date', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="w-4 h-4 inline mr-1" /> Saat *
                                </label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => updateField('time', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Süre (dakika)</label>
                            <select
                                value={formData.duration}
                                onChange={(e) => updateField('duration', parseInt(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                                <option value={30}>30 dakika</option>
                                <option value={60}>1 saat</option>
                                <option value={90}>1.5 saat</option>
                                <option value={120}>2 saat</option>
                                <option value={180}>3 saat</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                placeholder="ör. konsensus grubumuzun ilk vaka sunumu"
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                            />
                        </div>

                        {/* Zoom Info */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <Video className="w-5 h-5 mr-2 text-blue-600" /> Zoom Bilgileri (Opsiyonel)
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Zoom Bağlantısı</label>
                                    <input
                                        type="url"
                                        value={formData.zoomLink}
                                        onChange={(e) => updateField('zoomLink', e.target.value)}
                                        placeholder="https://zoom.us/j/..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Meeting ID</label>
                                        <input
                                            type="text"
                                            value={formData.zoomId}
                                            onChange={(e) => updateField('zoomId', e.target.value)}
                                            placeholder="781 667 1158"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Parola</label>
                                        <input
                                            type="text"
                                            value={formData.zoomPassword}
                                            onChange={(e) => updateField('zoomPassword', e.target.value)}
                                            placeholder="123456"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview + Actions */}
                <div className="space-y-6">
                    {/* Preview */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Önizleme</h2>
                        {isFormValid() ? (
                            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                                {getFormOrganizer() && (
                                    <div className="text-sm text-blue-700 mb-2 font-medium">
                                        {getOrganizerWithEmoji(formData.organizer === 'Diğer' ? formData.customOrganizer || 'Diğer' : formData.organizer)}
                                    </div>
                                )}
                                <h3 className="font-semibold text-blue-900 text-lg mb-2">{formData.title}</h3>
                                <div className="space-y-2 text-blue-800">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {formatDate(formData.date)}
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {formatTime(formData.time, formData.duration)} (Europe/Istanbul)
                                    </div>
                                    {formData.description && <p className="mt-2">{formData.description}</p>}
                                    {(formData.zoomLink || formData.zoomId) && (
                                        <div className="mt-3 pt-3 border-t border-blue-200">
                                            {formData.zoomLink && (
                                                <div className="flex items-center">
                                                    <Video className="w-4 h-4 mr-2" />
                                                    <a
                                                        href={formData.zoomLink}
                                                        className="text-blue-600 hover:underline"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Zoom Bağlantısı
                                                    </a>
                                                </div>
                                            )}
                                            {formData.zoomId && <div className="mt-1">Meeting ID: {formData.zoomId}</div>}
                                            {formData.zoomPassword && <div className="mt-1">Parola: {formData.zoomPassword}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>Etkinlik bilgilerini doldurun</p>
                            </div>
                        )}
                    </div>

                    {/* Calendar Actions */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Takvime Ekle</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button
                                    onClick={() => window.open(getGoogleCalendarUrl(), '_blank')}
                                    disabled={!isFormValid()}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" /> Google Takvim'e Ekle
                                </button>
                                <button
                                    onClick={() => copyToClipboard(getGoogleCalendarUrl(), 'Google Calendar linki')}
                                    disabled={!isFormValid()}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                                >
                                    <Copy className="w-4 h-4 mr-2" /> Linki Kopyala
                                </button>
                            </div>
                            <button
                                onClick={downloadIcal}
                                disabled={!isFormValid()}
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                            >
                                <Download className="w-5 h-5 mr-2" /> .ics Dosyası İndir
                            </button>
                            {!isFormValid() && (
                                <p className="text-sm text-gray-500 text-center">* Etkinlik adı, tarih ve saat alanları zorunludur</p>
                            )}
                        </div>
                    </div>

                    {/* WhatsApp Sharing */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                            <MessageCircle className="w-6 h-6 mr-2 text-green-600" /> WhatsApp Paylaşımı
                        </h2>
                        {isFormValid() ? (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="text-sm text-green-800 whitespace-pre-line font-mono">{getWhatsAppMessage()}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            const msg = getWhatsAppMessage();
                                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                        className="bg-green-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-green-700 transition transform hover:scale-105 flex items-center justify-center"
                                    >
                                        <MessageCircle className="w-5 h-5 mr-2" />
                                        WhatsApp'ta Aç
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(getWhatsAppMessage(), 'WhatsApp mesajı')}
                                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition transform hover:scale-105 flex items-center justify-center"
                                    >
                                        <Copy className="w-5 h-5 mr-2" />
                                        WhatsApp Mesajını Kopyala
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>Etkinlik bilgilerini doldurun</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Panel */}
            <div className="mt-12">
                <AdminPanel isAdmin={isAdmin} onLogin={handleLogin} onLogout={handleLogout} />
            </div>

            {/* Footer */}
            <div className="text-center mt-12 pt-8 border-t border-gray-200">
                <p className="text-gray-600">
                    Patoloji toplantılarınızı kolayca takvime ekleyin • İstanbul zaman dilimi.{' '}
                    <a href="/#ziyaret-mesaji" className="text-blue-600 hover:underline">
                        İletişim
                    </a>
                </p>
            </div>
        </PageContainer>
    );
}
