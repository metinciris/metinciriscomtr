/**
 * Hafif PubMed kaynak kontrolu. Blog Issue'larini DEGISTIRMEZ.
 * Node 24; anahtarsiz NCBI ESummary ile PMID, DOI ve baslik uyumunu denetler.
 */
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const REPORT_TITLE = 'Blog kaynak ve PubMed doğrulama raporu (otomatik)';
const WEEKLY_POSTS = 35;
const RECENT_POSTS = 10;
const NCBI_BATCH_SIZE = 80;
const WEEKLY_PMID_LIMIT = 500;
const FULL_PMID_LIMIT = 5000;

function cleanDoi(value) {
  if (!value) return '';
  let decoded = String(value);
  try { decoded = decodeURIComponent(decoded); } catch { /* malformed percent escapes */ }
  let result = decoded.trim().replace(/[.,;:}\]]+$/g, '');
  // Markdown linkleri ')' ile biter; DOI'nin kendi dengeli parantezlerini koru.
  while (result.endsWith(')') &&
    (result.match(/\)/g) || []).length > (result.match(/\(/g) || []).length) {
    result = result.slice(0, -1);
  }
  return result.toLowerCase();
}

function titleTokens(value) {
  const stop = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'using', 'among', 'about', 'study', 'its']);
  return new Set(String(value || '')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().split(/[^a-z0-9]+/)
    .filter(word => word.length >= 3 && !stop.has(word)));
}

export function titleSimilarity(a, b) {
  const x = titleTokens(a), y = titleTokens(b);
  if (!x.size || !y.size) return 0;
  let common = 0;
  for (const token of x) if (y.has(token)) common++;
  return (2 * common) / (x.size + y.size);
}

export function parseReferences(body) {
  const result = [];
  let inCode = false;
  for (const [index, line] of String(body || '').split(/\r?\n/).entries()) {
    if (/^\s*```/.test(line)) { inCode = !inCode; continue; }
    if (inCode || !/(?:pubmed\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov\/pubmed|\bPMID\s*:|doi\.org\/)/i.test(line)) continue;
    const linkIds = [...line.matchAll(/https?:\/\/(?:pubmed\.ncbi\.nlm\.nih\.gov|(?:www\.)?ncbi\.nlm\.nih\.gov\/pubmed)\/(\d{5,9})(?=[/?#)\]\s]|$)/gi)].map(m => m[1]);
    const textIds = [...line.matchAll(/\bPMID\s*:\s*(\d{5,9})\b/gi)].map(m => m[1]);
    const ids = [...new Set([...linkIds, ...textIds])];
    const doiText = line.match(/\bDOI\s*:\s*(10\.\d{4,9}\/[^\s<>\]]+)/i)?.[1] || '';
    const doiLink = line.match(/https?:\/\/(?:dx\.)?doi\.org\/(10\.\d{4,9}\/[^\s<>\]]+)/i)?.[1] || '';
    const citedTitle = line.match(/\*([^*]{15,260})\*/)?.[1] || '';
    result.push({ line: index + 1, raw: line, linkIds, textIds, ids,
      doiText: cleanDoi(doiText), doiLink: cleanDoi(doiLink), citedTitle });
  }
  return result;
}

export function checkReference(ref, metadata) {
  const findings = [];
  const add = (reason, kind = 'Şüpheli') => findings.push({ line: ref.line, reason, kind, raw: ref.raw });
  if (/https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\//i.test(ref.raw) && !ref.linkIds.length) {
    add('PubMed bağlantısında geçerli sayısal PMID bulunamadı.');
  }
  if (ref.linkIds.length && ref.textIds.length && ref.linkIds[0] !== ref.textIds[0]) {
    add(`Metindeki PMID (${ref.textIds[0]}) ile PubMed URL PMID (${ref.linkIds[0]}) farklı.`);
  }
  if (ref.doiText && ref.doiLink && ref.doiText !== ref.doiLink) {
    add(`Yazılı DOI (${ref.doiText}) ile DOI bağlantısı (${ref.doiLink}) farklı.`);
  }
  for (const id of ref.ids) {
    if (!metadata.has(id)) continue; // Query limit; counted separately in summary.
    const entry = metadata.get(id);
    if (!entry || entry.error || !entry.title) {
      add(`PMID ${id} için PubMed kaydı doğrulanamadı; uydurma/yanlış numara olabilir.`);
    }
  }
  const primaryId = ref.linkIds[0] || ref.textIds[0];
  const entry = metadata.get(primaryId);
  if (entry && !entry.error && entry.title) {
    const publishedDoi = cleanDoi(entry.articleids?.find(item => item.idtype === 'doi')?.value || '');
    const citedDoi = ref.doiText || ref.doiLink;
    if (publishedDoi && citedDoi && publishedDoi !== citedDoi) {
      add(`PMID ${primaryId} PubMed DOI'si (${publishedDoi}), kaynakta yazılı DOI (${citedDoi}) ile uyuşmuyor.`);
    }
    if (ref.citedTitle && titleTokens(ref.citedTitle).size >= 5 && titleTokens(entry.title).size >= 5
        && titleSimilarity(ref.citedTitle, entry.title) < 0.43) {
      add(`PMID ${primaryId} için kaynak başlığı PubMed başlığıyla düşük benzerlikte: “${entry.title}”.`, 'Başlık incelemesi');
    }
  }
  return findings;
}

export function choosePosts(posts, fullScan = false, date = new Date()) {
  if (fullScan || posts.length <= WEEKLY_POSTS) return posts;
  const recent = posts.slice(0, RECENT_POSTS);
  const older = posts.slice(RECENT_POSTS);
  const rotatingCount = WEEKLY_POSTS - recent.length;
  const week = Math.floor(date.getTime() / (7 * 86400000));
  const start = (week * rotatingCount) % older.length;
  return [...recent, ...Array.from({ length: rotatingCount }, (_, i) => older[(start + i) % older.length])];
}

async function githubRequest(urlOrPath, token, repo, options = {}) {
  const url = urlOrPath.startsWith('https://') ? urlOrPath : `https://api.github.com/repos/${repo}${urlOrPath}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${url}: ${(await response.text()).slice(0, 200)}`);
  return response.json();
}

async function loadBlogIssues(token, repo) {
  const all = [];
  for (let page = 1; page <= 30; page++) {
    const items = await githubRequest(`/issues?state=open&labels=Blog&sort=updated&direction=desc&per_page=100&page=${page}`, token, repo);
    all.push(...items.filter(item => !item.pull_request));
    if (items.length < 100) return all;
  }
  throw new Error('Blog listesi 3000 Issue sınırını aştı; eksik analiz yapılmadı.');
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function pubmedSummaries(ids) {
  const metadata = new Map();
  for (let index = 0; index < ids.length; index += NCBI_BATCH_SIZE) {
    if (index) await sleep(450); // NCBI anonymous usage: <= 3 requests/s.
    const group = ids.slice(index, index + NCBI_BATCH_SIZE);
    const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?' +
      new URLSearchParams({ db: 'pubmed', id: group.join(','), retmode: 'json', tool: 'metinciris_blog_reference_audit' });
    let payload;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
        if (!response.ok) throw new Error(`NCBI HTTP ${response.status}`);
        payload = await response.json();
        if (!payload?.result?.uids) throw new Error('NCBI yanıtı beklenen biçimde değil');
        break;
      } catch (error) {
        if (attempt === 2) throw new Error(`NCBI verisine ulaşılamadı; yanlış kaynak alarmı üretilmedi: ${error.message}`);
        await sleep(1000 * (attempt + 1));
      }
    }
    for (const id of group) metadata.set(id, payload.result[id] || null);
  }
  return metadata;
}

function summaryLine(text, max = 270) {
  return String(text || '').replace(/\s+/g, ' ').replace(/`/g, "'").slice(0, max);
}

function reportBody({ repo, total, selected, refs, ids, checked, findings, fullScan, date }) {
  const lines = [
    '# Blog kaynak ve PubMed doğrulama raporu', '',
    '> Bu rapor NCBI PubMed ESummary kayıtlarıyla **varlık ve bibliyografik eşleşme** denetimidir. Makalenin bilimsel iddialarını otomatik doğrulamaz. Şüpheli eşleşmeler yanlış pozitif olabilir; insan incelemesi gerekir. **Hiçbir blog yazısı değiştirilmedi.**', '',
    `- Tarih: ${date.toISOString().slice(0, 16)} UTC`,
    `- Mod: ${fullScan ? 'Elle başlatılan tam tarama' : 'Haftalık hafif tarama (10 güncel + 25 dönüşümlü)'}`,
    `- Toplam açık Blog yazısı: **${total}**; incelenen: **${selected}**`,
    `- İncelenen kaynak satırı: **${refs}**; farklı PMID: **${ids}**; NCBI üzerinden sorgulanan: **${checked}**`,
    `- Şüpheli uyumsuzluk: **${findings.length}**`, '',
  ];
  if (ids > checked) lines.push(`> **Sınır:** ${ids - checked} PMID yük sınırından dolayı bu çalıştırmada kontrol edilemedi.`, '');
  if (!findings.length) lines.push('## Sonuç', '', 'Bu örneklemde şüpheli PMID/DOI/başlık uyuşmazlığı bulunmadı.', '');
  else {
    lines.push('## Kontrol gerektiren kaynaklar', '');
    let shown = 0;
    for (const item of findings) {
      if (shown >= 100 || lines.join('\n').length >= 53000) break;
      lines.push(`- **[Issue #${item.number}](https://github.com/${repo}/issues/${item.number})**, satır ${item.line} — ${item.kind}: ${summaryLine(item.reason, 300)}`);
      lines.push(`  - Kaynak: ${summaryLine(item.raw)}`);
      shown++;
    }
    if (findings.length > shown) lines.push('', `> Rapor kısaltıldı: ${findings.length - shown} ek bulgu Actions günlüklerinde/sonraki taramalarda incelenmeli.`);
  }
  lines.push('', '---', 'PubMed API anahtarı kullanılmaz. Bağlantılar otomatik düzeltilmez veya kaldırılmaz. Haftalık çalışır; eski yazılar dönüşümlü denetlenir.',
    `[İş akışı](https://github.com/${repo}/actions/workflows/blog-source-audit.yml)`);
  return lines.join('\n').slice(0, 60000);
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repo || '')) throw new Error('GITHUB_TOKEN ve GITHUB_REPOSITORY zorunludur');
  const fullScan = process.env.FULL_SCAN === 'true';
  const issues = await loadBlogIssues(token, repo);
  const selected = choosePosts(issues, fullScan);
  const entries = selected.flatMap(issue => parseReferences(issue.body).map(ref => ({ ...ref, number: issue.number })));
  const ids = [...new Set(entries.flatMap(item => item.ids))];
  const limit = fullScan ? FULL_PMID_LIMIT : WEEKLY_PMID_LIMIT;
  const metadata = await pubmedSummaries(ids.slice(0, limit));
  const findings = entries.flatMap(item => checkReference(item, metadata).map(finding => ({ ...finding, number: item.number })));
  const date = new Date();
  const body = reportBody({ repo, total: issues.length, selected: selected.length, refs: entries.length,
    ids: ids.length, checked: metadata.size, findings, fullScan, date });
  const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${repo} in:title "${REPORT_TITLE}"`)}&per_page=30`;
  const matches = await githubRequest(searchUrl, token, repo);
  const previous = matches.items?.find(item => item.title === REPORT_TITLE && !item.pull_request && item.state === 'open');
  const saved = await githubRequest(previous ? `/issues/${previous.number}` : '/issues', token, repo, {
    method: previous ? 'PATCH' : 'POST',
    body: JSON.stringify(previous ? { body } : { title: REPORT_TITLE, body }),
  });
  console.log(`${selected.length}/${issues.length} Blog Issue, ${metadata.size} PMID, ${findings.length} şüpheli kaynak. ${saved.html_url}`);
  for (const f of findings) console.log(`Issue #${f.number} line ${f.line}: ${f.reason}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `### PubMed kaynak denetimi\n\n${selected.length} yazı, ${metadata.size} PMID, ${findings.length} şüpheli kaynak. [Rapor](${saved.html_url})\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
