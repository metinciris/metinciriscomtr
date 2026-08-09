import React from 'react';
import { Bell, CalendarPlus, ExternalLink } from 'lucide-react';

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0?cid=YTZmOTYwZDE3ZTQ1ZDYxODU3NDI2NTc3ZTE1YzU4NDkzZTc2ZjY5ZmRmOGU2MmFlMTFkMmFlMjM4MTQwZDgyZUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t';
const ICAL_URL = 'https://calendar.google.com/calendar/ical/a6f960d17e45d61857426577e15c58493e76f69fdf8e62ae11d2ae238140d82e%40group.calendar.google.com/public/basic.ics';

export function NotificationsCard({
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

            <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
                        <CalendarPlus className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-black text-gray-900">Patoloji Konsensus Takvimi</div>
                        <div className="text-sm text-gray-500 mt-1">
                            Takvimi bir kez ekleyin; yeni toplantılar ve tarih-saat değişiklikleri otomatik olarak takviminize yansısın.
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <a
                                href={GOOGLE_CALENDAR_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition shadow-md shadow-emerald-100"
                            >
                                Google Takvim’e ekle
                                <ExternalLink className="w-4 h-4" />
                            </a>

                            <a
                                href={ICAL_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 text-gray-700 font-black hover:bg-gray-200 transition"
                            >
                                Apple / Outlook / iCal
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>

                        <div className="text-xs text-gray-400 mt-2">
                            Google Takvim’e ilk ekleme işlemi bilgisayar tarayıcısında daha sorunsuz çalışır.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
