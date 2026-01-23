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
            console.log('First Item Sample Date:', data[0].DateUtc || data[0].date);

            // Find a Turkish team for debugging names
            const turkish = data.find(m => {
                const home = m.HomeTeam || (m.homeTeam && m.homeTeam.name) || '';
                const away = m.AwayTeam || (m.awayTeam && m.awayTeam.name) || '';
                const hstr = typeof home === 'string' ? home.toLowerCase() : '';
                const astr = typeof away === 'string' ? away.toLowerCase() : '';
                return hstr.includes('galatasaray') || astr.includes('galatasaray') ||
                    hstr.includes('fener') || astr.includes('fener');
            });
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
    { label: 'Europa League 2025', url: 'https://fixturedownload.com/feed/json/europa-league-2025' },
    { label: 'Conference League 2025', url: 'https://fixturedownload.com/feed/json/conference-league-2025' },
    { label: 'Champions League 2025', url: 'https://fixturedownload.com/feed/json/champions-league-2025' },
    { label: 'Super Lig 2025 (testing)', url: 'https://fixturedownload.com/feed/json/super-lig-2025' }
];

async function main() {
    for (const item of urls) {
        await checkUrl(item.url, item.label);
    }
}

main();
