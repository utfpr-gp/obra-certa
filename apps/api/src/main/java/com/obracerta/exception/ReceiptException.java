package com.obracerta.exception;

import org.springframework.http.HttpStatus;

public class ReceiptException extends RuntimeException {
    public static final String FILE_GUIDANCE="Selecione um comprovante JPEG, PNG ou PDF de até 10 MB (10 MiB).";
    private final HttpStatus status;
    public ReceiptException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
    public HttpStatus status() { return status; }
}
