package com.obracerta.service;

import com.obracerta.model.entity.Budget;
import com.obracerta.model.entity.Supplier;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.SupplierRepository;

// Regras de referência compartilhadas por ExpenseService e NfeImportService: orçamento da categoria e fornecedor por CNPJ.
class ExpenseReferenceResolver {

    private final BudgetRepository budgets;
    private final SupplierRepository suppliers;

    ExpenseReferenceResolver(BudgetRepository budgets, SupplierRepository suppliers) {
        this.budgets = budgets;
        this.suppliers = suppliers;
    }

    Budget resolveBudget(String projectId, String categoryId) {
        return budgets.findByProjectIdAndCategoryIdAndDeletedAtIsNull(projectId, categoryId).orElse(null);
    }

    // Sem CNPJ, cria sempre um fornecedor novo. Com CNPJ, reutiliza o do usuário ou cria.
    Supplier findOrCreateSupplier(User owner, String document, String name) {
        if (document == null)
            return suppliers.save(Supplier.builder().user(owner).name(name).document(null).build());
        return suppliers.findFirstByUserIdAndDocument(owner.getId(), document).orElseGet(() ->
                suppliers.save(Supplier.builder().user(owner).name(name).document(document).build()));
    }
}
