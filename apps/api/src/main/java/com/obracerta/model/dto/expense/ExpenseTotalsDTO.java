package com.obracerta.model.dto.expense;

import java.math.BigDecimal;

public record ExpenseTotalsDTO(BigDecimal totalPaid, BigDecimal totalPending, BigDecimal totalGeneral) {}
