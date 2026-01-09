'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader } from 'lucide-react';

interface SaveStatusNotificationProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message?: string;
  league?: 'ipl' | 'wpl';
}

export default function SaveStatusNotification({
  status,
  message,
  league = 'ipl',
}: SaveStatusNotificationProps) {
  const getConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader,
          text: message || 'Saving...',
          color: league === 'ipl' ? 'bg-blue-500' : 'bg-purple-500',
          animate: true,
        };
      case 'saved':
        return {
          icon: Check,
          text: message || 'Saved successfully',
          color: 'bg-green-500',
          animate: false,
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: message || 'Failed to save',
          color: 'bg-red-500',
          animate: false,
        };
      default:
        return null;
    }
  };

  const config = getConfig();

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 ${config.color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50`}
        >
          {config.animate ? (
            <config.icon className="w-5 h-5 animate-spin" />
          ) : (
            <config.icon className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{config.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
