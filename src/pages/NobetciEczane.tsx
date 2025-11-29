import React, { useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Building2, Phone, Clock, AlertCircle, ExternalLink, MapPin } from 'lucide-react';

const ECZANELERI_IFRAME_SRC = 'https://eczaneleri.net/asset/eczane/js/iframe/iframe.js';

export function NobetciEczane() {
  const today = new Date().toLocaleDateString('tr-TR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Eczaneleri.NET widget kurulumu
  useEffect(() => {
    // Global konfigürasyonu ayarla (dokümandaki const pharmacyiFrame karşılığı)
    (window as any).pharmacyiFrame = {
      color1: '00d2d3',
      color2: '17a2b8',
      city: 'isparta',   // sadece Isparta
      county: 'merkez',        // tüm ilçeler
      type: 'default-iframe',
      width: 450,        // px cinsinden; istersen artırabilirsin
      height: 1000        // px cinsinden
    };

    const script = document.createElement('script');
    script.src = ECZANELERI_IFRAME_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Sayfadan çıkarken temizle
      try {
        document.body.removeChild(script);
      } catch {}
      delete (window as any).pharmacyiFrame;
    };
  }, []);

  return (
    <PageContainer>
      <div className="bg-gradient-to-r from-[#990000] to-[#8B0000] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Isparta Nöbetçi Eczane</h1>
        <p className="text-white/90">
          Isparta Merkez ve İlçeler Nöbetçi Eczaneler
        </p>
      </div>

      {/* Tarih Bilgisi */}
      <div className="bg-[#00A6D6] text-white p-6 mb-8">
        <div className="flex items-center gap-3">
          <Clock size={32} />
          <div>
            <h3 className="text-white mb-1">Bugünün Tarihi</h3>
            <p className="text-white/90 m-0">{today}</p>
          </div>
        </div>
      </div>

      {/* Nöbetçi Eczane Widget'ı */}
      <div className="bg-white p-8 mb-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-3">Bugünkü Nöbetçi Eczaneler (Isparta)</h2>
          <p className="text-muted-foreground mb-4">
            Aşağıdaki listede Isparta ili için güncel nöbetçi eczaneler, Eczaneleri.NET servisi
            üzerinden otomatik olarak gösterilmektedir.
          </p>
          {/* Widget konteyneri – script burayı dolduracak */}
          <div className="pharmacy-container w-full overflow-hidden" />
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Veri kaynağı: Eczaneleri.NET – Saatlik olarak güncellenir.
          </p>
        </div>
      </div>

      {/* Ana Yönlendirme Kartı (istersen bunu silebilirsin, dursun dedim) */}
      <div className="bg-white p-12 mb-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-4">Resmi Nöbetçi Eczane Listesi</h2>
          <p className="text-muted-foreground mb-8">
            Isparta ili merkez ve ilçelerindeki güncel nöbetçi eczane listesi için
            aşağıdaki butona tıklayarak Isparta Eczacılar Odası resmi web sitesini ziyaret edebilirsiniz.
          </p>

          <a
            href="https://www.ispartaeo.org.tr/nobetci-eczaneler"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#990000] text-white px-12 py-6 hover:bg-[#8B0000] transition-colors text-xl"
          >
            <ExternalLink size={28} />
            <span>Isparta Güncel Nöbetçi Eczaneler İçin Tıklayın</span>
          </a>

          <p className="text-muted-foreground mt-6">
            Liste her gün Isparta Eczacılar Odası tarafından güncellenmektedir.
          </p>
        </div>
      </div>

      {/* Uyarı */}
      <div className="bg-[#FFF3E0] border-l-4 border-[#FF8C00] p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-[#FF8C00] flex-shrink-0" size={24} />
          <div>
            <h3 className="mb-2">Önemli Bilgilendirme</h3>
            <p className="text-muted-foreground m-0">
              Nöbetçi eczane bilgileri değişebilir. Gitmeden önce eczaneyi arayarak doğrulama 
              yapmanız önerilir. Acil durumlar için 112'yi arayabilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* Özellikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 text-center">
          <div className="bg-[#00A6D6] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <MapPin size={32} />
          </div>
          <h3 className="mb-2">Tüm İlçeler</h3>
          <p className="text-muted-foreground m-0">
            Merkez ve tüm ilçelerin nöbetçi eczaneleri
          </p>
        </div>

        <div className="bg-white p-6 text-center">
          <div className="bg-[#27AE60] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <Clock size={32} />
          </div>
          <h3 className="mb-2">Güncel Bilgi</h3>
          <p className="text-muted-foreground m-0">
            Her gün güncellenen nöbetçi listesi
          </p>
        </div>

        <div className="bg-white p-6 text-center">
          <div className="bg-[#990000] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <h3 className="mb-2">Resmi Kaynak</h3>
          <p className="text-muted-foreground m-0">
            Isparta Eczacılar Odası onaylı
          </p>
        </div>
      </div>

      {/* Yararlı Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#990000] w-12 h-12 flex items-center justify-center text-white">
              <Building2 size={24} />
            </div>
            <h3>Nöbetçi Eczane Hakkında</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Nöbetçi eczaneler, normal mesai saatleri dışında ve resmi tatillerde vatandaşların
            ilaç ihtiyaçlarını karşılamak üzere görevlendirilmiş eczanelerdir.
          </p>
          <p className="text-muted-foreground mb-4">
            Nöbetçi eczaneler sabah 08:30'dan ertesi gün sabah 08:30'a kadar 24 saat boyunca
            kesintisiz hizmet vermektedir.
          </p>
          <div className="bg-[#F5F5F5] p-4">
            <h4 className="mb-3">Eczaneye Giderken Unutmayın:</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-[#990000]">•</span>
                <span>Reçetenizi yanınıza alın</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#990000]">•</span>
                <span>Kimlik belgenizi unutmayın</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#990000]">•</span>
                <span>Gitmeden önce arayarak doğrulayın</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#990000]">•</span>
                <span>İlaç adını ve dozunu bilin</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white p-8">
          <h3 className="text-white mb-4">Acil Durum İletişim</h3>
          <div className="space-y-4">
            <div className="border-b border-white/20 pb-4">
              <h4 className="text-white mb-2">Acil Sağlık Hizmetleri</h4>
              <a href="tel:112" className="text-white hover:underline inline-flex items-center gap-2">
                <Phone size={20} />
                <span className="text-white">112</span>
              </a>
            </div>
            <div className="border-b border-white/20 pb-4">
              <h4 className="text-white mb-2">Isparta Eczacılar Odası</h4>
              <a href="tel:02462183232" className="text-white hover:underline inline-flex items-center gap-2">
                <Phone size={20} />
                <span className="text-white">0246 218 32 32</span>
              </a>
            </div>
            <div>
              <h4 className="text-white mb-2">Zehir Danışma Merkezi</h4>
              <a href="tel:114" className="text-white hover:underline inline-flex items-center gap-2">
                <Phone size={20} />
                <span className="text-white">114</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Web Sitesi Hakkında */}
      <div className="bg-white p-8">
        <div className="max-w-3xl mx-auto">
          <h3 className="mb-4">Isparta Eczacılar Odası</h3>
          <p className="text-muted-foreground mb-6">
            Isparta Eczacılar Odası, Isparta ilinde faaliyet gösteren eczacıların meslek kuruluşudur.
            Nöbetçi eczane listesi oda tarafından düzenlenmekte ve her gün güncellenmektedir.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://www.ispartaeo.org.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#00A6D6] text-white px-6 py-3 hover:bg-[#0078D4] transition-colors inline-flex items-center gap-2"
            >
              <ExternalLink size={20} />
              Eczacılar Odası Ana Sayfa
            </a>
            <a
              href="https://www.ispartaeo.org.tr/nobetci-eczaneler"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#990000] text-white px-6 py-3 hover:bg-[#8B0000] transition-colors inline-flex items-center gap-2"
            >
              <Building2 size={20} />
              Nöbetçi Eczaneler Listesi
            </a>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
