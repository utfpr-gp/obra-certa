package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.PaymentStatus;
import com.obracerta.exception.ExpenseValidationException;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.integration.NfeXmlParser;
import com.obracerta.mapper.ExpenseMapper;
import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.model.dto.nfe.NfeImportRequestDTO;
import com.obracerta.model.dto.nfe.NfePreviewResponseDTO;
import com.obracerta.model.entity.Expense;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.PendingPayment;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.Supplier;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NfeImportService {

    private final UserContextHelper identity;
    private final ProjectRepository projects;
    private final NfeXmlParser parser;
    private final NfeKeyGuard keyGuard;
    private final ExpenseCategoryRepository categories;
    private final SupplierRepository suppliers;
    private final BudgetRepository budgets;
    private final ExpenseRepository expenses;
    private final ExpenseReferenceResolver references;

    public NfeImportService(UserContextHelper identity, ProjectRepository projects,
                            NfeXmlParser parser, NfeKeyGuard keyGuard,
                            ExpenseCategoryRepository categories, SupplierRepository suppliers,
                            BudgetRepository budgets, ExpenseRepository expenses) {
        this.identity = identity;
        this.projects = projects;
        this.parser = parser;
        this.keyGuard = keyGuard;
        this.categories = categories;
        this.suppliers = suppliers;
        this.budgets = budgets;
        this.expenses = expenses;
        this.references = new ExpenseReferenceResolver(budgets, suppliers);
    }

    // Só leitura: nada é gravado. Trava de chave fica para a confirmação.
    public NfePreviewResponseDTO preview(String projectId, byte[] xml) {
        var owner = identity.getAuthenticatedUser();
        projects.findByIdAndUserIdAndDeletedAtIsNull(projectId, owner.getId())
                .orElseThrow(ResourceNotFoundException::new);
        var preview = parser.parse(projectId, xml);
        keyGuard.ensureNotRegisteredWithoutLock(projectId, preview.accessKey());
        return preview;
    }

    // Valida toda a escolha antes de travar a obra; a trava (ensureNotRegistered) dura ate o commit.
    @Transactional
    public List<ExpenseResponseDTO> confirm(String projectId, byte[] xml, NfeImportRequestDTO request) {
        var owner = identity.getAuthenticatedUser();
        Project project = projects.findByIdAndUserIdAndDeletedAtIsNull(projectId, owner.getId())
                .orElseThrow(ResourceNotFoundException::new);
        var preview = parser.parse(projectId, xml);

        Map<Integer, String> chosen = new HashMap<>();
        for (var choice : request.items() == null ? List.<NfeImportRequestDTO.Item>of() : request.items()) {
            chosen.put(choice.itemNumber(), choice.categoryId());
        }
        var xmlNumbers = preview.items().stream().map(NfePreviewResponseDTO.Item::itemNumber).toList();

        var withoutCategory = xmlNumbers.stream()
                .filter(number -> chosen.get(number) == null || chosen.get(number).isBlank())
                .toList();
        if (!withoutCategory.isEmpty())
            invalid("Itens sem categoria: " + join(withoutCategory));

        var outsideXml = chosen.keySet().stream().filter(number -> !xmlNumbers.contains(number)).sorted().toList();
        if (!outsideXml.isEmpty())
            invalid("Itens fora da nota: " + join(outsideXml));

        Map<Integer, ExpenseCategory> category = new HashMap<>();
        var invalidCategory = new ArrayList<Integer>();
        for (int number : xmlNumbers) {
            var found = categories.findById(chosen.get(number));
            if (found.isEmpty()) invalidCategory.add(number);
            else category.put(number, found.get());
        }
        if (!invalidCategory.isEmpty())
            invalid("Categoria inválida nos itens: " + join(invalidCategory));

        keyGuard.ensureNotRegistered(projectId, preview.accessKey());

        var emitter = preview.supplier();
        Supplier supplier = references.findOrCreateSupplier(owner, emitter.document(), emitter.name());

        var created = new ArrayList<ExpenseResponseDTO>();
        for (var item : preview.items()) {
            ExpenseCategory itemCategory = category.get(item.itemNumber());
            boolean paid = false;
            Expense expense = Expense.builder().user(owner).project(project)
                    .category(itemCategory).supplier(supplier)
                    .budget(references.resolveBudget(project.getId(), itemCategory.getId()))
                    .type("MATERIAL").description(item.description())
                    .quantity(item.quantity()).unit(item.unit())
                    .unitPrice(item.unitPrice()).totalPrice(item.totalPrice())
                    .purchaseDate(preview.issueDate()).nfeKey(preview.accessKey())
                    .receiptState("NONE").paid(paid).build();
            if (!paid) {
                expense.setPendingPayment(PendingPayment.builder()
                        .expense(expense)
                        .status(PaymentStatus.PENDING)
                        .dueDate(preview.issueDate())
                        .paidAt(null)
                        .build());
            }
            created.add(ExpenseMapper.toDTO(expenses.save(expense)));
        }
        return created;
    }

    private static String join(List<Integer> numbers) {
        return numbers.stream().map(String::valueOf).collect(Collectors.joining(", "));
    }

    private static void invalid(String message) {
        throw new ExpenseValidationException(message);
    }
}
