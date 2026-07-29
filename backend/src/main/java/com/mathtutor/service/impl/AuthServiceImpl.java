package com.mathtutor.service.impl;

import com.mathtutor.config.JwtUtil;
import com.mathtutor.domain.AuthSession;
import com.mathtutor.domain.User;
import com.mathtutor.dto.auth.AuthResponse;
import com.mathtutor.dto.auth.LoginRequest;
import com.mathtutor.dto.auth.SignupRequest;
import com.mathtutor.exception.ChatException;
import com.mathtutor.repository.AuthSessionRepository;
import com.mathtutor.repository.UserRepository;
import com.mathtutor.service.AuthService;
import java.time.LocalDateTime;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AuthSessionRepository authSessionRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserRepository userRepository, AuthSessionRepository authSessionRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.authSessionRepository = authSessionRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ChatException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ChatException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId());
        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setToken(token);
        session.setExpiresAt(LocalDateTime.now().plusDays(7));
        authSessionRepository.save(session);

        return toResponse(user, token);
    }

    @Override
    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ChatException("Email already in use");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setName(request.getName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPreferredLanguage("en");
        user.setMathLevel(request.getMathLevel() != null ? request.getMathLevel() : "intermediate");
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId());
        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setToken(token);
        session.setExpiresAt(LocalDateTime.now().plusDays(7));
        authSessionRepository.save(session);

        return toResponse(user, token);
    }

    @Override
    @Transactional
    public void logout(Long userId) {
        authSessionRepository.deleteByUserId(userId);
    }

    @Override
    public User validateToken(String token) {
        Long userId = jwtUtil.validateToken(token);
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }

    private AuthResponse toResponse(User user, String token) {
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(),
                user.getPreferredLanguage(), user.getMathLevel(), token);
    }
}
