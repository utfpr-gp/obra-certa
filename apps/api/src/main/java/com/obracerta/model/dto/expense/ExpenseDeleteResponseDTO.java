package com.obracerta.model.dto.expense;

public record ExpenseDeleteResponseDTO(String id, boolean deleted, boolean receiptDeletionFailed) {}
