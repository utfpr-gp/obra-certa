package com.obracerta.exception;

public class InvalidRecoveryTokenException extends RuntimeException {
    public InvalidRecoveryTokenException() {
        super("Este link é inválido ou expirou. Solicite um novo link.");
    }
}
