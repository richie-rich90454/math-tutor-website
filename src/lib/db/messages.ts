import { getDb } from "../db";

interface ChatMessage {
    id: string;
    chat_session_id: string;
    role: "user" | "assistant";
    content: string;
    token_count: number;
    created_at: string;
}

export function addMessage(
    id: string,
    chatSessionId: string,
    role: "user" | "assistant",
    content: string,
    tokenCount: number = 0,
): ChatMessage {
    const db = getDb();
    db.prepare(
        "INSERT INTO chat_messages (id, chat_session_id, role, content, token_count) VALUES (?, ?, ?, ?, ?)",
    ).run(id, chatSessionId, role, content, tokenCount);

    db.prepare("UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?").run(
        chatSessionId,
    );

    return getMessageById(id)!;
}

export function getMessageById(messageId: string): ChatMessage | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(messageId) as
        | ChatMessage
        | undefined;
    return row || null;
}

export function getChatMessages(chatSessionId: string): ChatMessage[] {
    const db = getDb();
    return db
        .prepare("SELECT * FROM chat_messages WHERE chat_session_id = ? ORDER BY created_at ASC")
        .all(chatSessionId) as ChatMessage[];
}

export function getRecentMessages(chatSessionId: string, limit: number = 20): ChatMessage[] {
    const db = getDb();
    return db
        .prepare(
            "SELECT * FROM chat_messages WHERE chat_session_id = ? ORDER BY created_at DESC LIMIT ?",
        )
        .all(chatSessionId, limit)
        .reverse() as ChatMessage[];
}

export function deleteMessages(chatSessionId: string): void {
    const db = getDb();
    db.prepare("DELETE FROM chat_messages WHERE chat_session_id = ?").run(chatSessionId);
}
