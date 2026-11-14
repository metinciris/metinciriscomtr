import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Lock } from 'lucide-react';

export function GizlilikPolitikasi() {
  return (
    <PageContainer>
      <header className="rounded-3xl bg-slate-900 text-white p-8 md:p-12 mb-8">
        <div className="flex items-center gap-3 mb-4"><Lock size={27} aria-hidden="true" />
          <h1 className="text-3xl font-bold text-white">Gizlilik Politikası</h1></div>
        <p className="text-slate-200">metinciris.com.tr ziyaretçi gizliliğine ilişkin açıklamalar.</p>
      </header>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-10 text-slate-800 space-y-7 leading-relaxed">
        <section><h2 className="text-xl font-bold">Site sahibi ve kapsam</h2>
          <p>Bu kişisel/akademik internet sitesi Prof. Dr. İbrahim Metin Çiriş tarafından işletilmektedir.
            Verilerin işlenmesi, amacı, hukuki sebebi ve haklarınıza ilişkin ayrıntılar için
            <a href="/kvkk-aydinlatma-metni/" className="text-blue-700 underline ml-1">KVKK Aydınlatma Metni</a> geçerlidir.</p></section>
        <section><h2 className="text-xl font-bold">Analitik ve çerez tercihiniz</h2>
          <p>Google Analytics ziyaret istatistikleri için isteğe bağlıdır. Siz <strong>Kabul Et</strong> seçeneğini seçmedikçe
            Analytics betiği yüklenmez. <strong>Reddet</strong> seçeneği aynı kolaylıkla kullanılabilir.
            Sayfa altındaki <strong>Çerez Tercihleri</strong> düğmesiyle kararınızı sonradan değiştirebilirsiniz.</p>
          <p>Ayrıntılı açıklama, sağlayıcı ve çerez süreleri için
            <a href="/cerez-politikasi/" className="text-blue-700 underline ml-1">Çerez Politikası</a> sayfasına bakınız.</p></section>
        <section><h2 className="text-xl font-bold">İletişim</h2>
          <p>Sitedeki mesaj gönderme bağlantısı harici Google Forms sayfasını açar. Bu formu doldurduğunuzda
            bilgiler Google hizmetleri tarafından işlenebilir. Formun harici açılması, yurt dışı aktarıma ilişkin hukuki yükümlülükleri
            ortadan kaldırmaz. Hasta kimlik bilgisi, protokol numarası ve sağlık raporu göndermeyiniz.
            Alternatif olarak <a href="/iletisim/" className="text-blue-700 underline">iletişim</a> sayfasındaki e-posta adreslerini kullanabilirsiniz.</p></section>
        <section><h2 className="text-xl font-bold">Toplantılar, bildirimler ve üçüncü taraflar</h2>
          <p>Konsensus toplantıları Supabase üzerinden görüntülenebilir. Tarayıcı bildirimine isteğe bağlı abone olduğunuzda,
            abonelik uç noktası ve ilgili teknik anahtarlar bildirim hizmetinde işlenebilir. Bildirimleri tarayıcınızdan kapatabilirsiniz.
            İlgili sayfalarda TradingView gibi üçüncü taraf kaynaklar, Google Fonts ve bağlantısını açmayı tercih ettiğiniz başka
            dış siteler kendi veri işleme koşullarına tabi olabilir.</p></section>
        <section><h2 className="text-xl font-bold">Yerel raporlama araçları</h2>
          <p>Raporlama hesaplayıcılarının bazıları taslak bilgileri ve tercihleri tarayıcınızda saklar.
            Bunlar merkezi bir hasta kayıt sistemi değildir. Kişiyi tanımlayan hasta bilgilerini bu araçlara girmeyiniz.
            Açıkça belirtilen ayrı bir yükleme işlevi kullanılmadıkça yerel formlar sunucuya gönderilmek üzere tasarlanmamıştır;
            ancak her aracın işleyişi kullanımdan önce ayrıca kontrol edilmelidir.</p></section>
        <section><h2 className="text-xl font-bold">Güvenlik, saklama ve haklar</h2>
          <p>Hizmet sağlayıcı günlükleri, analitik ve iletişim kayıtlarının saklama süreleri hizmetin ve uygulanan yapılandırmanın
            özelliklerine bağlıdır. Haklarınız ve ilgili iletişim adresleri
            <a href="/kvkk-aydinlatma-metni/" className="text-blue-700 underline ml-1">KVKK Aydınlatma Metni</a> içinde açıklanır.</p></section>
        <p className="text-xs text-slate-500 border-t pt-4">Son metin güncellemesi: 14 Kasım 2026.</p>
      </div>
    </PageContainer>
  );
}
