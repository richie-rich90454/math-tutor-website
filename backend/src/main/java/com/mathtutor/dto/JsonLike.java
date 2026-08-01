package com.mathtutor.dto;

import tools.jackson.databind.JsonNode;

public record JsonLike(JsonNode node) {

    public static JsonLike of(JsonNode node) {
        return new JsonLike(node);
    }

    public String string(String field) {
        JsonNode value = node.get(field);
        return value != null && value.isValueNode() ? value.asText() : null;
    }

    public boolean booleanOrFalse(String field) {
        JsonNode value = node.get(field);
        return value != null && value.isBoolean() && value.asBoolean();
    }

    public Boolean booleanOrNull(String field) {
        JsonNode value = node.get(field);
        return value != null && value.isBoolean() ? value.asBoolean() : null;
    }

    public boolean has(String field) {
        return node.has(field);
    }
}
