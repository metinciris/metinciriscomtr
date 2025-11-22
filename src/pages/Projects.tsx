import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { ExternalLink, Github, Calendar, Tag } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Projects() {
  const [filter, setFilter] = React.useState('all');

  const categories = [
    { id: 'all', name: 'Tümü', color: 'bg-[#0078D4]' },
    { id: 'web', name: 'Web Uygulamaları', color: 'bg-[#27AE60]' },
    { id: 'mobile', name: 'Mobil', color: 'bg-[#E74C3C]' },
    { id: 'design', name: 'Tasarım', color: 'bg-[#F39C12]' },
    { id: 'opensource', name: 'Açık Kaynak', color: 'bg-[#8E44AD]' },
  ];

  const projects = [
    {
      title: 'E-Ticaret Platformu',
      description: 'React ve Node.js ile geliştirilmiş modern e-ticaret çözümü. Gerçek zamanlı ürün yönetimi, sepet sistemi ve ödeme entegrasyonu.',
      category: 'web',
      tags: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      image: 'https://images.unsplash.com/photo-1719400471588-575b23e27bd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkZXZlbG9wZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYyNzM3OTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      date: '2024',
      github: 'https://github.com',
      demo: 'https://demo.com',
      color: 'bg-[#3498DB]',
    },
    {
      title: 'Kurumsal CRM Sistemi',
      description: 'Müşteri ilişkileri yönetimi için kapsamlı CRM çözümü. Dashboard, raporlama ve analiz araçları.',
      category: 'web',
      tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'TailwindCSS'],
      image: 'https://images.unsplash.com/photo-1595623654300-b27329804025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwY29kZXxlbnwxfHx8fDE3NjI4MDEwNDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      date: '2024',
      github: 'https://github.com',
      color: 'bg-[#9B59B6]',
    },
    {
      title: 'Mobil Fitness Uygulaması',
      description: 'React Native ile geliştirilmiş cross-platform fitness takip uygulaması. Egzersiz planları ve ilerleme takibi.',
      category: 'mobile',
      tags: ['React Native', 'Firebase', 'Redux'],
      image: 'https://images.unsplash.com/photo-1742440710226-450e3b85c100?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHN0dWRpb3xlbnwxfHx8fDE3NjI3MDM0MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      date: '2023',
      github: 'https://github.com',
      color: 'bg-[#E67E22]',
    },
    {
      title: 'UI Component Library',
      description: 'Yeniden kullanılabilir React bileşen kütüphanesi. Storybook dokümantasyonu ve TypeScript desteği.',
      category: 'opensource',
      tags: ['React', 'TypeScript', 'Storybook', 'Rollup'],
      image: 'https://images.unsplash.com/photo-1719400471588-575b23e27bd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkZXZlbG9wZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYyNzM3OTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      date: '2023',
      github: 'https://github.com',
      demo: 'https://demo.com',
      color: 'bg-[#1ABC9C]',
    },
    {
      title: 'Portfolio Tasarım Sistemi',
      description: 'Modern ve responsive portfolio web siteleri için tasarım sistemi. Figma ve kodu içerir.',
      category: 'design',
      tags: ['Figma', 'Design System', 'UI/UX'],
      image: 'https://images.unsplash.com/photo-1595623654300-b27329804025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwY29kZXxlbnwxfHx8fDE3NjI4MDEwNDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      date: '2023',
      demo: 'https://demo.com',
      color: 'bg-[#E74C3C]',
    },
    {
      title: 'Real-time Chat Uygulaması',
      description: 'WebSocket ile gerçek zamanlı mesajlaşma uygulaması. Grup sohbetleri ve dosya paylaşımı.',
      category: 'web',
      tags: ['Socket.io', 'Express', 'React', 'MongoDB'],
      image: 'https://images.unsplash.com/photo-1742440710226-450e3b85c100?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHN0dWRpb3xlbnwxfHx8fDE3NjI3MDM0MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      date: '2024',
      github: 'https://github.com',
      color: 'bg-[#16A085]',
    },
  ];

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.category === filter);

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0078D4] to-[#00A8E1] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Projelerim</h1>
        <p className="text-white/90 max-w-3xl">
          Çeşitli teknolojiler kullanarak geliştirdiğim projeler. Her proje, farklı zorluklar
          ve öğrenme fırsatları sundu.
        </p>
      </div>

      {/* Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-6 py-3 transition-all ${
                filter === cat.id
                  ? `${cat.color} text-white scale-105`
                  : 'bg-white text-gray-700 hover:shadow-md'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, index) => (
          <div
            key={index}
            className="bg-white overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative h-48 overflow-hidden">
              <ImageWithFallback
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 ${project.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar size={14} />
                <span>{project.date}</span>
              </div>
              
              <h3 className="mb-3">{project.title}</h3>
              <p className="text-muted-foreground mb-4">{project.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground"
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-border">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-foreground hover:text-[#0078D4] transition-colors"
                  >
                    <Github size={18} />
                    <span>GitHub</span>
                  </a>
                )}
                {project.demo && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-foreground hover:text-[#0078D4] transition-colors"
                  >
                    <ExternalLink size={18} />
                    <span>Demo</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Bu kategoride henüz proje bulunmuyor.</p>
        </div>
      )}
    </PageContainer>
  );
}
