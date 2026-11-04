package com.obracerta.controller;

import com.obracerta.model.dto.payment.PaymentAlertsDTO;
import com.obracerta.service.PaymentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects/{projectId}/payment-alerts")
public class PaymentController {
    private final PaymentService payments;

    public PaymentController(PaymentService payments) { this.payments = payments; }

    @GetMapping
    public PaymentAlertsDTO getAlerts(@PathVariable String projectId) {
        return payments.getAlerts(projectId);
    }
}
