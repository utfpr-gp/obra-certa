package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.model.dto.report.ReportCategoryDTO;
import com.obracerta.model.dto.report.ReportResponseDTO;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportService {
    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final ProjectRepository projects;
    private final UserContextHelper identity;
    private final ExpenseRepository expenses;
    private final BudgetRepository budgets;

    public ReportService(ProjectRepository projects, UserContextHelper identity,
                         ExpenseRepository expenses, BudgetRepository budgets) {
        this.projects = projects;
        this.identity = identity;
        this.expenses = expenses;
        this.budgets = budgets;
    }

    @Transactional(readOnly = true)
    public ReportResponseDTO getReport(String projectId) {
        User user = identity.getAuthenticatedUser();
        Project project = projects.findByIdAndUserIdAndDeletedAtIsNull(projectId, user.getId())
                .orElseThrow(ResourceNotFoundException::new);

        var activeBudgets = budgets.findByProjectIdAndOwnerIdAndDeletedAtIsNull(projectId, user.getId());
        BigDecimal planned = activeBudgets
                .stream()
                .map(budget -> money(budget.getEstimatedAmount()))
                .reduce(ZERO, BigDecimal::add);
        Map<String, BigDecimal> plannedByCategory = activeBudgets
                .stream()
                .collect(Collectors.toMap(
                        budget -> budget.getCategory().getId(),
                        budget -> money(budget.getEstimatedAmount()),
                        BigDecimal::add));
        List<ExpenseRepository.CategoryExpenseTotal> totals =
                expenses.sumActiveByCategoryAndOwner(projectId, user.getId());
        BigDecimal spent = totals.stream().map(total -> money(total.getTotal()))
                .reduce(ZERO, BigDecimal::add);
        ExpenseRepository.ReportExpenseTotals paymentTotals =
                expenses.sumActiveTotalsByProjectAndOwner(projectId, user.getId());
        BigDecimal paid = paymentTotals == null ? ZERO : money(paymentTotals.getTotalPaid());
        BigDecimal pending = paymentTotals == null ? ZERO : money(paymentTotals.getTotalPending());

        List<ReportCategoryDTO> categories = totals.stream()
                .sorted(Comparator.comparing(ExpenseRepository.CategoryExpenseTotal::getCategoryName))
                .map(total -> new ReportCategoryDTO(
                        total.getCategoryId(),
                        total.getCategoryName(),
                        money(total.getTotal()),
                        plannedByCategory.getOrDefault(total.getCategoryId(), ZERO),
                        percentage(total.getTotal(), spent)))
                .toList();
        return new ReportResponseDTO(project.getId(), project.getName(), planned, spent, paid, pending, categories);
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal percentage(BigDecimal value, BigDecimal total) {
        if (total.signum() == 0) return new BigDecimal("0.0");
        return value.multiply(HUNDRED).divide(total, 1, RoundingMode.HALF_UP);
    }
}
