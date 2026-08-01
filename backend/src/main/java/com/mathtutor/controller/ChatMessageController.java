package com.mathtutor.controller;

import com.mathtutor.dto.ChatMessageRequest;
import com.mathtutor.dto.JsonBody;
import com.mathtutor.service.AiClient;
import com.mathtutor.service.ChatService;
import com.mathtutor.service.RateLimitService;
import com.mathtutor.service.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatMessageController {

    private static final String SESSION_COOKIE = "session_token";
    private static final int CHAT_RATE_LIMIT = 30;
    private static final long RATE_WINDOW_MS = 60 * 1000;

    private final SessionService sessionService;
    private final RateLimitService rateLimit;
    private final ChatService chatService;

    public ChatMessageController(
            SessionService sessionService,
            RateLimitService rateLimit,
            ChatService chatService) {
        this.sessionService = sessionService;
        this.rateLimit = rateLimit;
        this.chatService = chatService;
    }

    @PostMapping(value = "/message", produces = MediaType.TEXT_PLAIN_VALUE)
    public void sendMessage(
            @RequestBody String rawBody,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        String token = resolveToken(request);
        var session = sessionService.getSession(token);
        if (session.isEmpty()) {
            writeJson(response, 401, "{\"error\":\"Please sign in to chat\"}");
            return;
        }

        String ip = clientIp(request);
        RateLimitService.RateLimitResult ipRl =
                rateLimit.check("chat:ip:" + ip, 60, RATE_WINDOW_MS);
        if (!ipRl.allowed()) {
            setRateLimitHeaders(response, ipRl);
            response.setHeader("Retry-After", "60");
            writeJson(response, 429, "{\"error\":\"Too many requests. Please wait a moment.\"}");
            return;
        }

        RateLimitService.RateLimitResult userRl =
                rateLimit.check("chat:user:" + session.get().id(), CHAT_RATE_LIMIT, RATE_WINDOW_MS);
        if (!userRl.allowed()) {
            long retryAfter = Math.max(1, (userRl.resetAt() - System.currentTimeMillis()) / 1000);
            setRateLimitHeaders(response, userRl);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            writeJson(response, 429, "{\"error\":\"Too many requests. Please wait a moment.\"}");
            return;
        }

        ChatMessageRequest body = ChatMessageRequest.parse(JsonBody.parse(rawBody));
        String sanitizedMessage = body.message().trim();

        ChatService.StreamSetup setup;
        try {
            setup = chatService.prepareMessageStream(
                    session.get().id(),
                    sanitizedMessage,
                    body.chatId(),
                    body.preferredLanguage());
        } catch (IOException e) {
            writeJson(response, 500,
                    "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            return;
        }

        String activeChatId = setup.activeChatId();
        AiClient.AiStream stream = setup.stream();
        String userId = session.get().id();

        response.setStatus(200);
        response.setContentType("text/plain; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("X-Chat-Id", activeChatId);
        setRateLimitHeaders(response, userRl);

        OutputStream outputStream = response.getOutputStream();
        StringBuilder fullResponse = new StringBuilder();
        try (stream) {
            String chunk;
            while ((chunk = stream.next()) != null) {
                fullResponse.append(chunk);
                outputStream.write(chunk.getBytes(StandardCharsets.UTF_8));
                outputStream.flush();
            }
        } finally {
            chatService.saveAssistantMessage(chatId(activeChatId), userId, fullResponse.toString());
        }
    }

    private void writeJson(HttpServletResponse response, int status, String json) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getOutputStream().write(json.getBytes(StandardCharsets.UTF_8));
    }

    private void setRateLimitHeaders(HttpServletResponse response, RateLimitService.RateLimitResult result) {
        int limit = result.remaining() + (result.allowed() ? 1 : 0);
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(result.resetAt()));
    }

    private String chatId(String activeChatId) {
        return activeChatId;
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

    private String resolveToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return auth.substring(7);
        }
        return readCookie(request, SESSION_COOKIE);
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
