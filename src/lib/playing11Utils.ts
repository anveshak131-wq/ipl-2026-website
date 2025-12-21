/**
 * Utility functions for managing Playing XI visibility
 * Rules:
 * - Admins can set playing 11 at any time
 * - End users can only see playing 11 if it's within 30 minutes of match start
 */

/**
 * Check if a user can view the playing 11 for a match
 * @param matchDate - Match date in YYYY-MM-DD format
 * @param matchTime - Match time in HH:MM format (24-hour)
 * @param playing11SetAt - ISO timestamp when playing 11 was set (optional)
 * @param isAdmin - Whether the current user is an admin
 * @returns boolean - true if playing 11 should be visible
 */
export function canViewPlaying11(
  matchDate: string,
  matchTime: string,
  playing11SetAt?: string,
  isAdmin: boolean = false
): boolean {
  // Admins can always see playing 11
  if (isAdmin) {
    return true;
  }

  // For regular users, playing 11 is visible only 30 minutes before match
  const now = new Date();
  const [year, month, day] = matchDate.split('-').map(Number);
  const [hours, minutes] = matchTime.split(':').map(Number);

  // Create match start time
  const matchStartTime = new Date(year, month - 1, day, hours, minutes, 0);

  // Calculate visibility window: 30 minutes before match
  const visibilityStartTime = new Date(matchStartTime.getTime() - 30 * 60 * 1000);

  // Playing 11 is visible if:
  // 1. Current time is within 30 minutes of match start
  // 2. Playing 11 has been set (playing11SetAt exists)
  return now >= visibilityStartTime && !!playing11SetAt;
}

/**
 * Get the time when playing 11 becomes visible to users
 * @param matchDate - Match date in YYYY-MM-DD format
 * @param matchTime - Match time in HH:MM format (24-hour)
 * @returns Date - The time when playing 11 becomes visible
 */
export function getPlaying11VisibilityTime(
  matchDate: string,
  matchTime: string
): Date {
  const [year, month, day] = matchDate.split('-').map(Number);
  const [hours, minutes] = matchTime.split(':').map(Number);

  const matchStartTime = new Date(year, month - 1, day, hours, minutes, 0);
  return new Date(matchStartTime.getTime() - 30 * 60 * 1000);
}

/**
 * Check if playing 11 should be visible based on current time
 * (Use this for client-side checks when user token might not be available)
 * @param matchDate - Match date in YYYY-MM-DD format
 * @param matchTime - Match time in HH:MM format (24-hour)
 * @param playing11SetAt - ISO timestamp when playing 11 was set (optional)
 * @returns boolean - true if visible to end users
 */
export function isPlaying11VisibleNow(
  matchDate: string,
  matchTime: string,
  playing11SetAt?: string
): boolean {
  // If not set yet, never visible
  if (!playing11SetAt) {
    return false;
  }

  return canViewPlaying11(matchDate, matchTime, playing11SetAt, false);
}

/**
 * Get a user-friendly message about when playing 11 will be visible
 * @param matchDate - Match date in YYYY-MM-DD format
 * @param matchTime - Match time in HH:MM format (24-hour)
 * @returns string - Friendly message
 */
export function getPlaying11VisibilityMessage(
  matchDate: string,
  matchTime: string
): string {
  const visibilityTime = getPlaying11VisibilityTime(matchDate, matchTime);
  const now = new Date();

  if (visibilityTime <= now) {
    return 'Playing XI will be visible soon';
  }

  const diffMs = visibilityTime.getTime() - now.getTime();
  const diffMins = Math.ceil(diffMs / (1000 * 60));

  if (diffMins <= 0) {
    return 'Playing XI is being revealed';
  }

  if (diffMins === 1) {
    return 'Playing XI will be revealed in 1 minute';
  }

  if (diffMins < 60) {
    return `Playing XI will be revealed in ${diffMins} minutes`;
  }

  const diffHours = Math.ceil(diffMins / 60);
  if (diffHours === 1) {
    return 'Playing XI will be revealed in about 1 hour';
  }

  return `Playing XI will be revealed in about ${diffHours} hours`;
}
