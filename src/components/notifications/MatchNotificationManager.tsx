'use client';

import { useEffect } from 'react';
import { initializeMatchNotifications, refreshMatchNotifications } from '@/services/matchNotificationScheduler';

/**
 * Match Notification Manager Component
 * Initializes and manages match notifications in the background
 * 
 * This component:
 * - Requests notification permission on mount
 * - Schedules notifications for all upcoming matches
 * - Checks and triggers notifications periodically
 * - Refreshes when matches are updated
 */
export default function MatchNotificationManager() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Initialize notifications
    initializeMatchNotifications();

    // Listen for match updates to refresh notifications
    const handleMatchUpdate = () => {
      refreshMatchNotifications();
    };

    window.addEventListener('match-updated', handleMatchUpdate);
    window.addEventListener('match-created', handleMatchUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('match-updated', handleMatchUpdate);
      window.removeEventListener('match-created', handleMatchUpdate);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

