/**
 * Fetch Basketball Data - Turkish Teams in European Competitions
 * Source: fixturedownload.com (EuroLeague & EuroCup)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Turkish basketball teams (normalized names for matching)
const TURKISH_TEAMS = [
    'fenerbahce', 'fenerbahçe', 'fenerbahce beko',
    'anadolu efes', 'efes',
    'turk telekom', 'türk telekom',
    'besiktas', 'beşiktaş', 'besiktas fibabanka',
    'bahcesehir', 'bahçeşehir', 'bahcesehir koleji',
    'galatasaray', 'galatasaray nef',
    'pinar karsiyaka', 'pınar karşıyaka', 'karsiyaka',
    'darussafaka', 'darüşşafaka',
    'tofas', 'tofaş', 'tofas bursa'
];

const OUTPUT_FILE = path.join(__dirname, '../public/data/basketball.json');

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

// Fetch from fixturedownload.com
async function fetchFixtureDownloadData(url) {
    console.log(`Fetching from fixturedownload.com: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`fixturedownload error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

// Get matches for a league
async function getLeagueMatches(url, competitionName) {
    try {
        const data = await fetchFixtureDownloadData(url);
        if (!Array.isArray(data)) return [];

        const turkishMatches = data.filter(match =>
            isTurkishTeam(match.HomeTeam) || isTurkishTeam(match.AwayTeam)
        );

        return turkishMatches.map((match, idx) => ({
            id: `basketball-${competitionName.replace(/\s+/g, '')}-${idx}`,
            sport: 'basketball',
            competition: competitionName,
            season: '2024/25',
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
    console.log('Starting basketball data fetch...');

    let allMatches = [];

    // 1. EuroLeague
    const elMatches = await getLeagueMatches(
        'https://fixturedownload.com/feed/json/turkish-airlines-euroleague-2024',
        'EuroLeague'
    );
    allMatches = [...allMatches, ...elMatches];

    // 2. EuroCup
    const ecMatches = await getLeagueMatches(
        'https://fixturedownload.com/feed/json/eurocup-2024',
        'EuroCup'
    );
    allMatches = [...allMatches, ...ecMatches];

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

    console.log(`Total basketball matches after filtering: ${filteredMatches.length}`);

    // Write output
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filteredMatches, null, 2));
    console.log(`Written to: ${OUTPUT_FILE}`);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
