"use client";

import { useState, useCallback, memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MessageActionsProps {
    messageId: string;
    content: string;
    onRegenerate?: () => void;
    onFresh?: () => void;
    isCached?: boolean;
    onFeedback?: (type: "up" | "down") => void;
    feedback?: "up" | "down" | null;
    isVisible: boolean;
    onTogglePin?: () => void;
    isPinned?: boolean;
}

const MessageActions = memo(function MessageActions({
    content,
    onRegenerate,
    onFresh,
    isCached,
    onFeedback,
    feedback,
    isVisible,
    onTogglePin,
    isPinned,
}: MessageActionsProps) {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [content]);

    return (
        <div className={`msg-actions ${isVisible ? "is-visible" : ""}`}>
            <button
                onClick={handleCopy}
                className="msg-action-btn"
                title={t("chatCopyMessage")}
                aria-label={t("chatCopyMessage")}
            >
                {copied ? (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                )}
                {copied && <span className="msg-action-label">{t("chatCopied")}</span>}
            </button>
            {onTogglePin && (
                <button
                    onClick={onTogglePin}
                    className={`msg-action-btn ${isPinned ? "is-active" : ""}`}
                    title={isPinned ? t("unpin") : t("pin")}
                    aria-label={isPinned ? t("unpin") : t("pin")}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isPinned ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 17v5" />
                        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                    </svg>
                </button>
            )}
            {onFresh && isCached && (
                <button
                    onClick={onFresh}
                    className="msg-action-btn is-fresh"
                    title={t("chatFreshAnswer")}
                    aria-label={t("chatFreshAnswer")}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M1 4v6h6" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                </button>
            )}
            {onRegenerate && (
                <button
                    onClick={onRegenerate}
                    className="msg-action-btn"
                    title={t("chatRegenerate")}
                    aria-label={t("chatRegenerate")}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                </button>
            )}
            {onFeedback && (
                <>
                    <button
                        onClick={() => onFeedback("up")}
                        className={`msg-action-btn ${feedback === "up" ? "is-active" : ""}`}
                        title={t("chatHelpful")}
                        aria-label={t("chatHelpful")}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={feedback === "up" ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onFeedback("down")}
                        className={`msg-action-btn ${feedback === "down" ? "is-active" : ""}`}
                        title={t("chatNotHelpful")}
                        aria-label={t("chatNotHelpful")}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={feedback === "down" ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
});

export { MessageActions };
export default MessageActions;
