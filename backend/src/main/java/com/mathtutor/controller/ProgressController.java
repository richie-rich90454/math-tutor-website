package com.mathtutor.controller;

import com.mathtutor.service.ProgressService;
import com.mathtutor.service.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private static final String SESSION_COOKIE = "session_token";

    private final SessionService sessionService;
    private final ProgressService progressService;

    public ProgressController(SessionService sessionService, ProgressService progressService) {
        this.sessionService = sessionService;
        this.progressService = progressService;
    }

    @GetMapping
    public ResponseEntity<?> getProgress(HttpServletRequest request) {
        String token = readCookie(request, SESSION_COOKIE);
        var session = sessionService.getSession(token);
        if (session.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        return ResponseEntity.ok(progressService.getProgress(session.get().id()));
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
