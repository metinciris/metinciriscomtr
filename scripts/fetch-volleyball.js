/**
 * Fetch Volleyball Data - Turkish Teams in European Competitions
 * Source: api-sports.io (Volleyball)
 * 
 * Competitions:
 * - Champions League (248)
 * - Champions League Women (251)
 * - CEV Cup (255)
 * - CEV Cup Women (256)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Configuration
const API_KEY = process.env.APIFOOTBALL_KEY;
const BASE_URL = 'https://v1.volleyball.api-sports.io';

// Turkish volleyball teams
const TURKISH_TEAMS = [
    'vakifbank', 'vakıfbank', 'vakifbank istanbul',
    'eczacibasi', 'eczacıbaşı', 'eczacibasi istanbul',
    'fenerbahce', 'fenerbahçe', 'fenerbahce opet',
    'turk hava yollari', 'türk hava yolları', 'thy',
    'galatasaray', 'galatasaray hdi',
    'halkbank', 'halkbank ankara',
    'arkas', 'arkas izmir',
    'ziraat bankasi', 'ziraat bankası',
    'ibk', 'ibk ankara'
];

// Leagues to check
const LEAGUES = [
    { id: 248, name: 'Champions League' },
    { id: 251, name: 'Champions League Women' },
    { id: 255, name: 'CEV Cup' },
    { id: 256, name: 'CEV Cup Women' }
];

const OUTPUT_FILE = path.join(__dirname, '../public/data/volleyball.json');

// Helper: Normalize
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

function isTurkishTeam(teamName) {
    const normalized = normalizeTeamName(teamName);
    return TURKISH_TEAMS.some(t => normalized.includes(t));
}

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

async function fetchFromAPI(endpoint) {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'v1.volleyball.api-sports.io'
        }
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

async function getLeagueMatches(league) {
    try {
        // Use season 2024 for free tier
        const data = await fetchFromAPI(`/games?league=${league.id}&season=2024`);
        if (!data.response) return [];

        const turkishMatches = data.response.filter(game =>
            isTurkishTeam(game.teams.home.name) || isTurkishTeam(game.teams.away.name)
        );

        return turkishMatches.map(game => ({
            id: `volleyball-${league.id}-${game.id}`,
            sport: 'volleyball',
            competition: league.name,
            season: '2024/25',
            homeTeam: game.teams.home.name,
            awayTeam: game.teams.away.name,
            startTimeUTC: game.date,
            startTimeLocal: toIstanbulTime(game.date),
            status: (game.status && game.status.short === 'FT') ? 'finished' : 'scheduled',
            scoreHome: game.scores ? game.scores.home : null,
            scoreAway: game.scores ? game.scores.away : null,
            source: 'api-sports',
            lastFetchedAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error(`Error fetching ${league.name}:`, error.message);
        return [];
    }
}

async function main() {
    if (!API_KEY) {
        console.error('ERROR: APIFOOTBALL_KEY not set');
        process.exit(1);
    }

    let allMatches = [];
    for (const league of LEAGUES) {
        const matches = await getLeagueMatches(league);
        allMatches = [...allMatches, ...matches];
    }

    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - 14);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 14);

    const filteredMatches = allMatches.filter(match => {
        const d = new Date(match.startTimeUTC);
        return d >= windowStart && d <= windowEnd;
    });

    filteredMatches.sort((a, b) => new Date(a.startTimeUTC) - new Date(b.startTimeUTC));

    console.log(`Total volleyball matches: ${filteredMatches.length}`);
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filteredMatches, null, 2));
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
