package com.obracerta.model.dto.budget;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BudgetSetDTO(
        @NotNull(message = "Informe um valor positivo com até duas casas decimais.")
        @DecimalMin(value = "0.01", message = "Informe um valor positivo com até duas casas decimais.")
        @Digits(integer = 13, fraction = 2, message = "Informe um valor positivo com até duas casas decimais.")
        BigDecimal estimatedAmount) {
}
