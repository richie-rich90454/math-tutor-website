"use client";

import { useState } from "react";
import { useLanguage, languages, type Language } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
    const { currentLanguage, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const handleLanguageChange = (language: Language) => {
        setLanguage(language);
        setIsOpen(false);
    };

    return (
        <div className="lang-switcher">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lang-switcher-btn"
                aria-label={`Language: ${currentLanguage.name}`}
                aria-expanded={isOpen}
            >
                <svg
                    className="lang-switcher-globe"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="lang-switcher-label">{currentLanguage.name}</span>
                <svg
                    className={`lang-switcher-chevron ${isOpen ? "is-open" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="lang-switcher-dropdown">
                    {languages.map((language) => (
                        <button
                            key={language.code}
                            onClick={() => handleLanguageChange(language)}
                            className={`lang-switcher-option ${
                                currentLanguage.code === language.code ? "is-active" : ""
                            }`}
                        >
                            <span>{language.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
