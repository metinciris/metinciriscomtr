// Test script for api-sports.io football with season=2024
const API_KEY = '9fe24265054f42881d012120e958e646';

async function testFootball(leagueId, season) {
    const host = 'v3.football.api-sports.io';
    const url = `https://${host}/fixtures?league=${leagueId}&season=${season}&next=5`;

    console.log(`\nTesting Football (league ${leagueId}, season ${season})...`);
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
            console.log(`Success! Found ${data.results} results.`);
            if (data.response && data.response.length > 0) {
                console.log('Sample fixture Home Team:', data.response[0].teams.home.name);
            }
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

async function main() {
    // Europa League (3), Conference League (848)
    await testFootball(3, 2024);
    await testFootball(848, 2024);
}

main();
