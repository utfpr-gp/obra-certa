package com.obracerta.exception;

public class ReportPdfException extends RuntimeException {
    public ReportPdfException(Throwable cause) {
        super("Não foi possível gerar o PDF.", cause);
    }
}
