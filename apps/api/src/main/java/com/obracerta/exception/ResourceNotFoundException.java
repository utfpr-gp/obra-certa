package com.obracerta.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException() {
        super("Projeto não encontrado");
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
