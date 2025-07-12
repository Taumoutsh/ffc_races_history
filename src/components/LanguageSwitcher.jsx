import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { language, switchLanguage } = useTranslation();

  const toggleLanguage = () => {
    switchLanguage(language === 'en' ? 'fr' : 'en');
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '6px' : '12px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '25px',
      padding: isMobile ? '4px' : '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <span style={{
        fontSize: isMobile ? '12px' : '14px',
        fontWeight: '600',
        color: 'black',
        transition: 'all 0.3s ease'
      }}>
        {isMobile ? '🇬🇧' : '🇬🇧 EN'}
      </span>
      
      <div
        onClick={toggleLanguage}
        style={{
          width: isMobile ? '40px' : '50px',
          height: isMobile ? '20px' : '26px',
          background: language === 'en' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)',
          borderRadius: isMobile ? '10px' : '13px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: '2px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <div style={{
          width: isMobile ? '14px' : '18px',
          height: isMobile ? '14px' : '18px',
          background: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '1px',
          left: language === 'en' ? '2px' : (isMobile ? '22px' : '26px'),
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }} />
      </div>
      
      <span style={{
        fontSize: isMobile ? '12px' : '14px',
        fontWeight: '600',
        color: 'black',
        transition: 'all 0.3s ease'
      }}>
        {isMobile ? '🇫🇷' : '🇫🇷 FR'}
      </span>
    </div>
  );
};

export default LanguageSwitcher;