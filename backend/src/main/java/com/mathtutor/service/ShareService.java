package com.mathtutor.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;
import java.util.UUID;

/**
 * D19 read-only chat sharing. The owner creates an unguessable 32-hex token;
 * anyone with the link can read the chat without auth. No owner info is exposed.
 */
@Service
public class ShareService {

    private static final char[] HEX = "0123456789abcdef".toCharArray();
    private final JdbcTemplate jdbc;

    public ShareService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record SharedChat(String id, String chat_session_id, String token, String created_at) {
    }

    public String create(String chatId) {
        String token = randomToken();
        jdbc.update(
                "INSERT INTO shared_chats (id, chat_session_id, token) VALUES (?, ?, ?)",
                UUID.randomUUID().toString(), chatId, token);
        return token;
    }

    public Optional<SharedChat> findByToken(String token) {
        return jdbc.query(
                "SELECT * FROM shared_chats WHERE token = ?",
                rs -> rs.next()
                        ? Optional.of(new SharedChat(
                                rs.getString("id"),
                                rs.getString("chat_session_id"),
                                rs.getString("token"),
                                rs.getString("created_at")))
                        : Optional.empty(),
                token);
    }

    public void revoke(String chatId) {
        jdbc.update("DELETE FROM shared_chats WHERE chat_session_id = ?", chatId);
    }

    public Optional<String> tokenFor(String chatId) {
        return jdbc.query(
                "SELECT token FROM shared_chats WHERE chat_session_id = ?",
                rs -> rs.next() ? Optional.of(rs.getString("token")) : Optional.empty(),
                chatId);
    }

    private String randomToken() {
        byte[] bytes = new byte[16];
        new SecureRandom().nextBytes(bytes);
        StringBuilder sb = new StringBuilder(32);
        for (byte b : bytes) {
            sb.append(HEX[(b >> 4) & 0xf]).append(HEX[b & 0xf]);
        }
        return sb.toString();
    }
}
