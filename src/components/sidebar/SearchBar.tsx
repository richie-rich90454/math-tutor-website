"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface SearchBarProps {
    effectiveIsOpen: boolean;
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    handleNewChat: () => void;
}

export default function SearchBar({
    effectiveIsOpen,
    searchQuery,
    setSearchQuery,
    handleNewChat,
}: SearchBarProps) {
    const { t } = useLanguage();

    return (
        <>
            <div className={`sb-search-section ${effectiveIsOpen ? "is-open" : "is-collapsed"}`}>
                {effectiveIsOpen ? (
                    <div className="sb-search-wrapper">
                        <svg
                            className="sb-search-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t("sidebarSearchPlaceholder")}
                            className="sb-search-input"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="sb-search-clear">
                                <svg
                                    className="sb-search-clear-icon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        className="sb-search-collapsed-btn"
                        title={t("sidebarSearchPlaceholder")}
                    >
                        <svg
                            className="sb-search-collapsed-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <span className="sb-tooltip">{t("sidebarSearchPlaceholder")}</span>
                    </button>
                )}
            </div>

            <div className={`sb-new-chat-section ${effectiveIsOpen ? "is-open" : "is-collapsed"}`}>
                {effectiveIsOpen ? (
                    <button onClick={handleNewChat} className="sb-new-chat-btn">
                        <svg
                            className="sb-new-chat-btn-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        {t("sidebarNewChat")}
                    </button>
                ) : (
                    <button
                        onClick={handleNewChat}
                        className="sb-new-chat-btn-collapsed"
                        title={t("sidebarNewChat")}
                    >
                        <svg
                            className="sb-new-chat-btn-collapsed-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        <span className="sb-tooltip">{t("sidebarNewChat")}</span>
                    </button>
                )}
            </div>
        </>
    );
}
