package com.mathtutor.repo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class MessageRepository {

    private final JdbcTemplate jdbc;

    public MessageRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public MessageRecord addMessage(
            String chatSessionId,
            String role,
            String content,
            int tokenCount) {
        String id = UUID.randomUUID().toString();
        jdbc.update(
                "INSERT INTO chat_messages (id, chat_session_id, role, content, token_count) VALUES (?, ?, ?, ?, ?)",
                id, chatSessionId, role, content, tokenCount);
        jdbc.update(
                "UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?",
                chatSessionId);
        return findById(id).orElseThrow();
    }

    public Optional<MessageRecord> findById(String messageId) {
        return jdbc.query("SELECT * FROM chat_messages WHERE id = ?", rs -> {
            if (!rs.next()) {
                return Optional.empty();
            }
            return Optional.of(mapRow(rs));
        }, messageId);
    }

    public List<MessageRecord> findByChat(String chatSessionId) {
        return jdbc.query(
                "SELECT * FROM chat_messages WHERE chat_session_id = ? ORDER BY created_at ASC",
                (rs, rowNum) -> mapRow(rs),
                chatSessionId);
    }

    public List<MessageRecord> findRecent(String chatSessionId, int limit) {
        List<MessageRecord> rows = jdbc.query(
                "SELECT * FROM chat_messages WHERE chat_session_id = ? ORDER BY created_at DESC LIMIT ?",
                (rs, rowNum) -> mapRow(rs),
                chatSessionId, limit);
        java.util.Collections.reverse(rows);
        return rows;
    }

    public void deleteByChat(String chatSessionId) {
        jdbc.update("DELETE FROM chat_messages WHERE chat_session_id = ?", chatSessionId);
    }

    public void setPinned(String messageId, boolean pinned) {
        jdbc.update("UPDATE chat_messages SET is_pinned = ? WHERE id = ?", pinned ? 1 : 0, messageId);
    }

    public List<MessageRecord> findPinned(String chatSessionId) {
        return jdbc.query(
                "SELECT * FROM chat_messages WHERE chat_session_id = ? AND is_pinned = 1 ORDER BY created_at ASC",
                (rs, rowNum) -> mapRow(rs),
                chatSessionId);
    }

    private MessageRecord mapRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new MessageRecord(
                rs.getString("id"),
                rs.getString("chat_session_id"),
                rs.getString("role"),
                rs.getString("content"),
                rs.getInt("token_count"),
                rs.getInt("is_pinned"),
                rs.getString("created_at"));
    }

    public record MessageRecord(
            String id,
            String chat_session_id,
            String role,
            String content,
            int token_count,
            int is_pinned,
            String created_at) {
    }
}
