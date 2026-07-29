export function MessageList({ messages, isLoading }) {
    if (messages.length === 0) return null;

    return (
        <div class="chat-messages-area">
            <div class="chat-messages-inner">
                <div class="chat-messages-list">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            class={`message-row message-row-${msg.role}`}
                        >
                            <div class={`message-bubble message-bubble-${msg.role}`}>
                                {msg.content || (msg.role === 'assistant' && isLoading && i === messages.length - 1 ? (
                                    <span class="loading-dots">
                                        <span class="loading-dot"></span>
                                        <span class="loading-dot"></span>
                                        <span class="loading-dot"></span>
                                    </span>
                                ) : null)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
