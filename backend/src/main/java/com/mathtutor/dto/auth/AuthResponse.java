package com.mathtutor.dto.auth;

public class AuthResponse {

    private Long userId;
    private String name;
    private String email;
    private String preferredLanguage;
    private String mathLevel;
    private String token;

    public AuthResponse() {
    }

    public AuthResponse(Long userId, String name, String email, String preferredLanguage, String mathLevel, String token) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.preferredLanguage = preferredLanguage;
        this.mathLevel = mathLevel;
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public String getMathLevel() {
        return mathLevel;
    }

    public void setMathLevel(String mathLevel) {
        this.mathLevel = mathLevel;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
