import { describe, expect, it } from 'vitest';
import { PITFALLS } from '../data/tani-tuzaklari';
import {
  PITFALL_BLOG_TOPICS,
  pitfallUrl,
  relatedPitfallIdsForPost,
  relatedPostsForPitfall,
} from './pitfallBlogLinks.js';

describe('Tanı tuzağı ve blog arası konu bağlantıları', () => {
  it('42 tanı tuzağı için benzersiz eşleştirme kuralı sağlar', () => {
    expect(PITFALL_BLOG_TOPICS.map((rule) => rule.id).sort()).toEqual(
      PITFALLS.map((p) => p.id).sort(),
    );
  });

  it('tiroid kapsül invazyonu yazısını doğru konuya bağlar', () => {
    expect(relatedPitfallIdsForPost({
      title: 'Kronik Tiroiditte Kapsül İnvazyonu Tuzağı: Fibrozis mi, Gerçek İnvazyon mu?',
    })).toContain('thyroid-capsular-invasion');
  });

  it('akciğer moleküler yazısını küçük hücreli karsinom olarak yanlış sınıflandırmaz', () => {
    expect(relatedPitfallIdsForPost({ title: 'Akciğer Adenokarsinomunda Yanlış KRAS G12C Pozitifliği' }))
      .not.toContain('lung-crush-smallcell');
  });

  it('sadece organ adı aynı diye bağlantı üretmez', () => {
    expect(relatedPitfallIdsForPost({ title: 'Tiroid Kanseri 2026 Güncel Tedaviler' })).toEqual([]);
  });

  it('blog yazılarını yalnızca gerçek yayın yolu ile eşleştirir', () => {
    const matches = relatedPostsForPitfall('thyroid-capsular-invasion', [
      { title: 'Kronik Tiroiditte Kapsül İnvazyonu', path: '/blog/thyroid-1019/' },
      { title: 'Tiroid kanseri', path: '/blog/general/' },
      { title: 'Kapsül İnvazyonu', path: 'https://other-domain.example/fake' },
    ]);
    expect(matches.map((item: {path:string}) => item.path)).toEqual(['/blog/thyroid-1019/']);
    expect(pitfallUrl('thyroid-capsular-invasion')).toBe('/tani-tuzaklari/thyroid-capsular-invasion/');
  });

  it('blog arşivindeki gerçek başlıklar 16 yeni rehbere bağlanır', () => {
    const cases: Array<[string, string]> = [
      ['TFE3 pozitifliği translokasyon demek değildir: BAP1 kayıplı şeffaf hücreli renal hücreli karsinom tuzağı', 'renal-tfe3-bap1-false-translocation'],
      ['TFEB Değişikliği Taşıyan Böbrek Tümörlerinde Tanısal Tuzak: Hangi Boyaya Güvenebiliriz?', 'renal-tfeb-ihc-vs-alteration'],
      ['GPNMB, Onkositik Böbrek Tümörlerinin Ayırıcı Tanısında Ne Kadar Yararlı?', 'renal-oncocytic-gpnmb-lot-evt'],
      ['Papiller Ürotelyal Karsinomda Lateral Yayılım: CIS mi, Tümörün Devamı mı?', 'urothelial-lateral-spread-vs-cis'],
      ['Papiller ürotelyal karsinomda %5 yüksek derece eşiği gerçekten güvenilir mi?', 'urothelial-focal-high-grade-percent'],
      ['STAT6 pozitif retroperitoneal sarkom: soliter fibröz tümör mü, dediferansiye liposarkom mu?', 'soft-tissue-stat6-sft-vs-ddlps'],
      ['29. Dedifferentiated liposarcoma: Yağ içermeyen biyopside tanıyı yakalamak', 'soft-tissue-ddlps-no-fat-core'],
      ['Pan-TRK negatifliği NTRK füzyonunu dışlar mı?', 'soft-tissue-pantrk-negative-ntrk-fusion'],
      ['60. Chondroblastoma. H3 K36M pozitifliği, dev hücreli bir kemik lezyonundaki neoplastik mononükleer hücreleri tanımayı kolaylaştırır.', 'bone-chondroblastoma-k36m-vs-giantcell'],
      ['Mezenkimal Kondrosarkomda NCOA2 FISH Negatifliği Tanıyı Dışlar mı?', 'bone-mesenchymal-chondrosarcoma-ncoa2-fish'],
      ['75. Benign notochordal cell tumour. Chordoma ayrımını İHK\'dan çok kemik destrüksiyonu ve myxoid-lobüler mimari belirler.', 'bone-bnct-vs-chordoma'],
      ['Barrett Özofagusunda Bazal Kript Displazisi ve p53', 'gi-barrett-basal-crypt-dysplasia-p53'],
      ['Gastroblastom: bifazik mide tümöründe GLI1 füzyonunu ne zaman aramalı?', 'gi-gastroblastoma-gli1-biphasic'],
      ['5 Ekim 2026: MTAP kaybında İHK ve NGS neden birlikte düşünülmeli?', 'molecular-mtap-loss-ihc-vs-ngs'],
      ['Tümör-Only NGS\'de ERBB3 Mutasyonu: Somatik Değişiklik mi, Germline Polimorfizm mi?', 'molecular-erbb3-tumor-only-germline'],
      ['Pankreas EUS Biyopsisinde NGS Yeterliliği: DNA Başarılı, RNA Yetersiz Olabilir', 'molecular-pancreas-eus-dna-rna-qc'],
    ];
    for (const [title, id] of cases) {
      expect(relatedPitfallIdsForPost({ title }, 50), title).toContain(id);
    }
  });

  it('yalnız organ, genel marker veya benzer adla yanlış ilişki kurmaz', () => {
    expect(relatedPitfallIdsForPost({ title: 'Genel böbrek kanseri tedavileri' })).toEqual([]);
    expect(relatedPitfallIdsForPost({ title: 'STAT6 sinyal yolağının immünolojideki rolü' })).toEqual([]);
    expect(relatedPitfallIdsForPost({ title: 'Mide kanserlerinde GLI1 ekspresyonu' })).toEqual([]);
  });

});
