import React from 'react';
import { Bell, CalendarPlus, ExternalLink } from 'lucide-react';

export function NotificationsCard({
    pushEnabled,
    pushLoading,
    togglePush,
}: {
    pushEnabled: boolean;
    pushLoading: boolean;
    togglePush: () => void;
}) {
    const calendarUrl = (import.meta.env.VITE_CONSENSUS_CALENDAR_URL ?? '').trim();

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
                    className={`hidden md:inline-flex items-center justify-center px-4 py-2 rounded-2xl font-black transition ${pushEnabled ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                        }`}
                >
                    {pushLoading ? 'İşlem…' : pushEnabled ? 'Kapat' : 'Etkinleştir'}
                </button>
            </div>

            <button
                onClick={togglePush}
                disabled={pushLoading}
                className={`md:hidden mt-4 w-full py-3 rounded-2xl font-black transition ${pushEnabled ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                    }`}
            >
                {pushLoading ? 'İşlem…' : pushEnabled ? 'Bildirimleri kapat' : 'Bildirimleri etkinleştir'}
            </button>

            {calendarUrl && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
                            <CalendarPlus className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-black text-gray-900">Konsensus Takvimi</div>
                            <div className="text-sm text-gray-500 mt-1">
                                Google Takvim’e bir kez ekleyin; toplantı tarih ve saat değişiklikleri takviminize yansısın.
                            </div>
                            <a
                                href={calendarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition shadow-md shadow-emerald-100"
                            >
                                Google Takvim’de takip et
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
