import { memo } from 'preact/compat';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Message } from '../types/message';

interface MessageRowProps {
    message: Message;
    isHovered: boolean;
    isStreaming: boolean;
    isLastMessage: boolean;
    formatTime: (d: Date) => string;
    onRegenerate: () => void;
    onFeedback: (msgId: string, type: 'up' | 'down') => void;
    feedbackValue: 'up' | 'down' | null;
    onEdit: (messageId: string, content: string) => void;
    editLabel: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

function MarkdownRenderer({ content }: { content: string }) {
    return (
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {content}
        </ReactMarkdown>
    );
}

export const MessageRow = memo(function MessageRow({ message, isHovered, isStreaming, isLastMessage, _formatTime, onRegenerate, onFeedback, feedbackValue, _editLabel, onMouseEnter, onMouseLeave }: MessageRowProps) {
    const isUser = message.role === 'user';
    const showSkeleton = isLastMessage && isStreaming && !message.content;

    return (
        <div
            class={`message-row ${isUser ? 'is-user' : 'is-assistant'}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div class={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
                {showSkeleton ? (
                    <span class="loading-dots">
                        <span class="loading-dot"></span>
                        <span class="loading-dot"></span>
                        <span class="loading-dot"></span>
                    </span>
                ) : isUser ? (
                    <p style="white-space: pre-wrap">{message.content}</p>
                ) : (
                    <div class="mdr-content">
                        <MarkdownRenderer content={message.content} />
                    </div>
                )}
            </div>
            {!isUser && isHovered && !isStreaming && (
                <div class="msg-actions">
                    <button class="msg-action-btn" onClick={() => { try { navigator.clipboard.writeText(message.content); } catch {} }} title="Copy">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    </button>
                    <button class="msg-action-btn" onClick={onRegenerate} title="Regenerate">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                    </button>
                    <button class={`msg-action-btn ${feedbackValue === 'up' ? 'is-active' : ''}`} onClick={() => onFeedback(message.id, 'up')} title="Helpful">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><polyline points="7 22 7 13" /></svg>
                    </button>
                    <button class={`msg-action-btn ${feedbackValue === 'down' ? 'is-active' : ''}`} onClick={() => onFeedback(message.id, 'down')} title="Not helpful">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" /><polyline points="17 2 17 11" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
});
