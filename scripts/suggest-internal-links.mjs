/**
 * Blog Issue'larini okur; mevcut yaziya dokunmadan dahili baglanti onerileri
 * icin tek bir GitHub Issue raporu olusturur/gunceller.
 * Gereksinim: Node 24, GITHUB_TOKEN (issues:write).
 */
const repo = process.env.GITHUB_REPOSITORY || 'metinciris/metinciriscomtr';
const token = process.env.GITHUB_TOKEN;
if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('GITHUB_TOKEN / GITHUB_REPOSITORY eksik');
const api = 'https://api.github.com/repos/' + repo;
const reportTitle = 'Blog dahili bağlantı önerileri (otomatik)';
const common = new Set(('ve veya ile icin için gibi daha ancak olan olarak genel klinik tanı tani tedavi ayırıcı ayirici tümör tumor tümörler hasta olgu patoloji histolojik morfoloji immunhistokimya moleküler değerlendirme değerlendirilmesi bölüm bölümünde önemlidir görülür gösterir ayrıca olabilir ilişkili özellikleri tanısal bulgular sonuç yaklaşım güncel').split(/\s+/));

async function request(path, options = {}) {
  const response = await fetch(path.startsWith('https:') ? path : api + path, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(response.status + ' ' + path + ': ' + (await response.text()).slice(0, 500));
  return response.status === 204 ? null : response.json();
}
async function paginate(path) {
  const result = [];
  for (let page = 1; page <= 30; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const batch = await request(path + sep + 'per_page=100&page=' + page);
    if (!Array.isArray(batch)) throw new Error('GitHub API dizi döndürmedi');
    result.push(...batch);
    if (batch.length < 100) return result;
  }
  throw new Error('3000 Issue sınırı aşıldı; eksik analiz yapılmıyor');
}
function slug(title, number) {
  const base = String(title || '').toLocaleLowerCase('tr-TR')
    .replace(/[ç]/g, 'c').replace(/[ğ]/g, 'g').replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o').replace(/[ş]/g, 's').replace(/[ü]/g, 'u')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' ve ').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-')
    .slice(0, 90).replace(/-+$/g, '');
  return (base || 'blog-yazisi') + '-' + number;
}
function words(text) {
  return String(text || '').toLocaleLowerCase('tr-TR')
    .replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-zçğıöşü0-9]+/gi, ' ').split(/\s+/)
    .filter(x => x.length >= 4 && !common.has(x) && !/^\d+$/.test(x));
}
function overlap(a, b, weights) {
  let numerator = 0, denominator = 0;
  for (const w of a) {
    const weight = weights.get(w) || 1;
    denominator += weight;
    if (b.has(w)) numerator += weight;
  }
  return denominator ? numerator / denominator : 0;
}
const all = await paginate('/issues?state=open&sort=created&direction=desc');
const posts = all.filter(i => !i.pull_request && i.labels?.some(l => l.name?.toLocaleLowerCase('tr-TR') === 'blog'))
  .map(i => ({
    ...i, titleWords: new Set(words(i.title)),
    contentWords: new Set(words((i.title || '') + ' ' + (i.body || '').slice(0, 12000))),
    url: 'https://metinciris.com.tr/blog/' + slug(i.title, i.number) + '/',
  }));
const frequency = new Map();
for (const p of posts) for (const w of p.contentWords) frequency.set(w, (frequency.get(w) || 0) + 1);
const weights = new Map([...frequency].map(([w, n]) => [w, 1 + Math.log(1 + posts.length / n)]));
const lines = [
  '# Blog dahili bağlantı önerileri',
  '',
  '> Otomatik metin benzerliği analizidir; bilimsel doğruluk ve bağlam kontrolü sonrası uygulanmalıdır. Hiçbir blog yazısı değiştirilmemiştir.',
  '',
  'İncelenen açık Blog Issue sayısı: **' + posts.length + '**. Üretim tarihi: ' + new Date().toISOString().slice(0, 10) + '.',
  '',
  'Önerilen bağlantılar için ilgili yazının uygun bir paragrafına, konuyla doğal biçimde bütünleşen açıklayıcı bağlantı metni ekleyin. Zoraki ve yinelenen bağlantılardan kaçının.',
  '',
];
let linked = 0;
for (const a of posts) {
  const candidates = [];
  for (const b of posts) {
    if (a.number === b.number) continue;
    if ((a.body || '').includes(b.url)) continue;
    const titleMatch = overlap(b.titleWords, a.contentWords, weights);
    const reverse = overlap(a.titleWords, b.contentWords, weights);
    const shared = [...a.titleWords].filter(w => b.titleWords.has(w));
    // Belirsiz, yalnizca genis patoloji terminolojisine dayali adaylari ele.
    if (titleMatch < 0.42 || (shared.length < 1 && reverse < 0.25)) continue;
    const score = 0.7 * titleMatch + 0.3 * reverse;
    candidates.push({ b, score, shared });
  }
  candidates.sort((x, y) => y.score - x.score);
  if (!candidates.length) continue;
  linked++;
  lines.push('## [#' + a.number + ' ' + a.title.replace(/\r?\n/g, ' ') + '](' + a.url + ')', '');
  for (const c of candidates.slice(0, 3)) {
    lines.push('- **' + Math.round(c.score * 100) + '/100** — [' + c.b.title.replace(/\r?\n/g, ' ') + '](' + c.b.url + ')'
      + ' · [Kaynak Issue](' + c.b.html_url + ')'
      + (c.shared.length ? ' · Ortak terimler: ' + c.shared.slice(0, 5).join(', ') : ' · Metin bağlamı kontrol edilmeli'));
  }
  lines.push('');
}
if (!linked) lines.push('Bu çalıştırmada eşik değerini karşılayan bağlantı önerisi bulunmadı.', '');
lines.push('---', 'Rapor: [GitHub Actions](https://github.com/' + repo + '/actions/workflows/blog-internal-links.yml) · Öneriler otomatik yayımlanmaz.');
let body = lines.join('\n');
if (body.length > 60000) body = body.slice(0, 59000) + '\n\n_Rapor GitHub Issue boyutu nedeniyle kısaltıldı._';
const existing = all.find(i => !i.pull_request && i.title === reportTitle);
const endpoint = existing ? '/issues/' + existing.number : '/issues';
const result = await request(endpoint, { method: existing ? 'PATCH' : 'POST', body: JSON.stringify(existing ? { body } : { title: reportTitle, body }) });
console.log(posts.length + ' yazı incelendi; ' + linked + ' yazı için öneri. Rapor: ' + result.html_url);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### Dahili bağlantı taraması\n\n' + posts.length + ' yazı, ' + linked + ' öneri alan yazı. [Rapor](' + result.html_url + ')\n');
}
