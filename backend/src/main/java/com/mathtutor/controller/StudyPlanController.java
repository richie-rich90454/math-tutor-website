package com.mathtutor.controller;

import com.mathtutor.dto.JsonBody;
import com.mathtutor.dto.JsonLike;
import com.mathtutor.service.SessionService;
import com.mathtutor.service.StudyPlanService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/study-plan")
public class StudyPlanController {

    private static final String SESSION_COOKIE = "session_token";

    private final SessionService sessionService;
    private final StudyPlanService studyPlanService;

    public StudyPlanController(SessionService sessionService, StudyPlanService studyPlanService) {
        this.sessionService = sessionService;
        this.studyPlanService = studyPlanService;
    }

    @GetMapping
    public ResponseEntity<?> get(HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }
        return ResponseEntity.ok(Map.of("plan", studyPlanService.get(session.id()).orElse("")));
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(
            @RequestBody String rawBody,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }
        String language = null;
        try {
            JsonLike body = JsonBody.parse(rawBody);
            language = body.string("language");
        } catch (Exception ignored) {
            // optional body; language falls back to English
        }
        try {
            String plan = studyPlanService.generate(session.id(), language);
            if (plan.isEmpty()) {
                return ResponseEntity.status(502).body(Map.of("error", "Failed to generate study plan"));
            }
            return ResponseEntity.ok(Map.of("plan", plan));
        } catch (java.io.IOException e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to generate study plan"));
        }
    }

    private SessionService.SessionUser requireSession(HttpServletRequest request) {
        return sessionService.getSession(readCookie(request)).orElse(null);
    }

    private ResponseEntity<Map<String, Object>> unauthenticated() {
        return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }

    private String readCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookie.getName().equals(SESSION_COOKIE)) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
