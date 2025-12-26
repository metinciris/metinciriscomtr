import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { FileText, ExternalLink, Search, BookOpen, Award, ChevronDown, TrendingUp, Users, Presentation } from 'lucide-react';
import { Input } from '../components/ui/input';

export function Yayinlar() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [expandedSections, setExpandedSections] = React.useState<string[]>(['sci']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  // Bilimsel Katılımlar
  const scientificParticipations = [
    'XIII. Ulusal Patoloji Kongresi, 4-8 Eylül 1997, İstanbul',
    'Deri eki tümörleri kursu, 2 Mayıs 1998, İzmir',
    'Jinekolojik onkoloji patoloji kursu, 6. Ulusal Jinekolojik Onkoloji Kongresi bünyesinde, 12 Ekim 1998, Antalya',
    'XIV. Ulusal Patoloji Kongresi, 11-17 Nisan 1999, Kuşadası',
    'Endometrial biyopsi ve küretaj materyallerinin değerlendirilmesi kursu, XIV. Ulusal Patoloji Kongresi bünyesinde, 11-17 Nisan 1999, Kuşadası',
    'Akciğer tümörleri kursu, XIV. Ulusal Patoloji Kongresi bünyesinde, 11-17 Nisan 1999, Kuşadası',
    'Isparta sosyal ve bilimsel etkinlik günleri, 22-25 Haziran 2000, Isparta',
    'Kemik ve yumuşak doku tümörleri sempozyumu, 15-19 Ekim 2002, Pamukkale Ü',
    'XVI. Ulusal Patoloji Kongresi, 29-31 Mayıs 2003, Ankara Patoloji Derneği',
    'Gastroenteropankreatik GEP endokrin tümörler kursu, 20 Mart 2004, Marmara Oteli, İstanbul',
    'Basics and applications of molecular pathology kursu, 21 Mart 2004, Marmara Oteli, İstanbul',
    'Uluslararası katılımlı karaciğer sempozyumu, 21-22 Nisan 2004, Isparta',
    '17. Ulusal Patoloji Sempozyumu, 3-6 Ekim 2004, Gaziantep',
    'VI. stereolojik metotlar ve uygulamaları kursu, 11-14 Ekim 2004, Isparta',
    'Cerrahi meme patolojisi günleri, 16-17 Nisan 2005, İstanbul',
    'Over tümörleri kursu, 14-15 Mayıs 2005, İzmir',
    'Tiroid sitopatolojisi kursu, 19-20 Kasım 2005, Hacettepe, Ankara',
    'Nefropatoloji kursu, 22-23 Kasım 2005, Adana',
    'Akciğerlerin patolojik incelenmesinde potansiyel güçlükler ve nadir görülen akciğer lezyonları kursu, 3-4 Haziran 2006, Çukurova Üniversitesi, Adana',
    'Patolojide yenilikler ve ayırıcı tanı kursu, 17-18 Mart 2007, Hacettepe Ankara',
    '9. Ulusal meme hastalıkları kongresi, 5-9 Eylül 2007, Ankara',
    'Patoloji kursu, 9. Ulusal meme hastalıkları kongresi kapsamında, 5-9 Eylül 2007, Ankara',
    'Gastrointestinal ve hepatobiliyer sistem patolojileri kursu, 2-3 Kasım 2007, Sivas',
    'Karaciğer patolojisi kursu, 23-24 Mayıs 2008, Ege Patoloji Derneği İzmir',
    '18. Ulusal Patoloji Kongresi, 25-29 Ekim 2008, Antalya',
    'IV. Ulusal Sitopatoloji Kongresi, 26-29 Mart 2009, Hacettepe Ankara',
    'Probleme dayalı öğrenim kursu, 13-15 Nisan 2009, Isparta',
    'Yüksek dereceli glial tümörler kursu, 7 Kasım 2009, Acıbadem Ü, İstanbul',
    'Patolojide yenilikler ve ayırıcı tanı kursu, 3-4 Nisan 2010, Hacettepe Ankara',
    'Kemik iliği kursu, 9-11 Nisan 2011, Çeşme',
    'Hepatobiliyer sistem patolojisi kursu, 7 Haziran 2010, Marmara Ü, İstanbul',
    '20. Ulusal Patoloji Kongresi, 29 Eylül - 3 Kasım 2010, Eskişehir',
    'Baş boyun patolojisi kursu, 20. Ulusal Patoloji Kongresi kapsamında, 29 Eylül - 3 Kasım 2010, Eskişehir',
    'Olgularla baş boyun patolojisi kursu, 1 Nisan 2011, Ankara',
    'Patolojide yenilikler ve ayırıcı tanı kursu, 2-3 Nisan 2011',
    '36. Avrupa sitoloji kongresi. 36th European Congress of Cytology, 22-25 Eylül 2011, İstanbul',
    'Pediatrik ve perinatal patoloji kursu, 16 Kasım 2011, İzmir',
    '21. Ulusal Patoloji Kongresi, 16-20 Kasım 2011, İzmir',
    'Mediasten patolojisi kursu, 14 Ocak 2012, Adana',
    'Dermatopatoloji kursu, 14 Nisan 2012, İstanbul',
    'IX. Deney hayvanları kullanımı eğitim programı katılımı, 21 Eylül 2012',
    '22. Ulusal Patoloji Kursu, 7-11 Kasım 2012, Antalya',
    'Endokrin kursu, 23 Haziran 2013, İstanbul',
    'Surgical pathology: Current concepts meeting, 13-14 Nisan 2013, Adana',
    'Deney hayvanları kullanım sertifikası, sertifika no: 2013/029. 16-23 Kasım 2013, Isparta',
    'Jinekopatoloji kursu, 7 Aralık 2013, Ege Patoloji Derneği, İzmir',
    '7. Ultrasonografi eşliğinde uygulamalı karaciğer biyopsi kursu katkısı, 12 Nisan 2013, Isparta',
    'First international medical students congress presentation and participation, 3-5 Mayıs 2013, Isparta',
    'Nefropatoloji kursu, 27-28 Eylül 2014, Ege Patoloji Derneği, İzmir',
    'Tıp eğitiminde ölçme değerlendirme kursu, 15-16 Nisan 2014, Isparta',
    '26. Ulusal Patoloji ve 7. Ulusal Sitopatoloji Kongresi, 2-6 Kasım 2016, Antalya',
    'Eğitim becerileri kursu, 15-18 Şubat 2017, Isparta',
    'Tıp eğitiminde ölçme ve değerlendirme kursu katkısı, belge no: 24/11/2017/230. 23-24 Kasım 2017, Isparta',
    '28. Ulusal Patoloji Kongresi, 27-30 Ekim 2018, Ankara',
    '4. Multidisipliner baş boyun kanserleri kongresi konuşmacı katılımı, 8-11 Mart 2018, Antalya',
    'Meme kanseri patolojisi kursu, 21 Nisan 2018, Ege Patoloji Derneği, İzmir',
    'Renal transplant patolojisi kursu, 28. Ulusal Patoloji Kongresi kapsamında, 30 Ekim 2018, Ankara',
    'Uygulamalı mikroskop çalıştayı katkısı, 13-15 Mart 2019, Isparta',
    'Solunum zirvesi, baş boyun tümörlerinde sıradışı olgular sunumu, 13-15 Haziran 2019, Isparta',
    '29. Ulusal Patoloji Kongresi, 23-26 Ekim 2019, Trabzon',
    '2025–2026 Global Cytology Educational Programı, American Society of Cytopathology (ASC) tarafından akredite edilmiş sürekli tıp eğitimi sertifikası. 12/09/2025'
  ];

  // SCI-Expanded Makaleler (güncellenmiş liste)
  const sciPublications = [
    {
      code: 'A1',
      year: 2000,
      authors: 'O.Zekioğlu, Y.Erhan, N.Özdemir, M.Çiriş, Y.Erhan',
      title: 'Adenoid cystic carcinoma of the breast: a case report and clues for its differential diagnosis',
      journal: 'Journal of BUON',
      pages: '457-460',
      index: 'ISI'
    },
    {
      code: 'A2',
      year: 2001,
      authors: 'S.Arslanoglu, M.Yalaz, D.Gökşen, M.Coker, S.Tütüncüoglu, M.Akisu, S.Darcan, N.Kultursay, M.Ciriş, E.Demirtaş',
      title: 'Molybdenum cofactor deficiency associated with Dandy–Walker complex',
      journal: 'Brain and Development',
      pages: '815-818',
      doi: '10.1016/S0387-7604(01)00316-3',
      index: 'ISI'
    },
    {
      code: 'A3',
      year: 2002,
      authors: 'H.Bayramoglu, O.Zekioglu, Y.Erhan, M.Ciriş, N.Ozdemir',
      title: 'Fine-needle aspiration biopsy of invasive micropapillary carcinoma of the breast: a report of five cases',
      journal: 'Diagnostic Cytopathology',
      pages: '214-217',
      doi: '10.1002/dc.10176',
      index: 'ISI'
    },
    {
      code: 'A4',
      year: 2002,
      authors: 'Y.Erhan, N.Ozdemir, O.Zekioglu, D.Nart, M.Ciris',
      title: 'Breast carcinomas with choriocarcinomatous features: case reports and review of the literature',
      journal: 'The Breast Journal',
      pages: '244-248',
      doi: '10.1046/j.1524-4741.2002.08411.x',
      index: 'ISI'
    },
    {
      code: 'A58',
      year: 2019,
      authors: 'Ibrahim Metin Çiriş, Gamze Erkılınc, Kemal Kursat Bozkurt, Nermin Karahan, Hasan Yasan, Mehmet Emre Sivrice',
      title: 'Cartilaginous choristomas in tonsillectomy specimen: A prospective analysis',
      journal: 'International Journal of Pediatric Otorhinolaryngology',
      volume: '122',
      pages: '191-195',
      doi: '10.1016/j.ijporl.2019.04.020',
      quartile: 'Q3'
    },
    {
      year: 2024,
      authors: 'Altuntaş Selman Hakkı, Uslusoy Fuat, Aydın Mustafa Asım, et al., ÇİRİŞ İbrahim Metin',
      title: 'Investigation into a new denervation model of the sciatic nerve zones in rats: Selective motor or sensorial denervation',
      journal: 'Acta Orthopaedica et Traumatologica Turcica',
      volume: '58(1)',
      pages: '10-19',
      doi: '10.5152/j.aott.2024.22125',
      quartile: 'Q4'
    },
    {
      year: 2024,
      authors: 'İskender Muhsin Fırat, Çına Müge, Çamlı Şevket Tolga, ÇİRİŞ İbrahim Metin, et al.',
      title: 'Evaluation of the Effects of Locally Applied Resveratrol and Cigarette Smoking on Bone Healing',
      journal: 'APPL SCI-BASEL',
      volume: '14(15)',
      doi: '10.3390/app14156411',
      quartile: 'Q1'
    },
    {
      year: 2023,
      authors: 'DURAK ÖZLEM, BOZKURT KEMAL KÜRŞAT, ÇİRİŞ İBRAHİM METİN, et al.',
      title: 'Programmed cell death 1 and programmed cell death ligand 1 expression in invasive breast carcinoma',
      journal: 'Informa UK Limited',
      volume: '98(2)',
      pages: '147-154',
      doi: '10.1080/10520295.2022.2137586',
      quartile: 'Q4'
    },
    {
      year: 2022,
      authors: 'Sengun Sevinç, Korkmaz Hakan, Boyluboy Serife Mehtap, ÇİRİŞ İbrahim Metin, et al.',
      title: 'Diagnostic and prognostic value of Stanniocalcin 1 expression in papillary thyroid cancer',
      journal: 'Endocrine',
      volume: '78(1)',
      pages: '95-103',
      doi: '10.1007/s12020-022-03126-4',
      quartile: 'Q3'
    },
    {
      year: 2022,
      authors: 'Pekgöz Sakir, Asci Halil, SAVRAN Mehtap, et al., ÇİRİŞ İbrahim Metin',
      title: 'Nebivolol alleviates liver damage caused by methotrexate via AKT1/Hif1α/eNOS signaling',
      journal: 'Drug and Chemical Toxicology',
      volume: '45(5)',
      pages: '2153-2159',
      doi: '10.1080/01480545.2021.1908759',
      quartile: 'Q3'
    },
    {
      year: 2021,
      authors: 'Yasan Hasan, Kumbul Yusuf Cagdas, ÇİRİŞ İbrahim Metin, et al.',
      title: 'The Importance of Prostate-Specific Membrane Antigen Expression in Carotid Body Paragangliomas',
      journal: 'TURKISH ARCHIVES OF OTORHINOLARYNGOLOGY',
      pages: '203-209',
      doi: '10.4274/tao.2021.2021-3-17'
    },
    {
      year: 2021,
      authors: 'Erdoğan M, Korkmaz H, Torus B, et al., ÇİRİŞ İbrahim Metin',
      title: 'The Role of Metabolic Volumetric Parameters in Predicting Malignancy in Incidental Thyroid Nodules',
      journal: 'Molecular imaging and radionuclide therapy',
      volume: '30(2)',
      pages: '86-92',
      doi: '10.4274/mirt.galenos.2021.75983',
      quartile: 'Q3'
    },
    {
      year: 2020,
      authors: 'Topal Olgun, Çina Aksoy Müge, ÇİRİŞ İbrahim Metin, et al.',
      title: 'Assessment of the effect of pulsed electromagnetic field application on bone healing',
      journal: 'ELECTROMAGNETIC BIOLOGY AND MEDICINE',
      volume: '39(3)',
      pages: '206-217',
      doi: '10.1080/15368378.2020.1762636',
      quartile: 'Q2'
    },
    {
      year: 2019,
      authors: 'ÇİRİŞ İBRAHİM METİN, SİVRİCE MEHMET EMRE, ERKILINÇ GAMZE, et al.',
      title: 'Cartilaginous choristomas in tonsillectomy specimen: A prospective analysis',
      journal: 'INTERNATIONAL JOURNAL OF PEDIATRIC OTORHINOLARYNGOLOGY',
      pages: '191-195',
      doi: '10.1016/j.ijporl.2019.04.020',
      quartile: 'Q3'
    },
    {
      year: 2018,
      authors: 'BAŞAL ÖZGÜR, ATAY TOLGA, ÇİRİŞ İBRAHİM METİN, BAYKAL YAKUP BARBAROS',
      title: 'Epidermal growth factor (EGF) promotes bone healing in surgically induced osteonecrosis',
      journal: 'Bosnian Journal of Basic Medical Sciences',
      volume: '18(4)',
      pages: '352-360'
    }
  ];

  // Ulusal Hakemli Dergiler (genişletilmiş)
  const nationalPublications = [
    {
      year: 2024,
      authors: 'KAYA ONUR, AKÇAM FÜSUN ZEYNEP, SÖNMEZ YONCA, et al., ÇİRİŞ İBRAHİM METİN',
      title: 'Evaluation of Non-invasive Methods for Prediction of Fibrosis in Chronic Hepatitis B and C Infections',
      journal: 'VIRAL HEPATIT DERGISI-VIRAL HEPATITIS JOURNAL',
      index: 'TR DİZİN'
    },
    {
      year: 2023,
      authors: 'OĞUZOĞLU ALİ SERDAR, ŞENOL NİLGÜN, YASAN HASAN, et al., ÇİRİŞ İBRAHİM METİN',
      title: 'PROSTAT-SPESİFİK MEMBRAN ANTİGEN MENENGİOM TEDAVİSİNDE YER ALABİLİR Mİ?',
      journal: 'Süleyman Demirel Üniversitesi Tıp Fakültesi Dergisi',
      volume: '30(3)',
      pages: '302-307',
      doi: '10.17343/sdutfd.1209482',
      index: 'TR DİZİN'
    },
    {
      year: 2022,
      authors: 'OĞUZOĞLU ALİ SERDAR, ŞENOL NİLGÜN, YASAN HASAN, et al., ÇİRİŞ İBRAHİM METİN',
      title: 'GLİAL TÜMÖR TEDAVİSİNDE TAMAMLAYICI HEDEF TEDAVİ: PROSTAT SPESİFİK MEMBRAN ANTİJEN (PSMA)',
      journal: 'Süleyman Demirel Üniversitesi Tıp Fakültesi Dergisi',
      volume: '29(1)',
      doi: '10.17343/sdutfd.1066328',
      index: 'TR DİZİN'
    },
    {
      year: 2019,
      authors: 'KORKMAZ SELMA, ERTURAN İJLAL, FİLİZ BAŞAK, et al., ÇİRİŞ İBRAHİM METİN',
      title: 'Idiopathic palmoplantar filiform hyperkeratosis succesfully treated with systemic isotretinoin',
      journal: 'Türkderm-Deri Hastalıkları ve Frengi Arşivi',
      volume: '53(3)',
      pages: '119-121',
      doi: '10.4274/turkderm.galenos.2018.34466',
      index: 'TR DİZİN'
    },
    {
      year: 2019,
      authors: 'ERKILINÇ GAMZE, ÇİRİŞ İBRAHİM METİN, KARAHAN NERMİN, DURAK ÖZLEM',
      title: 'TİROİDİN PRİMER MALİGN TERATOMU: OLGU SUNUMU',
      journal: 'SDÜ Tıp Fakültesi Dergisi',
      volume: '26(3)',
      pages: '344-347',
      doi: '10.17343/sdutfd.453896',
      index: 'TR DİZİN'
    }
  ];

  // Kitaplar
  const books = [
    {
      year: 2021,
      authors: 'ÇİRİŞ İbrahim Metin, YÜCEER Ramazan Oğuz',
      title: 'METASTATİK OMURGA TÜMÖRLERİNİN YÖNETİMİ / MANAGEMENT OF METASTATIC SPINE TUMORS',
      publisher: 'Türkiye Klinikleri',
      type: 'Bölüm',
      category: 'ULUSAL'
    }
  ];

  const allPublications = [
    ...sciPublications.map(p => ({ ...p, category: 'SCI' })),
    ...nationalPublications.map(p => ({ ...p, category: 'Ulusal' }))
  ];

  const filteredPublications = allPublications.filter(pub =>
    pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.journal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#DC143C] to-[#A52A2A] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Akademik Yayınlar</h1>
        <p className="text-white/90">
          Tıbbi Patoloji alanında yayımlanmış bilimsel çalışmalar
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 text-center">
          <div className="bg-[#00A6D6] w-16 h-16 flex items-center justify-center text-white mx-auto mb-3">
            <TrendingUp size={32} />
          </div>
          <h3 className="mb-2">H-Index</h3>
          <p className="text-muted-foreground">24</p>
        </div>
        <div className="bg-white p-6 text-center">
          <div className="bg-[#27AE60] w-16 h-16 flex items-center justify-center text-white mx-auto mb-3">
            <FileText size={32} />
          </div>
          <h3 className="mb-2">Atıf</h3>
          <p className="text-muted-foreground">2050+</p>
        </div>
        <div className="bg-white p-6 text-center">
          <div className="bg-[#E74C3C] w-16 h-16 flex items-center justify-center text-white mx-auto mb-3">
            <BookOpen size={32} />
          </div>
          <h3 className="mb-2">SCI/SSCI</h3>
          <p className="text-muted-foreground">58+</p>
        </div>
        <div className="bg-white p-6 text-center">
          <div className="bg-[#F39C12] w-16 h-16 flex items-center justify-center text-white mx-auto mb-3">
            <FileText size={32} />
          </div>
          <h3 className="mb-2">Ulusal</h3>
          <p className="text-muted-foreground">45+</p>
        </div>
        <div className="bg-white p-6 text-center">
          <div className="bg-[#8E44AD] w-16 h-16 flex items-center justify-center text-white mx-auto mb-3">
            <Award size={32} />
          </div>
          <h3 className="mb-2">Kongre</h3>
          <p className="text-muted-foreground">143+</p>
        </div>
      </div>

      {/* Arama */}
      <div className="bg-white p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="Yayınlarda ara (başlık, yazar, dergi)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bilimsel Katılımlar */}
      <div className="mb-8">
        <div className="bg-white">
          <button
            onClick={() => toggleSection('katilim')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#9B59B6] w-12 h-12 flex items-center justify-center text-white">
                <Users size={24} />
              </div>
              <h2 className="text-left">Bilimsel Katılımlar ({scientificParticipations.length})</h2>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('katilim') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('katilim') && (
            <div className="p-6 pt-0 border-t">
              <div className="space-y-3">
                {scientificParticipations.map((participation, index) => (
                  <div key={index} className="border-l-4 border-[#9B59B6] pl-4 py-2 hover:bg-gray-50 transition-colors">
                    <p className="text-muted-foreground m-0">{participation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SCI-Expanded Makaleler */}
      <div className="mb-8">
        <div className="bg-white">
          <button
            onClick={() => toggleSection('sci')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#00A6D6] w-12 h-12 flex items-center justify-center text-white">
                <FileText size={24} />
              </div>
              <h2 className="text-left">Uluslararası Hakemli Dergilerde Yayımlanan Makaleler ({sciPublications.length})</h2>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('sci') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('sci') && (
            <div className="p-6 pt-0 border-t">
              <div className="space-y-6">
                {(searchTerm ? filteredPublications.filter(p => p.category === 'SCI') : sciPublications).map((pub, index) => (
                  <div key={index} className="border-l-4 border-[#00A6D6] pl-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-[#DC143C] text-white px-3 py-1 flex-shrink-0">
                        {pub.year}
                      </div>
                      {pub.quartile && (
                        <div className={`px-3 py-1 flex-shrink-0 ${pub.quartile === 'Q1' ? 'bg-[#27AE60] text-white' :
                            pub.quartile === 'Q2' ? 'bg-[#00A6D6] text-white' :
                              pub.quartile === 'Q3' ? 'bg-[#F39C12] text-white' :
                                'bg-[#E74C3C] text-white'
                          }`}>
                          {pub.quartile}
                        </div>
                      )}
                      {pub.code && (
                        <div className="bg-[#555] text-white px-3 py-1 flex-shrink-0 text-sm">
                          {pub.code}
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{pub.authors}</p>
                    <h4 className="mb-2">{pub.title}</h4>
                    <p className="text-muted-foreground mb-2">
                      <em>{pub.journal}</em>{pub.volume && `, ${pub.volume}`}{pub.pages && `, ${pub.pages}`}
                    </p>
                    {pub.doi && (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#00A6D6] hover:underline"
                      >
                        DOI: {pub.doi} <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ulusal Hakemli Dergiler */}
      <div className="mb-8">
        <div className="bg-white">
          <button
            onClick={() => toggleSection('ulusal')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#27AE60] w-12 h-12 flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>
              <h2 className="text-left">Ulusal Hakemli Dergilerde Yayımlanan Makaleler ({nationalPublications.length})</h2>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('ulusal') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('ulusal') && (
            <div className="p-6 pt-0 border-t">
              <div className="space-y-6">
                {(searchTerm ? filteredPublications.filter(p => p.category === 'Ulusal') : nationalPublications).map((pub, index) => (
                  <div key={index} className="border-l-4 border-[#27AE60] pl-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-[#DC143C] text-white px-3 py-1">
                        {pub.year}
                      </div>
                      {pub.index && (
                        <div className="bg-[#8E44AD] text-white px-3 py-1">
                          {pub.index}
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{pub.authors}</p>
                    <h4 className="mb-2">{pub.title}</h4>
                    <p className="text-muted-foreground mb-2">
                      <em>{pub.journal}</em>{pub.volume && `, ${pub.volume}`}{pub.pages && `, ${pub.pages}`}
                    </p>
                    {pub.doi && (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#00A6D6] hover:underline"
                      >
                        DOI: {pub.doi} <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kitaplar */}
      <div className="mb-8">
        <div className="bg-white">
          <button
            onClick={() => toggleSection('kitap')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#8E44AD] w-12 h-12 flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>
              <h2 className="text-left">Kitaplar ({books.length})</h2>
            </div>
            <ChevronDown
              size={24}
              className={`transition-transform ${isExpanded('kitap') ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded('kitap') && (
            <div className="p-6 pt-0 border-t">
              <div className="space-y-6">
                {books.map((book, index) => (
                  <div key={index} className="border-l-4 border-[#8E44AD] pl-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-[#DC143C] text-white px-3 py-1">
                        {book.year}
                      </div>
                      <div className="bg-[#00A6D6] text-white px-3 py-1">
                        {book.type}
                      </div>
                      <div className="bg-[#F39C12] text-white px-3 py-1">
                        {book.category}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-2">{book.authors}</p>
                    <h4 className="mb-2">{book.title}</h4>
                    <p className="text-muted-foreground">{book.publisher}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* İlgi Alanları */}
      <div className="mb-8">
        <h2 className="mb-6">Araştırma İlgi Alanları</h2>
        <div className="bg-white p-8">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-[#DC143C] mt-1">•</span>
              <span>Nefropatoloji</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC143C] mt-1">•</span>
              <span>Tiroid ve paratiroid patolojisi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC143C] mt-1">•</span>
              <span>Baş-boyun patolojisi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC143C] mt-1">•</span>
              <span>Hepatobiliyer sistem hastalıkları patolojisi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC143C] mt-1">•</span>
              <span>Pankreas patolojisi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC143C] mt-1">•</span>
              <span>Santral sinir sistemi patolojisi</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#DC143C] mt-1">•</span>
              <span>Kemik ve yumuşak doku patolojisi</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Akademik Bağlantılar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-[#00A6D6] to-[#0078D4] text-white p-8">
          <h3 className="text-white mb-4">Akademik Profiller</h3>
          <div className="space-y-3">
            <a
              href="https://orcid.org/0000-0002-5619-4989"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/90 hover:text-white hover:underline"
            >
              <ExternalLink size={16} />
              ORCID ID: 0000-0002-5619-4989
            </a>
            <a
              href="https://scholar.google.com.tr/citations?user=zEF_KLsAAAAJ&hl=tr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/90 hover:text-white hover:underline"
            >
              <ExternalLink size={16} />
              Google Scholar
            </a>
            <a
              href="https://www.researchgate.net/profile/Metin-Ciris-2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/90 hover:text-white hover:underline"
            >
              <ExternalLink size={16} />
              ResearchGate
            </a>
            <a
              href="https://www.scopus.com/authid/detail.uri?authorId=6603213356"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/90 hover:text-white hover:underline"
            >
              <ExternalLink size={16} />
              Scopus Author ID
            </a>
          </div>
        </div>

        <div className="bg-white p-8">
          <h3 className="mb-4">İletişim</h3>
          <p className="text-muted-foreground mb-4">
            Araştırma işbirlikleri ve akademik danışmanlık için:
          </p>
          <div className="space-y-2 text-muted-foreground">
            <p className="m-0">
              <strong>E-posta:</strong>{' '}
              <a href="mailto:ibrahimciris@sdu.edu.tr" className="text-[#00A6D6] hover:underline">
                ibrahimciris@sdu.edu.tr
              </a>
            </p>
            <p className="m-0"><strong>Dahili:</strong> 9292</p>
            <p className="m-0"><strong>Santral:</strong> +90 246 211 9292</p>
          </div>
        </div>
      </div>

      {/* Bilgilendirme */}
      <div className="bg-[#E3F2FD] border-l-4 border-[#00A6D6] p-6">
        <h3 className="mb-3">Güncel Yayınlar</h3>
        <p className="text-muted-foreground m-0">
          Tüm yayınların güncel listesi için lütfen{' '}
          <a
            href="https://w3.sdu.edu.tr/personel/02956/ibrahim-metin-ciris"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00A6D6] hover:underline"
          >
            SDÜ Akademik Personel Sayfası
          </a>
          {' '}ve{' '}
          <a
            href="https://scholar.google.com.tr/citations?user=zEF_KLsAAAAJ&hl=tr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00A6D6] hover:underline"
          >
            Google Scholar
          </a>
          {' '}profilini ziyaret edebilirsiniz.
        </p>
      </div>
    </PageContainer>
  );
}
