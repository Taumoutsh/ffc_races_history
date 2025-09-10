import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { getAvailableYears } from '../utils/dateUtils';
import { getSavedSelectedYears, saveSelectedYears, getDefaultSelectedYears } from '../utils/dateFilterStorage';

const DateFilter = ({ 
  data = [], 
  selectedYears = [], 
  onYearsChange, 
  className = '',
  style = {} 
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const dropdownRef = useRef(null);

  // Extract available years from data and initialize selection ONLY on first load
  useEffect(() => {
    const years = getAvailableYears(data);
    setAvailableYears(years);
  }, [data]);

  // Initialize selection only once when component first mounts
  useEffect(() => {
    const years = getAvailableYears(data);
    if (years.length > 0 && selectedYears.length === 0) {
      const savedYears = getSavedSelectedYears();
      
      // Check if there's any saved state (even if empty)
      const hasSavedState = localStorage.getItem('race-cycling-app-date-filter') !== null;
      
      if (hasSavedState) {
        // Use saved selection (even if empty)
        const validSavedYears = savedYears.filter(year => years.includes(year));
        onYearsChange(validSavedYears);
      } else {
        // Only set default on first visit (no saved state)
        const defaultYears = getDefaultSelectedYears(data);
        if (defaultYears.length > 0) {
          onYearsChange(defaultYears);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearToggle = (year) => {
    const newSelectedYears = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year].sort((a, b) => b - a); // Sort descending
    
    // Save to localStorage
    saveSelectedYears(newSelectedYears);
    onYearsChange(newSelectedYears);
  };

  const getDisplayText = () => {
    if (selectedYears.length === 0) {
      return t('dateFilter.noYearsSelected');
    } else if (selectedYears.length === 1) {
      return selectedYears[0].toString();
    } else if (selectedYears.length === availableYears.length) {
      return t('dateFilter.allYears');
    } else {
      const sortedYears = [...selectedYears].sort((a, b) => b - a);
      return `${sortedYears.length} ${t('dateFilter.yearsSelected')}`;
    }
  };

  if (availableYears.length === 0) {
    return null; // Don't show filter if no years available
  }

  return (
    <div 
      ref={dropdownRef}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: window.innerWidth < 768 ? '120px' : '180px',
        ...style
      }}
    >
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: window.innerWidth < 768 ? '0.5rem 0.75rem' : '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '0.75rem',
          cursor: 'pointer',
          fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
          fontWeight: '600',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(248, 250, 252, 1)';
          e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
          e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
        }}
      >
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          📅 {getDisplayText()}
        </span>
        <span style={{
          marginLeft: '0.5rem',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.25rem',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '0.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 50,
          maxHeight: '240px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent'
        }}>
          {/* Year Options */}
          {availableYears.map((year) => (
            <label
              key={year}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                transition: 'background-color 0.2s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <input
                type="checkbox"
                checked={selectedYears.includes(year)}
                onChange={() => handleYearToggle(year)}
                style={{
                  marginRight: '0.75rem',
                  width: '1rem',
                  height: '1rem',
                  cursor: 'pointer',
                  accentColor: '#3b82f6'
                }}
              />
              <span style={{
                fontWeight: selectedYears.includes(year) ? '600' : '500',
                color: selectedYears.includes(year) ? '#1f2937' : '#374151'
              }}>
                {year}
              </span>
            </label>
          ))}

          {/* Footer Info */}
          <div style={{
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            color: '#64748b',
            borderTop: '1px solid rgba(59, 130, 246, 0.1)',
            background: 'rgba(248, 250, 252, 0.5)'
          }}>
            {t('dateFilter.totalYears', { count: availableYears.length })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilter;