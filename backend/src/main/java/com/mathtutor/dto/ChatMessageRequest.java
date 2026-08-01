package com.mathtutor.dto;

import java.util.ArrayList;
import java.util.List;

public record ChatMessageRequest(String message, String chatId, String preferredLanguage) {

    public static ChatMessageRequest parse(JsonLike body) {
        List<Validator.Issue> issues = new ArrayList<>();
        String message = body.string("message");
        String chatId = body.string("chatId");
        String preferredLanguage = body.string("preferredLanguage");

        Validator.requireString(issues, "message", message);
        if (message != null) {
            Validator.requireMin(issues, "message", message, 1);
            Validator.requireMax(issues, "message", message, 4000);
        }
        if (preferredLanguage != null) {
            Validator.requireMax(issues, "preferredLanguage", preferredLanguage, 10);
        }

        if (!issues.isEmpty()) {
            throw new ValidationException(issues);
        }
        return new ChatMessageRequest(message, chatId, preferredLanguage);
    }
}
