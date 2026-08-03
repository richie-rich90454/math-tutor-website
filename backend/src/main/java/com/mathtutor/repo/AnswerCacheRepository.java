package com.mathtutor.repo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class AnswerCacheRepository {

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

    public void put(String key, String question, String language, String topic, String answer) {
        jdbc.update(
                "INSERT INTO answer_cache (id, cache_key, question, language, topic, answer, hit_count) VALUES (?, ?, ?, ?, ?, ?, 1)",
                java.util.UUID.randomUUID().toString(), key, question, language, topic, answer);
    }

    public void incrementHit(String key) {
        jdbc.update("UPDATE answer_cache SET hit_count = hit_count + 1 WHERE cache_key = ?", key);
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
                rs.getInt("hit_count"));
    }

    public record CacheRecord(
            String cache_key,
            String question,
            String language,
            String topic,
            String answer,
            int hit_count) {
    }
}
