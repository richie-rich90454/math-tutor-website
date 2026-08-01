package com.mathtutor.service;

import com.mathtutor.repo.SessionRepository;
import com.mathtutor.repo.UserRepository;
import com.mathtutor.security.JwtUtil;
import com.mathtutor.security.SecurityUtil;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

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
            throw new EmailExistsException();
        }

        String userId = UUID.randomUUID().toString();
        String passwordHash = security.hashPassword(password);
        users.createUser(userId, email, name, passwordHash);

        UserRepository.UserRecord user = users.findById(userId).orElseThrow();
        String jwtToken = jwtUtil.signToken(user.id(), user.email());
        sessions.createSession(userId, jwtToken);
        return new AuthResult(user, jwtToken);
    }

    public Optional<AuthResult> login(String email, String password, boolean remember) {
        Optional<UserRepository.UserRecord> found = users.findByEmail(email);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        UserRepository.UserRecord user = found.get();
        if (!security.comparePassword(password, user.password_hash())) {
            return Optional.empty();
        }

        if (!remember) {
            sessions.deleteByUser(user.id());
        }

        String jwtToken = jwtUtil.signToken(user.id(), user.email());
        sessions.createSession(user.id(), jwtToken);
        return Optional.of(new AuthResult(user, jwtToken));
    }

    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            sessions.deleteByToken(token);
        }
    }

    public static class EmailExistsException extends RuntimeException {
    }
}
