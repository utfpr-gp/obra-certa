package com.obracerta.model.dto.expense;

import java.util.List;
import java.time.LocalDate;

public record ExpensePageResponseDTO(
        List<ExpenseResponseDTO> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last,
        LocalDate referenceDate,
        ExpenseTotalsDTO totals
) {}
