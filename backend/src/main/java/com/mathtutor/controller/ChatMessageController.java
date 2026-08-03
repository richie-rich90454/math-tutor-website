package com.mathtutor.controller;

import com.mathtutor.dto.ChatMessageRequest;
import com.mathtutor.dto.JsonBody;
import com.mathtutor.service.AiClient;
import com.mathtutor.service.ChatService;
import com.mathtutor.service.QuotaService;
import com.mathtutor.service.RateLimitService;
import com.mathtutor.service.SessionService;
import com.mathtutor.service.StreamLimiter;
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
    private final StreamLimiter streamLimiter;
    private final QuotaService quotaService;

    public ChatMessageController(
            SessionService sessionService,
            RateLimitService rateLimit,
            ChatService chatService,
            StreamLimiter streamLimiter,
            QuotaService quotaService) {
        this.sessionService = sessionService;
        this.rateLimit = rateLimit;
        this.chatService = chatService;
        this.streamLimiter = streamLimiter;
        this.quotaService = quotaService;
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

        String ip = com.mathtutor.web.RequestSecurity.clientIp(request);
        QuotaService.QuotaResult quota = quotaService.check(session.get().id(), ip, session.get().guest());
        quotaService.setHeaders(response, quota);
        if (quota.hardExceeded()) {
            response.setHeader("Retry-After", String.valueOf(secondsUntilMidnight()));
            writeJson(response, 429, "{\"error\":\"Daily token limit reached. Try again tomorrow.\"}");
            return;
        }

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

        if (!streamLimiter.tryAcquire()) {
            response.setStatus(503);
            response.setContentType("application/json");
            response.getOutputStream().write(
                    "{\"error\":\"We are busy right now. Please try again shortly.\"}"
                            .getBytes(StandardCharsets.UTF_8));
            return;
        }

        ChatService.StreamSetup setup;
        try {
            setup = chatService.prepareMessageStream(
                    session.get().id(),
                    sanitizedMessage,
                    body.chatId(),
                    body.preferredLanguage());
        } catch (com.mathtutor.web.ForbiddenException e) {
            writeJson(response, 403, "{\"error\":\"Not authorized to access this chat\"}");
            return;
        } catch (IOException e) {
            org.slf4j.LoggerFactory.getLogger(ChatMessageController.class)
                    .error("Failed to prepare message stream", e);
            writeJson(response, 500, "{\"error\":\"Failed to prepare response\"}");
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
        response.setHeader("X-Cache", setup.cacheHit() ? "hit" : "miss");
        setRateLimitHeaders(response, userRl);

        OutputStream outputStream = response.getOutputStream();
        StringBuilder fullResponse = new StringBuilder();
        try (stream) {
            String chunk;
            while ((chunk = stream.next()) != null) {
                fullResponse.append(chunk);
                try {
                    outputStream.write(chunk.getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                } catch (IOException e) {
                    // Client disconnected: stop consuming so the upstream stream is
                    // closed (aborting the provider call) instead of paying for the
                    // rest of the generation.
                    break;
                }
            }
        } finally {
            streamLimiter.release();
            chatService.saveAssistantMessage(
                    chatId(activeChatId),
                    userId,
                    fullResponse.toString(),
                    setup.checkMode() ? null : sanitizedMessage,
                    body.preferredLanguage(),
                    stream.usage(),
                    ip,
                    setup.cacheHit());
        }
    }

    private void writeJson(HttpServletResponse response, int status, String json) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getOutputStream().write(json.getBytes(StandardCharsets.UTF_8));
    }

    private void setRateLimitHeaders(HttpServletResponse response, RateLimitService.RateLimitResult result) {
        response.setHeader("X-RateLimit-Limit", String.valueOf(result.limit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining()));
        response.setHeader("X-RateLimit-Reset", String.valueOf(result.resetAt()));
    }

    private String chatId(String activeChatId) {
        return activeChatId;
    }

    private static long secondsUntilMidnight() {
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now();
        java.time.ZonedDateTime midnight = now.toLocalDate().plusDays(1).atStartOfDay(now.getZone());
        return Math.max(1, java.time.Duration.between(now, midnight).getSeconds());
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
}
