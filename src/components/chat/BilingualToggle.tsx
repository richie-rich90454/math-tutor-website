"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api-client";

// C15 bilingual display: per-message "Show Mandarin" toggle. One on-demand AI
// call translates the message; the result is cached for the row's lifetime.
export default function BilingualToggle({
    message,
    disabled,
}: {
    message: string;
    disabled?: boolean;
}) {
    const { t, currentLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [translation, setTranslation] = useState("");

    const toggle = useCallback(async () => {
        if (open) {
            setOpen(false);
            return;
        }
        setOpen(true);
        if (translation) return;
        setLoading(true);
        try {
            const res = await apiFetch("/api/chat/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    preferredLanguage: currentLanguage.code,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setTranslation(data.translation || "");
            }
        } catch {
            // translation unavailable; leave the box empty
        } finally {
            setLoading(false);
        }
    }, [open, translation, message, currentLanguage.code]);

    if (disabled) return null;

    return (
        <span className="bilingual-toggle">
            <button
                onClick={toggle}
                className="msg-edit-btn"
                title={t("showMandarin") || "Show Mandarin"}
                aria-label={t("showMandarin") || "Show Mandarin"}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M5 8l6 6" />
                    <path d="M4 14l6-6 2-3" />
                    <path d="M2 5h12" />
                    <path d="M7 2h1" />
                    <path d="M22 22l-5-10-5 10" />
                    <path d="M14 18h6" />
                </svg>
            </button>
            {open && <span className="bilingual-text">{loading ? "…" : translation || "…"}</span>}
        </span>
    );
}
