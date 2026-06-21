"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { Translations } from "@/lib/translations";
import { particleBurst, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { APP_VERSION } from "@/lib/config";

type Theme = "light" | "dark" | "system";

const SHORTCUTS = [
    { keys: ["Ctrl", "B"], descriptionKey: "shortcutsToggleSidebar" as const },
    { keys: ["Ctrl", "N"], descriptionKey: "shortcutsNewChat" as const },
    { keys: ["Ctrl", "Enter"], descriptionKey: "shortcutsSendMessage" as const },
    { keys: ["Ctrl", "/"], descriptionKey: "shortcutsShowHelp" as const },
    { keys: ["Ctrl", "E"], descriptionKey: "shortcutsExportChat" as const },
    { keys: ["Shift", "Enter"], descriptionKey: "shortcutsNewLine" as const },
    { keys: ["Esc"], descriptionKey: "shortcutsCloseModals" as const },
];

const THEME_LABELS: Record<Theme, keyof Translations> = {
    light: "settingsThemeLight",
    dark: "settingsThemeDark",
    system: "settingsThemeSystem",
};

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const { t, currentLanguage, setLanguage } = useLanguage();
    const [theme, setTheme] = useState<Theme>("system");
    const [mounted, setMounted] = useState(false);
    const [saved, setSaved] = useState(false);
    const pageRef = useRef<HTMLDivElement>(null);
    const themeBtnRef = useRef<HTMLButtonElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored) setTheme(stored);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem("theme", theme);
        const root = document.documentElement;
        if (theme === "system") {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.setAttribute("data-theme", isDark ? "dark" : "light");
        } else {
            root.setAttribute("data-theme", theme);
        }
    }, [theme, mounted]);

    // Page entrance + scroll-triggered animation
    useGSAP(() => {
        if (!pageRef.current) return;
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) return;

        gsap.from(pageRef.current, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
        });
        gsap.from(".settings-section", {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.2,
            ease: "power2.out",
        });

        if (settingsRef.current) {
            const cards = settingsRef.current.querySelectorAll(".settings-card");
            gsap.from(cards, {
                y: 30,
                opacity: 0,
                duration: 0.5,
                stagger: 0.08,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: settingsRef.current,
                    start: "top 90%",
                },
            });
        }
    }, { scope: pageRef });

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    const cycleTheme = () => {
        if (iconRef.current && themeBtnRef.current) {
            const tl = gsap.timeline();
            tl.to(iconRef.current, {
                scale: 0,
                rotate: 180,
                duration: 0.25,
                ease: "power2.in",
            });
            const isDark = theme === "light";
            const colors = isDark
                ? ["#fbbf24", "#f59e0b", "#fcd34d", "#fde68a"]
                : ["#6366f1", "#a78bfa", "#818cf8", "#c4b5fd"];
            tl.call(() => particleBurst(themeBtnRef.current!, 10, colors));
            tl.to(iconRef.current, {
                scale: 1,
                rotate: 360,
                duration: 0.4,
                ease: "back.out(2)",
            });
        }
        setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
    };

    const handleLanguageChange = (lang: (typeof languages)[0]) => {
        setLanguage(lang);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="settings-loading">
                <div className="settings-skeleton">
                    <div className="skeleton" style={{ height: 40, width: "60%", marginBottom: "var(--space-8)" }} />
                    <div className="skeleton" style={{ height: 120, marginBottom: "var(--space-6)" }} />
                    <div className="skeleton" style={{ height: 120, marginBottom: "var(--space-6)" }} />
                    <div className="skeleton" style={{ height: 120 }} />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="settings-page">
            <div className="settings-container" ref={pageRef}>
                {/* Header */}
                <div className="settings-header">
                    <Link href="/" className="settings-back-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        {t("settingsBackToApp")}
                    </Link>
                    <h1 className="settings-title">{t("settingsTitle")}</h1>
                </div>

                <div ref={settingsRef}>
                    {/* Account Section */}
                    <section className="settings-section">
                        <h2 className="settings-section-title">{t("settingsAccount")}</h2>
                        <div className="settings-card">
                            <div className="settings-row">
                                <div className="settings-row-label">
                                    <span className="settings-row-title">{t("settingsEmail")}</span>
                                    <span className="settings-row-value">{user?.email}</span>
                                </div>
                            </div>
                            <div className="settings-row">
                                <div className="settings-row-label">
                                    <span className="settings-row-title">{t("settingsName")}</span>
                                    <span className="settings-row-value">{user?.name}</span>
                                </div>
                            </div>
                            <div className="settings-row">
                                <div className="settings-row-label">
                                    <span className="settings-row-title">{t("settingsMathLevel")}</span>
                                    <span className="settings-row-value">{user?.math_level || t("settingsNotSet")}</span>
                                </div>
                            </div>
                            <div className="settings-row">
                                <button
                                    onClick={logout}
                                    className="settings-danger-btn"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    {t("settingsSignOut")}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Appearance Section */}
                    <section className="settings-section">
                        <h2 className="settings-section-title">{t("settingsAppearance")}</h2>
                        <div className="settings-card">
                            <div className="settings-row">
                                <div className="settings-row-label">
                                    <span className="settings-row-title">{t("settingsTheme")}</span>
                                    <span className="settings-row-value">{t(THEME_LABELS[theme])}</span>
                                </div>
                                <button
                                    ref={themeBtnRef}
                                    onClick={cycleTheme}
                                    className="settings-theme-btn"
                                    aria-label={t("settingsCurrentTheme").replace("%s", theme)}
                                >
                                    <div ref={iconRef} className="settings-theme-icon">
                                        {theme === "light" && (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="5" />
                                                <line x1="12" y1="1" x2="12" y2="3" />
                                                <line x1="12" y1="21" x2="12" y2="23" />
                                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                                <line x1="1" y1="12" x2="3" y2="12" />
                                                <line x1="21" y1="12" x2="23" y2="12" />
                                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                            </svg>
                                        )}
                                        {theme === "dark" && (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                            </svg>
                                        )}
                                        {theme === "system" && (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                                <line x1="8" y1="21" x2="16" y2="21" />
                                                <line x1="12" y1="17" x2="12" y2="21" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Language Section */}
                    <section className="settings-section">
                        <h2 className="settings-section-title">{t("settingsLanguage")}</h2>
                        <div className="settings-card">
                            {languages.map((lang) => (
                                <div key={lang.code} className="settings-row">
                                    <div className="settings-row-label">
                                        <span className="settings-row-title">{lang.name}</span>
                                        <span className="settings-row-value">{lang.code}</span>
                                    </div>
                                    <button
                                        onClick={() => handleLanguageChange(lang)}
                                        className={`settings-radio ${currentLanguage.code === lang.code ? "is-active" : ""}`}
                                        aria-label={t("settingsSelectLanguage")}
                                    >
                                        {currentLanguage.code === lang.code && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {saved && (
                            <p className="settings-saved-hint">{t("settingsLanguageSaved")}</p>
                        )}
                    </section>

                    {/* Keyboard Shortcuts Section */}
                    <section className="settings-section">
                        <h2 className="settings-section-title">{t("settingsShortcuts")}</h2>
                        <div className="settings-card">
                            {SHORTCUTS.map((s) => (
                                <div key={s.descriptionKey} className="settings-row">
                                    <span className="settings-row-title">{t(s.descriptionKey)}</span>
                                    <span className="settings-kbd-group">
                                        {s.keys.map((k, i) => (
                                            <span key={k}>
                                                <kbd className="settings-kbd">{k}</kbd>
                                                {i < s.keys.length - 1 && <span className="settings-kbd-plus">+</span>}
                                            </span>
                                        ))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Version */}
                <div className="settings-footer">
                    <p className="settings-version">MathTutor AI v{APP_VERSION}</p>
                </div>
            </div>
        </div>
    );
}