'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface BatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemCount: number;
  itemType?: string;
  warningMessage?: string;
}

export default function BatchDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemCount,
  itemType = 'items',
  warningMessage,
}: BatchDeleteModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-[#0B0F13] border border-[#2A3440] rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-4 p-6 border-b border-[#2A3440]">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#E6EDF3]">Confirm Deletion</h2>
                  <p className="text-sm text-[#AEBAC7] mt-1">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-[#AEBAC7] hover:text-[#E6EDF3] hover:bg-[#141A22] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-[#E6EDF3] mb-4">
                  Are you sure you want to delete <span className="font-semibold text-red-400">{itemCount}</span>{' '}
                  {itemType}? This action is permanent and cannot be undone.
                </p>
                {warningMessage && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
                    <p className="text-sm text-yellow-400">{warningMessage}</p>
                  </div>
                )}
                <div className="p-3 bg-[#141A22] border border-[#2A3440] rounded-lg">
                  <p className="text-xs text-[#AEBAC7]">
                    <strong className="text-[#E6EDF3]">Note:</strong> All associated data will be permanently removed
                    from the system.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-[#2A3440]">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-red-500 rounded-lg text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete {itemCount} {itemType}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

