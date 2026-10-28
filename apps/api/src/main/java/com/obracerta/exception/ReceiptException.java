package com.obracerta.exception;

import org.springframework.http.HttpStatus;

public class ReceiptException extends RuntimeException {
    private final HttpStatus status;
    public ReceiptException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
    public HttpStatus status() { return status; }
}
