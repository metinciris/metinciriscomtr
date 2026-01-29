/**
 * PubMed Daily Article Service
 * 
 * Fetches daily articles from specific pathology journals using NCBI E-utilities.
 * Stays within PubMed license by only using metadata (title, authors, abstract).
 * 
 * Rate limiting: Uses throttled queue (3 concurrent, 350ms delay)
 */

// Article type
export interface Article {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    pubDate: string;
    abstract?: string;
    doi?: string;
}

export interface SearchResult {
    articles: Article[];
    total: number;
    date: Date;
}

// Configuration
const CONFIG = {
    baseUrl: import.meta.env.VITE_PUBMED_PROXY_URL || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    apiKey: import.meta.env.VITE_PUBMED_API_KEY || '',
    maxConcurrent: 3,
    requestDelay: 350,
    maxResults: 100, // Max articles per query
};

// Throttle Queue for rate limiting
class ThrottleQueue {
    private queue: Array<{
        fn: () => Promise<any>;
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];
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
            setTimeout(() => this.process(), this.delay);
        }
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

// Format date for PubMed query (YYYY/MM/DD)
function formatDateForPubMed(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// Build journal query string
function buildJournalQuery(journals: string[]): string {
    return journals.map(j => `"${j}"[Journal]`).join(' OR ');
}

/**
 * Search PubMed for articles from specific journals on a specific date
 */
export async function searchArticles(
    journals: string[],
    date: Date
): Promise<SearchResult> {
    const dateStr = formatDateForPubMed(date);
    const journalQuery = buildJournalQuery(journals);

    // Query: (journal list) AND date range
    const query = `(${journalQuery}) AND ("${dateStr}"[EDAT] : "${dateStr}"[EDAT])`;

    return requestQueue.add(async () => {
        try {
            // Step 1: Search for PMIDs
            const searchUrl = buildUrl('esearch.fcgi', {
                db: 'pubmed',
                term: query,
                retmax: String(CONFIG.maxResults),
                retmode: 'json',
                sort: 'relevance',
            });

            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) {
                throw new Error(`PubMed search error: ${searchResponse.status}`);
            }

            const searchData = await searchResponse.json();
            const pmids: string[] = searchData.esearchresult?.idlist || [];
            const total = parseInt(searchData.esearchresult?.count || '0', 10);

            if (pmids.length === 0) {
                return { articles: [], total: 0, date };
            }

            // Step 2: Fetch article details
            const articles = await fetchArticleDetails(pmids);

            return { articles, total, date };
        } catch (error) {
            console.error('PubMed search error:', error);
            throw error;
        }
    });
}

/**
 * Fetch article details using ESummary and EFetch for abstracts
 */
async function fetchArticleDetails(pmids: string[]): Promise<Article[]> {
    if (pmids.length === 0) return [];

    // ESummary for basic metadata
    const summaryUrl = buildUrl('esummary.fcgi', {
        db: 'pubmed',
        id: pmids.join(','),
        retmode: 'json',
    });

    // EFetch for abstracts (XML format)
    const fetchUrl = buildUrl('efetch.fcgi', {
        db: 'pubmed',
        id: pmids.join(','),
        retmode: 'xml',
        rettype: 'abstract',
    });

    const [summaryResponse, fetchResponse] = await Promise.all([
        fetch(summaryUrl),
        fetch(fetchUrl)
    ]);

    if (!summaryResponse.ok) {
        throw new Error(`PubMed summary error: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    const result = summaryData.result;

    // Parse abstracts from XML
    const abstractMap = new Map<string, string>();
    if (fetchResponse.ok) {
        try {
            const xmlText = await fetchResponse.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const pubmedArticles = xmlDoc.getElementsByTagName('PubmedArticle');

            for (let i = 0; i < pubmedArticles.length; i++) {
                const article = pubmedArticles[i];
                const pmidEl = article.querySelector('PMID');
                const abstractEl = article.querySelector('AbstractText');

                if (pmidEl && abstractEl) {
                    abstractMap.set(pmidEl.textContent || '', abstractEl.textContent || '');
                }
            }
        } catch (e) {
            console.warn('Failed to parse abstracts:', e);
        }
    }

    if (!result) return [];

    const articles: Article[] = [];

    for (const pmid of pmids) {
        const article = result[pmid];
        if (!article) continue;

        // Extract authors (first 5)
        const authors: string[] = (article.authors || [])
            .slice(0, 5)
            .map((a: { name: string }) => a.name);

        // Extract DOI from articleids
        let doi: string | undefined;
        const articleIds = article.articleids || [];
        for (const id of articleIds) {
            if (id.idtype === 'doi') {
                doi = id.value;
                break;
            }
        }

        articles.push({
            pmid,
            title: article.title || 'Başlık yok',
            authors,
            journal: article.fulljournalname || article.source || 'Bilinmeyen Dergi',
            pubDate: article.pubdate || article.epubdate || '',
            abstract: abstractMap.get(pmid),
            doi,
        });
    }

    return articles;
}

/**
 * PubMed Daily Service object for React components
 */
export const pubmedDailyService = {
    searchArticles,
};
