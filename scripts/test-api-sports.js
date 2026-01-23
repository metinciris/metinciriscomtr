// Test script for api-sports.io basketball/volleyball with season=2024
const API_KEY = '9fe24265054f42881d012120e958e646';

async function testApiAll(sport, leagueId, season) {
    const host = `v1.${sport}.api-sports.io`;
    // Fetch all games for the season
    const url = `https://${host}/games?league=${leagueId}&season=${season}`;

    console.log(`\nTesting ${sport} (league ${leagueId}, season ${season})...`);
    console.log(`URL: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': host
            }
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);
        if (data.errors && Object.keys(data.errors).length > 0) {
            console.log('Errors:', JSON.stringify(data.errors, null, 2));
        } else {
            console.log(`Success! Found ${data.results} results for the whole season.`);
            if (data.response && data.response.length > 0) {
                // Find Turkish teams
                const turkishTeams = data.response.filter(g =>
                    g.teams.home.name.toLowerCase().includes('fener') ||
                    g.teams.away.name.toLowerCase().includes('fener') ||
                    g.teams.home.name.toLowerCase().includes('efes') ||
                    g.teams.away.name.toLowerCase().includes('efes')
                );
                console.log(`Found ${turkishTeams.length} games involving Fenerbahce or Efes.`);
                if (turkishTeams.length > 0) {
                    console.log('Sample game:', JSON.stringify(turkishTeams[0], null, 2));
                }
            }
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

async function main() {
    await testApiAll('basketball', 120, '2024');
    await testApiAll('volleyball', 80, '2024');
}

main();
