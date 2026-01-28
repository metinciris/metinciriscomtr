import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Microscope, ExternalLink, Sparkles } from 'lucide-react';

export function Galeri() {
  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-violet-800 text-white p-10 md:p-14 mb-10">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">Dijital Patoloji</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Sanal Mikroskop Galerisi
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl">
            Gerçek histopatoloji vakalarını sanal mikroskop üzerinde inceleyin.
            Dijital slide arşivinden öğrenme fırsatı.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white mb-4 shadow-lg">
            <Microscope size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Yüksek Çözünürlük</h3>
          <p className="text-gray-600 text-sm">
            Tüm slaytlar yüksek çözünürlükte taranmış, 40x büyütmeye kadar zoom yapabilirsiniz.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white mb-4 shadow-lg">
            <ExternalLink size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Online Erişim</h3>
          <p className="text-gray-600 text-sm">
            İndirme gerektirmez, tarayıcınızdan doğrudan inceleyebilirsiniz.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white mb-4 shadow-lg">
            <Sparkles size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Eğitim Amaçlı</h3>
          <p className="text-gray-600 text-sm">
            Tıp öğrencileri ve hekimler için eğitim materyali olarak kullanılabilir.
          </p>
        </div>
      </div>

      {/* Gallery iframe */}
      <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-gray-100">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center gap-3">
          <Microscope size={24} />
          <span className="font-semibold">Slide Viewer</span>
          <a
            href="https://metinciris.github.io/galeri/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
          >
            Yeni sekmede aç <ExternalLink size={16} />
          </a>
        </div>
        <iframe
          src="https://metinciris.github.io/galeri/"
          title="Sanal Mikroskop Slide Galerisi"
          style={{
            width: '100%',
            minHeight: '75vh',
            border: 'none',
          }}
          loading="lazy"
        />
      </div>

      {/* Info Note */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 p-6">
        <p className="text-gray-700 text-sm m-0">
          <strong className="text-indigo-700">Not:</strong> Galeri ayrı bir GitHub Pages projesinden yüklenmektedir.
          Yükleme süresi internet bağlantınıza bağlı olarak değişebilir.
        </p>
      </div>
    </PageContainer>
  );
}
