'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Twitter, Facebook, Link2, Copy, Check } from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export default function SocialShare({ url, title, description = '', className = '' }: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
  const shareText = `${title}${description ? ` - ${description}` : ''}`;

  const shareOptions = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'from-blue-400 to-blue-600',
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
          '_blank',
          'width=600,height=400'
        );
        setIsOpen(false);
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'from-blue-500 to-blue-700',
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        setIsOpen(false);
      },
    },
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      color: 'from-gray-500 to-gray-700',
      action: async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
            setIsOpen(false);
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      },
    },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
        setIsOpen(false);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300"
        aria-label="Share"
      >
        <Share2 className="w-5 h-5 text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-2 bg-[rgba(10,14,39,0.98)] backdrop-blur-2xl border border-white/20 rounded-xl p-2 shadow-2xl z-50 min-w-[180px]"
            >
              {typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && (
                <button
                  onClick={handleNativeShare}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold mb-2 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Share
                </button>
              )}
              <div className="space-y-1">
                {shareOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={option.action}
                      className={`w-full px-4 py-2 rounded-lg bg-gradient-to-r ${option.color} text-white font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.name}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

