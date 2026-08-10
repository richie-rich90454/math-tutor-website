"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// Detects browsers missing the APIs the modern client relies on and offers a
// path to the IE6-compatible legacy client instead.
export default function BrowserSupportBanner() {
    const { t } = useLanguage();
    const [needsLegacy, setNeedsLegacy] = useState(false);

    useEffect(() => {
        const supported =
            typeof window !== "undefined" &&
            typeof window.ResizeObserver === "function" &&
            typeof window.AbortController === "function" &&
            typeof window.matchMedia === "function" &&
            typeof window.fetch === "function" &&
            typeof ReadableStream === "function";
        setNeedsLegacy(!supported);
    }, []);

    if (!needsLegacy) return null;

    return (
        <div className="browser-support-banner" role="status">
            <span>{t("browserOutdated") || "Your browser may not support all features"}</span>
            <a href="/legacy" className="browser-support-link">
                {t("legacyVersion") || "Legacy version"}
            </a>
        </div>
    );
}
