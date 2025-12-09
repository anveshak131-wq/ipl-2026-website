'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { useLeague } from '@/contexts/LeagueContext';
import { League } from '@/types';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Clock, 
  Star,
  Trophy,
  Camera,
  Send,
  Filter,
  TrendingUp,
  Calendar,
  User,
  ChevronDown,
  X,
  Plus,
  Image as ImageIcon
} from 'lucide-react';

interface FanStory {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    favoriteTeam?: string;
  };
  category: 'match-experience' | 'player-fan' | 'venue-visit' | 'memorable-moment' | 'collection' | 'other';
  league?: League | 'both';
  matchId?: string;
  teamId?: string;
  playerId?: string;
  images?: string[];
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  featured: boolean;
  verified: boolean;
}

// Mock data - in real app, this would come from API
const mockStories: FanStory[] = [
  {
    id: '1',
    title: 'My First IPL Match - RCB vs MI at Chinnaswamy',
    content: 'The atmosphere was electric! I had been waiting for this moment my entire life. The roar of the crowd when Kohli walked out to bat was something I\'ll never forget. The chants of "RCB RCB" echoed throughout the stadium. When AB hit that massive six over long-on, the entire stadium erupted. I was sitting in the stands with my father, who had been an RCB fan since the beginning. We both had tears in our eyes. This wasn\'t just a cricket match; it was an emotion, a memory that I\'ll cherish forever.',
    author: {
      name: 'Rahul Kumar',
      favoriteTeam: 'RCB'
    },
    category: 'match-experience',
    league: 'ipl',
    teamId: 'rcb',
    tags: ['RCB', 'Kohli', 'ABD', 'Chinnaswamy', 'First Match'],
    likes: 342,
    comments: 28,
    shares: 15,
    createdAt: '2024-12-08T10:30:00Z',
    featured: true,
    verified: true
  },
  {
    id: '2',
    title: 'Meeting Smriti Mandhana - A Dream Come True',
    content: 'I\'ve been following women\'s cricket since the WPL began, and Smriti Mandhana has always been my role model. Last week, I got the chance to meet her at a cricket clinic in Mumbai. She was so humble and down-to-earth. She gave me batting tips and even signed my jersey. She told me, "Never stop believing in yourself, no matter what anyone says." Those words meant everything to me. I\'ve been practicing harder than ever, hoping to play professional cricket one day. This experience has motivated me to pursue my dreams relentlessly.',
    author: {
      name: 'Priya Sharma',
      favoriteTeam: 'RCB-W'
    },
    category: 'player-fan',
    league: 'wpl',
    playerId: 'smriti-mandhana',
    tags: ['Smriti Mandhana', 'WPL', 'Inspiration', 'Meeting', 'RCB-W'],
    likes: 289,
    comments: 34,
    shares: 12,
    createdAt: '2024-12-07T15:45:00Z',
    featured: true,
    verified: true
  },
  {
    id: '3',
    title: 'The Ultimate Collection - 15 Years of IPL Memorabilia',
    content: 'My journey as an IPL fan started in 2008. Since then, I\'ve collected everything from tickets of every match I\'ve attended to autographed jerseys, signed balls, and limited edition merchandise. My prized possession is a ball signed by the entire 2013 Chennai Super Kings team - the year they won their first title. I have jerseys from all seasons, player cards, and even some rare items like the first-ever IPL ticket booklet. My room is basically an IPL museum now. Every item tells a story, every signature holds a memory. This collection represents 15 years of passion, dedication, and love for the game.',
    author: {
      name: 'Amit Patel',
      favoriteTeam: 'CSK'
    },
    category: 'collection',
    league: 'both',
    tags: ['Collection', 'Memorabilia', 'CSK', '15 Years', 'Autographs'],
    likes: 567,
    comments: 45,
    shares: 23,
    createdAt: '2024-12-06T12:00:00Z',
    featured: true,
    verified: true
  }
];

const categories = [
  { value: 'all', label: 'All Stories', icon: TrendingUp },
  { value: 'match-experience', label: 'Match Experience', icon: Trophy },
  { value: 'player-fan', label: 'Player Fan', icon: Star },
  { value: 'venue-visit', label: 'Venue Visit', icon: Camera },
  { value: 'memorable-moment', label: 'Memorable Moment', icon: Heart },
  { value: 'collection', label: 'Collection', icon: Trophy },
  { value: 'other', label: 'Other', icon: MessageCircle }
];

export default function FanStoriesPage() {
  const { currentLeague } = useLeague();
  const [stories, setStories] = useState<FanStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<FanStory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStory, setSelectedStory] = useState<FanStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');

  useEffect(() => {
    const loadStories = async () => {
      try {
        // In real app, this would be an API call
        setStories(mockStories);
        setFilteredStories(mockStories);
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, []);

  useEffect(() => {
    let filtered = stories;

    // Filter by league
    if (currentLeague !== 'both') {
      filtered = filtered.filter(story => 
        story.league === currentLeague || story.league === 'both'
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(story => story.category === selectedCategory);
    }

    // Sort stories
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes;
        case 'trending':
          return (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares);
        case 'latest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredStories(filtered);
  }, [stories, currentLeague, selectedCategory, sortBy]);

  const getCategoryIcon = (categoryValue: string) => {
    const category = categories.find(c => c.value === categoryValue);
    return category ? category.icon : MessageCircle;
  };

  const getCategoryLabel = (categoryValue: string) => {
    const category = categories.find(c => c.value === categoryValue);
    return category ? category.label : 'Other';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />
      <AuroraBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <AnimatedSection>
          <div className="text-center mb-12">
            <GradientText 
              className="text-5xl font-bold mb-4" 
              text="Fan Stories"
            />
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Share your cricket experiences and read stories from fellow fans
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Share Your Story
              </motion.button>
            </div>
          </div>
        </AnimatedSection>

        {/* Filters and Sort */}
        <AnimatedSection delay={0.1}>
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      selectedCategory === category.value
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{category.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-800 text-white px-3 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
              </select>
            </div>
          </div>
        </AnimatedSection>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story, index) => {
            const CategoryIcon = getCategoryIcon(story.category);
            return (
              <AnimatedSection key={story.id} delay={index * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStory(story)}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 cursor-pointer hover:border-purple-500 transition-all"
                >
                  {/* Story Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{story.author.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatDate(story.createdAt)}
                        </div>
                      </div>
                    </div>
                    {story.featured && (
                      <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Story Content */}
                  <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-gray-300 mb-4 line-clamp-3">
                    {story.content}
                  </p>

                  {/* Category and Tags */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs">
                      <CategoryIcon className="w-3 h-3" />
                      <span>{getCategoryLabel(story.category)}</span>
                    </div>
                    {story.league && (
                      <div className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-semibold">
                        {story.league.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {story.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-slate-700 text-gray-300 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    {story.tags.length > 3 && (
                      <span className="px-2 py-1 bg-slate-700 text-gray-400 rounded-full text-xs">
                        +{story.tags.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{story.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{story.comments}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm">{story.shares}</span>
                      </div>
                    </div>
                    {story.verified && (
                      <div className="text-green-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatedSection>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredStories.length === 0 && (
          <AnimatedSection delay={0.3}>
            <div className="text-center py-16">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">No stories found</h3>
              <p className="text-gray-400 mb-6">
                Be the first to share your cricket experience!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg"
              >
                Share Your Story
              </motion.button>
            </div>
          </AnimatedSection>
        )}

        {/* Story Detail Modal */}
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedStory.author.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatDate(selectedStory.createdAt)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">{selectedStory.title}</h2>
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">
                    {getCategoryLabel(selectedStory.category)}
                  </div>
                  {selectedStory.league && (
                    <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-semibold">
                      {selectedStory.league.toUpperCase()}
                    </div>
                  )}
                  {selectedStory.featured && (
                    <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                      Featured
                    </div>
                  )}
                </div>

                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {selectedStory.content}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedStory.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-700 text-gray-300 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-6">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex items-center gap-2 text-gray-400 hover:text-red-400"
                    >
                      <Heart className="w-5 h-5" />
                      <span>{selectedStory.likes}</span>
                    </motion.button>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MessageCircle className="w-5 h-5" />
                      <span>{selectedStory.comments}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Share2 className="w-5 h-5" />
                      <span>{selectedStory.shares}</span>
                    </div>
                  </div>
                  {selectedStory.verified && (
                    <div className="text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
