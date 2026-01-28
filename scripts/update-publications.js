/**
 * Update Publications from GitHub Issue
 * 
 * Bu script GitHub Actions tarafından çalıştırılır.
 * Issue içeriğini parse eder ve publications.json'u günceller.
 * 
 * Issue formatları:
 * 
 * 1. Bilimsel Katılım (label: katilim)
 *    Title: [Katılım] Herhangi bir başlık
 *    Body: XIII. Ulusal Patoloji Kongresi, 4-8 Eylül 1997, İstanbul
 * 
 * 2. SCI Makale (label: sci)
 *    Title: [SCI] Makale başlığı
 *    Body:
 *    year: 2025
 *    authors: Çiriş İM, et al.
 *    title: Article title
 *    journal: Journal Name
 *    volume: 58(1)
 *    pages: 10-19
 *    doi: 10.xxx/xxx
 *    quartile: Q1
 * 
 * 3. Ulusal Makale (label: ulusal)
 *    Title: [Ulusal] Makale başlığı
 *    Body:
 *    year: 2025
 *    authors: Çiriş İM, et al.
 *    title: Makale başlığı
 *    journal: Dergi Adı
 *    volume: 30(3)
 *    pages: 302-307
 *    doi: 10.xxx/xxx
 *    index: TR DİZİN
 */

const fs = require('fs');
const path = require('path');

const PUBLICATIONS_FILE = path.join(__dirname, '..', 'public', 'data', 'publications.json');

function parseKeyValue(body) {
    const lines = body.split('\n');
    const result = {};

    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();

        if (key && value) {
            // year'ı number'a çevir
            if (key === 'year') {
                result[key] = parseInt(value, 10);
            } else {
                result[key] = value;
            }
        }
    }

    return result;
}

function main() {
    const issueTitle = process.env.ISSUE_TITLE || '';
    const issueBody = process.env.ISSUE_BODY || '';
    const issueLabels = (process.env.ISSUE_LABELS || '').split(',').map(l => l.trim().toLowerCase());
    const issueNumber = process.env.ISSUE_NUMBER || 'unknown';

    console.log(`Processing Issue #${issueNumber}`);
    console.log(`Title: ${issueTitle}`);
    console.log(`Labels: ${issueLabels.join(', ')}`);

    // Mevcut veriyi oku
    let data;
    try {
        data = JSON.parse(fs.readFileSync(PUBLICATIONS_FILE, 'utf8'));
    } catch (err) {
        console.error('publications.json okunamadı:', err);
        process.exit(1);
    }

    let updated = false;

    // Bilimsel Katılım
    if (issueLabels.includes('katilim')) {
        const participation = issueBody.trim();
        if (participation) {
            data.scientificParticipations.push(participation);
            console.log(`Bilimsel katılım eklendi: ${participation}`);
            updated = true;
        }
    }

    // SCI Makale
    if (issueLabels.includes('sci')) {
        const pub = parseKeyValue(issueBody);
        if (pub.title && pub.authors && pub.journal) {
            data.sciPublications.push(pub);
            console.log(`SCI makale eklendi: ${pub.title}`);
            updated = true;
        } else {
            console.error('SCI makale için gerekli alanlar eksik: title, authors, journal');
        }
    }

    // Ulusal Makale
    if (issueLabels.includes('ulusal')) {
        const pub = parseKeyValue(issueBody);
        if (pub.title && pub.authors && pub.journal) {
            data.nationalPublications.push(pub);
            console.log(`Ulusal makale eklendi: ${pub.title}`);
            updated = true;
        } else {
            console.error('Ulusal makale için gerekli alanlar eksik: title, authors, journal');
        }
    }

    // Kitap
    if (issueLabels.includes('kitap')) {
        const book = parseKeyValue(issueBody);
        if (book.title && book.authors && book.publisher) {
            data.books.push(book);
            console.log(`Kitap eklendi: ${book.title}`);
            updated = true;
        } else {
            console.error('Kitap için gerekli alanlar eksik: title, authors, publisher');
        }
    }

    if (updated) {
        // Son güncelleme tarihini güncelle
        data.lastUpdated = new Date().toISOString().split('T')[0];

        // Dosyaya yaz
        fs.writeFileSync(PUBLICATIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('publications.json güncellendi');
    } else {
        console.log('Güncellenecek bir şey bulunamadı. Issue label kontrol edin: katilim, sci, ulusal, kitap');
    }
}

main();
