// Podcast titles are already translated into Turkish.
// These *spoken-only* overrides never change what appears in the article cards,
// Google Sheets or PubMed links. Keep this list narrow: Ahenk already handles
// most pathology terminology and abbreviations correctly.
const FIXES: ReadonlyArray<{ pattern: RegExp; spoken: string }> = [
  // Hematoxylin-eosin staining: H&E and H & E.
  { pattern: /\bH\s*&\s*E\b/gi, spoken: 'Hematoksilen Eozin' },

  // The small 'p' immunohistochemistry markers are pronounced "pe".
  // Match only whole markers, never gene names such as TP53 or PIK3CA.
  { pattern: /\bp\s*-?\s*53\b/gi, spoken: 'pe 53' },
  { pattern: /\bp\s*-?\s*16\b/gi, spoken: 'pe 16' },
  { pattern: /\bp\s*-?\s*40\b/gi, spoken: 'pe 40' },
  { pattern: /\bp\s*-?\s*63\b/gi, spoken: 'pe 63' },
  { pattern: /\bp\s*-?\s*57\b/gi, spoken: 'pe 57' },

  // Ewing sarcoma is commonly pronounced "Yuing" in Turkish.
  { pattern: /\bEwing\b/gi, spoken: 'Yuing' },
];

export function prepareAhenkText(title: string): string {
  return FIXES.reduce((value, fix) => value.replace(fix.pattern, fix.spoken), title);
}
