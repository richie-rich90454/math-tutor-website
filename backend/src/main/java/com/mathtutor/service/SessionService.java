package com.mathtutor.service;

import tools.jackson.databind.JsonNode;
import com.mathtutor.repo.SessionRepository;
import com.mathtutor.repo.UserRepository;
import com.mathtutor.security.JwtUtil;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
public class SessionService {

    private final JwtUtil jwtUtil;
    private final SessionRepository sessions;
    private final UserRepository users;

    public SessionService(JwtUtil jwtUtil, SessionRepository sessions, UserRepository users) {
        this.jwtUtil = jwtUtil;
        this.sessions = sessions;
        this.users = users;
    }

    public record SessionUser(
            String id,
            String email,
            String name,
            String avatar_url,
            String preferred_language,
            String math_level) {
    }

    public Optional<SessionUser> getSession(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        JsonNode payload = jwtUtil.verifyToken(token);
        if (payload == null) {
            return Optional.empty();
        }

        String userId = payload.has("sub") ? payload.get("sub").asText() : null;
        if (userId == null || userId.isEmpty()) {
            return Optional.empty();
        }

        try {
            Optional<SessionRepository.SessionRecord> dbSession = sessions.findByToken(token);
            if (dbSession.isEmpty()) {
                return Optional.empty();
            }

            if (isExpired(dbSession.get().expires_at())) {
                return Optional.empty();
            }

            Optional<UserRepository.UserRecord> user = users.findById(userId);
            if (user.isEmpty()) {
                return Optional.empty();
            }

            UserRepository.UserRecord u = user.get();
            return Optional.of(new SessionUser(
                    u.id(),
                    u.email(),
                    u.name(),
                    u.avatar_url(),
                    u.preferred_language(),
                    u.math_level()));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private boolean isExpired(String expiresAt) {
        try {
            return Instant.parse(expiresAt).isBefore(Instant.now());
        } catch (Exception e) {
            return true;
        }
    }
}
