"use client";

import { useState } from "react";
import { useLanguage, languages } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
    const { currentLanguage, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const handleLanguageChange = (language: any) => {
        setLanguage(language);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-700 backdrop-blur-sm transition-all hover:bg-white hover:shadow-sm"
            >
                <span>{currentLanguage.name}</span>
                <svg
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                <div className="absolute top-full right-0 z-50 mt-2 min-w-[120px] rounded-lg border border-gray-200 bg-white shadow-lg">
                    {languages.map((language) => (
                        <button
                            key={language.code}
                            onClick={() => handleLanguageChange(language)}
                            className={`flex w-full items-center space-x-2 px-3 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 ${
                                currentLanguage.code === language.code
                                    ? "bg-gray-50 text-gray-900"
                                    : "text-gray-700"
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
