// Native fetch is available in Node 20

async function checkUrl(url, label) {
    console.log(`\n--- Checking ${label} ---`);
    console.log(`URL: ${url}`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log(`Status: ${res.status}`);
        if (!res.ok) {
            console.log(`Error: ${res.statusText}`);
            return;
        }
        const data = await res.json();
        console.log(`Type: ${Array.isArray(data) ? 'Array' : typeof data}`);
        console.log(`Length: ${Array.isArray(data) ? data.length : 'N/A'}`);
        if (Array.isArray(data) && data.length > 0) {
            console.log('First Item Sample:');
            console.log(JSON.stringify(data[0], null, 2));

            // Find a Turkish team for debugging names
            const turkish = data.find(m =>
                m.HomeTeam?.toLowerCase().includes('fener') ||
                m.AwayTeam?.toLowerCase().includes('fener') ||
                m.HomeTeam?.toLowerCase().includes('efes') ||
                m.AwayTeam?.toLowerCase().includes('efes')
            );
            if (turkish) {
                console.log('Found a Turkish item:');
                console.log(JSON.stringify(turkish, null, 2));
            } else {
                console.log('No Turkish teams found in this sample.');
            }
        }
    } catch (e) {
        console.error(`Fetch Error: ${e.message}`);
    }
}

const urls = [
    { label: 'EuroLeague', url: 'https://fixturedownload.com/feed/json/turkish-airlines-euroleague-2024' },
    { label: 'EuroCup', url: 'https://fixturedownload.com/feed/json/eurocup-2024' },
    { label: 'Champions League Basketball', url: 'https://fixturedownload.com/feed/json/champions-league-basketball-2024' },
    { label: 'Europa League FC', url: 'https://fixturedownload.com/feed/json/uefa-europa-league-2024' }
];

async function main() {
    for (const item of urls) {
        await checkUrl(item.url, item.label);
    }
}

main();
