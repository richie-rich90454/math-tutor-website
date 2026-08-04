import { memo } from "react";
import dynamic from "next/dynamic";
import type { Message } from "@/types/chat";
import Skeleton from "@/components/ui/Skeleton";
import BilingualToggle from "@/components/chat/BilingualToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const MarkdownRenderer = dynamic(() => import("@/components/ui/MarkdownRenderer"), {
    loading: () => <Skeleton height="60px" variant="card" />,
});
const MessageActions = dynamic(() => import("@/components/chat/MessageActions"));

interface MessageRowProps {
    message: Message;
    isHovered: boolean;
    isStreaming: boolean;
    isLastMessage: boolean;
    formatTime: (d: Date) => string;
    onRegenerate: () => void;
    onFresh: () => void;
    onFeedback: (msgId: string, type: "up" | "down") => void;
    feedbackValue: "up" | "down" | null;
    onEdit: (messageId: string, content: string) => void;
    editLabel: string;
    onSuggestionClick?: (text: string) => void;
    onFollowUp?: (text: string) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onTogglePin?: (messageId: string) => void;
    isPinned?: boolean;
}

const MessageRow = memo(function MessageRow({
    message,
    isHovered,
    isStreaming,
    isLastMessage,
    formatTime,
    onRegenerate,
    onFresh,
    onFeedback,
    feedbackValue,
    onEdit,
    editLabel,
    onSuggestionClick,
    onFollowUp,
    onMouseEnter,
    onMouseLeave,
    onTogglePin,
    isPinned,
}: MessageRowProps) {
    const { t } = useLanguage();
    return (
        <div
            className={`message-row ${message.role === "user" ? "is-user" : "is-assistant"}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="message-row-bubble-wrapper">
                {message.role === "user" ? (
                    <>
                        <div className="message-bubble-user">
                            <MarkdownRenderer
                                content={message.content}
                                onSuggestionClick={onSuggestionClick}
                            />
                        </div>
                        {isHovered && !isStreaming && (
                            <button
                                className="msg-edit-btn"
                                onClick={() => onEdit(message.id, message.content)}
                                title={editLabel}
                                aria-label={editLabel}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onEdit(message.id, message.content);
                                    }
                                }}
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
                                >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>
                        )}
                        <span className="message-time is-right">
                            {formatTime(message.timestamp)}
                        </span>
                    </>
                ) : (
                    <div className="msg-wrapper">
                        <MessageActions
                            messageId={message.id}
                            content={message.content}
                            onRegenerate={onRegenerate}
                            onFresh={onFresh}
                            isCached={message.isCached}
                            onFeedback={(type) => onFeedback(message.id, type)}
                            feedback={feedbackValue}
                            isVisible={isHovered}
                            onTogglePin={onTogglePin ? () => onTogglePin(message.id) : undefined}
                            isPinned={isPinned}
                        />
                        {message.isCached && (
                            <span className="msg-cached-badge">{t("chatAskedBefore")}</span>
                        )}
                        {!isStreaming && onFollowUp && (
                            <div className="followup-chips">
                                <button type="button" className="followup-chip" onClick={() => onFollowUp(t("followUpExplain"))}>
                                    {t("followUpExplain")}
                                </button>
                                <button type="button" className="followup-chip" onClick={() => onFollowUp(t("followUpExamples"))}>
                                    {t("followUpExamples")}
                                </button>
                                <button type="button" className="followup-chip" onClick={() => onFollowUp(t("followUpAnother"))}>
                                    {t("followUpAnother")}
                                </button>
                            </div>
                        )}
                        <div
                            className="message-bubble-assistant"
                            data-streaming={isStreaming && isLastMessage ? "true" : undefined}
                            aria-busy={isStreaming && isLastMessage ? "true" : "false"}
                        >
                            {message.content ? (
                                <MarkdownRenderer
                                    content={message.content}
                                    onSuggestionClick={onSuggestionClick}
                                />
                            ) : (
                                <span className="streaming-cursor" />
                            )}
                        </div>
                        <span className="message-time is-left">
                            {formatTime(message.timestamp)}
                        </span>
                        <BilingualToggle message={message.content} disabled={isStreaming} />
                    </div>
                )}
            </div>
        </div>
    );
});

export default MessageRow;
