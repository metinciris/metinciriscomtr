
import https from 'https';

const urls = [
    'https://fixturedownload.com/feed/json/euroleague-2024',
    'https://fixturedownload.com/feed/json/euroleague-2025',
    'https://fixturedownload.com/feed/json/eurocup-2024',
    'https://fixturedownload.com/feed/json/eurocup-2025',
    'https://fixturedownload.com/feed/json/turkish-airlines-euroleague-2024',
    'https://fixturedownload.com/feed/json/bkt-eurocup-2024'
];

urls.forEach(url => {
    const req = https.request(url, { method: 'HEAD' }, res => {
        console.log(`${res.statusCode} : ${url}`);
    });
    req.on('error', e => console.log(`ERR : ${url} - ${e.message}`));
    req.end();
});
