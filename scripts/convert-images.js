import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../public/img');
const QUALITY = 40;

if (!fs.existsSync(inputDir)) {
    console.error(`Directory not found: ${inputDir}`);
    process.exit(1);
}

const files = fs.readdirSync(inputDir);

const imageExtensions = ['.jpg', '.jpeg', '.png'];

(async () => {
    let count = 0;
    console.log(`Scanning ${inputDir}...`);

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
            const inputFile = path.join(inputDir, file);
            const name = path.basename(file, ext);
            const outputFile = path.join(inputDir, `${name}.avif`);

            try {
                const info = await sharp(inputFile)
                    .avif({ quality: QUALITY })
                    .toFile(outputFile);

                console.log(`Converted: ${file} -> ${name}.avif (${(info.size / 1024).toFixed(2)} KB)`);
                count++;
            } catch (err) {
                console.error(`Error converting ${file}:`, err);
            }
        }
    }

    console.log(`\nFinished! Converted ${count} images.`);
})();
