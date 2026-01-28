import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  FileText, ExternalLink, Search, BookOpen, Award, ChevronDown,
  TrendingUp, Users, GraduationCap, Calendar, MapPin, Sparkles
} from 'lucide-react';

interface Publication {
  code?: string;
  year: number;
  authors: string;
  title: string;
  journal: string;
  volume?: string;
  pages?: string;
  doi?: string;
  quartile?: string;
  index?: string;
}

interface Book {
  year: number;
  authors: string;
  title: string;
  publisher: string;
  type: string;
  category: string;
}

interface PublicationsData {
  scientificParticipations: string[];
  sciPublications: Publication[];
  nationalPublications: Publication[];
  books: Book[];
  stats: {
    hIndex: number;
    citations: number;
    sciCount: number;
    nationalCount: number;
    congressCount: number;
  };
  lastUpdated: string;
}

const QUARTILE_COLORS: Record<string, string> = {
  Q1: 'from-emerald-500 to-green-600',
  Q2: 'from-blue-500 to-cyan-600',
  Q3: 'from-amber-500 to-orange-600',
  Q4: 'from-rose-500 to-red-600'
};

function StatCard({ icon: Icon, label, value, color, delay }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 text-white shadow-lg transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="absolute -right-4 -top-4 opacity-20">
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <Icon size={28} className="mb-3 opacity-90" />
        <div className="text-4xl font-black mb-1">{value}</div>
        <div className="text-sm font-medium opacity-90">{label}</div>
      </div>
    </div>
  );
}

function PublicationCard({ pub, color }: { pub: Publication; color: string }) {
  return (
    <div className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-1">
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-gradient-to-r from-rose-600 to-red-700 text-white text-sm font-bold rounded-full">
          {pub.year}
        </span>
        {pub.quartile && (
          <span className={`px-3 py-1 bg-gradient-to-r ${QUARTILE_COLORS[pub.quartile] || 'from-gray-500 to-gray-600'} text-white text-sm font-bold rounded-full`}>
            {pub.quartile}
          </span>
        )}
        {pub.code && (
          <span className="px-3 py-1 bg-gray-600 text-white text-sm font-medium rounded-full">
            {pub.code}
          </span>
        )}
        {pub.index && (
          <span className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
            {pub.index}
          </span>
        )}
      </div>

      <h4 className="text-lg font-semibold text-gray-800 mb-3 leading-snug group-hover:text-blue-700 transition-colors">
        {pub.title}
      </h4>

      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{pub.authors}</p>

      <p className="text-sm text-gray-600 mb-3">
        <em className="text-blue-600">{pub.journal}</em>
        {pub.volume && <span className="text-gray-400"> • {pub.volume}</span>}
        {pub.pages && <span className="text-gray-400"> • pp. {pub.pages}</span>}
      </p>

      {pub.doi && (
        <a
          href={`https://doi.org/${pub.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
        >
          <ExternalLink size={14} />
          DOI: {pub.doi}
        </a>
      )}
    </div>
  );
}

function TimelineItem({ text, index }: { text: string; index: number }) {
  // Parse date from text (look for patterns like "4-8 Eylül 1997" or "2 Mayıs 1998")
  const yearMatch = text.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : '';

  return (
    <div className="relative pl-8 pb-6 group">
      {/* Timeline line */}
      <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 to-purple-100 group-last:hidden" />

      {/* Timeline dot */}
      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md">
        <div className="w-2 h-2 rounded-full bg-white" />
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        {year && (
          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded mb-2">
            {year}
          </span>
        )}
        <p className="text-gray-700 text-sm leading-relaxed m-0">{text}</p>
      </div>
    </div>
  );
}

export function Yayinlar() {
  const [data, setData] = useState<PublicationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['sci']);

  useEffect(() => {
    fetch('/data/publications.json')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <div className="text-center py-12 text-gray-500">
          Veriler yüklenirken bir hata oluştu.
        </div>
      </PageContainer>
    );
  }

  const filteredSci = data.sciPublications.filter(pub =>
    pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.journal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNational = data.nationalPublications.filter(pub =>
    pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.journal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-red-700 to-rose-800 text-white p-10 md:p-14 mb-10">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">Prof. Dr. Metin Çiriş</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Akademik Yayınlar
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl">
            Tıbbi Patoloji alanında yayımlanmış bilimsel çalışmalar,
            kongre katılımları ve akademik katkılar
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-10">
        <StatCard icon={TrendingUp} label="H-Index" value={data.stats.hIndex} color="from-blue-500 to-indigo-600" delay={0} />
        <StatCard icon={FileText} label="Atıf Sayısı" value={`${data.stats.citations}+`} color="from-emerald-500 to-teal-600" delay={100} />
        <StatCard icon={BookOpen} label="SCI/SSCI" value={`${data.stats.sciCount}+`} color="from-rose-500 to-pink-600" delay={200} />
        <StatCard icon={GraduationCap} label="Ulusal" value={`${data.stats.nationalCount}+`} color="from-amber-500 to-orange-600" delay={300} />
        <StatCard icon={Award} label="Kongre" value={`${data.stats.congressCount}+`} color="from-purple-500 to-violet-600" delay={400} />
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Yayınlarda ara (başlık, yazar, dergi)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm outline-none"
        />
      </div>

      {/* Scientific Participations - Timeline */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('katilim')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
                <Users size={28} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800">Bilimsel Katılımlar</h2>
                <p className="text-sm text-gray-500">{data.scientificParticipations.length} etkinlik</p>
              </div>
            </div>
            <ChevronDown
              size={24}
              className={`text-gray-400 transition-transform duration-300 ${isExpanded('katilim') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('katilim') && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-6 max-h-[600px] overflow-y-auto pr-2">
                {data.scientificParticipations.map((item, idx) => (
                  <TimelineItem key={idx} text={item} index={idx} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SCI Publications */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('sci')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg">
                <FileText size={28} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800">Uluslararası Hakemli Dergiler</h2>
                <p className="text-sm text-gray-500">{filteredSci.length} makale</p>
              </div>
            </div>
            <ChevronDown
              size={24}
              className={`text-gray-400 transition-transform duration-300 ${isExpanded('sci') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('sci') && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredSci.map((pub, idx) => (
                  <PublicationCard key={idx} pub={pub} color="blue" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* National Publications */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('ulusal')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg">
                <BookOpen size={28} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800">Ulusal Hakemli Dergiler</h2>
                <p className="text-sm text-gray-500">{filteredNational.length} makale</p>
              </div>
            </div>
            <ChevronDown
              size={24}
              className={`text-gray-400 transition-transform duration-300 ${isExpanded('ulusal') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('ulusal') && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredNational.map((pub, idx) => (
                  <PublicationCard key={idx} pub={pub} color="green" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Books */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('kitap')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                <BookOpen size={28} />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800">Kitaplar</h2>
                <p className="text-sm text-gray-500">{data.books.length} kitap/bölüm</p>
              </div>
            </div>
            <ChevronDown
              size={24}
              className={`text-gray-400 transition-transform duration-300 ${isExpanded('kitap') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('kitap') && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-6 space-y-4">
                {data.books.map((book, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-rose-600 to-red-700 text-white text-sm font-bold rounded-full">
                        {book.year}
                      </span>
                      <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                        {book.type}
                      </span>
                      <span className="px-3 py-1 bg-amber-600 text-white text-sm font-medium rounded-full">
                        {book.category}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{book.title}</h4>
                    <p className="text-sm text-gray-500 mb-2">{book.authors}</p>
                    <p className="text-sm text-gray-600"><em>{book.publisher}</em></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Academic Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 shadow-lg">
          <h3 className="text-xl font-bold mb-6">Akademik Profiller</h3>
          <div className="space-y-4">
            {[
              { label: 'ORCID ID: 0000-0002-5619-4989', url: 'https://orcid.org/0000-0002-5619-4989' },
              { label: 'Google Scholar', url: 'https://scholar.google.com.tr/citations?user=zEF_KLsAAAAJ&hl=tr' },
              { label: 'ResearchGate', url: 'https://www.researchgate.net/profile/Metin-Ciris-2' },
              { label: 'Scopus Author ID', url: 'https://www.scopus.com/authid/detail.uri?authorId=6603213356' }
            ].map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/90 hover:text-white hover:translate-x-1 transition-all"
              >
                <ExternalLink size={16} />
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">İletişim</h3>
          <p className="text-gray-600 mb-6">
            Araştırma işbirlikleri ve akademik danışmanlık için:
          </p>
          <div className="space-y-3 text-gray-600">
            <p className="flex items-center gap-2">
              <span className="font-semibold">E-posta:</span>
              <a href="mailto:ibrahimciris@sdu.edu.tr" className="text-blue-600 hover:underline">
                ibrahimciris@sdu.edu.tr
              </a>
            </p>
            <p><span className="font-semibold">Dahili:</span> 9292</p>
            <p><span className="font-semibold">Santral:</span> +90 246 211 9292</p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Güncel Yayınlar</h3>
            <p className="text-gray-600 text-sm">
              Tüm yayınların güncel listesi için{' '}
              <a
                href="https://w3.sdu.edu.tr/personel/02956/ibrahim-metin-ciris"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                SDÜ Akademik Personel Sayfası
              </a>
              {' '}ve{' '}
              <a
                href="https://scholar.google.com.tr/citations?user=zEF_KLsAAAAJ&hl=tr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Google Scholar
              </a>
              {' '}profilini ziyaret edebilirsiniz.
            </p>
            <p className="text-xs text-gray-400 mt-2">Son güncelleme: {data.lastUpdated}</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
