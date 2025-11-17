 'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { News } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';
import AuroraBackground from '@/components/ui/AuroraBackground';
import NewsModal from '@/components/news/NewsModal';

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'match' | 'team' | 'player' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsData = await api.getNews();
        setNews(newsData);
        setFilteredNews(newsData);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    let filtered = news;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.summary || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredNews(filtered);
  }, [selectedCategory, searchQuery, news]);

  const featuredImportant = filteredNews.find((item) => item.isImportant);
  const remainingNews = featuredImportant
    ? filteredNews.filter((item) => item.id !== featuredImportant.id)
    : filteredNews;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getImageSrc = (input?: any) => {
    let url: string | undefined;
    if (!input) url = undefined;
    else if (typeof input === 'string') url = input;
    else url = input.image || input.imageUrl || input.image_url || input.img;

    if (!url) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
    const trimmed = String(url).trim();
    if (trimmed.startsWith('//')) return window.location.protocol + trimmed;
    if (trimmed.startsWith('/')) return window.location.origin + trimmed;
    return trimmed;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'match':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'team':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'player':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'general':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="relative py-16 min-h-screen overflow-hidden">
        <AuroraBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 animate-slide-up">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold flex items-center gap-2 hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-default">
                <Icon name="news" size={16} /> LATEST UPDATES
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight hover:scale-[1.02] transition-transform duration-300">
              IPL News & <span className="bg-gradient-to-r from-ipl-blue-light via-ipl-gold to-ipl-purple bg-clip-text text-transparent animate-glow">Updates</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              Stay updated with the latest news, match reports, and exclusive player insights from IPL 2026
            </p>
          </div>

          <div className="mb-12 space-y-6 animate-fade-in">
            <div className="relative">
              <input
                type="text"
                placeholder="Search news by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-xl px-6 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold/50 focus:ring-2 focus:ring-ipl-gold/20 transition-all duration-300 backdrop-blur-sm"
              />
              <svg
                className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { key: 'all', label: 'All News', icon: 'stats' as const, color: '#7C3AED' },
                { key: 'match', label: 'Match', icon: 'cricket' as const, color: '#3B82F6' },
                { key: 'team', label: 'Team', icon: 'team' as const, color: '#8B5CF6' },
                { key: 'player', label: 'Player', icon: 'trophy' as const, color: '#10B981' },
                { key: 'general', label: 'General', icon: 'news' as const, color: '#F59E0B' }
              ].map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key as any)}
                  className={`group relative overflow-hidden px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-500 flex items-center gap-2 transform hover:scale-105 ${
                    selectedCategory === category.key ? 'scale-105' : ''
                  }`}
                  style={selectedCategory === category.key ? {
                    background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                    color: '#fff',
                    boxShadow: `0 10px 30px ${category.color}40, 0 0 40px ${category.color}20`,
                    border: `2px solid ${category.color}60`,
                  } : {
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    color: '#9CA3AF',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category.key) {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.background = `linear-gradient(135deg, ${category.color}20, ${category.color}10)`;
                      e.currentTarget.style.borderColor = `${category.color}40`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category.key) {
                      e.currentTarget.style.color = '#9CA3AF';
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {selectedCategory === category.key && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  )}
                  <Icon name={category.icon} size={16} />
                  <span className="relative z-10">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Featured important news block */}
          {featuredImportant && (
            <section className="mt-6 animate-fade-in" style={{ animationDelay: '80ms' }}>
              <article
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm border border-ipl-gold/40 hover:border-ipl-gold/60 transition-all duration-500 hover:shadow-2xl hover:shadow-ipl-gold/30 cursor-pointer"
                onClick={() => {
                  setSelectedNewsId(featuredImportant.id);
                  setIsModalOpen(true);
                }}
              >
                <div className="h-64 md:h-80 lg:h-96 relative">
                  <img
                    src={getImageSrc((featuredImportant as any).image || (featuredImportant as any).imageUrl)}
                    alt={featuredImportant.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"%3E%3Crect fill="%23333" width="800" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/80 text-white shadow-lg">
                      IMPORTANT
                    </span>
                    {featuredImportant.category && (
                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-gray-100 border border-white/20">
                        {featuredImportant.category.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 space-y-3">
                  <time className="text-xs text-gray-300 uppercase tracking-wide">
                    {formatDate(featuredImportant.publishedAt || featuredImportant.createdAt)}
                  </time>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight line-clamp-2 group-hover:text-ipl-gold transition-colors duration-300">
                    {featuredImportant.title}
                  </h2>
                  <p className="hidden md:block text-sm md:text-base text-gray-200 max-w-2xl line-clamp-2">
                    {featuredImportant.summary || featuredImportant.content}
                  </p>
                  <button
                    className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-ipl-blue-light to-ipl-purple text-white shadow-lg group-hover:shadow-xl transition-all"
                  >
                    Read featured story
                    <svg
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </article>
            </section>
          )}

          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingNews.map((item) => (
                <article key={item.id} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-gold/50 transition-all duration-300 hover:shadow-2xl hover:shadow-ipl-gold/20 transform hover:scale-105 cursor-pointer">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10" />
                  </div>

                  <div className="h-48 overflow-hidden relative">
                    <img src={getImageSrc((item as any).image || (item as any).imageUrl)} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor((item as any).category)}`}>
                        {(item as any).category === 'match' && <Icon name="cricket" size={12} />}
                        {(item as any).category === 'team' && <Icon name="team" size={12} />}
                        {(item as any).category === 'player' && <Icon name="trophy" size={12} />}
                        {(item as any).category === 'general' && <Icon name="news" size={12} />}
                        {(item as any).category}
                      </span>
                    </div>
                  </div>

                  <div className="relative p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <time className="text-gray-400 text-sm">{formatDate(item.publishedAt)}</time>
                    </div>

                    <h3 className="text-lg font-black text-white line-clamp-2 group-hover:text-ipl-gold transition-colors duration-300">{item.title}</h3>

                    <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">{item.summary}</p>

                    <button onClick={() => {
                      setSelectedNewsId(item.id);
                      setIsModalOpen(true);
                    }} className="group/btn inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-500 transform hover:scale-105 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(147, 51, 234, 0.1))', border: '1px solid rgba(124, 58, 237, 0.3)', color: '#A855F7' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(147, 51, 234, 0.2))'; e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)'; e.currentTarget.style.color = '#C084FC'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(147, 51, 234, 0.1))'; e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)'; e.currentTarget.style.color = '#A855F7'; }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
                      <span className="relative z-10">Read Story</span>
                      <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8 max-w-md mx-auto">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-gray-300 text-lg font-semibold">No news found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* News Modal */}
      <NewsModal
        isOpen={isModalOpen}
        newsId={selectedNewsId || ''}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNewsId(null);
        }}
      />
    </div>
  );
}
