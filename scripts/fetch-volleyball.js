/**
 * Fetch Volleyball Data - Turkish Teams in European Competitions
 * Source: API-Football (api-football.com) - Volleyball Endpoint
 * 
 * Competitions:
 * - CEV Champions League
 * - CEV Cup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Configuration
const API_KEY = process.env.APIFOOTBALL_KEY;
const BASE_URL = 'https://v1.volleyball.api-sports.io';

// Turkish volleyball teams (normalized names for matching)
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

// European leagues to check (IDs from API-Sports volleyball)
const LEAGUES = [
    { id: 80, name: 'CEV Champions League' },
    { id: 81, name: 'CEV Cup' }
];

const OUTPUT_FILE = path.join(__dirname, '../public/data/volleyball.json');

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
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'v1.volleyball.api-sports.io'
        }
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('API returned errors:', data.errors);
        return null;
    }

    return data;
}

// Get matches for a league
async function getLeagueMatches(league) {
    try {
        // Get current season
        const currentYear = new Date().getFullYear();
        const season = `${currentYear - 1}-${currentYear}`;

        // Get matches from dateFrom to dateTo (past 14 days + next 14 days)
        const now = new Date();
        const dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 14);
        const dateTo = new Date(now);
        dateTo.setDate(dateTo.getDate() + 14);

        const dateFromStr = dateFrom.toISOString().split('T')[0];

        const data = await fetchFromAPI(
            `/games?league=${league.id}&season=${season}&date=${dateFromStr}`
        );

        if (!data || !data.response) {
            console.log(`No data for ${league.name}`);
            return [];
        }

        // Also fetch more dates
        let allGames = [...data.response];

        // Fetch remaining dates
        const currentDate = new Date(dateFrom);
        currentDate.setDate(currentDate.getDate() + 1);

        while (currentDate <= dateTo) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting

            const dateStr = currentDate.toISOString().split('T')[0];
            const dayData = await fetchFromAPI(
                `/games?league=${league.id}&season=${season}&date=${dateStr}`
            );

            if (dayData && dayData.response) {
                allGames = allGames.concat(dayData.response);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Filter for Turkish teams
        const turkishMatches = allGames.filter(game =>
            isTurkishTeam(game.teams?.home?.name || '') ||
            isTurkishTeam(game.teams?.away?.name || '')
        );

        console.log(`Found ${turkishMatches.length} Turkish team matches in ${league.name}`);

        return turkishMatches.map(game => ({
            id: `volleyball-${league.id}-${game.id}`,
            sport: 'volleyball',
            competition: league.name,
            season: season,
            homeTeam: game.teams?.home?.name || 'Unknown',
            awayTeam: game.teams?.away?.name || 'Unknown',
            startTimeUTC: game.date,
            startTimeLocal: toIstanbulTime(game.date),
            status: game.status?.long === 'Match Finished' ? 'finished' : 'scheduled',
            scoreHome: game.scores?.home ?? null,
            scoreAway: game.scores?.away ?? null,
            source: 'api-football',
            lastFetchedAt: new Date().toISOString()
        }));

    } catch (error) {
        console.error(`Error fetching ${league.name}:`, error.message);
        return [];
    }
}

// Main function
async function main() {
    if (!API_KEY) {
        console.error('ERROR: APIFOOTBALL_KEY environment variable not set');
        process.exit(1);
    }

    console.log('Starting volleyball data fetch...');
    console.log(`API Key: ${API_KEY.substring(0, 8)}...`);

    let allMatches = [];

    for (const league of LEAGUES) {
        // Add delay between requests to avoid rate limiting
        if (allMatches.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const matches = await getLeagueMatches(league);
        allMatches = allMatches.concat(matches);
    }

    // Remove duplicates by ID
    const uniqueMatches = [...new Map(allMatches.map(m => [m.id, m])).values()];

    // Sort by date
    uniqueMatches.sort((a, b) => new Date(a.startTimeUTC) - new Date(b.startTimeUTC));

    console.log(`Total volleyball matches: ${uniqueMatches.length}`);

    // Write output
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueMatches, null, 2));
    console.log(`Written to: ${OUTPUT_FILE}`);

    return { success: true, count: uniqueMatches.length };
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
