/**
 * Arama sonuçlarında üst düzey sayfalar SPA içinde açılır.
 * /blog/yazi/ ve /tani-tuzaklari/konu/ gibi içerik detayları ise
 * gerçek URL'lerinden yüklenmelidir: registry'de yalnızca kök sayfalar vardır.
 */
export type SearchNavigation =
  | { mode: 'spa'; page: string }
  | { mode: 'document'; href: string };

export function getSearchNavigation(path: string): SearchNavigation {
  const page = path.replace(/^\/+|\/+$/g, '') || 'home';

  // Tüm iç içe adresler doğal bağlantı olarak açılır; gelecekteki detay
  // sayfaları için yeni bir özel durum yazmak gerekmez.
  if (page.includes('/')) {
    return { mode: 'document', href: path };
  }

  return { mode: 'spa', page };
}
