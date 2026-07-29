package com.mathtutor.controller;

import com.mathtutor.domain.ChatSession;
import com.mathtutor.domain.Message;
import com.mathtutor.domain.User;
import com.mathtutor.dto.ChatRequest;
import com.mathtutor.dto.ChatResponse;
import com.mathtutor.repository.ChatSessionRepository;
import com.mathtutor.repository.MessageRepository;
import com.mathtutor.service.AuthService;
import com.mathtutor.service.ChatService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private final AuthService authService;
    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;

    public ChatController(ChatService chatService, AuthService authService,
                          ChatSessionRepository chatSessionRepository, MessageRepository messageRepository) {
        this.chatService = chatService;
        this.authService = authService;
        this.chatSessionRepository = chatSessionRepository;
        this.messageRepository = messageRepository;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request, HttpServletRequest httpReq) {
        User user = tryAuthenticate(httpReq);
        ChatResponse response = chatService.sendMessage(request);
        if (user != null) {
            ChatSession session = getOrCreateSession(user, request);
            saveMessage(session, Message.Role.USER, request.getMessage());
            saveMessage(session, Message.Role.ASSISTANT, response.getReply());
            response.setSessionId(session.getId());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/message")
    public ResponseEntity<ChatResponse> chatMessage(@Valid @RequestBody ChatRequest request, HttpServletRequest httpReq) {
        return chat(request, httpReq);
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseBodyEmitter chatStream(@Valid @RequestBody ChatRequest request, HttpServletRequest httpReq) {
        User user = tryAuthenticate(httpReq);
        ChatSession session = user != null ? getOrCreateSession(user, request) : null;
        if (session != null) {
            saveMessage(session, Message.Role.USER, request.getMessage());
        }

        ResponseBodyEmitter emitter = new ResponseBodyEmitter(0L);
        StringBuilder collector = new StringBuilder();
        chatService.sendMessageStream(request,
                chunk -> {
                    collector.append(chunk);
                    try {
                        emitter.send("data: " + chunk + "\n\n");
                    } catch (IOException e) {
                        emitter.completeWithError(e);
                    }
                },
                () -> {
                    if (session != null) {
                        saveMessage(session, Message.Role.ASSISTANT, collector.toString());
                    }
                    emitter.complete();
                },
                emitter::completeWithError);
        return emitter;
    }

    private User tryAuthenticate(HttpServletRequest request) {
        Cookie cookie = getAuthCookie(request);
        if (cookie == null) return null;
        return authService.validateToken(cookie.getValue());
    }

    private ChatSession getOrCreateSession(User user, ChatRequest request) {
        if (request.getSessionId() != null) {
            return chatSessionRepository.findByIdAndUserId(request.getSessionId(), user.getId())
                    .orElseGet(() -> createSession(user, request));
        }
        return createSession(user, request);
    }

    private ChatSession createSession(User user, ChatRequest request) {
        ChatSession s = new ChatSession();
        s.setUser(user);
        s.setTitle(request.getMessage().length() > 50 ? request.getMessage().substring(0, 50) + "..." : request.getMessage());
        s.setTopic(request.getTopic());
        return chatSessionRepository.save(s);
    }

    private void saveMessage(ChatSession session, Message.Role role, String content) {
        if (content == null || content.isEmpty()) return;
        Message msg = new Message();
        msg.setChatSession(session);
        msg.setRole(role);
        msg.setContent(content);
        messageRepository.save(msg);
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
}
