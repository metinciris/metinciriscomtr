/**
 * Ayni konu kurallari tarayicida ve statik blog olusturucusunda kullanilir.
 * Eslesmeler YALNIZCA yazi basligina gore yapilir; organ benzerligi tek basina yeterli degildir.
 * Amac ilgisiz yazilara teshis atfetmeden, dikkatle secilmis okuyucu baglantilari sunmaktir.
 */
export const PITFALL_BLOG_TOPICS = [
  { id: 'lung-crush-smallcell', terms: ['crush artefakt', 'crush artifact', 'ezilme artefakt', 'kucuk hucreli karsinom', 'small cell carcinoma'] },
  { id: 'meningioma-atypical-grade2', terms: ['atipik meningiom', 'atypical meningioma', 'meningioma grade 2', 'meningiom grade 2', 'beyin invazyonu'] },
  { id: 'meningioma-fibrous-vs-schwannoma', terms: ['fibroz meningiom', 'fibrous meningioma', 'schwannoma', 'schwannom'] },
  { id: 'meningioma-molecular-grade3', terms: ['meningiom grade 3', 'meningioma grade 3', 'meningiomda tert', 'meningiomda cdkn2a', 'molekuler meningiom'] },
  { id: 'gi-cautery-dysplasia-margin', terms: ['koter artefakt', 'cautery artifact', 'termal hasar', 'termal artefakt'] },
  { id: 'floater-contamination', terms: ['floater', 'kontaminasyon', 'contamination', 'yabanci doku'] },
  { id: 'sampling-error-negative-trap', terms: ['ornekleme hatasi', 'biyopsi yeterliligi', 'biyopsi yetersizligi', 'kucuk biyopside', 'eus biyopsisinde ngs'] },
  { id: 'ihc-nonspecific-falsepositive', terms: ['immunohistokimya', 'immunositokimya', 'pan trk negatifligi', 'tek belirtec', 'yanlis pozitif', 'capraz reaksiyon', 'boyanma paterni', 'boya her zaman'] },
  { id: 'prostate-adenosis-atrophy-vs-carcinoma', terms: ['prostat adenozis', 'prostat atrofi', 'asap', 'small acinar proliferation'] },
  { id: 'colon-pseudoinvasion', terms: ['psodoinvazyon', 'pseudoinvasion', 'gland misplacement', 'kolon polibinde invazyon'] },
  { id: 'breast-ecadherin-pitfall', terms: ['e cadherin', 'e kadherin', 'lobuler duktal', 'lobular ductal', 'lobuler karsinom', 'lobular carcinoma'] },
  { id: 'cervix-p16-ki67-trap', terms: ['serviks p16', 'servikste p16', 'p16 ki 67', 'servikal metaplazi', 'hsil'] },
  { id: 'thyroid-niftp-fvptc-sampling', terms: ['niftp', 'fvptc', 'folikuler varyant papiller', 'follicular variant papillary'] },
  { id: 'pleura-mesothelioma-vs-metastasis-panel', terms: ['mezotelyoma', 'mesothelioma', 'plevra metastazi', 'pleural metastasis', 'mezotelyal'] },
  { id: 'ln-benign-inclusions-metastasis', terms: ['lenf nodu inkluzyon', 'benign inkluzyon', 'lymph node inclusion'] },
  { id: 'urine-cytology-reactive-vs-hg', terms: ['idrar sitolojisi', 'urine cytology', 'hguc', 'yuksek dereceli urotelyal sitoloji'] },
  { id: 'frozen-ovary-mucinous-sampling', terms: ['over frozen', 'ovary frozen', 'frozen over', 'musinoz over', 'mucinous ovarian'] },
  { id: 'reporting-uncertainty-language', terms: ['tanisal sinirlar', 'tanisal guvenilirlik', 'belirsizlik yonetimi', 'raporlama belirsizligi'] },
  { id: 'thyroid-htt-vs-ptc', terms: ['hiyalinize trabekuler', 'hyalinizing trabecular', 'htt tiroid'] },
  { id: 'thyroid-hashimoto-vs-lymphoma', terms: ['hashimoto lenfoma', 'tiroid lenfomasi', 'thyroid lymphoma', 'malt tiroid'] },
  { id: 'thyroid-cyst-papillary-mimic', terms: ['papiller hiperplazi', 'papillary hyperplasia', 'graves'] },
  { id: 'thyroid-medullary-vs-follicular', terms: ['meduller tiroid', 'medullary thyroid', 'kalsitonin', 'calcitonin'] },
  { id: 'thyroid-c-cell-hyperplasia', terms: ['c hucre hiperplazisi', 'c cell hyperplasia', 'meduller mikrokarsinom'] },
  { id: 'thyroid-parathyroid-mimic', terms: ['intratiroidal paratiroid', 'intrathyroidal parathyroid', 'paratiroid', 'parathyroid'] },
  { id: 'thyroid-capsular-invasion', terms: ['kapsul invazyonu', 'capsular invasion', 'folikuler tiroid karsinomu', 'thyroid follicular carcinoma'] },
  { id: 'thyroid-oncocytic-features', terms: ['onkositik tiroid', 'oncocytic thyroid', 'hurthle', 'hurtle', 'onkositik nodul'] },
];

/** URL'de kaynak veri ID'si kullanilir: kisa, kalici ve yeniden adlandirmadan etkilenmez. */
export function pitfallUrl(id) {
  return '/tani-tuzaklari/' + encodeURIComponent(id) + '/';
}

export function normalizePitfallText(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function matchesPitfallTopic(title, terms) {
  const haystack = ' ' + normalizePitfallText(title) + ' ';
  return terms.some((term) => {
    const needle = normalizePitfallText(term);
    return needle && haystack.includes(' ' + needle + ' ');
  });
}

/**
 * Yalnizca somut baslik eslesmeleri. "Meme", "tiroid" gibi genis organ
 * adlari eslesme anahtari DEGILDIR.
 */
export function relatedPitfallIdsForPost(post, limit = 4) {
  const title = typeof post === 'string' ? post : post?.title || '';
  if (!title) return [];
  return PITFALL_BLOG_TOPICS
    .filter((item) => matchesPitfallTopic(title, item.terms))
    .slice(0, limit)
    .map((item) => item.id);
}

export function relatedPostsForPitfall(pitfallId, posts, limit = 6) {
  const topic = PITFALL_BLOG_TOPICS.find((item) => item.id === pitfallId);
  if (!topic || !Array.isArray(posts)) return [];
  // Kaynagi blogun yayinlanmis (posts.json) listesi oldugu icin hayali baglanti yok.
  return posts
    .filter((post) => post && typeof post.title === 'string' &&
      typeof post.path === 'string' &&
      post.path.startsWith('/blog/') &&
      matchesPitfallTopic(post.title, topic.terms))
    .slice(0, limit);
}
