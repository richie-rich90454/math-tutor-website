'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { translations, Translations } from '@/lib/translations';

export interface Language {
  code: string;
  name: string;
}

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof Translations) => string;
}

const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'zh-hans', name: '汉语' },
  { code: 'zh-hant', name: '漢語' },
  { code: 'mn-cyrl', name: 'Монгол (Кирилл)' },
  { code: 'mn-mong', name: 'ᠮᠣᠩᠭᠣᠯ (Монгол)' },
  { code: 'bo', name: 'བོད་སྐད་' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' }
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };

  const t = (key: keyof Translations): string => {
    return translations[currentLanguage.code]?.[key] || translations.en[key];
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export { languages };
