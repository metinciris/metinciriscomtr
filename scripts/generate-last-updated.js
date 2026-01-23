/**
 * Generate last_updated.json for the Euro Matches dashboard
 * ES Module version
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getCount = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            return 0;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content || content.trim() === '') return 0;
        const data = JSON.parse(content);
        return Array.isArray(data) ? data.length : 0;
    } catch (e) {
        console.error(`Error counting matches in ${filePath}:`, e.message);
        return 0;
    }
};

const timestamp = new Date().toISOString();

// Read outcomes from environment variables
const footballStatus = process.env.FOOTBALL_OUTCOME === 'success' ? 'success' : 'error';
const basketballStatus = process.env.BASKETBALL_OUTCOME === 'success' ? 'success' : 'error';
const volleyballStatus = process.env.VOLLEYBALL_OUTCOME === 'success' ? 'success' : 'error';

const lastUpdated = {
    lastUpdated: timestamp,
    football: {
        status: footballStatus,
        matchCount: getCount('public/data/football.json'),
        updatedAt: timestamp
    },
    basketball: {
        status: basketballStatus,
        matchCount: getCount('public/data/basketball.json'),
        updatedAt: timestamp
    },
    volleyball: {
        status: volleyballStatus,
        matchCount: getCount('public/data/volleyball.json'),
        updatedAt: timestamp
    }
};

const outputPath = path.join(__dirname, '../public/data/last_updated.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(lastUpdated, null, 2));

console.log('Successfully generated last_updated.json:');
console.log(JSON.stringify(lastUpdated, null, 2));
