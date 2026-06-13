import { getDb } from "../db";

interface UsageLog {
    id: string;
    user_id: string;
    chat_session_id: string | null;
    request_tokens: number;
    response_tokens: number;
    model: string;
    created_at: string;
}

export function logUsage(
    id: string,
    userId: string,
    chatSessionId: string | null = null,
    requestTokens: number = 0,
    responseTokens: number = 0,
    model: string = "deepseek-v4-flash"
): UsageLog {
    const db = getDb();
    db.prepare(
        "INSERT INTO usage_logs (id, user_id, chat_session_id, request_tokens, response_tokens, model) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, userId, chatSessionId, requestTokens, responseTokens, model);

    return db.prepare("SELECT * FROM usage_logs WHERE id = ?").get(id) as UsageLog;
}

export function getUserUsage(userId: string, since?: string): UsageLog[] {
    const db = getDb();
    if (since) {
        return db
            .prepare("SELECT * FROM usage_logs WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC")
            .all(userId, since) as UsageLog[];
    }
    return db
        .prepare("SELECT * FROM usage_logs WHERE user_id = ? ORDER BY created_at DESC")
        .all(userId) as UsageLog[];
}

export function getUserDailyRequestCount(userId: string): number {
    const db = getDb();
    const row = db
        .prepare(
            "SELECT COUNT(*) as count FROM usage_logs WHERE user_id = ? AND created_at >= datetime('now', '-1 day')"
        )
        .get(userId) as { count: number };
    return row.count;
}