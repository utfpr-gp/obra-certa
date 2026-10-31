package com.obracerta.model.dto.expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.constraints.*;

public record ExpenseUpdateDTO(@NotBlank String description, @NotNull LocalDate purchaseDate,
        @NotBlank String categoryId, @NotBlank String valueMode,
        BigDecimal quantity, BigDecimal unitPrice, BigDecimal totalPrice) {}
