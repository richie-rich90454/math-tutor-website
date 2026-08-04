package com.mathtutor.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.regex.Pattern;

public final class Validator {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private Validator() {
    }

    public static void requireEmail(List<Issue> issues, String field, String value) {
        if (value == null || value.isBlank()) {
            issues.add(new Issue(field, "Invalid email"));
            return;
        }
        if (value.length() > 255) {
            issues.add(new Issue(field, "String must contain at most 255 character(s)"));
            return;
        }
        if (!EMAIL_PATTERN.matcher(value).matches()) {
            issues.add(new Issue(field, "Invalid email"));
        }
    }

    public static void requireMin(List<Issue> issues, String field, String value, int min) {
        if (value == null || value.length() < min) {
            issues.add(new Issue(field, "String must contain at least " + min + " character(s)"));
        }
    }

    public static void requireMax(List<Issue> issues, String field, String value, int max) {
        if (value != null && value.length() > max) {
            issues.add(new Issue(field, "String must contain at most " + max + " character(s)"));
        }
    }

    public static void requireString(List<Issue> issues, String field, Object value) {
        if (value == null || !(value instanceof String)) {
            issues.add(new Issue(field, "Required"));
        }
    }

    public static List<Issue> validate(Consumer<List<Issue>> checker) {
        List<Issue> issues = new ArrayList<>();
        checker.accept(issues);
        return issues;
    }

    public record Issue(String field, String message) {
    }
}
