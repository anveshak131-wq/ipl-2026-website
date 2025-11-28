'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface IconBadgeProps {
  icon: ReactNode;
  count: number;
  maxCount?: number;
  showZero?: boolean;
  className?: string;
  badgeClassName?: string;
  onClick?: () => void;
  pulse?: boolean;
}

/**
 * Icon with animated badge showing count
 */
export default function IconBadge({
  icon,
  count,
  maxCount = 99,
  showZero = false,
  className = '',
  badgeClassName = '',
  onClick,
  pulse = false,
}: IconBadgeProps) {
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  const shouldShow = showZero || count > 0;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onClick={onClick}
    >
      {icon}

      <AnimatePresence>
        {shouldShow && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            className={`absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold text-white ${badgeClassName}`}
            style={{
              backgroundColor: count > 0 ? '#EF4444' : '#6B7280',
            }}
          >
            {pulse && count > 0 && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: '#EF4444' }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            <span className="relative z-10">{displayCount}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Notification badge with icon
 */
export function NotificationBadge({
  icon,
  count,
  className = '',
  onClick,
}: {
  icon: ReactNode;
  count: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <IconBadge
      icon={icon}
      count={count}
      maxCount={99}
      showZero={false}
      className={className}
      onClick={onClick}
      pulse={count > 0}
    />
  );
}

/**
 * Status indicator badge
 */
export function StatusIndicatorBadge({
  icon,
  active = false,
  className = '',
}: {
  icon: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {icon}
      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#0B0F13]"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-[#10B981]"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

