package com.obracerta.service;

import com.obracerta.model.dto.expense.ExpenseCreateDTO;
import com.obracerta.model.dto.expense.ExpenseUpdateDTO;
import com.obracerta.model.entity.Expense;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.repository.*;
import com.obracerta.model.entity.*;
import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.mapper.ExpenseMapper;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.exception.ExpenseValidationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ExpenseService {
    private final UserContextHelper identity;
    private final ProjectRepository projects;
    private final ExpenseCategoryRepository categories;
    private final SupplierRepository suppliers;
    private final BudgetRepository budgets;
    private final ExpenseRepository expenses;
    public ExpenseService(UserContextHelper identity, ProjectRepository projects,
            ExpenseCategoryRepository categories, SupplierRepository suppliers,
            BudgetRepository budgets, ExpenseRepository expenses) {
        this.identity=identity; this.projects=projects; this.categories=categories;
        this.suppliers=suppliers; this.budgets=budgets; this.expenses=expenses;
    }

    @Transactional
    public ExpenseResponseDTO create(ExpenseCreateDTO request) {
        User owner = identity.getAuthenticatedUser();
        Project project = projects.findByIdAndUserIdAndDeletedAtIsNull(request.projectId(),owner.getId())
                .orElseThrow(ResourceNotFoundException::new);
        ExpenseCategory category = categories.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        if (request.description()==null || request.description().isBlank() || request.purchaseDate()==null
                || request.paid()==null) invalid("Informe descrição, data e situação do pagamento.");
        if (!request.paid()) {
            if (request.dueDate()==null) invalid("Informe o vencimento do pagamento pendente.");
            if (request.dueDate().isBefore(request.purchaseDate()))
                invalid("O vencimento não pode ser anterior à data da despesa.");
        }
        boolean calculated = "CALCULATED".equals(request.valueMode());
        BigDecimal total = calculateTotal(request.valueMode(), request.quantity(), request.unitPrice(), request.totalPrice());
        boolean existing = request.supplierId()!=null && !request.supplierId().isBlank();
        if (existing == (request.newSupplier()!=null)) invalid("Selecione um fornecedor ou cadastre um novo.");
        Supplier supplier;
        if (existing) supplier=suppliers.findByIdAndUserId(request.supplierId(),owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
        else {
            var input=request.newSupplier();
            String document=input.document()==null || input.document().isBlank()
                    ? null : input.document().replaceAll("[./\\-\\s]","");
            if (input.name()==null || input.name().isBlank() || input.name().trim().length()>255
                    || (document!=null && !document.matches("[0-9]{14}")))
                invalid("Informe o nome e, se preenchido, CNPJ de 14 dígitos do fornecedor.");
            supplier=document==null
                    ? suppliers.save(Supplier.builder().user(owner).name(input.name().trim()).document(null).build())
                    : suppliers.findFirstByUserIdAndDocument(owner.getId(),document).orElseGet(() ->
                        suppliers.save(Supplier.builder().user(owner).name(input.name().trim()).document(document).build()));
        }
        Expense expense=Expense.builder().user(owner).project(project).category(category).supplier(supplier)
                .budget(budgets.findByProjectIdAndCategoryIdAndDeletedAtIsNull(project.getId(),category.getId()).orElse(null))
                .description(request.description().trim()).purchaseDate(request.purchaseDate()).paid(request.paid())
                .quantity(calculated ? request.quantity() : null).unitPrice(calculated ? request.unitPrice() : null)
                .totalPrice(total.setScale(2,RoundingMode.HALF_UP))
                .receiptState(Boolean.TRUE.equals(request.receiptExpected()) ? "PENDING" : "NONE").build();
        if (!request.paid()) {
            expense.setPendingPayment(PendingPayment.builder().expense(expense).dueDate(request.dueDate()).build());
        }
        return ExpenseMapper.toDTO(expenses.save(expense));
    }
    @Transactional
    public ExpenseResponseDTO update(String id, ExpenseUpdateDTO request) {
        Expense expense = expenses.findActiveByIdAndOwner(id, identity.getAuthenticatedUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada"));
        if (request.description() == null || request.description().isBlank() || request.purchaseDate() == null)
            invalid("Informe descrição e data da despesa.");
        ExpenseCategory category = categories.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        if (!expense.isPaid() && expense.getPendingPayment() != null
                && expense.getPendingPayment().getDueDate().isBefore(request.purchaseDate()))
            invalid("O vencimento não pode ser anterior à data da despesa.");
        BigDecimal total = calculateTotal(request.valueMode(), request.quantity(), request.unitPrice(), request.totalPrice());
        boolean calculated = "CALCULATED".equals(request.valueMode());
        expense.setDescription(request.description().trim());
        expense.setPurchaseDate(request.purchaseDate());
        expense.setCategory(category);
        expense.setBudget(budgets.findByProjectIdAndCategoryIdAndDeletedAtIsNull(
                expense.getProject().getId(), category.getId()).orElse(null));
        expense.setQuantity(calculated ? request.quantity() : null);
        expense.setUnitPrice(calculated ? request.unitPrice() : null);
        expense.setTotalPrice(total.setScale(2, RoundingMode.HALF_UP));
        return ExpenseMapper.toDTO(expenses.save(expense));
    }

    private static BigDecimal calculateTotal(String mode, BigDecimal quantity, BigDecimal unitPrice, BigDecimal directTotal) {
        boolean calculated = "CALCULATED".equals(mode);
        if (!calculated && !"DIRECT".equals(mode)) invalid("Selecione o modo de valor.");
        BigDecimal total;
        if (calculated) {
            validateNumber(quantity, 8, "quantity");
            validateNumber(unitPrice, 13, "unitPrice");
            total = quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
        } else total = directTotal;
        validateNumber(total, 13, "totalPrice");
        return total;
    }

    @Transactional(readOnly=true)
    public ExpenseResponseDTO get(String id) {
        return ExpenseMapper.toDTO(expenses.findActiveByIdAndOwner(id,identity.getAuthenticatedUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada")));
    }
    private static void validateNumber(BigDecimal number,int integers,String field) {
        if (number==null || number.signum()<=0 || number.scale()>2 || number.compareTo(BigDecimal.TEN.pow(integers))>=0)
            invalid("Informe "+field+" positivo com até duas casas decimais, dentro do limite permitido.");
    }
    private static void invalid(String message) { throw new ExpenseValidationException(message); }
}
