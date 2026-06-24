/**
 * Update Google Scholar Stats
 * 
 * Bu script Google Scholar profilinden atıf sayısı ve h-indeks verilerini çeker
 * ve public/data/publications.json dosyasını günceller.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLICATIONS_FILE = path.join(__dirname, '..', 'public', 'data', 'publications.json');
const SCHOLAR_URL = 'https://scholar.google.com/citations?user=QZkewskAAAAJ&hl=tr';

async function updateScholarStats() {
    try {
        console.log('Fetching Google Scholar stats...');

        // Browser benzeri bir User-Agent kullanmak engellenme riskini azaltır
        const response = await fetch(SCHOLAR_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Scholar page: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();

        // Google Scholar stats table (gsc_rsb_st) içindeki sayıları yakala
        // <td class="gsc_rsb_std">2154</td>
        const statsRegex = /<td class="gsc_rsb_std">(\d+)<\/td>/g;
        const matches = [...html.matchAll(statsRegex)];

        if (matches.length < 3) {
            console.log('HTML content length:', html.length);
            // Eğer matches boşsa sayfa engellenmiş veya yapısı değişmiş olabilir
            if (html.includes('gs_captcha_f')) {
                throw new Error('Google Scholar CAPTCHA engeline takıldı. Lütfen daha sonra tekrar deneyin.');
            }
            throw new Error('İstatistik verileri bulunamadı. Sayfa yapısı değişmiş olabilir.');
        }

        // matches[0] = Toplam Atıf (All)
        // matches[1] = 2019'dan beri Atıf
        // matches[2] = Toplam h-endeksi (All)
        // matches[3] = 2019'dan beri h-endeksi
        // matches[4] = Toplam i10-endeksi (All)

        const totalCitations = parseInt(matches[0][1], 10);
        const hIndex = parseInt(matches[2][1], 10);
        const i10Index = matches[4] ? parseInt(matches[4][1], 10) : 0;

        // Atıf Geçmişi Grafiği (Years and Counts)
        // <span class="gsc_g_t" style="right:40px;left:auto">2024</span>
        // <span class="gsc_g_al">150</span>
        const yearsMatch = [...html.matchAll(/<span class="gsc_g_t" style="[^"]*">(\d{4})<\/span>/g)].map(m => m[1]);
        const countsMatch = [...html.matchAll(/<span class="gsc_g_al">(\d+)<\/span>/g)].map(m => parseInt(m[1], 10));

        const citationHistory = yearsMatch.map((year, index) => ({
            year: parseInt(year, 10),
            count: countsMatch[index] || 0
        })).sort((a, b) => a.year - b.year);

        console.log(`\nBaşarılı!`);
        console.log(`Atıf Sayısı: ${totalCitations}`);
        console.log(`h-endeksi: ${hIndex}`);
        console.log(`i10-endeksi: ${i10Index}`);
        console.log(`Grafik Verisi: ${citationHistory.length} yıl bulundu.`);

        // publications.json dosyasını oku ve güncelle
        const rawData = fs.readFileSync(PUBLICATIONS_FILE, 'utf8');
        const data = JSON.parse(rawData);

        if (!data.stats) data.stats = {};

        // Sadece değişen alanları güncelle
        data.stats.citations = totalCitations;
        data.stats.hIndex = hIndex;
        data.stats.i10Index = i10Index;
        data.stats.citationHistory = citationHistory;

        // Yayın sayılarını da dizilerin uzunluğuna göre güncelle (Tam dinamik)
        data.stats.sciCount = data.sciPublications ? data.sciPublications.length : data.stats.sciCount;
        data.stats.nationalCount = data.nationalPublications ? data.nationalPublications.length : data.stats.nationalCount;
        data.stats.congressCount = data.scientificParticipations ? data.scientificParticipations.length : data.stats.congressCount;

        data.lastUpdated = new Date().toISOString().split('T')[0];

        fs.writeFileSync(PUBLICATIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('\npublications.json güncellendi (İstatistikler ve yayın sayıları senkronize edildi).');

    } catch (error) {
        console.error('\nHata:', error.message);
        console.log('İstatistik güncelleme atlandı (workflow hata vermeyecek).');
        process.exit(0);
    }
}

updateScholarStats();
