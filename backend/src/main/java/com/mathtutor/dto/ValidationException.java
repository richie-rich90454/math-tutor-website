package com.mathtutor.dto;

import java.util.List;

public class ValidationException extends RuntimeException {

    private final List<Validator.Issue> issues;

    public ValidationException(List<Validator.Issue> issues) {
        super("Validation failed");
        this.issues = issues;
    }

    public List<Validator.Issue> getIssues() {
        return issues;
    }
}
