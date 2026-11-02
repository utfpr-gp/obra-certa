package com.obracerta.repository;

import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.model.entity.Budget;
import com.obracerta.model.entity.Expense;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.Supplier;
import com.obracerta.model.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = NONE)
class ExpenseRepositoryTest {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ExpenseCategoryRepository expenseCategoryRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private Environment environment;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void validatesThePostgresqlSchemaCreatedByFlywayInTheTestProfile() {
        assertThat(environment.getActiveProfiles()).contains("test");
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(environment.getProperty("spring.flyway.enabled", Boolean.class)).isTrue();
        assertThat(jdbcTemplate.queryForObject("select version()", String.class)).startsWith("PostgreSQL");
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where success = true", Integer.class))
                .isPositive();
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where success = false", Integer.class))
                .isZero();
    }

    @Test
    void sumsOnlyActiveExpensesGroupedByCategoryOfTheRequestedProject() {
        User user = persistUser();
        Project project = persistProject(user, "Obra do painel");
        Project anotherProject = persistProject(user, "Outra obra");
        Supplier supplier = persistSupplier();
        ExpenseCategory alvenaria = persistCategory("Alvenaria de teste " + UUID.randomUUID());
        ExpenseCategory eletrica = persistCategory("Elétrica de teste " + UUID.randomUUID());
        Budget alvenariaBudget = persistBudget(user, project, alvenaria);
        Budget eletricaBudget = persistBudget(user, project, eletrica);
        Budget anotherProjectBudget = persistBudget(user, anotherProject, alvenaria);

        persistExpense(user, project, alvenaria, alvenariaBudget, supplier, "100.00");
        persistExpense(user, project, alvenaria, alvenariaBudget, supplier, "50.00");
        persistExpense(user, project, eletrica, eletricaBudget, supplier, "75.00");
        Expense softDeleted = persistExpense(user, project, alvenaria, alvenariaBudget, supplier, "999.00");
        softDeleted.setDeletedAt(Instant.now());
        expenseRepository.saveAndFlush(softDeleted);
        persistExpense(user, anotherProject, alvenaria, anotherProjectBudget, supplier, "500.00");

        List<ExpenseRepository.CategoryExpenseTotal> totals =
                expenseRepository.sumActiveByCategory(project.getId());

        assertThat(totals).hasSize(2);
        assertThat(totalOf(totals, alvenaria.getId())).isEqualByComparingTo("150.00");
        assertThat(totalOf(totals, eletrica.getId())).isEqualByComparingTo("75.00");
    }

    @Test
    void softDeletedExpensesDoNotProduceAuditTotalsForCategoriesWithoutACeiling() {
        User user = persistUser();
        Project project = persistProject(user, "Obra sem teto");
        Supplier supplier = persistSupplier();
        ExpenseCategory zeroed = persistCategory("Zerada " + UUID.randomUUID());
        ExpenseCategory withoutActiveBudget = persistCategory("Sem registro ativo " + UUID.randomUUID());
        Budget zeroedBudget = persistBudget(user, project, zeroed);
        zeroedBudget.setEstimatedAmount(BigDecimal.ZERO);
        budgetRepository.saveAndFlush(zeroedBudget);
        Budget deletedBudget = persistBudget(user, project, withoutActiveBudget);
        deletedBudget.setDeletedAt(Instant.now());
        budgetRepository.saveAndFlush(deletedBudget);
        Expense zeroedExpense = persistExpense(user, project, zeroed, zeroedBudget, supplier, "100.00");
        Expense unbudgetedExpense = persistExpense(
                user, project, withoutActiveBudget, deletedBudget, supplier, "200.00");

        List<ExpenseRepository.CategoryExpenseTotal> activeTotals =
                expenseRepository.sumActiveByCategory(project.getId());
        assertThat(activeTotals).hasSize(2);
        assertThat(totalOf(activeTotals, zeroed.getId())).isEqualByComparingTo("100.00");
        assertThat(totalOf(activeTotals, withoutActiveBudget.getId())).isEqualByComparingTo("200.00");

        zeroedExpense.setDeletedAt(Instant.now());
        unbudgetedExpense.setDeletedAt(Instant.now());
        expenseRepository.saveAllAndFlush(List.of(zeroedExpense, unbudgetedExpense));

        assertThat(expenseRepository.sumActiveByCategory(project.getId())).isEmpty();
    }

    @Test
    void ownerReportQueryExcludesDeletedExpensesAndExpensesFromAnotherOwner() {
        User owner = persistUser();
        User anotherOwner = persistUser();
        Project project = persistProject(owner, "Obra do proprietário");
        Project anotherProject = persistProject(anotherOwner, "Obra de outro proprietário");
        Supplier supplier = persistSupplier();
        ExpenseCategory category = persistCategory("Categoria protegida " + UUID.randomUUID());
        Budget budget = persistBudget(owner, project, category);
        Budget anotherBudget = persistBudget(anotherOwner, anotherProject, category);

        persistExpense(owner, project, category, budget, supplier, "125.00");
        Expense deleted = persistExpense(owner, project, category, budget, supplier, "999.00");
        deleted.setDeletedAt(Instant.now());
        expenseRepository.saveAndFlush(deleted);
        persistExpense(anotherOwner, anotherProject, category, anotherBudget, supplier, "500.00");

        List<ExpenseRepository.CategoryExpenseTotal> totals =
                expenseRepository.sumActiveByCategoryAndOwner(project.getId(), owner.getId());

        assertThat(totals).hasSize(1);
        assertThat(totalOf(totals, category.getId())).isEqualByComparingTo("125.00");
        assertThat(expenseRepository.sumActiveByCategoryAndOwner(project.getId(), anotherOwner.getId()))
                .isEmpty();
    }

    private static BigDecimal totalOf(
            List<ExpenseRepository.CategoryExpenseTotal> totals, String categoryId) {
        return totals.stream()
                .filter(total -> total.getCategoryId().equals(categoryId))
                .findFirst()
                .orElseThrow()
                .getTotal();
    }

    private User persistUser() {
        return userRepository.saveAndFlush(User.builder()
                .name("Usuário de repositório")
                .email("expense-repository-" + UUID.randomUUID() + "@example.com")
                .password("password")
                .userRole(UserRole.USER)
                .build());
    }

    private Project persistProject(User user, String name) {
        return projectRepository.saveAndFlush(Project.builder()
                .user(user)
                .name(name)
                .type(ProjectType.NEW_CONSTRUCTION)
                .status(ProjectStatus.IN_PROGRESS)
                .location("Local")
                .build());
    }

    private Supplier persistSupplier() {
        return supplierRepository.saveAndFlush(Supplier.builder()
                .name("Fornecedor " + UUID.randomUUID())
                .document(UUID.randomUUID().toString())
                .build());
    }

    private ExpenseCategory persistCategory(String name) {
        return expenseCategoryRepository.saveAndFlush(ExpenseCategory.builder()
                .name(name)
                .build());
    }

    private Budget persistBudget(User user, Project project, ExpenseCategory category) {
        return budgetRepository.saveAndFlush(Budget.builder()
                .user(user)
                .project(project)
                .category(category)
                .estimatedAmount(new BigDecimal("1000.00"))
                .build());
    }

    private Expense persistExpense(
            User user,
            Project project,
            ExpenseCategory category,
            Budget budget,
            Supplier supplier,
            String amount) {
        BigDecimal total = new BigDecimal(amount);
        return expenseRepository.saveAndFlush(Expense.builder()
                .budget(budget)
                .project(project)
                .user(user)
                .category(category)
                .supplier(supplier)
                .type("MATERIAL")
                .description("Despesa de teste")
                .quantity(BigDecimal.ONE)
                .unit("un")
                .unitPrice(total)
                .totalPrice(total)
                .purchaseDate(LocalDate.of(2026, 10, 1))
                .build());
    }
}
