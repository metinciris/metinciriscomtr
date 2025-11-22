import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Code2, Palette, Zap, Users, Award, Target, Heart, TrendingUp } from 'lucide-react';

export function About() {
  const skills = [
    { name: 'React & Next.js', level: 95, color: 'bg-[#61DAFB]' },
    { name: 'TypeScript', level: 90, color: 'bg-[#3178C6]' },
    { name: 'Node.js', level: 85, color: 'bg-[#339933]' },
    { name: 'UI/UX Design', level: 80, color: 'bg-[#FF6B6B]' },
    { name: 'Database Design', level: 85, color: 'bg-[#F39C12]' },
    { name: 'DevOps', level: 75, color: 'bg-[#8E44AD]' },
  ];

  const services = [
    {
      icon: <Code2 size={40} />,
      title: 'Web Geliştirme',
      description: 'Modern web teknolojileri ile performanslı ve ölçeklenebilir uygulamalar',
      color: 'bg-[#0078D4]',
    },
    {
      icon: <Palette size={40} />,
      title: 'UI/UX Tasarım',
      description: 'Kullanıcı odaklı, estetik ve fonksiyonel arayüz tasarımları',
      color: 'bg-[#E74C3C]',
    },
    {
      icon: <Zap size={40} />,
      title: 'Optimizasyon',
      description: 'SEO, performans ve kullanıcı deneyimi optimizasyonu',
      color: 'bg-[#F39C12]',
    },
    {
      icon: <Users size={40} />,
      title: 'Danışmanlık',
      description: 'Teknik danışmanlık ve proje yönetimi hizmetleri',
      color: 'bg-[#27AE60]',
    },
  ];

  const values = [
    { icon: <Award size={32} />, title: 'Kalite', description: 'Her projede mükemmellik' },
    { icon: <Target size={32} />, title: 'Hedef Odaklı', description: 'İş hedeflerinize ulaşın' },
    { icon: <Heart size={32} />, title: 'Tutku', description: 'Sevdiğim işi yapıyorum' },
    { icon: <TrendingUp size={32} />, title: 'Sürekli Gelişim', description: 'Her gün daha iyisi' },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-[#0078D4] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Hakkımda</h1>
        <p className="text-white/90 max-w-3xl">
          Merhaba! Ben Metin Çiriş. Web geliştirme alanında uzmanlaşmış, teknolojiye tutkulu bir
          yazılım geliştiriciyim. Modern web teknolojileri ile kullanıcı dostu ve performanslı
          uygulamalar geliştiriyorum.
        </p>
      </div>

      {/* Services Grid */}
      <div className="mb-12">
        <h2 className="mb-6">Hizmetlerim</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-8 hover:shadow-xl transition-all duration-300 group"
            >
              <div className={`${service.color} w-16 h-16 flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                {service.icon}
              </div>
              <h3 className="mb-3">{service.title}</h3>
              <p className="text-muted-foreground">{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-12">
        <h2 className="mb-6">Yetenekler</h2>
        <div className="bg-white p-8">
          <div className="space-y-6">
            {skills.map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span>{skill.name}</span>
                  <span className="text-muted-foreground">{skill.level}%</span>
                </div>
                <div className="w-full bg-gray-200 h-3 overflow-hidden">
                  <div
                    className={`${skill.color} h-full transition-all duration-1000 ease-out`}
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-12">
        <h2 className="mb-6">Değerlerim</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-[#2C3E50] text-white p-6 text-center hover:bg-[#34495E] transition-colors"
            >
              <div className="flex justify-center mb-4">{value.icon}</div>
              <h4 className="text-white mb-2">{value.title}</h4>
              <p className="text-white/80 m-0">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Experience Timeline */}
      <div className="mb-12">
        <h2 className="mb-6">Deneyim</h2>
        <div className="bg-white p-8">
          <div className="space-y-8">
            {[
              {
                year: '2023 - Günümüz',
                title: 'Senior Web Developer',
                company: 'Freelance',
                description: 'Çeşitli projelerde modern web teknolojileri ile çözümler geliştirme',
              },
              {
                year: '2020 - 2023',
                title: 'Full Stack Developer',
                company: 'Tech Company',
                description: 'Kurumsal ölçekte web uygulamaları geliştirme ve bakımı',
              },
              {
                year: '2018 - 2020',
                title: 'Frontend Developer',
                company: 'Digital Agency',
                description: 'Responsive ve kullanıcı dostu web arayüzleri tasarımı ve geliştirmesi',
              },
            ].map((exp, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#0078D4] flex items-center justify-center text-white">
                    {index + 1}
                  </div>
                </div>
                <div>
                  <div className="text-[#0078D4] mb-1">{exp.year}</div>
                  <h4 className="mb-1">{exp.title}</h4>
                  <div className="text-muted-foreground mb-2">{exp.company}</div>
                  <p className="text-muted-foreground m-0">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Education */}
      <div>
        <h2 className="mb-6">Eğitim</h2>
        <div className="bg-gradient-to-r from-[#8E44AD] to-[#9B59B6] text-white p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-white mb-2">Bilgisayar Mühendisliği</h3>
              <p className="text-white/90 mb-1">Üniversite Adı</p>
              <p className="text-white/80 m-0">2014 - 2018</p>
            </div>
            <div>
              <h3 className="text-white mb-2">Sertifikalar</h3>
              <ul className="space-y-2">
                <li className="text-white/90">• AWS Certified Developer</li>
                <li className="text-white/90">• React Advanced Certification</li>
                <li className="text-white/90">• UI/UX Design Professional</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
