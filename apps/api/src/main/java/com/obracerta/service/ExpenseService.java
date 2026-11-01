package com.obracerta.service;

import com.obracerta.enums.PaymentStatus;
import com.obracerta.enums.ExpenseTab;
import com.obracerta.model.dto.expense.ExpenseCreateDTO;
import com.obracerta.model.dto.expense.ExpenseUpdateDTO;
import com.obracerta.model.dto.expense.ExpenseDeleteResponseDTO;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.exception.ReceiptException;
import com.obracerta.model.entity.Expense;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.repository.*;
import com.obracerta.model.entity.*;
import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.mapper.ExpenseMapper;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.exception.ExpenseValidationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.obracerta.model.dto.expense.ExpensePageResponseDTO;
import com.obracerta.model.dto.expense.ExpenseTotalsDTO;
import com.obracerta.model.dto.expense.ExpenseListQueryDTO;
import org.springframework.util.MultiValueMap;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ExpenseService {
    private final UserContextHelper identity;
    private final ProjectRepository projects;
    private final ExpenseCategoryRepository categories;
    private final SupplierRepository suppliers;
    private final BudgetRepository budgets;
    private final ExpenseRepository expenses;
    private final Clock clock;
    private final ReceiptStorage storage;
    private final TransactionTemplate transactions;

    public ExpenseService(UserContextHelper identity, ProjectRepository projects,
            ExpenseCategoryRepository categories, SupplierRepository suppliers,
            BudgetRepository budgets, ExpenseRepository expenses) {
        this(identity, projects, categories, suppliers, budgets, expenses, Clock.systemUTC());
    }

    public ExpenseService(UserContextHelper identity, ProjectRepository projects,
            ExpenseCategoryRepository categories, SupplierRepository suppliers,
            BudgetRepository budgets, ExpenseRepository expenses, Clock clock) {
        this(identity, projects, categories, suppliers, budgets, expenses, clock, null, null);
    }

    @Autowired
    public ExpenseService(UserContextHelper identity, ProjectRepository projects,
            ExpenseCategoryRepository categories, SupplierRepository suppliers,
            BudgetRepository budgets, ExpenseRepository expenses, Clock clock,
            ReceiptStorage storage, PlatformTransactionManager transactionManager) {
        this.identity = identity;
        this.projects = projects;
        this.categories = categories;
        this.suppliers = suppliers;
        this.budgets = budgets;
        this.expenses = expenses;
        this.clock = clock;
        this.storage = storage;
        this.transactions = transactionManager == null ? null : new TransactionTemplate(transactionManager);
        if (this.transactions != null)
            this.transactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public ExpenseDeleteResponseDTO delete(String id) {
        String receiptKey;
        try {
            receiptKey = transactions.execute(status -> {
                Expense expense = expenses.findActiveByIdAndOwner(id, identity.getAuthenticatedUser().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada"));
                var deletedAt = clock.instant();
                expense.setDeletedAt(deletedAt);
                if (expense.getPendingPayment() != null) expense.getPendingPayment().setDeletedAt(deletedAt);
                expenses.saveAndFlush(expense);
                return "UPLOADED".equals(expense.getReceiptState()) ? expense.getReceiptKey() : null;
            });
        } catch (DataAccessException exception) {
            throw new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE,
                    "A exclusão da despesa não foi confirmada. Consulte o estado atual antes de tentar novamente.");
        }
        // TransactionTemplate returns only after the financial deletion has committed.
        boolean receiptDeletionFailed = false;
        if (receiptKey != null) {
            try { storage.delete(receiptKey); }
            catch (RuntimeException exception) { receiptDeletionFailed = true; }
        }
        return new ExpenseDeleteResponseDTO(id, true, receiptDeletionFailed);
    }

    @Transactional
    public ExpenseResponseDTO create(ExpenseCreateDTO request) {
        User owner = identity.getAuthenticatedUser();
        Project project = projects.findByIdAndUserIdAndDeletedAtIsNull(request.projectId(), owner.getId())
                .orElseThrow(ResourceNotFoundException::new);
        ExpenseCategory category = categories.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        if (request.description() == null || request.description().isBlank() || request.purchaseDate() == null
                || request.paid() == null) invalid("Informe descrição, data e situação do pagamento.");
        if (!request.paid()) {
            if (request.dueDate() == null) invalid("Informe o vencimento do pagamento pendente.");
            if (request.dueDate().isBefore(request.purchaseDate()))
                invalid("O vencimento não pode ser anterior à data da despesa.");
        }
        boolean calculated = "CALCULATED".equals(request.valueMode());
        BigDecimal total = calculateTotal(request.valueMode(), request.quantity(), request.unitPrice(), request.totalPrice());
        boolean existing = request.supplierId() != null && !request.supplierId().isBlank();
        if (existing == (request.newSupplier() != null)) invalid("Selecione um fornecedor ou cadastre um novo.");
        Supplier supplier;
        if (existing) supplier = suppliers.findByIdAndUserId(request.supplierId(), owner.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
        else {
            var input = request.newSupplier();
            String document = input.document() == null || input.document().isBlank()
                    ? null : input.document().replaceAll("[./\\-\\s]", "");
            if (input.name() == null || input.name().isBlank() || input.name().trim().length() > 255
                    || (document != null && !document.matches("[0-9]{14}")))
                invalid("Informe o nome e, se preenchido, CNPJ de 14 dígitos do fornecedor.");
            supplier = document == null
                    ? suppliers.save(Supplier.builder().user(owner).name(input.name().trim()).document(null).build())
                    : suppliers.findFirstByUserIdAndDocument(owner.getId(), document).orElseGet(() ->
                        suppliers.save(Supplier.builder().user(owner).name(input.name().trim()).document(document).build()));
        }
        Expense expense = Expense.builder().user(owner).project(project).category(category).supplier(supplier)
                .budget(budgets.findByProjectIdAndCategoryIdAndDeletedAtIsNull(project.getId(), category.getId()).orElse(null))
                .description(request.description().trim()).purchaseDate(request.purchaseDate()).paid(request.paid())
                .quantity(calculated ? request.quantity() : null).unitPrice(calculated ? request.unitPrice() : null)
                .totalPrice(total.setScale(2, RoundingMode.HALF_UP))
                .receiptState(Boolean.TRUE.equals(request.receiptExpected()) ? "PENDING" : "NONE").build();
        if (!request.paid()) {
            expense.setPendingPayment(PendingPayment.builder()
                    .expense(expense)
                    .status(PaymentStatus.PENDING)
                    .dueDate(request.dueDate())
                    .paidAt(null)
                    .build());
        }
        return ExpenseMapper.toDTO(expenses.save(expense));
    }

    @Transactional
    public ExpenseResponseDTO update(String id, ExpenseUpdateDTO request) {
        Expense expense = expenses.findActiveByIdAndOwner(id, identity.getAuthenticatedUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada"));
        if (request.description() == null || request.description().isBlank() || request.purchaseDate() == null)
            invalid("Informe descrição e data da despesa.");
        if (request.paid() == null)
            invalid("Informe a situação do pagamento.");
        ExpenseCategory category = categories.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));

        if (!request.paid()) {
            if (request.dueDate() == null)
                invalid("Informe o vencimento do pagamento pendente.");
            if (request.dueDate().isBefore(request.purchaseDate()))
                invalid("O vencimento não pode ser anterior à data da despesa.");
        }

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

        if (!request.paid()) {
            expense.setPaid(false);
            if (expense.getPendingPayment() != null) {
                PendingPayment payment = expense.getPendingPayment();
                payment.setStatus(PaymentStatus.PENDING);
                payment.setDueDate(request.dueDate());
                payment.setPaidAt(null);
            } else {
                PendingPayment payment = PendingPayment.builder()
                        .expense(expense)
                        .status(PaymentStatus.PENDING)
                        .dueDate(request.dueDate())
                        .paidAt(null)
                        .build();
                expense.setPendingPayment(payment);
            }
        } else {
            expense.setPaid(true);
            if (expense.getPendingPayment() != null) {
                PendingPayment payment = expense.getPendingPayment();
                if (payment.getStatus() == PaymentStatus.PENDING) {
                    payment.setPaidAt(clock.instant());
                }
                payment.setStatus(PaymentStatus.PAID);
            }
        }

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

    @Transactional(readOnly = true)
    public ExpenseResponseDTO get(String id) {
        return ExpenseMapper.toDTO(expenses.findActiveByIdAndOwner(id, identity.getAuthenticatedUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada")));
    }

    @Transactional(readOnly = true)
    public ExpensePageResponseDTO list(String projectId, int page, int size) {
        return list(projectId, page, size, ExpenseTab.ALL);
    }

    @Transactional(readOnly = true)
    public ExpensePageResponseDTO list(String projectId, int page, int size, ExpenseTab tab) {
        return list(new ExpenseListQueryDTO(projectId, page, size, tab, null, null, null, null, List.of(), null));
    }

    @Transactional(readOnly = true)
    public ExpensePageResponseDTO list(MultiValueMap<String, String> parameters) {
        return list(parseQuery(parameters));
    }

    private ExpensePageResponseDTO list(ExpenseListQueryDTO query) {
        User owner = identity.getAuthenticatedUser();
        projects.findByIdAndUserIdAndDeletedAtIsNull(query.projectId(), owner.getId())
                .orElseThrow(ResourceNotFoundException::new);
        if (query.supplierId() != null)
            suppliers.findByIdAndUserId(query.supplierId(), owner.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));
        for (String categoryId : query.categoryIds()) {
            if (!categories.existsById(categoryId)) invalid("Categoria de filtro inválida.");
        }
        LocalDate referenceDate = LocalDate.now(clock);
        var result = expenses.findActiveByFilters(query, owner.getId(), referenceDate,
                PageRequest.of(query.page(), query.size(), Sort.by(Sort.Direction.DESC, "purchaseDate")
                        .and(Sort.by(Sort.Direction.ASC, "id"))));
        var totals = expenses.sumActiveByFilters(query, owner.getId(), referenceDate);
        var summary = new ExpenseTotalsDTO(totals.getTotalPaid(), totals.getTotalPending(),
                totals.getTotalPaid().add(totals.getTotalPending()));
        return ExpenseMapper.toPageDTO(result, referenceDate, summary);
    }

    private static ExpenseListQueryDTO parseQuery(MultiValueMap<String, String> parameters) {
        Set<String> allowed = Set.of("projectId", "page", "size", "tab", "purchaseDateFrom", "purchaseDateTo",
                "dueDateFrom", "dueDateTo", "categoryIds", "supplierId");
        for (var entry : parameters.entrySet()) {
            if (!allowed.contains(entry.getKey()) || entry.getValue().isEmpty()
                    || (!entry.getKey().equals("categoryIds") && entry.getValue().size() != 1)
                    || entry.getValue().stream().anyMatch(value -> value == null || value.isBlank()))
                invalid("Parâmetro de consulta inválido: " + entry.getKey());
        }
        try {
            String projectId = validQueryId(parameters.getFirst("projectId"));
            int page = Integer.parseInt(parameters.getFirst("page") == null ? "0" : parameters.getFirst("page"));
            int size = Integer.parseInt(parameters.getFirst("size") == null ? "15" : parameters.getFirst("size"));
            if (page < 0 || size < 1 || size > 15) invalid("Página ou tamanho inválido.");
            ExpenseTab tab = ExpenseTab.valueOf(parameters.getFirst("tab") == null ? "ALL" : parameters.getFirst("tab"));
            LocalDate purchaseFrom = queryDate(parameters.getFirst("purchaseDateFrom"));
            LocalDate purchaseTo = queryDate(parameters.getFirst("purchaseDateTo"));
            LocalDate dueFrom = queryDate(parameters.getFirst("dueDateFrom"));
            LocalDate dueTo = queryDate(parameters.getFirst("dueDateTo"));
            if (purchaseFrom != null && purchaseTo != null && purchaseFrom.isAfter(purchaseTo))
                invalid("A data inicial da compra não pode ser posterior à final.");
            if (dueFrom != null && dueTo != null && dueFrom.isAfter(dueTo))
                invalid("A data inicial do vencimento não pode ser posterior à final.");
            List<String> categoryIds = parameters.getOrDefault("categoryIds", List.of()).stream()
                    .map(ExpenseService::validQueryId).distinct().toList();
            String supplierId = parameters.containsKey("supplierId") ? validQueryId(parameters.getFirst("supplierId")) : null;
            return new ExpenseListQueryDTO(projectId, page, size, tab, purchaseFrom, purchaseTo,
                    dueFrom, dueTo, categoryIds, supplierId);
        } catch (IllegalArgumentException | java.time.format.DateTimeParseException exception) {
            throw new ExpenseValidationException("Parâmetros de consulta inválidos.");
        }
    }

    private static LocalDate queryDate(String value) {
        if (value == null) return null;
        if (!value.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")) invalid("Data de filtro inválida.");
        return LocalDate.parse(value);
    }

    private static String validQueryId(String value) {
        if (value == null || !UUID.fromString(value).toString().equalsIgnoreCase(value))
            throw new IllegalArgumentException("Identificador inválido");
        return value;
    }

    private static void validateNumber(BigDecimal number, int integers, String field) {
        if (number == null || number.signum() <= 0 || number.scale() > 2 || number.compareTo(BigDecimal.TEN.pow(integers)) >= 0)
            invalid("Informe " + field + " positivo com até duas casas decimais, dentro do limite permitido.");
    }

    private static void invalid(String message) { throw new ExpenseValidationException(message); }
}
