package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.BudgetState;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.model.dto.budget.BudgetCategoryDTO;
import com.obracerta.model.dto.budget.BudgetOverviewDTO;
import com.obracerta.model.dto.budget.BudgetSetDTO;
import com.obracerta.model.entity.Budget;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Collator;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class BudgetService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal NINETY = new BigDecimal("90");
    private static final BigDecimal ZERO = new BigDecimal("0.00");

    private final ProjectRepository projectRepository;
    private final UserContextHelper userContextHelper;
    private final BudgetRepository budgetRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final ExpenseRepository expenseRepository;

    public BudgetService(
            ProjectRepository projectRepository,
            UserContextHelper userContextHelper,
            BudgetRepository budgetRepository,
            ExpenseCategoryRepository expenseCategoryRepository,
            ExpenseRepository expenseRepository) {
        this.projectRepository = projectRepository;
        this.userContextHelper = userContextHelper;
        this.budgetRepository = budgetRepository;
        this.expenseCategoryRepository = expenseCategoryRepository;
        this.expenseRepository = expenseRepository;
    }

    /**
     * Leituras de orcamento da obra autenticada. {@code open-in-view=false} no perfil de
     * teste torna a transacao obrigatoria para acessar a categoria lazy dos orcamentos.
     */
    @Transactional(readOnly = true)
    public BudgetOverviewDTO getOverview(String projectId) {
        User user = userContextHelper.getAuthenticatedUser();
        Project project = projectRepository.findByIdAndUserIdAndDeletedAtIsNull(projectId, user.getId())
                .orElseThrow(ResourceNotFoundException::new);

        Map<String, CategoryRow> rows = new LinkedHashMap<>();

        for (Budget budget : budgetRepository.findByProjectIdAndDeletedAtIsNull(project.getId())) {
            ExpenseCategory category = budget.getCategory();
            CategoryRow row = rows.computeIfAbsent(
                    category.getId(), id -> new CategoryRow(id, category.getName()));
            row.plannedAmount = money(budget.getEstimatedAmount());
            row.hasBudget = true;
        }

        for (ExpenseRepository.CategoryExpenseTotal total
                : expenseRepository.sumActiveByCategory(project.getId())) {
            CategoryRow row = rows.computeIfAbsent(
                    total.getCategoryId(), id -> new CategoryRow(id, total.getCategoryName()));
            row.spentAmount = money(total.getTotal());
        }

        Collator collator = Collator.getInstance(Locale.forLanguageTag("pt-BR"));
        collator.setStrength(Collator.PRIMARY);

        List<BudgetCategoryDTO> categories = rows.values().stream()
                .map(this::toCategory)
                .sorted(Comparator.comparing(BudgetCategoryDTO::categoryName, collator))
                .toList();

        BigDecimal totalPlanned = categories.stream()
                .map(BudgetCategoryDTO::plannedAmount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal totalSpent = categories.stream()
                .map(BudgetCategoryDTO::spentAmount)
                .reduce(ZERO, BigDecimal::add);

        int exceededCategories = (int) categories.stream()
                .filter(category -> category.state() == BudgetState.EXCEEDED)
                .count();
        int budgetedCategories = (int) categories.stream()
                .filter(category -> category.plannedAmount().compareTo(BigDecimal.ZERO) > 0)
                .count();

        return new BudgetOverviewDTO(
                project.getId(),
                money(totalPlanned),
                money(totalSpent),
                money(totalPlanned.subtract(totalSpent)),
                percentageOf(totalSpent, totalPlanned),
                exceededCategories,
                budgetedCategories,
                categories);
    }

    @Transactional
    public BudgetCategoryDTO setBudget(String projectId, String categoryId, BudgetSetDTO request) {
        User user = userContextHelper.getAuthenticatedUser();
        Project project = projectRepository.findByIdAndUserIdAndDeletedAtIsNull(projectId, user.getId())
                .orElseThrow(ResourceNotFoundException::new);
        ExpenseCategory category = expenseCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));

        Budget budget = budgetRepository
                .findByProjectIdAndCategoryIdAndDeletedAtIsNull(project.getId(), category.getId())
                .orElseGet(() -> Budget.builder()
                        .user(user)
                        .project(project)
                        .category(category)
                        .build());
        budget.setEstimatedAmount(request.estimatedAmount());
        budgetRepository.save(budget);

        CategoryRow row = new CategoryRow(category.getId(), category.getName());
        row.plannedAmount = request.estimatedAmount();
        row.spentAmount = spentOfCategory(project.getId(), category.getId());
        row.hasBudget = true;
        return toCategory(row);
    }

    private BigDecimal spentOfCategory(String projectId, String categoryId) {
        return expenseRepository.sumActiveByCategory(projectId).stream()
                .filter(total -> total.getCategoryId().equals(categoryId))
                .map(ExpenseRepository.CategoryExpenseTotal::getTotal)
                .findFirst()
                .orElse(ZERO);
    }

    private BudgetCategoryDTO toCategory(CategoryRow row) {
        BigDecimal planned = money(row.plannedAmount);
        BigDecimal spent = money(row.spentAmount);
        return new BudgetCategoryDTO(
                row.categoryId,
                row.categoryName,
                planned,
                spent,
                money(planned.subtract(spent)),
                percentageOf(spent, planned),
                stateOf(planned, spent),
                row.hasBudget);
    }

    /**
     * Estado decidido pela razao exata: o percentual arredondado nunca decide a cor.
     */
    private static BudgetState stateOf(BigDecimal planned, BigDecimal spent) {
        if (planned.compareTo(BigDecimal.ZERO) == 0) {
            return BudgetState.NO_BUDGET;
        }
        if (spent.compareTo(planned) >= 0) {
            return BudgetState.EXCEEDED;
        }
        if (spent.multiply(HUNDRED).compareTo(planned.multiply(NINETY)) >= 0) {
            return BudgetState.WARNING;
        }
        return BudgetState.ON_TRACK;
    }

    private static BigDecimal percentageOf(BigDecimal spent, BigDecimal planned) {
        if (planned.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return spent.multiply(HUNDRED).divide(planned, 1, RoundingMode.HALF_UP);
    }

    private static BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private static final class CategoryRow {
        private final String categoryId;
        private final String categoryName;
        private BigDecimal plannedAmount = ZERO;
        private BigDecimal spentAmount = ZERO;
        private boolean hasBudget;

        private CategoryRow(String categoryId, String categoryName) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
        }
    }
}
