'use client';

import { useState, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Bell, Calendar, TrendingUp, Newspaper, X, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Notification } from '@/types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onSwipeStart,
  onSwipeEnd,
}: NotificationItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const readOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);

  const getNotificationIcon = () => {
    switch (notification.category) {
      case 'match':
        return <Calendar className="w-5 h-5" />;
      case 'news':
        return <Newspaper className="w-5 h-5" />;
      case 'prediction':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.category) {
      case 'match':
        return 'from-blue-500 to-cyan-500';
      case 'news':
        return 'from-purple-500 to-pink-500';
      case 'prediction':
        return 'from-orange-500 to-red-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x < -threshold) {
        // Swipe left - delete
        onDelete(notification.id);
      } else if (info.offset.x > threshold) {
        // Swipe right - mark as read
        if (!notification.read) {
          onMarkRead(notification.id);
        }
      }
    } else {
      // Snap back if not enough swipe
      x.set(0);
    }
    
    setIsDragging(false);
    onSwipeEnd?.();
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 flex">
        <motion.div
          className="flex-1 bg-red-500/20 flex items-center justify-start pl-6"
          style={{ opacity: deleteOpacity }}
        >
          <Trash2 className="w-6 h-6 text-red-400" />
        </motion.div>
        <motion.div
          className="flex-1 bg-green-500/20 flex items-center justify-end pr-6"
          style={{ opacity: readOpacity }}
        >
          <Check className="w-6 h-6 text-green-400" />
        </motion.div>
      </div>

      {/* Notification Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => {
          setIsDragging(true);
          onSwipeStart?.();
        }}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-xl p-4 md:p-6 cursor-grab active:cursor-grabbing"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-xl bg-gradient-to-br ${getNotificationColor()} bg-opacity-20 flex-shrink-0`}>
            <div className="text-white">
              {getNotificationIcon()}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getNotificationColor()} bg-opacity-20 text-white border border-white/20`}>
                  {notification.category.toUpperCase()}
                </span>
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatTime(new Date(notification.createdAt))}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
              {notification.title}
            </h3>

            {notification.description && (
              <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                {notification.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              {notification.link && (
                <Link
                  href={notification.link}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                  onClick={(e) => {
                    if (!notification.read) {
                      onMarkRead(notification.id);
                    }
                  }}
                >
                  View Details
                </Link>
              )}
              {!notification.read && (
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-all duration-300"
                >
                  Mark Read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all duration-300"
                aria-label="Delete notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

