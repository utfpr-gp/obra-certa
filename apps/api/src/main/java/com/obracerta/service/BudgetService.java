package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.BudgetState;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.exception.BudgetBelowSpentException;
import com.obracerta.model.dto.budget.BudgetCategoryDTO;
import com.obracerta.model.dto.budget.BudgetOverviewDTO;
import com.obracerta.model.dto.budget.BudgetSetDTO;
import com.obracerta.model.dto.budget.SinapiCategoryShareDTO;
import com.obracerta.model.dto.budget.SinapiConfirmDTO;
import com.obracerta.model.dto.budget.SinapiConfirmationDTO;
import com.obracerta.model.dto.budget.SinapiReferencesDTO;
import com.obracerta.exception.SinapiReferenceException;
import com.obracerta.model.entity.Budget;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.service.SinapiAllocationCalculator.Parcel;
import com.obracerta.service.SinapiAllocationCalculator.Share;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    private final SinapiReferenceService sinapiReferences;
    private final TransactionTemplate transactionTemplate;

    public BudgetService(
            ProjectRepository projectRepository,
            UserContextHelper userContextHelper,
            BudgetRepository budgetRepository,
            ExpenseCategoryRepository expenseCategoryRepository,
            ExpenseRepository expenseRepository,
            SinapiReferenceService sinapiReferences,
            TransactionTemplate transactionTemplate) {
        this.projectRepository = projectRepository;
        this.userContextHelper = userContextHelper;
        this.budgetRepository = budgetRepository;
        this.expenseCategoryRepository = expenseCategoryRepository;
        this.expenseRepository = expenseRepository;
        this.sinapiReferences = sinapiReferences;
        this.transactionTemplate = transactionTemplate;
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

        BigDecimal spent = spentOfCategory(project.getId(), category.getId());
        if (request.estimatedAmount().compareTo(BigDecimal.ZERO) > 0
                && request.estimatedAmount().compareTo(spent) < 0) {
            throw new BudgetBelowSpentException(spent);
        }

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
        row.spentAmount = spent;
        row.hasBudget = true;
        return toCategory(row);
    }

    @Transactional
    public BudgetCategoryDTO zeroBudget(String projectId, String categoryId) {
        User user = userContextHelper.getAuthenticatedUser();
        Project project = projectRepository.findByIdAndUserIdAndDeletedAtIsNull(projectId, user.getId())
                .orElseThrow(ResourceNotFoundException::new);
        ExpenseCategory category = expenseCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        Budget budget = budgetRepository
                .findByProjectIdAndCategoryIdAndDeletedAtIsNull(project.getId(), category.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Orçamento não encontrado"));

        budget.setEstimatedAmount(ZERO);
        budgetRepository.save(budget);

        CategoryRow row = new CategoryRow(category.getId(), category.getName());
        row.plannedAmount = ZERO;
        row.spentAmount = spentOfCategory(project.getId(), category.getId());
        row.hasBudget = true;
        return toCategory(row);
    }

    /**
     * Confirma o rateio SINAPI. Ordem das checagens: titularidade (404) → payload (400) →
     * consulta ao SIDRA (503) → custo igual ao da prévia (409) → gravação em uma transação.
     * A consulta e as checagens ficam fora da transação; só a gravação entra nela.
     */
    public SinapiConfirmationDTO confirmSinapi(String projectId, SinapiConfirmDTO request) {
        User user = userContextHelper.getAuthenticatedUser();
        Project project = projectRepository.findByIdAndUserIdAndDeletedAtIsNull(projectId, user.getId())
                .orElseThrow(ResourceNotFoundException::new);

        Map<String, ExpenseCategory> categories = categoriesInPrdOrder(request.percentages());
        List<Share> shares = request.percentages().stream()
                .map(share -> new Share(share.categoryId(), share.percentage()))
                .toList();
        List<Parcel> parcels = allocate(
                SinapiAllocationCalculator.estimate(request.unitCost(), request.area()), shares);

        SinapiReferencesDTO references = sinapiReferences.getReferences(
                project.getId(), request.uf(), request.month(), request.projectType());
        boolean sameCost = references.finishes().stream().anyMatch(finish ->
                finish.id().equals(request.finishId()) && finish.unitCost().compareTo(request.unitCost()) == 0);
        if (!sameCost) {
            throw new SinapiReferenceException(HttpStatus.CONFLICT,
                    "O custo por m² mudou desde a prévia. Consulte o SINAPI novamente para gerar uma nova prévia.");
        }

        return transactionTemplate.execute(status -> writeBudgets(user, project, parcels, categories));
    }

    /**
     * Grava os tetos do lote. Categorias com teto ativo (inclusive zerado) são preservadas e as
     * parcelas zeradas não geram teto. A inserção usa ON CONFLICT, então uma corrida perdida não
     * aborta a transação; qualquer outra falha reverte o lote inteiro.
     */
    private SinapiConfirmationDTO writeBudgets(User user, Project project, List<Parcel> parcels,
                                               Map<String, ExpenseCategory> categories) {
        Set<String> active = budgetRepository.findByProjectIdAndDeletedAtIsNull(project.getId()).stream()
                .map(budget -> budget.getCategory().getId())
                .collect(Collectors.toSet());
        List<SinapiConfirmationDTO.Created> created = new ArrayList<>();
        List<SinapiConfirmationDTO.Preserved> preserved = new ArrayList<>();
        for (Parcel parcel : parcels) {
            if (parcel.amount().signum() == 0) {
                continue;
            }
            ExpenseCategory category = categories.get(parcel.categoryId());
            boolean inserted = !active.contains(category.getId())
                    && budgetRepository.insertIfAbsent(UUID.randomUUID().toString(), user.getId(),
                    project.getId(), category.getId(), parcel.amount()) == 1;
            if (inserted) {
                created.add(new SinapiConfirmationDTO.Created(category.getId(), category.getName(), parcel.amount()));
            } else {
                preserved.add(new SinapiConfirmationDTO.Preserved(category.getId(), category.getName()));
            }
        }
        return new SinapiConfirmationDTO(created, preserved);
    }

    /** Categorias únicas, existentes e na ordem do PRD; caso contrário, 400 antes de qualquer consulta. */
    private Map<String, ExpenseCategory> categoriesInPrdOrder(List<SinapiCategoryShareDTO> percentages) {
        List<String> ids = percentages.stream().map(SinapiCategoryShareDTO::categoryId).toList();
        if (new HashSet<>(ids).size() != ids.size()) {
            throw badRequest("Cada categoria deve aparecer uma única vez.");
        }
        Map<String, ExpenseCategory> found = expenseCategoryRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(ExpenseCategory::getId, Function.identity()));
        if (found.size() != ids.size()) {
            throw badRequest("Categoria inválida.");
        }
        int previous = -1;
        for (String id : ids) {
            int position = SinapiPrdOrder.position(found.get(id).getName());
            if (position < 0 || position <= previous) {
                throw badRequest("As categorias devem seguir a ordem do PRD.");
            }
            previous = position;
        }
        return found;
    }

    private static List<Parcel> allocate(BigDecimal total, List<Share> shares) {
        try {
            return SinapiAllocationCalculator.allocate(total, shares);
        } catch (IllegalArgumentException exception) {
            throw badRequest(exception.getMessage());
        }
    }

    private static SinapiReferenceException badRequest(String message) {
        return new SinapiReferenceException(HttpStatus.BAD_REQUEST, message);
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
