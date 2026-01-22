import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOURCES = [
    {
        url: 'https://fixturedownload.com/feed/json/euroleague-2024',
        competition: 'EuroLeague',
        type: 'EuroLeague'
    },
    {
        url: 'https://fixturedownload.com/feed/json/eurocup-2024',
        competition: 'EuroCup',
        type: 'EuroCup'
    },
    {
        url: 'https://fixturedownload.com/feed/json/super-lig-2024',
        competition: 'Super Lig',
        type: 'Super Lig'
    },
    {
        url: 'https://fixturedownload.com/feed/json/uefa-nations-league-2024',
        competition: 'UEFA Nations League',
        type: 'National'
    }
];

const OUTPUT_FILE = path.join(__dirname, '../public/data/fixtures.json');

// Helper to fetch JSON
const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                // Resolve with null so we can skip this source without failing everything
                console.warn(`Warning: Failed to fetch ${url} (Status: ${res.statusCode})`);
                res.resume();
                resolve(null);
                return;
            }

            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error(`Error parsing JSON from ${url}:`, e);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error(`Error fetching ${url}:`, err);
            resolve(null);
        });
    });
};

// Normalize Data
const normalizeData = (data, sourceConfig) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item, index) => {
        const homeScore = item.HomeTeamScore;
        const awayScore = item.AwayTeamScore;
        const isFinished = typeof homeScore === 'number' && typeof awayScore === 'number';

        return {
            id: `${sourceConfig.competition.replace(/\s+/g, '-').toLowerCase()}-${index}-${item.RoundNumber || '0'}`,
            competition: sourceConfig.competition,
            type: sourceConfig.type,
            round: item.RoundNumber ? `Round ${item.RoundNumber}` : (item.Group || 'Match'),
            startTimeISO: item.DateUtc, // Ensure this is ISO string
            homeTeam: item.HomeTeam,
            awayTeam: item.AwayTeam,
            homeScore: homeScore,
            awayScore: awayScore,
            venue: item.Location,
            status: isFinished ? 'finished' : 'scheduled'
        };
    });
};

async function main() {
    try {
        console.log('Starting fixtures update...');

        let allMatches = [];

        for (const source of SOURCES) {
            console.log(`Fetching ${source.competition}...`);
            const rawData = await fetchJson(source.url);

            if (rawData) {
                console.log(`Fetched ${rawData.length} items from ${source.competition}.`);
                const normalized = normalizeData(rawData, source);
                allMatches = allMatches.concat(normalized);
            } else {
                console.log(`Skipping ${source.competition} due to fetch error.`);
            }
        }

        console.log(`Total matches collected: ${allMatches.length}`);

        // Write to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allMatches, null, 2));
        console.log('Successfully written to:', OUTPUT_FILE);

    } catch (error) {
        console.error('CRITICAL Error updating fixtures:', error);
        process.exit(1);
    }
}

main();
