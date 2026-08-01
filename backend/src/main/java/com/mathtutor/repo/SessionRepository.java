package com.mathtutor.repo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class SessionRepository {

    private final JdbcTemplate jdbc;

    public SessionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public SessionRecord createSession(String userId, String token) {
        String id = UUID.randomUUID().toString();
        String expiresAt = java.time.Instant.now()
                .plus(java.time.Duration.ofDays(7))
                .toString();
        jdbc.update(
                "INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
                id, userId, token, expiresAt);
        return findByToken(token).orElseThrow();
    }

    public Optional<SessionRecord> findByToken(String token) {
        return queryOne(
                "SELECT * FROM sessions WHERE token = ?",
                token);
    }

    public void deleteByToken(String token) {
        jdbc.update("DELETE FROM sessions WHERE token = ?", token);
    }

    public void deleteByUser(String userId) {
        jdbc.update("DELETE FROM sessions WHERE user_id = ?", userId);
    }

    public void cleanupExpired() {
        jdbc.update("DELETE FROM sessions WHERE expires_at < datetime('now')");
    }

    private Optional<SessionRecord> queryOne(String sql, Object... args) {
        return jdbc.query(sql, rs -> {
            if (!rs.next()) {
                return Optional.empty();
            }
            return Optional.of(new SessionRecord(
                    rs.getString("id"),
                    rs.getString("user_id"),
                    rs.getString("token"),
                    rs.getString("expires_at"),
                    rs.getString("created_at")));
        }, args);
    }

    public record SessionRecord(
            String id,
            String user_id,
            String token,
            String expires_at,
            String created_at) {
    }
}
