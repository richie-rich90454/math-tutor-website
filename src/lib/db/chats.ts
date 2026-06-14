import { getDb } from "../db";

interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    preview: string | null;
    topic: string | null;
    is_archived: number;
    is_pinned: number;
    created_at: string;
    updated_at: string;
}

export function createChat(
    id: string,
    userId: string,
    title: string,
    preview?: string
): ChatSession {
    const db = getDb();
    db.prepare(
        "INSERT INTO chat_sessions (id, user_id, title, preview) VALUES (?, ?, ?, ?)"
    ).run(id, userId, title, preview || title);
    return getChatById(id)!;
}

export function getUserChats(userId: string): ChatSession[] {
    const db = getDb();
    return db
        .prepare(
            "SELECT * FROM chat_sessions WHERE user_id = ? AND is_archived = 0 ORDER BY is_pinned DESC, updated_at DESC"
        )
        .all(userId) as ChatSession[];
}

export function getChatById(chatId: string): ChatSession | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM chat_sessions WHERE id = ?").get(chatId) as
        | ChatSession
        | undefined;
    return row || null;
}

export function updateChat(
    chatId: string,
    fields: Partial<Pick<ChatSession, "title" | "preview" | "topic" | "is_archived" | "is_pinned">>
): void {
    const db = getDb();
    const sets: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
            sets.push(`${key} = ?`);
            values.push(value);
        }
    }

    if (sets.length === 0) return;

    sets.push("updated_at = datetime('now')");
    values.push(chatId);

    db.prepare(`UPDATE chat_sessions SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteChat(chatId: string): void {
    const db = getDb();
    db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(chatId);
}

export function searchChats(userId: string, query: string): ChatSession[] {
    const db = getDb();
    const likeQuery = `%${query}%`;
    return db
        .prepare(
            `SELECT DISTINCT cs.* FROM chat_sessions cs 
             LEFT JOIN chat_messages cm ON cm.chat_session_id = cs.id
             WHERE cs.user_id = ? 
             AND (cs.title LIKE ? OR cs.preview LIKE ? OR cm.content LIKE ?)
             ORDER BY cs.updated_at DESC`
        )
        .all(userId, likeQuery, likeQuery, likeQuery) as ChatSession[];
}