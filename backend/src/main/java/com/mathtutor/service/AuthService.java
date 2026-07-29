package com.mathtutor.service;

import com.mathtutor.domain.User;
import com.mathtutor.dto.auth.AuthResponse;
import com.mathtutor.dto.auth.LoginRequest;
import com.mathtutor.dto.auth.SignupRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse signup(SignupRequest request);

    void logout(Long userId);

    User validateToken(String token);
}
