'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Sparkles, TrendingUp, AlertTriangle, Calendar, Settings,
  Activity, Zap, Target, BarChart3, Users, RefreshCw, Plus,
  Edit, Save, X, ChevronRight, ChevronDown, Filter, Search,
  Eye, Heart, MessageSquare, Share2, Clock, FileText, Hash,
  Database, Globe, Shield, CheckCircle, XCircle, AlertCircle,
  TrendingUp as TrendingIcon, Download, Upload, Play, Pause, PenTool
} from 'lucide-react';

// Add global styles to disable scrolling
const noScrollStyles = `
  html, body {
    overflow: hidden !important;
    height: 100vh !important;
    position: fixed !important;
    width: 100vw !important;
  }
  
  #__next {
    height: 100vh !important;
    overflow: hidden !important;
  }
`;

// Advanced interfaces with comprehensive AI features
interface FanStory {
  id: string;
  title: string;
  author: string;
  authorEmail: string;
  category: string;
  content: string;
  excerpt: string;
  status: 'pending' | 'approved' | 'rejected' | 'featured' | 'ai-generated';
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
    reach: number;
  };
  aiAnalysis?: StoryAI;
  seoData?: SEOData;
  moderationFlags?: ModerationFlag[];
  performance: StoryPerformance;
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
  aiGenerated: boolean;
  contentGaps: string[];
  enhancementSuggestions: string[];
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
  estimatedCTR: number;
  searchRanking: number;
}

interface StoryPerformance {
  dailyViews: number[];
  engagementRate: number;
  avgTimeOnPage: number;
  bounceRate: number;
  socialShares: number;
  conversionRate: number;
  revenueGenerated: number;
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
  reliability: number;
  contentType: string[];
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
  predictedTrend: number;
  viralPotential: number;
}

interface AIContentGenerator {
  prompt: string;
  category: string;
  tone: 'professional' | 'casual' | 'enthusiastic' | 'analytical';
  length: 'short' | 'medium' | 'long';
  targetAudience: string;
  keywords: string[];
  includeImages: boolean;
  includeVideos: boolean;
}

export default function AdminStoriesAdvanced() {
  const [stories, setStories] = useState<FanStory[]>([]);
  const [contentSources, setContentSources] = useState<ContentSource[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'stories' | 'ai-tools' | 'analytics' | 'sources'>('dashboard');
  const [selectedStory, setSelectedStory] = useState<FanStory | null>(null);
  const [editingStory, setEditingStory] = useState<FanStory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'featured'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'engagement' | 'views' | 'ai-score'>('date');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [aiGenerator, setAiGenerator] = useState<AIContentGenerator>({
    prompt: '',
    category: 'match-experience',
    tone: 'enthusiastic',
    length: 'medium',
    targetAudience: 'cricket fans',
    keywords: [],
    includeImages: false,
    includeVideos: false
  });

  useEffect(() => {
    // Inject styles to disable scrolling
    const styleElement = document.createElement('style');
    styleElement.textContent = noScrollStyles;
    document.head.appendChild(styleElement);
    
    loadInitialData();
    
    // Cleanup styles on unmount
    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load enhanced sample data with comprehensive AI features
      const sampleStories: FanStory[] = [
        {
          id: '1',
          title: 'The Night Dhoni Made History: A Fan\'s Emotional Journey',
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
          status: 'featured',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['CSK', 'IPL Final', 'Dhoni', 'Chepauk', 'Fan Experience', 'Emotional'],
          images: ['https://example.com/csk-stadium.jpg', 'https://example.com/dhoni-celebration.jpg'],
          videos: ['https://example.com/final-over.mp4'],
          links: ['https://www.iplt20.com/match/2023/final'],
          readingTime: 3,
          views: 15420,
          likes: 892,
          comments: 234,
          shares: 156,
          engagement: {
            score: 9.2,
            sentiment: 'positive',
            virality: 8.7,
            reach: 45000
          },
          aiAnalysis: {
            qualityScore: 9.1,
            readabilityScore: 8.8,
            sentiment: 'positive',
            emotionalImpact: 9.5,
            shareability: 9.2,
            trendingPotential: 8.9,
            suggestedTags: ['emotional', 'stadium atmosphere', 'cricket passion', 'fan stories', 'dhoni legacy'],
            improvements: ['Add more specific details about the match', 'Include photos if available'],
            contentSummary: 'A heartwarming account of a CSK fan experiencing their first IPL final victory at Chepauk stadium',
            keyTopics: ['CSK', 'Dhoni', 'IPL Final', 'Fan Experience', 'Stadium Atmosphere', 'Emotional Journey'],
            factCheckResults: [],
            plagiarismScore: 1.2,
            recommendation: 'approve',
            confidence: 95,
            aiGenerated: false,
            contentGaps: ['Match statistics', 'Player performances'],
            enhancementSuggestions: ['Add video clips', 'Include fan reactions']
          },
          seoData: {
            title: 'My First IPL Experience: CSK Final Victory at Chepauk',
            description: 'A passionate fan shares his emotional journey watching Chennai Super Kings win the IPL final',
            keywords: ['CSK', 'IPL', 'Dhoni', 'Chepauk', 'cricket fan', 'emotional story'],
            readabilityScore: 8.8,
            metaDescription: 'Experience the magic of IPL finals through the eyes of a die-hard CSK fan at Chepauk stadium',
            slug: 'my-first-ipl-experience-csk-final-chepauk',
            featuredImage: 'https://example.com/csk-celebration.jpg',
            wordCount: 245,
            estimatedCTR: 8.5,
            searchRanking: 12
          },
          performance: {
            dailyViews: [120, 450, 890, 1200, 1542, 2100, 1542],
            engagementRate: 12.5,
            avgTimeOnPage: 245,
            bounceRate: 35,
            socialShares: 156,
            conversionRate: 3.2,
            revenueGenerated: 450
          }
        },
        {
          id: '2',
          title: 'Why Virat Kohli is the Modern Cricket GOAT: Data-Driven Analysis',
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
          status: 'approved',
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['Virat Kohli', 'GOAT', 'RCB', 'Cricket Analysis', 'Modern Cricket'],
          images: [],
          videos: ['https://example.com/kohli-highlights.mp4'],
          links: ['https://www.espncricinfo.com/virat-kohli'],
          readingTime: 4,
          views: 8750,
          likes: 567,
          comments: 89,
          shares: 45,
          engagement: {
            score: 7.8,
            sentiment: 'positive',
            virality: 6.8,
            reach: 25000
          },
          aiAnalysis: {
            qualityScore: 8.2,
            readabilityScore: 8.9,
            sentiment: 'positive',
            emotionalImpact: 7.2,
            shareability: 7.5,
            trendingPotential: 7.1,
            suggestedTags: ['cricket analysis', 'player comparison', 'batting greatness', 'RCB', 'kohli records'],
            improvements: ['Add statistical evidence', 'Include comparisons with other greats'],
            contentSummary: 'An argument for Virat Kohli being the greatest modern cricketer based on his consistency and mental toughness',
            keyTopics: ['Virat Kohli', 'GOAT debate', 'Modern Cricket', 'RCB', 'Cricket Analysis'],
            factCheckResults: [],
            plagiarismScore: 2.8,
            recommendation: 'approve',
            confidence: 88,
            aiGenerated: false,
            contentGaps: ['Statistical comparisons', 'Historical context'],
            enhancementSuggestions: ['Add infographics', 'Include expert quotes']
          },
          seoData: {
            title: 'Why Virat Kohli is the Modern Cricket GOAT - Analysis',
            description: 'An in-depth analysis of why Virat Kohli deserves to be called the Greatest of All Time in modern cricket',
            keywords: ['Virat Kohli', 'GOAT', 'cricket analysis', 'RCB', 'modern cricket'],
            readabilityScore: 8.9,
            metaDescription: 'Discover why Virat Kohli stands above the rest in modern cricket with this detailed analysis',
            slug: 'virat-kohli-modern-cricket-goat-analysis',
            featuredImage: 'https://example.com/kohli-batting.jpg',
            wordCount: 312,
            estimatedCTR: 6.8,
            searchRanking: 18
          },
          performance: {
            dailyViews: [200, 450, 670, 890, 1200, 875, 875],
            engagementRate: 8.9,
            avgTimeOnPage: 189,
            bounceRate: 42,
            socialShares: 45,
            conversionRate: 2.1,
            revenueGenerated: 280
          }
        }
      ];

      const sampleSources: ContentSource[] = [
        {
          id: '1',
          name: 'ESPN Cricinfo',
          type: 'news',
          url: 'https://www.espncricinfo.com/rss/livescores.xml',
          lastSync: new Date().toISOString(),
          status: 'active',
          articlesCount: 2450,
          aiGenerated: false,
          reliability: 9.2,
          contentType: ['match-reports', 'player-interviews', 'analysis']
        },
        {
          id: '2',
          name: 'Cricbuzz News',
          type: 'news',
          url: 'https://www.cricbuzz.com/rss/feed.xml',
          lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'active',
          articlesCount: 1890,
          aiGenerated: false,
          reliability: 8.7,
          contentType: ['news', 'updates', 'scores']
        },
        {
          id: '3',
          name: 'AI Content Generator',
          type: 'api',
          url: 'https://api.openai.com/v1/completions',
          lastSync: new Date().toISOString(),
          status: 'active',
          articlesCount: 145,
          aiGenerated: true,
          reliability: 7.8,
          contentType: ['ai-stories', 'analysis', 'predictions']
        }
      ];

      const sampleTopics: TrendingTopic[] = [
        {
          id: '1',
          topic: 'IPL 2025 Auction',
          category: 'news',
          mentions: 25420,
          sentiment: 0.78,
          growth: 0.92,
          relatedTags: ['auction', 'teams', 'players', 'bidding', 'retention'],
          lastUpdated: new Date().toISOString(),
          predictedTrend: 0.85,
          viralPotential: 8.9
        },
        {
          id: '2',
          topic: 'MS Dhoni Retirement',
          category: 'player',
          mentions: 18950,
          sentiment: 0.65,
          growth: 0.78,
          relatedTags: ['dhoni', 'csk', 'retirement', 'legacy', 'captain'],
          lastUpdated: new Date().toISOString(),
          predictedTrend: 0.72,
          viralPotential: 8.2
        },
        {
          id: '3',
          topic: 'New IPL Venues',
          category: 'venue',
          mentions: 12760,
          sentiment: 0.82,
          growth: 0.67,
          relatedTags: ['stadiums', 'new venues', 'infrastructure', 'cities', 'development'],
          lastUpdated: new Date().toISOString(),
          predictedTrend: 0.68,
          viralPotential: 7.5
        }
      ];

      setStories(sampleStories);
      setContentSources(sampleSources);
      setTrendingTopics(sampleTopics);
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  }, []);

  const generateAIContent = async () => {
    if (!aiGenerator.prompt.trim()) return;
    
    setAiGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const aiGeneratedStory: FanStory = {
        id: Date.now().toString(),
        title: `AI Generated: ${aiGenerator.prompt}`,
        author: 'AI Assistant',
        authorEmail: 'ai@sportsup18.com',
        category: aiGenerator.category,
        content: `This is an AI-generated story about "${aiGenerator.prompt}". 

In the world of cricket, ${aiGenerator.prompt} represents an interesting phenomenon that deserves deeper analysis. The impact of this topic on IPL and cricket fans worldwide cannot be understated.

Recent trends show that ${aiGenerator.prompt} has gained significant traction among cricket enthusiasts. The data suggests that this topic resonates strongly with the audience, generating substantial engagement across various platforms.

From a technical perspective, ${aiGenerator.prompt} offers unique insights into the modern cricket landscape. The strategic implications for teams and players are profound, requiring careful consideration and adaptation.

As we look to the future of cricket, ${aiGenerator.prompt} will likely continue to play a crucial role in shaping the sport. The evolution of this topic will be fascinating to watch unfold.`,
        excerpt: `AI-generated analysis and insights about ${aiGenerator.prompt}`,
        status: 'ai-generated',
        submittedAt: new Date().toISOString(),
        tags: ['AI Generated', aiGenerator.prompt.toLowerCase(), 'cricket analysis'],
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
          virality: 5.0,
          reach: 0
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
          contentSummary: `AI-generated content about ${aiGenerator.prompt} with cricket insights`,
          keyTopics: [aiGenerator.prompt, 'AI Analysis', 'Cricket Trends'],
          factCheckResults: [],
          plagiarismScore: 0,
          recommendation: 'review',
          confidence: 75,
          aiGenerated: true,
          contentGaps: ['Real examples', 'Expert opinions'],
          enhancementSuggestions: ['Add data visualization', 'Include quotes']
        },
        seoData: {
          title: `AI Analysis: ${aiGenerator.prompt}`,
          description: `AI-generated insights about ${aiGenerator.prompt} in cricket`,
          keywords: [aiGenerator.prompt, 'AI', 'cricket analysis'],
          readabilityScore: 8.0,
          metaDescription: `Discover AI-powered insights about ${aiGenerator.prompt} in modern cricket`,
          slug: `ai-analysis-${aiGenerator.prompt.toLowerCase().replace(/\s+/g, '-')}`,
          featuredImage: '',
          wordCount: 180,
          estimatedCTR: 4.5,
          searchRanking: 25
        },
        performance: {
          dailyViews: [0, 0, 0, 0, 0, 0, 0],
          engagementRate: 0,
          avgTimeOnPage: 0,
          bounceRate: 0,
          socialShares: 0,
          conversionRate: 0,
          revenueGenerated: 0
        }
      };

      setStories([aiGeneratedStory, ...stories]);
      setAiGenerator({ ...aiGenerator, prompt: '' });
      addNotification('AI content generated successfully');
    } catch (error) {
      addNotification('AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const syncContentSources = async () => {
    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      addNotification('Content sources synced successfully');
    } catch (error) {
      addNotification('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || story.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || story.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      case 'engagement':
        return b.engagement.score - a.engagement.score;
      case 'views':
        return b.views - a.views;
      case 'ai-score':
        return (b.aiAnalysis?.qualityScore || 0) - (a.aiAnalysis?.qualityScore || 0);
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'featured': return 'text-purple-400 bg-purple-400/20';
      case 'ai-generated': return 'text-blue-400 bg-blue-400/20';
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Advanced Header */}
      <motion.header 
        className="bg-black/40 backdrop-blur-xl border-b border-purple-500/20 flex-shrink-0"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <PenTool className="text-purple-400" />
                AI Content Intelligence Hub
              </h1>
              <p className="text-gray-300">Advanced content management with AI-powered insights and automation</p>
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={syncContentSources}
                disabled={syncing}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Sources'}
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
      </motion.header>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={index}
            className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3 }}
          >
            {notification}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="px-6 py-4 flex-shrink-0">
        {/* Advanced Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'stories', label: 'Stories', icon: <FileText className="w-4 h-4" /> },
            { id: 'ai-tools', label: 'AI Tools', icon: <Brain className="w-4 h-4" /> },
            { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'sources', label: 'Sources', icon: <Database className="w-4 h-4" /> }
          ].map((view) => (
            <motion.button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeView === view.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {view.icon}
              {view.label}
            </motion.button>
          ))}
        </div>

      {/* Main Content Area - Scrollable within viewport */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Dashboard Overview */}
        {activeView === 'dashboard' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Total Stories</h3>
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {stories.length}
                </div>
                <div className="text-sm text-gray-400">Across all categories</div>
              </motion.div>

              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-green-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">AI Generated</h3>
                  <Bot className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {stories.filter(s => s.status === 'ai-generated').length}
                </div>
                <div className="text-sm text-gray-400">AI-powered content</div>
              </motion.div>

              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Avg Engagement</h3>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {stories.length > 0 ? (stories.reduce((acc, s) => acc + s.engagement.score, 0) / stories.length).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-gray-400">Engagement score</div>
              </motion.div>

              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-yellow-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Trending Topics</h3>
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {trendingTopics.length}
                </div>
                <div className="text-sm text-gray-400">Active trends</div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="text-purple-400" />
                  Recent Stories
                </h3>
                <div className="space-y-3">
                  {stories.slice(0, 3).map((story) => (
                    <div key={story.id} className="flex items-center justify-between p-3 bg-purple-600/10 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{story.title}</div>
                        <div className="text-sm text-gray-400">{story.author} • {new Date(story.submittedAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                        {story.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-green-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-green-400" />
                  Trending Topics
                </h3>
                <div className="space-y-3">
                  {trendingTopics.slice(0, 3).map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-3 bg-green-600/10 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{topic.topic}</div>
                        <div className="text-sm text-gray-400">{topic.mentions.toLocaleString()} mentions</div>
                      </div>
                      <div className="flex items-center gap-1 text-green-400">
                        <ArrowUp size={16} />
                        <span className="text-sm">{(topic.growth * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Stories Management */}
        {activeView === 'stories' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Advanced Filters */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search stories, authors, content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800/50 text-white rounded-lg pl-10 pr-4 py-3 border border-purple-400/20"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-slate-800/50 text-white rounded-lg px-4 py-3 border border-purple-400/20"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="featured">Featured</option>
                  <option value="ai-generated">AI Generated</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-800/50 text-white rounded-lg px-4 py-3 border border-purple-400/20"
                >
                  <option value="all">All Categories</option>
                  <option value="match-experience">Match Experience</option>
                  <option value="player-fan">Player Fan</option>
                  <option value="venue-memory">Venue Memory</option>
                  <option value="cricket-journey">Cricket Journey</option>
                  <option value="emotional-moment">Emotional Moment</option>
                  <option value="ai-generated">AI Generated</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-800/50 text-white rounded-lg px-4 py-3 border border-purple-400/20"
                >
                  <option value="date">Sort by Date</option>
                  <option value="engagement">Sort by Engagement</option>
                  <option value="views">Sort by Views</option>
                  <option value="ai-score">Sort by AI Score</option>
                </select>

                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-lg ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300'}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Grid size={20} />
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-lg ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-300'}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <List size={20} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Stories Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story) => (
                  <motion.div
                    key={story.id}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white line-clamp-2">{story.title}</h3>
                          {story.aiAnalysis?.aiGenerated && (
                            <Bot className="w-4 h-4 text-blue-400" />
                          )}
                          {story.status === 'featured' && (
                            <Star className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
                          <User size={14} />
                          <span>{story.author}</span>
                          <span>•</span>
                          <Calendar size={14} />
                          <span>{new Date(story.submittedAt).toLocaleDateString()}</span>
                        </div>

                        <span className={`px-2 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs mb-3 inline-block`}>
                          {getCategoryLabel(story.category)}
                        </span>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                        {story.status}
                      </span>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">{story.excerpt}</p>

                    {/* Engagement Metrics */}
                    <div className="grid grid-cols-4 gap-2 text-center mb-4">
                      <div className="bg-purple-600/10 rounded p-2">
                        <div className="text-purple-400 font-bold text-sm">{story.views}</div>
                        <div className="text-xs text-gray-400">Views</div>
                      </div>
                      <div className="bg-green-600/10 rounded p-2">
                        <div className="text-green-400 font-bold text-sm">{story.likes}</div>
                        <div className="text-xs text-gray-400">Likes</div>
                      </div>
                      <div className="bg-blue-600/10 rounded p-2">
                        <div className="text-blue-400 font-bold text-sm">{story.comments}</div>
                        <div className="text-xs text-gray-400">Comments</div>
                      </div>
                      <div className="bg-yellow-600/10 rounded p-2">
                        <div className="text-yellow-400 font-bold text-sm">{story.shares}</div>
                        <div className="text-xs text-gray-400">Shares</div>
                      </div>
                    </div>

                    {/* AI Score */}
                    {story.aiAnalysis && (
                      <div className="bg-purple-600/10 rounded-lg p-3 border border-purple-400/20 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-purple-400 text-sm">AI Quality Score:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-purple-900 rounded-full h-2">
                              <div 
                                className="bg-purple-400 h-2 rounded-full"
                                style={{ width: `${story.aiAnalysis.qualityScore * 10}%` }}
                              />
                            </div>
                            <span className="text-white font-bold text-sm">{story.aiAnalysis.qualityScore.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {story.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {story.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs flex items-center gap-1"
                          >
                            <Hash size={10} />
                            {tag}
                          </span>
                        ))}
                        {story.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{story.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setSelectedStory(story)}
                        className="flex-1 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eye size={16} className="inline mr-1" />
                        View
                      </motion.button>
                      <motion.button
                        onClick={() => setEditingStory(story)}
                        className="flex-1 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit size={16} className="inline mr-1" />
                        Edit
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStories.map((story) => (
                  <motion.div
                    key={story.id}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{story.title}</h3>
                          {story.aiAnalysis?.aiGenerated && (
                            <Bot className="w-5 h-5 text-blue-400" />
                          )}
                          {story.status === 'featured' && (
                            <Star className="w-5 h-5 text-yellow-400" />
                          )}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                            {story.status}
                          </span>
                          <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                            {getCategoryLabel(story.category)}
                          </span>
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
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {story.readingTime} min read
                          </span>
                        </div>

                        <p className="text-gray-300 mb-4">{story.excerpt}</p>

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
                          <span className="flex items-center gap-1 text-purple-400">
                            <Activity size={14} />
                            {story.engagement.score.toFixed(1)}
                          </span>
                        </div>

                        {/* AI Analysis Bar */}
                        {story.aiAnalysis && (
                          <div className="bg-purple-600/10 rounded-lg p-4 border border-purple-400/20">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-purple-400">Quality:</span>
                                <span className="text-white ml-1">{story.aiAnalysis.qualityScore.toFixed(1)}</span>
                              </div>
                              <div>
                                <span className="text-purple-400">Readability:</span>
                                <span className="text-white ml-1">{story.aiAnalysis.readabilityScore.toFixed(1)}</span>
                              </div>
                              <div>
                                <span className="text-purple-400">Emotional:</span>
                                <span className="text-white ml-1">{story.aiAnalysis.emotionalImpact.toFixed(1)}</span>
                              </div>
                              <div>
                                <span className="text-purple-400">Shareability:</span>
                                <span className="text-white ml-1">{story.aiAnalysis.shareability.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <motion.button
                          onClick={() => setSelectedStory(story)}
                          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye size={16} />
                        </motion.button>
                        <motion.button
                          onClick={() => setEditingStory(story)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
                          <X size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* AI Tools */}
        {activeView === 'ai-tools' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Content Generator */}
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Bot className="text-purple-400" />
                  AI Content Generator
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-purple-400 text-sm mb-2 block">Content Prompt</label>
                    <textarea
                      placeholder="Enter a topic or prompt for AI to generate content..."
                      value={aiGenerator.prompt}
                      onChange={(e) => setAiGenerator({ ...aiGenerator, prompt: e.target.value })}
                      className="w-full p-4 bg-slate-800/50 text-white border border-purple-400/20 rounded-lg h-32 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-purple-400 text-sm mb-2 block">Category</label>
                      <select
                        value={aiGenerator.category}
                        onChange={(e) => setAiGenerator({ ...aiGenerator, category: e.target.value })}
                        className="w-full p-3 bg-slate-800/50 text-white border border-purple-400/20 rounded-lg"
                      >
                        <option value="match-experience">Match Experience</option>
                        <option value="player-fan">Player Fan</option>
                        <option value="venue-memory">Venue Memory</option>
                        <option value="cricket-journey">Cricket Journey</option>
                        <option value="emotional-moment">Emotional Moment</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-purple-400 text-sm mb-2 block">Tone</label>
                      <select
                        value={aiGenerator.tone}
                        onChange={(e) => setAiGenerator({ ...aiGenerator, tone: e.target.value as any })}
                        className="w-full p-3 bg-slate-800/50 text-white border border-purple-400/20 rounded-lg"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="enthusiastic">Enthusiastic</option>
                        <option value="analytical">Analytical</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-purple-400 text-sm mb-2 block">Length</label>
                      <select
                        value={aiGenerator.length}
                        onChange={(e) => setAiGenerator({ ...aiGenerator, length: e.target.value as any })}
                        className="w-full p-3 bg-slate-800/50 text-white border border-purple-400/20 rounded-lg"
                      >
                        <option value="short">Short (200-300 words)</option>
                        <option value="medium">Medium (400-600 words)</option>
                        <option value="long">Long (700+ words)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-purple-400 text-sm mb-2 block">Target Audience</label>
                      <input
                        type="text"
                        placeholder="e.g., cricket fans"
                        value={aiGenerator.targetAudience}
                        onChange={(e) => setAiGenerator({ ...aiGenerator, targetAudience: e.target.value })}
                        className="w-full p-3 bg-slate-800/50 text-white border border-purple-400/20 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 text-purple-400">
                      <input
                        type="checkbox"
                        checked={aiGenerator.includeImages}
                        onChange={(e) => setAiGenerator({ ...aiGenerator, includeImages: e.target.checked })}
                        className="rounded"
                      />
                      Include Images
                    </label>
                    <label className="flex items-center gap-2 text-purple-400">
                      <input
                        type="checkbox"
                        checked={aiGenerator.includeVideos}
                        onChange={(e) => setAiGenerator({ ...aiGenerator, includeVideos: e.target.checked })}
                        className="rounded"
                      />
                      Include Videos
                    </label>
                  </div>

                  <motion.button
                    onClick={generateAIContent}
                    disabled={aiGenerating || !aiGenerator.prompt.trim()}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Bot className={`w-4 h-4 ${aiGenerating ? 'animate-pulse' : ''}`} />
                    {aiGenerating ? 'Generating...' : 'Generate Content'}
                  </motion.button>
                </div>
              </motion.div>

              {/* AI Analysis Tools */}
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-green-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Brain className="text-green-400" />
                  AI Analysis Tools
                </h3>

                <div className="space-y-3">
                  <motion.button
                    className="w-full p-4 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 text-left flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Analyze All Stories</div>
                      <div className="text-sm opacity-75">Run AI analysis on all content</div>
                    </div>
                  </motion.button>

                  <motion.button
                    className="w-full p-4 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 text-left flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Target className="w-5 h-5" />
                    <div>
                      <div className="font-medium">SEO Optimization</div>
                      <div className="text-sm opacity-75">Improve search rankings</div>
                    </div>
                  </motion.button>

                  <motion.button
                    className="w-full p-4 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 text-left flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Hash className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Generate Tags</div>
                      <div className="text-sm opacity-75">AI-powered tag suggestions</div>
                    </div>
                  </motion.button>

                  <motion.button
                    className="w-full p-4 bg-yellow-600/20 text-yellow-300 rounded-lg hover:bg-yellow-600/30 text-left flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Trending Analysis</div>
                      <div className="text-sm opacity-75">Identify trending topics</div>
                    </div>
                  </motion.button>

                  <motion.button
                    className="w-full p-4 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 text-left flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <AlertCircle className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Content Moderation</div>
                      <div className="text-sm opacity-75">Auto-flag inappropriate content</div>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Analytics Dashboard */}
        {activeView === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="text-blue-400" />
                  Performance Analytics
                </h3>

                <div className="space-y-4">
                  <div className="bg-blue-600/10 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-blue-400">Total Views</span>
                      <span className="text-white font-bold">45.2K</span>
                    </div>
                    <div className="w-full bg-blue-900 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{ width: '75%' }} />
                    </div>
                    <div className="text-sm text-gray-400 mt-1">+23% from last month</div>
                  </div>

                  <div className="bg-green-600/10 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-400">Engagement Rate</span>
                      <span className="text-white font-bold">12.5%</span>
                    </div>
                    <div className="w-full bg-green-900 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '62%' }} />
                    </div>
                    <div className="text-sm text-gray-400 mt-1">+8% from last month</div>
                  </div>

                  <div className="bg-purple-600/10 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-purple-400">AI Content Performance</span>
                      <span className="text-white font-bold">89%</span>
                    </div>
                    <div className="w-full bg-purple-900 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full" style={{ width: '89%' }} />
                    </div>
                    <div className="text-sm text-gray-400 mt-1">Above average</div>
                  </div>
                </div>
              </motion.div>

              {/* Content Insights */}
              <motion.div
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Brain className="text-purple-400" />
                  AI Content Insights
                </h3>

                <div className="space-y-4">
                  <div className="bg-purple-600/10 rounded-lg p-4">
                    <h4 className="text-purple-300 font-medium mb-2">Top Performing Categories</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Match Experience</span>
                        <span className="text-white">34%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Player Fan Stories</span>
                        <span className="text-white">28%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">AI Generated</span>
                        <span className="text-white">22%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-600/10 rounded-lg p-4">
                    <h4 className="text-blue-300 font-medium mb-2">Content Quality Trends</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Avg AI Score</span>
                        <span className="text-white">8.2/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Readability</span>
                        <span className="text-white">87%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Plagiarism Free</span>
                        <span className="text-white">98%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Content Sources */}
        {activeView === 'sources' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-6">
              {contentSources.map((source) => (
                <motion.div
                  key={source.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-white">{source.name}</h3>
                        {source.aiGenerated && (
                          <Bot className="w-5 h-5 text-blue-400" />
                        )}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          source.status === 'active' ? 'bg-green-600/30 text-green-300' :
                          source.status === 'inactive' ? 'bg-gray-600/30 text-gray-300' :
                          'bg-red-600/30 text-red-300'
                        }`}>
                          {source.status}
                        </span>
                        <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                          {source.type}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300 mb-3">
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

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-purple-400">Reliability:</span>
                          <span className="text-white ml-1">{source.reliability}/10</span>
                        </div>
                        <div>
                          <span className="text-purple-400">Content Types:</span>
                          <span className="text-white ml-1">{source.contentType.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <motion.button
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
                        <X size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Story Detail Modal */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">{selectedStory.title}</h3>
                <button onClick={() => setSelectedStory(null)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Story Metadata */}
                <div className="flex items-center gap-4 text-gray-300 text-sm border-b border-gray-700 pb-4">
                  <span className="flex items-center gap-1">
                    <User size={14} />
                    {selectedStory.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(selectedStory.submittedAt).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs">
                    {getCategoryLabel(selectedStory.category)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {selectedStory.readingTime} min read
                  </span>
                </div>
                
                {/* Story Content */}
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {selectedStory.content}
                  </p>
                </div>

                {/* Engagement Metrics */}
                <div className="bg-white/5 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-3">Engagement Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{selectedStory.views.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{selectedStory.likes}</div>
                      <div className="text-sm text-gray-400">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{selectedStory.comments}</div>
                      <div className="text-sm text-gray-400">Comments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{selectedStory.shares}</div>
                      <div className="text-sm text-gray-400">Shares</div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                {selectedStory.aiAnalysis && (
                  <div className="bg-purple-600/10 rounded-lg p-4 border border-purple-400/20">
                    <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <Brain size={18} />
                      AI Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-purple-400">Quality Score:</span>
                          <span className="text-white font-medium">{selectedStory.aiAnalysis.qualityScore.toFixed(1)}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-400">Readability:</span>
                          <span className="text-white font-medium">{selectedStory.aiAnalysis.readabilityScore.toFixed(1)}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-400">Emotional Impact:</span>
                          <span className="text-white font-medium">{selectedStory.aiAnalysis.emotionalImpact.toFixed(1)}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-400">Shareability:</span>
                          <span className="text-white font-medium">{selectedStory.aiAnalysis.shareability.toFixed(1)}/10</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-purple-400">Content Summary:</span>
                          <p className="text-gray-300 text-sm mt-1">{selectedStory.aiAnalysis.contentSummary}</p>
                        </div>
                        <div>
                          <span className="text-purple-400">AI Recommendation:</span>
                          <div className={`mt-1 px-2 py-1 rounded-full text-xs inline-block ${
                            selectedStory.aiAnalysis.recommendation === 'approve' ? 'bg-green-600/30 text-green-300' :
                            selectedStory.aiAnalysis.recommendation === 'review' ? 'bg-yellow-600/30 text-yellow-300' :
                            'bg-red-600/30 text-red-300'
                          }`}>
                            {selectedStory.aiAnalysis.recommendation.toUpperCase()} ({selectedStory.aiAnalysis.confidence.toFixed(0)}% confidence)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
      </AnimatePresence>
    </div>
  );
}
