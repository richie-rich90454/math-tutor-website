package com.mathtutor.dto;

import java.util.ArrayList;
import java.util.List;

public record ChatImageRequest(
        String image,
        String mimeType,
        String message,
        String preferredLanguage,
        String chatId) {

    public static ChatImageRequest parse(JsonLike body) {
        List<Validator.Issue> issues = new ArrayList<>();
        String image = body.string("image");
        String mimeType = body.string("mimeType");
        String message = body.string("message");
        String preferredLanguage = body.string("preferredLanguage");
        String chatId = body.string("chatId");

        Validator.requireString(issues, "image", image);
        if (image != null) {
            Validator.requireMin(issues, "image", image, 1);
        }
        Validator.requireString(issues, "mimeType", mimeType);
        if (mimeType != null) {
            Validator.requireMin(issues, "mimeType", mimeType, 1);
        }
        if (message != null) {
            Validator.requireMax(issues, "message", message, 4000);
        }
        if (preferredLanguage != null) {
            Validator.requireMax(issues, "preferredLanguage", preferredLanguage, 10);
        }

        if (!issues.isEmpty()) {
            throw new ValidationException(issues);
        }
        return new ChatImageRequest(image, mimeType, message, preferredLanguage, chatId);
    }
}
