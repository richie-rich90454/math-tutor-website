package com.mathtutor.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public record UpdateChatRequest(
        String title,
        String preview,
        String topic) {

    public static UpdateChatRequest parse(JsonLike body) {
        List<Validator.Issue> issues = new ArrayList<>();
        String title = body.string("title");
        String preview = body.string("preview");
        String topic = body.string("topic");

        if (title != null) {
            Validator.requireMax(issues, "title", title, 200);
        }
        if (preview != null) {
            Validator.requireMax(issues, "preview", preview, 500);
        }
        if (topic != null) {
            Validator.requireMax(issues, "topic", topic, 100);
        }

        if (!issues.isEmpty()) {
            throw new ValidationException(issues);
        }
        return new UpdateChatRequest(title, preview, topic);
    }

    public Map<String, Object> changedFields() {
        Map<String, Object> fields = new HashMap<>();
        if (title != null) {
            fields.put("title", title);
        }
        if (preview != null) {
            fields.put("preview", preview);
        }
        if (topic != null) {
            fields.put("topic", topic);
        }
        return fields;
    }
}
