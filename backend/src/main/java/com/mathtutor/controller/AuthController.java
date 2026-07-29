package com.mathtutor.controller;

import com.mathtutor.domain.User;
import com.mathtutor.dto.auth.AuthResponse;
import com.mathtutor.dto.auth.LoginRequest;
import com.mathtutor.dto.auth.SignupRequest;
import com.mathtutor.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse auth = authService.login(request);
        addCookie(response, auth.getToken());
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request, HttpServletResponse response) {
        AuthResponse auth = authService.signup(request);
        addCookie(response, auth.getToken());
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        Cookie cookie = getAuthCookie(request);
        if (cookie != null) {
            String token = cookie.getValue();
            User user = authService.validateToken(token);
            if (user != null) {
                authService.logout(user.getId());
            }
        }
        Cookie clear = new Cookie("token", null);
        clear.setPath("/");
        clear.setMaxAge(0);
        response.addCookie(clear);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(HttpServletRequest request) {
        Cookie cookie = getAuthCookie(request);
        if (cookie == null) return ResponseEntity.ok().build();
        User user = authService.validateToken(cookie.getValue());
        if (user == null) return ResponseEntity.ok().build();
        return ResponseEntity.ok(new AuthResponse(user.getId(), user.getName(), user.getEmail(),
                user.getPreferredLanguage(), user.getMathLevel(), null));
    }

    private void addCookie(HttpServletResponse response, String value) {
        Cookie cookie = new Cookie("token", value);
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        response.addCookie(cookie);
    }

    private Cookie getAuthCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("token".equals(c.getName())) return c;
            }
        }
        return null;
    }
}
