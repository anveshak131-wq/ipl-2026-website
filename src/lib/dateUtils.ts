/**
 * Utility functions for date and age calculations
 */

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date in YYYY-MM-DD format
 * @returns Age in years (auto-increments on birthday)
 */
export const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) {
    console.error('Invalid date format:', dateOfBirth);
    return 0;
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birthday hasn't occurred this year, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
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
