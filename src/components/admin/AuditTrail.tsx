'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, User, Clock, FileText, Search, Filter, Download } from 'lucide-react';
import { AuditLog, AuditAction } from '@/types/audit';
import DateRangePicker from './DateRangePicker';

interface AuditTrailProps {
  entityType?: string;
  entityId?: string;
  onRollback?: (logId: string) => void;
}

export default function AuditTrail({ entityType, entityId, onRollback }: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [entityType, entityId, actionFilter, userFilter, dateRange]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType) params.set('entityType', entityType);
      if (entityId) params.set('entityId', entityId);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (userFilter !== 'all') params.set('userId', userFilter);
      if (dateRange.start) params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params.set('endDate', dateRange.end.toISOString());

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: AuditAction): string => {
    const colors: { [key: string]: string } = {
      create: 'bg-green-500/20 text-green-400 border-green-500/30',
      update: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      delete: 'bg-red-500/20 text-red-400 border-red-500/30',
      restore: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      publish: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      unpublish: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      approve: 'bg-green-500/20 text-green-400 border-green-500/30',
      reject: 'bg-red-500/20 text-red-400 border-red-500/30',
      login: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      logout: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      export: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      import: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      rollback: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    };
    return colors[action] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'restore':
        return '↩️';
      case 'publish':
        return '📢';
      case 'unpublish':
        return '🔇';
      case 'approve':
        return '✅';
      case 'reject':
        return '❌';
      case 'login':
        return '🔐';
      case 'logout':
        return '🚪';
      case 'export':
        return '📥';
      case 'import':
        return '📤';
      case 'rollback':
        return '⏪';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.userName.toLowerCase().includes(query) ||
        log.entityName.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const uniqueUsers = Array.from(new Set(logs.map((log) => log.userId)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-[#2F6FED]" />
          <h2 className="text-2xl font-bold text-[#E6EDF3]">Audit Trail</h2>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#141A22] transition-colors">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-[#141A22] border border-[#2A3440] rounded-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEBAC7]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit logs..."
            className="w-full pl-10 pr-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as AuditAction | 'all')}
          className="px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="restore">Restore</option>
          <option value="publish">Publish</option>
          <option value="unpublish">Unpublish</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="export">Export</option>
          <option value="import">Import</option>
          <option value="rollback">Rollback</option>
        </select>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-4 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
        >
          <option value="all">All Users</option>
          {uniqueUsers.map((userId) => {
            const user = logs.find((l) => l.userId === userId);
            return (
              <option key={userId} value={userId}>
                {user?.userName || userId}
              </option>
            );
          })}
        </select>

        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-[#AEBAC7]">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-[#AEBAC7]">No audit logs found</div>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-[#141A22] border border-[#2A3440] rounded-lg hover:border-[#2F6FED]/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getActionIcon(log.action)}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(log.action)}`}
                    >
                      {log.action.toUpperCase()}
                    </span>
                    <span className="text-[#E6EDF3] font-semibold">{log.entityName}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[#AEBAC7] mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{log.userName}</span>
                      <span className="text-[#6B7280]">({log.userEmail})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                    {log.ipAddress && (
                      <div className="text-[#6B7280]">IP: {log.ipAddress}</div>
                    )}
                  </div>

                  {/* Changes */}
                  {log.changes && log.changes.length > 0 && (
                    <div className="mt-3 p-3 bg-[#0B0F13] border border-[#2A3440] rounded-lg">
                      <div className="text-xs font-semibold text-[#AEBAC7] uppercase tracking-wider mb-2">
                        Changes
                      </div>
                      <div className="space-y-2">
                        {log.changes.map((change, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="text-[#E6EDF3] font-medium">{change.field}:</span>{' '}
                            <span className="text-red-400 line-through">
                              {change.oldValue !== null && change.oldValue !== undefined
                                ? String(change.oldValue)
                                : 'null'}
                            </span>{' '}
                            <span className="text-[#6B7280]">→</span>{' '}
                            <span className="text-green-400">
                              {change.newValue !== null && change.newValue !== undefined
                                ? String(change.newValue)
                                : 'null'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {onRollback && (log.action === 'update' || log.action === 'delete') && (
                  <button
                    onClick={() => onRollback(log.id)}
                    className="px-3 py-2 text-sm bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                  >
                    Rollback
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

