/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchResult {
  title: string;
  description: string;
  path: string;
  type: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
      
      if (allData.length === 0) {
        setIsLoading(true);
        fetch('/search-index.json')
          .then(res => res.json())
          .then(data => {
            setAllData(data);
            setIsLoading(false);
          })
          .catch(err => {
            console.error('Arama verisi yüklenemedi:', err);
            setIsLoading(false);
          });
      }
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
      setResults([]);
    }
  }, [isOpen, allData.length]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const normalizeText = (t: string) => {
      return t.toLocaleLowerCase('tr-TR')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    };

    const searchTerms = normalizeText(query).split(' ').filter(Boolean);
    
    const filtered = allData.filter(item => {
      const text = normalizeText(`${item.title} ${item.description || ''} ${item.type}`);
      return searchTerms.every(term => text.includes(term));
    });
    
    setResults(filtered.slice(0, 15)); // Limit to top 15
  }, [query, allData]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    onClose();
    let slug = path.replace(/^\/|\/$/g, '');
    if (!slug) slug = 'home';
    
    if (slug.startsWith('blog/') && slug !== 'blog') {
        window.location.href = path;
    } else {
        onNavigate(slug);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#1e1e1e]/80 backdrop-blur-sm flex justify-center items-start pt-[10vh] animate-fade-in px-4">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Site İçi Arama"
      >
        <div className="flex items-center border-b border-gray-100 p-4">
          <Search className="text-gray-400 mr-3" size={24} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-lg outline-none text-gray-800 bg-transparent placeholder-gray-400"
            placeholder="Blog, araç, ders notu veya patoloji terimi ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && <Loader2 className="animate-spin text-gray-400 mx-2" size={20} />}
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors ml-2"
            aria-label="Aramayı kapat"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {query.trim() && results.length === 0 && !isLoading ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-lg">"{query}" için sonuç bulunamadı.</p>
              <p className="text-sm mt-2">Başka anahtar kelimeler denemeyi düşünün.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {results.map((result, i) => (
                <li key={i}>
                  <a
                    href={result.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate(result.path);
                    }}
                    className="block p-4 hover:bg-blue-50/50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-[#0078D4] transition-colors line-clamp-1">
                          {result.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                      <span className={`ml-4 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        result.type === 'Araç'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : result.type === 'Raporlama'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : result.type === 'Eğitim'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : result.type === 'Blog'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {result.type}
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
