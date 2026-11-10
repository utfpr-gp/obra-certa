package com.obracerta.model.dto.nfe;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record NfePreviewResponseDTO(
        String projectId,
        String accessKey,
        LocalDate issueDate,
        Supplier supplier,
        List<Item> items,
        BigDecimal total) {

    public record Supplier(String name, String document) {
    }

    public record Item(
            int itemNumber,
            String description,
            BigDecimal quantity,
            String unit,
            BigDecimal unitPrice,
            BigDecimal totalPrice) {
    }
}
