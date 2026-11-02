package com.obracerta.model.dto.report;

import java.math.BigDecimal;

public record ReportCategoryDTO(
        String categoryId,
        String categoryName,
        BigDecimal amount,
        BigDecimal plannedAmount,
        BigDecimal percentage) {

    public ReportCategoryDTO(String categoryId, String categoryName,
                             BigDecimal amount, BigDecimal percentage) {
        this(categoryId, categoryName, amount, BigDecimal.ZERO, percentage);
    }
}
