import { PageContainer } from '../components/PageContainer';
import { Mail, Phone, Building2, ExternalLink, MapPin, MessageSquare, Linkedin } from 'lucide-react';
import { trackClick } from '../utils/analytics';


export function Iletisim() {
  // Bot korumalı e-posta adresleri
  const email1 = 'metin' + '@' + 'metinciris.com.tr';
  const email2 = 'ibrahimciris' + '@' + 'sdu.edu.tr';

  return (
    <PageContainer>
      {/* Hero Bölümü */}
      <div className="bg-gradient-to-r from-[#00A6D6] to-[#0078D4] text-white p-12 mb-8 rounded-lg">
        <h1 className="text-white mb-4">İletişim</h1>
        <p className="text-white/90 text-lg">
          Benimle iletişime geçmek için aşağıdaki bilgileri kullanabilirsiniz
        </p>
      </div>

      {/* Ana Grid - Profil ve İletişim Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Sol Kolon - Profil */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm h-full">
            <div className="flex justify-center mb-6">
              <img
                src="/resim/metinciris.avif"
                alt="Prof. Dr. Metin Çiriş"
                className="rounded-lg shadow-md"
                style={{ width: '300px', height: '423px', objectFit: 'cover' }}
                width={300}
                height={423}
                loading="lazy"
              />
            </div>
            <div className="text-center">
              <h2 className="mb-2">Prof. Dr. Metin Çiriş</h2>
              <p className="text-muted-foreground">
                Süleyman Demirel Üniversitesi<br />
                Tıp Fakültesi<br />
                Tıbbi Patoloji Anabilim Dalı
              </p>
            </div>
          </div>
        </div>

        {/* Sağ Kolon - İletişim Bilgileri */}
        <div className="lg:col-span-2 space-y-6">

          {/* Adres Kartı */}
          <div className="bg-[#00A6D6] text-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 size={28} />
              </div>
              <div>
                <h3 className="text-white mb-3">Adres</h3>
                <p className="text-white/90 leading-relaxed">
                  Dr. Metin Çiriş<br />
                  SDÜ Araştırma ve Uygulama Hastanesi<br />
                  Tıbbi Patoloji Anabilim Dalı<br />
                  32260 Isparta, Türkiye
                </p>
              </div>
            </div>
          </div>

          {/* İletişim Bilgileri Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Telefon Kartı */}
            <div className="bg-[#27AE60] text-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-white mb-3">Telefon</h3>
                  <p className="text-white/90">
                    <a
                      href="tel:+905051590"
                      onClick={() => trackClick('Phone: GSM')}
                      className="hover:text-white transition-colors block mb-1"
                    >
                      Cep: 505 519 90**
                    </a>
                    <a
                      href="tel:+902462119292"
                      onClick={() => trackClick('Phone: Office')}
                      className="hover:text-white transition-colors block"
                    >
                      Oda: (246) 211 92 92
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* E-posta Kartı */}
            <div className="bg-[#E74C3C] text-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-white mb-3">E-posta</h3>
                  <p className="text-white/90">
                    <a
                      href={`mailto:${email1}`}
                      onClick={() => trackClick('Email: Primary')}
                      className="hover:text-white transition-colors block mb-1"
                    >
                      {email1}
                    </a>
                    <span className="text-white/70 text-sm">(tercih edin)</span>
                    <a
                      href={`mailto:${email2}`}
                      onClick={() => trackClick('Email: University')}
                      className="hover:text-white transition-colors block mt-2"
                    >
                      {email2}
                    </a>
                    <span className="text-white/70 text-sm">(üniversite mail)</span>
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Sosyal Medya Kartları Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* LinkedIn Kartı */}
            <div className="bg-[#0077B5] text-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Linkedin size={24} />
                </div>
                <div>
                  <h3 className="text-white mb-3">LinkedIn</h3>
                  <a
                    href="https://www.linkedin.com/in/patoloji/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('Social: LinkedIn')}
                    className="hover:text-white/80 transition-colors inline-flex items-center gap-2"
                  >
                    linkedin.com/in/patoloji
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>

            {/* Facebook Kartı */}
            <div className="bg-[#3B5998] text-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white mb-3">Facebook</h3>
                  <a
                    href="https://fb.com/patoloji"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('Social: Facebook')}
                    className="hover:text-white/80 transition-colors inline-flex items-center gap-2"
                  >
                    fb.com/patoloji
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* General enquiries are handled on Google's external form page. */}
      <section className="bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] text-white p-7 md:p-10 rounded-lg shadow-lg mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-4">
            <MessageSquare size={26} aria-hidden="true" />
          </div>
          <h2 className="text-white mb-3">Mesaj Gönderin</h2>
          <p className="text-white/90 leading-relaxed mb-5">
            Akademik konular, öneriler ve genel sorular için harici Google Form bağlantısını kullanabilirsiniz.
            Form Google'ın internet sitesinde yeni sekmede açılır.
          </p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSd1JpaucSQGovf934mAYBUkiKPOaKw_H_xu6KSVA4L9IKP0Vg/viewform"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('Contact: Google Forms external')}
            className="inline-flex items-center justify-center gap-3 bg-white text-[#7C3A97] px-7 py-3 rounded-xl font-bold text-base hover:bg-white/90 shadow-sm"
          >
            <ExternalLink size={19} aria-hidden="true" />
            Google Form ile Mesaj Gönder
          </a>
          <p className="text-white/90 text-sm mt-5 mb-0">
            Lütfen hasta adı, protokol numarası, patoloji raporu veya başka kişisel sağlık bilgisi paylaşmayınız.
            Ayrıntılar için <a href="/kvkk-aydinlatma-metni/" className="text-white font-semibold underline">KVKK Aydınlatma Metni</a>
            sayfasını inceleyiniz. Google'ın kendi veri işleme koşulları da geçerlidir.
          </p>
        </div>
      </section>

      {/* Bilgilendirme Bölümü */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Çalışma Saatleri */}
        <div className="bg-[#F39C12] text-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <h3 className="text-white">Lokasyon</h3>
          </div>
          <p className="text-white/90">
            SDÜ Tıp Fakültesi kampüsü içerisinde, Araştırma ve Uygulama Hastanesi'nde bulunmaktayım.
          </p>
        </div>

        {/* Yanıt Süresi */}
        <div className="bg-[#16A085] text-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-white">Yanıt Süresi</h3>
          </div>
          <p className="text-white/90">
            Mesajlarınıza genellikle 24-48 saat içinde yanıt verilmektedir.
          </p>
        </div>

        {/* Tercih */}
        <div className="bg-[#E67E22] text-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
              <Mail size={20} />
            </div>
            <h3 className="text-white">İletişim Tercihi</h3>
          </div>
          <p className="text-white/90">
            E-posta yoluyla iletişim kurmayı tercih ediyorum. Acil durumlar için telefon kullanabilirsiniz.
          </p>
        </div>

      </div>
    </PageContainer>
  );
}
