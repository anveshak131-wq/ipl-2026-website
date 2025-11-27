'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import AnimatedCard from '@/components/ui/AnimatedCard';
import type { News } from '@/types';

interface ModernNewsSectionProps {
  articles: News[];
  isLoading?: boolean;
}

export default function ModernNewsSection({ articles, isLoading = false }: ModernNewsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', 'breaking', 'analysis', 'player', 'team'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const filteredArticles =
    selectedCategory === 'all' ? articles : articles.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-ipl-gold to-yellow-400 text-black shadow-lg shadow-ipl-gold/50'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* News grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.slice(0, 4).map((article, idx) => (
          <Link key={article.id} href={`/news/${article.id}`}>
            <AnimatedCard delay={idx} hover="lift" className="h-full overflow-hidden group cursor-pointer">
              {/* Image */}
              {article.image && (
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {/* Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-ipl-gold/20 text-ipl-gold">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-ipl-gold transition-colors">
                  {article.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">{article.summary || article.content.substring(0, 100)}</p>

                {/* Read more */}
                <div className="flex items-center gap-2 text-ipl-gold text-sm font-semibold group-hover:gap-3 transition-all">
                  Read more
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </AnimatedCard>
          </Link>
        ))}
      </div>

      {/* View all button */}
      <div className="text-center">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-ipl-gold/30 hover:border-ipl-gold/60 text-ipl-gold hover:text-ipl-gold font-semibold transition-all duration-300 hover:bg-ipl-gold/5"
        >
          <Sparkles className="w-4 h-4" />
          View all news
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
