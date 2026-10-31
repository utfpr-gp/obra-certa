package com.obracerta.model.dto.expense;

import com.obracerta.model.dto.supplier.SupplierDTO;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ExpenseResponseDTO(
        String id,
        String projectId,
        String description,
        LocalDate purchaseDate,
        String categoryId,
        String categoryName,
        SupplierDTO supplier,
        boolean paid,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        LocalDate dueDate,
        String receiptState,
        Instant paidAt
) {}
