export interface Match {
    id: string;
    competition: string; // e.g. 'EuroLeague', 'EuroCup', 'Super Lig'
    type?: string; // 'EuroLeague', 'EuroCup', 'Super Lig', 'National'
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
    "Bahçeşehir Koleji",
    "Fenerbahçe", // Super Lig variation
    "Galatasaray",
    "Beşiktaş",
    "Trabzonspor"
];

// Helper to check if a match involves a Turkish team (mainly for Euro context)
export const isTurkishTeamMatch = (match: Match): boolean => {
    // If it's Super Lig or National team, it's inherently relevant
    if (match.competition === 'Super Lig' || match.type === 'National') return true;

    return TURKISH_TEAMS.some(team =>
        match.homeTeam.includes(team) || match.awayTeam.includes(team)
    );
};
