'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, MessageSquare, Trash2, Edit2, Plus } from 'lucide-react';
import type { Incident, IncidentStats } from '@/lib/incident-manager';

interface IncidentLogProps {
  incidents: Incident[];
  stats: IncidentStats;
  onCreateIncident?: (title: string, description: string, category: string, severity: string) => void;
  onUpdateStatus?: (incidentId: string, status: string) => void;
  onAddComment?: (incidentId: string, comment: string) => void;
  onResolveIncident?: (incidentId: string, rootCause: string, resolution: string) => void;
}

export default function IncidentLog({
  incidents,
  stats,
  onCreateIncident,
  onUpdateStatus,
  onAddComment,
  onResolveIncident,
}: IncidentLogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'investigating' | 'resolved' | 'closed'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    category: 'technical',
    severity: 'high',
  });
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const filteredIncidents = incidents.filter((incident) => {
    if (filterStatus !== 'all' && incident.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && incident.severity !== filterSeverity) return false;
    return true;
  });

  const handleCreateIncident = () => {
    if (newIncident.title && onCreateIncident) {
      onCreateIncident(
        newIncident.title,
        newIncident.description,
        newIncident.category,
        newIncident.severity
      );
      setNewIncident({ title: '', description: '', category: 'technical', severity: 'high' });
      setShowCreateForm(false);
    }
  };

  const handleAddComment = (incidentId: string) => {
    const text = commentText[incidentId];
    if (text && onAddComment) {
      onAddComment(incidentId, text);
      setCommentText({ ...commentText, [incidentId]: '' });
    }
  };

  const getSeverityColor = (severity: Incident['severity']) => {
    const colors = {
      low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[severity];
  };

  const getStatusColor = (status: Incident['status']) => {
    const colors = {
      open: 'bg-red-500/10 text-red-400 border-red-500/20',
      investigating: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
      closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colors[status];
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <p className="text-gray-400 text-sm mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <p className="text-gray-400 text-sm mb-1">Open</p>
          <p className="text-2xl font-bold text-red-400">{stats.open}</p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <p className="text-gray-400 text-sm mb-1">Investigating</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.investigating}</p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <p className="text-gray-400 text-sm mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <p className="text-gray-400 text-sm mb-1">Avg Resolution</p>
          <p className="text-lg font-bold text-white">
            {Math.round(stats.avgResolutionTime / 60000)}m
          </p>
        </div>
      </div>

      {/* Create Incident Form */}
      {showCreateForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">Create New Incident</h3>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Incident title"
              value={newIncident.title}
              onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-500"
            />

            <textarea
              placeholder="Description"
              value={newIncident.description}
              onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-500 h-24 resize-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <select
                value={newIncident.category}
                onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="performance">Performance</option>
                <option value="moderation">Moderation</option>
                <option value="technical">Technical</option>
                <option value="user">User</option>
                <option value="data">Data</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>

              <select
                value={newIncident.severity}
                onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateIncident}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-medium transition-colors"
              >
                Create Incident
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded px-4 py-2 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Incident
          </button>
        )}
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No incidents found</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className={`bg-slate-800/50 border rounded-lg overflow-hidden transition-all cursor-pointer ${
                expandedId === incident.id
                  ? 'border-slate-600 ring-1 ring-slate-600'
                  : 'border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Header */}
              <div
                className="p-4"
                onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(incident.status)}`}>
                        {incident.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-xs">{incident.id}</span>
                    </div>
                    <h3 className="text-white font-semibold truncate">{incident.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {incident.category} • {formatTime(incident.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {incident.comments.length > 0 && (
                      <div className="flex items-center gap-1 text-blue-400 text-sm">
                        <MessageSquare className="w-4 h-4" />
                        {incident.comments.length}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === incident.id && (
                <div className="border-t border-slate-700/50 p-4 bg-slate-900/50 space-y-4">
                  {/* Description */}
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Description</p>
                    <p className="text-gray-200 text-sm">{incident.description}</p>
                  </div>

                  {/* Affected Systems */}
                  {incident.affectedSystems && incident.affectedSystems.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Affected Systems</p>
                      <div className="flex flex-wrap gap-2">
                        {incident.affectedSystems.map((system) => (
                          <span key={system} className="bg-slate-700 text-gray-300 text-xs px-2 py-1 rounded">
                            {system}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Root Cause & Resolution */}
                  {incident.rootCause && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Root Cause</p>
                      <p className="text-gray-200 text-sm bg-slate-800/50 rounded p-2">{incident.rootCause}</p>
                    </div>
                  )}

                  {incident.resolution && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Resolution</p>
                      <p className="text-gray-200 text-sm bg-slate-800/50 rounded p-2">{incident.resolution}</p>
                    </div>
                  )}

                  {/* Comments */}
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">
                      Comments ({incident.comments.length})
                    </p>

                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                      {incident.comments.map((comment) => (
                        <div key={comment.id} className="bg-slate-800/50 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-gray-300 text-xs font-semibold">{comment.author}</p>
                            <p className="text-gray-500 text-xs">{formatTime(comment.timestamp)}</p>
                          </div>
                          <p className="text-gray-200 text-sm">{comment.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    {incident.status !== 'closed' && onAddComment && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentText[incident.id] || ''}
                          onChange={(e) => setCommentText({ ...commentText, [incident.id]: e.target.value })}
                          className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm placeholder-gray-500"
                        />
                        <button
                          onClick={() => handleAddComment(incident.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-sm font-medium transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {incident.status !== 'closed' && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {incident.status === 'open' && onUpdateStatus && (
                        <button
                          onClick={() => onUpdateStatus(incident.id, 'investigating')}
                          className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded px-3 py-2 text-sm font-medium transition-colors border border-yellow-600/30"
                        >
                          Start Investigation
                        </button>
                      )}

                      {incident.status === 'investigating' && onResolveIncident && (
                        <button
                          onClick={() => {
                            const rootCause = prompt('Root cause:');
                            const resolution = prompt('Resolution:');
                            if (rootCause && resolution) {
                              onResolveIncident(incident.id, rootCause, resolution);
                            }
                          }}
                          className="bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded px-3 py-2 text-sm font-medium transition-colors border border-green-600/30"
                        >
                          Resolve
                        </button>
                      )}

                      {incident.status === 'resolved' && onUpdateStatus && (
                        <button
                          onClick={() => onUpdateStatus(incident.id, 'closed')}
                          className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded px-3 py-2 text-sm font-medium transition-colors border border-gray-600/30"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
