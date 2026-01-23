/**
 * Fetch Football Data - Turkish Teams in UEFA Competitions
 * Sources: 
 * - football-data.org (Champions League - Current Season)
 * - api-sports.io (Europa League & Conference League - Season 2024)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Configuration
const API_TOKEN_FOOTBALL_DATA = process.env.FOOTBALL_DATA_TOKEN;
const API_KEY_APISPORTS = process.env.APIFOOTBALL_KEY;

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';
const APISPORTS_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

// Turkish teams (normalized names for matching)
const TURKISH_TEAMS = [
    'galatasaray', 'fenerbahce', 'fenerbahçe', 'besiktas', 'beşiktaş',
    'trabzonspor', 'basaksehir', 'başakşehir', 'istanbul basaksehir',
    'sivasspor', 'konyaspor', 'adana demirspor', 'antalyaspor',
    'kayserispor', 'alanyaspor', 'pendikspor', 'kasimpasa', 'kasımpaşa'
];

const OUTPUT_FILE = path.join(__dirname, '../public/data/football.json');

// Helper: Normalize team name for comparison
function normalizeTeamName(name) {
    if (!name) return '';
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

// Fetch from football-data.org
async function fetchFootballData(endpoint) {
    const url = `${FOOTBALL_DATA_BASE_URL}${endpoint}`;
    console.log(`Fetching from football-data.org: ${url}`);

    const response = await fetch(url, {
        headers: {
            'X-Auth-Token': API_TOKEN_FOOTBALL_DATA
        }
    });

    if (!response.ok) {
        throw new Error(`football-data.org error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// Fetch from api-sports.io (Football)
async function fetchApiSportsFootball(endpoint) {
    const url = `${APISPORTS_FOOTBALL_BASE_URL}${endpoint}`;
    console.log(`Fetching from api-sports.io (football): ${url}`);

    const response = await fetch(url, {
        headers: {
            'x-rapidapi-key': API_KEY_APISPORTS,
            'x-rapidapi-host': 'v3.football.api-sports.io'
        }
    });

    if (!response.ok) {
        throw new Error(`api-sports.io error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
        throw new Error(`api-sports.io API error: ${JSON.stringify(data.errors)}`);
    }

    return data;
}

// Get Champions League (remains on football-data.org)
async function getChampionsLeagueMatches() {
    try {
        const data = await fetchFootballData('/competitions/CL/matches');
        if (!data.matches) return [];

        const turkishMatches = data.matches.filter(match =>
            isTurkishTeam(match.homeTeam.name) || isTurkishTeam(match.awayTeam.name)
        );

        return turkishMatches.map(match => ({
            id: `football-CL-${match.id}`,
            sport: 'football',
            competition: 'UEFA Champions League',
            season: '2024/25',
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
        console.error('Error fetching CL from football-data.org:', error.message);
        return [];
    }
}

// Get Europa League & Conference League from api-sports.io
async function getApiSportsFootballMatches(leagueId, competitionName) {
    try {
        // Use season 2024 (covers 2024/25)
        const data = await fetchApiSportsFootball(`/fixtures?league=${leagueId}&season=2024`);
        if (!data.response || !Array.isArray(data.response)) return [];

        const turkishMatches = data.response.filter(item =>
            isTurkishTeam(item.teams.home.name) || isTurkishTeam(item.teams.away.name)
        );

        return turkishMatches.map(item => ({
            id: `football-${competitionName.replace(/\s+/g, '')}-${item.fixture.id}`,
            sport: 'football',
            competition: competitionName,
            season: '2024/25',
            homeTeam: item.teams.home.name,
            awayTeam: item.teams.away.name,
            startTimeUTC: item.fixture.date,
            startTimeLocal: toIstanbulTime(item.fixture.date),
            status: item.fixture.status.short === 'FT' ? 'finished' : 'scheduled',
            scoreHome: item.goals.home ?? null,
            scoreAway: item.goals.away ?? null,
            source: 'api-sports',
            lastFetchedAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error(`Error fetching ${competitionName} from api-sports.io:`, error.message);
        return [];
    }
}

// Main function
async function main() {
    console.log('Starting football data fetch...');

    let allMatches = [];

    // 1. CL from football-data
    if (API_TOKEN_FOOTBALL_DATA) {
        const clMatches = await getChampionsLeagueMatches();
        allMatches = [...allMatches, ...clMatches];
    }

    // 2. EL from api-sports
    if (API_KEY_APISPORTS) {
        const elMatches = await getApiSportsFootballMatches(3, 'UEFA Europa League');
        allMatches = [...allMatches, ...elMatches];

        // 3. ECL from api-sports
        const eclMatches = await getApiSportsFootballMatches(848, 'UEFA Conference League');
        allMatches = [...allMatches, ...eclMatches];
    } else {
        console.warn('APIFOOTBALL_KEY not set, skipping EL/ECL from api-sports.io');
    }

    // Filter by date window (past 14 days + next 14 days)
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - 14);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 14);

    const filteredMatches = allMatches.filter(match => {
        const d = new Date(match.startTimeUTC);
        return d >= windowStart && d <= windowEnd;
    });

    // Sort by date
    filteredMatches.sort((a, b) => new Date(a.startTimeUTC) - new Date(b.startTimeUTC));

    console.log(`Total football matches after filtering: ${filteredMatches.length}`);

    // Write output
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filteredMatches, null, 2));
    console.log(`Written to: ${OUTPUT_FILE}`);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
