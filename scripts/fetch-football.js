/**
 * Fetch Football Data - Turkish Teams in UEFA Competitions
 * Sources: 
 * - football-data.org (Champions League - 2025/26 Season)
 * - fixturedownload.com (Europa League & Conference League - 2025/26 Season)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Configuration
const API_TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';

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
    const date = new Date(utcString.replace(' ', 'T'));
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
            'X-Auth-Token': API_TOKEN
        }
    });

    if (!response.ok) {
        throw new Error(`football-data.org error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// Fetch from fixturedownload.com
async function fetchFixtureDownloadData(url) {
    console.log(`Fetching from fixturedownload.com: ${url}`);
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    if (!response.ok) {
        throw new Error(`fixturedownload error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

// Get Champions League (Current 2025/26 Season)
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
            season: '2025/26',
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

// Get Europa League & Conference League (from fixturedownload.com - 2025/26 Season)
async function getFixtureDownloadMatches(url, competitionName) {
    try {
        const data = await fetchFixtureDownloadData(url);
        if (!Array.isArray(data)) return [];

        const turkishMatches = data.filter(match =>
            isTurkishTeam(match.HomeTeam) || isTurkishTeam(match.AwayTeam)
        );

        return turkishMatches.map((match, idx) => ({
            id: `football-${competitionName.replace(/\s+/g, '')}-${idx}`,
            sport: 'football',
            competition: competitionName,
            season: '2025/26',
            homeTeam: match.HomeTeam,
            awayTeam: match.AwayTeam,
            startTimeUTC: match.DateUtc,
            startTimeLocal: toIstanbulTime(match.DateUtc),
            status: (match.HomeTeamScore !== null && match.AwayTeamScore !== null) ? 'finished' : 'scheduled',
            scoreHome: match.HomeTeamScore,
            scoreAway: match.AwayTeamScore,
            source: 'fixturedownload',
            lastFetchedAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error(`Error fetching ${competitionName} from fixturedownload.com:`, error.message);
        return [];
    }
}

// Main function
async function main() {
    console.log('Starting football data fetch (2025/26 season)...');

    let allMatches = [];

    // 1. CL from football-data
    if (API_TOKEN) {
        const clMatches = await getChampionsLeagueMatches();
        allMatches = [...allMatches, ...clMatches];
    } else {
        console.warn('FOOTBALL_DATA_TOKEN not set, skipping CL from football-data.org');
    }

    // 2. EL from fixturedownload (2025 represents 2025/26)
    const elMatches = await getFixtureDownloadMatches(
        'https://fixturedownload.com/feed/json/europa-league-2025',
        'UEFA Europa League'
    );
    allMatches = [...allMatches, ...elMatches];

    // 3. ECL from fixturedownload (2025 represents 2025/26)
    const eclMatches = await getFixtureDownloadMatches(
        'https://fixturedownload.com/feed/json/conference-league-2025',
        'UEFA Conference League'
    );
    allMatches = [...allMatches, ...eclMatches];

    // Filter by date window (past 14 days + next 14 days)
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - 14);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 14);

    const filteredMatches = allMatches.filter(match => {
        const d = new Date(match.startTimeUTC.replace(' ', 'T'));
        return d >= windowStart && d <= windowEnd;
    });

    // Sort by date
    filteredMatches.sort((a, b) => new Date(a.startTimeUTC.replace(' ', 'T')) - new Date(b.startTimeUTC.replace(' ', 'T')));

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
