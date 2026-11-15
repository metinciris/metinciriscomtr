import { describe, expect, it } from 'vitest';
import { getSearchNavigation } from './searchNavigation';

describe('genel arama yönlendirmesi', () => {
  it('tanı tuzağı detayını gerçek URL ile açar', () => {
    expect(getSearchNavigation('/tani-tuzaklari/niftp-yanilgisi/')).toEqual({
      mode: 'document',
      href: '/tani-tuzaklari/niftp-yanilgisi/',
    });
  });

  it('blog yazılarını doğrudan açar', () => {
    expect(getSearchNavigation('/blog/konu-basligi-123/')).toEqual({
      mode: 'document',
      href: '/blog/konu-basligi-123/',
    });
  });

  it('gelecekte eklenecek diğer alt sayfalarda da çalışır', () => {
    expect(getSearchNavigation('/egitim/konu/')).toEqual({
      mode: 'document',
      href: '/egitim/konu/',
    });
  });

  it('tanı tuzakları liste sayfasını SPA içinde açar', () => {
    expect(getSearchNavigation('/tani-tuzaklari/')).toEqual({
      mode: 'spa',
      page: 'tani-tuzaklari',
    });
  });

  it('normal sayfaları SPA içinde açar', () => {
    expect(getSearchNavigation('/kartvizit/')).toEqual({ mode: 'spa', page: 'kartvizit' });
    expect(getSearchNavigation('/ngs/')).toEqual({ mode: 'spa', page: 'ngs' });
  });

  it('ana sayfayı home kimliğine yönlendirir', () => {
    expect(getSearchNavigation('/')).toEqual({ mode: 'spa', page: 'home' });
  });
});
