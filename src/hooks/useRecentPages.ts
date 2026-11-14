import { useState, useEffect, useCallback } from 'react';
import { PAGE_REGISTRY } from '../core/data/registry';

const STORAGE_KEY = 'metinciris_recent_pages';
const MAX_ITEMS = 4;

export interface RecentPageItem {
  id: string;
  navLabel: string;
  slug: string;
}

export function useRecentPages(currentPage?: string): {
  recentPages: RecentPageItem[];
  addRecentPage: (pageId: string) => void;
  clearRecentPages: () => void;
} {
  const [recentPages, setRecentPages] = useState<RecentPageItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items: unknown = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(items)) return [];
      // Eski ziyaretlerden kalmış, artık herkese kapalı olan sayfaları gösterme.
      return items.filter((item): item is RecentPageItem =>
        Boolean(item && typeof item === 'object' && 'id' in item &&
          typeof item.id === 'string' && PAGE_REGISTRY[item.id] &&
          !PAGE_REGISTRY[item.id].noindex)
      );
    } catch {
      return [];
    }
  });

  const addRecentPage = useCallback((pageId: string) => {
    if (!pageId || pageId === 'home' || pageId === '404') return;

    const meta = PAGE_REGISTRY[pageId];
    if (!meta) return;

    const item: RecentPageItem = {
      id: pageId,
      navLabel: meta.navLabel || meta.title || pageId,
      slug: meta.slug,
    };

    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p.id !== pageId);
      const updated = [item, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Son sayfalar kaydedilemedi:', e);
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (currentPage) {
      addRecentPage(currentPage);
    }
  }, [currentPage, addRecentPage]);

  const clearRecentPages = useCallback(() => {
    setRecentPages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { recentPages, addRecentPage, clearRecentPages };
}
