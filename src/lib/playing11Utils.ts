/**
 * Utility functions for managing Playing XI visibility
 * Rules:
 * - Admins can set playing 11 at any time (draft)
 * - End users can only see playing 11 once it has been published (playing11SetAt exists)
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

  // End users only see Playing XI after admin publishes it (setAt timestamp).
  if (!playing11SetAt) return false;
  const publishedAt = Date.parse(playing11SetAt);
  if (!Number.isNaN(publishedAt) && Date.now() < publishedAt) return false;
  return true;
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
  // Legacy helper: previously exposed a 30-minute window before match start.
  // Now playing XI becomes visible on publish time; callers should rely on setAt.
  const [year, month, day] = matchDate.split('-').map(Number);
  const [hours, minutes] = matchTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
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
  return 'Playing XI will appear once admin publishes it.';
}
