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
    { code: "ar", name: "العربية" },
    { code: "he", name: "עברית" },
    { code: "kk", name: "Қазақша" },
    { code: "ug", name: "ئۇيغۇرچە" },
    { code: "ko", name: "한국어" },
    { code: "za", name: "Vahcuengh" },
    { code: "ru", name: "Русский (中国俄罗斯族)" },
    { code: "yi", name: "彝语 (Yunnan Yi)" },
    { code: "tg", name: "Тоҷикӣ (中国塔吉克族)" },
    { code: "vi", name: "Tiếng Việt (中国京族)" },
    { code: "uz", name: "O'zbekcha (中国乌孜别克族)" },
    { code: "ky", name: "Кыргызча (中国柯尔克孜族)" },
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

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Always initialize with English to match server render
    const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);

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

    const setLanguage = useCallback((language: Language) => {
        setCurrentLanguage(language);
    }, []);

    const t = useCallback(
        (key: keyof Translations): string => {
            return translations[currentLanguage.code]?.[key] || translations.en[key] || String(key);
        },
        [currentLanguage.code],
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
