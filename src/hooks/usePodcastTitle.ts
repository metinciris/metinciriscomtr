import { useEffect, useState } from 'react';

const PODCAST_SHEET_ID = '148p3M41R52gVVjtLSF2Qh8rJvBPEWJ7SV4lgSBQYwLc';
const PODCAST_GID = '1109640564';
const PODCAST_RANGE = 'A1:F132';
const CACHE_KEY_PODCAST = 'metinciris_podcast_titles';
const CACHE_EXPIRY = 3600000; // 1 saat

/**
 * Google Sheets'ten podcast başlıklarını çekip döndüren hook.
 * localStorage ile 1 saatlik önbellekleme yapar.
 */
export function usePodcastTitle(intervalMs: number): string {
    const [titles, setTitles] = useState<string[]>(() => {
        const cached = localStorage.getItem(CACHE_KEY_PODCAST);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY) {
                    return data;
                }
            } catch (e) {
                console.error('Önbellek okuma hatası', e);
            }
        }
        return [];
    });
    const [index, setIndex] = useState(0);

    // Başlıkları çek ve önbellekle
    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = `https://docs.google.com/spreadsheets/d/${PODCAST_SHEET_ID}/gviz/tq?tqx=out:json&gid=${PODCAST_GID}&range=${PODCAST_RANGE}`;
                const res = await fetch(url);
                const text = await res.text();
                const jsonText = text.substring(
                    text.indexOf('(') + 1,
                    text.lastIndexOf(')'),
                );
                const data = JSON.parse(jsonText);

                const collected: string[] = [];
                if (data.table && data.table.rows) {
                    data.table.rows.forEach((row: any) => {
                        const title = row.c[0]?.v?.toString().trim();
                        if (title) {
                            collected.push(title);
                        }
                    });
                }

                if (collected.length > 0) {
                    setTitles(collected);
                    localStorage.setItem(
                        CACHE_KEY_PODCAST,
                        JSON.stringify({ data: collected, timestamp: Date.now() }),
                    );
                    setIndex(Math.floor(Math.random() * collected.length));
                }
            } catch (e) {
                console.error('Podcast başlıkları alınamadı', e);
            }
        };

        // Sayfa yüklendikten biraz sonra çek (Main thread'i rahatlat)
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 3000);

        return () => clearTimeout(timeoutId);
    }, []);

    // Belirli aralıklarla sonraki başlığa geç
    useEffect(() => {
        if (!titles.length) return;
        const id = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % titles.length);
        }, intervalMs);

        return () => window.clearInterval(id);
    }, [titles, intervalMs]);

    if (!titles.length) return '';
    return titles[index] ?? '';
}
