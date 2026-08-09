import React from 'react';
import { Bell, CalendarDays, ExternalLink, Send } from 'lucide-react';

const TELEGRAM_URL = 'https://t.me/konsensustakip';
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
            <div className="mb-5">
                <div className="flex items-center gap-2 text-gray-900">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-black">Bildirim ve Takip</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Size uygun yöntemi seçin. Birden fazlasını kullanabilirsiniz.
                </p>
            </div>

            <div className="space-y-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-black text-gray-900">Tarayıcı bildirimi</div>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${pushEnabled ? 'text-emerald-700' : 'text-gray-500'}`}>
                                    <span className={`w-2 h-2 rounded-full ${pushEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                    {pushEnabled ? 'Açık' : 'Kapalı'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">Toplantıdan 15 dakika önce bu cihazda uyarı alın.</div>
                            <button
                                onClick={togglePush}
                                disabled={pushLoading}
                                className={`mt-3 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-black transition ${pushEnabled
                                    ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    }`}
                            >
                                {pushLoading ? 'İşlem…' : pushEnabled ? 'Bildirimi kapat' : 'Bildirimi etkinleştir'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0">
                            <Send className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-black text-gray-900">Telegram kanalı</div>
                            <div className="text-sm text-gray-500 mt-1">Yeni ve yaklaşan toplantı duyurularını Telegram üzerinden takip edin.</div>
                            <a
                                href={TELEGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-black hover:bg-sky-700 transition shadow-sm"
                            >
                                Kanala katıl
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-black text-gray-900">Patoloji Konsensus Takvimi</div>
                            <div className="text-sm text-gray-500 mt-1">Toplantılar ve tarih-saat değişiklikleri takviminize otomatik yansısın.</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <a
                                    href={GOOGLE_CALENDAR_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 transition shadow-sm"
                                >
                                    Google Takvim’e ekle
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <a
                                    href={ICAL_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-gray-600 border border-gray-200 text-sm font-bold hover:bg-gray-50 transition"
                                >
                                    iCal / Outlook
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
