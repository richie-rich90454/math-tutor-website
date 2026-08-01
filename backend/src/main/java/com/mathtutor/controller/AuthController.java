package com.mathtutor.controller;

import com.mathtutor.dto.JsonBody;
import com.mathtutor.dto.LoginRequest;
import com.mathtutor.dto.SignupRequest;
import com.mathtutor.service.AuthService;
import com.mathtutor.service.RateLimitService;
import com.mathtutor.service.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String SESSION_COOKIE = "session_token";

    private final AuthService authService;
    private final SessionService sessionService;
    private final RateLimitService rateLimit;

    public AuthController(
            AuthService authService,
            SessionService sessionService,
            RateLimitService rateLimit) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.rateLimit = rateLimit;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(
            @RequestBody String rawBody,
            HttpServletRequest request,
            HttpServletResponse response) {
        String ip = clientIp(request);
        RateLimitService.RateLimitResult rl = rateLimit.check("signup:" + ip, 5, 60_000);
        if (!rl.allowed()) {
            return tooManyRequests(rl);
        }

        SignupRequest body = SignupRequest.parse(JsonBody.parse(rawBody));

        AuthService.AuthResult result;
        try {
            result = authService.signup(body.email(), body.name(), body.password());
        } catch (AuthService.EmailExistsException e) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "An account with this email already exists"));
        }

        response.addHeader(HttpHeaders.SET_COOKIE,
                sessionCookie(result.token(), false).toString());

        return ResponseEntity.status(201).body(Map.of("user", userPayload(result)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody String rawBody,
            HttpServletRequest request,
            HttpServletResponse response) {
        String ip = clientIp(request);
        RateLimitService.RateLimitResult rl = rateLimit.check("login:" + ip, 10, 60_000);
        if (!rl.allowed()) {
            return tooManyRequests(rl);
        }

        LoginRequest body = LoginRequest.parse(JsonBody.parse(rawBody));

        boolean remember = body.remember() != null && body.remember();
        var result = authService.login(body.email(), body.password(), remember);
        if (result.isEmpty()) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid email or password"));
        }

        AuthService.AuthResult auth = result.get();
        response.addHeader(HttpHeaders.SET_COOKIE,
                sessionCookie(auth.token(), remember).toString());

        return ResponseEntity.ok(Map.of("user", userPayload(auth)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        String token = readCookie(request, SESSION_COOKIE);
        if (token != null) {
            authService.logout(token);
        }
        ResponseCookie clear = ResponseCookie.from(SESSION_COOKIE, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clear.toString());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        String token = readCookie(request, SESSION_COOKIE);
        var session = sessionService.getSession(token);
        if (session.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of("user", session.get()));
    }

    private Map<String, Object> userPayload(AuthService.AuthResult result) {
        Map<String, Object> user = new LinkedHashMap<>();
        user.put("id", result.user().id());
        user.put("email", result.user().email());
        user.put("name", result.user().name());
        user.put("preferred_language", result.user().preferred_language());
        user.put("math_level", result.user().math_level());
        return user;
    }

    private ResponseCookie sessionCookie(String token, boolean remember) {
        long maxAge = remember ? 2592000 : 86400;
        return ResponseCookie.from(SESSION_COOKIE, token)
                .httpOnly(true)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .secure(com.mathtutor.web.Env.isProduction())
                .build();
    }

    private ResponseEntity<Map<String, Object>> tooManyRequests(RateLimitService.RateLimitResult rl) {
        return ResponseEntity.status(429)
                .headers(headers -> headers.setAll(rateLimit.getHeaders(rl)))
                .header("Retry-After", "60")
                .body(Map.of("error", "Too many requests. Please wait a moment."));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("x-forwarded-for");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded;
        }
        String realIp = request.getHeader("x-real-ip");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return "unknown";
    }

    private String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookie.getName().equals(name)) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
