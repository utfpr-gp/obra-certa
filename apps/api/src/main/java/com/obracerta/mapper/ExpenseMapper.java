package com.obracerta.mapper;

import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.model.dto.supplier.SupplierDTO;
import com.obracerta.model.entity.Expense;
import com.obracerta.model.entity.Supplier;

public final class ExpenseMapper {
    private ExpenseMapper() {}
    public static SupplierDTO toSupplierDTO(Supplier supplier) {
        return new SupplierDTO(supplier.getId(),supplier.getName(),supplier.getDocument());
    }
    public static ExpenseResponseDTO toDTO(Expense expense) {
        return new ExpenseResponseDTO(expense.getId(),expense.getProject().getId(),expense.getDescription(),
                expense.getPurchaseDate(),expense.getCategory().getId(),expense.getCategory().getName(),
                toSupplierDTO(expense.getSupplier()),expense.isPaid(),expense.getQuantity(),expense.getUnitPrice(),expense.getTotalPrice(),
                expense.getPendingPayment() == null ? null : expense.getPendingPayment().getDueDate(),expense.getReceiptState());
    }
}
