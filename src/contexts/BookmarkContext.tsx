'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Player } from '@/types';

interface BookmarkContextType {
  bookmarkedPlayers: Set<string>;
  toggleBookmark: (playerId: string) => void;
  isBookmarked: (playerId: string) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

const BOOKMARK_STORAGE_KEY = 'sportsup_bookmarked_players';

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarkedPlayers, setBookmarkedPlayers] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load bookmarks from localStorage
    try {
      const saved = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBookmarkedPlayers(new Set(parsed));
      }
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Save bookmarks to localStorage
    try {
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(Array.from(bookmarkedPlayers)));
    } catch (e) {
      console.error('Failed to save bookmarks:', e);
    }
  }, [bookmarkedPlayers, mounted]);

  const toggleBookmark = (playerId: string) => {
    setBookmarkedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const isBookmarked = (playerId: string) => {
    return bookmarkedPlayers.has(playerId);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <BookmarkContext.Provider value={{ bookmarkedPlayers, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}