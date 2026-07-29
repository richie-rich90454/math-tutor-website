package com.mathtutor.controller;

import com.mathtutor.domain.ChatSession;
import com.mathtutor.domain.Message;
import com.mathtutor.domain.User;
import com.mathtutor.dto.ChatMessage;
import com.mathtutor.dto.ChatSessionResponse;
import com.mathtutor.dto.CreateChatRequest;
import com.mathtutor.dto.UpdateChatRequest;
import com.mathtutor.exception.ChatException;
import com.mathtutor.repository.ChatSessionRepository;
import com.mathtutor.repository.MessageRepository;
import com.mathtutor.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chats")
public class ChatSessionController {

    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;
    private final AuthService authService;

    public ChatSessionController(ChatSessionRepository chatSessionRepository, MessageRepository messageRepository, AuthService authService) {
        this.chatSessionRepository = chatSessionRepository;
        this.messageRepository = messageRepository;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<ChatSessionResponse>> listChats(HttpServletRequest request) {
        User user = authenticate(request);
        List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<ChatSessionResponse> result = sessions.stream().map(this::toSummary).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<ChatSessionResponse> createChat(@RequestBody CreateChatRequest body, HttpServletRequest request) {
        User user = authenticate(request);
        ChatSession session = new ChatSession();
        session.setUser(user);
        session.setTitle(body.getTitle() != null ? body.getTitle() : "New Chat");
        session.setTopic(body.getTopic());
        chatSessionRepository.save(session);
        return ResponseEntity.ok(toSummary(session));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatSessionResponse> getChat(@PathVariable Long id, HttpServletRequest request) {
        User user = authenticate(request);
        ChatSession session = chatSessionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ChatException("Chat not found"));
        ChatSessionResponse resp = toDetail(session);
        return ResponseEntity.ok(resp);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ChatSessionResponse> updateChat(@PathVariable Long id, @RequestBody UpdateChatRequest body, HttpServletRequest request) {
        User user = authenticate(request);
        ChatSession session = chatSessionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ChatException("Chat not found"));
        if (body.getTitle() != null) session.setTitle(body.getTitle());
        if (body.getPreview() != null) session.setPreview(body.getPreview());
        if (body.getTopic() != null) session.setTopic(body.getTopic());
        if (body.getArchived() != null) session.setArchived(body.getArchived());
        if (body.getPinned() != null) session.setPinned(body.getPinned());
        chatSessionRepository.save(session);
        return ResponseEntity.ok(toSummary(session));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChat(@PathVariable Long id, HttpServletRequest request) {
        User user = authenticate(request);
        ChatSession session = chatSessionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ChatException("Chat not found"));
        chatSessionRepository.delete(session);
        return ResponseEntity.ok().build();
    }

    private User authenticate(HttpServletRequest request) {
        Cookie cookie = getAuthCookie(request);
        if (cookie == null) throw new ChatException("Not authenticated");
        User user = authService.validateToken(cookie.getValue());
        if (user == null) throw new ChatException("Not authenticated");
        return user;
    }

    private Cookie getAuthCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("token".equals(c.getName())) return c;
            }
        }
        return null;
    }

    private ChatSessionResponse toSummary(ChatSession s) {
        ChatSessionResponse r = new ChatSessionResponse();
        r.setId(s.getId());
        r.setTitle(s.getTitle());
        r.setPreview(s.getPreview());
        r.setTopic(s.getTopic());
        r.setArchived(s.isArchived());
        r.setPinned(s.isPinned());
        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());
        return r;
    }

    private ChatSessionResponse toDetail(ChatSession s) {
        ChatSessionResponse r = toSummary(s);
        List<Message> msgs = messageRepository.findByChatSessionIdOrderByCreatedAtAsc(s.getId());
        r.setMessages(msgs.stream().map(m -> new ChatMessage(m.getRole().name().toLowerCase(), m.getContent())).collect(Collectors.toList()));
        return r;
    }
}
