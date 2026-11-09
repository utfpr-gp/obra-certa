package com.obracerta.model.dto.report;

import java.math.BigDecimal;
import java.util.List;

public record ReportResponseDTO(
        String projectId,
        String projectName,
        BigDecimal totalPlanned,
        BigDecimal totalSpent,
        BigDecimal totalPaid,
        BigDecimal totalPending,
        List<ReportCategoryDTO> categories) {
}
