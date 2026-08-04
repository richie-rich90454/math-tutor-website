package com.mathtutor.controller;

import com.mathtutor.service.ProblemBank;
import com.mathtutor.service.ProgressService;
import com.mathtutor.service.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private static final String SESSION_COOKIE = "session_token";

    private final SessionService sessionService;
    private final ProgressService progressService;
    private final ProblemBank problemBank;

    public ProgressController(SessionService sessionService, ProgressService progressService, ProblemBank problemBank) {
        this.sessionService = sessionService;
        this.progressService = progressService;
        this.problemBank = problemBank;
    }

    @GetMapping
    public ResponseEntity<?> getProgress(HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }
        Map<String, Object> progress = progressService.getProgress(session.id());
        progress.put("topicAccuracy", progressService.topicAccuracy(session.id()));
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> suggestions(
            @RequestParam(required = false) String language,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }
        String lang = language == null || language.isBlank() ? "en" : language;
        List<Map<String, Object>> weak = progressService.weakTopics(session.id());
        List<Map<String, Object>> suggestions = new ArrayList<>();
        for (Map<String, Object> topic : weak) {
            double accuracy = ((Number) topic.get("accuracy")).doubleValue();
            if (accuracy >= 0.60) {
                continue;
            }
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("topic", topic.get("topic"));
            entry.put("accuracy", accuracy);
            entry.put("correct", topic.get("correct"));
            entry.put("total", topic.get("total"));
            List<Map<String, Object>> problems = new ArrayList<>();
            for (ProblemBank.Problem p : problemBank.list((String) topic.get("topic"), lang, null, 5)) {
                problems.add(problemBank.toJson(p));
            }
            entry.put("problems", problems);
            suggestions.add(entry);
        }
        return ResponseEntity.ok(Map.of("weakTopics", suggestions));
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
