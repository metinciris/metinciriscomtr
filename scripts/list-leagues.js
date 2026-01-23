// Fetch volleyball leagues to find CEV IDs
const API_KEY = '9fe24265054f42881d012120e958e646';

async function listLeagues() {
    const host = 'v1.volleyball.api-sports.io';
    const url = `https://${host}/leagues`;

    try {
        const res = await fetch(url, {
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': host
            }
        });

        const data = await res.json();
        if (data.response) {
            const cevLeagues = data.response.filter(l =>
                l.name.toLowerCase().includes('cev') ||
                l.country.name.toLowerCase().includes('europe')
            );
            console.log('CEV / Europe Volleyball Leagues:');
            cevLeagues.forEach(l => {
                console.log(`ID: ${l.id}, Name: ${l.name}, Country: ${l.country.name}`);
                // Check if 2024 is in seasons
                const season2024 = l.seasons?.find(s => s.season === 2024);
                if (season2024) {
                    console.log(`  - Season 2024 found (Current: ${season2024.current})`);
                }
            });
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
}

listLeagues();
