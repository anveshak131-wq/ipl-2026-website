'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Types
interface Issue {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reporterEmail?: string;
  assignedTo?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  votes: number;
  resolutionNotes?: string;
}

interface SupportMetrics {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  avgResolutionTime: number;
  issuesByType: { [key: string]: number };
}

const ISSUE_TYPES: { [key: string]: string } = {
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

export default function AdminSupportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'issues' | 'analytics'>('issues');

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchIssues();
    fetchMetrics();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/issues');
      const data = await response.json();
      if (data.success) {
        setIssues(data.data);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Calculate metrics from issues
      const mockMetrics: SupportMetrics = {
        totalIssues: 0,
        openIssues: 0,
        inProgressIssues: 0,
        resolvedIssues: 0,
        criticalIssues: 0,
        avgResolutionTime: 24.5, // hours
        issuesByType: {}
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const filteredIssues = useMemo(() => {
    let filtered = issues;

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.priority === priorityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(issue => issue.type === typeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.reporterEmail?.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [issues, statusFilter, priorityFilter, typeFilter, searchQuery]);

  const handleSelectIssue = (issueId: string) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIssues.length === filteredIssues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(filteredIssues.map(issue => issue.id));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIssues.length === 0) return;

    try {
      const response = await fetch('/api/issues/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueIds: selectedIssues,
          status: newStatus
        })
      });

      if (response.ok) {
        fetchIssues(); // Refresh issues
        setSelectedIssues([]);
        setShowBulkActions(false);
        alert(`Updated ${selectedIssues.length} issues to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating issues:', error);
      alert('Failed to update issues');
    }
  };

  const handleStatusUpdate = async (issueId: string, status: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchIssues(); // Refresh issues
        setShowStatusModal(false);
        setSelectedIssue(null);
        alert('Issue status updated successfully');
      }
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue');
    }
  };

  const handleAddResolutionNotes = async (issueId: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'resolved',
          resolutionNotes 
        })
      });

      if (response.ok) {
        fetchIssues(); // Refresh issues
        setShowNotesModal(false);
        setSelectedIssue(null);
        setResolutionNotes('');
        alert('Resolution notes added successfully');
      }
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue');
    }
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Management</h1>
          <p className="text-gray-600">
            Manage and resolve user-reported issues and track support performance.
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
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'issues' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
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

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {Object.entries(ISSUE_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Bulk Actions */}
              {selectedIssues.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-800">
                    {selectedIssues.length} issue{selectedIssues.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-3 py-1 border border-blue-300 rounded text-sm"
                    >
                      <option value="">Change status to...</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={handleBulkStatusUpdate}
                      disabled={!newStatus}
                      className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Update Selected
                    </button>
                    <button
                      onClick={() => setSelectedIssues([])}
                      className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Issues Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedIssues.length === filteredIssues.length}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reporter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Votes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No issues found matching your filters
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map((issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIssues.includes(issue.id)}
                              onChange={() => handleSelectIssue(issue.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{issue.title}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(issue.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {ISSUE_TYPES[issue.type] || issue.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {getPriorityBadge(issue.priority)}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(issue.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {issue.reporterEmail || 'Anonymous'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {issue.votes}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setNewStatus(issue.status);
                                  setShowStatusModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Update Status
                              </button>
                              {issue.status !== 'resolved' && (
                                <button
                                  onClick={() => {
                                    setSelectedIssue(issue);
                                    setResolutionNotes('');
                                    setShowNotesModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  Resolve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-gray-900">{metrics.totalIssues}</div>
              <div className="text-sm text-gray-600 mt-1">Total Issues</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-blue-600">{metrics.openIssues}</div>
              <div className="text-sm text-gray-600 mt-1">Open Issues</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-yellow-600">{metrics.inProgressIssues}</div>
              <div className="text-sm text-gray-600 mt-1">In Progress</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-2xl font-bold text-green-600">{metrics.resolvedIssues}</div>
              <div className="text-sm text-gray-600 mt-1">Resolved</div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedIssue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Issue Status
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedIssue(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedIssue.id, newStatus)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Notes Modal */}
        {showNotesModal && selectedIssue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Resolution Notes
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe how this issue was resolved..."
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowNotesModal(false);
                    setSelectedIssue(null);
                    setResolutionNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddResolutionNotes(selectedIssue.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
