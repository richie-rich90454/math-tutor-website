package com.mathtutor.db;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Set;

@Component
public class SchemaInitializer {

    private final JdbcTemplate jdbc;

    public SchemaInitializer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final String INITIAL_SCHEMA = """
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
            """;

    private static final String ADD_TOPIC_COLUMN = "ALTER TABLE chat_sessions ADD COLUMN topic TEXT";

    @PostConstruct
    public void initialize() {
        jdbc.execute("PRAGMA journal_mode = WAL");
        jdbc.execute("PRAGMA foreign_keys = ON");

        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS _migrations (
                    version INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TEXT DEFAULT (datetime('now'))
                )
                """);

        Set<Integer> applied = applyVersions();

        if (!applied.contains(1)) {
            jdbc.execute(INITIAL_SCHEMA);
            recordMigration(1, "initial_schema");
        }

        if (!applied.contains(2)) {
            try {
                jdbc.execute(ADD_TOPIC_COLUMN);
            } catch (Exception e) {
                if (!e.getMessage().contains("duplicate column")) {
                    throw e;
                }
            }
            recordMigration(2, "add_topic_column");
        }
    }

    private Set<Integer> applyVersions() {
        List<Integer> versions = jdbc.queryForList(
                "SELECT version FROM _migrations",
                Integer.class);
        return Set.copyOf(versions);
    }

    private void recordMigration(int version, String name) {
        jdbc.update(
                "INSERT INTO _migrations (version, name) VALUES (?, ?)",
                version,
                name);
    }
}
