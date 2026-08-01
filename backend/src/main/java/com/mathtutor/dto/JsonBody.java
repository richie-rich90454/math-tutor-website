package com.mathtutor.dto;

import tools.jackson.databind.ObjectMapper;

public final class JsonBody {

    private JsonBody() {
    }

    public static JsonLike parse(String raw) {
        try {
            return JsonLike.of(new ObjectMapper().readTree(raw));
        } catch (Exception e) {
            throw new MalformedJsonException();
        }
    }
}
