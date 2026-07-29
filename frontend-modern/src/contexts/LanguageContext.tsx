import { createContext, useContext, useState, useCallback } from 'preact/compat';
import type { ComponentChildren } from 'preact';
import { translations } from '../lib/translations';

export interface Language {
    code: string;
    name: string;
}

export const languages: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'zh-hans', name: '简体中文' },
    { code: 'zh-hant', name: '繁體中文' },
    { code: 'mn-cyrl', name: 'Монгол' },
    { code: 'mn-mong', name: 'ᠮᠣᠩᠭᠣᠯ' },
    { code: 'bo', name: 'བོད་སྐད་' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'ar', name: 'العربية' },
    { code: 'he', name: 'עברית' },
];

interface LanguageContextType {
    currentLanguage: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>(null!);

export function LanguageProvider({ children }: { children: ComponentChildren }) {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
        try {
            const stored = localStorage.getItem('preferred-language');
            if (stored) {
                const found = languages.find(l => l.code === stored);
                if (found) return found;
            }
        } catch {}
        return languages[0];
    });

    const setLanguage = useCallback((lang: Language) => {
        setCurrentLanguage(lang);
        try { localStorage.setItem('preferred-language', lang.code); } catch {}
    }, []);

    const t = useCallback((key: string): string => {
        const lang = translations[currentLanguage.code] as unknown as Record<string, string> | undefined;
        const fallback = translations.en as unknown as Record<string, string>;
        return lang?.[key] || fallback?.[key] || key;
    }, [currentLanguage.code]);

    return (
        <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
