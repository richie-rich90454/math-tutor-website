package com.mathtutor.controller;

import com.mathtutor.domain.User;
import com.mathtutor.dto.ProgressResponse;
import com.mathtutor.exception.ChatException;
import com.mathtutor.repository.ChatSessionRepository;
import com.mathtutor.repository.MessageRepository;
import com.mathtutor.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;
    private final AuthService authService;

    public ProgressController(ChatSessionRepository chatSessionRepository, MessageRepository messageRepository, AuthService authService) {
        this.chatSessionRepository = chatSessionRepository;
        this.messageRepository = messageRepository;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<ProgressResponse> progress(HttpServletRequest request) {
        User user = authenticate(request);
        ProgressResponse resp = new ProgressResponse();
        resp.setTotalChats(chatSessionRepository.countByUserId(user.getId()));
        resp.setTotalMessages(messageRepository.countByChatSessionId(user.getId()));
        resp.setStreak(0);
        return ResponseEntity.ok(resp);
    }

    private User authenticate(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("token".equals(c.getName())) {
                    User user = authService.validateToken(c.getValue());
                    if (user != null) return user;
                }
            }
        }
        throw new ChatException("Not authenticated");
    }
}
