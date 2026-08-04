"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    useEffect,
    useRef,
    ReactNode,
} from "react";
import { translationLoaders, Translations } from "@/lib/translations";
import en from "@/lib/translations/en";

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
    { code: "ar", name: "العربية" },
    { code: "he", name: "עברית" },
    { code: "kk", name: "Қазақша" },
    { code: "ug", name: "ئۇيغۇرچە" },
    { code: "ko", name: "한국어" },
    { code: "za", name: "Vahcuengh" },
    { code: "ru", name: "Русский (Russian)" },
    { code: "yi", name: "彝语 (Yi)" },
    { code: "tg", name: "Тоҷикӣ (Tajik)" },
    { code: "vi", name: "Tiếng Việt (Jing)" },
    { code: "uz", name: "O'zbekcha (Uzbek)" },
    { code: "ky", name: "Кыргызча (Kyrgyz)" },
    { code: "hmn", name: "苗语 (Miao)" },
    { code: "dng", name: "侗语 (Kam)" },
    { code: "bca", name: "白语 (Bai)" },
    { code: "tdd", name: "傣语 (Dai)" },
    { code: "nxq", name: "纳西语 (Naxi)" },
    { code: "tji", name: "土家语 (Tujia)" },
    { code: "pcc", name: "布依语 (Buyi)" },
    { code: "hni", name: "哈尼语 (Hani)" },
    { code: "lic", name: "黎语 (Hlai)" },
    { code: "iom", name: "瑶语 (Iu Mien)" },
    { code: "lis", name: "傈僳语 (Lisu)" },
    { code: "lhu", name: "拉祜语 (Lahu)" },
    { code: "wbm", name: "佤语 (Wa)" },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations are code-split per language; only English ships in the initial bundle.
const loadedTranslations: Record<string, Translations> = { en };

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Always initialize with English to match server render
    const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);
    const [translations, setTranslations] = useState<Translations>(en);

    // Load saved language after mount (client-only)
    const initialLang = useRef(currentLanguage);
    useEffect(() => {
        try {
            const stored = localStorage.getItem("preferred-language");
            if (stored) {
                const found = languages.find((l) => l.code === stored);
                if (found && found.code !== initialLang.current.code) {
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

    // Lazy-load the translation table for the active language.
    useEffect(() => {
        let cancelled = false;
        const code = currentLanguage.code;
        if (loadedTranslations[code]) {
            setTranslations(loadedTranslations[code]);
            return;
        }
        translationLoaders[code]?.()
            .then((mod) => {
                if (cancelled) {
                    return;
                }
                loadedTranslations[code] = mod.default;
                setTranslations(mod.default);
            })
            .catch(() => {
                // Fall back to English; t() handles missing keys.
            });
        return () => {
            cancelled = true;
        };
    }, [currentLanguage.code]);

    const setLanguage = useCallback((language: Language) => {
        setCurrentLanguage(language);
    }, []);

    const t = useCallback(
        (key: keyof Translations): string => {
            return translations[key] || en[key] || String(key);
        },
        [translations],
    );

    const value = useMemo(
        () => ({ currentLanguage, setLanguage, t }),
        [currentLanguage, setLanguage, t],
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

export { languages };
