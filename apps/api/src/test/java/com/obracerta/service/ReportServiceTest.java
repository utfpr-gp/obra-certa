package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock ProjectRepository projectRepository;
    @Mock UserContextHelper userContextHelper;
    @Mock ExpenseRepository expenseRepository;
    @Mock BudgetRepository budgetRepository;
    @InjectMocks ReportService reportService;

    @Test
    void aggregatesActiveExpensesByCategoryAndIgnoresDeletedExpenses() {
        User user = User.builder().id("user-1").build();
        Project project = Project.builder().id("project-1").name("Minha obra").user(user).build();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project));
        when(expenseRepository.sumActiveByCategoryAndOwner("project-1", "user-1"))
                .thenReturn(List.of(total("cat-1", "Alvenaria", "125.50")));
        when(expenseRepository.sumActiveTotalsByProjectAndOwner("project-1", "user-1"))
                .thenReturn(new ExpenseRepository.ReportExpenseTotals() {
                    public java.math.BigDecimal getTotalPaid() { return new java.math.BigDecimal("125.50"); }
                    public java.math.BigDecimal getTotalPending() { return new java.math.BigDecimal("0.00"); }
                });
        var budget = com.obracerta.model.entity.Budget.builder()
                .category(com.obracerta.model.entity.ExpenseCategory.builder().id("cat-1").name("Alvenaria").build())
                .estimatedAmount(new BigDecimal("200.00"))
                .build();
        when(budgetRepository.findByProjectIdAndOwnerIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(List.of(budget));

        var report = reportService.getReport("project-1");

        assertThat(report.projectName()).isEqualTo("Minha obra");
        assertThat(report.totalSpent()).isEqualByComparingTo("125.50");
        assertThat(report.categories()).singleElement()
                .satisfies(category -> {
                    assertThat(category.categoryName()).isEqualTo("Alvenaria");
                    assertThat(category.amount()).isEqualByComparingTo("125.50");
                    assertThat(category.plannedAmount()).isEqualByComparingTo("200.00");
                    assertThat(category.percentage()).isEqualByComparingTo("100.0");
                });
    }

    @Test
    void doesNotRevealAnUnauthorizedProject() {
        User user = User.builder().id("user-1").build();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("other", "user-1"))
                .thenReturn(Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> reportService.getReport("other"))
                .isInstanceOf(com.obracerta.exception.ResourceNotFoundException.class);
    }

    @Test
    void returnsAnEmptyDistributionForAValidProjectWithoutExpenses() {
        User user = User.builder().id("user-1").build();
        Project project = Project.builder().id("project-1").name("Obra vazia").user(user).build();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project));
        when(budgetRepository.findByProjectIdAndOwnerIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(List.of());
        when(expenseRepository.sumActiveByCategoryAndOwner("project-1", "user-1"))
                .thenReturn(List.of());
        when(expenseRepository.sumActiveTotalsByProjectAndOwner("project-1", "user-1"))
                .thenReturn(new ExpenseRepository.ReportExpenseTotals() {
                    public java.math.BigDecimal getTotalPaid() { return java.math.BigDecimal.ZERO; }
                    public java.math.BigDecimal getTotalPending() { return java.math.BigDecimal.ZERO; }
                });

        var report = reportService.getReport("project-1");

        assertThat(report.projectName()).isEqualTo("Obra vazia");
        assertThat(report.totalPlanned()).isEqualByComparingTo("0.00");
        assertThat(report.totalSpent()).isEqualByComparingTo("0.00");
        assertThat(report.categories()).isEmpty();
    }

    private ExpenseRepository.CategoryExpenseTotal total(String id, String name, String amount) {
        return new ExpenseRepository.CategoryExpenseTotal() {
            public String getCategoryId() { return id; }
            public String getCategoryName() { return name; }
            public java.math.BigDecimal getTotal() { return new java.math.BigDecimal(amount); }
        };
    }
}
