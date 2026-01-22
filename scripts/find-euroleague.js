
import https from 'https';

const url = 'https://fixturedownload.com';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const index = data.indexOf('EuroLeague');
        if (index !== -1) {
            console.log('Found EuroLeague at index', index);
            // Print 100 chars before and after
            console.log(data.substring(index - 100, index + 200));
        } else {
            console.log('EuroLeague not found in homeostasis');
        }
    });
}).on('error', (err) => {
    console.error('Error:', err);
});
