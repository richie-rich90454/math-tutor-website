import { memo } from 'preact/compat';
import type { Message } from '../types/message';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MessageActions } from './MessageActions';

interface MessageRowProps {
    message: Message;
    isHovered: boolean;
    isStreaming: boolean;
    isLastMessage: boolean;
    formatTime: (d: Date | string | undefined) => string;
    onRegenerate: () => void;
    onFeedback: (msgId: string, type: "up" | "down") => void;
    feedbackValue: "up" | "down" | null;
    onEdit: (messageId: string, content: string) => void;
    editLabel: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export const MessageRow = memo(function MessageRow({
    message,
    isHovered,
    isStreaming,
    isLastMessage,
    formatTime,
    onRegenerate,
    onFeedback,
    feedbackValue,
    onEdit,
    editLabel,
    onMouseEnter,
    onMouseLeave,
}: MessageRowProps) {
    return (
        <div
            class={`message-row ${message.role === "user" ? "is-user" : "is-assistant"}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div class="message-row-bubble-wrapper">
                {message.role === "user" ? (
                    <>
                        <div class="message-bubble-user">
                            <MarkdownRenderer content={message.content} />
                        </div>
                        {isHovered && !isStreaming && (
                            <button
                                class="msg-edit-btn"
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
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>
                        )}
                        <span class="message-time is-right">
                            {formatTime(message.timestamp)}
                        </span>
                    </>
                ) : (
                    <div class="msg-wrapper">
                                                <MessageActions


                                messageId={message.id}
                                content={message.content}
                                onRegenerate={onRegenerate}
                                onFeedback={(type) => onFeedback(message.id, type)}
                                feedback={feedbackValue}
                                isVisible={isHovered}
                            />
                        <div
                            class="message-bubble-assistant"
                            data-streaming={isStreaming && isLastMessage ? "true" : undefined}
                            aria-busy={isStreaming && isLastMessage ? "true" : "false"}
                        >
                            {message.content ? (
                                <MarkdownRenderer content={message.content} />
                            ) : (
                                <span class="streaming-cursor" />
                            )}
                        </div>
                        <span class="message-time is-left">
                            {formatTime(message.timestamp)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
});
