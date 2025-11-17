'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { Content, Team, Match, Player } from '@/types';
import { api } from '@/lib/data';

// Icons
const IconSearch = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconPlus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconEdit = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconTrash = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconEye = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const IconFilter = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const IconCalendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconNewspaper = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

interface ContentManagerProps {
  initialType?: 'news' | 'banner' | 'highlight';
  restrictToType?: 'news' | 'banner' | 'highlight';
  currentPagePath: string;
}

export default function ContentManager({
  initialType = 'news',
  restrictToType,
  currentPagePath,
}: ContentManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [content, setContent] = useState<Content[]>([]);
  const [filteredContent, setFilteredContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeContentType, setActiveContentType] = useState<'news' | 'banner' | 'highlight'>(initialType);
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<'all' | 'match' | 'team' | 'player' | 'general'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [formData, setFormData] = useState<{
    type: 'banner' | 'highlight' | 'news';
    title: string;
    summary: string;
    content: string;
    imageUrl: string;
    videoUrl: string;
    isActive: boolean;
    isImportant: boolean;
    category: 'match' | 'team' | 'player' | 'general';
    linkedTeamIds: string[];
    linkedMatchId: string;
    linkedPlayerIds: string[];
  }>({
    type: 'news',
    title: '',
    summary: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
    isActive: true,
    isImportant: false,
    category: 'general',
    linkedTeamIds: [],
    linkedMatchId: '',
    linkedPlayerIds: [],
  });

  const currentType: 'news' | 'banner' | 'highlight' = restrictToType || activeContentType;
  const currentTypeLabel =
    currentType === 'news' ? 'News' : currentType === 'banner' ? 'Banners' : 'Highlights';

  const breadcrumbLeafLabel = pathname?.startsWith('/admin/news') ? 'News' : 'Content Hub';

  const itemsOfCurrentType = content.filter((c) => c.type === currentType);
  const totalCurrent = itemsOfCurrentType.length;
  const publishedCurrent = itemsOfCurrentType.filter((c) => c.isActive).length;
  const draftCurrent = itemsOfCurrentType.filter((c) => !c.isActive).length;

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin');
          return;
        }
        setIsAuthenticated(true);
        fetchContent();
        fetchContext();
      } catch (error) {
        router.push('/admin');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchContext = async () => {
    try {
      const [teamsData, matchesData, playersData] = await Promise.all([
        api.getTeams(),
        api.getMatches(),
        api.getPlayers(),
      ]);
      setTeams(teamsData);
      setMatches(matchesData);
      setPlayers(playersData);
    } catch (error) {
      console.error('Failed to fetch context data for news links:', error);
    }
  };

  const handlePreview = (item: Content) => {
    // For news items, open the public-facing article detail page in a new tab
    if (item.type === 'news') {
      if (typeof window !== 'undefined') {
        window.open(`/news/${item.id}`, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // For other content types, you can extend preview behavior later
    alert('Preview is currently available for news articles only.');
  };

  useEffect(() => {
    // Apply filters
    let filtered = [...content];

    filtered = filtered.filter(item => item.type === currentType);

    if (currentType === 'news' && newsCategoryFilter !== 'all') {
      filtered = filtered.filter(item => (item.category as any) === newsCategoryFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item =>
        statusFilter === 'active' ? item.isActive : !item.isActive
      );
    }

    setFilteredContent(filtered);
  }, [
    content,
    searchQuery,
    statusFilter,
    dateFilter,
    activeContentType,
    newsCategoryFilter,
    currentType,
  ]);

  const fetchContent = async () => {
    try {
      const contentData = await api.getContent();
      setContent(contentData);
      setFilteredContent(contentData);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContent = () => {
    setEditingContent(null);
    setFormData({
      type: currentType,
      title: '',
      summary: '',
      content: '',
      imageUrl: '',
      videoUrl: '',
      isActive: true,
      isImportant: false,
      category: 'general',
      linkedTeamIds: [],
      linkedMatchId: '',
      linkedPlayerIds: [],
    });
    setShowForm(true);
  };

  const handleEditContent = (item: Content) => {
    setEditingContent(item);
    setFormData({
      type: item.type as 'banner' | 'highlight' | 'news',
      title: item.title,
      summary: item.summary || '',
      content: item.content,
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      isActive: item.isActive,
      isImportant: item.isImportant ?? false,
      category: (item.category as any) || 'general',
      linkedTeamIds: item.linkedTeamIds || [],
      linkedMatchId: item.linkedMatchId || '',
      linkedPlayerIds: item.linkedPlayerIds || [],
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
    if (!confirm('Are you sure you want to delete this news item?')) return;
    try {
      await api.deleteContent(contentId);
      setContent(content.filter(c => c.id !== contentId));
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  const handleToggleActive = async (contentId: string) => {
    const item = content.find(c => c.id === contentId);
    if (!item) return;

    try {
      const updated = await api.updateContent(contentId, { isActive: !item.isActive });
      setContent(content.map(c => c.id === contentId ? updated : c));
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    if (isActive) return 'bg-green-500/20 text-green-400 border-green-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getCategoryBadgeColor = (type: string) => {
    switch (type) {
      case 'news':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'banner':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'highlight':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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
      <div className="flex min-h-screen bg-ipl-dark relative overflow-hidden">
        <AuroraBackground />
        <AdminSidebar currentPage={currentPagePath} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ipl-dark relative overflow-hidden">
      <AuroraBackground />
      <AdminSidebar currentPage={currentPagePath} />

      <div className="flex-1 relative z-10">
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <div className="mb-2 text-xs text-gray-400 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => router.push('/admin/dashboard')}
                  className="hover:text-ipl-gold transition-colors"
                >
                  Admin
                </button>
                <span className="text-gray-600">/</span>
                <button
                  type="button"
                  onClick={() => router.push('/admin/content')}
                  className="hover:text-ipl-gold transition-colors"
                >
                  Content
                </button>
                <span className="text-gray-600">/</span>
                <span className="text-gray-300">{breadcrumbLeafLabel}</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Content Management
              </h1>
              <p className="text-gray-400">
                Manage news articles, banners, and highlights
              </p>
              {!restrictToType && (
                <div className="mt-4 inline-flex rounded-xl bg-black/40 border border-white/10 p-1">
                  {[{ key: 'news', label: 'News' }, { key: 'banner', label: 'Banners' }, { key: 'highlight', label: 'Highlights' }].map((tab) => {
                    const isActive = currentType === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveContentType(tab.key as 'news' | 'banner' | 'highlight')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-ipl-gold to-ipl-purple text-black shadow-md'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button 
              onClick={handleAddContent}
              className="flex items-center gap-2 bg-gradient-to-r from-ipl-gold to-ipl-purple px-6 py-3 rounded-xl font-semibold text-white hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <IconPlus className="w-5 h-5" />
              {currentType === 'news'
                ? 'Create News'
                : currentType === 'banner'
                ? 'Create Banner'
                : 'Create Highlight'}
            </button>
          </div>

          {/* Filters Section */}
          <div className="glass-effect rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Bar */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold transition-all"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ipl-gold transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Published</option>
                  <option value="inactive">Draft</option>
                </select>
              </div>

              <div>
                {currentType === 'news' ? (
                  <select
                    value={newsCategoryFilter}
                    onChange={(e) => setNewsCategoryFilter(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ipl-gold transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All News Categories</option>
                    <option value="match">Match</option>
                    <option value="team">Team</option>
                    <option value="player">Player</option>
                    <option value="general">General</option>
                  </select>
                ) : (
                  <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs text-gray-400 flex items-center">
                    {activeContentType === 'banner' ? 'Viewing: Banners' : 'Viewing: Highlights'}
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || statusFilter !== 'all' || (currentType === 'news' && newsCategoryFilter !== 'all')) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                <span className="text-sm text-gray-400">Active filters:</span>
                {searchQuery && (
                  <span className="px-3 py-1 rounded-full bg-ipl-gold/20 text-ipl-gold text-sm border border-ipl-gold/30">
                    Search: {searchQuery}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm border border-blue-500/30">
                    Status: {statusFilter}
                  </span>
                )}
                {currentType === 'news' && newsCategoryFilter !== 'all' && (
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm border border-purple-500/30">
                    News category: {newsCategoryFilter}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setNewsCategoryFilter('all');
                    setDateFilter('all');
                  }}
                  className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm border border-red-500/30 hover:bg-red-500/30 transition-all"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-effect rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">{`Total ${currentTypeLabel}`}</div>
              <div className="text-2xl font-bold text-white">{totalCurrent}</div>
            </div>
            <div className="glass-effect rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Published</div>
              <div className="text-2xl font-bold text-green-400">
                {publishedCurrent}
              </div>
            </div>
            <div className="glass-effect rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Drafts</div>
              <div className="text-2xl font-bold text-gray-400">
                {draftCurrent}
              </div>
            </div>
            <div className="glass-effect rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">All Content Items</div>
              <div className="text-2xl font-bold text-blue-400">
                {content.length}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          {filteredContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredContent.map((item) => (
                <div 
                  key={item.id} 
                  className="glass-effect rounded-xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group"
                >
                  {/* Thumbnail */}
                  <div className="h-48 bg-gradient-to-br from-white/5 to-white/10 overflow-hidden relative">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23222" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="18" fill="%23666" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconNewspaper className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                    
                    {/* Status Badge Overlay */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${getStatusBadgeColor(item.isActive)}`}>
                        {item.isActive ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Category Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryBadgeColor(item.type)}`}>
                          {item.type.toUpperCase()}
                        </span>
                        {item.type === 'news' && item.isImportant && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
                            IMPORTANT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <IconCalendar className="w-4 h-4" />
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-ipl-gold transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {item.content}
                    </p>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-4 border-t border-white/10">
                      <button 
                        onClick={() => handleEditContent(item)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-all group/btn"
                        title="Edit"
                      >
                        <IconEdit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      
                      <button 
                        onClick={() => handlePreview(item)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 transition-all group/btn"
                        title="Preview"
                      >
                        <IconEye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteContent(item.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-all group/btn"
                        title="Delete"
                      >
                        <IconTrash className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="glass-effect rounded-xl p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ipl-gold/20 to-ipl-purple/20 flex items-center justify-center">
                  <IconNewspaper className="w-12 h-12 text-gray-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No content found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || statusFilter !== 'all' || (currentType === 'news' && newsCategoryFilter !== 'all')
                  ? "Try adjusting your filters to find what you're looking for."
                  : 'Get started by creating your first news article.'}
              </p>
              <button 
                onClick={handleAddContent}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-ipl-gold to-ipl-purple px-6 py-3 rounded-xl font-semibold text-white hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <IconPlus className="w-5 h-5" />
                Create News
              </button>
            </div>
          )}

          {/* Content Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="glass-effect rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-white">
                      {editingContent ? 'Edit Content' : 'Create New Content'}
                    </h2>
                    <button 
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Content Type
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                        >
                          <option value="news">News</option>
                          <option value="banner">Banner</option>
                          <option value="highlight">Highlight</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          value={formData.isActive ? 'active' : 'inactive'}
                          onChange={(e) => setFormData({...formData, isActive: e.target.value === 'active'})}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                        >
                          <option value="active">Published</option>
                          <option value="inactive">Draft</option>
                        </select>
                        {formData.type === 'news' && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              id="isImportant"
                              type="checkbox"
                              checked={formData.isImportant}
                              onChange={(e) =>
                                setFormData({ ...formData, isImportant: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-white/40 bg-white/10 text-ipl-gold focus:ring-ipl-gold/60"
                            />
                            <label htmlFor="isImportant" className="text-sm text-gray-300">
                              Mark as important (reserve featured block on news pages)
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                        placeholder="Enter content title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Content
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                        placeholder="Enter content description"
                        rows={6}
                        required
                      />
                    </div>

                    {formData.type === 'news' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Short Summary
                          </label>
                          <textarea
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                            placeholder="One or two lines that will appear in news lists and cards"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                              News Category
                            </label>
                            <select
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                            >
                              <option value="match">Match</option>
                              <option value="team">Team</option>
                              <option value="player">Player</option>
                              <option value="general">General</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                              Linked Match (optional)
                            </label>
                            <select
                              value={formData.linkedMatchId}
                              onChange={(e) => setFormData({ ...formData, linkedMatchId: e.target.value })}
                              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                            >
                              <option value="">No match linked</option>
                              {matches.map((match) => (
                                <option key={match.id} value={match.id}>
                                  {match.team1.shortName} vs {match.team2.shortName} 
                                  {match.date} {match.time}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                              Linked Teams (for team news)
                            </label>
                            <select
                              multiple
                              value={formData.linkedTeamIds}
                              onChange={(e) => {
                                const ids = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                                setFormData({ ...formData, linkedTeamIds: ids });
                              }}
                              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all h-32"
                            >
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.name} ({team.shortName})
                                </option>
                              ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-400">Hold Ctrl/Cmd to select multiple teams.</p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                              Linked Players (for player stories)
                            </label>
                            <select
                              multiple
                              value={formData.linkedPlayerIds}
                              onChange={(e) => {
                                const ids = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                                setFormData({ ...formData, linkedPlayerIds: ids });
                              }}
                              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all h-32"
                            >
                              {players.map((player) => (
                                <option key={player.id} value={player.id}>
                                  {player.name} ({player.role})
                                </option>
                              ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-400">Optional: used to show this article in player news panels.</p>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Image URL
                        </label>
                        <input
                          type="text"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Video URL
                        </label>
                        <input
                          type="text"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-ipl-gold focus:ring-2 focus:ring-ipl-gold/20 transition-all"
                          placeholder="https://example.com/video.mp4"
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-4 pt-6 border-t border-white/10">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-ipl-gold to-ipl-purple text-white font-semibold py-4 px-6 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200"
                      >
                        {editingContent ? 'Update Content' : 'Create Content'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 glass-effect text-white font-semibold py-4 px-6 rounded-xl hover:bg-white/20 transition-all duration-200"
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
