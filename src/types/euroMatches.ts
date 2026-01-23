/**
 * Euro Matches Types
 * Unified data model for football, basketball, and volleyball matches
 */

export type SportType = 'football' | 'basketball' | 'volleyball';
export type MatchStatus = 'scheduled' | 'finished';
export type DataSource = 'football-data' | 'api-football';

export interface EuroMatch {
    id: string;
    sport: SportType;
    competition: string;
    season?: string | null;
    homeTeam: string;
    awayTeam: string;
    startTimeUTC: string;
    startTimeLocal: string;
    status: MatchStatus;
    scoreHome?: number | null;
    scoreAway?: number | null;
    source: DataSource;
    lastFetchedAt: string;
}

export interface LastUpdatedInfo {
    lastUpdated: string;
    football: SportStatus;
    basketball: SportStatus;
    volleyball: SportStatus;
}

export interface SportStatus {
    status: 'success' | 'error';
    matchCount: number;
    updatedAt: string;
    error?: string;
}

// Turkish Teams Lists

export const TURKISH_FOOTBALL_TEAMS = [
    "Galatasaray",
    "Fenerbahçe",
    "Beşiktaş",
    "Trabzonspor",
    "Başakşehir",
    "Istanbul Basaksehir",
    "Sivasspor",
    "Konyaspor",
    "Adana Demirspor",
    "Alanyaspor"
];

export const TURKISH_BASKETBALL_TEAMS = [
    "Fenerbahçe Beko",
    "Fenerbahce Beko",
    "Anadolu Efes",
    "Türk Telekom",
    "Turk Telekom",
    "Beşiktaş Fibabanka",
    "Besiktas",
    "Bahçeşehir Koleji",
    "Bahcesehir Koleji",
    "Galatasaray Nef",
    "Galatasaray",
    "Pınar Karşıyaka",
    "Pinar Karsiyaka",
    "Darüşşafaka",
    "Darussafaka",
    "TOFAŞ",
    "Tofas Bursa"
];

export const TURKISH_VOLLEYBALL_TEAMS = [
    "VakıfBank",
    "Vakifbank",
    "Eczacıbaşı",
    "Eczacibasi",
    "Fenerbahçe Opet",
    "Fenerbahce Opet",
    "Türk Hava Yolları",
    "THY",
    "Galatasaray HDI",
    "Galatasaray",
    "Halkbank",
    "Arkas",
    "Ziraat Bankası",
    "Ziraat Bankasi"
];

// Helper: Check if a match involves a Turkish team
export const isTurkishTeamMatch = (match: EuroMatch): boolean => {
    const allTeams = [
        ...TURKISH_FOOTBALL_TEAMS,
        ...TURKISH_BASKETBALL_TEAMS,
        ...TURKISH_VOLLEYBALL_TEAMS
    ];

    const normalizedHome = match.homeTeam.toLowerCase();
    const normalizedAway = match.awayTeam.toLowerCase();

    return allTeams.some(team =>
        normalizedHome.includes(team.toLowerCase()) ||
        normalizedAway.includes(team.toLowerCase())
    );
};

// Helper: Get sport display name in Turkish
export const getSportDisplayName = (sport: SportType): string => {
    switch (sport) {
        case 'football': return 'Futbol';
        case 'basketball': return 'Basketbol';
        case 'volleyball': return 'Voleybol';
        default: return sport;
    }
};

// Helper: Get sport emoji
export const getSportEmoji = (sport: SportType): string => {
    switch (sport) {
        case 'football': return '⚽';
        case 'basketball': return '🏀';
        case 'volleyball': return '🏐';
        default: return '🏆';
    }
};
