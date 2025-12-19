'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Icon from '@/components/ui/Icon';

// Types
interface Issue {
  id: string;
  type: IssueType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reporterEmail?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  votes: number;
}

type IssueType = 
  | 'account_login'
  | 'team_player_data'
  | 'live_score'
  | 'match_info'
  | 'performance_bugs'
  | 'feature_request'
  | 'content_issues'
  | 'other';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

const ISSUE_TYPES: { [key in IssueType]: string } = {
  account_login: 'Account/Login Issues',
  team_player_data: 'Team/Player Data Issues',
  live_score: 'Live Score Problems',
  match_info: 'Match Information Errors',
  performance_bugs: 'Performance/Bugs',
  feature_request: 'Feature Requests',
  content_issues: 'Content Issues',
  other: 'Other'
};

const ISSUE_PRIORITIES = {
  low: { label: 'Low', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  medium: { label: 'Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  high: { label: 'High', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  critical: { label: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/20' }
};

const ISSUE_STATUSES = {
  open: { label: 'Open', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  resolved: { label: 'Resolved', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  closed: { label: 'Closed', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
};

const MOCK_FAQS: FAQ[] = [
  {
    id: '1',
    question: 'How do I reset my password?',
    answer: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.',
    category: 'Account',
    helpful: 45
  },
  {
    id: '2',
    question: 'Live scores are not updating, what should I do?',
    answer: 'Try refreshing the page or clearing your browser cache. If issues persist, report it below.',
    category: 'Live Score',
    helpful: 32
  },
  {
    id: '3',
    question: 'How can I report incorrect team or player information?',
    answer: 'Use the issue reporting form below and select "Team/Player Data Issues" category.',
    category: 'Data',
    helpful: 28
  },
  {
    id: '4',
    question: 'Why am I seeing login errors?',
    answer: 'Check your credentials, ensure your account is verified, or try resetting your password.',
    category: 'Account',
    helpful: 51
  }
];

export default function IssuesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<IssueType>('other');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'issues' | 'faq'>('issues');

  // Form state
  const [formData, setFormData] = useState({
    type: 'other' as IssueType,
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    email: ''
  });

  useEffect(() => {
    // Simulate loading issues
    setTimeout(() => {
      setIssues([
        {
          id: '1',
          type: 'live_score',
          title: 'Live score not updating for RCB vs MI match',
          description: 'The live score has been stuck at 45/2 for 30 minutes',
          priority: 'high',
          status: 'in_progress',
          reporterEmail: 'user@example.com',
          attachments: [],
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 1800000),
          votes: 12
        },
        {
          id: '2',
          type: 'account_login',
          title: 'Unable to login with Google account',
          description: 'Getting authentication error when trying to login with Google',
          priority: 'medium',
          status: 'open',
          reporterEmail: 'user2@example.com',
          attachments: [],
          createdAt: new Date(Date.now() - 7200000),
          updatedAt: new Date(Date.now() - 7200000),
          votes: 8
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredIssues = useMemo(() => {
    let filtered = issues;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      // Sort by priority first, then by date
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [issues, statusFilter, searchQuery]);

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newIssue: Issue = {
        id: Date.now().toString(),
        type: formData.type,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'open',
        email: formData.email,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        votes: 0
      };

      setIssues([newIssue, ...issues]);
      setFormData({ type: 'other', title: '', description: '', priority: 'medium', email: '' });
      setShowForm(false);
      alert('Issue submitted successfully! We\'ll review it shortly.');
    } catch (error) {
      alert('Failed to submit issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (issueId: string) => {
    setIssues(issues.map(issue => 
      issue.id === issueId 
        ? { ...issue, votes: issue.votes + 1 }
        : issue
    ));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ISSUE_STATUSES[status as keyof typeof ISSUE_STATUSES];
    return statusConfig ? (
      <span className={`px-2 py-1 text-xs rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    ) : null;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = ISSUE_PRIORITIES[priority as keyof typeof ISSUE_PRIORITIES];
    return priorityConfig ? (
      <span className={`px-2 py-1 text-xs rounded-full ${priorityConfig.bgColor} ${priorityConfig.color}`}>
        {priorityConfig.label}
      </span>
    ) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Support & Issues</h1>
          <p className="text-gray-600 text-lg">
            Report problems, track issues, and find solutions to common questions.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'issues'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Issues ({issues.length})
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'faq'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            FAQ ({MOCK_FAQS.length})
          </button>
        </div>

        {activeTab === 'issues' && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium"
                >
                  Report New Issue
                </button>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
            </div>

            {/* Issue Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Report New Issue</h2>
                      <button
                        onClick={() => setShowForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handleSubmitIssue} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Issue Type
                          </label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as IssueType })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            {Object.entries(ISSUE_TYPES).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                          </label>
                          <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email (for updates)
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your@email.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Brief description of the issue"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Detailed Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Provide as much detail as possible including steps to reproduce the issue"
                          required
                        />
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Submitting...' : 'Submit Issue'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Issues List */}
            <div className="space-y-4">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg mb-2">No issues found</div>
                  <p className="text-gray-400">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms'
                      : 'Be the first to report an issue!'
                    }
                  </p>
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <div key={issue.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
                          {getPriorityBadge(issue.priority)}
                          {getStatusBadge(issue.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{ISSUE_TYPES[issue.type]}</span>
                          <span>•</span>
                          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                          {issue.votes > 0 && (
                            <>
                              <span>•</span>
                              <span>{issue.votes} votes</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleVote(issue.id)}
                        className="ml-4 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Upvote this issue"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{issue.description}</p>
                    
                    {issue.reporterEmail && (
                      <div className="text-sm text-gray-500">
                        Reported by {issue.reporterEmail}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-4">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search FAQs..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {MOCK_FAQS.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{faq.question}</h3>
                  <span className="text-sm text-gray-500 ml-4">{faq.helpful} helpful</span>
                </div>
                <p className="text-gray-700">{faq.answer}</p>
                <div className="mt-4 text-sm text-gray-500">
                  Category: {faq.category}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
