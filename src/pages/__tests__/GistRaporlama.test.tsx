import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GistRaporlama from '../GistRaporlama';

describe('GİST Raporlama ilk açılış', () => {
  it('otomatik klinik bulgu üretmez ve boş rapor kopyalanamaz', () => {
    const page = renderToStaticMarkup(<GistRaporlama />);
    const preview = page.match(/<pre[^>]*>([\s\S]*?)<\/pre>/)?.[1];
    const copyButton = page.match(/<button[^>]*>(?:(?!<\/button>)[\s\S])*?>Kopyala<\/button>/)?.[0];
    expect(preview).toBe('Rapor önizlemesi için olgu bulgularını girin.');
    expect(copyButton).toMatch(/\sdisabled=""/);
    expect(page).not.toContain('aria-pressed="true"');
    expect(page).toMatch(/<select id="gist-nekroz"[^>]*><option value="" selected="">Belirtilmedi<\/option>/);
    expect(page).toMatch(/<select id="gist-neoadjuvan"[^>]*><option value="" selected="">Belirtilmedi<\/option>/);
    expect(page).not.toContain('Serozal yüzeye 0,3 cm');
    expect(page).not.toContain('reaktif hiperplazi');
  });
});
