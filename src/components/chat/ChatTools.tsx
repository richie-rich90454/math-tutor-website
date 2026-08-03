"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { apiFetch } from "@/lib/api-client";

interface ChatToolsProps {
    chatId: string | null;
}

export default function ChatTools({ chatId }: ChatToolsProps) {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [note, setNote] = useState<string | null>(null);
    const [generatingNote, setGeneratingNote] = useState(false);

    const handleShare = useCallback(async () => {
        if (!chatId) return;
        try {
            const res = await apiFetch(`/api/chats/${chatId}/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{}",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Share failed");
            const url = `${window.location.origin}${data.url}`;
            try {
                await navigator.clipboard.writeText(url);
            } catch {
                // clipboard unavailable; still show the link
            }
            addToast("success", t("shareCopied") || "Link copied");
        } catch {
            addToast("error", t("errorNetwork") || "Failed to share");
        }
    }, [chatId, addToast, t]);

    const handleNotes = useCallback(async () => {
        if (!chatId || generatingNote) return;
        setGeneratingNote(true);
        try {
            const res = await apiFetch(`/api/chats/${chatId}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{}",
            });
            const data = await res.json();
            if (res.ok) {
                setNote(data.note || "");
            } else {
                addToast("error", data?.error || t("errorNetwork") || "Failed to make notes");
            }
        } catch {
            addToast("error", t("errorNetwork") || "Failed to make notes");
        } finally {
            setGeneratingNote(false);
        }
    }, [chatId, generatingNote, addToast, t]);

    return (
        <>
            <button
                onClick={handleNotes}
                className="app-header-btn"
                aria-label={t("makeNotes") || "Make study notes"}
                title={t("makeNotes") || "Make study notes"}
                disabled={generatingNote}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            </button>
            <button
                onClick={handleShare}
                className="app-header-btn"
                aria-label={t("share") || "Share chat"}
                title={t("share") || "Share chat"}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
            </button>

            {note !== null && (
                <div className="shortcut-modal-backdrop" onClick={() => setNote(null)}>
                    <div
                        className="shortcut-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: 480 }}
                    >
                        <div className="shortcut-modal-header">
                            <h2 className="shortcut-modal-title">{t("notes") || "Notes"}</h2>
                        </div>
                        <p
                            style={{
                                fontSize: 14,
                                color: "var(--fg-secondary)",
                                marginBottom: "var(--space-6)",
                                whiteSpace: "pre-wrap",
                                maxHeight: "50vh",
                                overflow: "auto",
                            }}
                        >
                            {note || t("makeNotes") || "Make study notes"}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: "var(--space-3)",
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                onClick={() => setNote(null)}
                                className="error-boundary-btn error-boundary-btn-secondary"
                            >
                                {t("modalOk") || "OK"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
