import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { ShieldCheck } from 'lucide-react';

/** Bu bilgilendirme metni veri akislarina gore duzenlenmis taslaktir; kurumsal ve hukuki denetim gerekir. */
export function KvkkAydinlatma() {
  return (
    <PageContainer>
      <header className="rounded-3xl bg-slate-900 text-white p-8 md:p-12 mb-8">
        <div className="flex items-center gap-3 mb-4"><ShieldCheck size={27} aria-hidden="true" />
          <h1 className="text-3xl font-bold text-white">KVKK Aydınlatma Metni</h1>
        </div>
        <p className="text-slate-200">6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında ziyaretçilere bilgilendirme.</p>
      </header>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-10 text-slate-800 space-y-7 leading-relaxed">
        <section><h2 className="text-xl font-bold">1. Veri sorumlusu</h2>
          <p>metinciris.com.tr, Prof. Dr. İbrahim Metin Çiriş tarafından kişisel ve akademik amaçla işletilmektedir.
            Siteyle ilgili kişisel veri başvurularınız için <a href="/iletisim/" className="text-blue-700 underline">iletişim</a> sayfasında yer alan e-posta adreslerini kullanabilirsiniz.</p>
        </section>
        <section><h2 className="text-xl font-bold">2. Veri kategorileri ve toplama yolları</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>İletişim:</strong> E-posta yoluyla yazmanız veya bağlantısını açtığınız Google Form'u doldurmanız hâlinde ad, e-posta adresi ve ilettiğiniz mesaj.</li>
            <li><strong>Teknik kullanım:</strong> Siteyi barındıran hizmetlerin sunucu günlüklerinde bulunabilecek IP adresi, cihaz/tarayıcı ve erişim bilgileri.</li>
            <li><strong>Analitik:</strong> Sadece tercih ekranından kabul ederseniz Google Analytics aracılığıyla ziyaret ve kullanım istatistikleri ile çevrim içi tanımlayıcılar.</li>
            <li><strong>Konsensus bildirimleri:</strong> Bildirimleri açtığınızda tarayıcınızın ürettiği push abonelik uç noktası, açık anahtar bilgileri ve tercih ettiğiniz bildirim konuları.</li>
            <li><strong>Yerel araçlar:</strong> Bazı hesaplayıcı ve raporlama araçlarının taslakları/ayarları tarayıcınızın yerel depolamasında tutulabilir.</li>
          </ul>
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <strong>Hasta bilgisi paylaşmayınız:</strong> İletişim formuna veya genel kullanıma açık araçlara hasta adı,
            T.C. kimlik numarası, protokol numarası, doğum tarihi, rapor ya da kişiyi tanımlayan sağlık verileri girmeyiniz.
            Klinik raporlama araçları hastaya özgü kimlik bilgileri olmaksızın kullanılmalıdır.
          </p>
        </section>
        <section><h2 className="text-xl font-bold">3. İşleme amaçları ve hukuki sebepler</h2>
          <p>İletişim taleplerinin cevaplanması, sitenin güvenli biçimde işletilmesi ve teknik sorunların giderilmesi için
            ilgili işleme faaliyetine göre KVKK 5/2 kapsamındaki meşru menfaat, hukuki yükümlülük veya hakkın tesisi/kullanılması/korunması gibi uygulanabilir şartlar değerlendirilir.
            <strong> Google Analytics analitiği yalnızca açık tercihinizle</strong> devreye girer; kabul etmemeniz temel site işlevlerini engellemez.
            Bildirim aboneliği yalnızca sizin başlatmanızla oluşturulur ve tarayıcı üzerinden iptal edilebilir.</p>
          <p>Her bir faaliyetin hukuki sebebi ve varsa KVKK 9. madde kapsamındaki aktarım mekanizması, kullanılan sağlayıcıların sözleşme ve veri akışlarıyla birlikte ayrıca doğrulanmalıdır.
            İşbu metin, herhangi bir yurt dışı aktarıma kendiliğinden açık rıza verildiği anlamına gelmez.</p>
        </section>
        <section><h2 className="text-xl font-bold">4. Alıcılar ve yurt dışı aktarımı</h2>
          <p>Site barındırma hizmetlerinde GitHub Pages; iletişim formunda Google Forms; açık tercih verilmesi hâlinde Google Analytics;
            toplantı ve bildirim işlevlerinde Supabase; ilgili sayfalarda seçilen harici içerik/servislerde başka sağlayıcılar kullanılmaktadır.
            Bu sağlayıcıların bazıları verileri yurt dışında işleyebilir. Dış bağlantı üzerinden açılan Google Form, Google tarafından sunulur.</p>
          <p>Yurt dışına aktarım için KVKK 9. maddesinde öngörülen uygun güvenceler ve/veya geçerli diğer şartlar ayrıca tesis edilmelidir.
            <strong>Formu açmak veya göndermek otomatik olarak açık rıza verilmiş sayılmaz.</strong>
            Böyle bir aktarımın uygunluğu doğrulanmadan hassas verilerin bu kanaldan iletilmemesi gerekir.</p>
        </section>
        <section><h2 className="text-xl font-bold">5. Saklama ve güvenlik</h2>
          <p>İletişim mesajları talebin yürütülmesi için gerekli olduğu sürece, teknik kayıtlar güvenlik/işletim ihtiyacı boyunca,
            analitik veriler sağlayıcının yapılandırılmış saklama süresine göre tutulur. Kesin süreler veri sorumlusu ve hizmet sağlayıcı ayarları
            üzerinden doğrulanarak ilgili saklama-imha düzenine uygun uygulanmalıdır. Tarayıcıdaki tercihler ve yerel taslaklar
            tarayıcı verilerini temizlediğinizde silinebilir. Bildirim iznini tarayıcıdan kapatabilirsiniz.</p>
        </section>
        <section><h2 className="text-xl font-bold">6. KVKK madde 11 kapsamındaki haklarınız</h2>
          <p>Verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, işleme amacı ile amacına uygun kullanımı öğrenme,
            aktarılan üçüncü kişileri bilme, düzeltme, şartları varsa silme/yok etme isteme, ilgili bildirimleri talep etme,
            otomatik analiz sonucuna itiraz etme ve kanuna aykırı işleme nedeniyle zararınızın giderilmesini isteme haklarına sahipsiniz.
            Başvurularınızı <a href="/iletisim/" className="text-blue-700 underline">iletişim</a> sayfasındaki e-posta üzerinden iletebilirsiniz;
            mevzuattaki geçerli başvuru usulleri saklıdır.</p>
        </section>
        <p className="text-xs text-slate-500 border-t pt-4">Metin güncellemesi: 14 Kasım 2026. Mevzuat ve hizmet sağlayıcı sözleşmeleriyle nihai doğrulama gerektirir.</p>
      </div>
    </PageContainer>
  );
}
