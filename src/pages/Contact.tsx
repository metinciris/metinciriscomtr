import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Mail, Phone, MapPin, Send, Github, Linkedin, Twitter, MessageSquare } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner@2.0.3';

export function Contact() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Simulate form submission
    toast.success('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağım.');
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
  };

  const contactInfo = [
    {
      icon: <Mail size={24} />,
      title: 'E-posta',
      value: 'info@metinciris.com.tr',
      link: 'mailto:info@metinciris.com.tr',
      color: 'bg-[#0078D4]',
    },
    {
      icon: <Phone size={24} />,
      title: 'Telefon',
      value: '+90 (XXX) XXX XX XX',
      link: 'tel:+90XXXXXXXXXX',
      color: 'bg-[#27AE60]',
    },
    {
      icon: <MapPin size={24} />,
      title: 'Konum',
      value: 'İstanbul, Türkiye',
      color: 'bg-[#E74C3C]',
    },
    {
      icon: <MessageSquare size={24} />,
      title: 'Sosyal Medya',
      value: 'Sosyal platformlar',
      color: 'bg-[#8E44AD]',
    },
  ];

  const socialLinks = [
    {
      name: 'GitHub',
      icon: <Github size={32} />,
      url: 'https://github.com',
      color: 'bg-[#2C3E50]',
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin size={32} />,
      url: 'https://linkedin.com',
      color: 'bg-[#0077B5]',
    },
    {
      name: 'Twitter',
      icon: <Twitter size={32} />,
      url: 'https://twitter.com',
      color: 'bg-[#1DA1F2]',
    },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#F39C12] to-[#E67E22] text-white p-12 mb-8">
        <h1 className="text-white mb-4">İletişim</h1>
        <p className="text-white/90 max-w-3xl">
          Projeleriniz, iş birliği fırsatları veya sorularınız için benimle iletişime geçebilirsiniz.
          Size en kısa sürede dönüş yapacağım.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Contact Info */}
        <div className="lg:col-span-1">
          <h2 className="mb-6">İletişim Bilgileri</h2>
          <div className="space-y-4 mb-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white p-6 hover:shadow-lg transition-shadow">
                <div className={`${info.color} w-12 h-12 flex items-center justify-center text-white mb-4`}>
                  {info.icon}
                </div>
                <h4 className="mb-2">{info.title}</h4>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-muted-foreground hover:text-[#0078D4] transition-colors"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-muted-foreground m-0">{info.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Social Links */}
          <div className="bg-[#2C3E50] text-white p-6">
            <h3 className="text-white mb-4">Sosyal Medya</h3>
            <p className="text-white/80 mb-6">
              Sosyal medya hesaplarımdan beni takip edebilirsiniz.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${social.color} w-12 h-12 flex items-center justify-center text-white hover:scale-110 transition-transform`}
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <h2 className="mb-6">Mesaj Gönderin</h2>
          <form onSubmit={handleSubmit} className="bg-white p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block mb-2">
                  Ad Soyad <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Adınız ve soyadınız"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2">
                  E-posta <span className="text-destructive">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="subject" className="block mb-2">
                Konu
              </label>
              <Input
                id="subject"
                type="text"
                placeholder="Mesajınızın konusu"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block mb-2">
                Mesaj <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="message"
                placeholder="Mesajınızı buraya yazın..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="min-h-[200px]"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-[#F39C12] text-white px-8 py-3 hover:bg-[#E67E22] transition-colors flex items-center gap-2"
            >
              <Send size={20} />
              Mesajı Gönder
            </button>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-8">
        <h2 className="mb-6">Sık Sorulan Sorular</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              question: 'Proje süreleri ne kadar?',
              answer: 'Proje süreleri, projenin kapsamına göre değişiklik gösterir. Basit bir web sitesi için 2-3 hafta, karmaşık bir uygulama için 2-3 ay sürebilir.',
            },
            {
              question: 'Hangi teknolojileri kullanıyorsunuz?',
              answer: 'React, Next.js, TypeScript, Node.js, MongoDB, PostgreSQL gibi modern ve güncel teknolojiler kullanıyorum.',
            },
            {
              question: 'Uzaktan çalışma yapıyor musunuz?',
              answer: 'Evet, dünyanın her yerinden müşterilerle uzaktan çalışma yapabiliyorum. İletişim araçları sayesinde verimli bir iş birliği sağlanıyor.',
            },
            {
              question: 'Proje sonrası destek veriyor musunuz?',
              answer: 'Evet, teslim edilen projelere belirli bir süre boyunca ücretsiz bakım ve destek sağlıyorum. Uzun vadeli destek paketleri de mevcuttur.',
            },
          ].map((faq, index) => (
            <div key={index} className="bg-white p-6">
              <h4 className="mb-3 text-[#0078D4]">{faq.question}</h4>
              <p className="text-muted-foreground m-0">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#0078D4] to-[#00A8E1] text-white p-12 text-center">
        <h2 className="text-white mb-4">Hemen Başlayalım!</h2>
        <p className="text-white/90 mb-6 max-w-2xl mx-auto">
          Projeniz için en uygun çözümü birlikte bulalım. Size özel bir teklif hazırlamak için
          iletişime geçebilirsiniz.
        </p>
        <a
          href="mailto:info@metinciris.com.tr"
          className="inline-block bg-white text-[#0078D4] px-8 py-4 hover:bg-white/90 transition-colors"
        >
          E-posta Gönder
        </a>
      </div>
    </PageContainer>
  );
}
