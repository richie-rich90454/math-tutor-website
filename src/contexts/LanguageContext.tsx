"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from "react";
import { translations, Translations } from "@/lib/translations";

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
    { code: "en", name: "English" },
    { code: "zh-hans", name: "汉语" },
    { code: "zh-hant", name: "漢語" },
    { code: "mn-cyrl", name: "Монгол (Кирилл)" },
    { code: "mn-mong", name: "ᠮᠣᠩᠭᠣᠯ (Монгол)" },
    { code: "bo", name: "བོད་སྐད་" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "ja", name: "日本語" },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Always initialize with English to match server render
    const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);

    // Load saved language after mount (client-only)
    useEffect(() => {
        try {
            const stored = localStorage.getItem("preferred-language");
            if (stored) {
                const found = languages.find((l) => l.code === stored);
                if (found && found.code !== currentLanguage.code) {
                    setCurrentLanguage(found);
                }
            }
        } catch {}
    }, []);

    // Save language to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem("preferred-language", currentLanguage.code);
        } catch {}
    }, [currentLanguage.code]);

    const setLanguage = useCallback((language: Language) => {
        setCurrentLanguage(language);
    }, []);

    const t = useCallback((key: keyof Translations): string => {
        return translations[currentLanguage.code]?.[key] || translations.en[key];
    }, [currentLanguage.code]);

    const value = useMemo(() => ({ currentLanguage, setLanguage, t }), [currentLanguage, setLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

export { languages };
