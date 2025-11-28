'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Newspaper, Clock, ArrowRight } from 'lucide-react';
import { News, Team } from '@/types';
import { api } from '@/lib/data';
import SocialShare from '@/components/ui/SocialShare';

interface TeamNewsFeedProps {
  team: Team;
  maxItems?: number;
}

export default function TeamNewsFeed({ team, maxItems = 5 }: TeamNewsFeedProps) {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const allNews = await api.getNews();
        // Filter news related to this team (by team name or shortName in title/summary)
        const teamNews = allNews
          .filter(
            (item) =>
              item.title.toLowerCase().includes(team.name.toLowerCase()) ||
              item.title.toLowerCase().includes(team.shortName.toLowerCase()) ||
              item.summary?.toLowerCase().includes(team.name.toLowerCase()) ||
              item.summary?.toLowerCase().includes(team.shortName.toLowerCase()) ||
              item.category === 'team'
          )
          .slice(0, maxItems);
        setNews(teamNews);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [team.id, team.name, team.shortName, maxItems]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No news available for this team</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {item.category}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.publishedAt || item.createdAt || '').toLocaleDateString()}
                </span>
              </div>
              <Link href={`/news/${item.id}`}>
                <h4 className="text-base font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {item.title}
                </h4>
              </Link>
              {item.summary && (
                <p className="text-sm text-gray-300 line-clamp-2">{item.summary}</p>
              )}
            </div>
            <SocialShare
              url={`/news/${item.id}`}
              title={item.title}
              description={item.summary}
            />
          </div>
        </motion.div>
      ))}

      <Link
        href={`/news?team=${team.shortName}`}
        className="block text-center py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2"
      >
        View All News
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

