"use client";

export default function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
    return (
        <div className={`message-row ${isUser ? "is-user" : "is-assistant"}`} role="status" aria-label={isUser ? "Loading message..." : "Loading response..."}>
            <div className="message-row-bubble-wrapper" style={{ maxWidth: isUser ? "72%" : "88%" }}>
                <div
                    className={isUser ? "message-bubble-user" : "message-bubble-assistant"}
                    style={{ minHeight: isUser ? 40 : 80 }}
                >
                    <div className="skeleton" style={{ width: isUser ? "60%" : "80%", height: 14, marginBottom: 8, borderRadius: "var(--radius-xs)" }} />
                    {!isUser && (
                        <>
                            <div className="skeleton" style={{ width: "90%", height: 14, marginBottom: 8, borderRadius: "var(--radius-xs)" }} />
                            <div className="skeleton" style={{ width: "40%", height: 14, borderRadius: "var(--radius-xs)" }} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}