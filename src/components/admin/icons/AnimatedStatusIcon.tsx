'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  Loader2,
  Zap,
} from 'lucide-react';

export type StatusType =
  | 'success'
  | 'error'
  | 'warning'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'loading'
  | 'live';

interface AnimatedStatusIconProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    color: '#10B981',
    bgColor: '#10B98120',
  },
  error: {
    icon: XCircle,
    color: '#EF4444',
    bgColor: '#EF444420',
  },
  warning: {
    icon: AlertCircle,
    color: '#F59E0B',
    bgColor: '#F59E0B20',
  },
  pending: {
    icon: Clock,
    color: '#6366F1',
    bgColor: '#6366F120',
  },
  active: {
    icon: PlayCircle,
    color: '#10B981',
    bgColor: '#10B98120',
  },
  inactive: {
    icon: PauseCircle,
    color: '#6B7280',
    bgColor: '#6B728020',
  },
  loading: {
    icon: Loader2,
    color: '#2F6FED',
    bgColor: '#2F6FED20',
  },
  live: {
    icon: Zap,
    color: '#EF4444',
    bgColor: '#EF444420',
  },
};

export default function AnimatedStatusIcon({
  status,
  size = 'md',
  className = '',
  pulse = false,
}: AnimatedStatusIconProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 15,
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const rotateVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Pulse ring for live/pending status */}
      {pulse && (status === 'live' || status === 'pending' || status === 'loading') && (
        <motion.div
          className={`absolute inset-0 rounded-full ${sizes[size]}`}
          style={{ backgroundColor: config.bgColor }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Icon */}
      <motion.div
        variants={status === 'loading' ? rotateVariants : iconVariants}
        initial="initial"
        animate="animate"
        className="relative"
      >
        <Icon
          className={sizes[size]}
          style={{ color: config.color }}
          strokeWidth={2.5}
        />
      </motion.div>
    </div>
  );
}

/**
 * Status badge with icon and text
 */
export function StatusBadge({
  status,
  label,
  className = '',
}: {
  status: StatusType;
  label: string;
  className?: string;
}) {
  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${className}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      <AnimatedStatusIcon status={status} size="sm" pulse={status === 'live'} />
      <span>{label}</span>
    </motion.div>
  );
}

