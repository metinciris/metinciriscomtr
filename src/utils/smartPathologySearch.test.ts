import { describe, expect, it } from 'vitest';
import {
  getEquivalentTerms,
  getRelatedSearches,
  normalizeSearchText,
  prepareSearchIndex,
  rankSmartSearch,
  type SmartSearchEntry,
} from './smartPathologySearch';

const entries: SmartSearchEntry[] = [
  {
    title: 'HER2 değerlendirmesi',
    description: 'Meme patolojisinde reseptör değerlendirmesi.',
    path: '/blog/her2-10/',
    type: 'Blog',
    keywords: 'HER2 İHK',
    content: 'ERBB2 amplifikasyonu ve in situ hibridizasyonu.',
  },
  {
    title: 'MPNST ayırıcı tanısı',
    description: 'Sinir kılıfı tümörlerinin tanı tuzakları.',
    path: '/tani-tuzaklari/mpnst/',
    type: 'Tanı Tuzağı',
    keywords: 'Sinir, SOX10',
    content: 'S100 ve H3K27me3 yorumu.',
  },
  {
    title: 'Meme karsinomu incelemesi',
    description: 'Birden fazla belirteç ile değerlendirme.',
    path: '/blog/meme-11/',
    type: 'Blog',
    content: 'DCIS ayırıcı tanısında CK5/6, ER ve p63 kullanılabilir.',
  },
  {
    title: 'Kapsül invazyonu',
    description: 'Tiroid patolojisi',
    path: '/tani-tuzaklari/tiroid/',
    type: 'Tanı Tuzağı',
    keywords: 'NIFTP tiroid',
  },
  {
    title: 'Akciğer tümörlerinde belirteçler',
    description: 'TTF-1 ile başlayan değerlendirme',
    path: '/blog/akciger/',
    type: 'Blog',
  },
  {
    title: 'Östrojen reseptörü (ER)',
    description: 'Meme tümörlerinde ER İHK yorumu',
    path: '/blog/er/',
    type: 'Blog',
  },
];

const prepared = prepareSearchIndex(entries);
const results = (query: string) => rankSmartSearch(prepared, query).map((item) => item.item.path);

describe('akıllı patoloji araması', () => {
  it('Türkçe karakterleri ve noktalama farklarını aynı biçimde normalleştirir', () => {
    expect(normalizeSearchText('ŞEFFAF HÜCRELİ – İHK')).toBe('seffaf hucreli ihk');
    expect(normalizeSearchText('H3.3 K36M')).toBe('h3 3 k36m');
  });

  it('HER2 ve ERBB2 eş isimlerini ilişkilendirir', () => {
    expect(results('ERBB2')).toContain('/blog/her2-10/');
    expect(results('HER-2')).toContain('/blog/her2-10/');
    expect(getEquivalentTerms('HER2')).toContain('ERBB2');
  });

  it('S-100 ve S100 eşleşir, SOX10 için arama yapar', () => {
    expect(results('S-100')).toContain('/tani-tuzaklari/mpnst/');
    expect(results('SOX-10')).toContain('/tani-tuzaklari/mpnst/');
  });

  it('makalenin sadece özetinde değil gövdesindeki belirteçte de eşleşir', () => {
    expect(results('CK5/6')).toContain('/blog/meme-11/');
  });

  it('çok sözcüklü sorguyu farklı alanlarda karşılayabilir', () => {
    expect(results('MPNST SOX10')).toContain('/tani-tuzaklari/mpnst/');
    expect(results('DCIS CK5/6')).toContain('/blog/meme-11/');
  });

  it('başlıkta eşleşen sonuç metinde eşleşenden önce gelir', () => {
    expect(results('ER')[0]).toBe('/blog/er/');
  });

  it('kısa belirteç aramalarında sözcük sınırını korur', () => {
    expect(results('ER')).not.toContain('/blog/her2-10/');
    expect(results('ERBB2')).not.toContain('/blog/er/');
  });

  it('sonuçları eşleşme alanıyla birlikte döndürür', () => {
    const matches = rankSmartSearch(prepared, 'NIFTP');
    expect(matches[0].matchedIn).toBe('Etiket');
    expect(matches[0].item.path).toBe('/tani-tuzaklari/tiroid/');
  });

  it('ilgisiz sorgular için boş sonuç döndürür', () => {
    expect(results('xyz bilinmeyen')).toEqual([]);
    expect(results('')).toEqual([]);
  });

  it('ilgili aramaları tanıya dönüştürmeden önerir', () => {
    expect(getRelatedSearches('SOX10')).toContain('S100');
    expect(getRelatedSearches('NIFTP')).toContain('Kapsül invazyonu');
  });
});
