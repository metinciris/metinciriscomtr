import React from 'react';
import { BookOpen, Stethoscope, Dna, ArrowRight, Activity, Microscope } from 'lucide-react';
import { getPageBySlug } from '../core/data/registry';

interface ReferenceCenterProps {
  onNavigate: (page: string) => void;
}

export function ReferenceCenter({ onNavigate }: ReferenceCenterProps) {
  const navigateTo = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    e.preventDefault();
    onNavigate(slug);
  };

  const categories = [
    {
      title: 'Tanısal Patoloji',
      icon: Microscope,
      description: 'Günlük tanı pratiğinde karşılaşılan zorluklar, raporlama kriterleri ve ayırıcı tanı rehberleri.',
      links: [
        { title: 'Patoloji Tanı Tuzakları ve İpuçları', slug: 'tani-tuzaklari' },
        { title: 'Ayın Patoloji Vakası', slug: 'ayin-vakasi' },
        { title: 'GIST Raporlama Rehberi', slug: 'gist-raporlama' },
        { title: 'Meme Karsinomunda HER2 İHK Algoritması', slug: 'meme-her2' },
      ]
    },
    {
      title: 'Moleküler Patoloji',
      icon: Dna,
      description: 'Yeni nesil dizileme, gen panelleri ve hedefe yönelik tedavi testleri için kılavuzlar.',
      links: [
        { title: 'NGS Test Seçimi ve Örnek Rehberi', slug: 'ngs-test-secimi' },
        { title: 'DNA/RNA Gen Paneli (İnteraktif Arama)', slug: 'ngs' },
        { title: 'Testis GHT İHK ve Marker Profili', slug: 'testis-ght-ihk' },
        { title: 'PubMed Trend Analizi (Moleküler Odaklı)', slug: 'pubmed-trend' }
      ]
    },
    {
      title: 'Klinik ve Pratik Araçlar',
      icon: Stethoscope,
      description: 'Klinik işleyiş ve makroskopi odasında kullanılabilecek interaktif yardımcılar.',
      links: [
        { title: 'Patoloji Sözlüğü ve Terim Açıklayıcı', slug: 'patoloji-sozlugu' },
        { title: 'RCB (Residual Cancer Burden) Hesaplayıcı', slug: 'rcb-calculator' },
        { title: 'Lenf Nodu Sayacı', slug: 'lenf-nodu' },
        { title: '3D Prizma - Makroskopi Aracı', slug: 'prizma-3d' }
      ]
    },
    {
      title: 'Akademik ve Literatür',
      icon: BookOpen,
      description: 'Güncel yayınların takibi, eğitim arşivi ve ders notları merkezi.',
      links: [
        { title: 'Patoloji Literatür Takibi (Radar)', slug: 'makale-takip' },
        { title: 'Üniversite ve Eğitim Arşivi', slug: 'universite' },
        { title: 'Patoloji Podcast', slug: 'podcast' },
        { title: 'Günün Patoloji Makalesi', slug: 'makale' }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-[#2B32B2] to-[#1488CC] p-8 md:p-12 mb-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={32} className="text-white/90" />
            <h1 className="text-3xl md:text-5xl font-bold">Patoloji Başvuru Merkezi</h1>
          </div>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
            Tanısal rehberler, moleküler patoloji kılavuzları, raporlama araçları ve güncel literatür seçkilerinin derlendiği merkezi referans kaynağı.
          </p>
        </div>
        <div className="hidden md:block opacity-20 absolute right-10 top-1/2 -translate-y-1/2">
          <BookOpen size={180} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {categories.map((category, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 text-[#1488CC] rounded-xl">
                <category.icon size={28} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{category.title}</h2>
            </div>
            <p className="text-gray-600 mb-6 h-12">
              {category.description}
            </p>
            
            <ul className="space-y-3">
              {category.links.map((link, linkIdx) => (
                <li key={linkIdx}>
                  <a
                    href={`/${link.slug}/`}
                    onClick={(e) => navigateTo(e, link.slug)}
                    className="group flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-[#1488CC] hover:text-white transition-all border border-gray-100 hover:border-transparent"
                  >
                    <span className="font-medium">{link.title}</span>
                    <ArrowRight size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center text-gray-500 text-sm">
        Sürekli güncellenen ve bağımsız kaynaklar içeren bir kılavuzdur. İçerikler profesyoneller ve öğrenciler içindir.
      </div>
    </div>
  );
}
