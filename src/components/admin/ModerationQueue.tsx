'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Trash2, Eye, EyeOff, Users, Clock, TrendingUp } from 'lucide-react';
import type { FlaggedContent, ModerationStats } from '@/lib/moderation-rules';

interface ModerationQueueProps {
  items: FlaggedContent[];
  stats: ModerationStats;
  onReview: (itemId: string, action: 'flag' | 'hide' | 'delete' | 'blockUser' | 'none', reason: string) => void;
  onBulkAction: (itemIds: string[], action: 'flag' | 'hide' | 'delete' | 'blockUser' | 'none', reason: string) => void;
  isLoading?: boolean;
}

export default function ModerationQueue({
  items,
  stats,
  onReview,
  onBulkAction,
  isLoading = false,
}: ModerationQueueProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'flag' | 'hide' | 'delete' | 'blockUser' | 'none'>('none');
  const [bulkReason, setBulkReason] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredItems = items.filter(
    (item) => filterSeverity === 'all' || item.severity === filterSeverity
  );

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleBulkAction = () => {
    if (selectedItems.size === 0 || bulkAction === 'none') return;
    onBulkAction(Array.from(selectedItems), bulkAction, bulkReason);
    setSelectedItems(new Set());
    setBulkReason('');
  };

  const getSeverityColor = (severity: FlaggedContent['severity']) => {
    const colors = {
      low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[severity];
  };

  const getSeverityIcon = (severity: FlaggedContent['severity']) => {
    const icons = {
      low: '⚠️',
      medium: '⚠️⚠️',
      high: '🔴',
      critical: '🔴🔴',
    };
    return icons[severity];
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Flagged</p>
              <p className="text-2xl font-bold text-white">{stats.totalFlagged}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Resolved</p>
              <p className="text-2xl font-bold text-white">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Auto-Actioned</p>
              <p className="text-2xl font-bold text-white">{stats.autoActioned}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </p>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="text-gray-400 hover:text-gray-300 text-sm"
            >
              Clear selection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as any)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="none">Select action...</option>
              <option value="flag">Flag for Review</option>
              <option value="hide">Hide Content</option>
              <option value="delete">Delete Content</option>
              <option value="blockUser">Block User</option>
            </select>

            <input
              type="text"
              placeholder="Reason (optional)"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-gray-500"
            />

            <button
              onClick={handleBulkAction}
              disabled={bulkAction === 'none'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              Apply Action
            </button>
          </div>
        </div>
      )}

      {/* Filter and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Filter by severity:</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <button
          onClick={toggleAllSelection}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {selectedItems.size === filteredItems.length && filteredItems.length > 0
            ? 'Deselect All'
            : 'Select All'}
        </button>
      </div>

      {/* Queue Items */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No flagged content to review</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-800/50 border rounded-lg overflow-hidden transition-all ${
                expandedId === item.id
                  ? 'border-slate-600 ring-1 ring-slate-600'
                  : 'border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Header */}
              <div className="p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-slate-700 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(item.severity)}`}>
                        {getSeverityIcon(item.severity)} {item.severity.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white font-medium truncate">{item.userName}</p>
                    <p className="text-gray-300 text-sm truncate">{item.content}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.reviewed && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === item.id && (
                <div className="border-t border-slate-700/50 p-4 bg-slate-900/50 space-y-4">
                  {/* Full Content */}
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Full Content</p>
                    <p className="bg-slate-900 rounded p-3 text-gray-200 text-sm break-words">{item.content}</p>
                  </div>

                  {/* Flagged Rules */}
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Matched Rules</p>
                    <div className="flex flex-wrap gap-2">
                      {item.flaggedRules.map((rule) => (
                        <span key={rule} className="bg-slate-700 text-gray-300 text-xs px-2 py-1 rounded">
                          {rule}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">User ID</p>
                      <p className="text-white font-mono text-sm">{item.userId}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Match ID</p>
                      <p className="text-white font-mono text-sm">{item.matchId}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                    <button
                      onClick={() => onReview(item.id, 'flag', 'Flagged for manual review')}
                      className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded px-3 py-2 text-sm font-medium transition-colors border border-yellow-600/30"
                    >
                      Flag
                    </button>
                    <button
                      onClick={() => onReview(item.id, 'hide', 'Content hidden from view')}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded px-3 py-2 text-sm font-medium transition-colors border border-blue-600/30"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => onReview(item.id, 'delete', 'Content deleted')}
                      className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded px-3 py-2 text-sm font-medium transition-colors border border-orange-600/30"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => onReview(item.id, 'blockUser', 'User blocked')}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded px-3 py-2 text-sm font-medium transition-colors border border-red-600/30"
                    >
                      Block User
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
