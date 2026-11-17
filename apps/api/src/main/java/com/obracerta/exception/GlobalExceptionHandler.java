package com.obracerta.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.Map;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(InvalidRecoveryTokenException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleInvalidRecoveryToken(InvalidRecoveryTokenException exception, HttpServletRequest request) {
        return new ApiErrorResponse(Instant.now(), 400, HttpStatus.BAD_REQUEST.getReasonPhrase(),
                exception.getMessage(), request.getRequestURI(), List.of());
    }
    @ExceptionHandler(SinapiReferenceException.class)
    public ResponseEntity<ApiErrorResponse> handleSinapiReference(
            SinapiReferenceException exception, HttpServletRequest request) {
        HttpStatus status = exception.status();
        return ResponseEntity.status(status).body(new ApiErrorResponse(
                Instant.now(), status.value(), status.getReasonPhrase(),
                exception.getMessage(), request.getRequestURI(), List.of()));
    }

    @ExceptionHandler(ReportPdfException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiErrorResponse handleReportPdf(ReportPdfException exception, HttpServletRequest request) {
        return new ApiErrorResponse(
                Instant.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                exception.getMessage(),
                request.getRequestURI(),
                List.of());
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public ApiErrorResponse handleMultipartSize(HttpServletRequest request) {
        return new ApiErrorResponse(Instant.now(),413,HttpStatus.PAYLOAD_TOO_LARGE.getReasonPhrase(),
                ReceiptException.FILE_GUIDANCE,request.getRequestURI(),List.of());
    }

    @ExceptionHandler(ReceiptException.class)
    public org.springframework.http.ResponseEntity<ApiErrorResponse> handleReceipt(
            ReceiptException exception, HttpServletRequest request) {
        var status=exception.status();
        return org.springframework.http.ResponseEntity.status(status).body(new ApiErrorResponse(
                Instant.now(),status.value(),status.getReasonPhrase(),exception.getMessage(),request.getRequestURI(),List.of()));
    }

    @ExceptionHandler(ExpenseValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleExpenseValidation(
            ExpenseValidationException exception,
            HttpServletRequest request) {
        return new ApiErrorResponse(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                exception.getMessage(),
                request.getRequestURI(),
                List.of());
    }

    @ExceptionHandler(BudgetBelowSpentException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiErrorResponse handleBudgetBelowSpent(
            BudgetBelowSpentException exception,
            HttpServletRequest request) {
        return new ApiErrorResponse(
                Instant.now(),
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                exception.getMessage(),
                request.getRequestURI(),
                List.of());
    }

    @ExceptionHandler(DuplicateEmailException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiErrorResponse handleDuplicateEmail(DuplicateEmailException exception, HttpServletRequest request) {
        return new ApiErrorResponse(
                Instant.now(), HttpStatus.CONFLICT.value(), HttpStatus.CONFLICT.getReasonPhrase(),
                exception.getMessage(), request.getRequestURI(), List.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiErrorResponse handleDataIntegrityViolation(HttpServletRequest request) {
        return new ApiErrorResponse(
                Instant.now(),
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                "O registro entra em conflito com dados existentes. Atualize a tela e tente novamente.",
                request.getRequestURI(),
                List.of());
    }

    @ExceptionHandler(NfeInvalidXmlException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleNfeInvalidXml(
            NfeInvalidXmlException exception,
            HttpServletRequest request) {
        return new ApiErrorResponse(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                exception.getMessage(),
                request.getRequestURI(),
                List.of());
    }

    @ExceptionHandler(NfeAlreadyRegisteredException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiErrorResponse handleNfeAlreadyRegistered(
            NfeAlreadyRegisteredException exception,
            HttpServletRequest request) {
        return new ApiErrorResponse(
                Instant.now(),
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                exception.getMessage(),
                request.getRequestURI(),
                List.of());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiErrorResponse handleResourceNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request) {
        return new ApiErrorResponse(
                Instant.now(),
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                exception.getMessage(),
                request.getRequestURI(),
                List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {
        List<Object> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> Map.<String, String>of(
                        "field", error.getField(),
                        "message", error.getDefaultMessage()))
                .map(error -> (Object) error)
                .toList();

        return new ApiErrorResponse(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Validation failed",
                request.getRequestURI(),
                fieldErrors);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiErrorResponse handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request) {
        return new ApiErrorResponse(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Invalid value for parameter '" + exception.getName() + "'",
                request.getRequestURI(),
                List.<Object>of(Map.of(
                        "field", exception.getName(),
                        "message", "Invalid value")));
    }
}
