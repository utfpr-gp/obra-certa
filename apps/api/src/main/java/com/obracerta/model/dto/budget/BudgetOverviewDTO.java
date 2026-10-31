package com.obracerta.model.dto.budget;

import java.math.BigDecimal;
import java.util.List;

public record BudgetOverviewDTO(
        String projectId,
        BigDecimal totalPlanned,
        BigDecimal totalSpent,
        BigDecimal available,
        BigDecimal globalPercentage,
        int exceededCategories,
        int budgetedCategories,
        List<BudgetCategoryDTO> categories) {
}
