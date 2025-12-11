'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2, Plus, Save, X, Search, Calendar, User, Tag, Check } from 'lucide-react';

interface FanStory {
  id: string;
  title: string;
  author: string;
  category: string;
  content: string;
  excerpt: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  tags: string[];
}

export default function AdminStories() {
  const [stories, setStories] = useState<FanStory[]>([
    {
      id: '1',
      title: 'My First IPL Match Experience',
      author: 'John Doe',
      category: 'match-experience',
      content: 'It was an amazing experience watching my first IPL match...',
      excerpt: 'An incredible experience at the stadium',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      tags: ['cricket', 'ipl', 'stadium']
    }
  ]);
  const [editingStory, setEditingStory] = useState<FanStory | null>(null);
  const [selectedStory, setSelectedStory] = useState<FanStory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredStories = stories.filter(story => {
    const matchesFilter = filter === 'all' || story.status === filter;
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.author.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleStatusChange = (id: string, status: 'approved' | 'rejected') => {
    setStories(stories.map(s => s.id === id ? { ...s, status } : s));
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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Fan Stories Admin</h1>
        <p className="text-gray-300">
          Manage and moderate user-submitted IPL cricket stories
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 text-white rounded-lg pl-10 pr-4 py-2 border border-blue-400/20"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-slate-800/50 text-white rounded-lg px-4 py-2 border border-blue-400/20"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800/50 text-white rounded-lg px-4 py-2 border border-blue-400/20"
          >
            <option value="all">All Categories</option>
            <option value="match-experience">Match Experience</option>
            <option value="player-fan">Player Fan</option>
            <option value="venue-memory">Venue Memory</option>
            <option value="cricket-journey">Cricket Journey</option>
            <option value="emotional-moment">Emotional Moment</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilter('all');
              setCategoryFilter('all');
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid gap-6">
        {filteredStories.map((story) => (
          <motion.div
            key={story.id}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-blue-400/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{story.title}</h3>
                <div className="flex items-center gap-4 text-gray-300 text-sm mb-2">
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
                </div>
                <p className="text-gray-300 mb-4 line-clamp-3">{story.excerpt}</p>
                {story.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {story.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
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
                  onClick={() => handleDeleteStory(story.id)}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
              </span>
              
              {story.status === 'pending' && (
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handleStatusChange(story.id, 'approved')}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check size={14} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleStatusChange(story.id, 'rejected')}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={14} />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredStories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No stories found matching your criteria.</div>
        </div>
      )}

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
        className="bg-slate-800 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
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
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 bg-slate-700 text-white border border-slate-600 rounded"
          />
          <textarea
            placeholder="Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-2 bg-slate-700 text-white border border-slate-600 rounded h-32"
          />
          <input
            type="text"
            placeholder="Excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full p-2 bg-slate-700 text-white border border-slate-600 rounded"
          />
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
        className="bg-slate-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{story.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-gray-300 text-sm">
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
          </div>
          
          <p className="text-gray-200 mb-4">{story.content}</p>
          
          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {story.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
