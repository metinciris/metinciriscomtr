import React from 'react';
import { PageContainer } from '../components/PageContainer';
import { Calendar, Clock, Tag, TrendingUp, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Blog() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const categories = [
    { id: 'all', name: 'Tümü', count: 12 },
    { id: 'web', name: 'Web Geliştirme', count: 5 },
    { id: 'design', name: 'Tasarım', count: 3 },
    { id: 'tech', name: 'Teknoloji', count: 4 },
  ];

  const blogPosts = [
    {
      title: 'React 19: Yenilikler ve Değişiklikler',
      excerpt: 'React 19 ile gelen yeni özellikler, performans iyileştirmeleri ve dikkat edilmesi gereken değişiklikler hakkında detaylı bir inceleme.',
      category: 'web',
      date: '10 Kasım 2025',
      readTime: '8 dk',
      image: 'https://images.unsplash.com/photo-1595623654300-b27329804025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwY29kZXxlbnwxfHx8fDE3NjI4MDEwNDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      tags: ['React', 'JavaScript', 'Frontend'],
      featured: true,
    },
    {
      title: 'Modern Web Tasarımında Metro UI Trendleri',
      excerpt: 'Metro UI tasarım prensiplerininin modern web uygulamalarında nasıl kullanıldığını ve etkisini keşfedin.',
      category: 'design',
      date: '5 Kasım 2025',
      readTime: '6 dk',
      image: 'https://images.unsplash.com/photo-1742440710226-450e3b85c100?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHN0dWRpb3xlbnwxfHx8fDE3NjI3MDM0MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      tags: ['UI/UX', 'Design', 'Metro UI'],
      featured: false,
    },
    {
      title: 'TypeScript ile Tip Güvenliği: Best Practices',
      excerpt: 'TypeScript kullanırken dikkat edilmesi gereken noktalar, yaygın hatalar ve çözüm önerileri.',
      category: 'web',
      date: '28 Ekim 2025',
      readTime: '10 dk',
      image: 'https://images.unsplash.com/photo-1719400471588-575b23e27bd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkZXZlbG9wZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYyNzM3OTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      tags: ['TypeScript', 'JavaScript', 'Best Practices'],
      featured: false,
    },
    {
      title: 'Yapay Zeka ve Web Geliştirmenin Geleceği',
      excerpt: 'AI teknolojilerinin web geliştirme süreçlerini nasıl değiştirdiği ve gelecekteki etkileri üzerine.',
      category: 'tech',
      date: '20 Ekim 2025',
      readTime: '7 dk',
      image: 'https://images.unsplash.com/photo-1595623654300-b27329804025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwY29kZXxlbnwxfHx8fDE3NjI4MDEwNDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      tags: ['AI', 'Technology', 'Future'],
      featured: true,
    },
    {
      title: 'Performance Optimization: Web Uygulamalarını Hızlandırma',
      excerpt: 'Web uygulamalarınızı optimize etmek için kullanabileceğiniz teknikler ve araçlar.',
      category: 'web',
      date: '15 Ekim 2025',
      readTime: '12 dk',
      image: 'https://images.unsplash.com/photo-1742440710226-450e3b85c100?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHN0dWRpb3xlbnwxfHx8fDE3NjI3MDM0MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      tags: ['Performance', 'Optimization', 'Web Dev'],
      featured: false,
    },
    {
      title: 'Renk Teorisi ve Web Tasarımında Kullanımı',
      excerpt: 'Renklerin psikolojik etkisi ve web tasarımında etkili renk paletleri oluşturma yöntemleri.',
      category: 'design',
      date: '8 Ekim 2025',
      readTime: '5 dk',
      image: 'https://images.unsplash.com/photo-1719400471588-575b23e27bd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkZXZlbG9wZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzYyNzM3OTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      tags: ['Design', 'Color Theory', 'UI'],
      featured: false,
    },
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts.find(post => post.featured);

  return (
    <PageContainer>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#27AE60] to-[#2ECC71] text-white p-12 mb-8">
        <h1 className="text-white mb-4">Blog</h1>
        <p className="text-white/90 max-w-3xl">
          Web geliştirme, tasarım ve teknoloji hakkında düşüncelerimi, deneyimlerimi ve
          öğrendiklerimi paylaşıyorum.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <div className="bg-white p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Blog yazılarında ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#27AE60] text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Post */}
      {featuredPost && selectedCategory === 'all' && !searchTerm && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-[#27AE60]" size={24} />
            <h2>Öne Çıkan Yazı</h2>
          </div>
          <div className="bg-white overflow-hidden hover:shadow-xl transition-shadow group">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-auto overflow-hidden">
                <ImageWithFallback
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {featuredPost.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#27AE60]/10 text-[#27AE60]"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="mb-4">{featuredPost.title}</h2>
                <p className="text-muted-foreground mb-4">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
                <button className="bg-[#27AE60] text-white px-6 py-3 hover:bg-[#229954] transition-colors">
                  Devamını Oku
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.filter(post => !post.featured || selectedCategory !== 'all' || searchTerm).map((post, index) => (
          <div
            key={index}
            className="bg-white overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="relative h-48 overflow-hidden">
              <ImageWithFallback
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.slice(0, 2).map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="mb-3">{post.title}</h3>
              <p className="text-muted-foreground mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-muted-foreground pt-4 border-t border-border">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 bg-white">
          <p className="text-muted-foreground">Arama kriterlerinize uygun yazı bulunamadı.</p>
        </div>
      )}

      {/* Newsletter */}
      <div className="mt-12 bg-gradient-to-r from-[#0078D4] to-[#00A8E1] text-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-white mb-4">Blog Bültenine Abone Olun</h2>
          <p className="text-white/90 mb-6">
            Yeni blog yazılarından ve teknoloji haberlerinden haberdar olmak için e-posta listemize katılın.
          </p>
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              type="email"
              placeholder="E-posta adresiniz"
              className="flex-1 bg-white text-foreground"
            />
            <button className="bg-white text-[#0078D4] px-6 py-3 hover:bg-white/90 transition-colors">
              Abone Ol
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
