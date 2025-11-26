'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
  footer?: ReactNode;
  showCloseButton?: boolean;
  icon?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function ModernDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  variant = 'default',
  footer,
  showCloseButton = true,
  icon,
  className = '',
  contentClassName = '',
}: ModernDialogProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  const variantClasses = {
    default: {
      header: 'border-white/10 bg-gradient-to-r from-white/5 to-white/3',
      icon: 'bg-blue-500/15 border-blue-400/30 text-blue-300',
      accent: 'from-blue-500 to-blue-600',
    },
    danger: {
      header: 'border-red-500/20 bg-gradient-to-r from-red-500/10 to-red-600/5',
      icon: 'bg-red-500/15 border-red-400/30 text-red-300',
      accent: 'from-red-500 to-red-600',
    },
    warning: {
      header: 'border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5',
      icon: 'bg-yellow-500/15 border-yellow-400/30 text-yellow-300',
      accent: 'from-yellow-500 to-yellow-600',
    },
    success: {
      header: 'border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5',
      icon: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
      accent: 'from-emerald-500 to-emerald-600',
    },
    info: {
      header: 'border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-cyan-600/5',
      icon: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300',
      accent: 'from-cyan-500 to-cyan-600',
    },
  };

  const styles = variantClasses[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`pointer-events-auto w-full ${sizeClasses[size]} overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl ${className}`}
            >
              {/* Header */}
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className={`relative px-6 py-5 border-b ${styles.header}`}
              >
                {/* Animated gradient line */}
                <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${styles.accent}`} />

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  {icon ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${styles.icon}`}
                    >
                      {icon}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border font-bold ${styles.icon}`}
                    >
                      ℹ
                    </motion.div>
                  )}

                  <div className="flex-1 pt-0.5">
                    <motion.h2
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                      className="text-xl font-semibold text-white leading-tight"
                    >
                      {title}
                    </motion.h2>
                    {description && (
                      <motion.p
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="mt-1 text-sm text-gray-300"
                      >
                        {description}
                      </motion.p>
                    )}
                  </div>

                  {/* Close Button */}
                  {showCloseButton && (
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                      aria-label="Close dialog"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </motion.button>
                  )}
                </div>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className={`px-6 py-6 ${contentClassName}`}
              >
                {children}
              </motion.div>

              {/* Footer */}
              {footer && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="border-t border-white/10 bg-gradient-to-r from-white/2 to-white/1 px-6 py-4"
                >
                  {footer}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
