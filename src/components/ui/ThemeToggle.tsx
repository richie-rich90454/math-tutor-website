"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { particleBurst } from "@/lib/gsap";
import { useLanguage } from "@/contexts/LanguageContext";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
    const { t } = useLanguage();
    const [theme, setTheme] = useState<Theme>("system");
    const [mounted, setMounted] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);

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

    const cycle = () => {
        // Cosmic animation on icon
        if (iconRef.current && btnRef.current) {
            const tl = gsap.timeline();

            // Shrink + rotate icon
            tl.to(iconRef.current, {
                scale: 0,
                rotate: 180,
                duration: 0.25,
                ease: "power2.in",
            });

            // Burst particles from the button center
            const isDark = theme === "light";
            const colors = isDark
                ? ["#fbbf24", "#f59e0b", "#fcd34d", "#fde68a"]
                : ["#6366f1", "#a78bfa", "#818cf8", "#c4b5fd"];
            tl.call(() => particleBurst(btnRef.current!, 10, colors));

            // Expand back with new icon
            tl.to(iconRef.current, {
                scale: 1,
                rotate: 360,
                duration: 0.4,
                ease: "back.out(2)",
            });
        }

        setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
    };

    if (!mounted)
        return (
            <button className="theme-toggle-btn" aria-label={t("themeToggle")}>
                <div className="theme-toggle-icon" />
            </button>
        );

    return (
        <button
            ref={btnRef}
            onClick={cycle}
            className="theme-toggle-btn"
            aria-label={t("themeCurrent").replace("%s", theme)}
            aria-expanded="false"
        >
            <div ref={iconRef} className="theme-toggle-icon">
                {theme === "light" && (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
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
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                )}
                {theme === "system" && (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                )}
            </div>
        </button>
    );
}
