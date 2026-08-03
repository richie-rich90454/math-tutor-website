package com.mathtutor.controller;

import com.mathtutor.repo.ChatRepository;
import com.mathtutor.repo.MessageRepository;
import com.mathtutor.service.ShareService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/public/chat")
public class PublicChatController {

    private final ShareService shareService;
    private final ChatRepository chats;
    private final MessageRepository messages;

    public PublicChatController(ShareService shareService, ChatRepository chats, MessageRepository messages) {
        this.shareService = shareService;
        this.chats = chats;
        this.messages = messages;
    }

    // D19 read-only public view: token holders see only the title + messages.
    @GetMapping("/{token}")
    public ResponseEntity<?> view(@PathVariable String token) {
        Optional<ShareService.SharedChat> shared = shareService.findByToken(token);
        if (shared.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Shared chat not found"));
        }
        Optional<ChatRepository.ChatRecord> chat = chats.findById(shared.get().chat_session_id());
        if (chat.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Shared chat not found"));
        }
        List<Map<String, Object>> msgs = new ArrayList<>();
        for (MessageRepository.MessageRecord msg : messages.findByChat(chat.get().id())) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("role", msg.role());
            m.put("content", msg.content());
            m.put("created_at", msg.created_at());
            msgs.add(m);
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("title", chat.get().title());
        body.put("messages", msgs);
        return ResponseEntity.ok(body);
    }
}
