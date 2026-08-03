package com.mathtutor.service;

import com.mathtutor.repo.SessionRepository;
import com.mathtutor.repo.UserRepository;
import com.mathtutor.security.JwtUtil;
import com.mathtutor.security.SecurityUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final SecurityUtil security;
    private final JwtUtil jwtUtil;
    private final UserRepository users;
    private final SessionRepository sessions;

    public AuthService(
            SecurityUtil security,
            JwtUtil jwtUtil,
            UserRepository users,
            SessionRepository sessions) {
        this.security = security;
        this.jwtUtil = jwtUtil;
        this.users = users;
        this.sessions = sessions;
    }

    public record AuthResult(UserRepository.UserRecord user, String token) {
    }

    public AuthResult signup(String email, String name, String password) {
        if (users.findByEmail(email).isPresent()) {
            log.warn("Signup rejected: email already registered");
            throw new EmailExistsException();
        }

        String userId = UUID.randomUUID().toString();
        String passwordHash = security.hashPassword(password);
        users.createUser(userId, email, name, passwordHash);

        UserRepository.UserRecord user = users.findById(userId).orElseThrow();
        String jwtToken = jwtUtil.signToken(user.id(), user.email());
        sessions.createSession(userId, jwtToken);
        log.info("Signup succeeded: user={} email={}", userId, email);
        return new AuthResult(user, jwtToken);
    }

    public Optional<AuthResult> login(String email, String password, boolean remember) {
        Optional<UserRepository.UserRecord> found = users.findByEmail(email);
        if (found.isEmpty()) {
            log.warn("Login failed: unknown email");
            return Optional.empty();
        }
        UserRepository.UserRecord user = found.get();
        if (!security.comparePassword(password, user.password_hash())) {
            log.warn("Login failed: bad password for user={}", user.id());
            return Optional.empty();
        }

        if (!remember) {
            sessions.deleteByUser(user.id());
        }

        String jwtToken = jwtUtil.signToken(user.id(), user.email());
        sessions.createSession(user.id(), jwtToken);
        log.info("Login succeeded: user={} remember={}", user.id(), remember);
        return Optional.of(new AuthResult(user, jwtToken));
    }

    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            sessions.deleteByToken(token);
            log.info("Logout: session token revoked");
        }
    }

    public static class EmailExistsException extends RuntimeException {
    }
}
