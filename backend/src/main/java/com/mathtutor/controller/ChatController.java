package com.mathtutor.controller;

import com.mathtutor.dto.ChatRequest;
import com.mathtutor.dto.ChatResponse;
import com.mathtutor.service.ChatService;
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

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        log.debug("Received chat request: {}", request.getMessage());
        ChatResponse response = chatService.sendMessage(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseBodyEmitter chatStream(@Valid @RequestBody ChatRequest request) {
        ResponseBodyEmitter emitter = new ResponseBodyEmitter(0L);
        chatService.sendMessageStream(request,
                chunk -> {
                    try {
                        emitter.send("data: " + chunk + "\n\n");
                    } catch (IOException e) {
                        emitter.completeWithError(e);
                    }
                },
                emitter::complete,
                emitter::completeWithError);
        return emitter;
    }
}
