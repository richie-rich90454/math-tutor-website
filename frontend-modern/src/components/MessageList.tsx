import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { MessageListProps } from "../types/props";

function MarkdownRenderer({ content }: { content: string }) {
    return (
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {content}
        </ReactMarkdown>
    );
}

export function MessageList({ messages, isLoading }: MessageListProps) {
    if (messages.length === 0) return null;

    return (
        <div class="chat-messages-area">
            <div class="chat-messages-inner">
                <div class="chat-messages-list">
                    {messages.map((msg, i) => (
                        <div key={i} class={`message-row message-row-${msg.role}`}>
                            <div class={`message-bubble message-bubble-${msg.role}`}>
                                {msg.content ? (
                                    msg.role === "assistant" ? (
                                        <MarkdownRenderer content={msg.content} />
                                    ) : (
                                        msg.content
                                    )
                                ) : msg.role === "assistant" &&
                                  isLoading &&
                                  i === messages.length - 1 ? (
                                    <span class="loading-dots">
                                        <span class="loading-dot"></span>
                                        <span class="loading-dot"></span>
                                        <span class="loading-dot"></span>
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
