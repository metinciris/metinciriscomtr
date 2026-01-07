/**
 * PubMed E-utilities API Service
 * 
 * Features:
 * - Throttled request queue (max 3 concurrent)
 * - Session cache for repeated queries
 * - ESpell suggestions
 * - Optional proxy support via config
 * 
 * Usage Notes:
 * - Last 20 years data: From current year back 20 years
 * - Rate limit: ~3 requests/second via throttling
 * - Cache: Stores term+year combinations in sessionStorage
 */

// Configuration
const CONFIG = {
    // Use proxy if available, otherwise direct NCBI
    baseUrl: import.meta.env.VITE_PUBMED_PROXY_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    apiKey: import.meta.env.VITE_PUBMED_API_KEY || '',
    maxConcurrent: 3,
    requestDelay: 350, // ms between requests to avoid rate limiting
};

// Types
export interface YearlyCount {
    year: number;
    count: number;
    loading?: boolean;
    error?: boolean;
}

export interface SearchProgress {
    term: string;
    year: number;
    count: number;
    totalYears: number;
    completedYears: number;
}

export interface SpellingSuggestion {
    original: string;
    corrected: string;
    suggestions: string[];
}

// Cache using sessionStorage
const CACHE_PREFIX = 'pubmed_cache_';

function getCacheKey(term: string, year: number): string {
    return `${CACHE_PREFIX}${term.toLowerCase().trim()}_${year}`;
}

function getFromCache(term: string, year: number): number | null {
    try {
        const key = getCacheKey(term, year);
        const cached = sessionStorage.getItem(key);
        if (cached !== null) {
            return parseInt(cached, 10);
        }
    } catch (e) {
        // sessionStorage might not be available
    }
    return null;
}

function setCache(term: string, year: number, count: number): void {
    try {
        const key = getCacheKey(term, year);
        sessionStorage.setItem(key, count.toString());
    } catch (e) {
        // sessionStorage might be full or unavailable
    }
}

// Throttle Queue
interface QueueItem {
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
}

class ThrottleQueue {
    private queue: QueueItem[] = [];
    private running = 0;
    private maxConcurrent: number;
    private delay: number;

    constructor(maxConcurrent: number, delay: number) {
        this.maxConcurrent = maxConcurrent;
        this.delay = delay;
    }

    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.process();
        });
    }

    private async process(): Promise<void> {
        if (this.running >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        const item = this.queue.shift();
        if (!item) return;

        this.running++;

        try {
            const result = await item.fn();
            item.resolve(result);
        } catch (error) {
            item.reject(error);
        } finally {
            this.running--;
            // Delay before processing next item
            setTimeout(() => this.process(), this.delay);
        }
    }

    clear(): void {
        this.queue = [];
    }
}

const requestQueue = new ThrottleQueue(CONFIG.maxConcurrent, CONFIG.requestDelay);

// Build URL with API key
function buildUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(`${CONFIG.baseUrl}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    if (CONFIG.apiKey) {
        url.searchParams.append('api_key', CONFIG.apiKey);
    }
    return url.toString();
}

/**
 * Get publication count for a specific term and year
 */
export async function getYearlyPublicationCount(term: string, year: number, retries = 2): Promise<number> {
    // Check cache first
    const cached = getFromCache(term, year);
    if (cached !== null) {
        return cached;
    }

    const fetchWithRetry = async (attempt: number): Promise<number> => {
        try {
            // Using a more robust query format: term AND (year[pdat])
            const robustTerm = `(${term}) AND (${year}[pdat])`;

            const url = buildUrl('esearch.fcgi', {
                db: 'pubmed',
                term: robustTerm,
                retmax: '0',
                retmode: 'json',
            });

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`PubMed API error: ${response.status}`);
            }

            const data = await response.json();

            // Critical check: Ensure esearchresult and count exist
            if (!data.esearchresult || typeof data.esearchresult.count === 'undefined') {
                console.warn(`Unexpected PubMed response for ${term} in ${year}:`, data);
                throw new Error('Invalid response structure');
            }

            const count = parseInt(data.esearchresult.count, 10);

            // Cache the result
            setCache(term, year, count);

            return count;
        } catch (error) {
            if (attempt < retries) {
                // Wait longer between retries
                await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
                return fetchWithRetry(attempt + 1);
            }
            throw error;
        }
    };

    return requestQueue.add(() => fetchWithRetry(0));
}

/**
 * Get spelling suggestions for a term
 */
export async function getSpellingSuggestions(term: string): Promise<SpellingSuggestion | null> {
    if (!term || term.length < 3) {
        return null;
    }

    return requestQueue.add(async () => {
        const url = buildUrl('espell.fcgi', {
            db: 'pubmed',
            term: term,
            retmode: 'json',
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`PubMed ESpell API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.espellresult;

        if (!result) return null;

        const corrected = result.correctedquery || '';

        if (corrected && corrected.toLowerCase() !== term.toLowerCase()) {
            return {
                original: term,
                corrected: corrected,
                suggestions: [corrected],
            };
        }

        return null;
    });
}

/**
 * Search PubMed for the last 20 years with progress callback
 */
export async function searchPubMed20Years(
    term: string,
    onProgress: (progress: SearchProgress) => void,
    signal?: AbortSignal
): Promise<YearlyCount[]> {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 19; // Last 20 years including current
    const years = Array.from({ length: 20 }, (_, i) => startYear + i);
    const results: YearlyCount[] = years.map(year => ({ year, count: 0, loading: true }));

    // Initial progress
    onProgress({
        term,
        year: startYear,
        count: 0,
        totalYears: 20,
        completedYears: 0,
    });

    let completedCount = 0;

    // Process years in parallel but throttled
    const promises = years.map(async (year, index) => {
        if (signal?.aborted) {
            throw new Error('Aborted');
        }

        try {
            const count = await getYearlyPublicationCount(term, year);
            results[index] = { year, count, loading: false };
            completedCount++;

            onProgress({
                term,
                year,
                count,
                totalYears: 20,
                completedYears: completedCount,
            });

            return count;
        } catch (error) {
            results[index] = { year, count: 0, loading: false, error: true };
            completedCount++;

            onProgress({
                term,
                year,
                count: 0,
                totalYears: 20,
                completedYears: completedCount,
            });

            throw error;
        }
    });

    // Wait for all to complete (or fail gracefully)
    await Promise.allSettled(promises);

    return results;
}

/**
 * Clear the request queue (useful when canceling searches)
 */
export function clearQueue(): void {
    requestQueue.clear();
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {
        // Ignore errors
    }
}
