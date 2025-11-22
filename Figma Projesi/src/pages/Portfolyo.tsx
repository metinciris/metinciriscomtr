import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { 
  Award, 
  BookOpen, 
  Briefcase, 
  GraduationCap, 
  TrendingUp, 
  FileText,
  Calendar,
  Users,
  BarChart3,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

export function Portfolyo() {
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#8E44AD] to-[#9B59B6] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Prof. Dr. İbrahim Metin ÇİRİŞ</h1>
        <p className="text-white/90 mb-2">
          Süleyman Demirel Üniversitesi Tıp Fakültesi Patoloji Anabilim Dalı
        </p>
        <p className="text-white/80">
          Profesör | Tıbbi Patoloji Uzmanı
        </p>
      </div>

      {/* Akademik Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-8 text-center">
          <div className="bg-[#00A6D6] w-20 h-20 flex items-center justify-center text-white mx-auto mb-4">
            <TrendingUp size={40} />
          </div>
          <h3 className="mb-2">H-Index</h3>
          <p className="text-muted-foreground mb-3">24</p>
          <a 
            href="https://scholar.google.com.tr/citations?user=zEF_KLsAAAAJ&hl=tr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00A6D6] hover:underline inline-flex items-center gap-1"
          >
            Güncel Veriler <ExternalLink size={16} />
          </a>
        </div>

        <div className="bg-white p-8 text-center">
          <div className="bg-[#27AE60] w-20 h-20 flex items-center justify-center text-white mx-auto mb-4">
            <FileText size={40} />
          </div>
          <h3 className="mb-2">Atıf Sayısı</h3>
          <p className="text-muted-foreground mb-3">2000+</p>
          <a 
            href="https://scholar.google.com.tr/citations?user=zEF_KLsAAAAJ&hl=tr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#27AE60] hover:underline inline-flex items-center gap-1"
          >
            Google Scholar <ExternalLink size={16} />
          </a>
        </div>

        <div className="bg-white p-8 text-center">
          <div className="bg-[#E74C3C] w-20 h-20 flex items-center justify-center text-white mx-auto mb-4">
            <BarChart3 size={40} />
          </div>
          <h3 className="mb-2">Deneyim</h3>
          <p className="text-muted-foreground">
            20+ yıl üniversite<br />
            200+ yayın<br />
            2.000.000+ preparat
          </p>
        </div>
      </div>

      {/* Uzmanlık Alanları */}
      <div className="mb-8">
        <h2 className="mb-6">Uzmanlık Alanları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6">
            <h3 className="mb-3 text-[#00A6D6]">Endokrin Patoloji</h3>
            <p className="text-muted-foreground">
              Tiroid İnce İğne Aspirasyon Biyopsisi, Tiroid ameliyat materyalleri, 
              Paratiroid, Adrenal gland, Hipofiz.
            </p>
          </div>

          <div className="bg-white p-6">
            <h3 className="mb-3 text-[#27AE60]">Karaciğer ve Pankreatikobiliyer Patoloji</h3>
            <p className="text-muted-foreground">
              Hepatitler, siroz. Karaciğer, safra yolları, pankreas hastalıkları ve 
              tümör patolojileri, karaciğer transplant patolojisi.
            </p>
          </div>

          <div className="bg-white p-6">
            <h3 className="mb-3 text-[#E74C3C]">Kemik ve Yumuşak Doku Patolojileri</h3>
            <p className="text-muted-foreground">
              Kemik, yumuşak doku yerleşimli tümör patolojileri.
            </p>
          </div>

          <div className="bg-white p-6">
            <h3 className="mb-3 text-[#F39C12]">Diğer Uzmanlık Alanları</h3>
            <p className="text-muted-foreground">
              Baş boyun patolojisi, merkezi sinir sistemi patolojisi, tümör dışı böbrek 
              patolojileri, böbrek transplant patolojisi, dermatopatoloji, erkek genital 
              sistem ve ürogenital sistem.
            </p>
          </div>
        </div>
      </div>

      {/* 10 Yıllık Patoloji İstatistikleri */}
      <div className="mb-8">
        <h2 className="mb-4">10 Yıllık Patoloji İstatistikleri (Giderek Artmakta)</h2>
        <p className="text-muted-foreground mb-6">
          Baş Boyun Patolojisi, Endokrin patoloji ve sitoloji, Kemik ve yumuşak doku patolojisi, 
          Santral sinir sistemi patolojisi, Gastrointestinal sistem patolojisi, Konsültasyon, 
          otopsi, frozen ve ileri inceleme, Diğer alanlar.
        </p>

        {/* Baş Boyun Patolojisi */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('basboyun')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white">
                <Users size={24} />
              </div>
              <h3 className="text-left">Baş Boyun Patolojisi</h3>
            </div>
            <ChevronDown 
              size={24} 
              className={`transition-transform ${isExpanded('basboy un') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('basboy un') && (
            <div className="p-6 pt-0 border-t">
              <p className="text-muted-foreground mb-4">
                Dudak, ağız içi, dil, tonsiller, nazofarinks, nazal mukoza, kafa kemikleri, 
                üst solunum yolu, baş boyun lenf nodları, tükrük bezi patolojileri.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                <div>• Tonsil ve/veya adenoidler: 5014</div>
                <div>• Tükrük bezi, biyopsi: 1538</div>
                <div>• Larinks, biyopsi: 1422</div>
                <div>• Burun, sinüs polipleri: 1013</div>
                <div>• Diş (odontojenik kist): 537</div>
                <div>• Ağız mukozası/gingiva: 515</div>
                <div>• Kolesteatoma: 502</div>
                <div>• Nazofarinks/orofarinks: 441</div>
                <div>• Tükrük bezi (tümör dahil): 327</div>
                <div>• Dudak, biyopsi: 255</div>
                <div>• Dil, biyopsi: 237</div>
                <div>• Burun mukozası, biyopsi: 194</div>
                <div>• Tiroglossal/brankial kist: 85</div>
                <div>• Larinks rezeksiyon: 79</div>
              </div>
            </div>
          )}
        </div>

        {/* Endokrin Patoloji */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('endokrin')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#27AE60] w-12 h-12 flex items-center justify-center text-white">
                <FileText size={24} />
              </div>
              <h3 className="text-left">Endokrin Patoloji ve Sitoloji</h3>
            </div>
            <ChevronDown 
              size={24} 
              className={`transition-transform ${isExpanded('endokrin') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('endokrin') && (
            <div className="p-6 pt-0 border-t">
              <p className="text-muted-foreground mb-4">
                Tiroid, paratiroid, hipofiz, adrenal gland patoloji ve sitolojisi.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                <div>• Sıvı bazlı sitoloji: 15204</div>
                <div>• İnce iğne aspirasyonu: 13921</div>
                <div>• Tiroid total/lobektomi: 1953</div>
                <div>• Vücut sıvıları: 1890</div>
                <div>• Hücre bloğu: 1660</div>
                <div>• İmprint: 424</div>
                <div>• Paratiroid bezi: 399</div>
                <div>• Sıvı bazlı ince tabaka: 402</div>
                <div>• Filtre preparatı: 222</div>
                <div>• Adrenal rezeksiyon: 49</div>
                <div>• Hipofiz tümörü: 17</div>
              </div>
            </div>
          )}
        </div>

        {/* Kemik ve Yumuşak Doku */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('kemik')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#E74C3C] w-12 h-12 flex items-center justify-center text-white">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-left">Kemik ve Yumuşak Doku Patolojisi</h3>
            </div>
            <ChevronDown 
              size={24} 
              className={`transition-transform ${isExpanded('kemik') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('kemik') && (
            <div className="p-6 pt-0 border-t">
              <p className="text-muted-foreground mb-4">
                Kemik, kıkırdak, yumuşak doku, damar, sinir patolojisi.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                <div>• Yumuşak doku basit eksizyon: 1808</div>
                <div>• Yumuşak doku tümörü: 1484</div>
                <div>• Yumuşak doku, lipom: 691</div>
                <div>• Herni kesesi: 547</div>
                <div>• Kemik biyopsi/küretaj: 373</div>
                <div>• Kemik rezeksiyon: 204</div>
                <div>• Yumuşak doku debridman: 62</div>
                <div>• Ekstremite amputasyon: 60</div>
                <div>• Kas biyopsi: 59</div>
                <div>• Arter biyopsi: 37</div>
                <div>• Sinir biyopsi: 34</div>
              </div>
            </div>
          )}
        </div>

        {/* Santral Sinir Sistemi */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('cns')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#F39C12] w-12 h-12 flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>
              <h3 className="text-left">Santral Sinir Sistemi</h3>
            </div>
            <ChevronDown 
              size={24} 
              className={`transition-transform ${isExpanded('cns') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('cns') && (
            <div className="p-6 pt-0 border-t">
              <p className="text-muted-foreground mb-4">
                Beyin tümörleri, tümör dışı patolojiler ve göz patolojisi.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                <div>• Beyin meninksler, tümör: 771</div>
                <div>• Konjonktiva/pterygium: 161</div>
                <div>• Göz, enükleasyon: 57</div>
                <div>• Beyin, biyopsi: 27</div>
                <div>• Beyin meninksler (tümör dışı): 15</div>
                <div>• Göz, eksentrasyon: 8</div>
              </div>
            </div>
          )}
        </div>

        {/* Gastrointestinal Sistem */}
        <div className="bg-white mb-4">
          <button
            onClick={() => toggleSection('gis')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#8E44AD] w-12 h-12 flex items-center justify-center text-white">
                <FileText size={24} />
              </div>
              <h3 className="text-left">Gastrointestinal Sistem</h3>
            </div>
            <ChevronDown 
              size={24} 
              className={`transition-transform ${isExpanded('gis') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('gis') && (
            <div className="p-6 pt-0 border-t">
              <p className="text-muted-foreground mb-4">
                Karaciğer, safra yolları, pankreas patolojileri primer ilgi alanlarım.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                <div>• Mide, biyopsi: 3875</div>
                <div>• Safra kesesi: 2904</div>
                <div>• Karaciğer, biyopsi: 1495</div>
                <div>• Kolon, biyopsi tek: 1253</div>
                <div>• Mide, çoklu biyopsi: 1252</div>
                <div>• Duodenum, biyopsi: 1112</div>
                <div>• Polip, kolorektal: 764</div>
                <div>• Özofagus, biyopsi: 416</div>
                <div>• İnce barsak biyopsi: 410</div>
                <div>• Karaciğer, parsiyel: 304</div>
                <div>• Kolon, segmental: 272</div>
                <div>• Apendiks: 257</div>
                <div>• Pankreas, biyopsi: 142</div>
                <div>• Pankreas rezeksiyon: 133</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kariyer */}
      <div className="mb-8">
        <h2 className="mb-6">Kariyerim</h2>
        <div className="bg-white p-8">
          <p className="text-muted-foreground mb-8">Konya 1969 doğumluyum</p>
          <div className="space-y-6">
            {[
              { year: '1976-1986', title: 'İlköğretim - Lise', detail: 'Konya Merkez Gazi İlkokulu, Konya Merkez Karma Ortaokulu, Konya Merkez Fatih Teknik Lisesi Elektronik Bölümü' },
              { year: '1986-1992', title: 'Üniversite', detail: 'Ankara Üniversitesi Tıp Fakültesi' },
              { year: '1992-1995', title: 'Mecburi Hizmet - Pratisyenlik', detail: 'Tunceli Mazgirt Darıkent Sağlık Ocağı, Tunceli Mazgirt Sağlık Ocağı, Konya Beyşehir Derebucak Sağlık Ocağı' },
              { year: '1995-1996', title: 'Askerlik', detail: 'Mardin Savur Jandarma/Komando Taburu' },
              { year: '1997-2001', title: 'Uzmanlık Eğitimi', detail: 'Ege Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '2001-2003', title: 'Uzman Doktor', detail: 'Ege Ü. Tıp Fak. ve S.D.Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '2003-2013', title: 'Yardımcı Doçent Doktor', detail: 'S.D.Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '2013-2019', title: 'Doçent Doktor', detail: 'S.D.Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '11.12.2019 -', title: 'Profesör Doktor', detail: 'S.D.Ü. Tıp Fak. Tıbbi Patoloji A.D.' },
              { year: '2020-2023', title: 'Anabilim Dalı Başkanlığı', detail: 'Tıbbi Patoloji Anabilim Dalı (17.03.2020 - 16.03.2023)' },
            ].map((item, index) => (
              <div key={index} className="flex gap-6 pb-6 border-b last:border-b-0">
                <div className="flex-shrink-0">
                  <div className="bg-[#8E44AD] text-white px-4 py-2 text-center min-w-[120px]">
                    {item.year}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2">{item.title}</h4>
                  <p className="text-muted-foreground m-0">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ödüller */}
      <div className="mb-8">
        <h2 className="mb-6">Ödüller</h2>
        <div className="bg-white p-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Award className="text-[#F39C12] flex-shrink-0 mt-1" size={24} />
              <p className="text-muted-foreground m-0">
                <strong>1997:</strong> XIII. Ulusal Patoloji Kongresinde "Meme karsinomlarında C-erbB-2 ve p53'ün yeri" 
                çalışması, poster bildirisi birincilik ödülü
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Award className="text-[#F39C12] flex-shrink-0 mt-1" size={24} />
              <p className="text-muted-foreground m-0">
                <strong>2006:</strong> XIII. Ulusal Gastroentoroloji kongresinde "Sıçanlarda aspirin ile uyarılan 
                mide mukoza lezyonlarının önlenmesinde probiyotiklerin rolü", Gastritler kategorisinde birincilik ödülü
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Award className="text-[#F39C12] flex-shrink-0 mt-1" size={24} />
              <p className="text-muted-foreground m-0">
                <strong>2015:</strong> 25. Ulusal Patoloji Kongresinde İmmunhistokimyasal çalışma ile poster bildirisi üçüncülük ödülü
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Award className="text-[#F39C12] flex-shrink-0 mt-1" size={24} />
              <p className="text-muted-foreground m-0">
                <strong>2018:</strong> 28. Ulusal Patoloji Kongresinde "Meme Karsinomlarında Doku Mikroarray" 
                ile poster bildiri ikincilik ödülü
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Görevlendirmeler */}
      <div className="mb-8">
        <h2 className="mb-6">Görevlendirmeler</h2>
        <div className="bg-white p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
            <div>• SDÜ Deney Hayvanları Yerel Etik Kurulu üyeliği (2011-2018)</div>
            <div>• Dönem 3 koordinatörlük yardımcılığı ve başkanlığı (2011-2017)</div>
            <div>• Tıbbi Patoloji Laboratuvarı kalite denetimi (2011-)</div>
            <div>• Araştırma Hastanesi ihale komisyon üyeliği (2011-)</div>
            <div>• Sosyal ve Kültürel Etkinlikler Yürütme Kurulu üyeliği (2013-)</div>
            <div>• DEHATAM yönetim kurulu üyeliği (2019-2022)</div>
            <div>• Koordinatörler grubu Öz değerlendirme kurulu</div>
            <div>• MÖTEK üyeliği</div>
            <div>• Eğitim Programını Değerlendirme Kurulu üyeliği</div>
            <div>• Ölçme Değerlendirme Kurulu üyeliği</div>
          </div>
        </div>
      </div>

      {/* Yayınlar Özeti */}
      <div className="mb-8">
        <h2 className="mb-6">Yayınlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 text-center">
            <div className="bg-[#00A6D6] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <FileText size={32} />
            </div>
            <h3 className="mb-2">58+</h3>
            <p className="text-muted-foreground">Uluslararası Hakemli Dergi</p>
          </div>

          <div className="bg-white p-6 text-center">
            <div className="bg-[#27AE60] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="mb-2">28+</h3>
            <p className="text-muted-foreground">Uluslararası Konferans</p>
          </div>

          <div className="bg-white p-6 text-center">
            <div className="bg-[#E74C3C] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <FileText size={32} />
            </div>
            <h3 className="mb-2">45+</h3>
            <p className="text-muted-foreground">Ulusal Hakemli Dergi</p>
          </div>

          <div className="bg-white p-6 text-center">
            <div className="bg-[#F39C12] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="mb-2">115+</h3>
            <p className="text-muted-foreground">Ulusal Konferans</p>
          </div>
        </div>

        <div className="bg-[#E3F2FD] border-l-4 border-[#00A6D6] p-6 mt-6">
          <p className="text-muted-foreground m-0">
            <strong>Not:</strong> Güncel ve detaylı yayın listesi için üniversite web sayfamı ziyaret edebilirsiniz. 
            Tüm yayınlar Google Scholar profilimde mevcuttur.
          </p>
        </div>
      </div>

      {/* Katılım ve Kurslar */}
      <div className="mb-8">
        <div className="bg-white p-6">
          <button
            onClick={() => toggleSection('kurslar')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#16A085] w-12 h-12 flex items-center justify-center text-white">
                <GraduationCap size={24} />
              </div>
              <h2>Katılım ve Kurslar (40+)</h2>
            </div>
            <ChevronDown 
              size={24} 
              className={`transition-transform ${isExpanded('kurslar') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('kurslar') && (
            <div className="mt-6 pt-6 border-t max-h-96 overflow-y-auto">
              <div className="space-y-3 text-muted-foreground">
                <p>• XIII. Ulusal Patoloji Kongresi (1997, İstanbul)</p>
                <p>• Deri eki tümörleri kursu (1998, İzmir)</p>
                <p>• XIV. Ulusal Patoloji Kongresi (1999, Kuşadası)</p>
                <p>• Kemik ve yumuşak doku tümörleri sempozyumu (2002, Pamukkale Ü)</p>
                <p>• GEP endokrin tümörler kursu (2004, İstanbul)</p>
                <p>• Cerrahi meme patolojisi günleri (2005, İstanbul)</p>
                <p>• Tiroid sitopatolojisi kursu (2005, Hacettepe)</p>
                <p>• Nefropatoloji kursu (2005, Adana)</p>
                <p>• Karaciğer patolojisi kursu (2008, İzmir)</p>
                <p>• 36th European Congress of Cytology (2011, İstanbul)</p>
                <p>• Dermatopatoloji kursu (2012, İstanbul)</p>
                <p>• Endokrin kursu (2013, İstanbul)</p>
                <p>• Nefropatoloji kursu (2014, İzmir)</p>
                <p>• Meme kanseri patolojisi kursu (2018, İzmir)</p>
                <p>• 29. Ulusal Patoloji Kongresi (2019, Trabzon)</p>
                <p>• Baş boyun patolojisi kursu (2019, İzmir)</p>
                <p className="mt-4 italic">...ve 20+ ek kurs ve kongre katılımı</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* İletişim */}
      <div className="bg-gradient-to-r from-[#8E44AD] to-[#9B59B6] text-white p-8">
        <h2 className="text-white mb-4">İletişim</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-white mb-2">E-posta</h4>
            <a href="mailto:metinciris@sdu.edu.tr" className="text-white/90 hover:text-white hover:underline">
              metinciris@sdu.edu.tr
            </a>
          </div>
          <div>
            <h4 className="text-white mb-2">Telefon</h4>
            <p className="text-white/90 m-0">
              Dahili: 3660<br />
              Santral: +90 246 211 38 38
            </p>
          </div>
          <div>
            <h4 className="text-white mb-2">Adres</h4>
            <p className="text-white/90 m-0">
              SDÜ Tıp Fakültesi<br />
              Tıbbi Patoloji A.D.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
