package com.mathtutor.controller;

import com.mathtutor.config.AppProperties;
import com.mathtutor.dto.ChatImageRequest;
import com.mathtutor.dto.JsonBody;
import com.mathtutor.service.AiClient;
import com.mathtutor.service.RateLimitService;
import com.mathtutor.service.SessionService;
import com.mathtutor.service.VisionChatService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
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
public class ChatImageController {

    private static final String SESSION_COOKIE = "session_token";

    private final SessionService sessionService;
    private final RateLimitService rateLimit;
    private final VisionChatService visionChatService;
    private final AppProperties props;

    public ChatImageController(
            SessionService sessionService,
            RateLimitService rateLimit,
            VisionChatService visionChatService,
            AppProperties props) {
        this.sessionService = sessionService;
        this.rateLimit = rateLimit;
        this.visionChatService = visionChatService;
        this.props = props;
    }

    @PostMapping(value = "/image", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<StreamingResponseBody> analyzeImage(
            @RequestBody String rawBody,
            HttpServletRequest request) {
        String token = resolveToken(request);
        var session = sessionService.getSession(token);
        if (session.isEmpty()) {
            return ResponseEntity.status(401)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(out -> out.write(
                            "{\"error\":\"Please sign in to chat\"}".getBytes(StandardCharsets.UTF_8)));
        }

        String ip = clientIp(request);
        RateLimitService.RateLimitResult rl = rateLimit.check("image:" + ip, 10, 60 * 1000);
        if (!rl.allowed()) {
            return ResponseEntity.status(429)
                    .header("Retry-After", "60")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(out -> out.write(
                            "{\"error\":\"Too many requests. Please wait a moment.\"}"
                                    .getBytes(StandardCharsets.UTF_8)));
        }

        if (props.ai().apiKey() == null || props.ai().apiKey().isBlank()) {
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(out -> out.write(
                            "{\"error\":\"Vision API not configured\"}".getBytes(StandardCharsets.UTF_8)));
        }

        ChatImageRequest body = ChatImageRequest.parse(JsonBody.parse(rawBody));

        VisionChatService.VisionStreamSetup setup;
        try {
            setup = visionChatService.prepareVisionStream(
                    session.get().id(),
                    body.image(),
                    body.message(),
                    body.chatId());
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

        StreamingResponseBody responseBody = outputStream -> {
            StringBuilder fullResponse = new StringBuilder();
            try (stream) {
                String chunk;
                while ((chunk = stream.next()) != null) {
                    fullResponse.append(chunk);
                    outputStream.write(chunk.getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                }
            } finally {
                visionChatService.saveAssistantMessage(activeChatId, userId, fullResponse.toString());
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain; charset=utf-8"))
                .header("Cache-Control", "no-cache, no-transform")
                .header("X-Accel-Buffering", "no")
                .header("X-Chat-Id", activeChatId)
                .body(responseBody);
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
