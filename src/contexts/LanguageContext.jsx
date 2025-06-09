import React, { createContext, useContext, useState } from 'react';
import { translations } from '../locales/translations.js';
import { appConfig } from '../config/appConfig.js';
import { getDefaultCyclist, setDefaultCyclist } from '../utils/defaultCyclistStorage.js';

const LanguageContext = createContext();

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');
  const [defaultCyclist, setDefaultCyclistState] = useState(() => 
    getDefaultCyclist(appConfig.defaultCyclist)
  );

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  const switchLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  const updateDefaultCyclist = (newDefaultCyclist) => {
    setDefaultCyclist(newDefaultCyclist);
    setDefaultCyclistState(newDefaultCyclist);
  };

  return (
    <LanguageContext.Provider value={{ language, t, switchLanguage, defaultCyclist, updateDefaultCyclist }}>
      {children}
    </LanguageContext.Provider>
  );
};