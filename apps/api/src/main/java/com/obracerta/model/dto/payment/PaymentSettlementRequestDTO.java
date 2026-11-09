package com.obracerta.model.dto.payment;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PaymentSettlementRequestDTO(
        @NotNull(message = "Informe a data efetiva do pagamento") LocalDate paymentDate) {}
