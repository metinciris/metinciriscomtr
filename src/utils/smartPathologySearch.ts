/**
 * Statik, ücretsiz ve tarayıcı içinde çalışan akıllı site araması.
 * Eş anlamlılar terim eşleştirmesi içindir; klinik tanı çıkarımı yapılmaz.
 */
export interface SmartSearchEntry {
  title: string;
  description: string;
  path: string;
  type: string;
  keywords?: string;
  content?: string;
}

export type MatchLocation = 'Başlık' | 'Etiket' | 'Açıklama' | 'İçerik' | 'Tür';

export interface RankedSearchResult {
  item: SmartSearchEntry;
  score: number;
  matchedIn: MatchLocation;
}

interface PreparedField {
  location: MatchLocation;
  weight: number;
  text: string;
  words: Set<string>;
}

export interface PreparedSearchEntry {
  item: SmartSearchEntry;
  fields: PreparedField[];
}

const ALIAS_GROUPS: readonly (readonly string[])[] = [
  ['SOX10', 'SOX-10', 'SRY-box transcription factor 10'],
  ['S100', 'S-100', 'S100 protein'],
  ['Melan-A', 'MART-1', 'MLANA'],
  ['HER2', 'HER-2', 'ERBB2', 'HER2/neu'],
  ['TTF-1', 'TTF1', 'NKX2-1'],
  ['CK5/6', 'CK 5/6', 'Cytokeratin 5/6', 'Sitokeratin 5/6'],
  ['CK7', 'Cytokeratin 7', 'Sitokeratin 7'],
  ['CK20', 'Cytokeratin 20', 'Sitokeratin 20'],
  ['İHK', 'IHC', 'İmmünohistokimya', 'Immunohistochemistry'],
  ['RCC', 'Renal cell carcinoma', 'Renal hücreli karsinom', 'Böbrek hücreli karsinom'],
  ['Şeffaf hücreli renal hücreli karsinom', 'Clear cell renal cell carcinoma', 'ccRCC'],
  ['GIST', 'Gastrointestinal stromal tümör', 'Gastrointestinal stromal tumor'],
  ['MPNST', 'Malign periferik sinir kılıfı tümörü', 'Malignant peripheral nerve sheath tumor'],
  ['NIFTP', 'Noninvasive follicular thyroid neoplasm with papillary-like nuclear features'],
  ['DCIS', 'Duktal karsinoma in situ', 'Ductal carcinoma in situ'],
  ['LCIS', 'Lobüler karsinoma in situ', 'Lobular carcinoma in situ'],
  ['HPV', 'Human papillomavirus', 'İnsan papilloma virüsü'],
  ['TIL', 'TILs', 'Tümörü infiltre eden lenfositler', 'Tumor infiltrating lymphocytes'],
  ['MSI', 'Mikrosatellit instabilitesi', 'Microsatellite instability'],
  ['HRD', 'Homolog rekombinasyon eksikliği', 'Homologous recombination deficiency'],
  ['TMB', 'Tümör mutasyon yükü', 'Tumor mutational burden'],
  ['H3K36M', 'H3.3 K36M', 'H3F3B K36M'],
  ['H3K27me3', 'H3 K27me3', 'H3K27 trimethylation'],
  ['INI1', 'SMARCB1', 'BAF47'],
  ['PAX8', 'PAX-8'],
  ['PD-L1', 'PDL1', 'CD274'],
  ['Ki-67', 'Ki67', 'MKI67'],
  ['ER', 'Östrojen reseptörü', 'Estrogen receptor'],
  ['PR', 'Progesteron reseptörü', 'Progesterone receptor'],
];

const RELATED_SEARCHES: Record<string, string[]> = {
  sox10: ['S100', 'Melan-A', 'MPNST', 'H3K27me3'],
  mpnst: ['SOX10', 'S100', 'H3K27me3', 'INI1'],
  dcis: ['CK5/6', 'ER', 'Myoepitelyal'],
  niftp: ['Kapsül invazyonu', 'Papiller tiroid', 'Foliküler'],
  rcc: ['PAX8', 'CAIX', 'CD10'],
  gist: ['DOG1', 'KIT', 'SDHB'],
  her2: ['ERBB2', 'ISH', 'Meme'],
};

export function normalizeSearchText(value: string): string {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const lookup = new Map<string, string[]>();
for (const group of ALIAS_GROUPS) {
  const normalized = [...new Set(group.map(normalizeSearchText))];
  for (const term of normalized) lookup.set(term, normalized);
}

export function getEquivalentTerms(query: string): string[] {
  const normalized = normalizeSearchText(query);
  const group = ALIAS_GROUPS.find((entries) =>
    entries.some((term) => normalizeSearchText(term) === normalized),
  );
  return group
    ? group.filter((term) => normalizeSearchText(term) !== normalized).slice(0, 4)
    : [];
}

export function getRelatedSearches(query: string): string[] {
  return RELATED_SEARCHES[normalizeSearchText(query)] || [];
}

export function isSmartSearchEntry(value: unknown): value is SmartSearchEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<SmartSearchEntry>;
  return (
    typeof entry.title === 'string' &&
    typeof entry.description === 'string' &&
    typeof entry.type === 'string' &&
    typeof entry.path === 'string' &&
    entry.path.startsWith('/') &&
    !entry.path.startsWith('//') &&
    (entry.content === undefined || typeof entry.content === 'string') &&
    (entry.keywords === undefined || typeof entry.keywords === 'string')
  );
}

export function prepareSearchIndex(items: SmartSearchEntry[]): PreparedSearchEntry[] {
  return items.filter(isSmartSearchEntry).map((item) => {
    const inputs: Array<[MatchLocation, number, string]> = [
      ['Başlık', 42, item.title],
      ['Etiket', 25, item.keywords || ''],
      ['Açıklama', 14, item.description],
      ['İçerik', 6, item.content || ''],
      ['Tür', 2, item.type],
    ];
    return {
      item,
      fields: inputs.map(([location, weight, raw]) => {
        const normalized = normalizeSearchText(raw);
        return {
          location,
          weight,
          text: ' ' + normalized + ' ',
          words: new Set(normalized.split(' ').filter(Boolean)),
        };
      }),
    };
  });
}

function termMatches(field: PreparedField, token: string): boolean {
  if (field.words.has(token)) return true;
  // Türkçe çekim ekleri ve yazarken kısmi tamamlamayı destekle.
  return token.length >= 4 && field.text.includes(' ' + token);
}

function groupMatches(field: PreparedField, alternatives: string[]): number {
  let best = 0;
  for (const alternative of alternatives) {
    const tokens = alternative.split(' ').filter(Boolean);
    if (tokens.length === 0 || !tokens.every((token) => termMatches(field, token))) continue;
    const exactPhrase = field.text.includes(' ' + alternative + ' ');
    const matchScore = field.weight + (exactPhrase ? 6 : 0);
    if (matchScore > best) best = matchScore;
  }
  return best;
}

function queryGroups(query: string): string[][] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const fullAlias = lookup.get(normalized);
  if (fullAlias) return [fullAlias];
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((token) => lookup.get(token) || [token]);
}

export function rankSmartSearch(
  prepared: PreparedSearchEntry[],
  query: string,
): RankedSearchResult[] {
  const normalizedQuery = normalizeSearchText(query.slice(0, 140));
  const groups = queryGroups(normalizedQuery);
  if (!groups.length) return [];

  const ranked: RankedSearchResult[] = [];
  for (const { item, fields } of prepared) {
    let score = 0;
    let bestFieldWeight = 0;
    let matchedIn: MatchLocation = 'İçerik';

    for (const alternatives of groups) {
      let groupScore = 0;
      for (const field of fields) {
        const candidate = groupMatches(field, alternatives);
        if (candidate > groupScore) groupScore = candidate;
        if (candidate && field.weight > bestFieldWeight) {
          bestFieldWeight = field.weight;
          matchedIn = field.location;
        }
      }
      // Farklı arama sözcükleri farklı alanlarda geçebilir, ancak tümü aranır.
      if (!groupScore) {
        score = 0;
        break;
      }
      score += groupScore;
    }

    if (!score) continue;
    const titleNormalized = fields[0].text.trim();
    if (titleNormalized === normalizedQuery) score += 90;
    else if (titleNormalized.includes(' ' + normalizedQuery + ' ')) score += 12;
    if (item.type === 'Blog' || item.type === 'Tanı Tuzağı') score += 3;
    ranked.push({ item, score, matchedIn });
  }

  return ranked.sort((a, b) =>
    b.score - a.score || a.item.title.localeCompare(b.item.title, 'tr'),
  );
}
