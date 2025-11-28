'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit, Download, CheckSquare, Square, MoreVertical } from 'lucide-react';

interface BulkOperationsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkEdit?: () => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  onBulkStatusUpdate?: (status: string) => void;
  statusOptions?: { value: string; label: string }[];
  showSelectAll?: boolean;
}

export default function BulkOperationsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  onBulkStatusUpdate,
  statusOptions = [],
  showSelectAll = true,
}: BulkOperationsToolbarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const allSelected = selectedCount === totalCount && totalCount > 0;

  if (selectedCount === 0) {
    return showSelectAll ? (
      <div className="flex items-center justify-between p-4 bg-[#141A22] border border-[#2A3440] rounded-lg">
        <button
          onClick={onSelectAll}
          className="flex items-center gap-2 px-4 py-2 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
        >
          <Square className="w-4 h-4" />
          <span className="text-sm font-medium">Select All ({totalCount})</span>
        </button>
      </div>
    ) : null;
  }

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-10 p-4 bg-gradient-to-r from-[#1A2332] to-[#141A22] border-b border-[#2A3440] shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2 px-3 py-2 bg-[#0B0F13] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#141A22] transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {allSelected ? 'Deselect All' : 'Select All'} ({selectedCount} selected)
            </span>
          </button>

          <div className="h-6 w-px bg-[#2A3440]" />

          <div className="flex items-center gap-2">
            {onBulkEdit && (
              <button
                onClick={onBulkEdit}
                className="flex items-center gap-2 px-3 py-2 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#141A22] transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
            )}

            {onBulkStatusUpdate && statusOptions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#141A22] transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                  <span className="text-sm">Update Status</span>
                </button>

                <AnimatePresence>
                  {showStatusMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-[#0B0F13] border border-[#2A3440] rounded-lg shadow-xl z-20"
                    >
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            onBulkStatusUpdate(option.value);
                            setShowStatusMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-[#E6EDF3] hover:bg-[#141A22] transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {onBulkExport && (
              <button
                onClick={onBulkExport}
                className="flex items-center gap-2 px-3 py-2 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#141A22] transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Export</span>
              </button>
            )}

            {onBulkDelete && (
              <button
                onClick={onBulkDelete}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-sm text-[#AEBAC7]">
          <span className="font-semibold text-[#E6EDF3]">{selectedCount}</span> of{' '}
          <span className="font-semibold text-[#E6EDF3]">{totalCount}</span> selected
        </div>
      </div>
    </motion.div>
  );
}

