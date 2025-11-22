import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { MessageSquare, Send } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { toast } from 'sonner@2.0.3';

export function ZiyaretMesaji() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.message) {
      toast.error('Lütfen ad ve mesaj alanlarını doldurun');
      return;
    }

    toast.success('Mesajınız başarıyla gönderildi!');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <PageContainer>
      <div className="bg-[#FF8C00] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Ziyareti Mesajı</h1>
        <p className="text-white/90">
          Web sitemizi ziyaret ettiğiniz için teşekkür ederiz. Görüş, öneri ve sorularınızı
          bizimle paylaşabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mesaj Formu */}
        <div className="bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#FF8C00] w-12 h-12 flex items-center justify-center text-white">
              <MessageSquare size={24} />
            </div>
            <h2>Mesajınızı Bırakın</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block mb-2">
                Adınız Soyadınız <span className="text-destructive">*</span>
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
                E-posta Adresiniz
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <p className="text-muted-foreground mt-1 m-0">
                İsteğe bağlı - Size geri dönüş yapmak istediğimizde kullanılacaktır
              </p>
            </div>

            <div>
              <label htmlFor="message" className="block mb-2">
                Mesajınız <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="message"
                placeholder="Görüş, öneri veya sorularınızı buraya yazabilirsiniz..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="min-h-[200px]"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-[#FF8C00] text-white px-8 py-3 hover:bg-[#FF7700] transition-colors flex items-center gap-2 w-full justify-center"
            >
              <Send size={20} />
              Mesajı Gönder
            </button>
          </form>
        </div>

        {/* Bilgilendirme */}
        <div className="space-y-6">
          <div className="bg-[#00A6D6] text-white p-8">
            <h3 className="text-white mb-4">Mesaj Defteri Hakkında</h3>
            <p className="text-white/90 mb-4">
              Bu bölümü web sitemizi ziyaret eden misafirlerimizin görüş, öneri ve
              sorularını almak için oluşturduk.
            </p>
            <p className="text-white/90 m-0">
              Tüm mesajlar değerlendirilecek ve gerekli geri dönüşler yapılacaktır.
            </p>
          </div>

          <div className="bg-white p-8">
            <h3 className="mb-4">Ne Tür Mesajlar Gönderebilirsiniz?</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-[#FF8C00] mt-1">•</span>
                <span>Web sitesi hakkında görüş ve önerileriniz</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF8C00] mt-1">•</span>
                <span>Genel sorularınız</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF8C00] mt-1">•</span>
                <span>İş birliği teklifleri</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF8C00] mt-1">•</span>
                <span>Akademik danışmanlık talepleri</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#FFF3E0] border-l-4 border-[#FF8C00] p-6">
            <h4 className="mb-2">Önemli Not</h4>
            <p className="text-muted-foreground m-0">
              Tıbbi danışma ve tanı için lütfen doğrudan iletişim bilgilerimizi
              kullanarak bize ulaşın. Bu form genel sorular içindir.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
