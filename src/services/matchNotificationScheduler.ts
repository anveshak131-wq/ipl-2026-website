/**
 * Match Notification Scheduler
 * Schedules and triggers notifications for matches:
 * - 1 day before match
 * - 30 minutes before match
 * - At match start time
 * 
 * References:
 * - Browser Notifications API: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
 * - Service Workers for background notifications
 * - Web Push API for cross-device notifications
 */

import { Match } from '@/types';
import { api } from '@/lib/data';

export interface ScheduledNotification {
  id: string;
  matchId: string;
  type: '1-day-before' | '30-min-before' | 'match-start';
  scheduledTime: number; // Unix timestamp
  notificationId?: string; // Browser notification ID
  sent: boolean;
}

const STORAGE_KEY = 'scheduledMatchNotifications';
const CHECK_INTERVAL = 60000; // Check every minute

// Global interval ID to prevent multiple intervals
let notificationCheckInterval: NodeJS.Timeout | null = null;

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Parse match date and time to get match start timestamp
 */
function getMatchStartTime(match: Match): number | null {
  try {
    const dateStr = match.date; // Format: YYYY-MM-DD
    const timeStr = match.time; // Format: HH:MM (24-hour)
    
    if (!dateStr || !timeStr) return null;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const matchDate = new Date(year, month - 1, day, hours, minutes, 0);
    
    if (isNaN(matchDate.getTime())) {
      console.error('Invalid match date/time:', match.date, match.time);
      return null;
    }
    
    return matchDate.getTime();
  } catch (error) {
    console.error('Error parsing match time:', error);
    return null;
  }
}

/**
 * Create a browser notification
 */
function createBrowserNotification(
  title: string,
  options: NotificationOptions
): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  try {
    return new Notification(title, {
      icon: '/logos/ipl-logo.png',
      badge: '/logos/ipl-logo.png',
      tag: options.tag,
      requireInteraction: false,
      ...options,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create and save a notification to the API
 */
async function createNotificationInSystem(
  match: Match,
  type: '1-day-before' | '30-min-before' | 'match-start'
): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
    if (!token) return;

    const team1Name = match.team1?.shortName || match.team1?.name || 'Team 1';
    const team2Name = match.team2?.shortName || match.team2?.name || 'Team 2';
    
    let title = '';
    let description = '';
    
    switch (type) {
      case '1-day-before':
        title = `Match Tomorrow: ${team1Name} vs ${team2Name}`;
        description = `Don't miss the exciting match between ${team1Name} and ${team2Name} tomorrow at ${match.venue || 'TBD'}`;
        break;
      case '30-min-before':
        title = `Match Starting Soon: ${team1Name} vs ${team2Name}`;
        description = `The match starts in 30 minutes! Get ready for ${team1Name} vs ${team2Name} at ${match.venue || 'TBD'}`;
        break;
      case 'match-start':
        title = `Match Started: ${team1Name} vs ${team2Name}`;
        description = `The match has begun! Follow live updates for ${team1Name} vs ${team2Name}`;
        break;
    }

    // Save notification to localStorage (API doesn't support POST yet)
    saveNotificationToLocalStorage({
      id: `notif-${match.id}-${type}-${Date.now()}`,
      category: 'match' as const,
      title,
      description,
      link: `/matches/${match.id}`,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: {
        matchId: match.id,
        match,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Save notification to localStorage as fallback
 */
function saveNotificationToLocalStorage(notification: any): void {
  try {
    const existing = localStorage.getItem('notifications');
    const notifications = existing ? JSON.parse(existing) : [];
    notifications.unshift(notification);
    // Keep only last 100 notifications
    const limited = notifications.slice(0, 100);
    localStorage.setItem('notifications', JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving notification to localStorage:', error);
  }
}

/**
 * Schedule notifications for a match
 */
export function scheduleMatchNotifications(match: Match): ScheduledNotification[] {
  const matchStartTime = getMatchStartTime(match);
  if (!matchStartTime) {
    console.warn('Cannot schedule notifications for match:', match.id, 'Invalid date/time');
    return [];
  }

  const now = Date.now();
  const scheduled: ScheduledNotification[] = [];

  // 1 day before (24 hours)
  const oneDayBefore = matchStartTime - (24 * 60 * 60 * 1000);
  if (oneDayBefore > now) {
    scheduled.push({
      id: `${match.id}-1-day-before`,
      matchId: match.id,
      type: '1-day-before',
      scheduledTime: oneDayBefore,
      sent: false,
    });
  }

  // 30 minutes before
  const thirtyMinBefore = matchStartTime - (30 * 60 * 1000);
  if (thirtyMinBefore > now) {
    scheduled.push({
      id: `${match.id}-30-min-before`,
      matchId: match.id,
      type: '30-min-before',
      scheduledTime: thirtyMinBefore,
      sent: false,
    });
  }

  // At match start
  if (matchStartTime > now) {
    scheduled.push({
      id: `${match.id}-match-start`,
      matchId: match.id,
      type: 'match-start',
      scheduledTime: matchStartTime,
      sent: false,
    });
  }

  return scheduled;
}

/**
 * Get all scheduled notifications
 */
export function getScheduledNotifications(): ScheduledNotification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading scheduled notifications:', error);
    return [];
  }
}

/**
 * Save scheduled notifications
 */
function saveScheduledNotifications(notifications: ScheduledNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving scheduled notifications:', error);
  }
}

/**
 * Remove scheduled notification
 */
function removeScheduledNotification(id: string): void {
  const scheduled = getScheduledNotifications();
  const filtered = scheduled.filter(n => n.id !== id);
  saveScheduledNotifications(filtered);
}

/**
 * Check and trigger due notifications
 */
async function checkAndTriggerNotifications(): Promise<void> {
  const scheduled = getScheduledNotifications();
  const now = Date.now();
  const dueNotifications = scheduled.filter(
    n => !n.sent && n.scheduledTime <= now + 60000 // Within 1 minute tolerance
  );

  if (dueNotifications.length === 0) return;

  // Fetch matches to get full match data
  try {
    const matches = await api.getMatches();
    const matchesMap = new Map(matches.map(m => [m.id, m]));

    for (const scheduledNotif of dueNotifications) {
      const match = matchesMap.get(scheduledNotif.matchId);
      if (!match) {
        // Match not found, remove scheduled notification
        removeScheduledNotification(scheduledNotif.id);
        continue;
      }

      // Check if match is still upcoming
      if (match.status !== 'upcoming' && scheduledNotif.type !== 'match-start') {
        removeScheduledNotification(scheduledNotif.id);
        continue;
      }

      const team1Name = match.team1?.shortName || match.team1?.name || 'Team 1';
      const team2Name = match.team2?.shortName || match.team2?.name || 'Team 2';
      
      let title = '';
      let body = '';
      
      switch (scheduledNotif.type) {
        case '1-day-before':
          title = `🏏 Match Tomorrow: ${team1Name} vs ${team2Name}`;
          body = `Don't miss the exciting match tomorrow at ${match.venue || 'TBD'}. Match starts at ${match.time || 'TBD'}`;
          break;
        case '30-min-before':
          title = `⏰ Match Starting Soon: ${team1Name} vs ${team2Name}`;
          body = `The match starts in 30 minutes! Get ready for ${team1Name} vs ${team2Name}`;
          break;
        case 'match-start':
          title = `🚀 Match Started: ${team1Name} vs ${team2Name}`;
          body = `The match has begun! Follow live updates now.`;
          break;
      }

      // Create browser notification
      const notification = createBrowserNotification(title, {
        body,
        tag: scheduledNotif.id,
        data: {
          matchId: match.id,
          type: scheduledNotif.type,
        },
      });

      // Save notification to system
      await createNotificationInSystem(match, scheduledNotif.type);

      // Mark as sent
      scheduledNotif.sent = true;
      if (notification) {
        scheduledNotif.notificationId = String(notification);
      }

      // Remove after sending (or keep for 24 hours for match-start)
      if (scheduledNotif.type !== 'match-start') {
        removeScheduledNotification(scheduledNotif.id);
      } else {
        // Keep match-start notification for 24 hours, then remove
        setTimeout(() => {
          removeScheduledNotification(scheduledNotif.id);
        }, 24 * 60 * 60 * 1000);
      }

      console.log('Notification sent:', scheduledNotif.type, 'for match', match.id);
    }

    // Save updated scheduled notifications
    const updated = getScheduledNotifications();
    saveScheduledNotifications(updated);
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

/**
 * Initialize notification scheduler for all upcoming matches
 */
export async function initializeMatchNotifications(): Promise<void> {
  try {
    // Request permission
    await requestNotificationPermission();

    // Fetch all matches
    const matches = await api.getMatches();
    const upcomingMatches = matches.filter(m => m.status === 'upcoming');

    // Get existing scheduled notifications
    const existing = getScheduledNotifications();
    const existingIds = new Set(existing.map(n => n.id));

    // Schedule notifications for all upcoming matches
    const allScheduled: ScheduledNotification[] = [...existing];

    for (const match of upcomingMatches) {
      const scheduled = scheduleMatchNotifications(match);
      for (const notif of scheduled) {
        if (!existingIds.has(notif.id)) {
          allScheduled.push(notif);
        }
      }
    }

    // Remove old sent notifications (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const filtered = allScheduled.filter(
      n => !n.sent || n.scheduledTime > sevenDaysAgo
    );

    saveScheduledNotifications(filtered);

    // Start checking for due notifications immediately
    checkAndTriggerNotifications();
    
    // Set up interval to check every minute (only if not already set)
    if (!notificationCheckInterval) {
      notificationCheckInterval = setInterval(checkAndTriggerNotifications, CHECK_INTERVAL);
      console.log('Started notification check interval');
    }

    console.log(`Initialized notifications for ${upcomingMatches.length} upcoming matches`);
  } catch (error) {
    console.error('Error initializing match notifications:', error);
  }
}

/**
 * Refresh notifications when a new match is added or updated
 */
export async function refreshMatchNotifications(): Promise<void> {
  await initializeMatchNotifications();
}

