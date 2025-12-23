/**
 * Utility functions for date and age calculations
 */

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date in YYYY-MM-DD format
 * @returns Age in years (auto-increments on birthday)
 */
export const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth || dateOfBirth.trim() === '') return 0;
  
  // Ensure the date string is trimmed
  const trimmedDate = dateOfBirth.trim();
  
  const today = new Date();
  const birthDate = new Date(trimmedDate);
  
  if (isNaN(birthDate.getTime())) {
    console.error('Invalid date format:', trimmedDate);
    return 0;
  }
  
  // Check if the date is in the future
  if (birthDate > today) {
    console.error('Date of birth is in the future:', trimmedDate);
    return 0;
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birthday hasn't occurred this year, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  // Ensure age is not negative
  return Math.max(0, age);
};

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date in DD/MM/YYYY format
 */
export const formatDateDDMMYYYY = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Parse date from DD/MM/YYYY to YYYY-MM-DD
 * @param dateString - Date in DD/MM/YYYY format
 * @returns Date in YYYY-MM-DD format or empty string if invalid
 */
export const parseDateDDMMYYYY = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const [day, month, year] = dateString.split('/');
    
    // Validate inputs
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
      console.error('Invalid date values:', { day, month, year });
      return '';
    }
    
    // Format with leading zeros
    const formattedDay = String(dayNum).padStart(2, '0');
    const formattedMonth = String(monthNum).padStart(2, '0');
    
    return `${yearNum}-${formattedMonth}-${formattedDay}`;
  } catch (error) {
    console.error('Error parsing date:', error);
    return '';
  }
};

/**
 * Validate date format (DD/MM/YYYY or YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @param format - Expected format: 'DD/MM/YYYY' or 'YYYY-MM-DD'
 * @returns true if valid, false otherwise
 */
export const isValidDate = (dateString: string, format: 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY'): boolean => {
  if (!dateString) return false;
  
  if (format === 'DD/MM/YYYY') {
    const ddmmyyyyRegex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/;
    return ddmmyyyyRegex.test(dateString);
  } else {
    const yyyymmddRegex = /^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])$/;
    return yyyymmddRegex.test(dateString);
  }
};

/**
 * Parse date from "Month DD, YYYY" to YYYY-MM-DD (for WPL)
 * @param dateString - Date in "Month DD, YYYY" format
 * @returns Date in YYYY-MM-DD format or empty string if invalid
 */
export const parseDateMonthDDYYYY = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // Trim whitespace from the date string
    const trimmed = dateString.trim();
    
    // Handle "Month DD, YYYY" format
    const monthDayYearRegex = /^(\w+)\s+(\d{1,2}),\s*(\d{4})$/;
    const match = trimmed.match(monthDayYearRegex);
    
    if (match) {
      const [, monthName, day, year] = match;
      const months: { [key: string]: string } = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
      };
      
      const monthNum = months[monthName];
      if (!monthNum) {
        console.error('Invalid month name:', monthName);
        return '';
      }
      
      const dayNum = parseInt(day, 10);
      const yearNum = parseInt(year, 10);
      
      if (dayNum < 1 || dayNum > 31 || yearNum < 1900) {
        console.error('Invalid date values:', { day, year });
        return '';
      }
      
      return `${yearNum}-${monthNum}-${String(dayNum).padStart(2, '0')}`;
    }
    
    // Fallback: try parsing as regular date
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error parsing date:', error);
    return '';
  }
};

/**
 * Validate date format for different leagues
 * @param dateString - Date string to validate
 * @param league - League type ('ipl' or 'wpl')
 * @returns true if valid, false otherwise
 */
export const isValidDateForLeague = (dateString: string, league: 'ipl' | 'wpl'): boolean => {
  if (!dateString) return false;
  
  // Both IPL and WPL now use "Month DD, YYYY" format
  const monthDayYearRegex = /^(\w+)\s+(\d{1,2}),\s*(\d{4})$/;
  return monthDayYearRegex.test(dateString);
};

/**
 * Format date from YYYY-MM-DD to "Month DD, YYYY" (for WPL)
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date in "Month DD, YYYY" format
 */
export const formatDateMonthDDYYYY = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Invalid date format:', dateString);
      return '';
    }
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date as string
 */
export const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
