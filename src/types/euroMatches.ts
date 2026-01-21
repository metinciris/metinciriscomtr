export interface Match {
    id: string;
    competition: 'EuroLeague' | 'EuroCup';
    round: string; // e.g., "Regular Season Round 1"
    startTimeISO: string; // ISO 8601 format
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    venue?: string;
    status: 'scheduled' | 'finished' | 'live';
}

export interface TeamConfig {
    names: string[]; // List of team names to filter (e.g., ["Fenerbahçe Beko", "Anadolu Efes"])
    logoUrl?: string; // Optional: helper for logic if needed later
}

export const TURKISH_TEAMS = [
    "Fenerbahçe Beko",
    "Anadolu Efes",
    "Türk Telekom",
    "Beşiktaş Fibabanka",
    "Bahçeşehir Koleji"
];

// Helper to check if a match involves a Turkish team
export const isTurkishTeamMatch = (match: Match): boolean => {
    return TURKISH_TEAMS.some(team =>
        match.homeTeam.includes(team) || match.awayTeam.includes(team)
    );
};
