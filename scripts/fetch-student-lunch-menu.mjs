import fs from 'fs';
import path from 'path';

async function fetchMenu() {
    const url = 'https://w3.sdu.edu.tr/aylik-yemek-listesi?dosya=yemekler_ogle&tur=2';
    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();

        // Today's date in dd.MM.yyyy format (Europe/Istanbul)
        const now = new Date();
        const istanbulTime = new Intl.DateTimeFormat('tr-TR', {
            timeZone: 'Europe/Istanbul',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(now);

        // Normalize date to dd.MM.yyyy (Intl.DateTimeFormat might use dd.MM.yyyy or dd/MM/yyyy depending on environment)
        const todayStr = istanbulTime.replace(/\//g, '.');
        console.log(`Target date: ${todayStr}`);

        // Simple parsing logic
        // The HTML contains dates like 19.01.2026
        // We look for the block starting with today's date
        const dateIndex = html.indexOf(todayStr);

        if (dateIndex === -1) {
            console.log(`Date ${todayStr} not found in HTML.`);
            return writeEmptyJson(todayStr);
        }

        // Find the next date or end of content to isolate today's block
        // Dates are usually in 10-char format dd.MM.yyyy
        const nextDateRegex = /\d{2}\.\d{2}\.\d{4}/g;
        nextDateRegex.lastIndex = dateIndex + 10;
        const nextDateMatch = nextDateRegex.exec(html);

        let block = '';
        if (nextDateMatch) {
            block = html.substring(dateIndex, nextDateMatch.index);
        } else {
            block = html.substring(dateIndex);
        }

        // Extract items from the block
        // Removing HTML tags first to make it easier
        const cleanBlock = block.replace(/<[^>]*>/g, '\n');

        const DAYS = ['PAZARTESI', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESI', 'PAZAR', 'PAZARTESİ', 'CUMARTESİ'];

        const lines = cleanBlock.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.includes(todayStr) && line !== '-');

        const items = [];
        let kcal = "";

        for (const line of lines) {
            const upperLine = line.toUpperCase('tr-TR');

            // Check for kcal pattern: (1000 kcal) or 1000 kcal or even (- kcal)
            const kcalMatch = line.match(/(\d*)\s*kcal/i);
            if (kcalMatch) {
                if (kcalMatch[1]) kcal = kcalMatch[1];
                continue;
            }

            // Ignore day names
            if (DAYS.includes(upperLine)) {
                continue;
            }

            // If it looks like a food name (not too short, not a number, and not a day name part)
            if (line.length > 2 && !/^\d+$/.test(line) && !line.includes('kcal') && !line.includes('KCAL')) {
                items.push(upperLine);
            }
        }

        // Usually 4 items
        const result = {
            date: todayStr,
            items: items.slice(0, 5), // Keep it reasonable, usually 4-5 items
            kcal: kcal || null,
            source: url,
            updatedAt: new Date().toISOString()
        };

        saveResult(result);

    } catch (error) {
        console.error('Error fetching/parsing menu:', error);
        // On error, we don't want to overwrite with empty unless it's a parse failure for known HTML
    }
}

function writeEmptyJson(date) {
    saveResult({
        date: date,
        items: [],
        kcal: null,
        source: 'https://w3.sdu.edu.tr/aylik-yemek-listesi?dosya=yemekler_ogle&tur=2',
        updatedAt: new Date().toISOString()
    });
}

function saveResult(data) {
    const dir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, 'ogrenci-ogle-menu.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved to ${filePath}`);
}

fetchMenu();
