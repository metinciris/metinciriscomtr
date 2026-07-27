import { IST_TZ, Meeting, ORGANIZER_EMOJIS } from './types';

export function getOrganizerWithEmoji(organizer?: string | null): string {
    const name = organizer || '';
    if (!name) return '';
    const emoji = ORGANIZER_EMOJIS[name] || '';
    return emoji ? `${emoji} ${name}` : name;
}

export function normalizeId(id: string | number) {
    return typeof id === 'string' ? id : String(id);
}

export function parseYMD(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return { y, m, d };
}

export function dateKeyInTz(d: Date, timeZone = IST_TZ) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
}

export function formatDateTR(dateString: string): string {
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

export function addMinutesToDateTime(dateStr: string, timeStr: string, minutesToAdd: number) {
    const { y, m, d } = parseYMD(dateStr);
    const [hh, mm] = timeStr.split(':').map(Number);
    const base = new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0));
    const next = new Date(base.getTime() + minutesToAdd * 60000);
    const yy = next.getUTCFullYear();
    const mo = String(next.getUTCMonth() + 1).padStart(2, '0');
    const da = String(next.getUTCDate()).padStart(2, '0');
    const h = String(next.getUTCHours()).padStart(2, '0');
    const mi = String(next.getUTCMinutes()).padStart(2, '0');
    return { date: `${yy}-${mo}-${da}`, time: `${h}:${mi}` };
}

export function toTimeRange(time: string, durationMinutes: number): string {
    const end = addMinutesToDateTime('2000-01-01', time, durationMinutes).time;
    return `${time} - ${end}`;
}

export function toCompact(dateStr: string, timeStr: string) {
    const { y, m, d } = parseYMD(dateStr);
    const [hh, mm] = timeStr.split(':').map(Number);
    const yy = String(y).padStart(4, '0');
    const mo = String(m).padStart(2, '0');
    const da = String(d).padStart(2, '0');
    const h = String(hh).padStart(2, '0');
    const mi = String(mm).padStart(2, '0');
    return `${yy}${mo}${da}T${h}${mi}00`;
}

export function canShowZoomInfo(m: Meeting, now = new Date()): boolean {
    if (!m.date) return false;
    const { y, m: month, d } = parseYMD(m.date);
    const [hh, mm] = (m.time || '20:00').split(':').map(Number);
    const meetingStartUTC = Date.UTC(y, month - 1, d, hh - 3, mm, 0, 0);
    const zoomVisibleStart = meetingStartUTC - 120 * 60 * 1000;
    const zoomVisibleEnd = Date.UTC(y, month - 1, d + 1, -3, 0, 0);

    const nowTs = now.getTime();
    return nowTs >= zoomVisibleStart && nowTs < zoomVisibleEnd;
}

export function canShowPoster(m: Meeting, now = new Date()): boolean {
    if (!m.date) return false;
    const { y, m: month, d } = parseYMD(m.date);
    const todayKey = dateKeyInTz(now, IST_TZ);
    const { y: ty, m: tm, d: td } = parseYMD(todayKey);
    const todayStartUTC = Date.UTC(ty, tm - 1, td, 0, 0, 0);
    const meetingDateUTC = Date.UTC(y, month - 1, d, 0, 0, 0);
    const diffDays = Math.floor((todayStartUTC - meetingDateUTC) / (24 * 60 * 60 * 1000));
    return diffDays <= 30;
}

export function getZoomVisibilityCountdown(m: Meeting, now = new Date()): string {
    if (!m.date) return '';
    const { y, m: month, d } = parseYMD(m.date);
    const [hh, mm] = (m.time || '20:00').split(':').map(Number);
    const meetingStartUTC = Date.UTC(y, month - 1, d, hh - 3, mm, 0, 0);
    const zoomVisibleStart = meetingStartUTC - 120 * 60 * 1000;
    const diffMs = zoomVisibleStart - now.getTime();

    if (diffMs <= 0) return '';
    const totalMinutes = Math.ceil(diffMs / 60000);

    if (totalMinutes > 24 * 60) return '';

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0) {
        if (mins > 0) {
            return `Zoom bilgileri ${hours} saat ${mins} dakika sonra yayınlanacak.`;
        }
        return `Zoom bilgileri ${hours} saat sonra yayınlanacak.`;
    }
    return `Zoom bilgileri ${mins} dakika sonra yayınlanacak.`;
}

export function buildGoogleCalendarUrl(m: Meeting, now = new Date()) {
    const duration = Math.max(15, m.duration ?? 60);
    const start = toCompact(m.date, m.time || '20:00');
    const endParts = addMinutesToDateTime(m.date, m.time || '20:00', duration);
    const end = toCompact(endParts.date, endParts.time);

    const showZoom = canShowZoomInfo(m, now);

    let details = (m.description ?? '').trim();
    if (m.organizer) details = `Düzenleyen: ${m.organizer}\n\n${details}`;
    if (showZoom) {
        if (m.zoom_link) details += `\n\nZoom: ${m.zoom_link}`;
        if (m.zoom_id) details += `\nZoom ID: ${m.zoom_id}`;
        if (m.zoom_password) details += `\nŞifre: ${m.zoom_password}`;
    }

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: m.title,
        dates: `${start}/${end}`,
        details,
        ctz: IST_TZ,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(m: Meeting, now = new Date()) {
    const duration = Math.max(15, m.duration ?? 60);
    const start = toCompact(m.date, m.time || '20:00');
    const endParts = addMinutesToDateTime(m.date, m.time || '20:00', duration);
    const end = toCompact(endParts.date, endParts.time);

    const showZoom = canShowZoomInfo(m, now);

    let description = (m.description ?? '').replace(/\n/g, '\\n');
    if (m.organizer) description = `Düzenleyen: ${m.organizer}\\n\\n${description}`;
    if (showZoom) {
        if (m.zoom_link) description += `\\n\\nZoom: ${m.zoom_link}`;
        if (m.zoom_id) description += `\\nZoom ID: ${m.zoom_id}`;
        if (m.zoom_password) description += `\\nŞifre: ${m.zoom_password}`;
    }

    const location = (showZoom && m.zoom_link) ? `LOCATION:${m.zoom_link}` : '';

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

export function downloadIcs(m: Meeting, now = new Date()) {
    const ics = buildIcs(m, now);
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

export function getMeetingStatus(m: Meeting, now: Date) {
    const todayKey = dateKeyInTz(now, IST_TZ);
    if (m.date !== todayKey) return { isLive: false, isUpcoming: false, isPastToday: m.date < todayKey };

    const duration = Math.max(15, m.duration ?? 60);
    const [hh, mm] = (m.time || '20:00').split(':').map(Number);
    const meetingStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
    const meetingEnd = new Date(meetingStart.getTime() + duration * 60000);

    const isLive = now >= meetingStart && now <= meetingEnd;
    const isUpcoming = now < meetingStart;
    const isPastToday = now > meetingEnd;

    return { isLive, isUpcoming, isPastToday, meetingStart };
}

export const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number) {
    // 0: Pazar, 1: Pazartesi, ...
    // Bizim için 1: Pazartesi, ..., 0: Pazar (Pazartesi ile başlasın)
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

export function getCountdownString(meetingStart: Date, now: Date): string {
    const diffMs = meetingStart.getTime() - now.getTime();
    if (diffMs <= 0) return '';

    const diffMin = Math.round(diffMs / 60000);
    if (diffMin <= 5) return `BAŞLIYOR (Son ${diffMin} dk)`;

    const h = Math.floor(diffMin / 60);
    const min = diffMin % 60;
    return h > 0 ? `${h} saat ${min} dk kaldı` : `${min} dk kaldı`;
}

export function isMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function shareWhatsApp(m: Meeting, now = new Date()) {
    const duration = Math.max(15, m.duration ?? 60);
    const endParts = addMinutesToDateTime(m.date, m.time || '20:00', duration);

    const organizer = m.organizer || 'Patoloji Toplantısı';

    const EMOJI = {
        micro: '\u{1F52C}',
        clipboard: '\u{1F4CB}',
        cal: '\u{1F4C6}',
        clock: '\u{1F550}',
        note: '\u{1F4DD}',
        alarm: '\u{23F0}',
        live: '\u{1F7E2}',
        bell: '\u{1F514}',
    };

    const todayKey = dateKeyInTz(now, IST_TZ);

    const { y, m: mo, d } = parseYMD(todayKey);
    const base = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
    const tomorrowKey = dateKeyInTz(
        new Date(base.getTime() + 24 * 60 * 60 * 1000),
        IST_TZ
    );

    let headerLine = '';

    if (m.date === todayKey) {
        const status = getMeetingStatus(m, now);

        if (status.isLive && status.meetingStart) {
            const liveMin = Math.floor((now.getTime() - status.meetingStart.getTime()) / 60000);
            headerLine = `${EMOJI.live} *ŞU ANDA CANLI* — ${liveMin} dk oldu\n\n`;
        } else if (status.isUpcoming && status.meetingStart) {
            const diffMin = Math.round((status.meetingStart.getTime() - now.getTime()) / 60000);
            if (diffMin <= 5) {
                headerLine = `${EMOJI.bell} *SON ${diffMin} DK!* ${EMOJI.alarm}\n\n`;
            } else {
                const remain = getCountdownString(status.meetingStart, now);
                headerLine = `🔴 *BUGÜN* ${EMOJI.alarm} *${remain}*\n\n`;
            }
        } else {
            headerLine = `🔴 *BUGÜN* — (toplantı bitti)\n\n`;
        }
    } else if (m.date === tomorrowKey) {
        headerLine = `🟠 *YARIN*\n\n`;
    }

    let msg = `${headerLine}${EMOJI.micro} *${organizer}* ${EMOJI.micro}\n\n`;
    msg += `${EMOJI.clipboard} *${m.title}*\n\n`;
    msg += `${EMOJI.cal} *Tarih:* ${formatDateTR(m.date)}\n`;
    msg += `${EMOJI.clock} *Saat:* ${(m.time || '20:00')} - ${endParts.time} (Türkiye)\n`;

    if (m.description) {
        msg += `\n${EMOJI.note} *Açıklama:* ${m.description}\n`;
    }

    const showZoom = canShowZoomInfo(m, now);

    if (showZoom) {
        if (m.zoom_id || m.zoom_password || m.zoom_link) {
            msg += `\n🔗 *Zoom Bilgileri:*\n`;
            if (m.zoom_id) msg += `• ID: ${m.zoom_id}\n`;
            if (m.zoom_password) msg += `• Şifre: ${m.zoom_password}\n`;
            if (!m.zoom_id && !m.zoom_password && m.zoom_link) {
                msg += `• Bağlantı: ${m.zoom_link}\n`;
            }
        }
    } else {
        msg += `\nGüncel Zoom katılım bilgileri toplantıdan 2 saat önce yayınlanacaktır:\nhttps://konsensus.bolt.host\n`;
    }

    msg += `\n📅 *Google Takvim'e Ekle:*\n${buildGoogleCalendarUrl(m, now)}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(msg).catch(() => { });
    }

    const encoded = encodeURIComponent(msg);
    const url = isMobileDevice()
        ? `https://wa.me/?text=${encoded}`
        : `https://web.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
}



