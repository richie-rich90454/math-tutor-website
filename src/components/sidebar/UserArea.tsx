"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface User {
    id: string;
    email: string;
    name: string;
    preferred_language: string;
    math_level: string;
}

interface UserAreaProps {
    effectiveIsOpen: boolean;
    isAuthenticated: boolean;
    user: User | null;
    userInitials: string;
    showUserDropdown: boolean;
    setShowUserDropdown: (v: boolean) => void;
    logout: () => Promise<void>;
    onShowShortcuts?: () => void;
}

export default function UserArea({
    effectiveIsOpen,
    isAuthenticated,
    user,
    userInitials,
    showUserDropdown,
    setShowUserDropdown,
    logout,
    onShowShortcuts,
}: UserAreaProps) {
    const { t } = useLanguage();
    const router = useRouter();

    if (!effectiveIsOpen) {
        return (
            <div className="sb-footer-text">
                <div className="sb-footer-dot" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="sb-footer is-open">
                <button
                    className="sb-sign-in-btn"
                    onClick={() => router.push("/login")}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    {t("sidebarSignIn")}
                </button>
            </div>
        );
    }

    return (
        <div className="sb-footer is-open">
            <div
                className="sb-user-section"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowUserDropdown(!showUserDropdown);
                }}
            >
                <div className="sb-user-avatar">{userInitials}</div>
                <div className="sb-user-info">
                    <p className="sb-user-name">{user.name}</p>
                    <p className="sb-user-email">{user.email}</p>
                </div>
                {showUserDropdown && (
                    <div
                        className="sb-user-dropdown"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="sb-user-dropdown-item"
                            onClick={() => router.push("/settings")}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            {t("sidebarSettings")}
                        </button>
                        <button
                            className="sb-user-dropdown-item"
                            onClick={() => onShowShortcuts?.()}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
                            </svg>
                            {t("sidebarShortcuts")}
                        </button>
                        <div className="context-menu-divider" />
                        <button
                            className="sb-user-dropdown-item"
                            onClick={logout}
                            style={{ color: "var(--danger)" }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            {t("sidebarSignOut")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
