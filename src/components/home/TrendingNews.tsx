'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, Clock } from 'lucide-react';
import type { News } from '@/types';
import CustomEmoji from '@/components/emoji/CustomEmoji';
import SocialShare from '@/components/ui/SocialShare';

interface TrendingNewsProps {
  articles: News[];
  isLoading?: boolean;
}

export default function TrendingNews({ articles, isLoading = false }: TrendingNewsProps) {
  const trendingArticles = useMemo(() => {
    // Sort by importance and recency
    return [...articles]
      .filter((article) => article.isImportant || article.category === 'match')
      .sort((a, b) => {
        const aDate = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 3);
  }, [articles]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (trendingArticles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-orange-400" />
        <h3 className="text-2xl font-bold text-white">Trending News</h3>
      </div>
      
      {trendingArticles.map((article, index) => (
        <motion.div
          key={article.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02, x: 5 }}
          className="group relative p-6 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-orange-500/50 transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {article.isImportant && (
                  <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/50">
                    BREAKING
                  </span>
                )}
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(article.publishedAt || article.createdAt || '').toLocaleDateString()}
                </span>
              </div>
              <Link href={`/news/${article.id}`}>
                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                  {article.title}
                </h4>
              </Link>
              {article.summary && (
                <p className="text-sm text-gray-400 line-clamp-2">{article.summary}</p>
              )}
            </div>
            <SocialShare
              url={`/news/${article.id}`}
              title={article.title}
              description={article.summary}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

