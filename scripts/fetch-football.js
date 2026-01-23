/**
 * Fetch Football Data - Turkish Teams in UEFA Competitions
 * Source: football-data.org
 * 
 * Competitions:
 * - UEFA Champions League (CL)
 * - UEFA Europa League (EL)
 * - UEFA Europa Conference League (ECL)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Configuration
const API_TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const BASE_URL = 'https://api.football-data.org/v4';

// Turkish teams (normalized names for matching)
const TURKISH_TEAMS = [
    'galatasaray', 'fenerbahce', 'fenerbahçe', 'besiktas', 'beşiktaş',
    'trabzonspor', 'basaksehir', 'başakşehir', 'istanbul basaksehir',
    'sivasspor', 'konyaspor', 'adana demirspor', 'antalyaspor',
    'kayserispor', 'alanyaspor', 'pendikspor', 'kasimpasa', 'kasımpaşa'
];

// UEFA Competition codes in football-data.org
const COMPETITIONS = [
    { code: 'CL', name: 'UEFA Champions League' },
    { code: 'EL', name: 'UEFA Europa League' },
    { code: 'ECL', name: 'UEFA Europa Conference League' }
];

const OUTPUT_FILE = path.join(__dirname, '../public/data/football.json');

// Helper: Normalize team name for comparison
function normalizeTeamName(name) {
    return name
        .toLowerCase()
        .replace(/[ğ]/g, 'g')
        .replace(/[ü]/g, 'u')
        .replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i')
        .replace(/[ö]/g, 'o')
        .replace(/[ç]/g, 'c')
        .replace(/\s+/g, ' ')
        .trim();
}

// Helper: Check if team is Turkish
function isTurkishTeam(teamName) {
    const normalized = normalizeTeamName(teamName);
    return TURKISH_TEAMS.some(t => normalized.includes(t));
}

// Helper: Convert UTC to Istanbul time
function toIstanbulTime(utcString) {
    const date = new Date(utcString);
    return date.toLocaleString('sv-SE', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(' ', 'T') + '+03:00';
}

// Fetch from API
async function fetchFromAPI(endpoint) {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
        headers: {
            'X-Auth-Token': API_TOKEN
        }
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// Get matches for a competition
async function getCompetitionMatches(competition) {
    try {
        // Get matches from dateFrom to dateTo (past 14 days + next 14 days)
        const now = new Date();
        const dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 14);
        const dateTo = new Date(now);
        dateTo.setDate(dateTo.getDate() + 14);

        const dateFromStr = dateFrom.toISOString().split('T')[0];
        const dateToStr = dateTo.toISOString().split('T')[0];

        const data = await fetchFromAPI(
            `/competitions/${competition.code}/matches?dateFrom=${dateFromStr}&dateTo=${dateToStr}`
        );

        if (!data.matches) {
            console.log(`No matches found for ${competition.name}`);
            return [];
        }

        // Filter for Turkish teams
        const turkishMatches = data.matches.filter(match =>
            isTurkishTeam(match.homeTeam.name) || isTurkishTeam(match.awayTeam.name)
        );

        console.log(`Found ${turkishMatches.length} Turkish team matches in ${competition.name}`);

        return turkishMatches.map(match => ({
            id: `football-${competition.code}-${match.id}`,
            sport: 'football',
            competition: competition.name,
            season: data.competition?.currentSeason?.startDate?.substring(0, 4) || null,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            startTimeUTC: match.utcDate,
            startTimeLocal: toIstanbulTime(match.utcDate),
            status: match.status === 'FINISHED' ? 'finished' : 'scheduled',
            scoreHome: match.score?.fullTime?.home ?? null,
            scoreAway: match.score?.fullTime?.away ?? null,
            source: 'football-data',
            lastFetchedAt: new Date().toISOString()
        }));

    } catch (error) {
        console.error(`Error fetching ${competition.name}:`, error.message);
        return [];
    }
}

// Main function
async function main() {
    if (!API_TOKEN) {
        console.error('ERROR: FOOTBALL_DATA_TOKEN environment variable not set');
        process.exit(1);
    }

    console.log('Starting football data fetch...');
    console.log(`API Token: ${API_TOKEN.substring(0, 8)}...`);

    let allMatches = [];

    for (const competition of COMPETITIONS) {
        // Add delay between requests to avoid rate limiting
        if (allMatches.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const matches = await getCompetitionMatches(competition);
        allMatches = allMatches.concat(matches);
    }

    // Sort by date
    allMatches.sort((a, b) => new Date(a.startTimeUTC) - new Date(b.startTimeUTC));

    console.log(`Total football matches: ${allMatches.length}`);

    // Write output
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allMatches, null, 2));
    console.log(`Written to: ${OUTPUT_FILE}`);

    return { success: true, count: allMatches.length };
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
