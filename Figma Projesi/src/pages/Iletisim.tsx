import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Mail, Phone, Building2, ExternalLink, MapPin, MessageSquare, Linkedin } from 'lucide-react';

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
                src="https://metinciris.com.tr/resim/metinciris.jpg"
                alt="Prof. Dr. Metin Çiriş"
                className="rounded-lg shadow-md"
                style={{ width: '300px', height: '423px', objectFit: 'cover' }}
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
                    <a href="tel:+905051590" className="hover:text-white transition-colors block mb-1">
                      Cep: 505 519 90**
                    </a>
                    <a href="tel:+902462119292" className="hover:text-white transition-colors block">
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
                      className="hover:text-white transition-colors block mb-1"
                    >
                      {email1}
                    </a>
                    <span className="text-white/70 text-sm">(tercih edin)</span>
                    <a 
                      href={`mailto:${email2}`}
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
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-white mb-3">Facebook</h3>
                  <a 
                    href="https://fb.com/patoloji" 
                    target="_blank" 
                    rel="noopener noreferrer"
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

      {/* İletişim Formu Bölümü */}
      <div className="bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] text-white p-10 rounded-lg shadow-lg mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <MessageSquare size={32} />
          </div>
          <h2 className="text-white mb-4">Mesaj Gönderin</h2>
          <p className="text-white/90 text-lg mb-8 leading-relaxed">
            Sorularınız, önerileriniz veya işbirliği teklifleriniz için iletişim formunu kullanarak 
            bana mesaj gönderebilirsiniz. Tüm mesajlar doğrudan e-posta adresime iletilmektedir.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSd1JpaucSQGovf934mAYBUkiKPOaKw_H_xu6KSVA4L9IKP0Vg/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#9B59B6] px-8 py-4 rounded-lg hover:bg-white/90 transition-all hover:shadow-xl flex items-center justify-center gap-3 text-lg font-medium"
            >
              <ExternalLink size={24} />
              İletişim Formunu Aç
            </a>
            <a
              href={`mailto:${email1}`}
              className="bg-white/20 text-white px-8 py-4 rounded-lg hover:bg-white/30 transition-all flex items-center justify-center gap-3 text-lg font-medium border-2 border-white/30"
            >
              <Mail size={24} />
              Doğrudan E-posta
            </a>
          </div>
        </div>
      </div>

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
