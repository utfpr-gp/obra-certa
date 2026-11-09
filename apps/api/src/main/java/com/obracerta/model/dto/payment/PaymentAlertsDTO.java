package com.obracerta.model.dto.payment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PaymentAlertsDTO(String projectId, LocalDate referenceDate, int count,
                               BigDecimal totalAmount, List<PaymentAlertItemDTO> items) {}
