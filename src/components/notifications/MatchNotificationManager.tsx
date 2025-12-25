'use client';

import { useEffect, useRef } from 'react';
import { initializeMatchNotifications, refreshMatchNotifications } from '@/services/matchNotificationScheduler';
import { initializeNewsNotifications } from '@/services/newsNotificationService';

/**
 * Match Notification Manager Component
 * Initializes and manages match notifications in the background
 * 
 * This component:
 * - Requests notification permission on mount
 * - Schedules notifications for all upcoming matches
 * - Checks and triggers notifications periodically
 * - Refreshes when matches are updated
 * 
 * References:
 * - Browser Notifications API: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
 * - Service Workers for background notifications
 */
export default function MatchNotificationManager() {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Prevent multiple initializations
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Initialize match notifications
    initializeMatchNotifications();
    
    // Initialize news notifications
    initializeNewsNotifications();

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
      
      // Clear interval if it exists
      if ((window as any).__matchNotificationInterval) {
        clearInterval((window as any).__matchNotificationInterval);
        delete (window as any).__matchNotificationInterval;
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}

