import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { openCookiePreferences } from '../utils/cookieConsent';

export function CerezPolitikasi() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 md:p-10 text-slate-800 leading-relaxed space-y-6">
        <h1 className="text-3xl font-bold">Çerez Politikası</h1>
        <p>Bu sayfa metinciris.com.tr üzerinde kullanılan zorunlu yerel depolama ve isteğe bağlı analitik teknolojilerini açıklar.</p>
        <section><h2 className="text-xl font-bold">Gerekli yerel depolama</h2>
          <p>Tema, sayfa tercihleri, bazı raporlama araçlarının yerel taslakları ve çerez seçiminiz gibi veriler
            tarayıcı depolamasında tutulabilir. Analitik tercihi <code>metinciris_analytics_consent_v1</code> anahtarında saklanır.
            Analitik tercihinizi reddetmeniz sitenin temel işlevlerini engellemez.
            Raporlama araçlarına kişiyi tanımlayan hasta verisi girmeyiniz.</p></section>
        <section><h2 className="text-xl font-bold">İsteğe bağlı Google Analytics</h2>
          <p>Yalnızca açık onayınızdan sonra Google Analytics (ölçüm hizmeti: Google LLC) etkinleşir;
            sayfa görüntülemeleri ve etkileşimlere ilişkin çevrim içi tanımlayıcılar işlenebilir.
            Google Analytics'in yaygın kullandığı <code>_ga</code> ve <code>_ga_*</code> çerezlerinin süreleri tipik olarak
            iki yıla kadar yapılandırılabilir. Tarayıcı, Google yapılandırması ve üçüncü taraf politikalarına göre
            gerçekleşen kullanım ayrıca doğrulanmalıdır.</p>
          <p>Reddetmeniz durumunda Google Analytics betiği yüklenmez. Daha önce onay verip sonradan reddettiğinizde
            yeni analitik olayların gönderimi durdurulur ve site alan adındaki ilgili Analytics çerezleri silinmeye çalışılır.
            Sağlayıcıda önceden toplanmış kayıtların silinmesi bundan farklı bir süreçtir.</p></section>
        <section><h2 className="text-xl font-bold">Kontrolünüz</h2>
          <p>Sayfa altındaki çerez tercihleri bağlantısından kararınızı istediğiniz zaman değiştirebilirsiniz.
            Tarayıcınızın çerez ve yerel depolama temizleme ayarları da kullanılabilir.</p>
          <button type="button" onClick={openCookiePreferences}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
            Çerez Tercihlerini Aç
          </button></section>
        <section><h2 className="text-xl font-bold">Dış kaynaklar</h2>
          <p>Harici bağlantılar, yazı tipleri, finans ve toplantı servisleri kendi koşullarında farklı depolama
            teknolojileri kullanabilir. İlgili sayfalardaki üçüncü taraf veri akışlarının ayrıca denetlenmesi gerekir.
            Kişisel verilerle ilgili bilgi için <a href="/kvkk-aydinlatma-metni/" className="text-blue-700 underline">KVKK Aydınlatma Metni</a> sayfasını inceleyiniz.</p></section>
        <p className="text-xs text-slate-500 border-t pt-4">Son güncelleme: 14 Kasım 2026.</p>
      </div>
    </PageContainer>
  );
}
