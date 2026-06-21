"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const RTL_LANGUAGES = new Set(["ar", "he"]);

function getBcp47(code: string): string {
    const map: Record<string, string> = {
        "zh-hans": "zh-Hans",
        "zh-hant": "zh-Hant",
        "mn-cyrl": "mn",
        "mn-mong": "mn-Mong",
    };
    return map[code] || code;
}

export default function HtmlAttributes() {
    const { currentLanguage } = useLanguage();

    useEffect(() => {
        const html = document.documentElement;
        html.lang = getBcp47(currentLanguage.code);
        html.dir = RTL_LANGUAGES.has(currentLanguage.code) ? "rtl" : "ltr";
    }, [currentLanguage.code]);

    return null;
}
