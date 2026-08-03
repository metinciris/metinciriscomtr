import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { ShieldCheck } from 'lucide-react';

interface KvkkAydinlatmaProps {
  onNavigate?: (page: string) => void;
}

export function KvkkAydinlatma({ onNavigate }: KvkkAydinlatmaProps) {
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
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl backdrop-blur-md border border-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-wider uppercase text-gray-300">
            Hukuki Bilgilendirme
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
          KVKK Aydınlatma Metni
        </h1>
        <p className="text-base md:text-lg text-gray-300 max-w-3xl leading-relaxed">
          6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca veri sorumlusu sıfatıyla yapılan bilgilendirme.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 text-slate-800 leading-relaxed text-base space-y-8 max-w-4xl mx-auto">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            Veri Sorumlusu
          </h2>
          <p>
            Bu internet sitesi (metinciris.com.tr), Prof. Dr. İbrahim Metin Çiriş tarafından kişisel/akademik amaçlarla işletilmektedir. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca veri sorumlusu sıfatıyla aşağıdaki bilgilendirme yapılmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            İşlenen Kişisel Veriler
          </h2>
          <p className="mb-3">
            Bu site üzerinden aşağıdaki kişisel veriler işlenebilir:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              İletişim formu (Google Forms altyapısı üzerinden çalışmaktadır) kullanıldığında: ad-soyad, e-posta adresi, mesaj içeriği
            </li>
            <li>
              Sitenin genel kullanımı sırasında: IP adresi, tarayıcı bilgisi, ziyaret edilen sayfalar (Google Analytics aracılığıyla, anonimleştirilmiş biçimde)
            </li>
          </ul>

          <div className="mt-4 p-5 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl text-amber-900 text-sm md:text-base leading-relaxed">
            <strong>Önemli:</strong> Sinoptik raporlama araçları (kolorektal rapor, prostat iğne biyopsi vb.) yalnızca <strong>tarayıcınızda</strong> çalışır. Bu araçlara girdiğiniz morfolojik veriler (tümör boyutu, evreleme bilgisi vb.) hiçbir sunucuya gönderilmez, yalnızca kendi cihazınızın yerel depolama alanında (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono text-xs">localStorage</code>) saklanır ve yalnızca siz erişebilirsiniz. Bu araçlara hasta adı, protokol numarası veya kimliği belirleyici hiçbir bilgi girmeyiniz.
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            İşleme Amaçları
          </h2>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>İletişim talebine yanıt verilmesi</li>
            <li>Sitenin teknik olarak sürdürülebilmesi ve geliştirilmesi</li>
            <li>Ziyaretçi istatistiklerinin anonim olarak analiz edilmesi</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            Hukuki Sebep
          </h2>
          <p>
            Kişisel veriler, KVKK'nın 5. maddesinde belirtilen "ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfati" ve iletişim formu özelinde "bir sözleşmenin kurulması veya ifasıyla ilgili" hukuki sebeplerine dayanılarak işlenmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            Veri Aktarımı
          </h2>
          <p className="mb-3">
            Toplanan veriler, sitenin barındırma, iletişim ve analiz altyapısını sağlayan aşağıdaki üçüncü taraf hizmet sağlayıcılarla paylaşılabilir:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 mb-4">
            <li>GitHub Pages (barındırma)</li>
            <li>Google Forms (iletişim formu altyapısı)</li>
            <li>Google Analytics (anonim ziyaretçi istatistiği)</li>
          </ul>
          <p className="mb-3">
            İletişim formu Google Forms altyapısını kullandığı için, form aracılığıyla ilettiğiniz veriler Google LLC tarafından, Google'ın kendi gizlilik politikası ve veri işleme koşulları çerçevesinde, yurt dışındaki sunucularda da işlenebilir/saklanabilir. Bu, KVKK'nın 9. maddesi kapsamında bir "yurt dışına aktarım" teşkil eder; formu doldurarak bu aktarıma açık rıza vermiş olursunuz. Google'ın kendi gizlilik politikasına{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              buradan
            </a>{' '}
            ulaşabilirsiniz.
          </p>
          <p>
            Veriler pazarlama amacıyla üçüncü taraflara satılmaz veya kiralanmaz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            Saklama Süresi
          </h2>
          <p>
            İletişim formu üzerinden gelen mesajlar, talebin sonuçlandırılmasından itibaren makul bir süre saklanır ve gerekmediğinde silinir. Analitik veriler, Google Analytics'in kendi saklama politikasına tabidir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            İlgili Kişinin Hakları (KVKK m. 11)
          </h2>
          <p className="mb-3">
            Kişisel verisi işlenen ilgili kişi olarak, veri sorumlusuna başvurarak:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
            <li>Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
            <li>Eksik/yanlış işlenmişse düzeltilmesini isteme,</li>
            <li>KVKK'da öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme,</li>
            <li>Yapılan işlemlerin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
            <li>İşlenen verilerin münhasıran otomatik sistemler ile analiz edilmesi durumunda aleyhe bir sonucun ortaya çıkmasına itiraz etme,</li>
            <li>Kanuna aykırı işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme</li>
          </ul>
          <p className="mt-3">
            haklarına sahipsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            Başvuru
          </h2>
          <p>
            Yukarıdaki haklarınızı kullanmak için{' '}
            <a
              href="/iletisim/"
              onClick={handleNavigateIletisim}
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              iletişim sayfamız
            </a>{' '}
            üzerinden veya sitede belirtilen e-posta adresi üzerinden başvurabilirsiniz.
          </p>
        </section>

        <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 italic">
          Son güncelleme: 3 Ağustos 2026
        </div>
      </div>
    </PageContainer>
  );
}
