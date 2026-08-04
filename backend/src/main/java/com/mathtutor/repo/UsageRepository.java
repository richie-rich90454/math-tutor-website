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
            String model,
            String ip) {
        jdbc.update(
                "INSERT INTO usage_logs (id, user_id, chat_session_id, request_tokens, response_tokens, model, ip) VALUES (?, ?, ?, ?, ?, ?, ?)",
                java.util.UUID.randomUUID().toString(),
                userId,
                chatSessionId,
                requestTokens,
                responseTokens,
                model,
                ip);
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

    public TokenSum sumByTypeSince(String userId, String since) {
        return jdbc.query(
                "SELECT COALESCE(SUM(request_tokens),0) AS r, COALESCE(SUM(response_tokens),0) AS o FROM usage_logs WHERE user_id = ? AND created_at >= ?",
                rs -> rs.next() ? new TokenSum(rs.getLong("r"), rs.getLong("o")) : new TokenSum(0, 0),
                userId, since);
    }

    public TokenSum sumByIpSince(String ip, String since) {
        return jdbc.query(
                "SELECT COALESCE(SUM(request_tokens),0) AS r, COALESCE(SUM(response_tokens),0) AS o FROM usage_logs WHERE ip = ? AND created_at >= ?",
                rs -> rs.next() ? new TokenSum(rs.getLong("r"), rs.getLong("o")) : new TokenSum(0, 0),
                ip, since);
    }

    public TokenSum sumByTypeForChat(String userId, String chatId) {
        return jdbc.query(
                "SELECT COALESCE(SUM(request_tokens),0) AS r, COALESCE(SUM(response_tokens),0) AS o FROM usage_logs WHERE user_id = ? AND chat_session_id = ?",
                rs -> rs.next() ? new TokenSum(rs.getLong("r"), rs.getLong("o")) : new TokenSum(0, 0),
                userId, chatId);
    }

    public List<DayTotal> totalsByDay(String userId, int days) {
        return jdbc.query(
                "SELECT date(created_at) AS d, SUM(request_tokens + response_tokens) AS t FROM usage_logs WHERE user_id = ? AND created_at >= datetime('now', ?) GROUP BY d ORDER BY d",
                (rs, rowNum) -> new DayTotal(rs.getString("d"), rs.getLong("t")),
                userId, "-" + (days - 1) + " days");
    }

    public long globalCacheHits() {
        Long hits = jdbc.query(
                "SELECT COALESCE(SUM(hit_count),0) FROM answer_cache",
                rs -> rs.next() ? rs.getLong(1) : 0L);
        return hits == null ? 0 : hits;
    }

    public long cacheHitsSince(String userId, String since) {
        Long hits = jdbc.query(
                "SELECT COUNT(*) FROM usage_logs WHERE user_id = ? AND model = 'answer-cache' AND created_at >= ?",
                rs -> rs.next() ? rs.getLong(1) : 0L,
                userId, since);
        return hits == null ? 0 : hits;
    }

    public record TokenSum(long request, long response) {
        public long total() {
            return request + response;
        }
    }

    public record DayTotal(String day, long tokens) {
    }
}
