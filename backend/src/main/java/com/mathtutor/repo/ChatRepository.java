package com.mathtutor.repo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public class ChatRepository {

    private final JdbcTemplate jdbc;

    public ChatRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public ChatRecord createChat(String userId, String title, String preview) {
        String id = UUID.randomUUID().toString();
        jdbc.update(
                "INSERT INTO chat_sessions (id, user_id, title, preview) VALUES (?, ?, ?, ?)",
                id, userId, title, preview);
        return findById(id).orElseThrow();
    }

    public ChatRecord createChatWithId(String id, String userId, String title, String preview) {
        jdbc.update(
                "INSERT INTO chat_sessions (id, user_id, title, preview) VALUES (?, ?, ?, ?)",
                id, userId, title, preview);
        return findById(id).orElseThrow();
    }

    public List<ChatRecord> findByUser(String userId) {
        return jdbc.query(
                "SELECT * FROM chat_sessions WHERE user_id = ? AND is_archived = 0 ORDER BY is_pinned DESC, updated_at DESC",
                (rs, rowNum) -> new ChatRecord(
                        rs.getString("id"),
                        rs.getString("user_id"),
                        rs.getString("title"),
                        rs.getString("preview"),
                        rs.getString("topic"),
                        rs.getInt("is_archived"),
                        rs.getInt("is_pinned"),                        rs.getString("created_at"),
                        rs.getString("updated_at")),
                userId);
    }

    public List<String> findRecentChatIds(String userId, int limit) {
        return jdbc.queryForList(
                "SELECT id FROM chat_sessions WHERE user_id = ? AND is_archived = 0 "
                        + "ORDER BY is_pinned DESC, updated_at DESC LIMIT ?",
                String.class, userId, limit);
    }

    public Optional<ChatRecord> findById(String chatId) {
        return jdbc.query("SELECT * FROM chat_sessions WHERE id = ?", rs -> {
            if (!rs.next()) {
                return Optional.empty();
            }
            return Optional.of(new ChatRecord(
                    rs.getString("id"),
                    rs.getString("user_id"),
                    rs.getString("title"),
                    rs.getString("preview"),
                    rs.getString("topic"),
                    rs.getInt("is_archived"),
                    rs.getInt("is_pinned"),
                    rs.getString("created_at"),
                    rs.getString("updated_at")));
        }, chatId);
    }

    private static final Set<String> UPDATABLE_COLUMNS = Set.of(
            "title", "preview", "topic", "is_archived", "is_pinned");

    public void updateChat(String chatId, String column, Object value) {
        if (!UPDATABLE_COLUMNS.contains(column)) {
            throw new IllegalArgumentException("Illegal chat column: " + column);
        }
        jdbc.update(
                "UPDATE chat_sessions SET " + column + " = ?, updated_at = datetime('now') WHERE id = ?",
                value, chatId);
    }

    public void delete(String chatId) {
        jdbc.update("DELETE FROM chat_sessions WHERE id = ?", chatId);
    }

    public List<ChatRecord> search(String userId, String query) {
        String likeQuery = "%" + query + "%";
        return jdbc.query(
                """
                        SELECT DISTINCT cs.* FROM chat_sessions cs
                        LEFT JOIN chat_messages cm ON cm.chat_session_id = cs.id
                        WHERE cs.user_id = ?
                        AND (cs.title LIKE ? OR cs.preview LIKE ? OR cm.content LIKE ?)
                        ORDER BY cs.updated_at DESC
                        """,
                (rs, rowNum) -> new ChatRecord(
                        rs.getString("id"),
                        rs.getString("user_id"),
                        rs.getString("title"),
                        rs.getString("preview"),
                        rs.getString("topic"),
                        rs.getInt("is_archived"),
                        rs.getInt("is_pinned"),
                        rs.getString("created_at"),
                        rs.getString("updated_at")),
                userId, likeQuery, likeQuery, likeQuery);
    }

    public void touch(String chatId) {
        jdbc.update(
                "UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?",
                chatId);
    }

    public record ChatRecord(
            String id,
            String user_id,
            String title,
            String preview,
            String topic,
            int is_archived,
            int is_pinned,
            String created_at,
            String updated_at) {
    }
}
