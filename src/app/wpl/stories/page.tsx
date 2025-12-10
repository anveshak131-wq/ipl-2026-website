'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Eye, Filter, Search, Calendar, User, Tag, Star, TrendingUp } from 'lucide-react';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';
import WPLFloatingParticles from '@/components/animations/WPLFloatingParticles';

interface FanStory {
  id: string;
  title: string;
  author: string;
  category: 'match-experience' | 'player-fan' | 'venue-memory' | 'cricket-journey' | 'emotional-moment';
  excerpt: string;
  content: string;
  likes: number;
  comments: number;
  views: number;
  featured: boolean;
  submittedAt: string;
  tags: string[];
  imageUrl?: string;
}

export default function WPLStoriesPage() {
  const [stories, setStories] = useState<FanStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<FanStory | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');

  useEffect(() => {
    // Load WPL-specific fan stories
    setStories([
      {
        id: '1',
        title: 'My First WPL Match - Trailblazers vs Velocity',
        author: 'Priya Sharma',
        category: 'match-experience',
        excerpt: 'The atmosphere was electric watching Smriti Mandhana lead from the front in her home ground...',
        content: 'The atmosphere was electric watching Smriti Mandhana lead from the front in her home ground. The crowd was mostly families with young girls, all inspired by these incredible athletes. I brought my daughter who wants to be a cricketer, and seeing the players up close was a dream come true for both of us.',
        likes: 324,
        comments: 28,
        views: 1850,
        featured: true,
        submittedAt: '2024-12-01T10:30:00Z',
        tags: ['WPL', 'Trailblazers', 'Smriti Mandhana', 'First Match'],
        imageUrl: '/images/wpl-stories/trailblazers-match.jpg'
      },
      {
        id: '2',
        title: 'Meeting Harmanpreet Kaur - A Dream Come True',
        author: 'Anjali Patel',
        category: 'player-fan',
        excerpt: 'I never thought I would meet my idol who inspired millions of girls to take up cricket...',
        content: 'I never thought I would meet my idol who inspired millions of girls to take up cricket. It happened during a fan meet at the WPL venue. Harmanpreet was so humble and took time to talk to every fan. She signed my jersey and gave me advice about playing cricket. That moment changed my life forever.',
        likes: 567,
        comments: 42,
        views: 3200,
        featured: true,
        submittedAt: '2024-11-28T15:45:00Z',
        tags: ['Harmanpreet Kaur', 'Meet & Greet', 'Inspiration', 'Trailblazers']
      },
      {
        id: '3',
        title: 'The Journey from Street Cricket to WPL Stand',
        author: 'Meera Kumar',
        category: 'cricket-journey',
        excerpt: 'From playing gully cricket with boys to watching women play on the biggest stage...',
        content: 'From playing gully cricket with boys to watching women play on the biggest stage - my cricket journey has been incredible. My parents never supported cricket for girls, but WPL changed everything. Now they proudly tell everyone about their daughter who loves cricket.',
        likes: 189,
        comments: 15,
        views: 890,
        featured: false,
        submittedAt: '2024-12-05T11:20:00Z',
        tags: ['Journey', 'Inspiration', 'Women Cricket', 'Family Support']
      },
      {
        id: '4',
        title: 'WPL 2024 Final - The Greatest Match Ever',
        author: 'Rashmi Desai',
        category: 'match-experience',
        excerpt: 'The final over of WPL 2024 will be etched in my memory forever...',
        content: 'The final over of WPL 2024 will be etched in my memory forever. RCB needed 8 runs to win their first title, and Sophie Devine was on strike. The stadium was roaring, everyone was on their feet. When she hit the winning six, the celebration was unreal!',
        likes: 892,
        comments: 67,
        views: 4500,
        featured: true,
        submittedAt: '2024-11-20T20:00:00Z',
        tags: ['WPL Final', 'RCB', 'Sophie Devine', 'Championship']
      },
      {
        id: '5',
        title: 'My Daughter Wants to Be Like Jemimah Rodrigues',
        author: 'Sunita Menon',
        category: 'emotional-moment',
        excerpt: 'Watching my 8-year-old daughter practice Jemimah\'s signature shot in our backyard...',
        content: 'Watching my 8-year-old daughter practice Jemimah Rodrigues\' signature shot in our backyard brings tears to my eyes. She has posters of all WPL players in her room. WPL has given young girls role models they can look up to. This is what true empowerment looks like.',
        likes: 445,
        comments: 38,
        views: 2100,
        featured: false,
        submittedAt: '2024-12-03T14:30:00Z',
        tags: ['Jemimah Rodrigues', 'Inspiration', 'Young Fans', 'Empowerment']
      }
    ]);
  }, []);

  const categories = [
    { id: 'all', label: 'All Stories' },
    { id: 'match-experience', label: 'Match Experience' },
    { id: 'player-fan', label: 'Player Fan' },
    { id: 'venue-memory', label: 'Venue Memory' },
    { id: 'cricket-journey', label: 'Cricket Journey' },
    { id: 'emotional-moment', label: 'Emotional Moment' }
  ];

  const sortOptions = [
    { id: 'latest', label: 'Latest' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'trending', label: 'Trending' }
  ];

  const filteredStories = stories.filter(story => {
    const matchesFilter = filter === 'all' || story.category === filter;
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.likes - a.likes;
      case 'trending':
        return (b.views + b.likes + b.comments) - (a.views + a.likes + a.comments);
      case 'latest':
      default:
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
  });

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'match-experience': return 'Match Experience';
      case 'player-fan': return 'Player Fan';
      case 'venue-memory': return 'Venue Memory';
      case 'cricket-journey': return 'Cricket Journey';
      case 'emotional-moment': return 'Emotional Moment';
      default: return category;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <AuroraBackground />
      <WPLFloatingParticles />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AnimatedSection>
            <div className="text-center mb-8">
              <GradientText className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400">
                WPL Fan Stories
              </GradientText>
              <p className="text-gray-300 text-lg">
                Heartwarming experiences from the Women's Premier League community
              </p>
            </div>
          </AnimatedSection>

          {/* Filters and Search */}
          <AnimatedSection delay={0.2}>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search stories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-purple-900/30 text-white rounded-lg pl-10 pr-4 py-2 border border-purple-400/20"
                  />
                </div>
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-purple-900/30 text-white rounded-lg px-4 py-2 border border-purple-400/20"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-purple-900/30 text-white rounded-lg px-4 py-2 border border-purple-400/20"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>

                <div className="flex items-center justify-center text-purple-300">
                  <Star className="mr-2" size={20} />
                  {stories.filter(s => s.featured).length} Featured
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Stories Grid */}
          <div className="grid gap-6">
            {sortedStories.map((story, index) => (
              <AnimatedSection key={story.id} delay={index * 0.1}>
                <motion.div
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {story.featured && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-400/20 text-purple-300">
                            Featured
                          </span>
                        )}
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-400/20 text-pink-300">
                          {getCategoryLabel(story.category)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{story.title}</h3>
                      
                      <div className="flex items-center gap-4 text-gray-300 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {story.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(story.submittedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-gray-300 mb-4">{story.excerpt}</p>

                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <div className="flex items-center gap-1">
                          <Heart size={14} />
                          {story.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          {story.comments}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          {story.views}
                        </div>
                      </div>

                      {story.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {story.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="px-2 py-1 bg-purple-900/30 rounded text-xs text-purple-300">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>

          {/* Story Detail Modal */}
          {selectedStory && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSelectedStory(null)}
            >
              <motion.div
                className="bg-purple-900/90 backdrop-blur-md rounded-xl p-6 max-w-3xl max-h-[90vh] overflow-y-auto border border-purple-400/20"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{selectedStory.title}</h3>
                    <div className="flex items-center gap-4 text-gray-300">
                      <div className="flex items-center gap-1">
                        <User size={16} />
                        {selectedStory.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(selectedStory.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-300 leading-relaxed">
                    {selectedStory.content}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-purple-400/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-1">
                        <Heart size={16} />
                        {selectedStory.likes} likes
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={16} />
                        {selectedStory.comments} comments
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={16} />
                        {selectedStory.views} views
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Empty State */}
          {sortedStories.length === 0 && (
            <AnimatedSection>
              <div className="text-center py-12">
                <Heart className="mx-auto text-purple-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-white mb-2">No stories found</h3>
                <p className="text-gray-300">Check back later for more inspiring WPL fan stories</p>
              </div>
            </AnimatedSection>
          )}
        </div>
      </div>
    </div>
  );
}
