export type Meeting = {
    id: string | number;
    title: string;
    organizer?: string | null;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    duration?: number | null; // minutes
    description?: string | null;
    has_zoom_info?: boolean | null;
    zoom_link?: string | null;
    zoom_id?: string | null;
    zoom_password?: string | null;
    poster_url?: string | null;
    created_at?: string | null;
};

export type MeetingFormData = {
    title: string;
    organizer: string;
    customOrganizer: string;
    date: string;
    time: string;
    duration: number;
    description: string;
    zoomLink: string;
    zoomId: string;
    zoomPassword: string;
    posterUrl: string;
};

export const IST_TZ = 'Europe/Istanbul';

export const ORGANIZER_EMOJIS: Record<string, string> = {
    'Baş Boyun Patolojisi Çalışma Grubu': '🗣️',
    'Dermatopatoloji Çalışma Grubu': '🧫',
    'Endokrin Patoloji Çalışma Grubu': '🧪',
    'Gastrointestinal Sistem Patolojisi Çalışma Grubu': '🩺',
    'Hematopatoloji Çalışma Grubu': '🩸',
    'Jinekopatoloji Çalışma Grubu': '🌸',
    'Karaciğer-Pankreas-Biliyer Patoloji Çalışma Grubu': '🧬',
    'Kemik ve Yumuşak Doku Patolojisi Çalışma Grubu': '🦴',
    'Meme Patolojisi Çalışma Grubu': '🎗️',
    'Moleküler Patoloji Çalışma Grubu': '🧬',
    'Nöropatoloji Çalışma Grubu': '🧠',
    'Sitopatoloji Çalışma Grubu': '🔬',
    'Toraks Patolojisi Çalışma Grubu': '🫁',
    'Üropatoloji Çalışma Grubu': '💧',
};

export const ORGANIZER_OPTIONS = [
    'Baş Boyun Patolojisi Çalışma Grubu',
    'Dermatopatoloji Çalışma Grubu',
    'Endokrin Patoloji Çalışma Grubu',
    'Gastrointestinal Sistem Patolojisi Çalışma Grubu',
    'Hematopatoloji Çalışma Grubu',
    'Jinekopatoloji Çalışma Grubu',
    'Karaciğer-Pankreas-Biliyer Patoloji Çalışma Grubu',
    'Kemik ve Yumuşak Doku Patolojisi Çalışma Grubu',
    'Meme Patolojisi Çalışma Grubu',
    'Moleküler Patoloji Çalışma Grubu',
    'Nöropatoloji Çalışma Grubu',
    'Sitopatoloji Çalışma Grubu',
    'Toraks Patolojisi Çalışma Grubu',
    'Üropatoloji Çalışma Grubu',
];