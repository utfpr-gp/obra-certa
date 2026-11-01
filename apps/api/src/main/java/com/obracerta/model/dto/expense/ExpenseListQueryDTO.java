package com.obracerta.model.dto.expense;

import com.obracerta.enums.ExpenseTab;
import java.time.LocalDate;
import java.util.List;

public record ExpenseListQueryDTO(String projectId, int page, int size, ExpenseTab tab,
        LocalDate purchaseDateFrom, LocalDate purchaseDateTo, LocalDate dueDateFrom, LocalDate dueDateTo,
        List<String> categoryIds, String supplierId) {}
