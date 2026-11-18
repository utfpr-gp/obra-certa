package com.obracerta.service;

import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Semeia um cenário de demonstração completo (usuário, obra, fornecedor, orçamentos e
 * despesas) para o perfil dev, enquanto não existe cadastro nem listagem de despesas no
 * produto (US03/US05).
 * TODO #5: substituir a fonte provisória de despesas pelo cadastro do produto (US03).
 * TODO #7: integrar a listagem de despesas do produto (US05), encerrando a premissa
 * de que o seeder é a única fonte de despesas desta história.
 *
 * <p>Idempotência: a raiz do grafo é a obra demo. Se o usuário demo já possui uma obra
 * com o nome demo, o método retorna antes de qualquer save. Se o usuário existe mas a
 * obra não, o restante do cenário é completado.
 *
 * <p>O cenário cobre os estados do painel de orçamentos: uma categoria próxima do teto
 * (amarelo), uma estourada (vermelho) e uma zerada com despesa (alerta de auditoria,
 * CA3). Nenhuma categoria é criada aqui: elas vêm da migration V7.
 *
 * <p>A validação de categorias cobre apenas as usadas por este cenário (a união das
 * categorias de {@code DEMO_BUDGETS} e {@code DEMO_EXPENSES}), não todas as pré-definidas
 * da V7. Se uma migration futura renomear uma categoria que o seed nunca toca, o seed
 * continua funcionando.
 */
@Service
public class DemoDataSeederService {

    static final String DEMO_USER_NAME = "Proprietário Demo";
    static final String DEMO_USER_EMAIL = "demo@obracerta.com";
    static final String DEMO_PROJECT_NAME = "Obra Demo";
    static final String DEMO_PROJECT_LOCATION = "São Paulo - SP";
    static final String DEMO_SUPPLIER_NAME = "Fornecedor Demo";
    static final String DEMO_SUPPLIER_DOCUMENT = "12345678000199";
    static final String DEMO_SUPPLIER_EMAIL = "contato@fornecedordemo.com.br";
    static final String DEMO_SUPPLIER_PHONE = "(11) 4002-8922";

    private static final List<DemoBudget> DEMO_BUDGETS = List.of(
            new DemoBudget("Fundação e Estrutura", "45000.00"),
            new DemoBudget("Alvenaria", "12000.00"),
            new DemoBudget("Elétrica", "8000.00"),
            // CA3: teto zerado, mas o registro existe porque expenses.budget_id é NOT NULL.
            new DemoBudget("Hidráulica", "0.00"),
            new DemoBudget("Mão de Obra", "20000.00"));

    private static final List<DemoExpense> DEMO_EXPENSES = List.of(
            new DemoExpense("Fundação e Estrutura", "Concreto usinado e armadura",
                    "MATERIAL", LocalDate.of(2026, 10, 1), "15500.00"),
            new DemoExpense("Alvenaria", "Blocos cerâmicos e argamassa",
                    "MATERIAL", LocalDate.of(2026, 10, 3), "11400.00"),
            new DemoExpense("Elétrica", "Fiação, conduítes e quadro de distribuição",
                    "MATERIAL", LocalDate.of(2026, 10, 5), "5000.00"),
            new DemoExpense("Elétrica", "Mão de obra da instalação elétrica",
                    "LABOR", LocalDate.of(2026, 10, 6), "4000.00"),
            new DemoExpense("Hidráulica", "Tubulação e conexões hidráulicas",
                    "SERVICE", LocalDate.of(2026, 10, 8), "1200.00"),
            new DemoExpense("Mão de Obra", "Mão de obra da equipe da obra",
                    "LABOR", LocalDate.of(2026, 10, 10), "16000.00"));

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SupplierRepository supplierRepository;
    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeederService(
            UserRepository userRepository,
            ProjectRepository projectRepository,
            SupplierRepository supplierRepository,
            BudgetRepository budgetRepository,
            ExpenseRepository expenseRepository,
            ExpenseCategoryRepository expenseCategoryRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.supplierRepository = supplierRepository;
        this.budgetRepository = budgetRepository;
        this.expenseRepository = expenseRepository;
        this.expenseCategoryRepository = expenseCategoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void seed(String rawPassword) {
        User user = userRepository.findByEmail(DEMO_USER_EMAIL).orElse(null);

        if (user != null && demoProjectExists(user)) {
            return;
        }

        Map<String, ExpenseCategory> categories = loadCategoriesByName();

        if (user == null) {
            user = createDemoUser(rawPassword);
        }

        Project project = createDemoProject(user);
        Supplier supplier = findOrCreateDemoSupplier();
        Map<String, Budget> budgets = createBudgets(user, project, categories);

        for (DemoExpense demoExpense : DEMO_EXPENSES) {
            createExpense(user, project, supplier, categories, budgets, demoExpense);
        }
    }

    private User createDemoUser(String rawPassword) {
        return userRepository.save(
                new User(DEMO_USER_NAME, DEMO_USER_EMAIL, passwordEncoder.encode(rawPassword)));
    }

    private boolean demoProjectExists(User user) {
        return projectRepository.findByUserIdAndDeletedAtIsNull(user.getId()).stream()
                .anyMatch(project -> DEMO_PROJECT_NAME.equals(project.getName()));
    }

    private Project createDemoProject(User user) {
        return projectRepository.save(Project.builder()
                .user(user)
                .name(DEMO_PROJECT_NAME)
                .type(ProjectType.RENOVATION)
                .location(DEMO_PROJECT_LOCATION)
                .status(ProjectStatus.IN_PROGRESS)
                .build());
    }

    private Supplier findOrCreateDemoSupplier() {
        return supplierRepository.findFirstByName(DEMO_SUPPLIER_NAME)
                .orElseGet(() -> supplierRepository.save(Supplier.builder()
                        .name(DEMO_SUPPLIER_NAME)
                        .document(DEMO_SUPPLIER_DOCUMENT)
                        .email(DEMO_SUPPLIER_EMAIL)
                        .phone(DEMO_SUPPLIER_PHONE)
                        .build()));
    }

    private Map<String, ExpenseCategory> loadCategoriesByName() {
        Map<String, ExpenseCategory> categoriesByName = expenseCategoryRepository.findAll().stream()
                .collect(Collectors.toMap(
                        ExpenseCategory::getName,
                        Function.identity(),
                        (first, second) -> first));

        List<String> missing = requiredCategoryNames().stream()
                .filter(name -> !categoriesByName.containsKey(name))
                .toList();

        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "Categorias necessárias ao seed de demonstração ausentes no banco (migration V7): "
                            + String.join(", ", missing));
        }

        return categoriesByName;
    }

    /**
     * União das categorias usadas pelo cenário, na ordem em que aparecem em orçamentos e
     * despesas. Derivada dos dados do cenário — nunca uma cópia da lista da V7.
     */
    private static List<String> requiredCategoryNames() {
        return Stream.concat(
                        DEMO_BUDGETS.stream().map(DemoBudget::categoryName),
                        DEMO_EXPENSES.stream().map(DemoExpense::categoryName))
                .distinct()
                .toList();
    }

    private Map<String, Budget> createBudgets(
            User user,
            Project project,
            Map<String, ExpenseCategory> categories) {
        Map<String, Budget> budgetsByCategory = new LinkedHashMap<>();

        for (DemoBudget demoBudget : DEMO_BUDGETS) {
            Budget budget = budgetRepository.save(Budget.builder()
                    .user(user)
                    .project(project)
                    .category(categories.get(demoBudget.categoryName()))
                    .estimatedAmount(new BigDecimal(demoBudget.estimatedAmount()))
                    .build());
            budgetsByCategory.put(demoBudget.categoryName(), budget);
        }

        return budgetsByCategory;
    }

    private void createExpense(
            User user,
            Project project,
            Supplier supplier,
            Map<String, ExpenseCategory> categories,
            Map<String, Budget> budgets,
            DemoExpense demoExpense) {
        BigDecimal totalPrice = new BigDecimal(demoExpense.amount());

        expenseRepository.save(Expense.builder()
                .budget(budgets.get(demoExpense.categoryName()))
                .project(project)
                .user(user)
                .category(categories.get(demoExpense.categoryName()))
                .supplier(supplier)
                .type(demoExpense.type())
                .description(demoExpense.description())
                .quantity(BigDecimal.ONE)
                .unit("un")
                .unitPrice(totalPrice)
                .totalPrice(totalPrice)
                .purchaseDate(demoExpense.purchaseDate())
                .build());
    }

    private record DemoBudget(String categoryName, String estimatedAmount) {
    }

    private record DemoExpense(
            String categoryName,
            String description,
            String type,
            LocalDate purchaseDate,
            String amount) {
    }
}
