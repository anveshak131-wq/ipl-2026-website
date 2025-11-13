'use client';

import { useState, useEffect } from 'react';
import { News } from '@/types';
import { api } from '@/lib/data';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function NewsSection() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsData = await api.getNews();
        setNews(newsData.slice(0, 3)); // Show latest 3 news items
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'match':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'team':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'player':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-ipl-gold/20 text-ipl-gold border-ipl-gold/30';
    }
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 via-black to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-ipl-purple/10 px-4 py-2 rounded-full border border-ipl-purple/30 mb-4">
            <span className="w-2 h-2 bg-ipl-purple rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-ipl-purple">Latest Updates</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Breaking News & Stories
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stay informed with the latest buzz from the cricket world
          </p>
        </div>

        {news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {news.map((article, index) => (
            <article
              key={article.id}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-ipl-purple/50 transition-all duration-300 hover:shadow-2xl hover:shadow-ipl-purple/20 transform hover:scale-105 cursor-pointer flex flex-col h-full"
              style={{animationDelay: `${index * 100}ms`}}
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500 group-hover:brightness-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300?text=${article.title.substring(0, 20)}`;
                  }}
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Category Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getCategoryColor(article.category)}`}>
                    {article.category === 'match' && '🏏'}
                    {article.category === 'team' && '👥'}
                    {article.category === 'player' && '⭐'}
                    {article.category === 'general' && '📰'}
                    {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                  </span>
                </div>

                {/* Read Time */}
                <div className="absolute bottom-4 left-4 text-xs text-white/80 font-medium">
                  ⏱️ 5 min read
                </div>
              </div>

              {/* Content Section */}
              <div className="relative p-6 flex-1 flex flex-col space-y-4">
                {/* Date */}
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(article.publishedAt)}</span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-ipl-gold transition-colors duration-300 line-clamp-2">
                    {article.title}
                  </h3>
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-400 line-clamp-2 flex-1">
                  {article.summary || article.content.substring(0, 100)}...
                </p>

                {/* Read More Button */}
                <div className="pt-4 border-t border-white/10">
                  <button className="w-full flex items-center justify-center space-x-2 text-ipl-purple hover:text-ipl-gold font-bold text-sm transition-all duration-300 py-2 hover:bg-white/5 rounded-lg">
                    <span>Read Full Story</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No news articles available yet.</p>
          </div>
        )}

        {/* Browse All News Button */}
        <div className="text-center mt-12">
          <a href="/news" className="inline-flex items-center space-x-2 px-8 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-ipl-purple/30">
            <span>Browse All News</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
