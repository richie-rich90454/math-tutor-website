package com.mathtutor.dto;

import java.util.ArrayList;
import java.util.List;

public record CreateChatRequest(String title, String preview) {

    public static CreateChatRequest parse(JsonLike body) {
        List<Validator.Issue> issues = new ArrayList<>();
        String title = body.string("title");
        String preview = body.string("preview");

        Validator.requireString(issues, "title", title);
        if (title != null) {
            Validator.requireMin(issues, "title", title, 1);
            Validator.requireMax(issues, "title", title, 200);
        }
        if (preview != null) {
            Validator.requireMax(issues, "preview", preview, 500);
        }

        if (!issues.isEmpty()) {
            throw new ValidationException(issues);
        }
        return new CreateChatRequest(title, preview);
    }
}
