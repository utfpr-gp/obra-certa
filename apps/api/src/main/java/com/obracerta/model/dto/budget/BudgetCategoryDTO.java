package com.obracerta.model.dto.budget;

import com.obracerta.enums.BudgetState;

import java.math.BigDecimal;

public record BudgetCategoryDTO(
        String categoryId,
        String categoryName,
        BigDecimal plannedAmount,
        BigDecimal spentAmount,
        BigDecimal balanceAmount,
        BigDecimal percentage,
        BudgetState state,
        boolean hasBudget) {
}
