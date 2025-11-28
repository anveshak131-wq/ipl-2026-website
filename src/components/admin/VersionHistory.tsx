'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Clock, User, RotateCcw, Eye, Check } from 'lucide-react';
import type { VersionHistory as VersionHistoryType } from '@/types/audit';
import BatchDeleteModal from './BatchDeleteModal';

interface VersionHistoryProps {
  entityType: string;
  entityId: string;
  onRollback?: (versionId: string) => void;
  onView?: (versionId: string) => void;
}

export default function VersionHistory({
  entityType,
  entityId,
  onRollback,
  onView,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [entityType, entityId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/versions?entityType=${entityType}&entityId=${entityId}`
      );
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = (versionId: string) => {
    setSelectedVersion(versionId);
    setShowRollbackConfirm(true);
  };

  const confirmRollback = () => {
    if (selectedVersion && onRollback) {
      onRollback(selectedVersion);
      setShowRollbackConfirm(false);
      setSelectedVersion(null);
      fetchVersions();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-[#2F6FED]" />
          <h2 className="text-2xl font-bold text-[#E6EDF3]">Version History</h2>
        </div>
        <div className="text-sm text-[#AEBAC7]">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Versions List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-[#AEBAC7]">Loading versions...</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-[#AEBAC7]">No version history available</div>
        ) : (
          versions.map((version, index) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 border rounded-lg transition-colors ${
                version.isCurrent
                  ? 'bg-[#1A2332] border-[#2F6FED] border-2'
                  : 'bg-[#141A22] border-[#2A3440] hover:border-[#2F6FED]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-[#1A2332] border border-[#2A3440] rounded text-sm font-semibold text-[#E6EDF3]">
                      v{version.version}
                    </span>
                    {version.isCurrent && (
                      <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs font-semibold text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Current
                      </span>
                    )}
                    <span className="text-[#E6EDF3] font-semibold">{version.entityName}</span>
                  </div>

                  {version.changeSummary && (
                    <p className="text-[#AEBAC7] mb-3">{version.changeSummary}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{version.createdBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimestamp(version.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {onView && (
                    <button
                      onClick={() => onView(version.id)}
                      className="p-2 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#141A22] transition-colors"
                      title="View version"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onRollback && !version.isCurrent && (
                    <button
                      onClick={() => handleRollback(version.id)}
                      className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                      title="Rollback to this version"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Rollback Confirmation */}
      <BatchDeleteModal
        isOpen={showRollbackConfirm}
        onClose={() => {
          setShowRollbackConfirm(false);
          setSelectedVersion(null);
        }}
        onConfirm={confirmRollback}
        itemCount={1}
        itemType="version"
        warningMessage="This will restore the selected version and create a new version with the current state."
      />
    </div>
  );
}

