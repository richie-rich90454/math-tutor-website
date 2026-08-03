package com.mathtutor.controller;

import com.mathtutor.dto.CreateChatRequest;
import com.mathtutor.dto.JsonBody;
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
    private final com.mathtutor.service.NotesService notesService;
    private final com.mathtutor.service.ShareService shareService;

    public ChatsController(
            SessionService sessionService,
            ChatRepository chats,
            MessageRepository messages,
            com.mathtutor.service.NotesService notesService,
            com.mathtutor.service.ShareService shareService) {
        this.sessionService = sessionService;
        this.chats = chats;
        this.messages = messages;
        this.notesService = notesService;
        this.shareService = shareService;
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

        CreateChatRequest body = CreateChatRequest.parse(JsonBody.parse(rawBody));
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

        UpdateChatRequest body = UpdateChatRequest.parse(JsonBody.parse(rawBody));
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

    @PostMapping("/{chatId}/messages/{messageId}/pin")
    public ResponseEntity<?> pinMessage(
            @PathVariable String chatId,
            @PathVariable String messageId,
            @RequestBody String rawBody,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }

        Optional<ChatRepository.ChatRecord> existing = chats.findById(chatId);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Chat not found"));
        }
        if (!existing.get().user_id().equals(session.id())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }

        Optional<MessageRepository.MessageRecord> message = messages.findById(messageId);
        if (message.isEmpty() || !message.get().chat_session_id().equals(chatId)) {
            return ResponseEntity.status(404).body(Map.of("error", "Message not found"));
        }

        JsonLike body = JsonBody.parse(rawBody);
        Boolean pinnedValue = body.booleanOrNull("pinned");
        boolean pinned = pinnedValue == null || pinnedValue;
        messages.setPinned(messageId, pinned);
        return ResponseEntity.ok(Map.of("message", messages.findById(messageId).get()));
    }

    @GetMapping("/{chatId}/notes")
    public ResponseEntity<?> getNotes(
            @PathVariable String chatId,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }
        if (!ownsChat(session.id(), chatId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }
        return ResponseEntity.ok(Map.of("note", notesService.get(chatId).orElse("")));
    }

    @PostMapping("/{chatId}/notes")
    public ResponseEntity<?> generateNotes(
            @PathVariable String chatId,
            @RequestBody String rawBody,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }
        if (!ownsChat(session.id(), chatId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }
        String language = null;
        try {
            JsonLike body = JsonBody.parse(rawBody);
            language = body.string("language");
        } catch (Exception ignored) {
            // optional body; language falls back to English
        }
        try {
            String note = notesService.generate(chatId, language);
            if (note.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No messages to summarize"));
            }
            return ResponseEntity.ok(Map.of("note", note));
        } catch (java.io.IOException e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to generate note"));
        }
    }

    @PostMapping("/{chatId}/share")
    public ResponseEntity<?> share(
            @PathVariable String chatId,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }
        if (!ownsChat(session.id(), chatId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }
        String token = shareService.tokenFor(chatId).orElseGet(() -> shareService.create(chatId));
        return ResponseEntity.ok(Map.of("token", token, "url", "/public/chat/" + token));
    }

    @DeleteMapping("/{chatId}/share")
    public ResponseEntity<?> revokeShare(
            @PathVariable String chatId,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }
        if (!ownsChat(session.id(), chatId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }
        shareService.revoke(chatId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/{chatId}/share")
    public ResponseEntity<?> shareStatus(
            @PathVariable String chatId,
            HttpServletRequest request) {
        var session = requireSession(request);
        if (session == null) {
            return unauthenticated();
        }
        if (!ownsChat(session.id(), chatId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not authorized"));
        }
        return ResponseEntity.ok(Map.of("token", shareService.tokenFor(chatId).orElse(null)));
    }

    private boolean ownsChat(String userId, String chatId) {
        Optional<ChatRepository.ChatRecord> existing = chats.findById(chatId);
        return existing.isPresent() && existing.get().user_id().equals(userId);
    }

    private SessionService.SessionUser requireSession(HttpServletRequest request) {
        String token = readCookie(request, SESSION_COOKIE);
        return sessionService.getSession(token).orElse(null);
    }

    private ResponseEntity<Map<String, Object>> unauthenticated() {
        return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }

    private com.mathtutor.dto.JsonLike parseJson(String raw) {
        return JsonBody.parse(raw);
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
