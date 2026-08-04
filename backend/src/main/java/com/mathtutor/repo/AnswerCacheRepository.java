package com.mathtutor.repo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class AnswerCacheRepository {

    private static final int EXPIRY_DAYS = 7;

    private final JdbcTemplate jdbc;

    public AnswerCacheRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<CacheRecord> findByKey(String key) {
        return jdbc.query("SELECT * FROM answer_cache WHERE cache_key = ?", rs -> {
            if (!rs.next()) {
                return Optional.empty();
            }
            return Optional.of(mapRow(rs));
        }, key);
    }

    public Optional<CacheRecord> findByKeyInChats(String key, List<String> chatIds) {
        if (chatIds == null || chatIds.isEmpty()) {
            return Optional.empty();
        }
        String placeholders = String.join(",", Collections.nCopies(chatIds.size(), "?"));
        Object[] args = new Object[chatIds.size() + 1];
        args[0] = key;
        for (int i = 0; i < chatIds.size(); i++) {
            args[i + 1] = chatIds.get(i);
        }
        return jdbc.query(
                "SELECT * FROM answer_cache WHERE cache_key = ? AND chat_id IN (" + placeholders + ")"
                        + " AND created_at >= datetime('now', '-" + EXPIRY_DAYS + " days')"
                        + " ORDER BY created_at DESC LIMIT 1",
                rs -> {
                    if (!rs.next()) {
                        return Optional.empty();
                    }
                    return Optional.of(mapRow(rs));
                }, args);
    }

    public List<CacheRecord> findRecentByLanguage(String language, String topic, int limit) {
        if (topic != null && !topic.isBlank()) {
            return jdbc.query(
                    "SELECT * FROM answer_cache WHERE language = ? AND topic = ? ORDER BY created_at DESC LIMIT ?",
                    (rs, rowNum) -> mapRow(rs),
                    language, topic, limit);
        }
        return jdbc.query(
                "SELECT * FROM answer_cache WHERE language = ? ORDER BY created_at DESC LIMIT ?",
                (rs, rowNum) -> mapRow(rs),
                language, limit);
    }

    public List<CacheRecord> findRecentInChats(List<String> chatIds, int limit) {
        if (chatIds == null || chatIds.isEmpty()) {
            return List.of();
        }
        String placeholders = String.join(",", Collections.nCopies(chatIds.size(), "?"));
        Object[] args = new Object[chatIds.size() + 1];
        for (int i = 0; i < chatIds.size(); i++) {
            args[i] = chatIds.get(i);
        }
        args[chatIds.size()] = limit;
        return jdbc.query(
                "SELECT * FROM answer_cache WHERE chat_id IN (" + placeholders + ")"
                        + " AND created_at >= datetime('now', '-7 days')"
                        + " ORDER BY created_at DESC LIMIT ?",
                (rs, rowNum) -> mapRow(rs),
                args);
    }

    public void put(String key, String question, String language, String topic, String answer,
            String chatId, String userId) {
        jdbc.update(
                "INSERT INTO answer_cache (id, cache_key, question, language, topic, answer, hit_count, chat_id, user_id)"
                        + " VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
                java.util.UUID.randomUUID().toString(), key, question, language, topic, answer, chatId, userId);
    }

    public void rehome(String key, String chatId) {
        jdbc.update(
                "UPDATE answer_cache SET chat_id = ?, created_at = datetime('now') WHERE cache_key = ?",
                chatId, key);
    }

    public void incrementHit(String key) {
        jdbc.update("UPDATE answer_cache SET hit_count = hit_count + 1 WHERE cache_key = ?", key);
    }

    public void pruneExpired() {
        jdbc.update("DELETE FROM answer_cache WHERE created_at < datetime('now', '-" + EXPIRY_DAYS + " days')");
    }

    public void prune(int maxRows) {
        jdbc.update("""
                DELETE FROM answer_cache WHERE id IN (
                    SELECT id FROM answer_cache ORDER BY created_at DESC LIMIT -1 OFFSET ?
                )
                """, maxRows);
    }

    private CacheRecord mapRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new CacheRecord(
                rs.getString("cache_key"),
                rs.getString("question"),
                rs.getString("language"),
                rs.getString("topic"),
                rs.getString("answer"),
                rs.getInt("hit_count"),
                rs.getString("chat_id"),
                rs.getString("user_id"));
    }

    public record CacheRecord(
            String cache_key,
            String question,
            String language,
            String topic,
            String answer,
            int hit_count,
            String chat_id,
            String user_id) {
    }
}
