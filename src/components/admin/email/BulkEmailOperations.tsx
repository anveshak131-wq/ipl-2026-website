'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Download, Trash2, CheckCircle2, XCircle, Send, Eye } from 'lucide-react';
import BatchDeleteModal from '../BatchDeleteModal';
import { useToast } from '../Toast';

interface BulkEmailOperationsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkEnable: () => void;
  onBulkDisable: () => void;
  onBulkExport: () => void;
  onBulkDelete: () => void;
  onBulkSendEmail: () => void;
  onBulkPreviewEmail: () => void;
}

export default function BulkEmailOperations({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkEnable,
  onBulkDisable,
  onBulkExport,
  onBulkDelete,
  onBulkSendEmail,
  onBulkPreviewEmail,
}: BulkEmailOperationsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { success } = useToast();

  if (selectedCount === 0) return null;

  const handleBulkEnable = () => {
    onBulkEnable();
    success(`Enabled email notifications for ${selectedCount} user${selectedCount > 1 ? 's' : ''}`);
  };

  const handleBulkDisable = () => {
    onBulkDisable();
    success(`Disabled email notifications for ${selectedCount} user${selectedCount > 1 ? 's' : ''}`);
  };

  const handleBulkExport = () => {
    onBulkExport();
    success(`Exporting ${selectedCount} user${selectedCount > 1 ? 's' : ''}...`);
  };

  const handleBulkDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    onBulkDelete();
    setShowDeleteModal(false);
    success(`Deleted ${selectedCount} user${selectedCount > 1 ? 's' : ''}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-[#141A22] border-b border-[#2A3440] p-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-[#E6EDF3] font-medium">
              {selectedCount} of {totalCount} selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onSelectAll}
                className="px-3 py-1.5 text-xs font-medium text-[#2F6FED] hover:text-[#2563EB] transition-colors"
              >
                Select All
              </button>
              <span className="text-[#6B7280]">|</span>
              <button
                onClick={onDeselectAll}
                className="px-3 py-1.5 text-xs font-medium text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkEnable}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Enable
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkDisable}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Disable
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBulkPreviewEmail}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm font-medium hover:bg-[#141A22] transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview Email
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBulkSendEmail}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2F6FED] border border-[#2F6FED]/30 rounded-lg text-white text-sm font-medium hover:bg-[#2563EB] transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Email
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-sm font-medium hover:bg-[#141A22] transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </motion.button>
          </div>
        </div>
      </motion.div>

      <BatchDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        itemCount={selectedCount}
        itemType="users"
        warningMessage="This will permanently delete the selected users and all their data. This action cannot be undone."
      />
    </>
  );
}

