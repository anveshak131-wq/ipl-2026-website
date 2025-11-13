'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Mark this page as dynamic to prevent pre-rendering
// Note: Removed for static export compatibility
import { Content } from '@/types';
import { api } from '@/lib/data';

export default function AdminContent() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [formData, setFormData] = useState<{
    type: 'banner' | 'highlight' | 'news';
    title: string;
    content: string;
    imageUrl: string;
    videoUrl: string;
    isActive: boolean;
  }>({
    type: 'banner',
    title: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
    isActive: true
  });

  useEffect(() => {
    // Check authentication on client side only
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin');
          return;
        }
        setIsAuthenticated(true);
        fetchContent();
      } catch (error) {
        // localStorage not available, redirect to login
        router.push('/admin');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchContent = async () => {
    try {
      const contentData = await api.getContent();
      setContent(contentData);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContent = () => {
    setEditingContent(null);
    setFormData({
      type: 'banner',
      title: '',
      content: '',
      imageUrl: '',
      videoUrl: '',
      isActive: true
    });
    setShowForm(true);
  };

  const handleEditContent = (item: Content) => {
    setEditingContent(item);
    setFormData({
      type: item.type as 'banner' | 'highlight' | 'news',
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      isActive: item.isActive
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContent) {
        const updated = await api.updateContent(editingContent.id, formData);
        setContent(content.map(c => c.id === editingContent.id ? updated : c));
      } else {
        const newContent = await api.createContent(formData);
        setContent([...content, newContent]);
      }
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      await api.deleteContent(contentId);
      setContent(content.filter(c => c.id !== contentId));
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  const handleToggleActive = (contentId: string) => {
    // TODO: Send update to API
    setContent(content.map(c => 
      c.id === contentId ? {...c, isActive: !c.isActive} : c
    ));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-ipl-dark">
        <AdminSidebar currentPage="/admin/content" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark">
      <AdminSidebar currentPage="/admin/content" />
      
      <div className="flex-1">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              Manage Content
            </h1>
            <button 
              onClick={handleAddContent}
              className="ipl-button"
            >
              Add New Content
            </button>
          </div>

          {/* Content Tabs */}
          <div className="mb-8">
            <div className="glass-effect rounded-lg p-1 inline-flex">
              {['banner', 'highlight', 'news'].map((type) => (
                <button
                  key={type}
                  className="px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white hover:bg-white/10"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {content.map((item) => (
              <div key={item.id} className="glass-effect rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Content Image */}
                {item.imageUrl && (
                  <div className="h-40 bg-white/5 overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ipl-purple/20 text-ipl-purple border border-ipl-purple/30 mb-2">
                        {item.type}
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        {item.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        item.isActive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {item.content}
                  </p>

                  <div className="flex space-x-2 pt-4 border-t border-white/10">
                    <button 
                      onClick={() => handleEditContent(item)}
                      className="flex-1 text-ipl-gold hover:text-ipl-purple transition-colors font-medium py-2"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteContent(item.id)}
                      className="flex-1 text-red-400 hover:text-red-300 transition-colors font-medium py-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass-effect rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {editingContent ? 'Edit Content' : 'Add New Content'}
                    </h2>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Content Type
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-ipl-gold"
                        >
                          <option value="banner">Banner</option>
                          <option value="highlight">Highlight</option>
                          <option value="news">News</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter content title"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Content
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                        placeholder="Enter content description"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Image URL
                        </label>
                        <input
                          type="text"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter image URL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Video URL
                        </label>
                        <input
                          type="text"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold"
                          placeholder="Enter video URL"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-300 cursor-pointer">
                        Publish this content immediately
                      </label>
                    </div>

                    {/* Form Actions */}
                    <div className="flex space-x-4 pt-6 border-t border-white/10">
                      <button
                        type="submit"
                        className="ipl-button flex-1"
                      >
                        {editingContent ? 'Update Content' : 'Add Content'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 glass-effect text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
