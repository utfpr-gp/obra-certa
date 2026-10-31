package com.obracerta.model.dto.expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record ExpenseCreateDTO(@NotBlank String projectId, @NotBlank String description, @NotNull LocalDate purchaseDate,
        @NotBlank String categoryId, String supplierId, @Valid NewSupplierDTO newSupplier, @NotNull Boolean paid,
        @NotBlank String valueMode, BigDecimal quantity, BigDecimal unitPrice, BigDecimal totalPrice,
        LocalDate dueDate, Boolean receiptExpected) {
    public record NewSupplierDTO(@NotBlank @Size(max=255) String name,
            @Pattern(regexp="[0-9./\\-\\s]*") String document) {}
}
