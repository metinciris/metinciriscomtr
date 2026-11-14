import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Search, Star } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { PITFALLS, ORGAN_SYSTEMS, type OrganSystem } from '../data/tani-tuzaklari';
import { pitfallUrl } from '../utils/pitfallBlogLinks.js';
import { TaniTuzagiDetay } from './TaniTuzagiDetay';

const ORGAN_COLORS: Record<OrganSystem, string> = {
  Genel: '#475569', Akciğer: '#0284c7', GİS: '#d97706', Meme: '#db2777',
  Gyn: '#e11d48', Üriner: '#ca8a04', Endokrin: '#9333ea',
  'Baş-Boyun': '#ea580c', Deri: '#78716c', 'Lenfoid/Hemato': '#b91c1c',
  'Yumuşak Doku': '#059669', Kemik: '#525252', CNS: '#4f46e5',
};
const FAVORITES_KEY = 'tuzaklar:favs';

function useFavorites(): [Set<string>, (id: string) => void] {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });
  const toggle = (id: string) => setIds((prev) => {
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* limited storage */ }
    return next;
  });
  return [new Set(ids), toggle];
}

export function TaniTuzaklari() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const segments = path.split('/');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [organ, setOrgan] = useState<OrganSystem | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, toggleFavorite] = useFavorites();

  // Onceki /tani-tuzaklari?pitfall=id yer imlerini koru.
  useEffect(() => {
    if (segments.length !== 1) return;
    const oldId = new URLSearchParams(window.location.search).get('pitfall');
    if (oldId && PITFALLS.some((p) => p.id === oldId)) {
      window.location.replace(pitfallUrl(oldId));
    }
  }, [segments.length]);

  const filtered = useMemo(() => PITFALLS.filter((p) => {
    if (organ && p.organSystem !== organ) return false;
    if (onlyFavorites && !favorites.has(p.id)) return false;
    const q = deferredSearch.trim().toLocaleLowerCase('tr-TR');
    return !q || [p.titleTR, p.titleEN || '', p.teaser, p.tags.join(' ')]
      .join(' ').toLocaleLowerCase('tr-TR').includes(q);
  }).sort((a, b) => a.titleTR.localeCompare(b.titleTR, 'tr')), [organ, onlyFavorites, favorites, deferredSearch]);

  if (segments.length > 1) {
    const id = decodeURIComponent(segments.slice(1).join('/'));
    return <TaniTuzagiDetay id={id} />;
  }

  return (
    <PageContainer>
      <header className="mb-8 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-7 md:p-10 text-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-4">
          <BookOpen size={15} aria-hidden="true" /> Tanısal yaklaşım kütüphanesi
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Patoloji Tanı Tuzakları</h1>
        <p className="text-white/85 max-w-3xl text-base md:text-lg leading-relaxed mb-4">
          Tanısal yanılgılar, ayırıcı ipuçları, minimal çalışma, raporlama ve kontrol listeleri.
          Her konu artık kendi paylaşılabilir sayfasında açılır; ilgili blog yazılarıyla birlikte okunabilir.
        </p>
        <p className="text-white/75 text-sm mb-0">{PITFALLS.length} konu · {ORGAN_SYSTEMS.length} organ / alan başlığı</p>
      </header>
      <div className="rounded-2xl bg-white border border-slate-200 p-5 md:p-6 mb-6 shadow-sm space-y-4">
        <label htmlFor="pitfall-search" className="flex items-center gap-2 font-semibold text-slate-700">
          <Search size={19} aria-hidden="true" /> Tanı tuzaklarında ara
        </label>
        <input id="pitfall-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Örn. NIFTP, mezotelyoma, p16, kapsül invazyonu"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setOrgan(null)}
            className={'rounded-full border px-3 py-2 text-sm font-semibold ' + (!organ ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-slate-700 border-slate-200')}>
            Tümü
          </button>
          {ORGAN_SYSTEMS.map((item) => (
            <button key={item} type="button" aria-pressed={organ === item} onClick={() => setOrgan(organ === item ? null : item)}
              className={'rounded-full border px-3 py-2 text-sm font-medium ' + (organ === item ? 'text-white border-transparent' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50')}
              style={organ === item ? { backgroundColor: ORGAN_COLORS[item] } : undefined}>{item}</button>
          ))}
          <button type="button" aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={'rounded-full border px-3 py-2 text-sm font-semibold ' + (onlyFavorites ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-amber-200 text-amber-800')}>
            ★ Favoriler
          </button>
        </div>
        <p className="text-slate-500 text-sm mb-0">{filtered.length} konu gösteriliyor</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <article key={p.id} className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
            <div className="h-1.5" style={{backgroundColor: ORGAN_COLORS[p.organSystem]}} />
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{p.organSystem} · {p.category}</span>
                <button type="button" aria-label={favorites.has(p.id) ? 'Favoriden çıkar' : 'Favoriye ekle'}
                  title={favorites.has(p.id) ? 'Favoriden çıkar' : 'Favoriye ekle'}
                  onClick={() => toggleFavorite(p.id)}
                  className="rounded-full border border-slate-200 p-2 hover:bg-amber-50"
                  aria-pressed={favorites.has(p.id)}>
                  <Star size={18} className={favorites.has(p.id) ? 'fill-amber-400 text-amber-500' : 'text-slate-500'} aria-hidden="true" />
                </button>
              </div>
              <h2 className="text-xl font-bold leading-snug text-slate-900 mb-2">{p.titleTR}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{p.teaser}</p>
              <a href={pitfallUrl(p.id)} className="mt-auto inline-flex items-center gap-2 font-semibold text-indigo-700 hover:text-indigo-900">
                Ayrıntıyı ve ilgili yazıları oku <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <p className="rounded-xl border border-slate-200 p-8 text-center text-slate-600">Aradığınız kriterlere uygun konu bulunamadı.</p>}
      <p className="mt-10 text-sm text-slate-500">Eğitim amaçlı bilimsel notlar. Tanı, evreleme ve tedavi kararı için güncel kılavuzlar ve olguya özgü değerlendirme gereklidir.</p>
    </PageContainer>
  );
}
