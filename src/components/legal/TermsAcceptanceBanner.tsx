'use client';

import { useTermsAccepted } from '@/hooks/useTermsAccepted';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface TermsAcceptanceBannerProps {
  dismissible?: boolean;
  position?: 'top' | 'bottom';
  className?: string;
}

export default function TermsAcceptanceBanner({
  dismissible = true,
  position = 'bottom',
  className = '',
}: TermsAcceptanceBannerProps) {
  const termsAccepted = useTermsAccepted();
  const [isDismissed, setIsDismissed] = useState(false);

  if (termsAccepted || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -100 : 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'top' ? -100 : 100 }}
        transition={{ duration: 0.3 }}
        className={`fixed ${position}-4 left-4 right-4 z-40 max-w-md ${className}`}
      >
        <div className="bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm shadow-xl">
          <div className="flex items-start gap-3">
            <div className="text-xl flex-shrink-0">⚖️</div>
            
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-200 mb-1">
                Please Review Terms & Conditions
              </h3>
              <p className="text-xs text-yellow-100/80 mb-3">
                You need to accept our terms of service to continue using all platform features.
              </p>
              
              <div className="flex gap-2">
                <Link
                  href="/terms"
                  className="text-xs font-semibold bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-3 py-1.5 rounded-md transition-colors"
                >
                  Review & Accept
                </Link>
                {dismissible && (
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="text-xs text-yellow-300 hover:text-yellow-200 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>

            {dismissible && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDismissed(true)}
                className="text-yellow-300 hover:text-yellow-200 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
