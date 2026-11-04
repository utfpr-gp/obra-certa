package com.obracerta.controller;

import com.obracerta.model.dto.payment.PaymentAlertsDTO;
import com.obracerta.model.dto.payment.PaymentSettlementRequestDTO;
import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import jakarta.validation.Valid;
import com.obracerta.service.PaymentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/projects/{projectId}")
public class PaymentController {
    private final PaymentService payments;

    public PaymentController(PaymentService payments) { this.payments = payments; }

    @GetMapping("/payment-alerts")
    public PaymentAlertsDTO getAlerts(@PathVariable String projectId) {
        return payments.getAlerts(projectId);
    }

    @PutMapping("/expenses/{expenseId}/payment")
    public ExpenseResponseDTO settle(@PathVariable String projectId, @PathVariable String expenseId,
                                     @Valid @RequestBody PaymentSettlementRequestDTO request) {
        return payments.settle(projectId, expenseId, request);
    }
}
