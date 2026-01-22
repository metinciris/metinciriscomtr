
import https from 'https';

const url = 'https://fixturedownload.com';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const regex = /href="([^"]+\.json)"/g;
        let match;
        const found = new Set();
        while ((match = regex.exec(data)) !== null) {
            found.add(match[1]);
        }
        console.log('Found JSON links:', [...found].sort());
    });
}).on('error', (err) => {
    console.error('Error:', err);
});
