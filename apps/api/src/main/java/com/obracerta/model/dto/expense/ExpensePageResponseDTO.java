package com.obracerta.model.dto.expense;

import java.util.List;

public record ExpensePageResponseDTO(
        List<ExpenseResponseDTO> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {}
