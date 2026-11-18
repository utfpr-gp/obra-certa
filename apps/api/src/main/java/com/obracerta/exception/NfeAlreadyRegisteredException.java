package com.obracerta.exception;

public class NfeAlreadyRegisteredException extends RuntimeException {

    public NfeAlreadyRegisteredException() {
        super("A nota fiscal já foi registrada");
    }
}
