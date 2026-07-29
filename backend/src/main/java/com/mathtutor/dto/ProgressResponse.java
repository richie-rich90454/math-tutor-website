package com.mathtutor.dto;

public class ProgressResponse {

    private long totalChats;
    private long totalMessages;
    private int streak;

    public long getTotalChats() {
        return totalChats;
    }

    public void setTotalChats(long totalChats) {
        this.totalChats = totalChats;
    }

    public long getTotalMessages() {
        return totalMessages;
    }

    public void setTotalMessages(long totalMessages) {
        this.totalMessages = totalMessages;
    }

    public int getStreak() {
        return streak;
    }

    public void setStreak(int streak) {
        this.streak = streak;
    }
}
