// Utility functions for date parsing and formatting

/**
 * Calculate percentage position (lower percentage = better performance)
 * @param {number} rank - Cyclist's position in the race
 * @param {number} participantCount - Total number of participants
 * @returns {number|null} - Percentage (1-100) or null if invalid data
 */
export const calculatePercentagePosition = (rank, participantCount) => {
  if (!participantCount || participantCount === 0 || !rank) return null;
  return Math.round((rank / participantCount) * 100);
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