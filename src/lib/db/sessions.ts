import { getDb } from "../db";

interface Session {
    id: string;
    user_id: string;
    token: string;
    expires_at: string;
    created_at: string;
}

export function createSession(userId: string, providedToken?: string): Session {
    const db = getDb();
    const { v4: uuidv4 } = require("uuid");
    const id = uuidv4();
    const token = providedToken || uuidv4() + uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(
        "INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)"
    ).run(id, userId, token, expiresAt);

    return getSessionByToken(token)!;
}

export function getSessionByToken(token: string): Session | null {
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM sessions WHERE token = ?")
        .get(token) as Session | undefined;
    return row || null;
}

export function deleteSession(token: string): void {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function deleteUserSessions(userId: string): void {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function cleanupExpiredSessions(): void {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}