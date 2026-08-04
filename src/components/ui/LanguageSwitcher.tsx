"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage, languages, type Language } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
    const { currentLanguage, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLanguageChange = (language: Language) => {
        setLanguage(language);
        setIsOpen(false);
        buttonRef.current?.focus();
    };

    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const active = dropdownRef.current.querySelector<HTMLButtonElement>(".is-active");
            (active || dropdownRef.current.querySelector<HTMLButtonElement>("button"))?.focus();
        }
    }, [isOpen]);

    const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            setIsOpen(false);
            buttonRef.current?.focus();
            return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const items = Array.from(
                dropdownRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
            );
            if (items.length === 0) return;
            const idx = items.indexOf(document.activeElement as HTMLButtonElement);
            const next =
                e.key === "ArrowDown" ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0);
            items[next]?.focus();
        }
    };

    return (
        <div className="lang-switcher">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="lang-switcher-btn"
                aria-label={`Language: ${currentLanguage.name}`}
                aria-haspopup="listbox"
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
                <div
                    className="lang-switcher-dropdown"
                    ref={dropdownRef}
                    role="listbox"
                    onKeyDown={handleDropdownKeyDown}
                >
                    {languages.map((language) => (
                        <button
                            key={language.code}
                            onClick={() => handleLanguageChange(language)}
                            className={`lang-switcher-option ${
                                currentLanguage.code === language.code ? "is-active" : ""
                            }`}
                            role="option"
                            aria-selected={currentLanguage.code === language.code}
                        >
                            <span>{language.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
