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
  { id: 'renal-tfe3-bap1-false-translocation', terms: ['tfe3 pozitifligi translokasyon', 'bap1 kayipli seffaf hucreli', 'tfe3 pozitif renal', 'native tfe3 expression'] },
  { id: 'renal-tfeb-ihc-vs-alteration', terms: ['tfeb degisikligi tasiyan', 'tfeb iliskili bobrek', 'tfeb rearranged renal', 'tfeb amplifikasyonu'] },
  { id: 'renal-oncocytic-gpnmb-lot-evt', terms: ['gpnmb onkositik', 'onkositik bobrek tumorleri', 'low grade oncocytic tumour', 'eosinophilic vacuolated tumor', 'lot evt'] },
  { id: 'urothelial-lateral-spread-vs-cis', terms: ['papiller urotelyal karsinomda lateral', 'lateral yayilim cis', 'lateral spread urothelial'] },
  { id: 'urothelial-focal-high-grade-percent', terms: ['papiller urotelyal karsinomda 5 yuksek', 'fokal yuksek derece urotelyal', 'urothelial focal high grade'] },
  { id: 'soft-tissue-stat6-sft-vs-ddlps', terms: ['stat6 pozitif retroperitoneal', 'stat6 pozitif ddlps', 'stat6 amplified liposarcoma', 'stat6 pozitif sft'] },
  { id: 'soft-tissue-ddlps-no-fat-core', terms: ['dedifferentiated liposarcoma', 'dediferansiye liposarkom', 'yag icermeyen biyopside', 'ddlps'] },
  { id: 'soft-tissue-pantrk-negative-ntrk-fusion', terms: ['pan trk negatifligi', 'pan trk negativity', 'ntrk fuzyonunu dislar', 'ntrk fusion immunohistochemistry'] },
  { id: 'bone-chondroblastoma-k36m-vs-giantcell', terms: ['chondroblastoma', 'k36m pozitifligi', 'h3 k36m'] },
  { id: 'bone-mesenchymal-chondrosarcoma-ncoa2-fish', terms: ['mezenkimal kondrosarkomda ncoa2', 'ncoa2 fish negatifligi', 'hey1 ncoa2 fusion'] },
  { id: 'bone-bnct-vs-chordoma', terms: ['benign notochordal cell tumour', 'bnct ile kordoma', 'benign notokordal', 'chordoma ayrimini ihk'] },
  { id: 'gi-barrett-basal-crypt-dysplasia-p53', terms: ['barrett ozofagusunda bazal kript', 'barrett biyopsisinde p53', 'bazal kript displazisi', 'barrett dysplasia p53'] },
  { id: 'gi-gastroblastoma-gli1-biphasic', terms: ['gastroblastom', 'gastroblastoma', 'bifazik mide tumorunde gli1'] },
  { id: 'molecular-mtap-loss-ihc-vs-ngs', terms: ['mtap kaybinda ihk', 'mtap loss ihc ngs', 'mtap homozigot delesyon'] },
  { id: 'molecular-erbb3-tumor-only-germline', terms: ['tumor only ngs de erbb3', 'erbb3 mutasyonu somatik', 'erbb3 germline polimorfizm'] },
  { id: 'molecular-pancreas-eus-dna-rna-qc', terms: ['pankreas eus biyopsisinde ngs', 'rna yetersiz olabilir', 'pankreas biyopsisinde dna rna', 'pancreatic eus ngs'] },
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
