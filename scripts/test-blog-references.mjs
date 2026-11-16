import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReferences, checkReference, titleSimilarity, choosePosts } from './check-blog-references.mjs';

test('PubMed linki, PMID, DOI ve baslik dogru ayrisiyor', () => {
  const rows = parseReferences('3. Author. *How I diagnose Erdheim-Chester disease.* J Pathol. PMID: 42624824. DOI: 10.1093/ajcp/aqag094. [PubMed](https://pubmed.ncbi.nlm.nih.gov/42624824/) [DOI](https://doi.org/10.1093/ajcp/aqag094)');
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].ids, ['42624824']);
  assert.equal(rows[0].doiText, '10.1093/ajcp/aqag094');
  assert.equal(rows[0].doiLink, '10.1093/ajcp/aqag094');
  assert.match(rows[0].citedTitle, /Erdheim/);
});

test('DOI icindeki parantezler korunurken markdown kapatma parantezi ayiklanir', () => {
  const rows = parseReferences('5. A. *Phenotype, treatment, and determinants of prognosis in Erdheim-Chester disease.* PMID: 42880331. DOI: 10.1016/S2352-3026(26)00247-4. [PubMed](https://pubmed.ncbi.nlm.nih.gov/42880331/) [DOI](https://doi.org/10.1016/S2352-3026(26)00247-4)');
  assert.equal(rows[0].doiText, '10.1016/s2352-3026(26)00247-4');
  assert.equal(rows[0].doiLink, '10.1016/s2352-3026(26)00247-4');
});

test('Dogrulanmis PubMed kaydi icin alarm verilmez', () => {
  const ref = parseReferences('X. *Cyclin D1 Overexpression With Cytoplasmic Localization Distinguishes Erdheim-Chester Disease From Reactive Histiocytic Infiltrates.* PMID: 41495601. DOI: 10.1097/PAS.0000000000002506. [PubMed](https://pubmed.ncbi.nlm.nih.gov/41495601/)')[0];
  const metadata = new Map([['41495601', { title: ref.citedTitle, articleids: [{idtype:'doi', value:'10.1097/PAS.0000000000002506'}] }]]);
  assert.deepEqual(checkReference(ref, metadata), []);
});

test('Yanlis PubMed kimligi raporlanir', () => {
  const ref = parseReferences('[PubMed](https://pubmed.ncbi.nlm.nih.gov/99999999/)')[0];
  const findings = checkReference(ref, new Map([['99999999', null]]));
  assert.ok(findings.some(x => x.reason.includes('doğrulanamadı')));
});

test('PMID bağlantısı ve yazılı kimlik farkı yakalanır', () => {
  const ref = parseReferences('PMID: 12345678 [PubMed](https://pubmed.ncbi.nlm.nih.gov/87654321/)')[0];
  const findings = checkReference(ref, new Map());
  assert.ok(findings.some(x => x.reason.includes('farklı')));
});

test('DOI uyumsuzlugu saptanir', () => {
  const ref = parseReferences('DOI: 10.1000/xyz [DOI](https://doi.org/10.1000/abc)')[0];
  const findings = checkReference(ref, new Map());
  assert.ok(findings.some(x => x.reason.includes('DOI bağlantısı')));
});

test('PubMed DOI uyumsuzlugu saptanir', () => {
  const ref = parseReferences('PMID: 12345678 DOI: 10.1000/xyz')[0];
  const findings = checkReference(ref, new Map([['12345678', {title:'Example title', articleids: [{idtype:'doi',value:'10.1000/abc'}]}]]));
  assert.ok(findings.some(x => x.reason.includes('PubMed DOI')));
});

test('Benzer olmayan baslik manuel incelemeye gider', () => {
  const ref = parseReferences('*Genetic analysis of kidney tumours reveals molecular subtypes.* PMID: 12345678')[0];
  const findings = checkReference(ref, new Map([['12345678', {title:'Brain imaging techniques in healthy volunteers',articleids:[]}]]));
  assert.ok(findings.some(x => x.kind === 'Başlık incelemesi'));
  assert.ok(titleSimilarity('How I diagnose Erdheim-Chester disease', 'How I Diagnose Erdheim Chester Disease') > 0.8);
});

test('Kod bloklari es gecilir', () => {
  assert.equal(parseReferences('```
PMID: 12345678
```
PMID: 87654321').length, 1);
});

test('Haftalik denetim 10 yeni ve 25 rotasyonlu eski issue ile sinirli', () => {
  const posts = Array.from({length:200}, (_,index) => ({number:index}));
  const selected = choosePosts(posts, false, new Date('2026-11-16T00:00:00Z'));
  assert.equal(selected.length, 35);
  assert.deepEqual(selected.slice(0,10).map(x=>x.number), Array.from({length:10},(_,i)=>i));
  const nextWeek = choosePosts(posts, false, new Date('2026-11-23T00:00:00Z'));
  assert.notDeepEqual(selected.slice(10).map(x=>x.number), nextWeek.slice(10).map(x=>x.number));
  assert.equal(choosePosts(posts, true).length, 200);
});
