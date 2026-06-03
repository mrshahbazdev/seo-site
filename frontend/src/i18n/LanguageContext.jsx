import { createContext, useContext, useState, useCallback } from 'react';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';

const translations = { en, de, es };

const LANGUAGE_KEY = 'app_language';

const defaultLang = localStorage.getItem(LANGUAGE_KEY) || 'en';

const LanguageContext = createContext({
  language: defaultLang,
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLang] = useState(defaultLang);

  const setLanguage = useCallback((lang) => {
    setLang(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key, params) => {
      const keys = key.split('.');
      let value = translations[language];
      for (const k of keys) {
        value = value?.[k];
      }
      if (typeof value !== 'string') {
        let fallback = translations.en;
        for (const k of keys) {
          fallback = fallback?.[k];
        }
        value = typeof fallback === 'string' ? fallback : key;
      }
      if (params) {
        Object.entries(params).forEach(([param, val]) => {
          value = value.replace(`{{${param}}}`, val);
        });
      }
      return value;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
