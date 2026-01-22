
import https from 'https';

const urls = [
    'https://fixturedownload.com/feed/json/uefa-champions-league-2024',
    'https://fixturedownload.com/feed/json/uefa-champions-league-2025',
    'https://fixturedownload.com/feed/json/champions-league-2024',
    'https://fixturedownload.com/feed/json/uefa-europa-league-2024',
    'https://fixturedownload.com/feed/json/uefa-europa-league-2025',
    'https://fixturedownload.com/feed/json/europa-league-2024',
    'https://fixturedownload.com/feed/json/uefa-conference-league-2024',
    'https://fixturedownload.com/feed/json/conference-league-2024'
];

urls.forEach(url => {
    const req = https.request(url, { method: 'HEAD' }, res => {
        console.log(`${res.statusCode} : ${url}`);
    });
    req.on('error', e => console.log(`ERR : ${url} - ${e.message}`));
    req.end();
});
