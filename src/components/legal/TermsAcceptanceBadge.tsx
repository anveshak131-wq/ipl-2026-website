'use client';

import { useTermsAcceptanceInfo } from '@/hooks/useTermsAccepted';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface TermsAcceptanceBadgeProps {
  showDate?: boolean;
  compact?: boolean;
  className?: string;
}

export default function TermsAcceptanceBadge({
  showDate = true,
  compact = false,
  className = '',
}: TermsAcceptanceBadgeProps) {
  const { isAccepted, acceptedDate, isLoading } = useTermsAcceptanceInfo();

  if (isLoading) {
    return null;
  }

  if (!isAccepted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 ${className}`}
      >
        <span className="text-xs font-semibold text-yellow-300">⚠️ Terms Pending</span>
        <Link
          href="/terms"
          className="text-xs text-yellow-300 hover:text-yellow-200 underline underline-offset-2 font-medium"
        >
          Accept
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 ${className}`}
    >
      <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
        ✅ Terms Accepted
      </span>
      {showDate && acceptedDate && !compact && (
        <span className="text-xs text-emerald-400/70">
          ({new Date(acceptedDate).toLocaleDateString()})
        </span>
      )}
    </motion.div>
  );
}
