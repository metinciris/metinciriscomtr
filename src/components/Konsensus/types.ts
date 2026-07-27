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

export const ORGANIZER_OPTIONS = [
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
