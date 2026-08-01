package com.mathtutor.repo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void createUser(String id, String email, String name, String passwordHash) {
        jdbc.update(
                "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
                id, email, name, passwordHash);
    }

    public Optional<UserRecord> findByEmail(String email) {
        return queryOne(
                "SELECT * FROM users WHERE email = ?",
                email);
    }

    public Optional<UserRecord> findById(String id) {
        return queryOne(
                "SELECT * FROM users WHERE id = ?",
                id);
    }

    public void updateUser(String id, String column, Object value) {
        jdbc.update(
                "UPDATE users SET " + column + " = ?, updated_at = datetime('now') WHERE id = ?",
                value, id);
    }

    private Optional<UserRecord> queryOne(String sql, Object... args) {
        return jdbc.query(sql, rs -> {
            if (!rs.next()) {
                return Optional.empty();
            }
            return Optional.of(new UserRecord(
                    rs.getString("id"),
                    rs.getString("email"),
                    rs.getString("name"),
                    rs.getString("password_hash"),
                    rs.getString("avatar_url"),
                    rs.getString("preferred_language"),
                    rs.getString("math_level"),
                    rs.getString("created_at"),
                    rs.getString("updated_at")));
        }, args);
    }

    public record UserRecord(
            String id,
            String email,
            String name,
            String password_hash,
            String avatar_url,
            String preferred_language,
            String math_level,
            String created_at,
            String updated_at) {
    }
}
