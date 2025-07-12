import React from 'react';
import { setDefaultCyclist } from '../utils/defaultCyclistStorage';

const SelectAsDefaultButton = ({ cyclist, onDefaultChange, translations = {}, isAlreadyDefault = false }) => {
  const handleSetAsDefault = () => {
    if (isAlreadyDefault) return; // Don't do anything if already default
    
    const success = setDefaultCyclist(cyclist);
    if (success && onDefaultChange) {
      onDefaultChange(cyclist);
    }
  };

  const buttonText = isAlreadyDefault 
    ? (translations.alreadySelectedCyclist || 'Default')
    : (translations.selectAsDefault || 'Set Default');

  const isMobile = window.innerWidth < 768;

  return (
    <button
      onClick={handleSetAsDefault}
      disabled={isAlreadyDefault}
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
        cursor: isAlreadyDefault ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '0' : '6px',
        boxShadow: isAlreadyDefault 
          ? '0 2px 8px rgba(16, 185, 129, 0.3)'
          : '0 2px 8px rgba(251, 191, 36, 0.3)',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        opacity: isAlreadyDefault ? 0.8 : 1,
        minWidth: isMobile ? '36px' : 'auto',
        width: isMobile ? '36px' : 'auto'
      }}
      onMouseEnter={(e) => {
        if (!isAlreadyDefault) {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isAlreadyDefault) {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 8px rgba(251, 191, 36, 0.3)';
        }
      }}
      onMouseDown={(e) => {
        if (!isAlreadyDefault) {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 1px 4px rgba(251, 191, 36, 0.3)';
        }
      }}
      onMouseUp={(e) => {
        if (!isAlreadyDefault) {
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.4)';
        }
      }}
    >
      <span>{isAlreadyDefault ? '✅' : '⭐'}</span>
      {!isMobile && buttonText}
    </button>
  );
};

export default SelectAsDefaultButton;