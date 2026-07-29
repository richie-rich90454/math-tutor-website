package com.mathtutor.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class ChatRequest {

    @NotBlank(message = "Message content is required")
    private String message;

    private Long sessionId;

    private String topic;

    private List<ChatMessage> history;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public List<ChatMessage> getHistory() {
        return history;
    }

    public void setHistory(List<ChatMessage> history) {
        this.history = history;
    }
}
