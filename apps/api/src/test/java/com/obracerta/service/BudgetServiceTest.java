package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.BudgetState;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.exception.BudgetBelowSpentException;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserContextHelper userContextHelper;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private ExpenseCategoryRepository expenseCategoryRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private BudgetService budgetService;

    @Test
    void computesTotalsNegativeBalanceAndGlobalPercentage() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        Project project = project("project-1", user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project));
        when(budgetRepository.findByProjectIdAndDeletedAtIsNull("project-1")).thenReturn(List.of(
                budget("cat-alvenaria", "Alvenaria", "1000.00"),
                budget("cat-eletrica", "Elétrica", "500.00")));
        when(expenseRepository.sumActiveByCategory("project-1")).thenReturn(List.of(
                expenseTotal("cat-alvenaria", "Alvenaria", "200.00"),
                expenseTotal("cat-eletrica", "Elétrica", "650.00")));

        BudgetOverviewDTO overview = budgetService.getOverview("project-1");

        assertThat(overview.projectId()).isEqualTo("project-1");
        assertThat(overview.totalPlanned()).isEqualByComparingTo("1500.00");
        assertThat(overview.totalSpent()).isEqualByComparingTo("850.00");
        assertThat(overview.available()).isEqualByComparingTo("650.00");
        assertThat(overview.globalPercentage()).isEqualByComparingTo("56.7");
        assertThat(overview.budgetedCategories()).isEqualTo(2);
        assertThat(overview.exceededCategories()).isEqualTo(1);
        assertThat(overview.categories())
                .extracting(BudgetCategoryDTO::categoryName)
                .containsExactly("Alvenaria", "Elétrica");

        BudgetCategoryDTO alvenaria = category(overview, "cat-alvenaria");
        assertThat(alvenaria.plannedAmount()).isEqualByComparingTo("1000.00");
        assertThat(alvenaria.spentAmount()).isEqualByComparingTo("200.00");
        assertThat(alvenaria.balanceAmount()).isEqualByComparingTo("800.00");
        assertThat(alvenaria.percentage()).isEqualByComparingTo("20.0");
        assertThat(alvenaria.state()).isEqualTo(BudgetState.ON_TRACK);
        assertThat(alvenaria.hasBudget()).isTrue();

        BudgetCategoryDTO eletrica = category(overview, "cat-eletrica");
        assertThat(eletrica.balanceAmount()).isEqualByComparingTo("-150.00");
        assertThat(eletrica.percentage()).isEqualByComparingTo("130.0");
        assertThat(eletrica.state()).isEqualTo(BudgetState.EXCEEDED);
    }

    @Test
    void decidesThresholdsByTheExactRatioInsteadOfTheRoundedPercentage() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        Project project = project("project-1", user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project));
        when(budgetRepository.findByProjectIdAndDeletedAtIsNull("project-1")).thenReturn(List.of(
                budget("cat-acabamento", "Acabamento e Pintura", "10000.00"),
                budget("cat-alvenaria", "Alvenaria", "10000.00"),
                budget("cat-eletrica", "Elétrica", "10000.00")));
        when(expenseRepository.sumActiveByCategory("project-1")).thenReturn(List.of(
                expenseTotal("cat-acabamento", "Acabamento e Pintura", "8999.00"),
                expenseTotal("cat-alvenaria", "Alvenaria", "9000.00"),
                expenseTotal("cat-eletrica", "Elétrica", "10000.00")));

        BudgetOverviewDTO overview = budgetService.getOverview("project-1");
        Map<String, BudgetCategoryDTO> byId = overview.categories().stream()
                .collect(Collectors.toMap(BudgetCategoryDTO::categoryId, Function.identity()));

        BudgetCategoryDTO justBelowNinety = byId.get("cat-acabamento");
        assertThat(justBelowNinety.percentage())
                .as("89,99%% arredonda para 90,0%% na exibicao")
                .isEqualByComparingTo("90.0");
        assertThat(justBelowNinety.state())
                .as("O estado usa a razao exata (8999/10000), nao o percentual arredondado")
                .isEqualTo(BudgetState.ON_TRACK);

        assertThat(byId.get("cat-alvenaria").state()).isEqualTo(BudgetState.WARNING);
        assertThat(byId.get("cat-eletrica").state()).isEqualTo(BudgetState.EXCEEDED);
        assertThat(overview.exceededCategories()).isEqualTo(1);
    }

    @Test
    void keepsCategoriesWithoutCeilingAsNoBudgetWithNullPercentage() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        Project project = project("project-1", user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project));
        when(budgetRepository.findByProjectIdAndDeletedAtIsNull("project-1")).thenReturn(List.of(
                budget("cat-alvenaria", "Alvenaria", "0.00"),
                budget("cat-eletrica", "Elétrica", "1000.00")));
        when(expenseRepository.sumActiveByCategory("project-1")).thenReturn(List.of(
                expenseTotal("cat-alvenaria", "Alvenaria", "1200.00"),
                expenseTotal("cat-hidraulica", "Hidráulica", "300.00")));

        BudgetOverviewDTO overview = budgetService.getOverview("project-1");
        Map<String, BudgetCategoryDTO> byId = overview.categories().stream()
                .collect(Collectors.toMap(BudgetCategoryDTO::categoryId, Function.identity()));

        BudgetCategoryDTO zeroed = byId.get("cat-alvenaria");
        assertThat(zeroed.plannedAmount()).isEqualByComparingTo("0.00");
        assertThat(zeroed.balanceAmount()).isEqualByComparingTo("-1200.00");
        assertThat(zeroed.percentage()).isNull();
        assertThat(zeroed.state()).isEqualTo(BudgetState.NO_BUDGET);
        assertThat(zeroed.hasBudget()).isTrue();

        BudgetCategoryDTO withoutRecord = byId.get("cat-hidraulica");
        assertThat(withoutRecord.plannedAmount()).isEqualByComparingTo("0.00");
        assertThat(withoutRecord.spentAmount()).isEqualByComparingTo("300.00");
        assertThat(withoutRecord.percentage()).isNull();
        assertThat(withoutRecord.state()).isEqualTo(BudgetState.NO_BUDGET);
        assertThat(withoutRecord.hasBudget()).isFalse();

        BudgetCategoryDTO budgetOnly = byId.get("cat-eletrica");
        assertThat(budgetOnly.spentAmount()).isEqualByComparingTo("0.00");
        assertThat(budgetOnly.percentage()).isEqualByComparingTo("0.0");
        assertThat(budgetOnly.state()).isEqualTo(BudgetState.ON_TRACK);

        assertThat(overview.categories())
                .extracting(BudgetCategoryDTO::categoryName)
                .containsExactly("Alvenaria", "Elétrica", "Hidráulica");
        assertThat(overview.totalPlanned()).isEqualByComparingTo("1000.00");
        assertThat(overview.totalSpent()).isEqualByComparingTo("1500.00");
        assertThat(overview.available()).isEqualByComparingTo("-500.00");
        assertThat(overview.globalPercentage()).isEqualByComparingTo("150.0");
        assertThat(overview.budgetedCategories()).isEqualTo(1);
        assertThat(overview.exceededCategories()).isZero();
    }

    @Test
    void throwsNotFoundWhenTheProjectDoesNotBelongToTheAuthenticatedUser() {
        when(userContextHelper.getAuthenticatedUser()).thenReturn(authenticatedUser());
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-of-another-user", "user-1"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.getOverview("project-of-another-user"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Projeto não encontrado");

        verify(projectRepository).findByIdAndUserIdAndDeletedAtIsNull("project-of-another-user", "user-1");
        verifyNoInteractions(budgetRepository, expenseRepository);
    }

    @Test
    void createsBudgetForOwnedProjectAndReturnsRecalculatedCategory() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        Project project = project("project-1", user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project));
        ExpenseCategory category = ExpenseCategory.builder()
                .id("cat-alvenaria")
                .name("Alvenaria")
                .build();
        when(expenseCategoryRepository.findById("cat-alvenaria")).thenReturn(Optional.of(category));
        when(budgetRepository.findByProjectIdAndCategoryIdAndDeletedAtIsNull("project-1", "cat-alvenaria"))
                .thenReturn(Optional.empty());
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(expenseRepository.sumActiveByCategory("project-1")).thenReturn(List.of(
                expenseTotal("cat-alvenaria", "Alvenaria", "200.00")));

        BudgetCategoryDTO result = budgetService.setBudget(
                "project-1", "cat-alvenaria", new BudgetSetDTO(new BigDecimal("1000.00")));

        assertThat(result.categoryId()).isEqualTo("cat-alvenaria");
        assertThat(result.categoryName()).isEqualTo("Alvenaria");
        assertThat(result.plannedAmount()).isEqualByComparingTo("1000.00");
        assertThat(result.spentAmount()).isEqualByComparingTo("200.00");
        assertThat(result.balanceAmount()).isEqualByComparingTo("800.00");
        assertThat(result.percentage()).isEqualByComparingTo("20.0");
        assertThat(result.state()).isEqualTo(BudgetState.ON_TRACK);
        assertThat(result.hasBudget()).isTrue();

        verify(budgetRepository).save(argThat(budget ->
                budget.getUser() == user
                        && budget.getProject() == project
                        && budget.getCategory() == category
                        && budget.getEstimatedAmount().compareTo(new BigDecimal("1000.00")) == 0
                        && budget.getDeletedAt() == null));
    }

    @Test
    void updatesTheExistingActiveBudgetWithoutCreatingAnotherRow() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        Project project = project("project-1", user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project));
        ExpenseCategory category = ExpenseCategory.builder()
                .id("cat-alvenaria")
                .name("Alvenaria")
                .build();
        when(expenseCategoryRepository.findById("cat-alvenaria")).thenReturn(Optional.of(category));
        Budget existing = budget("cat-alvenaria", "Alvenaria", "500.00");
        existing.setId("budget-1");
        existing.setUser(user);
        existing.setProject(project);
        when(budgetRepository.findByProjectIdAndCategoryIdAndDeletedAtIsNull("project-1", "cat-alvenaria"))
                .thenReturn(Optional.of(existing));
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(expenseRepository.sumActiveByCategory("project-1")).thenReturn(List.of());

        BudgetCategoryDTO result = budgetService.setBudget(
                "project-1", "cat-alvenaria", new BudgetSetDTO(new BigDecimal("1500.00")));

        assertThat(existing.getId()).isEqualTo("budget-1");
        assertThat(existing.getEstimatedAmount()).isEqualByComparingTo("1500.00");
        assertThat(result.plannedAmount()).isEqualByComparingTo("1500.00");
        assertThat(result.spentAmount()).isEqualByComparingTo("0.00");
        assertThat(result.hasBudget()).isTrue();
        verify(budgetRepository, times(1)).save(any(Budget.class));
        verify(budgetRepository).save(existing);
    }

    @Test
    void throwsNotFoundWhenSettingABudgetForAnotherUsersProject() {
        when(userContextHelper.getAuthenticatedUser()).thenReturn(authenticatedUser());
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-of-another-user", "user-1"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.setBudget(
                "project-of-another-user", "cat-alvenaria", new BudgetSetDTO(new BigDecimal("1000.00"))))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Projeto não encontrado");

        verifyNoInteractions(expenseCategoryRepository, budgetRepository, expenseRepository);
    }

    @Test
    void throwsNotFoundWhenTheCategoryDoesNotExist() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project("project-1", user)));
        when(expenseCategoryRepository.findById("cat-inexistente")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.setBudget(
                "project-1", "cat-inexistente", new BudgetSetDTO(new BigDecimal("1000.00"))))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Categoria não encontrada");

        verifyNoInteractions(budgetRepository, expenseRepository);
    }

    @Test
    void zeroesTheExistingBudgetPreservingTheRecordAndRecalculatingTheCategory() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        Project project = project("project-1", user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project));
        Budget existing = budget("cat-alvenaria", "Alvenaria", "1200.00");
        existing.setId("budget-1");
        existing.setUser(user);
        existing.setProject(project);
        when(budgetRepository.findByProjectIdAndCategoryIdAndDeletedAtIsNull("project-1", "cat-alvenaria"))
                .thenReturn(Optional.of(existing));
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(expenseRepository.sumActiveByCategory("project-1")).thenReturn(List.of(
                expenseTotal("cat-alvenaria", "Alvenaria", "300.00")));

        BudgetCategoryDTO result = budgetService.zeroBudget("project-1", "cat-alvenaria");

        assertThat(result.categoryId()).isEqualTo("cat-alvenaria");
        assertThat(result.categoryName()).isEqualTo("Alvenaria");
        assertThat(result.plannedAmount()).isEqualByComparingTo("0.00");
        assertThat(result.spentAmount()).isEqualByComparingTo("300.00");
        assertThat(result.balanceAmount()).isEqualByComparingTo("-300.00");
        assertThat(result.percentage()).isNull();
        assertThat(result.state()).isEqualTo(BudgetState.NO_BUDGET);
        assertThat(result.hasBudget()).isTrue();

        assertThat(existing.getId())
                .as("zera o mesmo registro, sem apagar e recriar")
                .isEqualTo("budget-1");
        assertThat(existing.getDeletedAt()).isNull();
        assertThat(existing.getEstimatedAmount()).isEqualByComparingTo("0.00");
        verify(budgetRepository, times(1)).save(existing);
        verify(budgetRepository, never()).delete(any(Budget.class));
        verify(budgetRepository, never()).deleteById(any(String.class));
    }

    @Test
    void throwsNotFoundWhenThereIsNoActiveBudgetToZero() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project("project-1", user)));
        when(budgetRepository.findByProjectIdAndCategoryIdAndDeletedAtIsNull("project-1", "cat-hidraulica"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.zeroBudget("project-1", "cat-hidraulica"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Orçamento não encontrado");

        verify(budgetRepository, never()).save(any(Budget.class));
        verifyNoInteractions(expenseRepository);
    }

    @Test
    void throwsNotFoundWhenZeroingAnotherUsersProject() {
        when(userContextHelper.getAuthenticatedUser()).thenReturn(authenticatedUser());
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-of-another-user", "user-1"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> budgetService.zeroBudget("project-of-another-user", "cat-alvenaria"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Projeto não encontrado");

        verifyNoInteractions(budgetRepository, expenseRepository);
    }

    @Test
    void rejectsBudgetBelowSpentWithoutMutatingOrSavingTheExistingRecord() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project("project-1", user)));
        Budget existing = budget("cat-alvenaria", "Alvenaria", "2000.00");
        when(expenseCategoryRepository.findById("cat-alvenaria"))
                .thenReturn(Optional.of(existing.getCategory()));
        org.mockito.Mockito.lenient().when(budgetRepository
                .findByProjectIdAndCategoryIdAndDeletedAtIsNull("project-1", "cat-alvenaria"))
                .thenReturn(Optional.of(existing));
        when(expenseRepository.sumActiveByCategory("project-1")).thenReturn(List.of(
                expenseTotal("cat-alvenaria", "Alvenaria", "1234.56")));

        assertThatThrownBy(() -> budgetService.setBudget(
                "project-1", "cat-alvenaria", new BudgetSetDTO(new BigDecimal("1234.55"))))
                .isInstanceOf(BudgetBelowSpentException.class)
                .hasMessage("O orçamento não pode ser menor do que o total de despesas já realizadas nesta categoria: R$ 1.234,56");

        assertThat(existing.getEstimatedAmount()).isEqualByComparingTo("2000.00");
        verify(budgetRepository, never()).save(any(Budget.class));
    }

    @Test
    void acceptsBudgetExactlyEqualToSpentRegardlessOfDecimalScale() {
        User user = authenticatedUser();
        when(userContextHelper.getAuthenticatedUser()).thenReturn(user);
        when(projectRepository.findByIdAndUserIdAndDeletedAtIsNull("project-1", "user-1"))
                .thenReturn(Optional.of(project("project-1", user)));
        Budget existing = budget("cat-alvenaria", "Alvenaria", "2000.00");
        when(expenseCategoryRepository.findById("cat-alvenaria"))
                .thenReturn(Optional.of(existing.getCategory()));
        when(budgetRepository.findByProjectIdAndCategoryIdAndDeletedAtIsNull("project-1", "cat-alvenaria"))
                .thenReturn(Optional.of(existing));
        when(expenseRepository.sumActiveByCategory("project-1")).thenReturn(List.of(
                expenseTotal("cat-alvenaria", "Alvenaria", "1234.50")));

        BudgetCategoryDTO result = budgetService.setBudget(
                "project-1", "cat-alvenaria", new BudgetSetDTO(new BigDecimal("1234.5")));

        assertThat(result.balanceAmount()).isEqualByComparingTo("0.00");
        assertThat(result.percentage()).isEqualByComparingTo("100.0");
        verify(budgetRepository).save(existing);
    }

    private static BudgetCategoryDTO category(BudgetOverviewDTO overview, String categoryId) {
        return overview.categories().stream()
                .filter(category -> category.categoryId().equals(categoryId))
                .findFirst()
                .orElseThrow();
    }

    private static User authenticatedUser() {
        return User.builder()
                .id("user-1")
                .name("Proprietário")
                .email("owner@example.com")
                .password("password")
                .build();
    }

    private static Project project(String id, User user) {
        return Project.builder()
                .id(id)
                .user(user)
                .name("Obra")
                .build();
    }

    private static Budget budget(String categoryId, String categoryName, String amount) {
        return Budget.builder()
                .id("budget-" + categoryId)
                .category(ExpenseCategory.builder().id(categoryId).name(categoryName).build())
                .estimatedAmount(new BigDecimal(amount))
                .build();
    }

    private static ExpenseRepository.CategoryExpenseTotal expenseTotal(
            String categoryId, String categoryName, String total) {
        return new CategoryTotal(categoryId, categoryName, new BigDecimal(total));
    }

    private record CategoryTotal(String id, String name, BigDecimal value)
            implements ExpenseRepository.CategoryExpenseTotal {

        @Override
        public String getCategoryId() {
            return id;
        }

        @Override
        public String getCategoryName() {
            return name;
        }

        @Override
        public BigDecimal getTotal() {
            return value;
        }
    }
}
