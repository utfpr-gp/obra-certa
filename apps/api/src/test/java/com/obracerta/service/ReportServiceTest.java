package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.ExpenseValidationException;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
    @Mock ExpenseCategoryRepository categoryRepository;
    @Mock ReportPdfService pdfService;
    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(projectRepository, userContextHelper, expenseRepository, budgetRepository,
                categoryRepository, pdfService, Clock.fixed(Instant.parse("2026-11-02T15:30:00Z"), ZoneOffset.UTC));
    }

    @Test
    void exportsSameAuthorizedConsolidationAndAllActiveExpensesWithoutPagination() {
        prepareProject();
        var expense = com.obracerta.model.entity.Expense.builder().id("active").build();
        when(expenseRepository.findActiveByProjectAndOwner(org.mockito.ArgumentMatchers.eq("project-1"), org.mockito.ArgumentMatchers.eq("user-1"), org.mockito.ArgumentMatchers.any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(expense)));
        reportService.exportPdf("project-1");
        org.mockito.Mockito.verify(pdfService).generate(org.mockito.ArgumentMatchers.argThat(report -> report.projectName().equals("Casa") && report.totalSpent().signum() == 0), org.mockito.ArgumentMatchers.eq(List.of(expense)));
        org.mockito.Mockito.verify(expenseRepository).findActiveByProjectAndOwner(org.mockito.ArgumentMatchers.eq("project-1"), org.mockito.ArgumentMatchers.eq("user-1"), org.mockito.ArgumentMatchers.argThat(page -> page.isUnpaged() && page.getSort().getOrderFor("id") != null));
    }

    @Test
    void rejectsForeignPdfBeforeQueryingExpensesOrGeneratingBytes() {
        when(userContextHelper.getAuthenticatedUser()).thenReturn(User.builder().id("user-1").build());
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> reportService.exportPdf("other"))
                .isInstanceOf(com.obracerta.exception.ResourceNotFoundException.class);
        org.mockito.Mockito.verifyNoInteractions(expenseRepository, budgetRepository, pdfService);
    }

    @Test
    void aggregatesActiveExpensesByCategoryAndIgnoresDeletedExpenses() {
        User user = User.builder().id("user-1").build();
        Project project = Project.builder().id("project-1").name("Minha obra").user(user).build();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project));
        when(expenseRepository.sumActiveByCategoryAndOwner("project-1", "user-1", null, null, null))
                .thenReturn(List.of(total("cat-1", "Alvenaria", "125.50")));
        when(expenseRepository.sumActiveTotalsByProjectAndOwner("project-1", "user-1", null, null, null))
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

        var report = reportService.getReport("project-1", null, null, null);

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

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> reportService.getReport("other", null, null, null))
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
        when(expenseRepository.sumActiveByCategoryAndOwner("project-1", "user-1", null, null, null))
                .thenReturn(List.of());
        when(expenseRepository.sumActiveTotalsByProjectAndOwner("project-1", "user-1", null, null, null))
                .thenReturn(new ExpenseRepository.ReportExpenseTotals() {
                    public java.math.BigDecimal getTotalPaid() { return java.math.BigDecimal.ZERO; }
                    public java.math.BigDecimal getTotalPending() { return java.math.BigDecimal.ZERO; }
                });

        var report = reportService.getReport("project-1", null, null, null);

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

    private ExpenseRepository.ReportExpenseTotals totals(String paid, String pending) {
        return new ExpenseRepository.ReportExpenseTotals() {
            public java.math.BigDecimal getTotalPaid() { return new java.math.BigDecimal(paid); }
            public java.math.BigDecimal getTotalPending() { return new java.math.BigDecimal(pending); }
        };
    }

    @Test
    void includesBudgetsWithoutExpensesAlongsideUnbudgetedEqualAndExceededCategories() {
        prepareProject();
        when(budgetRepository.findByProjectIdAndOwnerIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(List.of(budget("empty", "Acabamento", "400.00"),
                        budget("equal", "Elétrica", "100.00"), budget("over", "Pintura", "200.00"),
                        budget("zero", "Serviços", "0.00")));
        when(expenseRepository.sumActiveByCategoryAndOwner("project-1", "user-1", null, null, null))
                .thenReturn(List.of(total("equal", "Elétrica", "100.00"),
                        total("over", "Pintura", "250.00"), total("unplanned", "Material", "50.00"),
                        total("zero", "Serviços", "25.00")));

        var report = reportService.getReport("project-1", null, null, null);

        assertThat(report.totalPlanned()).isEqualByComparingTo("700.00");
        assertThat(report.totalSpent()).isEqualByComparingTo("425.00");
        assertThat(report.categories()).extracting(category -> category.categoryId())
                .containsExactly("empty", "equal", "unplanned", "over", "zero");
        assertThat(report.categories()).filteredOn(category -> category.categoryId().equals("empty"))
                .singleElement().satisfies(category -> {
                    assertThat(category.plannedAmount()).isEqualByComparingTo("400.00");
                    assertThat(category.amount()).isZero();
                    assertThat(category.percentage()).isZero();
                });
        assertThat(report.categories()).filteredOn(category -> category.categoryId().equals("equal"))
                .singleElement().satisfies(category -> assertThat(category.plannedAmount().subtract(category.amount())).isZero());
        assertThat(report.categories()).filteredOn(category -> category.categoryId().equals("over"))
                .singleElement().satisfies(category -> assertThat(category.plannedAmount().subtract(category.amount())).isEqualByComparingTo("-50.00"));
        assertThat(report.categories()).filteredOn(category -> category.categoryId().equals("unplanned"))
                .singleElement().satisfies(category -> assertThat(category.plannedAmount()).isZero());
    }

    @Test
    void preservesBudgetForAProjectWithoutAnyExpenses() {
        prepareProject();
        when(budgetRepository.findByProjectIdAndOwnerIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(List.of(budget("empty", "Acabamento", "400.00")));
        when(expenseRepository.sumActiveByCategoryAndOwner("project-1", "user-1", null, null, null))
                .thenReturn(List.of());

        var report = reportService.getReport("project-1", null, null, null);

        assertThat(report.totalPlanned()).isEqualByComparingTo("400.00");
        assertThat(report.totalSpent()).isZero();
        assertThat(report.totalPaid()).isZero();
        assertThat(report.totalPending()).isZero();
        assertThat(report.categories()).singleElement().satisfies(category -> {
            assertThat(category.plannedAmount()).isEqualByComparingTo("400.00");
            assertThat(category.amount()).isZero();
            assertThat(category.percentage()).isZero();
        });
    }

    @Test
    void appliesTheInclusivePeriodToExpenseSumsAndKeepsTheWholeBudget() {
        prepareProject();
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 31);
        when(budgetRepository.findByProjectIdAndOwnerIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(List.of(budget("cat-1", "Alvenaria", "400.00"), budget("cat-2", "Pintura", "100.00")));
        when(expenseRepository.sumActiveByCategoryAndOwner("project-1", "user-1", from, to, null))
                .thenReturn(List.of(total("cat-1", "Alvenaria", "50.00")));
        when(expenseRepository.sumActiveTotalsByProjectAndOwner("project-1", "user-1", from, to, null))
                .thenReturn(totals("30.00", "20.00"));

        var report = reportService.getReport("project-1", from, to, null);

        assertThat(report.totalPlanned()).isEqualByComparingTo("500.00");
        assertThat(report.totalSpent()).isEqualByComparingTo("50.00");
        assertThat(report.totalPaid()).isEqualByComparingTo("30.00");
        assertThat(report.totalPending()).isEqualByComparingTo("20.00");
        assertThat(report.categories()).filteredOn(category -> category.categoryId().equals("cat-2"))
                .singleElement().satisfies(category -> {
                    assertThat(category.amount()).isZero();
                    assertThat(category.plannedAmount()).isEqualByComparingTo("100.00");
                });
        org.mockito.Mockito.verify(expenseRepository)
                .sumActiveByCategoryAndOwner("project-1", "user-1", from, to, null);
        org.mockito.Mockito.verify(expenseRepository)
                .sumActiveTotalsByProjectAndOwner("project-1", "user-1", from, to, null);
    }

    @Test
    void rejectsAnInvertedPeriodBeforeQueryingAnything() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> reportService.getReport("project-1",
                        LocalDate.of(2026, 11, 2), LocalDate.of(2026, 11, 1), null))
                .isInstanceOf(ExpenseValidationException.class)
                .hasMessage("A data inicial do período não pode ser posterior à final.");
        org.mockito.Mockito.verifyNoInteractions(userContextHelper, projectRepository, expenseRepository,
                budgetRepository, categoryRepository, pdfService);
    }

    @Test
    void exportsTheSnapshotWithTheAppliedPeriodAndCategory() {
        prepareProject();
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 31);
        when(categoryRepository.findById("cat-1")).thenReturn(Optional.of(
                ExpenseCategory.builder().id("cat-1").name("Alvenaria").build()));
        when(budgetRepository.findByProjectIdAndOwnerIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(List.of(budget("cat-1", "Alvenaria", "400.00"), budget("cat-2", "Pintura", "100.00")));
        when(expenseRepository.sumActiveByCategoryAndOwner("project-1", "user-1", from, to, "cat-1"))
                .thenReturn(List.of(total("cat-1", "Alvenaria", "50.00")));
        when(expenseRepository.sumActiveTotalsByProjectAndOwner("project-1", "user-1", from, to, "cat-1"))
                .thenReturn(totals("30.00", "20.00"));

        var snapshot = reportService.exportSnapshot("project-1", from, to, "cat-1");

        assertThat(snapshot.from()).isEqualTo(from);
        assertThat(snapshot.to()).isEqualTo(to);
        assertThat(snapshot.categoryName()).isEqualTo("Alvenaria");
        assertThat(snapshot.filename()).isEqualTo("relatorio-casa-2026-11-02.pdf");
        assertThat(snapshot.report().totalPlanned()).isEqualByComparingTo("400.00");
        assertThat(snapshot.report().totalSpent()).isEqualByComparingTo("50.00");
        assertThat(snapshot.report().totalPaid()).isEqualByComparingTo("30.00");
        assertThat(snapshot.report().totalPending()).isEqualByComparingTo("20.00");
        assertThat(snapshot.report().categories()).extracting(category -> category.categoryId())
                .containsExactly("cat-1");
    }

    @Test
    void exportsTheAuthorizedReportWithDeterministicFilenameAndGenerationDate() {
        prepareProject();

        var snapshot = reportService.exportSnapshot("project-1", null, null, null);

        assertThat(snapshot.report().projectId()).isEqualTo("project-1");
        assertThat(snapshot.report().projectName()).isEqualTo("Casa");
        assertThat(snapshot.filename()).isEqualTo("relatorio-casa-2026-11-02.pdf");
        assertThat(snapshot.generatedAt()).isEqualTo("2026-11-02");
        assertThat(snapshot.from()).isNull();
        assertThat(snapshot.to()).isNull();
        assertThat(snapshot.categoryName()).isNull();
        org.mockito.Mockito.verifyNoInteractions(categoryRepository);
        org.mockito.Mockito.verifyNoInteractions(pdfService);
        org.mockito.Mockito.verify(expenseRepository, org.mockito.Mockito.never())
                .findActiveByProjectAndOwner(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsForeignSnapshotBeforeAnyFinancialQueries() {
        when(userContextHelper.getAuthenticatedUser()).thenReturn(User.builder().id("user-1").build());
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> reportService.exportSnapshot("other", null, null, null))
                .isInstanceOf(com.obracerta.exception.ResourceNotFoundException.class);
        org.mockito.Mockito.verifyNoInteractions(expenseRepository, budgetRepository, pdfService);
    }

    private void prepareProject() {
        User user = User.builder().id("user-1").build();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(Project.builder().id("project-1").name("Casa").user(user).build()));
    }

    private com.obracerta.model.entity.Budget budget(String id, String name, String amount) {
        return com.obracerta.model.entity.Budget.builder()
                .category(com.obracerta.model.entity.ExpenseCategory.builder().id(id).name(name).build())
                .estimatedAmount(new BigDecimal(amount)).build();
    }
}
