package com.mathtutor.controller;

import com.mathtutor.repo.UsageRepository;
import com.mathtutor.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usage")
public class UsageController {

    // ponytail: hardcoded cost constants (USD per 1M tokens); move to config when needed.
    private static final double COST_PER_1M_INPUT = 0.27;
    private static final double COST_PER_1M_OUTPUT = 1.10;

    private final SessionService sessionService;
    private final UsageRepository usage;

    public UsageController(SessionService sessionService, UsageRepository usage) {
        this.sessionService = sessionService;
        this.usage = usage;
    }

    @GetMapping
    public ResponseEntity<?> usage(
            @RequestParam(required = false) String chatId,
            HttpServletRequest request) {
        var session = sessionService.getSession(readToken(request));
        if (session.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = session.get().id();

        UsageRepository.TokenSum today = usage.sumByTypeSince(userId, "datetime('now', '-1 day')");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("today", tokenPayload(today));
        if (chatId != null && !chatId.isBlank()) {
            body.put("chat", tokenPayload(usage.sumByTypeForChat(userId, chatId)));
        }
        body.put("series", usage.totalsByDay(userId, 7).stream()
                .map(d -> Map.of("day", d.day(), "tokens", d.tokens()))
                .toList());
        body.put("cacheHits", usage.globalCacheHits());
        return ResponseEntity.ok(body);
    }

    private Map<String, Object> tokenPayload(UsageRepository.TokenSum sum) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("requestTokens", sum.request());
        payload.put("responseTokens", sum.response());
        payload.put("total", sum.total());
        payload.put("estCostUsd", round3(
                sum.request() * COST_PER_1M_INPUT / 1_000_000.0
                        + sum.response() * COST_PER_1M_OUTPUT / 1_000_000.0));
        return payload;
    }

    private static double round3(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }

    private String readToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
        jakarta.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (jakarta.servlet.http.Cookie cookie : cookies) {
            if (cookie.getName().equals("session_token")) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
