package com.mathtutor.web;

import com.mathtutor.dto.MalformedJsonException;
import com.mathtutor.dto.ValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.Map;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", ex.getMessage() == null ? "Internal server error" : ex.getMessage()));
    }
}
