import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Lock } from 'lucide-react';

interface GizlilikPolitikasiProps {
  onNavigate?: (page: string) => void;
}

export function GizlilikPolitikasi({ onNavigate }: GizlilikPolitikasiProps) {
  const handleNavigateKvkk = (e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate('kvkk-aydinlatma-metni');
    }
  };

  const handleNavigateIletisim = (e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate('iletisim');
    }
  };

  return (
    <PageContainer>
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1e1e] via-[#2d3748] to-[#1a202c] text-white p-8 md:p-12 mb-10 shadow-xl border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl backdrop-blur-md border border-emerald-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-wider uppercase text-gray-300">
            Gizlilik ve Güvenlik
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
          Gizlilik Politikası
        </h1>
        <p className="text-base md:text-lg text-gray-300 max-w-3xl leading-relaxed">
          Bu Gizlilik Politikası, metinciris.com.tr web sitesinin ("Site") ziyaretçilerinin kişisel verilerinin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 text-slate-800 leading-relaxed text-base space-y-8 max-w-4xl mx-auto">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            1. Kim Sorumlu?
          </h2>
          <p>
            Site, Prof. Dr. İbrahim Metin Çiriş tarafından kişisel/akademik amaçlarla, ticari bir kuruluş olmaksızın işletilmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            2. Hangi Veriler Toplanır?
          </h2>
          <div className="overflow-x-auto my-4 border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 md:p-4">Veri türü</th>
                  <th className="p-3.5 md:p-4">Ne zaman toplanır</th>
                  <th className="p-3.5 md:p-4">Amaç</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 md:p-4 font-medium text-slate-900">Ad, e-posta, mesaj</td>
                  <td className="p-3.5 md:p-4">İletişim formu (Google Forms) doldurulduğunda</td>
                  <td className="p-3.5 md:p-4">Talebe yanıt verme</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 md:p-4 font-medium text-slate-900">IP adresi, tarayıcı, sayfa görüntüleme</td>
                  <td className="p-3.5 md:p-4">Her ziyarette otomatik</td>
                  <td className="p-3.5 md:p-4">Anonim kullanım istatistiği (Google Analytics)</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3.5 md:p-4 font-medium text-slate-900">Yerel tercih verisi (tema, son kullanılan araçlar, taslak raporlar)</td>
                  <td className="p-3.5 md:p-4">Tarayıcınızda <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">localStorage</code> aracılığıyla</td>
                  <td className="p-3.5 md:p-4">Yalnızca cihazınızda saklanır, sunucuya gönderilmez</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            İletişim formu Google Forms altyapısı üzerinden çalışır; form aracılığıyla girdiğiniz veriler Google LLC'nin sunucularında (yurt dışında) işlenebilir. Detaylar için{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Google Gizlilik Politikası
            </a>
            'na bakabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            3. Çerezler (Cookies)
          </h2>
          <p className="mb-3">
            Site, Google Analytics aracılığıyla anonim ziyaretçi istatistiği toplamak için çerez kullanabilir. Bu çerezler kişisel kimliğinizi belirlemez. Tarayıcı ayarlarınızdan çerezleri her zaman engelleyebilirsiniz; bu durumda sitenin temel işlevleri etkilenmez.
          </p>
          <p>
            Site ayrıca bazı özellikler (tema tercihi, son kullanılan raporlama araçları, taslak rapor kurtarma) için tarayıcınızın yerel depolama alanını (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">localStorage</code>) kullanır. Bu veriler bir çerez değildir, sunucuya hiçbir zaman gönderilmez, yalnızca kendi cihazınızda kalır ve tarayıcı verilerinizi temizlediğinizde silinir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            4. Üçüncü Taraf Hizmetler
          </h2>
          <p className="mb-3">
            Site aşağıdaki üçüncü taraf hizmetleri kullanır, her birinin kendi gizlilik politikası geçerlidir:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong>GitHub Pages</strong> — barındırma</li>
            <li><strong>Google Forms</strong> — iletişim formu altyapısı</li>
            <li><strong>Google Analytics</strong> — anonim ziyaretçi istatistiği</li>
            <li><strong>TradingView</strong> (yalnızca Finans sayfasında) — piyasa verisi widget'ı</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            5. Verileriniz Nerede Saklanır?
          </h2>
          <p>
            İletişim formu verileri Google Forms üzerinden iletilir. Sinoptik raporlama araçlarına girdiğiniz veriler <strong>hiçbir zaman bir sunucuya ulaşmaz</strong>; tamamen tarayıcınızda kalır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            6. Haklarınız
          </h2>
          <p>
            Avrupa Birliği'nden erişiyorsanız GDPR, Türkiye'den erişiyorsanız KVKK kapsamındaki haklarınız için{' '}
            <a
              href="/kvkk-aydinlatma-metni/"
              onClick={handleNavigateKvkk}
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              KVKK Aydınlatma Metni
            </a>{' '}
            sayfamıza bakınız.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            7. Politika Değişiklikleri
          </h2>
          <p>
            Bu politika zaman zaman güncellenebilir. Güncel sürüm her zaman bu sayfada yayınlanır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            8. İletişim
          </h2>
          <p>
            Sorularınız için{' '}
            <a
              href="/iletisim/"
              onClick={handleNavigateIletisim}
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              iletişim sayfamızı
            </a>{' '}
            kullanabilirsiniz.
          </p>
        </section>

        <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 italic">
          Son güncelleme: 3 Ağustos 2026
        </div>
      </div>
    </PageContainer>
  );
}
