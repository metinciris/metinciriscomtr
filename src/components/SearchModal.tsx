import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, Loader2, Search, Sparkles, X } from 'lucide-react';
import { getSearchNavigation } from '../utils/searchNavigation';
import {
  getEquivalentTerms,
  getRelatedSearches,
  isSmartSearchEntry,
  prepareSearchIndex,
  rankSmartSearch,
  type SmartSearchEntry,
} from '../utils/smartPathologySearch';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

type SearchTab = 'all' | 'Blog' | 'Tanı Tuzağı' | 'other';

function matchesTab(type: string, tab: SearchTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'other') return type !== 'Blog' && type !== 'Tanı Tuzağı';
  return type === tab;
}

const TABS: Array<{ id: SearchTab; label: string }> = [
  { id: 'all', label: 'Tümü' },
  { id: 'Blog', label: 'Blog' },
  { id: 'Tanı Tuzağı', label: 'Tanı tuzakları' },
  { id: 'other', label: 'Diğer kaynaklar' },
];

function typeColor(type: string): string {
  if (type === 'Blog') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (type === 'Tanı Tuzağı') return 'bg-indigo-50 text-indigo-800 border-indigo-200';
  if (type === 'Araç') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (type === 'Sözlük') return 'bg-sky-50 text-sky-800 border-sky-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [allData, setAllData] = useState<SmartSearchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []).filter((item) => item.getClientRects().length > 0);
        if (!items.length) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = oldOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || allData.length > 0) return;
    let active = true;
    setLoadError(false);
    setIsLoading(true);

    fetch('/search-index.json', { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('Arama dizini indirilemedi');
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (!active) return;
        if (!Array.isArray(payload)) throw new Error('Arama dizini geçersiz');
        const validEntries = payload.filter(isSmartSearchEntry);
        if (!validEntries.length) throw new Error('Arama dizini boş');
        setAllData(validEntries);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('Arama dizini yüklenemedi:', error);
        setLoadError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [isOpen, allData.length, retryKey]);

  const preparedIndex = useMemo(() => prepareSearchIndex(allData), [allData]);
  const results = useMemo(
    () => rankSmartSearch(preparedIndex, deferredQuery),
    [preparedIndex, deferredQuery],
  );
  const visibleResults = useMemo(
    () => results.filter((result) => matchesTab(result.item.type, activeTab)).slice(0, 30),
    [results, activeTab],
  );
  const exactCount = results.filter((result) => matchesTab(result.item.type, activeTab)).length;
  const equivalentTerms = useMemo(() => getEquivalentTerms(query.trim()), [query]);
  const relatedTerms = useMemo(() => getRelatedSearches(query.trim()), [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#111827]/85 backdrop-blur-sm flex justify-center items-start pt-[6vh] md:pt-[10vh] px-3 md:px-4">
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] md:max-h-[80vh]"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Akıllı patoloji ve site araması"
      >
        <div className="flex items-center border-b border-slate-200 px-4 py-3 md:px-5 md:py-4 gap-3">
          <Search className="text-indigo-600 shrink-0" size={23} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            maxLength={140}
            className="flex-1 min-w-0 text-base md:text-lg outline-none text-slate-900 bg-transparent placeholder:text-slate-400"
            placeholder="SOX10, MPNST, DCIS, HER2, tanı veya organ ara..."
            aria-label="Patoloji ve site içinde ara"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveTab('all');
            }}
          />
          {isLoading && <Loader2 className="animate-spin text-indigo-600 shrink-0" size={19} aria-label="Yükleniyor" />}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full shrink-0"
            aria-label="Aramayı kapat"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="px-4 md:px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2 text-indigo-800 font-semibold text-sm">
              <Sparkles size={15} aria-hidden="true" />
              Akıllı patoloji araması
            </div>
            <p className="text-xs md:text-sm text-slate-600 mt-1 mb-2">
              Blogların içeriğini, tanı tuzaklarını, belirteçleri, sözlüğü ve site araçlarını birlikte tarar.
            </p>
            {query.trim() && equivalentTerms.length > 0 && (
              <p className="text-xs text-slate-600 mb-2">
                <span className="font-semibold">Eş terimler: </span>
                {equivalentTerms.join(' · ')}
              </p>
            )}
            {query.trim() && relatedTerms.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 pb-1" aria-label="İlgili arama önerileri">
                <span className="text-xs text-slate-500">İlgili aramalar:</span>
                {relatedTerms.map((term) => (
                  <button
                    type="button"
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setActiveTab('all');
                    }}
                    className="rounded-full border border-indigo-200 bg-white text-indigo-800 text-xs px-2.5 py-1 hover:bg-indigo-50"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {query.trim() && results.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 px-3 md:px-5 py-3" aria-label="Sonuç türü filtresi">
              {TABS.map((tab) => {
                const count = tab.id === 'all'
                  ? results.length
                  : results.filter((result) => matchesTab(result.item.type, tab.id)).length;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={'shrink-0 rounded-lg px-3 py-1.5 text-xs md:text-sm font-medium border transition ' + (
                      activeTab === tab.id
                        ? 'bg-indigo-700 text-white border-indigo-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {tab.label} <span className="opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {loadError && (
            <div className="text-center px-5 py-10" role="alert">
              <p className="text-slate-700 mb-3">Arama dizini yüklenemedi. İnternet bağlantısını kontrol edebilirsiniz.</p>
              <button
                type="button"
                onClick={() => setRetryKey((value) => value + 1)}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800"
              >
                Yeniden dene
              </button>
            </div>
          )}

          {!query.trim() && !loadError && (
            <div className="px-5 py-10 text-center text-slate-500">
              <BookOpen className="mx-auto mb-3 text-indigo-400" size={30} aria-hidden="true" />
              <p className="font-medium text-slate-700 mb-1">Patoloji bilgisine tek arama ile ulaşın</p>
              <p className="text-sm">Örnek: SOX10, şeffaf hücreli RCC, NIFTP veya CK5/6</p>
            </div>
          )}

          {query.trim() && !isLoading && !loadError && results.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-600" role="status">
              <p className="font-semibold">“{query}” için sonuç bulunamadı.</p>
              <p className="text-sm mt-2">Belirteç adı, eş terim veya farklı bir tanı adı deneyin.</p>
            </div>
          )}

          {query.trim() && !loadError && results.length > 0 && (
            <>
              <p className="sr-only" role="status" aria-live="polite">{exactCount} sonuç bulundu.</p>
              <ul className="divide-y divide-slate-100 p-2">
                {visibleResults.map(({ item, matchedIn }) => (
                  <li key={item.type + ':' + item.path + ':' + item.title}>
                    <a
                      href={item.path}
                      onClick={(event) => {
                        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                        const navigation = getSearchNavigation(item.path);
                        if (navigation.mode === 'document') return;
                        event.preventDefault();
                        onClose();
                        onNavigate(navigation.page);
                      }}
                      className="block p-3 md:p-4 hover:bg-indigo-50/60 rounded-xl transition group no-underline"
                    >
                      <div className="flex gap-3 items-start justify-between">
                        <div className="min-w-0">
                          <h4 className="text-base font-semibold text-slate-900 group-hover:text-indigo-700 line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                          <span className="block text-xs text-slate-400 mt-1.5">Eşleşme: {matchedIn}</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-2">
                          <span className={'text-[11px] font-semibold px-2 py-1 rounded-full border ' + typeColor(item.type)}>
                            {item.type}
                          </span>
                          <ArrowUpRight size={16} className="text-slate-400 group-hover:text-indigo-700" aria-hidden="true" />
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
              {exactCount > visibleResults.length && (
                <p className="text-center text-xs text-slate-500 px-4 pb-3">
                  İlk {visibleResults.length} sonuç gösteriliyor. Daha belirgin bir terimle daraltabilirsiniz.
                </p>
              )}
            </>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white px-4 md:px-5 py-2.5 text-xs text-slate-500">
          Ücretsiz, site içinde çalışan terim eşleştirmesi. Klinik tanı veya karar desteği değildir.
          <span className="hidden md:inline float-right">ESC: Kapat · Ctrl+K: Ara</span>
        </div>
      </div>
    </div>
  );
}
