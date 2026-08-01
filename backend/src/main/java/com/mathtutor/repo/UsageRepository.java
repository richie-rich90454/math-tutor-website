package com.mathtutor.repo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class UsageRepository {

    private final JdbcTemplate jdbc;

    public UsageRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void logUsage(
            String userId,
            String chatSessionId,
            int requestTokens,
            int responseTokens,
            String model) {
        jdbc.update(
                "INSERT INTO usage_logs (id, user_id, chat_session_id, request_tokens, response_tokens, model) VALUES (?, ?, ?, ?, ?, ?)",
                java.util.UUID.randomUUID().toString(),
                userId,
                chatSessionId,
                requestTokens,
                responseTokens,
                model);
    }

    public long countSince(String userId, String since) {
        Long count = jdbc.query(
                "SELECT COUNT(*) FROM usage_logs WHERE user_id = ? AND created_at >= ?",
                rs -> rs.next() ? rs.getLong(1) : 0L,
                userId, since);
        return count == null ? 0 : count;
    }

    public long countDaily(String userId) {
        Long count = jdbc.query(
                "SELECT COUNT(*) FROM usage_logs WHERE user_id = ? AND created_at >= datetime('now', '-1 day')",
                rs -> rs.next() ? rs.getLong(1) : 0L,
                userId);
        return count == null ? 0 : count;
    }
}
