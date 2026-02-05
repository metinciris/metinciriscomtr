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

      {/* Akademik Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-20 h-20 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            <TrendingUp size={40} />
          </div>
          <h3 className="mb-2">H-Index</h3>
          <p className="text-muted-foreground mb-3">{stats.hIndex}</p>
          <a
            href="https://scholar.google.com.tr/citations?user=QZkewskAAAAJ&hl=tr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00A6D6] hover:underline inline-flex items-center gap-1"
          >
            Güncel Veriler <ExternalLink size={16} />
          </a>
        </div>

        <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            <FileText size={40} />
          </div>
          <h3 className="mb-2">Atıf Sayısı</h3>
          <p className="text-muted-foreground mb-3">{stats.citations}+</p>
          <a
            href="https://scholar.google.com.tr/citations?user=QZkewskAAAAJ&hl=tr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#27AE60] hover:underline inline-flex items-center gap-1"
          >
            Google Scholar <ExternalLink size={16} />
          </a>
        </div>

        <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
          <div className="bg-gradient-to-br from-rose-500 to-red-600 w-20 h-20 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            <BarChart3 size={40} />
          </div>
          <h3 className="mb-2">Deneyim</h3>
          <div className="text-muted-foreground">
            {experienceYears}+ yıl üniversite<br />
            {stats.sciCount + stats.nationalCount + stats.congressCount}+ yayın<br />
            {stats.citations}+ Atıf<br />
            3.000.000+ preparat
          </div>
        </div>
      </div>

      {/* Atıf Grafiği */}
      {stats.citationHistory.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <BarChartIcon size={24} />
            </div>
            <h2 className="m-0 text-2xl font-bold text-gray-800">Yıllara Göre Atıf Dağılımı</h2>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.citationHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 shadow-xl border border-gray-100 rounded-xl">
                          <p className="text-sm font-bold text-gray-800 mb-1">{payload[0].payload.year}</p>
                          <p className="text-sm text-blue-600 font-medium">{payload[0].value} Atıf</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  barSize={Math.max(10, 400 / stats.citationHistory.length)}
                >
                  {stats.citationHistory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === stats.citationHistory.length - 1 ? '#2563eb' : '#3b82f6'}
                      fillOpacity={0.8 + (index / stats.citationHistory.length) * 0.2}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4 italic">
            * Google Scholar verileri temel alınmıştır.
          </p>
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
          Baş Boyun Patolojisi, Endokrin patoloji ve sitoloji, Kemik ve yumuşak doku patolojisi,
          Santral sinir sistemi patolojisi, Gastrointestinal sistem patolojisi, Konsültasyon,
          otopsi, frozen ve ileri inceleme, Diğer alanlar.
        </p>

        {/* Baş Boyun Patolojisi */}
        <div className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('basboyun')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white">
                <Users size={24} />
              </div>
              <h3 className="text-left">Baş Boyun Patolojisi (19.186)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('basboyun') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('basboyun') && (
            <div className="p-6 pt-0 border-t">
              <h4 className="mb-3">Biyopsiler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mb-6">
                <div>• Larinks biyopsisi: 2202</div>
                <div>• Dil biyopsisi: 459</div>
                <div>• Burun mukozası biyopsisi: 498</div>
                <div>• Sinüs–paranazal biyopsi: 92</div>
                <div>• Ağız mukozası / gingiva biyopsisi: 1851</div>
                <div>• Nazofarenks / orofarenks biyopsisi: 765</div>
                <div>• Tükürük bezi biyopsisi: 2865</div>
                <div>• Konjonktiva biyopsisi / pterygium: 224</div>
                <div>• Göz biyopsileri: 91</div>
              </div>
              <h4 className="mb-3">Ameliyat Materyali / Rezeksiyon</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                <div>• Larinks parsiyel/total rezeksiyon: 109</div>
                <div>• Mandibulektomi: 48</div>
                <div>• Dudak wedge rezeksiyon: 360</div>
                <div>• Burun–sinüs inflamatuvar polipler: 1725</div>
                <div>• Tonsil ve/veya adenoid: 7666</div>
                <div>• Tiroglossal kanal kisti: 171</div>
              </div>
            </div>
          )}
        </div>

        {/* Endokrin Patoloji */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('endokrin')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#27AE60] w-12 h-12 flex items-center justify-center text-white">
                <FileText size={24} />
              </div>
              <h3 className="text-left">Endokrin Patoloji ve Sitoloji (51.566)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('endokrin') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('endokrin') && (
            <div className="p-6 pt-0 border-t">
              <h4 className="mb-3">Biyopsiler ve Ameliyat Materyali</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mb-6">
                <div>• Tiroid total/lobektomi: 2728</div>
                <div>• Paratiroid bezi: 674</div>
                <div>• Adrenal rezeksiyon: 87</div>
                <div>• Hipofiz tümörü: 28</div>
                <div>• Sinir biyopsisi: 71</div>
              </div>
              <h4 className="mb-3">Sitoloji</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                <div>• Hücre bloğu hazırlanması: 7724</div>
                <div>• Servikal/vajinal sitoloji: 6423</div>
                <div>• Sıvı bazlı sitoloji: 27801</div>
                <div>• İnce iğne aspirasyonu: 22988</div>
                <div>• Filtre preparatı: 978</div>
                <div>• İmprint: 1003</div>
                <div>• İnce tabaka teknolojisi: 402</div>
                <div>• Vücut sıvıları (liste dışı): 2692</div>
              </div>
            </div>
          )}
        </div>

        {/* Kemik ve Yumuşak Doku */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('kemik')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#E74C3C] w-12 h-12 flex items-center justify-center text-white">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-left">Kemik ve Yumuşak Doku Patolojisi (4.268)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('kemik') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('kemik') && (
            <div className="p-6 pt-0 border-t">
              <h4 className="mb-3">Biyopsiler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mb-6">
                <div>• Kemik biyopsileri / ekzostoz: 138</div>
                <div>• Kemik iliği biyopsisi: 317</div>
                <div>• Yumuşak doku biyopsisi: 1092</div>
                <div>• Kas biyopsisi: 118</div>
                <div>• Synovium biyopsisi: 48</div>
                <div>• Bursa/sinovyal kist: 20</div>
                <div>• Ganglion kisti: 131</div>
              </div>
              <h4 className="mb-3">Ameliyat Materyali / Rezeksiyon</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                <div>• Yumuşak doku tümörü (geniş rezeksiyon): 1877</div>
                <div>• Ekstremite amputasyon (travmatik): 98</div>
                <div>• Ekstremite amputasyon (travma dışı): 119</div>
                <div>• Intervertebral disk: 49</div>
                <div>• Kemik rezeksiyonu: 321</div>
                <div>• Kemik fragmanları/patolojik kırık: 28</div>
                <div>• Eklem gevşek cisim: 38</div>
                <div>• Eklem rezeksiyon: 32</div>
              </div>
            </div>
          )}
        </div>

        {/* Santral Sinir Sistemi */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('cns')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#F39C12] w-12 h-12 flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>
              <h3 className="text-left">Santral Sinir Sistemi (1.528)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('cns') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('cns') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                <div>• Beyin / meninks tümör rezeksiyonu: 1473</div>
                <div>• Beyin meninks (tümör dışı): 55</div>
              </div>
            </div>
          )}
        </div>

        {/* Gastrointestinal Sistem */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('gis')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#8E44AD] w-12 h-12 flex items-center justify-center text-white">
                <FileText size={24} />
              </div>
              <h3 className="text-left">Gastrointestinal Sistem (23.233)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('gis') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('gis') && (
            <div className="p-6 pt-0 border-t">
              <h4 className="mb-3">Biyopsiler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mb-6">
                <div>• Mide biyopsisi (tekli ve çoklu lokasyon): 9741</div>
                <div>• Duodenum biyopsisi: 3153</div>
                <div>• İnce barsak biyopsisi: 1199</div>
                <div>• Kolon biyopsisi (tek): 3221</div>
                <div>• Kolon biyopsisi (çoklu): 47</div>
                <div>• Kolorektal polip: 361</div>
                <div>• Rektal polipoid oluşum: 42</div>
                <div>• Safra kesesi: 4427</div>
                <div>• Herni kesesi: 876</div>
              </div>
              <h4 className="mb-3">Ameliyat Materyali / Rezeksiyon</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                <div>• Mide subtotal/total rezeksiyon (tümör dışı): 41</div>
                <div>• Mide subtotal/total rezeksiyon (tümör): 137</div>
                <div>• İnce barsak tümör rezeksiyonu: 150</div>
                <div>• İnce barsak rezeksiyonu (tümör dışı): 162</div>
                <div>• Kolon segmental rezeksiyon (tümör): 384</div>
                <div>• Kolon segmental rezeksiyon (tümör dışı): 107</div>
                <div>• Kolon total rezeksiyon: 39</div>
                <div>• Kolostomi stoma: 36</div>
                <div>• Apendiks insidental: 108</div>
                <div>• Apendiks patolojili: 501</div>
                <div>• Özefagus biyopsisi ve rezeksiyon: 1137</div>
              </div>
            </div>
          )}
        </div>

        {/* Akciğer ve Mediastinal Sistem */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('lung')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white">
                <FileText size={24} />
              </div>
              <h3 className="text-left">Akciğer ve Mediastinal Sistem (715)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('lung') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('lung') && (
            <div className="p-6 pt-0 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                <div>• Akciğer kama biyopsisi: 144</div>
                <div>• Akciğer total/lob/segment rezeksiyon: 44</div>
                <div>• Bronş biyopsisi: 396</div>
                <div>• Mediastinal lenf nodu biyopsisi: 131</div>
              </div>
            </div>
          )}
        </div>

        {/* Böbrek ve Erkek Genital Sistem */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('kidney')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#27AE60] w-12 h-12 flex items-center justify-center text-white">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-left">Böbrek ve Erkek Genital Sistem (4.362)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('kidney') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('kidney') && (
            <div className="p-6 pt-0 border-t">
              <h4 className="mb-3">Biyopsiler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mb-6">
                <div>• Böbrek iğne biyopsisi: 543</div>
                <div>• Üreter biyopsisi: 52</div>
                <div>• Mesane biyopsisi: 106</div>
                <div>• Prostat iğne biyopsisi: 2291</div>
                <div>• Testis biyopsisi / testis tümörü: 54</div>
              </div>
              <h4 className="mb-3">Ameliyat Materyali</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                <div>• Böbrek parsiyel/total nefrektomi: 169</div>
                <div>• Mesane TUR: 315</div>
                <div>• Mesane parsiyel/total rezeksiyon: 52</div>
                <div>• Prostat radikal rezeksiyon: 128</div>
                <div>• Prostat TUR: 810</div>
                <div>• Üreter rezeksiyon: 42</div>
              </div>
            </div>
          )}
        </div>

        {/* Kadın Genital Sistem ve Meme */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('gynecology')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#E74C3C] w-12 h-12 flex items-center justify-center text-white">
                <Users size={24} />
              </div>
              <h3 className="text-left">Kadın Genital Sistem ve Meme (5.264)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('gynecology') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('gynecology') && (
            <div className="p-6 pt-0 border-t">
              <h4 className="mb-3">Biyopsiler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mb-6">
                <div>• Serviks biyopsisi: 489</div>
                <div>• Endometrium biyopsisi/kürtaj: 2060</div>
                <div>• Vulva/labia biyopsisi: 261</div>
                <div>• Over wedge / biyopsi: 160</div>
                <div>• Over biyopsisi (neoplastik olmayan): 267</div>
                <div>• Uterus biyopsisi (neoplastik): 630</div>
                <div>• Plasenta: 252</div>
                <div>• Aborte materyali: 305</div>
                <div>• Adli/medikal otopsi: 139</div>
                <div>• Fetus otopsisi: 46</div>
              </div>
              <h4 className="mb-3">Ameliyat Materyali</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                <div>• Meme biyopsisi: 500</div>
                <div>• Meme mastektomi + aksilla: 117</div>
                <div>• Meme parsiyel/basit rezeksiyon: 135</div>
                <div>• Uterus (+/- adneks) tümör rezeksiyon: 329</div>
                <div>• Uterus prolapsus cerrahisi: 35</div>
                <div>• Over (+/- tuba) neoplastik: 43</div>
                <div>• Tuba uterina sterilizasyon: 41</div>
              </div>
            </div>
          )}
        </div>

        {/* Konsültasyon, Frozen ve Moleküler İnceleme */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('molecular')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#F39C12] w-12 h-12 flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>
              <h3 className="text-left">Konsültasyon, Frozen ve Moleküler İnceleme (186.368)</h3>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('molecular') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('molecular') && (
            <div className="p-6 pt-0 border-t">
              <h4 className="mb-3">Frozen ve Konsültasyon</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground mb-6">
                <div>• Frozen incelemesi: 2334</div>
                <div>• Konsültasyon patolojisi + hazır boyalı preparatlar/parafin blok: 4283</div>
              </div>
              <h4 className="mb-3">Moleküler Testler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                <div>• Histokimyasal boyamalar: 118660</div>
                <div>• İmmünohistokimya: 55677</div>
                <div>• İmmünfloresan mikroskopi: 5142</div>
                <div>• Kromojenik in situ hibridizasyon: 122</div>
                <div>• İn situ hibridizasyon için doku hazırlama: 95</div>
                <div>• Moleküler panel testleri: 255</div>
                <div>• Yeni nesil dizileme panelleri: 50+</div>
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
