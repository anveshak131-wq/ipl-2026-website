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
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Latest News
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-ipl-purple to-ipl-gold mx-auto mb-4" />
          <p className="text-gray-300 text-lg">
            Stay updated with the latest happenings from IPL 2026
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((article) => (
            <article
              key={article.id}
              className="ipl-card hover:scale-105 transform transition-all duration-300 cursor-pointer group"
            >
              {/* News Image */}
              <div className="relative mb-4 overflow-hidden rounded-lg">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(article.category)}`}>
                    {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                  </span>
                </div>
              </div>

              {/* News Content */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-400">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(article.publishedAt)}
                </div>

                <h3 className="text-xl font-semibold text-white group-hover:text-ipl-gold transition-colors duration-200">
                  {article.title}
                </h3>
                
                <p className="text-gray-300 line-clamp-3">
                  {article.summary}
                </p>

                <button className="text-ipl-gold hover:text-ipl-purple font-medium text-sm transition-colors duration-200 flex items-center group">
                  Read More
                  <svg
                    className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200"
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

        <div className="text-center mt-12">
          <button className="ipl-button text-lg px-8 py-3">
            View All News
          </button>
        </div>
      </div>
    </section>
  );
}
