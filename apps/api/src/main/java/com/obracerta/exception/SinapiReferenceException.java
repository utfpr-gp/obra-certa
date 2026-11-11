package com.obracerta.exception;

import org.springframework.http.HttpStatus;

public class SinapiReferenceException extends RuntimeException {
    private final HttpStatus status;

    public SinapiReferenceException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
