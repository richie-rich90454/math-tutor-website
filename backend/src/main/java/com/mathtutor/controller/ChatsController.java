package com.mathtutor.controller;

import com.mathtutor.dto.CreateChatRequest;
import com.mathtutor.dto.JsonLike;
import com.mathtutor.dto.UpdateChatRequest;
import com.mathtutor.repo.ChatRepository;
import com.mathtutor.repo.MessageRepository;
import com.mathtutor.service.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chats")
public class ChatsController {

    private static final String SESSION_COOKIE = "session_token";

    private final SessionService sessionService;
    private final ChatRepository chats;
    private final MessageRepository messages;

    public ChatsController(
            SessionService sessionService,
            ChatRepository chats,
            MessageRepository messages) {
        this.sessionService = sessionService;
        this.chats = chats;
        this.messages = messages;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String q,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }

        List<ChatRepository.ChatRecord> records =
                q == null || q.isBlank()
                        ? chats.findByUser(session.id())
                        : chats.search(session.id(), q);

        List<Map<String, Object>> chatList = new ArrayList<>();
        for (ChatRepository.ChatRecord chat : records) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", chat.id());
            item.put("title", chat.title());
            item.put("timestamp", chat.created_at());
            item.put("preview", chat.preview() == null ? chat.title() : chat.preview());
            item.put("topic", chat.topic());
            item.put("isPinned", chat.is_pinned() == 1);
            item.put("messages", List.of());
            chatList.add(item);
        }
        return ResponseEntity.ok(Map.of("chats", chatList));
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody String rawBody,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }

        CreateChatRequest body = CreateChatRequest.parse(JsonLike.of(parseJson(rawBody)));
        ChatRepository.ChatRecord chat = chats.createChat(
                session.id(), body.title(), body.preview());
        return ResponseEntity.status(201).body(Map.of("chat", chat));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(
            @PathVariable String id,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }

        Optional<ChatRepository.ChatRecord> chat = chats.findById(id);
        if (chat.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Chat not found"));
        }
        if (!chat.get().user_id().equals(session.id())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        List<MessageRepository.MessageRecord> msgs = messages.findByChat(id);
        return ResponseEntity.ok(Map.of("chat", chat.get(), "messages", msgs));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable String id,
            @RequestBody String rawBody,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }

        Optional<ChatRepository.ChatRecord> existing = chats.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Chat not found"));
        }
        if (!existing.get().user_id().equals(session.id())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        UpdateChatRequest body = UpdateChatRequest.parse(JsonLike.of(parseJson(rawBody)));
        for (Map.Entry<String, Object> field : body.changedFields().entrySet()) {
            chats.updateChat(id, field.getKey(), field.getValue());
        }

        return ResponseEntity.ok(Map.of("chat", chats.findById(id).get()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable String id,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }

        Optional<ChatRepository.ChatRecord> existing = chats.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Chat not found"));
        }
        if (!existing.get().user_id().equals(session.id())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        chats.delete(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private SessionService.SessionUser requireSession(HttpServletRequest request) {
        String token = readCookie(request, SESSION_COOKIE);
        return sessionService.getSession(token).orElse(null);
    }

    private ResponseEntity<Map<String, Object>> unauthenticated() {
        return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }

    private com.fasterxml.jackson.databind.JsonNode parseJson(String raw) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readTree(raw);
        } catch (Exception e) {
            throw new org.springframework.http.converter.HttpMessageNotReadableException(
                    "Invalid JSON body");
        }
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
