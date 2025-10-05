import React from 'react';
import { setDefaultCyclist, clearDefaultCyclist } from '../utils/defaultCyclistStorage';

const SelectAsDefaultButton = ({ cyclist, onDefaultChange, translations = {}, isAlreadyDefault = false }) => {
  const handleSetAsDefault = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAlreadyDefault) {
      // Unselect the default cyclist
      const success = clearDefaultCyclist();
      if (success && onDefaultChange) {
        onDefaultChange(null); // Pass null to indicate no default cyclist
      }
      return;
    }

    // Set as default cyclist
    const success = setDefaultCyclist(cyclist);
    if (success && onDefaultChange) {
      onDefaultChange(cyclist);
    }
  };

  const buttonText = isAlreadyDefault
    ? (translations.unselectDefault || 'Unselect')
    : (translations.selectAsDefault || 'Set Default');

  const isMobile = window.innerWidth < 768;

  return (
    <button
      onClick={handleSetAsDefault}
      className="select-as-default-button"
      style={{
        background: isAlreadyDefault
          ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
          : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
        border: 'none',
        borderRadius: '8px',
        padding: isMobile
          ? 'clamp(6px, 2vw, 8px)'
          : 'clamp(6px, 2vw, 8px) clamp(8px, 3vw, 12px)',
        color: 'white',
        fontSize: 'clamp(12px, 3vw, 14px)',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '0' : '6px',
        boxShadow: isAlreadyDefault
          ? '0 2px 8px rgba(16, 185, 129, 0.3)'
          : '0 2px 8px rgba(251, 191, 36, 0.3)',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        opacity: 1,
        minWidth: isMobile ? '36px' : 'auto',
        width: isMobile ? '36px' : 'auto'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = isAlreadyDefault
          ? '0 4px 12px rgba(16, 185, 129, 0.4)'
          : '0 4px 12px rgba(251, 191, 36, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = isAlreadyDefault
          ? '0 2px 8px rgba(16, 185, 129, 0.3)'
          : '0 2px 8px rgba(251, 191, 36, 0.3)';
      }}
      onMouseDown={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = isAlreadyDefault
          ? '0 1px 4px rgba(16, 185, 129, 0.3)'
          : '0 1px 4px rgba(251, 191, 36, 0.3)';
      }}
      onMouseUp={(e) => {
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = isAlreadyDefault
          ? '0 4px 12px rgba(16, 185, 129, 0.4)'
          : '0 4px 12px rgba(251, 191, 36, 0.4)';
      }}
      title={isAlreadyDefault ? 'Click to unselect as default cyclist' : 'Click to select as default cyclist'}
    >
      <span>{isAlreadyDefault ? '✅' : '⭐'}</span>
      {!isMobile && buttonText}
    </button>
  );
};

export default SelectAsDefaultButton;