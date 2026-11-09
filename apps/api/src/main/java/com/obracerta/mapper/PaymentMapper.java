package com.obracerta.mapper;

import com.obracerta.model.dto.payment.PaymentAlertItemDTO;
import com.obracerta.model.dto.payment.PaymentAlertItemDTO.Urgency;
import com.obracerta.model.entity.Expense;

public final class PaymentMapper {
    private PaymentMapper() {}

    public static PaymentAlertItemDTO toAlertItemDTO(Expense expense, Urgency urgency) {
        return new PaymentAlertItemDTO(
                expense.getId(),
                expense.getDescription(),
                expense.getPurchaseDate(),
                expense.getPendingPayment().getDueDate(),
                expense.getTotalPrice(),
                urgency
        );
    }
}
