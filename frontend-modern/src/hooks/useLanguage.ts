import { useState, useCallback } from 'preact/hooks';

const STORAGE_KEY = 'preferred-language';

const translations: Record<string, Record<string, string>> = {
    en: {
        title: 'MathTutor AI',
        subtitle: 'Your personal math tutor. Ask any question and get step-by-step explanations.',
        placeholder: 'Ask a math question...',
        footer: 'MathTutor AI \u2014 built for everyone',
    },
    es: {
        title: 'MathTutor IA',
        subtitle: 'Tu tutor de matem\u00e1ticas personal. Haz cualquier pregunta y obt\u00e9n explicaciones paso a paso.',
        placeholder: 'Haz una pregunta de matem\u00e1ticas...',
        footer: 'MathTutor IA \u2014 construido para todos',
    },
    fr: {
        title: 'MathTutor IA',
        subtitle: 'Votre tuteur de math\u00e9matiques personnel. Posez une question et obtenez des explications \u00e9tape par \u00e9tape.',
        placeholder: 'Posez une question de math\u00e9matiques...',
        footer: 'MathTutor IA \u2014 construit pour tous',
    },
    de: {
        title: 'MathTutor KI',
        subtitle: 'Ihr pers\u00f6nlicher Mathe-Tutor. Stellen Sie eine Frage und erhalten Sie Schritt-f\u00fcr-Schritt-Erkl\u00e4rungen.',
        placeholder: 'Stellen Sie eine Mathe-Frage...',
        footer: 'MathTutor KI \u2014 f\u00fcr alle gebaut',
    },
};

export type SupportedLanguage = keyof typeof translations;

export function useLanguage() {
    const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
        if (typeof window === 'undefined') return 'en';
        return (localStorage.getItem(STORAGE_KEY) as SupportedLanguage) || 'en';
    });

    const setLanguage = useCallback((lang: SupportedLanguage) => {
        setCurrentLang(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, lang);
        }
    }, []);

    const t = useCallback(
        (key: keyof (typeof translations)['en']): string => {
            return translations[currentLang]?.[key] || translations.en[key] || key;
        },
        [currentLang]
    );

    return { currentLang, setLanguage, t };
}
