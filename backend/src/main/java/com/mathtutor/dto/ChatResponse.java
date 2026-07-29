package com.mathtutor.dto;

public class ChatResponse {

    private Long sessionId;
    private String reply;

    public ChatResponse() {
    }

    public ChatResponse(Long sessionId, String reply) {
        this.sessionId = sessionId;
        this.reply = reply;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}
