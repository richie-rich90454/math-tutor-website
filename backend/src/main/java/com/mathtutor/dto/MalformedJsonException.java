package com.mathtutor.dto;

public class MalformedJsonException extends RuntimeException {

    public MalformedJsonException() {
        super("Invalid JSON body");
    }
}
