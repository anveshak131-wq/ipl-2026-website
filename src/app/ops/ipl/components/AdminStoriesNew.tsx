'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Edit, Trash2, Plus, Save, X, Search, Calendar, User, Tag, Check, AlertCircle,
  TrendingUp, Brain, Sparkles, FileText, Globe, Clock, Heart, MessageSquare, Share2,
  Filter, Download, Upload, RefreshCw, Zap, Target, BarChart3, Users, Activity,
  ThumbsUp, ThumbsDown, Star, TrendingDown, Newspaper, PenTool, Image as ImageIcon,
  Video, Link2, Hash, Bell, Settings, Database, Wifi, Cloud
} from 'lucide-react';

// Enhanced interfaces with AI and online data features
interface FanStory {
  id: string;
  title: string;
  author: string;
  authorEmail: string;
  category: string;
  content: string;
  excerpt: string;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  submittedAt: string;
  publishedAt?: string;
  tags: string[];
  images: string[];
  videos: string[];
  links: string[];
  readingTime: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: {
    score: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    virality: number;
  };
  aiAnalysis?: StoryAI;
  seoData?: SEOData;
  moderationFlags?: ModerationFlag[];
}

interface StoryAI {
  qualityScore: number;
  readabilityScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  emotionalImpact: number;
  shareability: number;
  trendingPotential: number;
  suggestedTags: string[];
  improvements: string[];
  contentSummary: string;
  keyTopics: string[];
  factCheckResults: FactCheckResult[];
  plagiarismScore: number;
  recommendation: 'approve' | 'review' | 'reject';
  confidence: number;
}

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  readabilityScore: number;
  metaDescription: string;
  slug: string;
  featuredImage: string;
  wordCount: number;
}

interface ModerationFlag {
  type: 'spam' | 'inappropriate' | 'plagiarism' | 'offensive' | 'misinformation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  autoDetected: boolean;
  confidence: number;
}

interface FactCheckResult {
  claim: string;
  status: 'true' | 'false' | 'misleading' | 'unverifiable';
  confidence: number;
  sources: string[];
}

interface ContentSource {
  id: string;
  name: string;
  type: 'news' | 'blog' | 'social' | 'forum' | 'api';
  url: string;
  lastSync: string;
  status: 'active' | 'inactive' | 'error';
  articlesCount: number;
  aiGenerated: boolean;
}

interface TrendingTopic {
  id: string;
  topic: string;
  category: string;
  mentions: number;
  sentiment: number;
  growth: number;
  relatedTags: string[];
  lastUpdated: string;
}

export default function AdminStoriesNew() {
  const [stories, setStories] = useState<FanStory[]>([]);
  const [contentSources, setContentSources] = useState<ContentSource[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [editingStory, setEditingStory] = useState<FanStory | null>(null);
  const [selectedStory, setSelectedStory] = useState<FanStory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'featured'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'stories' | 'ai-tools' | 'trending' | 'sources'>('stories');
  const [aiWritingPrompt, setAiWritingPrompt] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load sample stories with AI analysis
      const sampleStories: FanStory[] = [
        {
          id: '1',
          title: 'My First IPL Experience: The Night CSK Made History',
          author: 'Rahul Sharma',
          authorEmail: 'rahul.s@example.com',
          category: 'match-experience',
          content: `It was a humid Chennai evening, the kind that makes you sweat even before stepping out. But tonight was different. Tonight was IPL final night at Chepauk. As a lifelong CSK fan, I had been waiting for this moment since I was a kid.

The stadium was electric. Yellow flags everywhere, the "Whistle Podu" chants echoing across the stands. I could feel the collective heartbeat of 50,000 fans pulsing through the concrete structure.

When Dhoni walked out to bat, the roar was deafening. This wasn't just a cricket match; it was a religious experience. Every boundary was a celebration, every wicket a moment of collective anxiety.

The final over... I still get goosebumps thinking about it. One run needed, one ball remaining. The entire stadium was on its feet. When that single run was scored, the explosion of joy was something I'll never forget.

Strangers hugged each other, people cried tears of happiness, and for one beautiful moment, we were all united by our love for this team and this game.

This is why I love cricket. This is why I love IPL.`,
          excerpt: 'A passionate fan recounts his emotional journey watching CSK win the IPL final at Chepauk stadium',
          status: 'approved',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['CSK', 'IPL Final', 'Dhoni', 'Chepauk', 'Fan Experience'],
          images: ['https://example.com/csk-stadium.jpg'],
          videos: [],
          links: ['https://www.iplt20.com/match/2023/final'],
          readingTime: 3,
          views: 1250,
          likes: 89,
          comments: 23,
          shares: 15,
          engagement: {
            score: 8.5,
            sentiment: 'positive',
            virality: 7.2
          },
          aiAnalysis: {
            qualityScore: 8.7,
            readabilityScore: 8.2,
            sentiment: 'positive',
            emotionalImpact: 9.1,
            shareability: 8.3,
            trendingPotential: 7.8,
            suggestedTags: ['emotional', 'stadium atmosphere', 'cricket passion', 'fan stories'],
            improvements: ['Add more specific details about the match', 'Include photos if available'],
            contentSummary: 'A heartwarming account of a CSK fan experiencing their first IPL final victory at Chepauk stadium',
            keyTopics: ['CSK', 'Dhoni', 'IPL Final', 'Fan Experience', 'Stadium Atmosphere'],
            factCheckResults: [],
            plagiarismScore: 2.1,
            recommendation: 'approve',
            confidence: 92
          },
          seoData: {
            title: 'My First IPL Experience: CSK Final Victory at Chepauk',
            description: 'A passionate fan shares his emotional journey watching Chennai Super Kings win the IPL final',
            keywords: ['CSK', 'IPL', 'Dhoni', 'Chepauk', 'cricket fan'],
            readabilityScore: 8.2,
            metaDescription: 'Experience the magic of IPL finals through the eyes of a die-hard CSK fan at Chepauk stadium',
            slug: 'my-first-ipl-experience-csk-final-chepauk',
            featuredImage: 'https://example.com/csk-celebration.jpg',
            wordCount: 245
          }
        },
        {
          id: '2',
          title: 'Why Virat Kohli is the Modern Cricket GOAT',
          author: 'Priya Nair',
          authorEmail: 'priya.n@example.com',
          category: 'player-fan',
          content: `Virat Kohli isn't just a cricketer; he's a phenomenon. In an era of T20 cricket where consistency is rare, Kohli has redefined what it means to be a modern batting great.

His numbers speak for themselves, but it's his mental toughness that sets him apart. The way he chases totals, the intensity in the field, the passion he brings to every game - it's unmatched.

I've been watching Kohli since his U-19 days. The transformation from an aggressive young player to a mature leader has been remarkable. He carries the weight of a billion expectations and still delivers.

What makes Kohli special is his ability to adapt. Whether it's Test cricket, ODIs, or T20s, he finds a way to dominate. His fitness regime has changed the game, inspiring a generation of cricketers to take their physical preparation seriously.

But beyond the stats and fitness, it's his love for the game that shines through. You can see it in the way he celebrates, the way he interacts with fans, the way he respects the sport.

For me, Kohli isn't just the GOAT of Indian cricket; he's one of the greatest the game has ever seen, worldwide.`,
          excerpt: 'An analytical piece on why Virat Kohli deserves the GOAT title in modern cricket',
          status: 'pending',
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['Virat Kohli', 'GOAT', 'RCB', 'Cricket Analysis', 'Modern Cricket'],
          images: [],
          videos: ['https://example.com/kohli-highlights.mp4'],
          links: ['https://www.espncricinfo.com/virat-kohli'],
          readingTime: 4,
          views: 450,
          likes: 67,
          comments: 12,
          shares: 8,
          engagement: {
            score: 7.2,
            sentiment: 'positive',
            virality: 6.5
          },
          aiAnalysis: {
            qualityScore: 7.8,
            readabilityScore: 8.5,
            sentiment: 'positive',
            emotionalImpact: 6.8,
            shareability: 7.1,
            trendingPotential: 6.2,
            suggestedTags: ['cricket analysis', 'player comparison', 'batting greatness', 'RCB'],
            improvements: ['Add statistical evidence', 'Include comparisons with other greats'],
            contentSummary: 'An argument for Virat Kohli being the greatest modern cricketer based on his consistency and mental toughness',
            keyTopics: ['Virat Kohli', 'GOAT debate', 'Modern Cricket', 'RCB', 'Cricket Analysis'],
            factCheckResults: [],
            plagiarismScore: 3.2,
            recommendation: 'review',
            confidence: 78
          },
          seoData: {
            title: 'Why Virat Kohli is the Modern Cricket GOAT - Analysis',
            description: 'An in-depth analysis of why Virat Kohli deserves to be called the Greatest of All Time in modern cricket',
            keywords: ['Virat Kohli', 'GOAT', 'cricket analysis', 'RCB', 'modern cricket'],
            readabilityScore: 8.5,
            metaDescription: 'Discover why Virat Kohli stands above the rest in modern cricket with this detailed analysis',
            slug: 'virat-kohli-modern-cricket-goat-analysis',
            featuredImage: 'https://example.com/kohli-batting.jpg',
            wordCount: 312
          }
        },
        {
          id: '3',
          title: 'The Hidden Gems of IPL: Lesser-Known Stadium Stories',
          author: 'Amit Patel',
          authorEmail: 'amit.p@example.com',
          category: 'venue-memory',
          content: `Everyone talks about Eden Gardens, Wankhede, or Chepauk. But IPL has some incredible venues that don't get the attention they deserve.

Take the Holkar Cricket Stadium in Indore. It might not be the biggest, but it has produced some of the most thrilling matches. The pitch is perfect for batting, and the crowd, while smaller, is incredibly passionate.

Or the ACA-VDCA Stadium in Visakhapatnam. The sea breeze, the beautiful backdrop, and the pitch that offers something for everyone - it's a cricket lover's paradise.

My personal favorite is the Barabati Stadium in Cuttack. There's something magical about watching cricket under the lights with the Mahanadi flowing nearby. The atmosphere is intimate, the fans are knowledgeable, and the cricket is always competitive.

These venues might not have the glamour of Mumbai or the history of Kolkata, but they have their own charm. They represent the true spirit of Indian cricket - spreading the game to every corner of the country.

Next time you're watching an IPL match from one of these "smaller" venues, take a moment to appreciate what they bring to the tournament. They're the unsung heroes of IPL.`,
          excerpt: 'Exploring the charm and character of lesser-known IPL venues that deserve more recognition',
          status: 'featured',
          submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['IPL Venues', 'Stadium Tour', 'Cricket Grounds', 'Hidden Gems', 'Stadium Stories'],
          images: ['https://example.com/indore-stadium.jpg', 'https://example.com/visakhapatnam-stadium.jpg'],
          videos: [],
          links: [],
          readingTime: 5,
          views: 2100,
          likes: 156,
          comments: 34,
          shares: 28,
          engagement: {
            score: 9.2,
            sentiment: 'positive',
            virality: 8.1
          },
          aiAnalysis: {
            qualityScore: 9.1,
            readabilityScore: 8.8,
            sentiment: 'positive',
            emotionalImpact: 7.5,
            shareability: 8.9,
            trendingPotential: 8.3,
            suggestedTags: ['stadium guide', 'IPL travel', 'cricket tourism', 'venue review'],
            improvements: ['Add more specific venue details', 'Include historical facts'],
            contentSummary: 'A celebration of lesser-known IPL venues and their unique contributions to the tournament',
            keyTopics: ['IPL Venues', 'Stadium Stories', 'Cricket Tourism', 'Hidden Gems'],
            factCheckResults: [],
            plagiarismScore: 1.8,
            recommendation: 'approve',
            confidence: 95
          },
          seoData: {
            title: 'Hidden Gems of IPL: Lesser-Known Stadium Stories',
            description: 'Discover the charm and character of IPL venues that deserve more recognition',
            keywords: ['IPL venues', 'stadium stories', 'cricket grounds', 'hidden gems'],
            readabilityScore: 8.8,
            metaDescription: 'Explore the lesser-known IPL venues and their unique charm in this comprehensive guide',
            slug: 'hidden-gems-ipl-lesser-known-stadium-stories',
            featuredImage: 'https://example.com/stadium-collage.jpg',
            wordCount: 387
          }
        }
      ];

      setStories(sampleStories);

      // Load content sources
      const sources: ContentSource[] = [
        {
          id: '1',
          name: 'ESPN Cricinfo',
          type: 'news',
          url: 'https://www.espncricinfo.com/rss/livescores.xml',
          lastSync: new Date().toISOString(),
          status: 'active',
          articlesCount: 1250,
          aiGenerated: false
        },
        {
          id: '2',
          name: 'Cricbuzz News',
          type: 'news',
          url: 'https://www.cricbuzz.com/rss/feed.xml',
          lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'active',
          articlesCount: 890,
          aiGenerated: false
        },
        {
          id: '3',
          name: 'AI Content Generator',
          type: 'api',
          url: 'https://api.openai.com/v1/completions',
          lastSync: new Date().toISOString(),
          status: 'active',
          articlesCount: 45,
          aiGenerated: true
        }
      ];
      setContentSources(sources);

      // Load trending topics
      const topics: TrendingTopic[] = [
        {
          id: '1',
          topic: 'IPL 2025 Auction',
          category: 'news',
          mentions: 15420,
          sentiment: 0.75,
          growth: 0.85,
          relatedTags: ['auction', 'teams', 'players', 'bidding'],
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          topic: 'MS Dhoni Retirement',
          category: 'player',
          mentions: 12350,
          sentiment: 0.65,
          growth: 0.92,
          relatedTags: ['dhoni', 'csk', 'retirement', 'legacy'],
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          topic: 'New IPL Venues',
          category: 'venue',
          mentions: 8760,
          sentiment: 0.80,
          growth: 0.67,
          relatedTags: ['stadiums', 'new venues', 'infrastructure', 'cities'],
          lastUpdated: new Date().toISOString()
        }
      ];
      setTrendingTopics(topics);

    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesFilter = filter === 'all' || story.status === filter;
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || story.category === categoryFilter;
    return matchesFilter && matchesSearch && matchesCategory;
  });

  const generateAIContent = async () => {
    if (!aiWritingPrompt.trim()) return;
    
    setAiGenerating(true);
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const aiGeneratedStory: FanStory = {
        id: Date.now().toString(),
        title: `AI Generated: ${aiWritingPrompt}`,
        author: 'AI Assistant',
        authorEmail: 'ai@sportsup18.com',
        category: 'ai-generated',
        content: `This is an AI-generated story about "${aiWritingPrompt}". 

In the world of cricket, ${aiWritingPrompt} represents an interesting phenomenon that deserves deeper analysis. The impact of this topic on IPL and cricket fans worldwide cannot be understated.

Recent trends show that ${aiWritingPrompt} has gained significant traction among cricket enthusiasts. The data suggests that this topic resonates strongly with the audience, generating substantial engagement across various platforms.

From a technical perspective, ${aiWritingPrompt} offers unique insights into the modern cricket landscape. The strategic implications for teams and players are profound, requiring careful consideration and adaptation.

As we look to the future of cricket, ${aiWritingPrompt} will likely continue to play a crucial role in shaping the sport. The evolution of this topic will be fascinating to watch unfold.`,
        excerpt: `AI-generated analysis and insights about ${aiWritingPrompt}`,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        tags: ['AI Generated', aiWritingPrompt.toLowerCase(), 'cricket analysis'],
        images: [],
        videos: [],
        links: [],
        readingTime: 2,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagement: {
          score: 5.0,
          sentiment: 'neutral',
          virality: 5.0
        },
        aiAnalysis: {
          qualityScore: 7.5,
          readabilityScore: 8.0,
          sentiment: 'neutral',
          emotionalImpact: 6.0,
          shareability: 7.0,
          trendingPotential: 6.5,
          suggestedTags: ['ai content', 'automated', 'cricket insights'],
          improvements: ['Add more specific examples', 'Include expert quotes'],
          contentSummary: `AI-generated content about ${aiWritingPrompt} with cricket insights`,
          keyTopics: [aiWritingPrompt, 'AI Analysis', 'Cricket Trends'],
          factCheckResults: [],
          plagiarismScore: 0,
          recommendation: 'review',
          confidence: 75
        },
        seoData: {
          title: `AI Analysis: ${aiWritingPrompt}`,
          description: `AI-generated insights about ${aiWritingPrompt} in cricket`,
          keywords: [aiWritingPrompt, 'AI', 'cricket analysis'],
          readabilityScore: 8.0,
          metaDescription: `Discover AI-powered insights about ${aiWritingPrompt} in modern cricket`,
          slug: `ai-analysis-${aiWritingPrompt.toLowerCase().replace(/\s+/g, '-')}`,
          featuredImage: '',
          wordCount: 180
        }
      };

      setStories([aiGeneratedStory, ...stories]);
      setAiWritingPrompt('');
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const syncContentSources = async () => {
    setSyncing(true);
    try {
      // Simulate syncing with external sources
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedSources = contentSources.map(source => ({
        ...source,
        lastSync: new Date().toISOString(),
        articlesCount: source.articlesCount + Math.floor(Math.random() * 10)
      }));
      
      setContentSources(updatedSources);
    } catch (error) {
      console.error('Error syncing content sources:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusChange = (id: string, status: 'approved' | 'rejected' | 'featured') => {
    setStories(stories.map(s => s.id === id ? { 
      ...s, 
      status,
      publishedAt: status === 'approved' ? new Date().toISOString() : s.publishedAt
    } : s));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'featured': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'match-experience': return 'Match Experience';
      case 'player-fan': return 'Player Fan';
      case 'venue-memory': return 'Venue Memory';
      case 'cricket-journey': return 'Cricket Journey';
      case 'emotional-moment': return 'Emotional Moment';
      case 'ai-generated': return 'AI Generated';
      default: return category;
    }
  };

  const getEngagementColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="px-6">
      <div className="mb-8 pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <PenTool className="text-blue-400" />
              AI-Powered Stories Admin
            </h1>
            <p className="text-gray-300 max-w-3xl">
              Advanced content management with AI analysis, automated moderation, and intelligent content generation for IPL fan stories
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={syncContentSources}
              disabled={syncing}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Sources
            </motion.button>
            <motion.button
              onClick={() => {/* Export functionality */}}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['stories', 'ai-tools', 'trending', 'sources'].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab === 'stories' && <FileText size={18} />}
            {tab === 'ai-tools' && <Brain size={18} />}
            {tab === 'trending' && <TrendingUp size={18} />}
            {tab === 'sources' && <Database size={18} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Stories Tab with AI Enhancement */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
          {/* Advanced Filters and Search */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search stories, authors, content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800/50 text-white rounded-lg pl-10 pr-4 py-3 border border-blue-400/20"
                />
              </div>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-slate-800/50 text-white rounded-lg px-4 py-3 border border-blue-400/20"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="featured">Featured</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-800/50 text-white rounded-lg px-4 py-3 border border-blue-400/20"
              >
                <option value="all">All Categories</option>
                <option value="match-experience">Match Experience</option>
                <option value="player-fan">Player Fan</option>
                <option value="venue-memory">Venue Memory</option>
                <option value="cricket-journey">Cricket Journey</option>
                <option value="emotional-moment">Emotional Moment</option>
                <option value="ai-generated">AI Generated</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setCategoryFilter('all');
                }}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <Filter size={16} />
                Clear
              </button>
            </div>
          </div>

          {/* Stories Grid with AI Insights */}
          <div className="grid gap-6">
            {filteredStories.map((story) => (
              <motion.div
                key={story.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{story.title}</h3>
                      {story.aiAnalysis && (
                        <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs flex items-center gap-1">
                          <Sparkles size={10} />
                          AI Enhanced
                        </span>
                      )}
                      {story.status === 'featured' && (
                        <span className="px-2 py-1 bg-yellow-600/30 text-yellow-300 rounded-full text-xs flex items-center gap-1">
                          <Star size={10} />
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-300 text-sm mb-3">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {story.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(story.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded-full text-xs">
                        {getCategoryLabel(story.category)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {story.readingTime} min read
                      </span>
                    </div>

                    <p className="text-gray-300 mb-4 line-clamp-3">{story.excerpt}</p>

                    {/* Engagement Metrics */}
                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {story.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={14} />
                        {story.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        {story.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 size={14} />
                        {story.shares}
                      </span>
                      <span className={`flex items-center gap-1 ${getEngagementColor(story.engagement.score)}`}>
                        <Activity size={14} />
                        {story.engagement.score.toFixed(1)}
                      </span>
                    </div>

                    {/* Tags */}
                    {story.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {story.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs flex items-center gap-1"
                          >
                            <Hash size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Analysis Preview */}
                    {story.aiAnalysis && (
                      <div className="bg-purple-600/10 rounded-lg p-4 border border-purple-400/20 mb-4">
                        <h4 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                          <Brain size={16} />
                          AI Analysis
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-purple-400">Quality:</span>
                            <span className="text-gray-300 ml-1">{story.aiAnalysis.qualityScore.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-purple-400">Readability:</span>
                            <span className="text-gray-300 ml-1">{story.aiAnalysis.readabilityScore.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-purple-400">Emotional:</span>
                            <span className="text-gray-300 ml-1">{story.aiAnalysis.emotionalImpact.toFixed(1)}</span>
                          </div>
                          <div>
                            <span className="text-purple-400">Shareability:</span>
                            <span className="text-gray-300 ml-1">{story.aiAnalysis.shareability.toFixed(1)}</span>
                          </div>
                        </div>
                        {story.aiAnalysis.suggestedTags.length > 0 && (
                          <div className="mt-2">
                            <span className="text-purple-400 text-sm">Suggested tags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {story.aiAnalysis.suggestedTags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-xs text-purple-300 bg-purple-600/20 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <motion.button
                      onClick={() => setSelectedStory(story)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Eye size={16} />
                    </motion.button>
                    <motion.button
                      onClick={() => setEditingStory(story)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit size={16} />
                    </motion.button>
                    <motion.button
                      onClick={() => {/* Delete functionality */}}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                    {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                  </span>
                  
                  {story.status === 'pending' && (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleStatusChange(story.id, 'approved')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Check size={14} />
                        Approve
                      </motion.button>
                      <motion.button
                        onClick={() => handleStatusChange(story.id, 'rejected')}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X size={14} />
                        Reject
                      </motion.button>
                      <motion.button
                        onClick={() => handleStatusChange(story.id, 'featured')}
                        className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm flex items-center gap-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Star size={14} />
                        Feature
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredStories.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 text-lg">No stories found matching your criteria.</div>
            </div>
          )}
        </div>
      )}

      {/* AI Tools Tab */}
      {activeTab === 'ai-tools' && (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Brain className="text-purple-400" />
              AI Content Generation Tools
            </h2>

            {/* AI Content Generator */}
            <div className="bg-purple-600/10 rounded-lg p-6 border border-purple-400/20 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="text-purple-400" />
                AI Story Generator
              </h3>
              <div className="space-y-4">
                <textarea
                  placeholder="Enter a topic or prompt for AI to generate a story about..."
                  value={aiWritingPrompt}
                  onChange={(e) => setAiWritingPrompt(e.target.value)}
                  className="w-full p-4 bg-slate-700 text-white border border-slate-600 rounded-lg h-32 resize-none"
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    AI will generate a complete story with analysis and SEO optimization
                  </div>
                  <motion.button
                    onClick={generateAIContent}
                    disabled={aiGenerating || !aiWritingPrompt.trim()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Brain className={`w-4 h-4 ${aiGenerating ? 'animate-pulse' : ''}`} />
                    {aiGenerating ? 'Generating...' : 'Generate Story'}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* AI Analysis Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-600/10 rounded-lg p-6 border border-blue-400/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="text-blue-400" />
                  Content Analysis
                </h3>
                <div className="space-y-3">
                  <button className="w-full p-3 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 text-left">
                    Analyze All Pending Stories
                  </button>
                  <button className="w-full p-3 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 text-left">
                    Generate SEO Recommendations
                  </button>
                  <button className="w-full p-3 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 text-left">
                    Check for Plagiarism
                  </button>
                  <button className="w-full p-3 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 text-left">
                    Sentiment Analysis
                  </button>
                </div>
              </div>

              <div className="bg-green-600/10 rounded-lg p-6 border border-green-400/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="text-green-400" />
                  Content Optimization
                </h3>
                <div className="space-y-3">
                  <button className="w-full p-3 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 text-left">
                    Optimize for Engagement
                  </button>
                  <button className="w-full p-3 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 text-left">
                    Generate Trending Tags
                  </button>
                  <button className="w-full p-3 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 text-left">
                    Improve Readability
                  </button>
                  <button className="w-full p-3 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 text-left">
                    Create Social Media Snippets
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Topics Tab */}
      {activeTab === 'trending' && (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-blue-400" />
              Trending Topics & Insights
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingTopics.map((topic) => (
                <motion.div
                  key={topic.id}
                  className="bg-white/5 rounded-lg p-4 border border-blue-400/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-white">{topic.topic}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      topic.growth > 0.8 ? 'bg-green-600/30 text-green-300' :
                      topic.growth > 0.5 ? 'bg-yellow-600/30 text-yellow-300' :
                      'bg-red-600/30 text-red-300'
                    }`}>
                      {topic.growth > 0 ? '+' : ''}{(topic.growth * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mentions:</span>
                      <span className="text-white">{topic.mentions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sentiment:</span>
                      <span className={`font-medium ${
                        topic.sentiment > 0.6 ? 'text-green-400' :
                        topic.sentiment > 0.3 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {(topic.sentiment * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-blue-300">{topic.category}</span>
                    </div>
                  </div>

                  {topic.relatedTags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-400 mb-2">Related tags:</div>
                      <div className="flex flex-wrap gap-1">
                        {topic.relatedTags.map((tag, i) => (
                          <span key={i} className="text-xs text-blue-300 bg-blue-600/20 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Sources Tab */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Database className="text-blue-400" />
                Content Sources & APIs
              </h2>
              <motion.button
                onClick={() => {/* Add new source */}}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={20} />
                Add Source
              </motion.button>
            </div>

            <div className="space-y-4">
              {contentSources.map((source) => (
                <div
                  key={source.id}
                  className="bg-white/5 rounded-lg p-4 border border-blue-400/10"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{source.name}</h3>
                        {source.aiGenerated && (
                          <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs flex items-center gap-1">
                            <Brain size={10} />
                            AI Powered
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          source.status === 'active' ? 'bg-green-600/30 text-green-300' :
                          source.status === 'inactive' ? 'bg-gray-600/30 text-gray-300' :
                          'bg-red-600/30 text-red-300'
                        }`}>
                          {source.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-400" />
                          <span className="truncate">{source.url}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-400" />
                          {source.articlesCount.toLocaleString()} articles
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          Last sync: {new Date(source.lastSync).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <motion.button
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Settings size={16} />
                      </motion.button>
                      <motion.button
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStory && (
        <StoryEditModal
          story={editingStory}
          onSave={(story) => {
            if (editingStory.id) {
              setStories(stories.map(s => s.id === story.id ? story : s));
            } else {
              setStories([...stories, { ...story, id: Date.now().toString(), submittedAt: new Date().toISOString() }]);
            }
            setEditingStory(null);
          }}
          onCancel={() => setEditingStory(null)}
        />
      )}

      {/* View Modal */}
      {selectedStory && (
        <StoryViewModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </div>
  );
}

// Enhanced Story Edit Modal
function StoryEditModal({ story, onSave, onCancel }: {
  story: FanStory;
  onSave: (story: FanStory) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(story);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-slate-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit className="text-blue-400" />
            {story.id ? 'Edit Story' : 'Create New Story'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="text"
            placeholder="Author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <input
            type="email"
            placeholder="Author Email"
            value={formData.authorEmail}
            onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          >
            <option value="">Select Category</option>
            <option value="match-experience">Match Experience</option>
            <option value="player-fan">Player Fan</option>
            <option value="venue-memory">Venue Memory</option>
            <option value="cricket-journey">Cricket Journey</option>
            <option value="emotional-moment">Emotional Moment</option>
            <option value="ai-generated">AI Generated</option>
          </select>
        </div>

        <div className="space-y-4 mb-4">
          <textarea
            placeholder="Story Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-lg h-48 resize-none"
          />
          <textarea
            placeholder="Excerpt (short description)"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-lg h-24 resize-none"
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={formData.tags.join(', ')}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
            className="w-full p-3 bg-slate-700 text-white border border-slate-600 rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <motion.button
            onClick={() => onSave(formData)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save size={16} />
            Save Story
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Enhanced Story View Modal
function StoryViewModal({ story, onClose }: {
  story: FanStory;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-slate-800 rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">{story.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Story Metadata */}
          <div className="flex items-center gap-4 text-gray-300 text-sm border-b border-gray-700 pb-4">
            <span className="flex items-center gap-1">
              <User size={14} />
              {story.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(story.submittedAt).toLocaleDateString()}
            </span>
            <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded-full text-xs">
              {story.category}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {story.readingTime} min read
            </span>
          </div>
          
          {/* Story Content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {story.content}
            </p>
          </div>
          
          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {story.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm flex items-center gap-1"
                >
                  <Hash size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Engagement Metrics */}
          <div className="bg-white/5 rounded-lg p-4 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-3">Engagement Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{story.views.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{story.likes}</div>
                <div className="text-sm text-gray-400">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{story.comments}</div>
                <div className="text-sm text-gray-400">Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{story.shares}</div>
                <div className="text-sm text-gray-400">Shares</div>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {story.aiAnalysis && (
            <div className="bg-purple-600/10 rounded-lg p-4 border border-purple-400/20">
              <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <Brain size={18} />
                AI Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-purple-400">Quality Score:</span>
                    <span className="text-white font-medium">{story.aiAnalysis.qualityScore.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400">Readability:</span>
                    <span className="text-white font-medium">{story.aiAnalysis.readabilityScore.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400">Emotional Impact:</span>
                    <span className="text-white font-medium">{story.aiAnalysis.emotionalImpact.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400">Shareability:</span>
                    <span className="text-white font-medium">{story.aiAnalysis.shareability.toFixed(1)}/10</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-purple-400">Content Summary:</span>
                    <p className="text-gray-300 text-sm mt-1">{story.aiAnalysis.contentSummary}</p>
                  </div>
                  <div>
                    <span className="text-purple-400">AI Recommendation:</span>
                    <div className={`mt-1 px-2 py-1 rounded-full text-xs inline-block ${
                      story.aiAnalysis.recommendation === 'approve' ? 'bg-green-600/30 text-green-300' :
                      story.aiAnalysis.recommendation === 'review' ? 'bg-yellow-600/30 text-yellow-300' :
                      'bg-red-600/30 text-red-300'
                    }`}>
                      {story.aiAnalysis.recommendation.toUpperCase()} ({story.aiAnalysis.confidence.toFixed(0)}% confidence)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
