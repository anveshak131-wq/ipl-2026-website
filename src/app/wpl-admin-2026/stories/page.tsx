'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Eye, Edit, Trash2, Plus, Save, X, Filter, Search, Calendar, User, Tag } from 'lucide-react';
import AuroraBackground from '@/components/ui/AuroraBackground';
import GradientText from '@/components/ui/GradientText';
import AnimatedSection from '@/components/ui/AnimatedSection';

interface FanStory {
  id: string;
  title: string;
  author: string;
  email: string;
  category: 'match-experience' | 'player-fan' | 'venue-memory' | 'cricket-journey' | 'emotional-moment';
  content: string;
  excerpt: string;
  likes: number;
  comments: number;
  views: number;
  featured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  publishedAt?: string;
  tags: string[];
  imageUrl?: string;
}

export default function WPLStoriesAdmin() {
  const [stories, setStories] = useState<FanStory[]>([]);
  const [editingStory, setEditingStory] = useState<FanStory | null>(null);
  const [selectedStory, setSelectedStory] = useState<FanStory | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    // Load WPL-specific mock data
    setStories([
      {
        id: '1',
        title: 'My First WPL Match - Trailblazers vs Velocity',
        author: 'Priya Sharma',
        email: 'priya@example.com',
        category: 'match-experience',
        content: 'The atmosphere was electric watching Smriti Mandhana lead from the front in her home ground. The crowd was mostly families with young girls, all inspired by these incredible athletes.',
        excerpt: 'First-time WPL experience watching Smriti Mandhana inspire young fans.',
        likes: 324,
        comments: 28,
        views: 1850,
        featured: true,
        status: 'approved',
        submittedAt: '2024-12-01T10:30:00Z',
        publishedAt: '2024-12-02T08:00:00Z',
        tags: ['WPL', 'Trailblazers', 'Smriti Mandhana', 'First Match'],
        imageUrl: '/images/wpl-stories/trailblazers-match.jpg'
      },
      {
        id: '2',
        title: 'Meeting Harmanpreet Kaur - A Dream Come True',
        author: 'Anjali Patel',
        email: 'anjali@example.com',
        category: 'player-fan',
        content: 'I never thought I would meet my idol who inspired millions of girls to take up cricket. It happened during a fan meet at the WPL venue. Harmanpreet was so humble and took time to talk to every fan.',
        excerpt: 'The unforgettable moment meeting the WPL captain who inspired millions.',
        likes: 567,
        comments: 42,
        views: 3200,
        featured: true,
        status: 'approved',
        submittedAt: '2024-11-28T15:45:00Z',
        publishedAt: '2024-11-29T09:00:00Z',
        tags: ['Harmanpreet Kaur', 'Meet & Greet', 'Inspiration', 'Trailblazers']
      },
      {
        id: '3',
        title: 'The Journey from Street Cricket to WPL Stand',
        author: 'Meera Kumar',
        email: 'meera@example.com',
        category: 'cricket-journey',
        content: 'From playing gully cricket with boys to watching women play on the biggest stage - my cricket journey has been incredible. My parents never supported cricket for girls, but WPL changed everything.',
        excerpt: 'How WPL transformed family attitudes towards women playing cricket.',
        likes: 189,
        comments: 15,
        views: 890,
        featured: false,
        status: 'pending',
        submittedAt: '2024-12-05T11:20:00Z',
        tags: ['Journey', 'Inspiration', 'Women Cricket', 'Family Support']
      }
    ]);
  }, []);

  const filteredStories = stories.filter(story => {
    const matchesFilter = filter === 'all' || story.status === filter;
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || story.category === categoryFilter;
    return matchesFilter && matchesSearch && matchesCategory;
  });

  const handleSaveStory = (story: FanStory) => {
    if (editingStory) {
      setStories(stories.map(s => s.id === story.id ? story : s));
      setEditingStory(null);
    } else {
      setStories([...stories, { ...story, id: Date.now().toString(), submittedAt: new Date().toISOString() }]);
    }
  };

  const handleDeleteStory = (id: string) => {
    setStories(stories.filter(s => s.id !== id));
  };

  const handleStatusChange = (id: string, status: 'pending' | 'approved' | 'rejected') => {
    setStories(stories.map(s => 
      s.id === id 
        ? { ...s, status, publishedAt: status === 'approved' ? new Date().toISOString() : undefined }
        : s
    ));
  };

  const handleFeaturedToggle = (id: string) => {
    setStories(stories.map(s => 
      s.id === id ? { ...s, featured: !s.featured } : s
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
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
      default: return category;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900">
      <AuroraBackground />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AnimatedSection>
            <div className="text-center mb-8">
              <GradientText className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400">
                WPL Fan Stories Admin
              </GradientText>
              <p className="text-gray-300 text-lg">
                Manage and moderate user-submitted WPL cricket stories
              </p>
            </div>
          </AnimatedSection>

          {/* Filters and Search */}
      <AnimatedSection>
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
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="bg-purple-900/30 text-white rounded-lg px-4 py-2 border border-purple-400/20"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-purple-900/30 text-white rounded-lg px-4 py-2 border border-purple-400/20"
                >
                  <option value="all">All Categories</option>
                  <option value="match-experience">Match Experience</option>
                  <option value="player-fan">Player Fan</option>
                  <option value="venue-memory">Venue Memory</option>
                  <option value="cricket-journey">Cricket Journey</option>
                  <option value="emotional-moment">Emotional Moment</option>
                </select>

                <motion.button
                  onClick={() => setEditingStory({
                    id: '',
                    title: '',
                    author: '',
                    email: '',
                    category: 'match-experience',
                    content: '',
                    excerpt: '',
                    likes: 0,
                    comments: 0,
                    views: 0,
                    featured: false,
                    status: 'pending',
                    submittedAt: new Date().toISOString(),
                    tags: []
                  })}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={20} />
                  Add Story
                </motion.button>
              </div>
            </div>
          </AnimatedSection>

          {/* Statistics */}
          <AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-400/20">
                <div className="text-3xl font-bold text-white">{stories.length}</div>
                <div className="text-gray-300">Total Stories</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-400/20">
                <div className="text-3xl font-bold text-green-400">
                  {stories.filter(s => s.status === 'approved').length}
                </div>
                <div className="text-gray-300">Approved</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-400/20">
                <div className="text-3xl font-bold text-yellow-400">
                  {stories.filter(s => s.status === 'pending').length}
                </div>
                <div className="text-gray-300">Pending</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-400/20">
                <div className="text-3xl font-bold text-purple-400">
                  {stories.filter(s => s.featured).length}
                </div>
                <div className="text-gray-300">Featured</div>
              </div>
            </div>
          </AnimatedSection>

          {/* Stories List */}
          <AnimatedSection>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-400/20">
              <div className="space-y-4">
                {filteredStories.map((story) => (
                  <motion.div
                    key={story.id}
                    className="bg-white/5 rounded-lg p-4 border border-purple-400/10"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white">{story.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                            {story.status}
                          </span>
                          {story.featured && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-400/20 text-purple-300">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-gray-300 text-sm mb-2">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            {story.author}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(story.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag size={14} />
                            {getCategoryLabel(story.category)}
                          </div>
                        </div>

                        <p className="text-gray-300 mb-3">{story.excerpt}</p>

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
                          <div className="flex flex-wrap gap-1 mt-2">
                            {story.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-purple-900/30 rounded text-xs text-purple-300">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => setSelectedStory(story)}
                            className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Eye size={16} />
                          </motion.button>
                          <motion.button
                            onClick={() => setEditingStory(story)}
                            className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Edit size={16} />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteStory(story.id)}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                        
                        <div className="flex gap-1">
                          {story.status !== 'approved' && (
                            <motion.button
                              onClick={() => handleStatusChange(story.id, 'approved')}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Approve
                            </motion.button>
                          )}
                          {story.status !== 'rejected' && (
                            <motion.button
                              onClick={() => handleStatusChange(story.id, 'rejected')}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Reject
                            </motion.button>
                          )}
                          <motion.button
                            onClick={() => handleFeaturedToggle(story.id)}
                            className={`px-2 py-1 text-xs rounded ${
                              story.featured 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {story.featured ? 'Unfeature' : 'Feature'}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Edit Modal */}
          {editingStory && (
            <StoryEditModal
              story={editingStory}
              onSave={handleSaveStory}
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
        </div>
      </div>
    </div>
  );
}

// Story Edit Modal
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
        className="bg-purple-900/90 backdrop-blur-md rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-purple-400/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Edit Story</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Story Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
            />
            <input
              type="text"
              placeholder="Author Name"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Author Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
            >
              <option value="match-experience">Match Experience</option>
              <option value="player-fan">Player Fan</option>
              <option value="venue-memory">Venue Memory</option>
              <option value="cricket-journey">Cricket Journey</option>
              <option value="emotional-moment">Emotional Moment</option>
            </select>
          </div>

          <textarea
            placeholder="Excerpt (short description)"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 h-20 border border-purple-400/20"
          />
          
          <textarea
            placeholder="Full Story Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 h-40 border border-purple-400/20"
          />

          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={formData.tags.join(', ')}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
            className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white text-sm mb-1 block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-purple-800/50 text-white rounded-lg px-4 py-2 border border-purple-400/20"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 text-white mt-6">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded"
              />
              <label>Featured Story</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <motion.button
            onClick={() => onSave(formData)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save size={16} />
            Save
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Story View Modal
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
        className="bg-purple-900/90 backdrop-blur-md rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-purple-400/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{story.title}</h3>
            <div className="flex items-center gap-4 text-gray-300">
              <div className="flex items-center gap-1">
                <User size={16} />
                {story.author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                {new Date(story.submittedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 leading-relaxed">
            {story.content}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-purple-400/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-gray-400">
              <div className="flex items-center gap-1">
                <Heart size={16} />
                {story.likes} likes
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={16} />
                {story.comments} comments
              </div>
              <div className="flex items-center gap-1">
                <Eye size={16} />
                {story.views} views
              </div>
            </div>
            
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                story.status === 'approved' ? 'text-green-400 bg-green-400/20' :
                story.status === 'rejected' ? 'text-red-400 bg-red-400/20' :
                'text-yellow-400 bg-yellow-400/20'
              }`}>
                {story.status}
              </span>
              {story.featured && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-400/20 text-purple-300">
                  Featured
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
