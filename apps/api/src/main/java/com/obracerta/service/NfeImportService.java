package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.PaymentStatus;
import com.obracerta.exception.ExpenseValidationException;
import com.obracerta.exception.ReceiptException;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.integration.NfeXmlParser;
import com.obracerta.integration.ReceiptStorage;
import com.obracerta.mapper.ExpenseMapper;
import com.obracerta.model.dto.expense.ExpenseResponseDTO;
import com.obracerta.model.dto.nfe.NfeImportRequestDTO;
import com.obracerta.model.dto.nfe.NfePreviewResponseDTO;
import com.obracerta.model.entity.Expense;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.PendingPayment;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.Supplier;
import com.obracerta.model.entity.User;
import com.obracerta.repository.BudgetRepository;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.SupplierRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NfeImportService {

    private static final String XML_CONTENT_TYPE = "application/xml";
    private static final String RECEIPT_UNAVAILABLE = "Não foi possível enviar o comprovante. Tente novamente.";

    private final UserContextHelper identity;
    private final ProjectRepository projects;
    private final NfeXmlParser parser;
    private final NfeKeyGuard keyGuard;
    private final ExpenseCategoryRepository categories;
    private final SupplierRepository suppliers;
    private final BudgetRepository budgets;
    private final ExpenseRepository expenses;
    private final ReceiptStorage storage;
    private final NfeReceiptCleanupService cleanup;
    private final TransactionTemplate transactions;
    private final ExpenseReferenceResolver references;

    public NfeImportService(UserContextHelper identity, ProjectRepository projects,
                            NfeXmlParser parser, NfeKeyGuard keyGuard,
                            ExpenseCategoryRepository categories, SupplierRepository suppliers,
                            BudgetRepository budgets, ExpenseRepository expenses,
                            ReceiptStorage storage, NfeReceiptCleanupService cleanup,
                            PlatformTransactionManager transactionManager) {
        this.identity = identity;
        this.projects = projects;
        this.parser = parser;
        this.keyGuard = keyGuard;
        this.categories = categories;
        this.suppliers = suppliers;
        this.budgets = budgets;
        this.expenses = expenses;
        this.storage = storage;
        this.cleanup = cleanup;
        this.transactions = new TransactionTemplate(transactionManager);
        this.transactions.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
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

    // A intenção confirmada antes do PUT sobrevive ao rollback. A confirmação mantém
    // sua trava até gravar as despesas e remover a intenção na mesma transação.
    public List<ExpenseResponseDTO> confirm(String projectId, MultipartFile file, NfeImportRequestDTO request)
            throws IOException {
        var owner = identity.getAuthenticatedUser();
        Project project = projects.findByIdAndUserIdAndDeletedAtIsNull(projectId, owner.getId())
                .orElseThrow(ResourceNotFoundException::new);
        byte[] xml = file.getBytes();
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

        boolean paid = isPaid(request);
        String contentType = xmlContentType(file.getContentType());
        String key = "expenses/nfe/" + project.getId() + "/" + UUID.randomUUID() + ".xml";
        cleanup.register(key);
        try {
            return transactions.execute(status -> {
                if (!cleanup.lockForUpload(key)) {
                    throw new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE, RECEIPT_UNAVAILABLE);
                }
                try {
                    storage.put(key, new ByteArrayInputStream(xml), xml.length, contentType);
                } catch (RuntimeException exception) {
                    throw new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE, RECEIPT_UNAVAILABLE);
                }
                var result = persist(owner, project, preview, category, paid, key, contentType, xml.length);
                cleanup.complete(key);
                return result;
            });
        } catch (RuntimeException exception) {
            cleanup.compensate(key);
            throw exception;
        }
    }

    private List<ExpenseResponseDTO> persist(User owner, Project project, NfePreviewResponseDTO preview,
                                             Map<Integer, ExpenseCategory> category, boolean paid,
                                             String key, String contentType, long size) {
        keyGuard.ensureNotRegistered(project.getId(), preview.accessKey());

        var emitter = preview.supplier();
        Supplier supplier = references.findOrCreateSupplier(owner, emitter.document(), emitter.name(), true);

        int firstNumber = firstItemNumber(preview);
        var created = new ArrayList<ExpenseResponseDTO>();
        for (var item : preview.items()) {
            ExpenseCategory itemCategory = category.get(item.itemNumber());
            Expense expense = Expense.builder().user(owner).project(project)
                    .category(itemCategory).supplier(supplier)
                    .budget(references.resolveBudget(project.getId(), itemCategory.getId()))
                    .type("MATERIAL").description(item.description())
                    .quantity(item.quantity()).unit(item.unit())
                    .unitPrice(item.unitPrice()).totalPrice(item.totalPrice())
                    .purchaseDate(preview.issueDate()).nfeKey(preview.accessKey())
                    .receiptState("NONE").paid(paid).build();
            if (item.itemNumber() == firstNumber) {
                expense.setReceiptState("UPLOADED");
                expense.setReceiptKey(key);
                expense.setReceiptContentType(contentType);
                expense.setReceiptSize(size);
                if (paid) {
                    expense.setPendingPayment(PendingPayment.builder()
                            .expense(expense)
                            .status(PaymentStatus.PAID)
                            .dueDate(null)
                            .paidAt(preview.issueDate().atStartOfDay(ZoneOffset.UTC).toInstant())
                            .build());
                } else {
                    expense.setPendingPayment(PendingPayment.builder()
                            .expense(expense)
                            .status(PaymentStatus.PENDING)
                            .dueDate(preview.issueDate())
                            .paidAt(null)
                            .build());
                }
            }
            created.add(ExpenseMapper.toDTO(expenses.save(expense)));
        }
        return created;
    }

    // A primeira linha é nItem = 1. Sem ele, a menor ordem recebe o pagamento e o comprovante.
    private static int firstItemNumber(NfePreviewResponseDTO preview) {
        if (preview.items().stream().anyMatch(item -> item.itemNumber() == 1)) return 1;
        return preview.items().stream().mapToInt(NfePreviewResponseDTO.Item::itemNumber).min().orElse(0);
    }

    private static boolean isPaid(NfeImportRequestDTO request) {
        return request.payment() == null || request.payment().paid() == null || request.payment().paid();
    }

    private static String xmlContentType(String declared) {
        if (declared == null) return XML_CONTENT_TYPE;
        String normalized = declared.toLowerCase(Locale.ROOT);
        return normalized.equals("text/xml") ? normalized : XML_CONTENT_TYPE;
    }

    private static String join(List<Integer> numbers) {
        return numbers.stream().map(String::valueOf).collect(Collectors.joining(", "));
    }

    private static void invalid(String message) {
        throw new ExpenseValidationException(message);
    }
}
