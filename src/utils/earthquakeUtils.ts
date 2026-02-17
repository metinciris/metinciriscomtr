export const ISPARTA_COORDS = { lat: 37.7648, lng: 30.5567 };
export const NEAR_KM = 100;
export const IST_TZ = 'Europe/Istanbul';

export const normalizeDateString = (s: any): string => {
    if (!s) return '';
    let str = String(s).trim();
    if (str.includes(' ') && !str.includes('T')) str = str.replace(' ', 'T');
    const hasTz = /(Z|[+\-]\d{2}:\d{2})$/.test(str);
    const isoNoTz = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str);
    if (!hasTz && isoNoTz) str = `${str}Z`;
    return str;
};

export const parseDateAsIstanbul = (dateStr: string): Date => {
    const s = normalizeDateString(dateStr);
    return new Date(s);
};

export const deg2rad = (deg: number) => deg * (Math.PI / 180);

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const getTimeAgo = (dateStr: string) => {
    const date = parseDateAsIstanbul(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const totalMinutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const days = Math.floor(hours / 24);

    if (totalMinutes < 60) return `${totalMinutes} dk önce`;
    if (hours < 24) {
        const min = totalMinutes % 60;
        return min === 0 ? `${hours} saat önce` : `${hours} saat ${min} dk önce`;
    }
    if (days === 1) return 'Dün';
    return `${days} gün önce`;
};

export const formatTimeIstanbul = (d: Date) =>
    new Intl.DateTimeFormat('tr-TR', {
        timeZone: IST_TZ,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(d);

export const formatDateIstanbul = (dateStr: string) => {
    try {
        const date = parseDateAsIstanbul(dateStr);
        return new Intl.DateTimeFormat('tr-TR', {
            timeZone: IST_TZ,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch {
        return dateStr;
    }
};

export const toIstanbulParam = (d: Date) => {
    const parts = new Intl.DateTimeFormat('sv-SE', {
        timeZone: IST_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).formatToParts(d);

    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
};
