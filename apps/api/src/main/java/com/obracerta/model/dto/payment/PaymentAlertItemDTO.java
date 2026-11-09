package com.obracerta.model.dto.payment;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentAlertItemDTO(String expenseId, String description, LocalDate purchaseDate,
                                  LocalDate dueDate, BigDecimal totalPrice, Urgency urgency) {
    public enum Urgency { OVERDUE, DUE_SOON, REGULAR }
}
