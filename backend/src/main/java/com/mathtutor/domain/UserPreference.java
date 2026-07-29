package com.mathtutor.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_preferences")
public class UserPreference {

    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String theme;

    @Column(nullable = false)
    private String fontSize;

    @Column(nullable = false)
    private String messageDensity;

    @Column(nullable = false)
    private boolean soundEnabled;

    @Column(nullable = false)
    private boolean keyboardShortcutsEnabled;

    @Column(nullable = false)
    private boolean animationsEnabled;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getFontSize() {
        return fontSize;
    }

    public void setFontSize(String fontSize) {
        this.fontSize = fontSize;
    }

    public String getMessageDensity() {
        return messageDensity;
    }

    public void setMessageDensity(String messageDensity) {
        this.messageDensity = messageDensity;
    }

    public boolean isSoundEnabled() {
        return soundEnabled;
    }

    public void setSoundEnabled(boolean soundEnabled) {
        this.soundEnabled = soundEnabled;
    }

    public boolean isKeyboardShortcutsEnabled() {
        return keyboardShortcutsEnabled;
    }

    public void setKeyboardShortcutsEnabled(boolean keyboardShortcutsEnabled) {
        this.keyboardShortcutsEnabled = keyboardShortcutsEnabled;
    }

    public boolean isAnimationsEnabled() {
        return animationsEnabled;
    }

    public void setAnimationsEnabled(boolean animationsEnabled) {
        this.animationsEnabled = animationsEnabled;
    }
}
