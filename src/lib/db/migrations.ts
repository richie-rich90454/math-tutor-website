import Database from "better-sqlite3";

const MIGRATIONS = [
    {
        version: 1,
        name: "initial_schema",
        sql: `
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                avatar_url TEXT,
                preferred_language TEXT DEFAULT 'en',
                math_level TEXT DEFAULT 'intermediate',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                token TEXT UNIQUE NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                title TEXT NOT NULL,
                preview TEXT,
                topic TEXT,
                is_archived INTEGER DEFAULT 0,
                is_pinned INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS usage_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                chat_session_id TEXT,
                request_tokens INTEGER DEFAULT 0,
                response_tokens INTEGER DEFAULT 0,
                model TEXT DEFAULT 'deepseek-v4-flash',
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id TEXT PRIMARY KEY REFERENCES users(id),
                theme TEXT DEFAULT 'system',
                font_size TEXT DEFAULT 'medium',
                message_density TEXT DEFAULT 'comfortable',
                sound_enabled INTEGER DEFAULT 1,
                keyboard_shortcuts_enabled INTEGER DEFAULT 1,
                animations_enabled INTEGER DEFAULT 1
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_session_id ON chat_messages(chat_session_id);
            CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
        `,
    },
    {
        version: 2,
        name: "add_topic_column",
        sql: `ALTER TABLE chat_sessions ADD COLUMN topic TEXT;`,
    },
];

export function migrate(db: Database.Database): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT DEFAULT (datetime('now'))
        )
    `);

    const applied = new Set(
        db
            .prepare("SELECT version FROM _migrations")
            .all()
            .map((row: any) => row.version),
    );

    const pending = MIGRATIONS.filter((m) => !applied.has(m.version));

    for (const migration of pending) {
        try {
            db.exec(migration.sql);
        } catch (e: any) {
            if (!e.message?.includes("duplicate column")) {
                throw e;
            }
        }
        db.prepare("INSERT INTO _migrations (version, name) VALUES (?, ?)").run(
            migration.version,
            migration.name,
        );
    }
}
