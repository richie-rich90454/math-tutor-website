"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import gsap from "gsap";
import { useLanguage } from "@/contexts/LanguageContext";

interface MessageActionsProps {
    messageId: string;
    content: string;
    onRegenerate?: () => void;
    onFeedback?: (type: "up" | "down") => void;
    feedback?: "up" | "down" | null;
    isVisible: boolean;
}

const MessageActions = memo(function MessageActions({
    content,
    onRegenerate,
    onFeedback,
    feedback,
    isVisible,
}: MessageActionsProps) {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        if (isVisible) {
            gsap.fromTo(ref.current, { x: 10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.2, ease: "power2.out" });
        } else {
            gsap.to(ref.current, { x: 10, opacity: 0, duration: 0.15, ease: "power2.in" });
        }
    }, [isVisible]);

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [content]);

    return (
        <div ref={ref} className="msg-actions" style={{ visibility: isVisible ? "visible" : "hidden" }}>
            <button onClick={handleCopy} className="msg-action-btn" title={t("chatCopyMessage")} aria-label={t("chatCopyMessage")}>
                {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                )}
                {copied && <span className="msg-action-label">{t("chatCopied")}</span>}
            </button>
            {onRegenerate && (
                <button onClick={onRegenerate} className="msg-action-btn" title={t("chatRegenerate")} aria-label={t("chatRegenerate")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={feedback === "up" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onFeedback("down")}
                        className={`msg-action-btn ${feedback === "down" ? "is-active" : ""}`}
                        title={t("chatNotHelpful")}
                        aria-label={t("chatNotHelpful")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={feedback === "down" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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