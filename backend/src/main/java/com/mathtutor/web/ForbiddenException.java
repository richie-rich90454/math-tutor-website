package com.mathtutor.web;

/**
 * Thrown when an authenticated user attempts to access a resource (e.g. a
 * chat) they do not own. Mapped to HTTP 403 by GlobalExceptionHandler and
 * the streaming controllers.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException() {
        super("Not authorized");
    }

    public ForbiddenException(String message) {
        super(message);
    }
}
