package com.mathtutor.dto;

import java.util.List;

public class ValidationException extends RuntimeException {

    private final List<Issue> issues;

    public ValidationException(List<Issue> issues) {
        super("Validation failed");
        this.issues = issues;
    }

    public List<Issue> getIssues() {
        return issues;
    }

    public record Issue(String field, String message) {
    }
}
