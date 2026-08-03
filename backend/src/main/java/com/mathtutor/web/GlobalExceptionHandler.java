package com.mathtutor.web;

import com.mathtutor.dto.MalformedJsonException;
import com.mathtutor.dto.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.Map;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(ValidationException ex) {
        List<Map<String, String>> details = new ArrayList<>();
        for (var issue : ex.getIssues()) {
            details.add(Map.of(
                    "field", issue.field(),
                    "message", issue.message()));
        }
        return ResponseEntity.badRequest().body(Map.of(
                "error", "Validation failed",
                "details", details));
    }

    @ExceptionHandler(MalformedJsonException.class)
    public ResponseEntity<Map<String, Object>> handleMalformedJson(MalformedJsonException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid JSON body"));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        // Never leak internal exception details to clients.
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error"));
    }
}
