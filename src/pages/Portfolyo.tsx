import React from 'react';
import { PageContainer } from '../components/PageContainer';
import {
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  TrendingUp,
  FileText,
  Calendar,
  Users,
  BarChart3,
  ChevronDown,
  ExternalLink,
  LayoutGrid,
  Microscope,
  BarChart as BarChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { RelatedPages } from '../components/RelatedPages';

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <>{count.toLocaleString('tr-TR')}</>;
}

export function Portfolyo() {
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);
  const [stats, setStats] = React.useState({
    hIndex: 24,
    citations: 2000,
    sciCount: 58,
    nationalCount: 45,
    congressCount: 143,
    citationHistory: [] as { year: number, count: number }[]
  });

  React.useEffect(() => {
    fetch('/data/publications.json')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setStats({
            hIndex: data.stats.hIndex,
            citations: data.stats.citations,
            sciCount: data.stats.sciCount || 58,
            nationalCount: data.stats.nationalCount || 45,
            congressCount: data.stats.congressCount || 143,
            citationHistory: data.stats.citationHistory || []
          });
        }
      })
      .catch(console.error);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  const experienceYears = new Date().getFullYear() - 1997;

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-violet-700 to-purple-800 text-white p-10 md:p-14 mb-10">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">Prof. Dr. İbrahim Metin ÇİRİŞ</h1>
          <p className="text-lg md:text-xl text-white/90 mb-2">
            Süleyman Demirel Üniversitesi Tıp Fakültesi Patoloji Anabilim Dalı
          </p>
          <p className="text-white/80">
            Profesör | Tıbbi Patoloji Uzmanı
          </p>
        </div>
      </div>

      {/* Akademik Metrikler - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* H-Index Card */}
        <div className="group relative overflow-hidden rounded-3xl bg-white p-1 border border-gray-100 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative p-8 flex flex-col items-center text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg relative z-10 transform group-hover:rotate-6 transition-transform">
                <TrendingUp size={40} />
              </div>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Akademik Etki</h3>
            <div className="text-5xl font-black text-gray-900 mb-3">
              <AnimatedNumber value={stats.hIndex} />
            </div>
            <div className="text-lg font-bold text-blue-600 mb-4 tracking-tight">H-Index</div>
            <a
              href="https://scholar.google.com.tr/citations?user=QZkewskAAAAJ&hl=tr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-4 py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              Güncel Veriler <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Citations Card */}
        <div className="group relative overflow-hidden rounded-3xl bg-white p-1 border border-gray-100 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative p-8 flex flex-col items-center text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg relative z-10 transform group-hover:-rotate-6 transition-transform">
                <FileText size={40} />
              </div>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Bilimsel Atıf</h3>
            <div className="text-5xl font-black text-gray-900 mb-3">
              <AnimatedNumber value={stats.citations} />
            </div>
            <div className="text-lg font-bold text-emerald-600 mb-4 tracking-tight">Toplam Atıf</div>
            <a
              href="https://scholar.google.com.tr/citations?user=QZkewskAAAAJ&hl=tr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              Google Scholar <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Experience Card */}
        <div className="group relative overflow-hidden rounded-3xl bg-white p-1 border border-gray-100 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-fuchsia-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative p-8 flex flex-col items-center text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg relative z-10 transform group-hover:rotate-6 transition-transform">
                <BarChart3 size={40} />
              </div>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Akademik Birikim</h3>
            <div className="text-5xl font-black text-gray-900 mb-3">
              <AnimatedNumber value={experienceYears} />
            </div>
            <div className="text-lg font-bold text-purple-600 mb-4 tracking-tight">Yıl Deneyim</div>
            <div className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              <span className="bg-purple-50 px-3 py-1 rounded-full text-purple-700">
                <AnimatedNumber value={stats.sciCount + stats.nationalCount + stats.congressCount} /> Yayın
              </span>
              <span className="bg-fuchsia-50 px-3 py-1 rounded-full text-fuchsia-700">3.000.000+ Preparat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Atıf Grafiği - Modernized Section */}
      {stats.citationHistory.length > 0 && (
        <div className="relative mb-12 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-3 rounded-2xl text-white shadow-lg">
                  <BarChartIcon size={24} />
                </div>
                <div>
                  <h2 className="m-0 text-2xl md:text-3xl font-black text-gray-900">Yıllara Göre Atıf Analizi</h2>
                  <p className="text-gray-500 text-sm mt-1">Akademik çalışmaların zaman içindeki etkisi</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 border border-gray-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Dinamik Veri Akışı
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.citationHistory} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="activeBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/90 backdrop-blur-md p-4 shadow-2xl border border-blue-50 rounded-2xl">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{payload[0].payload.year} Raporu</p>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-blue-600">{payload[0].value}</span>
                              <span className="text-sm font-bold text-gray-800">Bilimsel Atıf</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[8, 8, 8, 8]}
                    barSize={Math.max(12, 500 / stats.citationHistory.length)}
                  >
                    {stats.citationHistory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === stats.citationHistory.length - 1 ? "url(#activeBarGradient)" : "url(#barGradient)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 flex items-center justify-between text-[10px] md:text-xs">
              <span className="text-gray-400 font-medium">Kaynak: Google Akademik Profil @ {new Date().toLocaleDateString('tr-TR')}</span>
              <span className="text-blue-500 font-bold hover:underline cursor-pointer">Veri Detaylarını İncele →</span>
            </div>
          </div>
        </div>
      )}

      {/* Uzmanlık Alanları */}
      <div className="mb-8">
        <h2 className="mb-6">Uzmanlık Alanları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
            <h3 className="mb-3 text-[#00A6D6]">Endokrin Patoloji</h3>
            <p className="text-muted-foreground">
              Tiroid İnce İğne Aspirasyon Biyopsisi, Tiroid ameliyat materyalleri,
              Paratiroid, Adrenal gland, Hipofiz.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
            <h3 className="mb-3 text-[#27AE60]">Karaciğer ve Pankreatikobiliyer Patoloji</h3>
            <p className="text-muted-foreground">
              Hepatitler, siroz. Karaciğer, safra yolları, pankreas hastalıkları ve
              tümör patolojileri, karaciğer transplant patolojisi.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
            <h3 className="mb-3 text-[#E74C3C]">Kemik ve Yumuşak Doku Patolojileri</h3>
            <p className="text-muted-foreground">
              Kemik, yumuşak doku yerleşimli tümör patolojileri.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
            <h3 className="mb-3 text-[#F39C12]">Diğer Uzmanlık Alanları</h3>
            <p className="text-muted-foreground">
              Baş boyun patolojisi, merkezi sinir sistemi patolojisi, tümör dışı böbrek
              patolojileri, böbrek transplant patolojisi, dermatopatoloji, erkek genital
              sistem ve ürogenital sistem.
            </p>
          </div>
        </div>
      </div>

      {/* 10 Yıllık Patoloji İstatistikleri */}
      <div className="mb-8">
        <h2 className="mb-4">10 Yıllık Patoloji İstatistikleri (Giderek Artmakta)</h2>
        <p className="text-muted-foreground mb-6">
          Baş Boyun Patolojisi, Endokrin patoloji ve sitoloji, Deri patolojisi, Kemik ve yumuşak doku patolojisi,
          Santral sinir sistemi, Gastrointestinal sistem, Akciğer ve mediastinal sistem, Böbrek ve erkek genital sistem,
          Kadın genital sistem ve meme, Konsültasyon, frozen ve moleküler inceleme.
        </p>

        {/* Baş Boyun Patolojisi */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('basboyun')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <Microscope size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Baş Boyun Patolojisi (22.488)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('basboyun') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('basboyun') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Oral kavite, dudak, dil, gingiva, orofarenks, tonsil/adenoid: 11.658</div>
                <div>• Larinks: 2.466</div>
                <div>• Burun, nazofarinks, paranazal sinüs ve polipler: 2.425</div>
                <div>• Tükürük bezi ve baş-boyun kistleri: 3.745</div>
                <div>• Mandibula, diş ve odontojenik lezyonlar: 1.055</div>
                <div>• Kulak / kolesteatom: 824</div>
                <div>• Göz ve konjonktiva: 315</div>
              </div>
            </div>
          )}
        </div>

        {/* Endokrin Patoloji */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('endokrin')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#27AE60] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <FileText size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Endokrin Patoloji ve Sitoloji (68.318)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('endokrin') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('endokrin') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Tiroid, paratiroid, adrenal ve hipofiz: 3.642</div>
                <div>• İnce iğne aspirasyonu ve sıvı bazlı sitoloji: 53.978</div>
                <div>• Hücre bloğu, vücut sıvıları ve apse sitolojisi: 10.698</div>
              </div>
            </div>
          )}
        </div>

        {/* Deri Patolojisi */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('deri')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#E67E22] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <LayoutGrid size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Deri Patolojisi (6.482)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('deri') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('deri') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Deri eksizyonel biyopsi: 4.267</div>
                <div>• Deri punch / insizyonel / shave biyopsi: 2.111</div>
                <div>• Pilonidal kist / sinüs: 104</div>
              </div>
            </div>
          )}
        </div>

        {/* Kemik ve Yumuşak Doku */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('kemik')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#E74C3C] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Kemik ve Yumuşak Doku Patolojisi (11.377)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('kemik') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('kemik') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Yumuşak doku lezyonları, lipom ve geniş rezeksiyonlar: 8.291</div>
                <div>• Kemik, kıkırdak ve kemik iliği biyopsileri / rezeksiyonları: 1.951</div>
                <div>• Eklem, sinovya, bursa, ganglion ve tendon lezyonları: 450</div>
                <div>• Kas, sinir ve intervertebral disk lezyonları: 255</div>
                <div>• Amputasyon ve disartikülasyon materyalleri: 318</div>
                <div>• Damar, trombüs/embolus ve kalp kapağı: 112</div>
              </div>
            </div>
          )}
        </div>

        {/* Santral Sinir Sistemi */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('cns')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#F39C12] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <BookOpen size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Santral Sinir Sistemi (1.654)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('cns') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('cns') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Beyin ve meninks tümör rezeksiyonları: 1.516</div>
                <div>• Beyin biyopsileri: 80</div>
                <div>• Beyin/meninks tümör dışı materyaller: 58</div>
              </div>
            </div>
          )}
        </div>

        {/* Gastrointestinal Sistem */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('gis')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#8E44AD] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <FileText size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Gastrointestinal Sistem (35.674)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('gis') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('gis') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Mide biyopsi, polip ve rezeksiyonları: 10.693</div>
                <div>• Duodenum ve ince barsak biyopsi / rezeksiyonları: 4.977</div>
                <div>• Kolon-rektum biyopsi ve rezeksiyonları: 4.036</div>
                <div>• Kolorektal polip ve anorektal lezyonlar: 4.336</div>
                <div>• Safra kesesi: 4.549</div>
                <div>• Karaciğer: 3.049</div>
                <div>• Özofagus: 1.191</div>
                <div>• Apendiks: 620</div>
                <div>• Pankreas: 535</div>
                <div>• Periton, omentum ve dalak: 769</div>
                <div>• Herni kesesi: 919</div>
              </div>
            </div>
          )}
        </div>

        {/* Akciğer ve Mediastinal Sistem */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('lung')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <Microscope size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Akciğer ve Mediastinal Sistem (737)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('lung') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('lung') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Bronkus biyopsileri: 396</div>
                <div>• Akciğer biyopsi ve rezeksiyonları: 188</div>
                <div>• Plevra / perikart biyopsileri: 109</div>
                <div>• Mediasten, timus ve trakea: 44</div>
              </div>
            </div>
          )}
        </div>

        {/* Böbrek ve Erkek Genital Sistem */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('kidney')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#27AE60] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Böbrek ve Erkek Genital Sistem (5.481)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('kidney') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('kidney') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Prostat biyopsi, TUR ve rezeksiyonları: 4.017</div>
                <div>• Böbrek biyopsi ve nefrektomi materyalleri: 742</div>
                <div>• Mesane biyopsi, TUR ve rezeksiyonları: 555</div>
                <div>• Üreter ve üretra materyalleri: 111</div>
                <div>• Testis ve hidrosel materyalleri: 56</div>
              </div>
            </div>
          )}
        </div>

        {/* Kadın Genital Sistem ve Meme */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('gynecology')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#E74C3C] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <Users size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Kadın Genital Sistem ve Meme (13.510)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('gynecology') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('gynecology') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Servikal / vajinal sitoloji: 6.423</div>
                <div>• Uterus, endometrium, endoserviks ve serviks materyalleri: 4.516</div>
                <div>• Meme biyopsi ve rezeksiyonları: 923</div>
                <div>• Over, tuba ve adneksiyal lezyonlar: 707</div>
                <div>• Plasenta, abortus ve fetal otopsi: 616</div>
                <div>• Vajina, vulva ve labia materyalleri: 325</div>
              </div>
            </div>
          )}
        </div>

        {/* Konsültasyon, Frozen ve Moleküler İnceleme */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('molecular')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#F39C12] w-12 h-12 flex items-center justify-center text-white rounded-xl">
                <Award size={24} />
              </div>
              <h3 className="text-left font-bold text-gray-800">Konsültasyon, Frozen ve Moleküler İnceleme (202.940)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('molecular') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('molecular') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mt-4">
                <div>• Histokimyasal, immünohistokimyasal ve immünfloresan incelemeler: 188.924</div>
                <div>• Hazır preparat, blok, imprint ve filtre preparat işlemleri: 6.604</div>
                <div>• Lenf nodu biyopsi, diseksiyon ve sentinel lenf nodu incelemeleri: 3.743</div>
                <div>• Konsültasyon ve frozen inceleme: 2.659</div>
                <div>• Moleküler testler, dizi analizleri, PCR, NGS, MSI, HPV ve füzyon analizleri: 726</div>
                <div>• İn situ hibridizasyon ve FISH: 134</div>
                <div>• Otopsi: 150</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kariyer */}
      <div className="mb-8">
        <h2 className="mb-6">Kariyerim</h2>
        <div className="bg-white p-8">
          <p className="text-muted-foreground mb-8">Konya 1969 doğumluyum</p>
          <div className="space-y-6">
            {[
              { year: '1976-1986', title: 'İlköğretim - Lise', detail: 'Konya Merkez Gazi İlkokulu, Konya Merkez Karma Ortaokulu, Konya Merkez Fatih Teknik Lisesi Elektronik Bölümü' },
              { year: '1986-1992', title: 'Üniversite', detail: 'Ankara Üniversitesi Tıp Fakültesi' },
              { year: '1992-1995', title: 'Mecburi Hizmet - Pratisyenlik', detail: 'Tunceli Mazgirt Darıkent Sağlık Ocağı, Tunceli Mazgirt Sağlık Ocağı, Konya Beyşehir Derebucak Sağlık Ocağı' },
              { year: '1995-1996', title: 'Askerlik', detail: 'Mardin Savur Jandarma/Komando Taburu' },
              { year: '1997-2001', title: 'Uzmanlık Eğitimi', detail: 'Ege Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '2001-2003', title: 'Uzman Doktor', detail: 'Ege Ü. Tıp Fak. ve S.D.Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '2003-2013', title: 'Yardımcı Doçent Doktor', detail: 'S.D.Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '2013-2019', title: 'Doçent Doktor', detail: 'S.D.Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '11.12.2019 -', title: 'Profesör Doktor', detail: 'S.D.Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '2020-2023', title: 'Anabilim Dalı Başkanlığı', detail: 'Tıbbi Patoloji Anabilim Dalı (17.03.2020 - 16.03.2023)' },
            ].map((item, index) => (
              <div key={index} className="flex gap-6 pb-6 border-b last:border-b-0">
                <div className="flex-shrink-0">
                  <div className="bg-[#8E44AD] text-white px-4 py-2 text-center min-w-[120px]">
                    {item.year}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2">{item.title}</h4>
                  <p className="text-muted-foreground m-0">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ödüller */}
      <div className="mb-8">
        <h2 className="mb-6">Ödüller</h2>
        <div className="bg-white p-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Award className="text-[#F39C12] flex-shrink-0 mt-1" size={24} />
              <p className="text-muted-foreground m-0">
                <strong>1997:</strong> XIII. Ulusal Patoloji Kongresinde "Meme karsinomlarında C-erbB-2 ve p53'ün yeri"
                çalışması, poster bildirisi birincilik ödülü
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Award className="text-[#F39C12] flex-shrink-0 mt-1" size={24} />
              <p className="text-muted-foreground m-0">
                <strong>2006:</strong> XIII. Ulusal Gastroentoroloji kongresinde "Sıçanlarda aspirin ile uyarılan
                mide mukoza lezyonlarının önlenmesinde probiyotiklerin rolü", Gastritler kategorisinde birincilik ödülü
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Award className="text-[#F39C12] flex-shrink-0 mt-1" size={24} />
              <p className="text-muted-foreground m-0">
                <strong>2015:</strong> 25. Ulusal Patoloji Kongresinde İmmunhistokimyasal çalışma ile poster bildirisi üçüncülük ödülü
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Award className="text-[#F39C12] flex-shrink-0 mt-1" size={24} />
              <p className="text-muted-foreground m-0">
                <strong>2018:</strong> 28. Ulusal Patoloji Kongresinde "Meme Karsinomlarında Doku Mikroarray"
                ile poster bildiri ikincilik ödülü
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Görevlendirmeler */}
      <div className="mb-8">
        <h2 className="mb-6">Görevlendirmeler</h2>
        <div className="bg-white p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
            <div>• SDÜ Deney Hayvanları Yerel Etik Kurulu üyeliği (2011-2018)</div>
            <div>• Dönem 3 koordinatörlük yardımcılığı ve başkanlığı (2011-2017)</div>
            <div>• Tıbbi Patoloji Laboratuvarı kalite denetimi (2011-)</div>
            <div>• Araştırma Hastanesi ihale komisyon üyeliği (2011-)</div>
            <div>• Sosyal ve Kültürel Etkinlikler Yürütme Kurulu üyeliği (2013-)</div>
            <div>• DEHATAM yönetim kurulu üyeliği (2019-2022)</div>
            <div>• Koordinatörler grubu Öz değerlendirme kurulu</div>
            <div>• MÖTEK üyeliği</div>
            <div>• Eğitim Programını Değerlendirme Kurulu üyeliği</div>
            <div>• Ölçme Değerlendirme Kurulu üyeliği</div>
          </div>
        </div>
      </div>

      {/* Yayınlar Özeti */}
      <div className="mb-8">
        <h2 className="mb-6">Yayınlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 text-center">
            <div className="bg-[#00A6D6] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <FileText size={32} />
            </div>
            <h3 className="mb-2">58+</h3>
            <p className="text-muted-foreground">Uluslararası Hakemli Dergi</p>
          </div>

          <div className="bg-white p-6 text-center">
            <div className="bg-[#27AE60] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="mb-2">28+</h3>
            <p className="text-muted-foreground">Uluslararası Konferans</p>
          </div>

          <div className="bg-white p-6 text-center">
            <div className="bg-[#E74C3C] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <FileText size={32} />
            </div>
            <h3 className="mb-2">45+</h3>
            <p className="text-muted-foreground">Ulusal Hakemli Dergi</p>
          </div>

          <div className="bg-white p-6 text-center">
            <div className="bg-[#F39C12] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="mb-2">115+</h3>
            <p className="text-muted-foreground">Ulusal Konferans</p>
          </div>
        </div>

        <div className="bg-[#E3F2FD] border-l-4 border-[#00A6D6] p-6 mt-6">
          <p className="text-muted-foreground m-0">
            <strong>Not:</strong> Güncel ve detaylı yayın listesi için üniversite web sayfamı ziyaret edebilirsiniz.
            Tüm yayınlar Google Scholar profilimde mevcuttur.
          </p>
        </div>
      </div>

      {/* Katılım ve Kurslar */}
      <div className="mb-8">
        <div className="bg-white p-6">
          <button
            onClick={() => toggleSection('kurslar')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#16A085] w-12 h-12 flex items-center justify-center text-white">
                <GraduationCap size={24} />
              </div>
              <h2>Katılım ve Kurslar (60+)</h2>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('kurslar') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('kurslar') && (
            <div className="mt-6 pt-6 border-t max-h-96 overflow-y-auto">
              <div className="space-y-3 text-muted-foreground">
                <p>• 34. Ulusal Patoloji Kongresi (2025, Belek)</p>
                <p>• Sağlık Profesyonelleri Eğiticileri İçin Ölçme Değerlendirme Kursu (2025)</p>
                <p>• Pankreas ve Periampuller Bölge Tümörleri Kursu (2021)</p>
                <p>• Makroskopi Teknikleri Kursu - 1 (2021)</p>
                <p>• USCAP Mesenchymal Tumors of the Gynecologic Tract, CME/SAM Certificate (2020)</p>
                <p>• USCAP Vascular Tumors, CME/SAM Certificate (2020)</p>
                <p>• USCAP Giant Cell-Rich Tumors of Bone, CME/SAM Certificate (2020)</p>
                <p>• USCAP Myxoid Tumors of Soft Tissue, CME/SAM Certificate (2020)</p>
                <p>• USCAP Cartilaginous Tumors, CME/SAM Certificate (2020)</p>
                <p>• USCAP Adipocytic Tumors, CME/SAM Certificate (2020)</p>
                <p>• USCAP Round Cell Sarcomas, CME/SAM Certificate (2020)</p>
                <p>• USCAP Nodal and Extranodal Reactive and Borderline Lymphoid Proliferations, CME/SAM Certificate (2020)</p>
                <p>• 29. Ulusal Patoloji Kongresi (2019, Trabzon)</p>
                <p>• Baş boyun patolojisi kursu (2019, İzmir)</p>
                <p>• Meme kanseri patolojisi kursu (2018, İzmir)</p>
                <p>• Nefropatoloji kursu (2014, İzmir)</p>
                <p>• Endokrin kursu (2013, İstanbul)</p>
                <p>• Dermatopatoloji kursu (2012, İstanbul)</p>
                <p>• 36th European Congress of Cytology (2011, İstanbul)</p>
                <p>• Karaciğer patolojisi kursu (2008, İzmir)</p>
                <p>• Nefropatoloji kursu (2005, Adana)</p>
                <p>• Tiroid sitopatolojisi kursu (2005, Hacettepe)</p>
                <p>• Cerrahi meme patolojisi günleri (2005, İstanbul)</p>
                <p>• GEP endokrin tümörler kursu (2004, İstanbul)</p>
                <p>• Kemik ve yumuşak doku tümörleri sempozyumu (2002, Pamukkale Ü)</p>
                <p>• XIV. Ulusal Patoloji Kongresi (1999, Kuşadası)</p>
                <p>• Deri eki tümörleri kursu (1998, İzmir)</p>
                <p>• XIII. Ulusal Patoloji Kongresi (1997, İstanbul)</p>
                <p className="mt-4 italic">...ve 20+ ek kurs ve kongre katılımı</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <RelatedPages
        pages={[
          {
            title: "Yayınlar",
            subtitle: "Bilimsel yayınlar ve makaleler",
            page: "yayinlar",
            color: "bg-rose-600",
            icon: FileText
          },
          {
            title: "Konsensus",
            subtitle: "Patoloji konsensus toplantı takibi",
            page: "konsensus",
            color: "bg-blue-600",
            icon: Users
          },
          {
            title: "Makale Özetleri",
            subtitle: "Günlük PubMed makale özetleri",
            page: "makale",
            color: "bg-indigo-600",
            icon: FileText
          }
        ]}
      />
    </PageContainer>
  );
}
