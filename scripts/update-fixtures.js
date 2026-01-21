const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const FIXTURE_URL = 'https://fixturedownload.com/feed/json/euroleague-2024'; // Using EuroLeague 2024 as base
const OUTPUT_FILE = path.join(__dirname, '../public/data/fixtures.json');

// Helper to fetch JSON
const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => reject(err));
    });
};

// Normalize Data
const normalizeData = (data) => {
    // FixtureDownload format usually has:
    // RoundNumber, DateUtc, Location, HomeTeam, AwayTeam, HomeTeamScore, AwayTeamScore
    // We map it to our Match interface

    return data.map((item, index) => {
        const homeScore = item.HomeTeamScore;
        const awayScore = item.AwayTeamScore;
        const isFinished = typeof homeScore === 'number' && typeof awayScore === 'number';

        return {
            id: `el-${index}`, // Simple ID generation
            competition: 'EuroLeague', // Defaulting to EuroLeague for this feed
            round: `Round ${item.RoundNumber}`,
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
        console.log('Fetching fixtures from:', FIXTURE_URL);
        const rawData = await fetchJson(FIXTURE_URL);
        console.log(`Fetched ${rawData.length} items.`);

        const normalized = normalizeData(rawData);

        // Write to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(normalized, null, 2));
        console.log('Successfully written to:', OUTPUT_FILE);

    } catch (error) {
        console.error('Error updating fixtures:', error);
        process.exit(1);
    }
}

main();
