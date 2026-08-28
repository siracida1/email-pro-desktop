
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import es from './es.json';
import en from './en.json';
import fr from './fr.json';
import * as api from '../services/api';

type Translations = Record<string, string>;
const translations: Record<string, Translations> = { es, en, fr };

interface I18nContextType {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextType>({
  t: (key) => key,
  locale: 'es',
  setLocale: () => {},
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState('es');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await api.getData('settings');
        if (saved && typeof saved === 'object' && 'language' in saved) {
          setLocaleState((saved as { language: string }).language);
        }
      } catch {}
    };
    loadLanguage();
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    setLocaleState(newLocale);
    api.saveData('settings', { language: newLocale }).catch(() => {});
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let text = translations[locale]?.[key] ?? translations['es']?.[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};
