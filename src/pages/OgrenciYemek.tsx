import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Utensils, Star, ExternalLink, Calendar } from 'lucide-react';

export function OgrenciYemek() {
  const [rating, setRating] = React.useState(0);
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);

  // Bugünün tarihi
  const today = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Önümüzdeki 3 günün menüsü
  const menuData = [
    {
      date: '10.11.2025',
      meal: 'ANDOLÜZ ÇORBASI, ZEYTİNYAĞLI BARBUNYA, ERİŞTE GÜVEÇ, KASE YOĞURT'
    },
    {
      date: '11.11.2025',
      meal: 'KREMALI MANTAR ÇORBASI, PİLAV ÜSTÜ ET DÖNER, MEVSİM SALATASI, KASE AYRAN'
    },
    {
      date: '12.11.2025',
      meal: 'EZOGELİN ÇORBASI, BAGET HAŞLAMA, MEYANE PİLAVI, MUZ'
    }
  ];

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Lütfen bir değerlendirme yapınız!');
      return;
    }

    // Google Form submission
    const formData = new FormData();
    formData.append('entry.1343444217', rating.toString());
    formData.append('fvv', '1');
    formData.append('fbzx', '-2805009038610543922');
    formData.append('pageHistory', '0');

    fetch('https://docs.google.com/forms/d/e/1FAIpQLSfL-I-5b71SCeMsBnmrZhB0EBS8J3rIEPfkay3Cm4rLBkDBCg/formResponse', {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    }).then(() => {
      setSubmitted(true);
    }).catch(() => {
      setSubmitted(true);
    });
  };

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#16A085] to-[#27AE60] text-white p-12 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 p-4 rounded-lg">
            <Utensils size={48} />
          </div>
          <div>
            <h1 className="text-white mb-2">Yemek Menüsü</h1>
            <p className="text-white/90">SDÜ Hastane ve Öğrenci Yemekhanesi</p>
          </div>
        </div>
      </div>

      {/* Bilgilendirme */}
      <div className="bg-[#E8F5E9] border-l-4 border-[#27AE60] p-6 mb-8">
        <p className="text-muted-foreground m-0">
          <strong>İyi günler!</strong> Önümüzdeki üç günün menüsü aşağıda yer almaktadır.
        </p>
      </div>

      {/* Menü Tablosu */}
      <div className="mb-8">
        <div className="bg-white p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#16A085] w-12 h-12 flex items-center justify-center text-white">
              <Calendar size={24} />
            </div>
            <h2>Haftalık Menü</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F5F5F5]">
                  <th className="p-4 text-left border border-[#DDD]">Tarih</th>
                  <th className="p-4 text-left border border-[#DDD]">Öğle Yemeği</th>
                </tr>
              </thead>
              <tbody>
                {menuData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9F9F9]'}>
                    <td className="p-4 border border-[#DDD]">
                      <div className="flex items-center gap-2">
                        <div className="bg-[#DC143C] text-white px-3 py-1 text-sm">
                          {item.date}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border border-[#DDD] text-muted-foreground">
                      {item.meal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid Layout: Değerlendirme ve Askıda Yemek */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Değerlendirme Formu */}
        <div className="bg-white p-8">
          <h2 className="mb-6">Yemek Değerlendirmesi</h2>
          <p className="text-muted-foreground mb-6">
            Yemek hizmetimizi değerlendirin:
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStarClick(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="text-5xl transition-all hover:scale-110"
                  disabled={submitted}
                  aria-label={`${value} yıldız`}
                >
                  <Star
                    size={48}
                    fill={(hoveredRating || rating) >= value ? '#FFD700' : 'transparent'}
                    stroke={(hoveredRating || rating) >= value ? '#FFD700' : '#ccc'}
                  />
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitted || rating === 0}
              className={`px-6 py-3 text-white transition-colors ${
                submitted
                  ? 'bg-gray-400 cursor-not-allowed'
                  : rating === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-[#27AE60] hover:bg-[#229954]'
              }`}
            >
              {submitted ? 'Gönderildi, sayfayı yenileyin' : 'Değerlendirmeyi Gönder'}
            </button>

            {rating > 0 && !submitted && (
              <p className="text-muted-foreground mt-4">
                Seçiminiz: {rating} yıldız
              </p>
            )}

            {submitted && (
              <div className="bg-[#E8F5E9] border-l-4 border-[#27AE60] p-4 mt-4">
                <p className="text-[#27AE60] m-0">
                  ✓ Değerlendirmeniz kaydedildi. Teşekkür ederiz!
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Askıda Yemek */}
        <div className="bg-gradient-to-br from-[#E74C3C] to-[#C0392B] text-white p-8">
          <h2 className="text-white mb-4">Askıda Yemek</h2>
          <p className="text-white/90 mb-6">
            Öğrenci arkadaşlarınıza destek olmak ister misiniz? Askıda yemek kampanyamıza katılabilirsiniz.
          </p>
          <a
            href="https://askidayemek.sdu.edu.tr/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#E74C3C] px-6 py-3 hover:bg-gray-100 transition-colors"
          >
            <span>Askıda Yemek Sistemi</span>
            <ExternalLink size={20} />
          </a>
        </div>
      </div>

      {/* Geçmiş Değerlendirmeler Tablosu */}
      <div className="bg-white p-8 mb-8">
        <h2 className="mb-6">Geçmiş Değerlendirmeler</h2>
        <p className="text-muted-foreground mb-6">
          Öğrenci ve personel değerlendirmeleri:
        </p>
        
        <div className="bg-[#F5F5F5] p-6 rounded-lg">
          <iframe
            src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRhXvxQs7kGLsO9W5OQgzKg8fYKZf8g6VQvxrWXFRO0LX9tJCDmQ1J7FjYhzGXlRKKg6HE4sZQJzTvM/pubhtml?gid=960343346&single=true&widget=true&headers=false"
            style={{ width: '100%', height: '600px', border: 'none' }}
            title="Yemek Değerlendirmeleri"
          />
        </div>
        
        <p className="text-muted-foreground text-sm mt-4">
          * Tablo Google Sheets'ten otomatik olarak güncellenmektedir.
        </p>
      </div>

      {/* Yemek Saatleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 text-center">
          <div className="bg-[#F39C12] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <Utensils size={32} />
          </div>
          <h3 className="mb-2">Kahvaltı</h3>
          <p className="text-muted-foreground">07:30 - 09:00</p>
        </div>
        <div className="bg-white p-6 text-center">
          <div className="bg-[#E74C3C] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <Utensils size={32} />
          </div>
          <h3 className="mb-2">Öğle Yemeği</h3>
          <p className="text-muted-foreground">11:30 - 13:30</p>
        </div>
        <div className="bg-white p-6 text-center">
          <div className="bg-[#8E44AD] w-16 h-16 flex items-center justify-center text-white mx-auto mb-4">
            <Utensils size={32} />
          </div>
          <h3 className="mb-2">Akşam Yemeği</h3>
          <p className="text-muted-foreground">17:30 - 19:00</p>
        </div>
      </div>

      {/* İletişim Bilgisi */}
      <div className="bg-[#FFF3E0] border-l-4 border-[#FF8C00] p-6">
        <h3 className="mb-3">Yemek Hizmeti Hakkında</h3>
        <p className="text-muted-foreground mb-2">
          Yemek hizmeti ile ilgili öneri ve şikayetleriniz için:
        </p>
        <p className="text-muted-foreground m-0">
          <strong>SDÜ Sağlık Kültür Spor Daire Başkanlığı</strong><br />
          Telefon: +90 246 211 10 00 / 1234<br />
          E-posta: sksdb@sdu.edu.tr
        </p>
      </div>
    </PageContainer>
  );
}
