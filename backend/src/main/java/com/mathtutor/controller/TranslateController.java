package com.mathtutor.controller;

import com.mathtutor.dto.JsonBody;
import com.mathtutor.dto.JsonLike;
import com.mathtutor.service.AiClient;
import com.mathtutor.service.ContextBuilder;
import com.mathtutor.service.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class TranslateController {

    private static final String SESSION_COOKIE = "session_token";

    private final SessionService sessionService;
    private final AiClient aiClient;
    private final ContextBuilder contextBuilder;

    public TranslateController(SessionService sessionService, AiClient aiClient, ContextBuilder contextBuilder) {
        this.sessionService = sessionService;
        this.aiClient = aiClient;
        this.contextBuilder = contextBuilder;
    }

    // C15 bilingual display: one on-demand AI call translates a message into
    // Mandarin. Kept display-side so no extra tokens are spent unless the
    // student actually toggles it open.
    @PostMapping("/translate")
    public ResponseEntity<?> translate(@RequestBody String rawBody, HttpServletRequest request) {
        String token = readToken(request);
        var session = sessionService.getSession(token);
        if (session.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        JsonLike body = JsonBody.parse(rawBody);
        String message = body.string("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message is required"));
        }
        List<ContextBuilder.ContextMessage> context = new ArrayList<>();
        context.add(new ContextBuilder.ContextMessage("system",
                "Translate the following math explanation into Mandarin (Simplified Chinese). "
                        + "Keep all LaTeX and markdown unchanged. Output only the translation."));
        context.add(new ContextBuilder.ContextMessage("user", message));
        try {
            String translation = aiClient.complete(context, 1000).trim();
            if (translation.isEmpty()) {
                return ResponseEntity.status(502).body(Map.of("error", "Translation failed"));
            }
            return ResponseEntity.ok(Map.of("translation", translation));
        } catch (java.io.IOException e) {
            return ResponseEntity.status(502).body(Map.of("error", "Translation failed"));
        }
    }

    private String readToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
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
