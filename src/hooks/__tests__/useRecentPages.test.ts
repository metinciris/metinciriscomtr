import { describe, it, expect, beforeEach } from 'vitest';
import { PAGE_REGISTRY } from '../../core/data/registry';

// Global localStorage mock for Node test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof global.localStorage === 'undefined') {
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
  });
}

describe('useRecentPages registry integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('PAGE_REGISTRY içindeki araç sayfaları navLabel ve slug alanlarına sahiptir', () => {
    const gistMeta = PAGE_REGISTRY['gist-raporlama'];
    expect(gistMeta).toBeDefined();
    expect(gistMeta.navLabel).toBe('GİST Raporlama');
    expect(gistMeta.slug).toBe('gist-raporlama');
  });

  it('localStorage verisi JSON olarak kaydedilip geri okunabilir', () => {
    const items = [
      { id: 'gist-raporlama', navLabel: 'GİST Raporlama', slug: 'gist-raporlama' },
      { id: 'rcb-calculator', navLabel: 'RCB Hesaplayıcı', slug: 'rcb-calculator' },
    ];
    localStorage.setItem('metinciris_recent_pages', JSON.stringify(items));
    const stored = JSON.parse(localStorage.getItem('metinciris_recent_pages') || '[]');
    expect(stored.length).toBe(2);
    expect(stored[0].id).toBe('gist-raporlama');
  });
});
