package com.mathtutor.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "usage_logs")
public class UsageLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_session_id")
    private ChatSession chatSession;

    @Column(nullable = false)
    private int requestTokens;

    @Column(nullable = false)
    private int responseTokens;

    @Column(nullable = false)
    private String model;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ChatSession getChatSession() {
        return chatSession;
    }

    public void setChatSession(ChatSession chatSession) {
        this.chatSession = chatSession;
    }

    public int getRequestTokens() {
        return requestTokens;
    }

    public void setRequestTokens(int requestTokens) {
        this.requestTokens = requestTokens;
    }

    public int getResponseTokens() {
        return responseTokens;
    }

    public void setResponseTokens(int responseTokens) {
        this.responseTokens = responseTokens;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
