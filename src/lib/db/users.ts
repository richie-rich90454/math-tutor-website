import { getDb } from "../db";

interface User {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    avatar_url: string | null;
    preferred_language: string;
    math_level: string;
    created_at: string;
    updated_at: string;
}

export function createUser(id: string, email: string, name: string, passwordHash: string): User {
    const db = getDb();
    const stmt = db.prepare(
        `INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)`,
    );
    stmt.run(id, email, name, passwordHash);
    return getUserById(id)!;
}

export function getUserByEmail(email: string): User | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
    return row || null;
}

export function getUserById(id: string): User | null {
    const db = getDb();
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
    return row || null;
}

export function updateUser(
    id: string,
    fields: Partial<
        Pick<
            User,
            "name" | "email" | "avatar_url" | "preferred_language" | "math_level" | "password_hash"
        >
    >,
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
    values.push(id);

    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteUser(id: string): void {
    const db = getDb();
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
}
