import React, { useEffect } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Building2, Phone, Clock, AlertCircle, ExternalLink, MapPin } from 'lucide-react';

const ECZANELERI_IFRAME_SRC = 'https://eczaneleri.net/asset/eczane/js/iframe/iframe.js';

export function NobetciEczane() {
  const now = new Date();

  const today = now.toLocaleDateString('tr-TR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // İngilizce tarih: "30 November 2025 Sunday"
  const todayEnRaw = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  // en-GB genelde "Sunday, 30 November 2025" verir → parçalayalım
  const [weekdayEn, restEn] = todayEnRaw.split(', ');
  const todayEn = restEn && weekdayEn ? `${restEn} ${weekdayEn}` : todayEnRaw;

  // Eczaneleri.NET widget kurulumu
  useEffect(() => {
    (window as any).pharmacyiFrame = {
      color1: '00d2d3',
      color2: '17a2b8',
      city: 'isparta',   // sadece Isparta
      county: 'merkez',  // Isparta merkez
      type: 'default-iframe',
      width: 450,        // px
      height: 1150       // px
    };

    const script = document.createElement('script');
    script.src = ECZANELERI_IFRAME_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch {}
      delete (window as any).pharmacyiFrame;
    };
  }, []);

  return (
    <PageContainer>
      <div className="bg-gradient-to-r from-[#990000] to-[#8B0000] text-white p-6 md:p-12 mb-8">
        <h1 className="text-white mb-4 text-2xl md:text-3xl">Isparta Nöbetçi Eczane</h1>
        <p className="text-white/90 text-sm md:text-base">
          Isparta Merkez ve İlçeler Nöbetçi Eczaneler
        </p>
      </div>

      {/* Tarih Bilgisi */}
      <div className="bg-[#00A6D6] text-white p-4 md:p-6 mb-8">
        <div className="flex items-start md:items-center gap-3 flex-col md:flex-row">
          <Clock size={32} className="flex-shrink-0" />
          <div>
            <h3 className="text-white mb-1 text-lg">Bugünün Tarihi</h3>
            <p className="text-white/90 m-0 text-sm md:text-base">
              {today}
            </p>
            <p className="text-white/80 m-0 text-xs md:text-sm mt-1">
              {todayEn}
            </p>
          </div>
        </div>
      </div>

      {/* Nöbetçi Eczane Widget'ı */}
      <div className="bg-white p-4 md:p-8 mb-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-3 text-xl md:text-2xl">Bugünkü Nöbetçi Eczaneler (Isparta)</h2>
          <p className="text-muted-foreground mb-4 text-sm md:text-base">
            Aşağıdaki nöbetçi eczaneler otomatik alınmaktadır:
          </p>
          {/* Widget konteyneri – script burayı dolduracak */}
          <div className="pharmacy-container w-full overflow-hidden" />
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Veri kaynağı: Eczaneleri.NET – Saatlik olarak güncellenir.
          </p>
        </div>
      </div>

      {/* Ana Yönlendirme Kartı */}
      <div className="bg-white p-6 md:p-12 mb-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-4 text-xl md:text-2xl">Resmi Nöbetçi Eczane Listesi</h2>
          <p className="text-muted-foreground mb-8 text-sm md:text-base">
            Isparta ili merkez ve ilçelerindeki güncel nöbetçi eczane listesi için
            aşağıdaki butona tıklayarak Isparta Eczacılar Odası resmi web sitesini ziyaret edebilirsiniz.
          </p>

          <a
            href="https://www.ispartaeo.org.tr/nobetci-eczaneler"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#990000] text-white px-6 md:px-12 py-3 md:py-6 hover:bg-[#8B0000] transition-colors text-base md:text-xl"
          >
            <ExternalLink size={24} className="md:w-7 md:h-7" />
            <span>Isparta Güncel Nöbetçi Eczaneler İçin Tıklayın</span>
          </a>

          <p className="text-muted-foreground mt-6 text-xs md:text-sm">
            Liste her gün Isparta Eczacılar Odası tarafından güncellenmektedir.
          </p>
        </div>
      </div>

      {/* Uyarı */}
      <div className="bg-[#FFF3E0] border-l-4 border-[#FF8C00] p-4 md:p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-[#FF8C00] flex-shrink-0" size={24} />
          <div>
            <h3 className="mb-2 text-base md:text-lg">Önemli Bilgilendirme</h3>
            <p className="text-muted-foreground m-0 text-sm md:text-base">
              Nöbetçi eczane bilgileri değişebilir. Gitmeden önce eczaneyi arayarak doğrulama 
              yapmanız önerilir. Acil durumlar için 112'yi arayabilirsiniz.
            </p>
          </div>
        </div>
      </div>

      {/* Özellikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-4 md:p-6 text-center">
          <div className="bg-[#00A6D6] w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-white mx-auto mb-4 rounded-full">
            <MapPin size={28} className="md:w-8 md:h-8" />
          </div>
          <h3 className="mb-2 text-base md:text-lg">Tüm İlçeler</h3>
          <p className="text-muted-foreground m-0 text-sm md:text-base">
            Merkez ve tüm ilçelerin nöbetçi eczaneleri
          </p>
        </div>

        <div className="bg-white p-4 md:p-6 text-center">
          <div className="bg-[#27AE60] w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-white mx-auto mb-4 rounded-full">
            <Clock size={28} className="md:w-8 md:h-8" />
          </div>
          <h3 className="mb-2 text-base md:text-lg">Güncel Bilgi</h3>
          <p className="text-muted-foreground m-0 text-sm md:text-base">
            Her gün güncellenen nöbetçi listesi
          </p>
        </div>

        <div className="bg-white p-4 md:p-6 text-center">
          <div className="bg-[#990000] w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-white mx-auto mb-4 rounded-full">
            <Building2 size={28} className="md:w-8 md:h-8" />
          </div>
          <h3 className="mb-2 text-base md:text-lg">Resmi Kaynak</h3>
          <p className="text-muted-foreground m-0 text-sm md:text-base">
            Isparta Eczacılar Odası onaylı
          </p>
        </div>
      </div>

      {/* Yararlı Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-4 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#990000] w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white rounded-full">
              <Building2 size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-base md:text-lg">Nöbetçi Eczane Hakkında</h3>
          </div>
          <p className="text-muted-foreground mb-4 text-sm md:text-base">
            Nöbetçi eczaneler, normal mesai saatleri dışında ve resmi tatillerde vatandaşların
            ilaç ihtiyaçlarını karşılamak üzere görevlendirilmiş eczanelerdir.
          </p>
          <p className="text-muted-foreground mb-4 text-sm md:text-base">
            Nöbetçi eczaneler sabah 08:30'dan ertesi gün sabah 08:30'a kadar 24 saat boyunca
            kesintisiz hizmet vermektedir.
          </p>
          <div className="bg-[#F5F5F5] p-4">
            <h4 className="mb-3 text-sm md:text-base">Eczaneye Giderken Unutmayın:</h4>
            <ul className="space-y-2 text-muted-foreground text-sm md:text-base">
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

        <div className="bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white p-4 md:p-8">
          <h3 className="text-white mb-4 text-base md:text-lg">Acil Durum İletişim</h3>
          <div className="space-y-4">
            <div className="border-b border-white/20 pb-4">
              <h4 className="text-white mb-2 text-sm md:text-base">Acil Sağlık Hizmetleri</h4>
              <a href="tel:112" className="text-white hover:underline inline-flex items-center gap-2 text-base md:text-lg">
                <Phone size={20} />
                <span className="text-white">112</span>
              </a>
            </div>
            <div className="border-b border-white/20 pb-4">
              <h4 className="text-white mb-2 text-sm md:text-base">Isparta Eczacılar Odası</h4>
              <a href="tel:02462183232" className="text-white hover:underline inline-flex items-center gap-2 text-base md:text-lg">
                <Phone size={20} />
                <span className="text-white">0246 218 32 32</span>
              </a>
            </div>
            <div>
              <h4 className="text-white mb-2 text-sm md:text-base">Zehir Danışma Merkezi</h4>
              <a href="tel:114" className="text-white hover:underline inline-flex items-center gap-2 text-base md:text-lg">
                <Phone size={20} />
                <span className="text-white">114</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Web Sitesi Hakkında */}
      <div className="bg-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h3 className="mb-4 text-base md:text-lg">Isparta Eczacılar Odası</h3>
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            Isparta Eczacılar Odası, Isparta ilinde faaliyet gösteren eczacıların meslek kuruluşudur.
            Nöbetçi eczane listesi oda tarafından düzenlenmekte ve her gün güncellenmektedir.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://www.ispartaeo.org.tr"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#00A6D6] text-white px-4 md:px-6 py-2 md:py-3 hover:bg-[#0078D4] transition-colors inline-flex items-center gap-2 text-sm md:text-base"
            >
              <ExternalLink size={18} className="md:w-5 md:h-5" />
              Eczacılar Odası Ana Sayfa
            </a>
            <a
              href="https://www.ispartaeo.org.tr/nobetci-eczaneler"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#990000] text-white px-4 md:px-6 py-2 md:py-3 hover:bg-[#8B0000] transition-colors inline-flex items-center gap-2 text-sm md:text-base"
            >
              <Building2 size={18} className="md:w-5 md:h-5" />
              Nöbetçi Eczaneler Listesi
            </a>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
