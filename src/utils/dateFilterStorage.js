// Utility functions for persisting date filter state across components

const DATE_FILTER_STORAGE_KEY = 'race-cycling-app-date-filter';

/**
 * Get saved selected years from localStorage
 * @returns {Array<number>} Array of selected years
 */
export const getSavedSelectedYears = () => {
  try {
    const saved = localStorage.getItem(DATE_FILTER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.selectedYears)) {
        return parsed.selectedYears;
      }
    }
  } catch (error) {
    console.warn('Error loading saved date filter:', error);
  }
  return [];
};

/**
 * Save selected years to localStorage
 * @param {Array<number>} selectedYears Array of selected years
 */
export const saveSelectedYears = (selectedYears) => {
  try {
    if (Array.isArray(selectedYears)) {
      const toSave = {
        selectedYears,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(DATE_FILTER_STORAGE_KEY, JSON.stringify(toSave));
    }
  } catch (error) {
    console.warn('Error saving date filter:', error);
  }
};

/**
 * Clear saved date filter from localStorage
 */
export const clearSavedDateFilter = () => {
  try {
    localStorage.removeItem(DATE_FILTER_STORAGE_KEY);
  } catch (error) {
    console.warn('Error clearing saved date filter:', error);
  }
};

/**
 * Get default selected years (current year if available in data)
 * @param {Array} data Array of race data
 * @returns {Array<number>} Array with current year or empty array
 */
export const getDefaultSelectedYears = (data) => {
  const currentYear = new Date().getFullYear(); // 2025
  
  // Check if current year exists in the data
  const hasCurrentYear = data.some(item => {
    const dateStr = item.date || item.originalDate;
    if (dateStr) {
      const year = parseInt(dateStr.split(' ')[2], 10);
      return year === currentYear;
    }
    return false;
  });
  
  // Always return current year as default to ensure races are visible initially
  return [currentYear];
};