/**
 * Time utility functions for converting and displaying match times
 */

/**
 * Convert IST time to user's local time zone
 * @param istTime - Time in IST format (HH:MM, 24-hour)
 * @param date - Date string (YYYY-MM-DD)
 * @returns Object with IST and local time strings
 */
export function convertISTToLocalTime(istTime: string, date: string): {
  ist: string;
  local: string;
  localTimeZone: string;
} {
  try {
    // Parse IST time (HH:MM format)
    const [hours, minutes] = istTime.split(':').map(Number);
    
    // Format IST time for display
    const istHour = hours % 12 || 12;
    const istAMPM = hours >= 12 ? 'PM' : 'AM';
    const istFormatted = `${istHour}:${String(minutes).padStart(2, '0')} ${istAMPM} IST`;
    
    // Create date string in UTC format (treating the input as IST)
    // IST is UTC+5:30, so we need to subtract 5:30 to get UTC
    const [year, month, day] = date.split('-').map(Number);
    
    // Create a date object representing the IST time
    // We'll create it as if it's UTC, then adjust
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    
    // Convert IST to UTC: subtract 5 hours 30 minutes (5.5 hours)
    const utcTimestamp = utcDate.getTime() - (5.5 * 60 * 60 * 1000);
    
    // Create a date from the UTC timestamp - JavaScript will display it in user's local timezone
    const localDate = new Date(utcTimestamp);
    
    // Format local time
    const localHours = localDate.getHours();
    const localMinutes = localDate.getMinutes();
    const localHour = localHours % 12 || 12;
    const localAMPM = localHours >= 12 ? 'PM' : 'AM';
    const localFormatted = `${localHour}:${String(localMinutes).padStart(2, '0')} ${localAMPM}`;
    
    // Get timezone abbreviation
    const timeZoneName = Intl.DateTimeFormat('en', { 
      timeZoneName: 'short'
    }).formatToParts(localDate)
      .find(part => part.type === 'timeZoneName')?.value || 'Local';
    
    return {
      ist: istFormatted,
      local: `${localFormatted} (${timeZoneName})`,
      localTimeZone: timeZoneName
    };
  } catch (error) {
    console.error('Error converting time:', error);
    // Fallback to just showing IST
    const [hours, minutes] = istTime.split(':').map(Number);
    const hour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return {
      ist: `${hour}:${String(minutes).padStart(2, '0')} ${ampm} IST`,
      local: `${hour}:${String(minutes).padStart(2, '0')} ${ampm}`,
      localTimeZone: 'Local'
    };
  }
}

/**
 * Format time for display with timezone conversion
 * @param time - Time string (HH:MM format)
 * @param date - Date string (YYYY-MM-DD)
 * @param showLocal - Whether to show local time (default: true)
 * @returns Formatted time string
 */
export function formatMatchTime(time: string, date: string, showLocal: boolean = true): string {
  if (!showLocal) {
    // Just format IST time
    const [hours, minutes] = time.split(':').map(Number);
    const hour = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour}:${String(minutes).padStart(2, '0')} ${ampm} IST`;
  }
  
  const converted = convertISTToLocalTime(time, date);
  return `${converted.ist} / ${converted.local}`;
}

