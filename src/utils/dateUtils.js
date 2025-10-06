// Utility functions for date parsing and formatting

/**
 * Calculate percentage position (lower percentage = better performance)
 * @param {number} rank - Cyclist's position in the race
 * @param {number} participantCount - Total number of participants
 * @returns {number|null} - Percentage (1-100) or null if invalid data
 */
export const calculatePercentagePosition = (rank, participantCount) => {
  if (!participantCount || participantCount === 0 || !rank) return null;
  
  // Ensure rank doesn't exceed participant count (cap at 100%)
  const validRank = Math.min(rank, participantCount);
  const percentage = Math.round((validRank / participantCount) * 100);
  
  // Ensure percentage is between 1 and 100
  return Math.max(1, Math.min(100, percentage));
};

/**
 * Get gradient color based on percentage (1% = green, 100% = red)
 * @param {number} percentage - Performance percentage (1-100)
 * @returns {string} - CSS gradient string
 */
export const getPercentageColor = (percentage) => {
  if (percentage === null || percentage === undefined) {
    return 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)';
  }
  
  // Clamp percentage between 1 and 100
  const clampedPercentage = Math.max(1, Math.min(100, percentage));
  
  // Convert percentage to a value between 0 (best) and 1 (worst)
  const normalizedValue = (clampedPercentage - 1) / 99;
  
  // Interpolate between green (0) and red (1)
  const red = Math.round(34 + (239 - 34) * normalizedValue);   // 34 (green) to 239 (red)
  const green = Math.round(197 - (197 - 68) * normalizedValue); // 197 (green) to 68 (red)
  const blue = Math.round(94 - (94 - 68) * normalizedValue);    // 94 (green) to 68 (red)
  
  const red2 = Math.round(16 + (220 - 16) * normalizedValue);   // Darker shade for gradient
  const green2 = Math.round(185 - (185 - 38) * normalizedValue);
  const blue2 = Math.round(129 - (129 - 38) * normalizedValue);
  
  return `linear-gradient(135deg, rgb(${red}, ${green}, ${blue}) 0%, rgb(${red2}, ${green2}, ${blue2}) 100%)`;
};

/**
 * Parse French date format (e.g., "24 mai 2025") to JavaScript Date
 * @param {string} dateStr - Date string in French format
 * @returns {Date} - Parsed Date object
 */
export const parseFrenchDate = (dateStr) => {
  const monthMap = {
    'janvier': '01', 
    'février': '02', 
    'mars': '03', 
    'avril': '04',
    'mai': '05', 
    'juin': '06', 
    'juillet': '07', 
    'août': '08',
    'septembre': '09', 
    'octobre': '10', 
    'novembre': '11', 
    'décembre': '12'
  };
  
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1]] || '01';
    const year = parts[2];
    return new Date(`${year}-${month}-${day}`);
  }
  return new Date(dateStr);
};

/**
 * Format a Date object to French date string
 * @param {Date} date - Date to format
 * @returns {string} - French formatted date string
 */
export const formatToFrenchDate = (date) => {
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

/**
 * Format French date string to compact DD/MM/YY format
 * @param {string} frenchDateStr - Date string in French format (e.g., "24 mai 2025")
 * @returns {string} - Compact date format (e.g., "24/05/25")
 */
export const formatToCompactDate = (frenchDateStr) => {
  if (!frenchDateStr) return '';

  try {
    const date = parseFrenchDate(frenchDateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Get last 2 digits of year

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return frenchDateStr; // Return original if parsing fails
  }
};

/**
 * Extract year from French date format
 * @param {string} dateStr - Date string in French format (e.g., "24 mai 2025")
 * @returns {number|null} - Year as number or null if parsing fails
 */
export const extractYearFromDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const year = parseInt(parts[2], 10);
    return isNaN(year) ? null : year;
  }
  
  // Fallback: try to parse with standard Date parsing
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date.getFullYear();
};

/**
 * Get available years from race data
 * @param {Array} data - Array of race objects with date properties
 * @returns {Array<number>} - Sorted array of unique years (descending)
 */
export const getAvailableYears = (data) => {
  if (!Array.isArray(data)) return [];
  
  const years = new Set();
  
  data.forEach(item => {
    // Handle different data structures
    const dateStr = item.date || item.originalDate;
    if (dateStr) {
      const year = extractYearFromDate(dateStr);
      if (year && year >= 1900 && year <= 2100) { // Reasonable year range
        years.add(year);
      }
    }
  });
  
  return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
};

/**
 * Filter race data by selected years
 * @param {Array} data - Array of race objects
 * @param {Array<number>} selectedYears - Array of selected years
 * @returns {Array} - Filtered race data
 */
export const filterDataByYears = (data, selectedYears) => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  // If no years are selected, return empty array (hide all races)
  if (!Array.isArray(selectedYears) || selectedYears.length === 0) {
    return [];
  }
  
  return data.filter(item => {
    const dateStr = item.date || item.originalDate;
    if (!dateStr) return false;
    
    const year = extractYearFromDate(dateStr);
    return year && selectedYears.includes(year);
  });
};

/**
 * Check if a race matches selected years
 * @param {string} dateStr - Date string to check
 * @param {Array<number>} selectedYears - Array of selected years
 * @returns {boolean} - True if race year is in selected years
 */
export const isRaceInSelectedYears = (dateStr, selectedYears) => {
  if (!dateStr) {
    return false;
  }
  
  // If no years are selected, show all races
  if (!Array.isArray(selectedYears) || selectedYears.length === 0) {
    return true;
  }
  
  const year = extractYearFromDate(dateStr);
  return year && selectedYears.includes(year);
};