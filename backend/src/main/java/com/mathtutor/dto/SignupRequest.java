package com.mathtutor.dto;

import java.util.ArrayList;
import java.util.List;

public record SignupRequest(String email, String password, String name) {

    public static SignupRequest parse(JsonLike body) {
        List<Validator.Issue> issues = new ArrayList<>();
        String email = body.string("email");
        String password = body.string("password");
        String name = body.string("name");

        Validator.requireString(issues, "email", email);
        if (email != null) {
            Validator.requireEmail(issues, "email", email);
        }
        Validator.requireString(issues, "password", password);
        if (password != null) {
            Validator.requireMin(issues, "password", password, 8);
            Validator.requireMax(issues, "password", password, 128);
        }
        Validator.requireString(issues, "name", name);
        if (name != null) {
            Validator.requireMin(issues, "name", name, 2);
            Validator.requireMax(issues, "name", name, 100);
        }

        if (!issues.isEmpty()) {
            throw new ValidationException(issues);
        }
        return new SignupRequest(email, password, name);
    }
}
