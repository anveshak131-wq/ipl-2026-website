'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBookmarks } from '@/contexts/BookmarkContext';

interface PlayerBookmarkProps {
  playerId: string;
}

export default function PlayerBookmark({ playerId }: PlayerBookmarkProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(playerId);

  return (
    <motion.button
      onClick={() => toggleBookmark(playerId)}
      className={`p-2 rounded-lg transition-all duration-200 ${
        bookmarked 
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
          : 'bg-white/10 text-gray-400 border border-white/20 hover:text-white'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {bookmarked ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
    </motion.button>
  );
}