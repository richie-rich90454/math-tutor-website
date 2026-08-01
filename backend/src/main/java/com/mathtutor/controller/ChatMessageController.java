package com.mathtutor.controller;

import com.mathtutor.dto.ChatMessageRequest;
import com.mathtutor.dto.JsonBody;
import com.mathtutor.service.AiClient;
import com.mathtutor.service.ChatService;
import com.mathtutor.service.RateLimitService;
import com.mathtutor.service.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

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
    public ResponseEntity<StreamingResponseBody> sendMessage(
            @RequestBody String rawBody,
            HttpServletRequest request) {
        String token = readCookie(request, SESSION_COOKIE);
        var session = sessionService.getSession(token);
        if (session.isEmpty()) {
            return ResponseEntity.status(401)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(out -> out.write(
                            "{\"error\":\"Please sign in to chat\"}".getBytes(StandardCharsets.UTF_8)));
        }

        String ip = clientIp(request);
        RateLimitService.RateLimitResult ipRl =
                rateLimit.check("chat:ip:" + ip, 60, RATE_WINDOW_MS);
        if (!ipRl.allowed()) {
            return ResponseEntity.status(429)
                    .headers(headers -> {
                        headers.setAll(rateLimit.getHeaders(ipRl));
                        headers.set("Retry-After", "60");
                    })
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(out -> out.write(
                            "{\"error\":\"Too many requests. Please wait a moment.\"}"
                                    .getBytes(StandardCharsets.UTF_8)));
        }

        RateLimitService.RateLimitResult userRl =
                rateLimit.check("chat:user:" + session.get().id(), CHAT_RATE_LIMIT, RATE_WINDOW_MS);
        if (!userRl.allowed()) {
            long retryAfter = Math.max(1, (userRl.resetAt() - System.currentTimeMillis()) / 1000);
            return ResponseEntity.status(429)
                    .headers(headers -> {
                        headers.setAll(rateLimit.getHeaders(userRl));
                        headers.set("Retry-After", String.valueOf(retryAfter));
                    })
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(out -> out.write(
                            "{\"error\":\"Too many requests. Please wait a moment.\"}"
                                    .getBytes(StandardCharsets.UTF_8)));
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
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(out -> out.write(
                            ("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}")
                                    .getBytes(StandardCharsets.UTF_8)));
        }

        String activeChatId = setup.activeChatId();
        AiClient.AiStream stream = setup.stream();
        String userId = session.get().id();

        StreamingResponseBody responseBody = outputStream -> streamResponse(
                outputStream, stream, activeChatId, userId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain; charset=utf-8"))
                .header("Cache-Control", "no-cache, no-transform")
                .header("X-Accel-Buffering", "no")
                .header("X-Chat-Id", activeChatId)
                .headers(headers -> headers.setAll(rateLimit.getHeaders(userRl)))
                .body(responseBody);
    }

    private void streamResponse(
            OutputStream outputStream,
            AiClient.AiStream stream,
            String chatId,
            String userId) throws IOException {
        StringBuilder fullResponse = new StringBuilder();
        try (stream) {
            String chunk;
            while ((chunk = stream.next()) != null) {
                fullResponse.append(chunk);
                outputStream.write(chunk.getBytes(StandardCharsets.UTF_8));
                outputStream.flush();
            }
        } finally {
            chatService.saveAssistantMessage(chatId, userId, fullResponse.toString());
        }
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
