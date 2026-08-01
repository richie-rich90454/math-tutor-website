package com.mathtutor.dto;

import java.util.ArrayList;
import java.util.List;

public record LoginRequest(String email, String password, Boolean remember) {

    public static LoginRequest parse(JsonLike body) {
        List<Validator.Issue> issues = new ArrayList<>();
        String email = body.string("email");
        String password = body.string("password");
        Boolean remember = body.booleanOrNull("remember");

        Validator.requireString(issues, "email", email);
        if (email != null) {
            Validator.requireEmail(issues, "email", email);
        }
        Validator.requireString(issues, "password", password);
        if (password != null) {
            Validator.requireMin(issues, "password", password, 1);
            Validator.requireMax(issues, "password", password, 128);
        }

        if (!issues.isEmpty()) {
            throw new ValidationException(issues);
        }
        return new LoginRequest(email, password, remember);
    }
}
