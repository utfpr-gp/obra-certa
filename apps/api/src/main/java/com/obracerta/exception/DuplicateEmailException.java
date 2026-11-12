package com.obracerta.exception;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException() {
        this(null);
    }

    public DuplicateEmailException(Throwable cause) {
        super("E-mail já cadastrado", cause);
    }
}
