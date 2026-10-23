package com.obracerta.service;

import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.UserRole;
import com.obracerta.model.entity.Budget;
import com.obracerta.model.entity.Expense;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.Supplier;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.SupplierRepository;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Prova o cenário determinístico do seed de demonstração (US07) e a idempotência
 * pela chave e-mail do usuário demo + nome da obra demo.
 */
@ExtendWith(MockitoExtension.class)
class DemoDataSeederServiceTest {

    private static final String DEMO_EMAIL = "demo@obracerta.com";
    private static final String DEMO_PROJECT_NAME = "Obra Demo";
    private static final String RAW_PASSWORD = "senha-crua-do-runner";
    private static final String ENCODED_PASSWORD = "$2a$10$hash-gerado-pelo-encoder";

    private static final String FUNDACAO = "Fundação e Estrutura";
    private static final String ALVENARIA = "Alvenaria";
    private static final String ELETRICA = "Elétrica";
    private static final String HIDRAULICA = "Hidráulica";
    private static final String MAO_DE_OBRA = "Mão de Obra";

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseCategoryRepository expenseCategoryRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private DemoDataSeederService service;

    private List<ExpenseCategory> categories;

    @BeforeEach
    void setUp() {
        categories = usedCategories();
        service = new DemoDataSeederService(
                userRepository,
                projectRepository,
                supplierRepository,
                budgetRepository,
                expenseRepository,
                expenseCategoryRepository,
                passwordEncoder);
    }

    @Test
    void seedsDemoUserProjectSupplierBudgetsAndExpensesOnFirstRun() {
        stubEmptyDemoData();

        service.seed(RAW_PASSWORD);

        User savedUser = captureUser();
        verify(passwordEncoder).encode(RAW_PASSWORD);
        assertThat(savedUser.getEmail()).isEqualTo(DEMO_EMAIL);
        assertThat(savedUser.getPassword()).isEqualTo(ENCODED_PASSWORD);
        assertThat(savedUser.getPassword()).isNotEqualTo(RAW_PASSWORD);
        assertThat(savedUser.getUserRole()).isEqualTo(UserRole.USER);

        Project savedProject = captureProject();
        assertThat(savedProject.getName()).isEqualTo(DEMO_PROJECT_NAME);
        assertThat(savedProject.getUser()).isSameAs(savedUser);
        assertThat(savedProject.getStatus()).isEqualTo(ProjectStatus.IN_PROGRESS);

        Supplier savedSupplier = captureSupplier();
        assertThat(savedSupplier.getName()).isNotBlank();

        Map<String, Budget> budgetsByCategory = captureBudgets();
        assertThat(budgetsByCategory.keySet()).containsExactlyInAnyOrder(
                FUNDACAO, ALVENARIA, ELETRICA, HIDRAULICA, MAO_DE_OBRA);

        assertThat(budgetsByCategory.get(FUNDACAO).getEstimatedAmount()).isEqualByComparingTo("45000.00");
        assertThat(budgetsByCategory.get(ALVENARIA).getEstimatedAmount()).isEqualByComparingTo("12000.00");
        assertThat(budgetsByCategory.get(ELETRICA).getEstimatedAmount()).isEqualByComparingTo("8000.00");
        assertThat(budgetsByCategory.get(HIDRAULICA).getEstimatedAmount()).isEqualByComparingTo("0.00");
        assertThat(budgetsByCategory.get(MAO_DE_OBRA).getEstimatedAmount()).isEqualByComparingTo("20000.00");
        assertThat(budgetsByCategory.values().stream()
                .map(Budget::getEstimatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)).isEqualByComparingTo("85000.00");

        for (Budget budget : budgetsByCategory.values()) {
            assertThat(budget.getProject()).isSameAs(savedProject);
            assertThat(budget.getUser()).isSameAs(savedUser);
        }

        List<Expense> expenses = captureExpenses();
        assertThat(expenses).hasSize(6);
        assertThat(expenses.stream()
                .map(Expense::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)).isEqualByComparingTo("53100.00");

        Map<String, ExpenseCategory> categoriesByName = categories.stream()
                .collect(Collectors.toMap(ExpenseCategory::getName, Function.identity()));

        assertThat(totalByCategory(expenses, FUNDACAO)).isEqualByComparingTo("15500.00");
        assertThat(totalByCategory(expenses, ALVENARIA)).isEqualByComparingTo("11400.00");
        assertThat(totalByCategory(expenses, ELETRICA)).isEqualByComparingTo("9000.00");
        assertThat(totalByCategory(expenses, HIDRAULICA)).isEqualByComparingTo("1200.00");
        assertThat(totalByCategory(expenses, MAO_DE_OBRA)).isEqualByComparingTo("16000.00");

        for (Expense expense : expenses) {
            String categoryName = expense.getCategory().getName();
            assertThat(expense.getBudget()).isSameAs(budgetsByCategory.get(categoryName));
            assertThat(expense.getProject()).isSameAs(savedProject);
            assertThat(expense.getUser()).isSameAs(savedUser);
            assertThat(expense.getCategory()).isSameAs(categoriesByName.get(categoryName));
            assertThat(expense.getSupplier()).isSameAs(savedSupplier);
            assertThat(expense.getQuantity()).isEqualByComparingTo("1");
            assertThat(expense.getUnit()).isEqualTo("un");
            assertThat(expense.getUnitPrice()).isEqualByComparingTo(expense.getTotalPrice());
            assertThat(expense.getPurchaseDate()).isNotNull();
        }

        // Cenário do CA3: a despesa de Hidráulica aponta para o orçamento zerado da categoria.
        Expense hidraulicaExpense = expenses.stream()
                .filter(expense -> HIDRAULICA.equals(expense.getCategory().getName()))
                .findFirst()
                .orElseThrow();
        assertThat(hidraulicaExpense.getBudget()).isSameAs(budgetsByCategory.get(HIDRAULICA));
        assertThat(hidraulicaExpense.getTotalPrice()).isEqualByComparingTo("1200.00");
        assertThat(budgetsByCategory.get(HIDRAULICA).getEstimatedAmount()).isEqualByComparingTo("0.00");

        assertThat(expenses).extracting(Expense::getType)
                .containsExactlyInAnyOrder("MATERIAL", "MATERIAL", "MATERIAL", "LABOR", "LABOR", "SERVICE");

        // O seed não cria nem altera categorias: elas vêm da migration V7.
        verify(expenseCategoryRepository, never()).save(any());
        verify(expenseCategoryRepository, never()).saveAll(any());
    }

    @Test
    void doesNotSeedAgainWhenDemoProjectAlreadyExists() {
        User existingUser = User.builder().id("user-demo").name("Demo").email(DEMO_EMAIL).build();
        Project existingProject = Project.builder()
                .id("project-demo")
                .user(existingUser)
                .name(DEMO_PROJECT_NAME)
                .build();

        when(userRepository.findByEmail(DEMO_EMAIL)).thenReturn(Optional.of(existingUser));
        when(projectRepository.findByUserIdAndDeletedAtIsNull("user-demo")).thenReturn(List.of(existingProject));

        service.seed(RAW_PASSWORD);

        verify(userRepository, never()).save(any());
        verify(projectRepository, never()).save(any());
        verify(supplierRepository, never()).save(any());
        verify(budgetRepository, never()).save(any());
        verify(expenseRepository, never()).save(any());
        verify(expenseCategoryRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void failsWhenACategoryUsedByTheDemoScenarioIsMissing() {
        when(userRepository.findByEmail(DEMO_EMAIL)).thenReturn(Optional.empty());
        when(expenseCategoryRepository.findAll()).thenReturn(categories.stream()
                .filter(category -> !HIDRAULICA.equals(category.getName()))
                .toList());

        assertThatThrownBy(() -> service.seed(RAW_PASSWORD))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(HIDRAULICA);

        verify(userRepository, never()).save(any());
        verify(projectRepository, never()).save(any());
        verify(supplierRepository, never()).save(any());
        verify(budgetRepository, never()).save(any());
        verify(expenseRepository, never()).save(any());
        verify(expenseCategoryRepository, never()).save(any());
    }

    private void stubEmptyDemoData() {
        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_PASSWORD);

        when(userRepository.findByEmail(DEMO_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("user-demo");
            return user;
        });

        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project project = invocation.getArgument(0);
            project.setId("project-demo");
            return project;
        });

        when(supplierRepository.findFirstByName(anyString())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier supplier = invocation.getArgument(0);
            supplier.setId("supplier-demo");
            return supplier;
        });

        when(expenseCategoryRepository.findAll()).thenReturn(categories);

        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> {
            Budget budget = invocation.getArgument(0);
            budget.setId("budget-" + budget.getCategory().getName());
            return budget;
        });

        AtomicInteger expensesCounter = new AtomicInteger();
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> {
            Expense expense = invocation.getArgument(0);
            expense.setId("expense-" + expensesCounter.incrementAndGet());
            return expense;
        });
    }

    private User captureUser() {
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(captor.capture());
        return captor.getValue();
    }

    private Project captureProject() {
        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository, times(1)).save(captor.capture());
        return captor.getValue();
    }

    private Supplier captureSupplier() {
        ArgumentCaptor<Supplier> captor = ArgumentCaptor.forClass(Supplier.class);
        verify(supplierRepository, times(1)).save(captor.capture());
        return captor.getValue();
    }

    private Map<String, Budget> captureBudgets() {
        ArgumentCaptor<Budget> captor = ArgumentCaptor.forClass(Budget.class);
        verify(budgetRepository, times(5)).save(captor.capture());
        return captor.getAllValues().stream()
                .collect(Collectors.toMap(budget -> budget.getCategory().getName(), Function.identity()));
    }

    private List<Expense> captureExpenses() {
        ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository, times(6)).save(captor.capture());
        return captor.getAllValues();
    }

    private static BigDecimal totalByCategory(List<Expense> expenses, String categoryName) {
        return expenses.stream()
                .filter(expense -> categoryName.equals(expense.getCategory().getName()))
                .map(Expense::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static List<ExpenseCategory> usedCategories() {
        return List.of(
                category("cat-fundacao", FUNDACAO),
                category("cat-alvenaria", ALVENARIA),
                category("cat-eletrica", ELETRICA),
                category("cat-hidraulica", HIDRAULICA),
                category("cat-mao-de-obra", MAO_DE_OBRA));
    }

    private static ExpenseCategory category(String id, String name) {
        return ExpenseCategory.builder().id(id).name(name).build();
    }
}
