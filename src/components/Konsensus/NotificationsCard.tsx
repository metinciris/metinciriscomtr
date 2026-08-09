import React, { useState } from 'react';
import { Bell, CalendarDays, ChevronDown, ExternalLink, Send, Smartphone } from 'lucide-react';

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
    const [open, setOpen] = useState(false);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition"
            >
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 shrink-0">
                    <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-black text-gray-900">Bildirim ve Takip</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Telegram kanalımız üzerinden bildirim alın; diğer seçenekler için açın.
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {pushEnabled && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Tarayıcı bildirimi açık" />}
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {open && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                    <div className="flex items-start gap-3 rounded-xl bg-blue-50/60 p-3">
                        <Bell className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-gray-900">Tarayıcı bildirimi</span>
                                <span className={`text-xs font-bold ${pushEnabled ? 'text-emerald-700' : 'text-gray-500'}`}>
                                    {pushEnabled ? 'Açık' : 'Kapalı'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Toplantıdan 15 dakika önce bu cihazda uyarı alın.</p>
                            <button
                                type="button"
                                onClick={togglePush}
                                disabled={pushLoading}
                                className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-black transition ${pushEnabled
                                    ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {pushLoading ? 'İşlem…' : pushEnabled ? 'Kapat' : 'Etkinleştir'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl bg-sky-50/60 p-3">
                        <Send className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                            <div className="font-black text-sm text-gray-900">Telegram kanalı</div>
                            <p className="text-xs text-gray-500 mt-1">Toplantı duyurularını ve hatırlatmaları Telegram’dan takip edin.</p>
                            <a
                                href={TELEGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-black hover:bg-sky-700 transition"
                            >
                                Kanala katıl
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl bg-emerald-50/60 p-3">
                        <CalendarDays className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                            <div className="font-black text-sm text-gray-900">Google Takvim</div>
                            <p className="text-xs text-gray-500 mt-1">
                                Toplantılar ve tarih-saat değişiklikleri takviminize yansısın. Google Takvim’in ilk aboneliği bilgisayardan yapılmalı.
                            </p>
                            <a
                                href={GOOGLE_CALENDAR_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition"
                            >
                                Google Takvim’e ekle
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <Smartphone className="w-5 h-5 text-gray-700 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                            <div className="font-black text-sm text-gray-900">iPhone / Apple Takvim</div>
                            <p className="text-xs text-gray-500 mt-1">iPhone’da public iCal bağlantısını kullanarak telefondan abone olabilirsiniz.</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <a
                                    href={ICAL_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-black hover:bg-gray-800 transition"
                                >
                                    iPhone / Apple Takvim’e ekle
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <a
                                    href={ICAL_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white text-gray-600 border border-gray-200 text-xs font-bold hover:bg-gray-50 transition"
                                >
                                    Outlook / iCal
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
