'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react';

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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md glass-effect rounded-2xl border border-red-500/30 shadow-2xl backdrop-blur-xl bg-gradient-to-br from-[#0B0F13]/95 via-[#1a0f0f]/95 to-[#0B0F13]/95">
              {/* Header with animated warning icon */}
              <div className="relative overflow-hidden border-b border-red-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 opacity-50"></div>
                <div className="relative flex items-center gap-4 p-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center border border-red-500/50 shadow-lg shadow-red-500/20"
                  >
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <AlertTriangle className="w-7 h-7 text-red-400" />
                    </motion.div>
                  </motion.div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Confirm Deletion
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      This action cannot be undone
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-white mb-4 leading-relaxed"
                >
                  Are you sure you want to delete <span className="font-bold text-red-400 px-2 py-1 rounded-md bg-red-500/10">{itemCount}</span>{' '}
                  {itemType}? This action is permanent and cannot be undone.
                </motion.p>
                {warningMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-300 leading-relaxed">{warningMessage}</p>
                    </div>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 bg-white/5 border border-red-500/20 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-white mb-1">⚠️ Permanent Deletion</p>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        All associated data, including scores, statistics, and related information, will be permanently removed from the system and cannot be recovered.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="relative border-t border-red-500/20 p-6 bg-gradient-to-t from-black/20 to-transparent">
                <div className="flex items-center justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 font-medium hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirm}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg shadow-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete {itemCount} {itemType}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

