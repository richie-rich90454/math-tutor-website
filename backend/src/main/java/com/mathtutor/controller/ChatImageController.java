package com.mathtutor.controller;

import com.mathtutor.config.AppProperties;
import com.mathtutor.dto.ChatImageRequest;
import com.mathtutor.dto.JsonBody;
import com.mathtutor.service.AiClient;
import com.mathtutor.service.QuotaService;
import com.mathtutor.service.RateLimitService;
import com.mathtutor.service.SessionService;
import com.mathtutor.service.StreamLimiter;
import com.mathtutor.service.VisionChatService;
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

@RestController
@RequestMapping("/api/chat")
public class ChatImageController {

    private static final String SESSION_COOKIE = "session_token";

    private final SessionService sessionService;
    private final RateLimitService rateLimit;
    private final VisionChatService visionChatService;
    private final AppProperties props;
    private final StreamLimiter streamLimiter;
    private final QuotaService quotaService;

    public ChatImageController(
            SessionService sessionService,
            RateLimitService rateLimit,
            VisionChatService visionChatService,
            AppProperties props,
            StreamLimiter streamLimiter,
            QuotaService quotaService) {
        this.sessionService = sessionService;
        this.rateLimit = rateLimit;
        this.visionChatService = visionChatService;
        this.props = props;
        this.streamLimiter = streamLimiter;
        this.quotaService = quotaService;
    }

    @PostMapping(value = "/image", produces = MediaType.TEXT_PLAIN_VALUE)
    public void analyzeImage(
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

        RateLimitService.RateLimitResult rl = rateLimit.check("image:" + ip, 10, 60 * 1000);
        if (!rl.allowed()) {
            response.setHeader("Retry-After", "60");
            writeJson(response, 429, "{\"error\":\"Too many requests. Please wait a moment.\"}");
            return;
        }

        if (props.ai().apiKey() == null || props.ai().apiKey().isBlank()) {
            writeJson(response, 500, "{\"error\":\"Vision API not configured\"}");
            return;
        }

        ChatImageRequest body = ChatImageRequest.parse(JsonBody.parse(rawBody));

        if (!streamLimiter.tryAcquire()) {
            response.setStatus(503);
            response.setContentType("application/json");
            response.getOutputStream().write(
                    "{\"error\":\"We are busy right now. Please try again shortly.\"}"
                            .getBytes(StandardCharsets.UTF_8));
            return;
        }

        VisionChatService.VisionStreamSetup setup;
        try {
            setup = visionChatService.prepareVisionStream(
                    session.get().id(),
                    body.image(),
                    body.message(),
                    body.chatId());
        } catch (com.mathtutor.web.ForbiddenException e) {
            writeJson(response, 403, "{\"error\":\"Not authorized to access this chat\"}");
            return;
        } catch (IOException e) {
            org.slf4j.LoggerFactory.getLogger(ChatImageController.class)
                    .error("Failed to prepare vision stream", e);
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
                    break;
                }
            }
        } finally {
            streamLimiter.release();
            visionChatService.saveAssistantMessage(activeChatId, userId, fullResponse.toString(), ip, stream.usage());
        }
    }

    private void writeJson(HttpServletResponse response, int status, String json) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getOutputStream().write(json.getBytes(StandardCharsets.UTF_8));
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

    private static long secondsUntilMidnight() {
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now();
        java.time.ZonedDateTime midnight = now.toLocalDate().plusDays(1).atStartOfDay(now.getZone());
        return Math.max(1, java.time.Duration.between(now, midnight).getSeconds());
    }
}
