/**
 * Utility functions for managing default cyclist in localStorage
 */

const DEFAULT_CYCLIST_KEY = 'defaultCyclist';

/**
 * Get the default cyclist from localStorage or fallback to config
 */
export const getDefaultCyclist = (fallbackConfig) => {
  try {
    const stored = localStorage.getItem(DEFAULT_CYCLIST_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (error) {
    console.warn('Error reading default cyclist from localStorage:', error);
  }
  return fallbackConfig;
};

/**
 * Set the default cyclist in localStorage
 */
export const setDefaultCyclist = (cyclist) => {
  try {
    localStorage.setItem(DEFAULT_CYCLIST_KEY, JSON.stringify(cyclist));
    return true;
  } catch (error) {
    console.error('Error saving default cyclist to localStorage:', error);
    return false;
  }
};

/**
 * Clear the default cyclist from localStorage (revert to config)
 */
export const clearDefaultCyclist = () => {
  try {
    localStorage.removeItem(DEFAULT_CYCLIST_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing default cyclist from localStorage:', error);
    return false;
  }
};

/**
 * Check if two cyclists are the same
 */
export const isSameCyclist = (cyclist1, cyclist2) => {
  if (!cyclist1 || !cyclist2) return false;
  
  // Compare by ID if available
  if (cyclist1.id && cyclist2.id) {
    return cyclist1.id === cyclist2.id;
  }
  
  // Fallback to name comparison
  return cyclist1.firstName === cyclist2.firstName && 
         cyclist1.lastName === cyclist2.lastName;
};