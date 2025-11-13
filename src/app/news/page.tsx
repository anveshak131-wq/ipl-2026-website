'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { News } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'match' | 'team' | 'player' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredNews(filtered);
  }, [selectedCategory, searchQuery, news]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-ipl-gold">
                📰 LATEST UPDATES
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
              IPL News & <span className="bg-gradient-to-r from-ipl-gold to-ipl-purple bg-clip-text text-transparent">Updates</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl">
              Stay updated with the latest news, match reports, and exclusive player insights from IPL 2026
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-12 space-y-6">
            {/* Search Bar */}
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

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: '📊 All News' },
                { key: 'match', label: '🏏 Match' },
                { key: 'team', label: '👥 Team' },
                { key: 'player', label: '⭐ Player' },
                { key: 'general', label: '📰 General' }
              ].map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key as any)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${
                    selectedCategory === category.key
                      ? 'bg-gradient-to-r from-ipl-purple to-ipl-gold text-white shadow-lg shadow-ipl-purple/20'
                      : 'bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/10 text-gray-300 hover:text-white hover:border-ipl-gold/50 hover:bg-white/20'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* News Grid */}
          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item) => (
                <article
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-gold/50 transition-all duration-300 hover:shadow-2xl hover:shadow-ipl-gold/20 transform hover:scale-105 cursor-pointer"
                >
                  {/* Animated background on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-ipl-gold/10 to-ipl-purple/10" />
                  </div>

                  {/* News Image */}
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* Category Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(item.category)}`}>
                        {item.category === 'match' && '🏏'}
                        {item.category === 'team' && '👥'}
                        {item.category === 'player' && '⭐'}
                        {item.category === 'general' && '📰'}
                        {' '}{item.category}
                      </span>
                    </div>
                  </div>

                  {/* News Content */}
                  <div className="relative p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <time className="text-gray-400 flex items-center">
                        📅 {formatDate(item.publishedAt)}
                      </time>
                    </div>

                    <h3 className="text-lg font-black text-white line-clamp-2 group-hover:text-ipl-gold transition-colors duration-300">
                      {item.title}
                    </h3>

                    <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <button className="inline-flex items-center text-ipl-gold hover:text-ipl-purple transition-colors font-bold text-sm group/btn pt-2">
                      Read Story
                      <svg
                        className="w-4 h-4 ml-1 transform group-hover/btn:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-8 max-w-md mx-auto">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-300 text-lg font-semibold">
                  No news found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredNews.length > 0 && (
            <div className="text-center mt-12">
              <button className="bg-gradient-to-r from-ipl-purple to-ipl-gold hover:from-ipl-gold hover:to-ipl-purple text-white font-bold text-lg px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105">
                Load More News
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
