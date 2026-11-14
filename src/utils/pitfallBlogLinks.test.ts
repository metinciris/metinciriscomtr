import { describe, expect, it } from 'vitest';
import { PITFALLS } from '../data/tani-tuzaklari';
import {
  PITFALL_BLOG_TOPICS,
  pitfallUrl,
  relatedPitfallIdsForPost,
  relatedPostsForPitfall,
} from './pitfallBlogLinks.js';

describe('Tanı tuzağı ve blog arası konu bağlantıları', () => {
  it('tüm tanı tuzakları için benzersiz eşleştirme kuralı sağlar', () => {
    expect(PITFALL_BLOG_TOPICS.map((rule) => rule.id).sort()).toEqual(
      PITFALLS.map((p) => p.id).sort(),
    );
  });

  it('kaynak Issue ile başlık değişse bile bağlantı kurar', () => {
    expect(relatedPitfallIdsForPost({ number: 995, title: 'Yeni üropatoloji başlığı' }))
      .toContain('renal-tfe3-not-fusion');
    expect(relatedPostsForPitfall('renal-tfe3-not-fusion', [
      { number: 995, title: 'Başlığı güncellendi', path: '/blog/yeni-baslik-995/' },
    ])).toHaveLength(1);
  });

  it('İlgisiz NGS haberini böbrek veya yumuşak doku tuzağına bağlamaz', () => {
    expect(relatedPitfallIdsForPost({ number: 543, title: 'Yeni NGS laboratuvar güncellemesi' }))
      .toEqual([]);
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
});
