package com.obracerta.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.PaymentStatus;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class ExpensePaymentUpdateIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired ExpenseRepository expenses;
    @Autowired SupplierRepository suppliers;
    @Autowired BudgetRepository budgets;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;
    @MockBean UserContextHelper identity;
    @MockBean Clock clock;

    User owner;
    Project project;
    ExpenseCategory category;
    Supplier supplier;

    @BeforeEach
    void setup() {
        owner = users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID() + "@test.local")
                .password("test").userRole(UserRole.USER).build());
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
        when(clock.instant()).thenReturn(Instant.parse("2030-01-05T10:00:00Z"));

        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa").type(ProjectType.RENOVATION)
                .status(ProjectStatus.IN_PROGRESS).build());
        category = categories.findAll().getFirst();
        supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
    }

    ObjectNode body(boolean paid, String dueDate) {
        ObjectNode node = json.createObjectNode()
                .put("description", "Material")
                .put("purchaseDate", "2030-01-02")
                .put("categoryId", category.getId())
                .put("valueMode", "DIRECT")
                .put("totalPrice", 100.00)
                .put("paid", paid);
        if (dueDate != null) node.put("dueDate", dueDate);
        return node;
    }

    @Test
    void switchesFromPaidToPendingCreatingPaymentOnlyWhenAbsent() throws Exception {
        // Despesa criada paga, sem pending_payment
        Expense expense = expenses.saveAndFlush(Expense.builder()
                .user(owner).project(project).category(category).supplier(supplier)
                .description("Material").purchaseDate(LocalDate.parse("2030-01-02"))
                .totalPrice(new BigDecimal("100.00")).paid(true).build());

        assertThat(expense.getPendingPayment()).isNull();
        Integer initialCount = jdbc.queryForObject("SELECT count(*) FROM pending_payments WHERE expense_id = ?", Integer.class, expense.getId());
        assertThat(initialCount).isEqualTo(0);

        // 1. Transição de paga para pendente: cria PendingPayment somente quando ausente
        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(false, "2030-01-10").toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(false))
                .andExpect(jsonPath("$.dueDate").value("2030-01-10"))
                .andExpect(jsonPath("$.paidAt").doesNotExist());

        expenses.flush();
        Expense reloaded = expenses.findById(expense.getId()).orElseThrow();
        assertThat(reloaded.isPaid()).isFalse();
        assertThat(reloaded.getPendingPayment()).isNotNull();
        String paymentId = reloaded.getPendingPayment().getId();
        assertThat(reloaded.getPendingPayment().getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(reloaded.getPendingPayment().getDueDate()).isEqualTo(LocalDate.parse("2030-01-10"));
        assertThat(reloaded.getPendingPayment().getPaidAt()).isNull();

        // 2. Transição subsequente para pendente com outra data: REUTILIZA o registro existente sem criar outro
        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(false, "2030-01-15").toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(false))
                .andExpect(jsonPath("$.dueDate").value("2030-01-15"));

        expenses.flush();
        reloaded = expenses.findById(expense.getId()).orElseThrow();
        assertThat(reloaded.getPendingPayment().getId()).isEqualTo(paymentId);
        assertThat(reloaded.getPendingPayment().getDueDate()).isEqualTo(LocalDate.parse("2030-01-15"));
        Integer count = jdbc.queryForObject("SELECT count(*) FROM pending_payments WHERE expense_id = ?", Integer.class, expense.getId());
        assertThat(count).isEqualTo(1);
    }

    @Test
    void trocaDeCategoriaResolveOrcamentoDaNovaCategoriaPelaMesmaRegraDaCriacao() throws Exception {
        ExpenseCategory outra = categories.findAll().get(1);
        Budget budgetOutra = budgets.saveAndFlush(Budget.builder().user(owner).project(project).category(outra)
                .estimatedAmount(new BigDecimal("500.00")).build());
        Expense expense = expenses.saveAndFlush(Expense.builder()
                .user(owner).project(project).category(category).supplier(supplier)
                .description("Material").purchaseDate(LocalDate.parse("2030-01-02"))
                .totalPrice(new BigDecimal("100.00")).paid(true).build());

        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(true, null).put("categoryId", outra.getId()).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(outra.getId()));

        expenses.flush();
        Expense reloaded = expenses.findById(expense.getId()).orElseThrow();
        assertThat(reloaded.getCategory().getId()).isEqualTo(outra.getId());
        assertThat(reloaded.getBudget()).isNotNull();
        assertThat(reloaded.getBudget().getId()).isEqualTo(budgetOutra.getId());
    }

    @Test
    void requiresDueDateWhenSwitchingToPendingAndRejectsBeforePurchaseDateAllowingEquality() throws Exception {
        Expense expense = expenses.saveAndFlush(Expense.builder()
                .user(owner).project(project).category(category).supplier(supplier)
                .description("Original").purchaseDate(LocalDate.parse("2030-01-02"))
                .totalPrice(new BigDecimal("50.00")).paid(true).build());

        // Sem vencimento -> 400
        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(false, null).toString()))
                .andExpect(status().isBadRequest());

        // Vencimento anterior à data de compra -> 400
        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(false, "2030-01-01").toString()))
                .andExpect(status().isBadRequest());

        // Vencimento igual à data de compra -> 200 OK permitido
        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(false, "2030-01-02").toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(false))
                .andExpect(jsonPath("$.dueDate").value("2030-01-02"));
    }

    @Test
    void switchesFromPendingToPaidWithFixedClockPreservingPaymentRowAndId() throws Exception {
        Instant fixedInstant = Instant.parse("2030-01-05T10:00:00Z");
        when(clock.instant()).thenReturn(fixedInstant);

        Expense expense = Expense.builder()
                .user(owner).project(project).category(category).supplier(supplier)
                .description("Pendente inicial").purchaseDate(LocalDate.parse("2030-01-02"))
                .totalPrice(new BigDecimal("80.00")).paid(false).build();
        PendingPayment initialPayment = PendingPayment.builder()
                .expense(expense).status(PaymentStatus.PENDING)
                .dueDate(LocalDate.parse("2030-01-10")).build();
        expense.setPendingPayment(initialPayment);
        expenses.saveAndFlush(expense);
        String paymentId = expense.getPendingPayment().getId();

        // Pendente -> Paga
        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(true, null).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(true))
                .andExpect(jsonPath("$.dueDate").value("2030-01-10"))
                .andExpect(jsonPath("$.paidAt").value("2030-01-05T10:00:00Z"));

        expenses.flush();
        Expense reloaded = expenses.findById(expense.getId()).orElseThrow();
        assertThat(reloaded.isPaid()).isTrue();
        // Quitação NÃO remove a linha de pagamento!
        assertThat(reloaded.getPendingPayment()).isNotNull();
        assertThat(reloaded.getPendingPayment().getId()).isEqualTo(paymentId);
        assertThat(reloaded.getPendingPayment().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(reloaded.getPendingPayment().getPaidAt()).isEqualTo(fixedInstant);
        assertThat(reloaded.getPendingPayment().getDueDate()).isEqualTo(LocalDate.parse("2030-01-10"));

        Integer count = jdbc.queryForObject("SELECT count(*) FROM pending_payments WHERE expense_id = ?", Integer.class, expense.getId());
        assertThat(count).isEqualTo(1);
    }

    @Test
    void repeatedCyclesPreserveSamePaymentIdentifierAndReopeningClearsPaidAt() throws Exception {
        Instant instant1 = Instant.parse("2030-01-05T10:00:00Z");
        when(clock.instant()).thenReturn(instant1);

        Expense expense = Expense.builder()
                .user(owner).project(project).category(category).supplier(supplier)
                .description("Ciclos").purchaseDate(LocalDate.parse("2030-01-02"))
                .totalPrice(new BigDecimal("120.00")).paid(false).build();
        PendingPayment payment = PendingPayment.builder()
                .expense(expense).status(PaymentStatus.PENDING)
                .dueDate(LocalDate.parse("2030-01-10")).build();
        expense.setPendingPayment(payment);
        expenses.saveAndFlush(expense);
        String paymentId = expense.getPendingPayment().getId();

        // 1. Quitação
        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(true, null).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(true))
                .andExpect(jsonPath("$.paidAt").value("2030-01-05T10:00:00Z"));

        expenses.flush();
        Expense reloaded = expenses.findById(expense.getId()).orElseThrow();
        assertThat(reloaded.getPendingPayment().getId()).isEqualTo(paymentId);
        assertThat(reloaded.getPendingPayment().getStatus()).isEqualTo(PaymentStatus.PAID);

        // 2. Reabertura (paga -> pendente): limpa a quitação atual, atualiza vencimento, preserva mesmo paymentId
        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(false, "2030-01-20").toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(false))
                .andExpect(jsonPath("$.dueDate").value("2030-01-20"))
                .andExpect(jsonPath("$.paidAt").doesNotExist());

        expenses.flush();
        reloaded = expenses.findById(expense.getId()).orElseThrow();
        assertThat(reloaded.isPaid()).isFalse();
        assertThat(reloaded.getPendingPayment().getId()).isEqualTo(paymentId);
        assertThat(reloaded.getPendingPayment().getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(reloaded.getPendingPayment().getDueDate()).isEqualTo(LocalDate.parse("2030-01-20"));
        assertThat(reloaded.getPendingPayment().getPaidAt()).isNull();

        // 3. Nova quitação posterior
        Instant instant2 = Instant.parse("2030-01-22T14:30:00Z");
        when(clock.instant()).thenReturn(instant2);

        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(body(true, null).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(true))
                .andExpect(jsonPath("$.paidAt").value("2030-01-22T14:30:00Z"));

        expenses.flush();
        reloaded = expenses.findById(expense.getId()).orElseThrow();
        assertThat(reloaded.getPendingPayment().getId()).isEqualTo(paymentId);
        assertThat(reloaded.getPendingPayment().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(reloaded.getPendingPayment().getPaidAt()).isEqualTo(instant2);

        Integer count = jdbc.queryForObject("SELECT count(*) FROM pending_payments WHERE expense_id = ?", Integer.class, expense.getId());
        assertThat(count).isEqualTo(1);
    }

    @Test
    void editingPaidExpensePreservesOriginalSettlementInstantAfterClockAdvances() throws Exception {
        Instant settledAt = Instant.parse("2030-01-05T10:00:00Z");
        Expense expense = Expense.builder()
                .user(owner).project(project).category(category).supplier(supplier)
                .description("Pendente").purchaseDate(LocalDate.parse("2030-01-02"))
                .totalPrice(new BigDecimal("100.00")).paid(false).build();
        expense.setPendingPayment(PendingPayment.builder().expense(expense)
                .status(PaymentStatus.PENDING).dueDate(LocalDate.parse("2030-01-10")).build());
        expenses.saveAndFlush(expense);
        String expenseId = expense.getId();
        String paymentId = expense.getPendingPayment().getId();

        mvc.perform(put("/api/expenses/" + expenseId)
                        .contentType(APPLICATION_JSON).content(body(true, null).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paidAt").value(settledAt.toString()));
        expenses.flush();
        entityManager.clear();

        when(clock.instant()).thenReturn(Instant.parse("2030-01-20T14:30:00Z"));
        mvc.perform(put("/api/expenses/" + expenseId)
                        .contentType(APPLICATION_JSON)
                        .content(body(true, null).put("description", "Descrição corrigida").toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Descrição corrigida"))
                .andExpect(jsonPath("$.paidAt").value(settledAt.toString()));

        expenses.flush();
        entityManager.clear();
        Expense reloaded = expenses.findById(expenseId).orElseThrow();
        assertThat(reloaded.getDescription()).isEqualTo("Descrição corrigida");
        assertThat(reloaded.isPaid()).isTrue();
        assertThat(reloaded.getPendingPayment().getId()).isEqualTo(paymentId);
        assertThat(reloaded.getPendingPayment().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(reloaded.getPendingPayment().getPaidAt()).isEqualTo(settledAt);
    }

    @Test
    void editingLegacyPaidExpenseDoesNotInventSettlementInstant() throws Exception {
        Expense expense = Expense.builder()
                .user(owner).project(project).category(category).supplier(supplier)
                .description("Legado pago").purchaseDate(LocalDate.parse("2030-01-02"))
                .totalPrice(new BigDecimal("100.00")).paid(true).build();
        expense.setPendingPayment(PendingPayment.builder().expense(expense)
                .status(PaymentStatus.PAID).dueDate(LocalDate.parse("2030-01-10")).paidAt(null).build());
        expenses.saveAndFlush(expense);
        String expenseId = expense.getId();
        String paymentId = expense.getPendingPayment().getId();
        entityManager.clear();

        mvc.perform(put("/api/expenses/" + expenseId)
                        .contentType(APPLICATION_JSON)
                        .content(body(true, null).put("description", "Legado corrigido").toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Legado corrigido"))
                .andExpect(jsonPath("$.paidAt").doesNotExist());

        expenses.flush();
        entityManager.clear();
        Expense reloaded = expenses.findById(expenseId).orElseThrow();
        assertThat(reloaded.getDescription()).isEqualTo("Legado corrigido");
        assertThat(reloaded.isPaid()).isTrue();
        assertThat(reloaded.getPendingPayment().getId()).isEqualTo(paymentId);
        assertThat(reloaded.getPendingPayment().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(reloaded.getPendingPayment().getPaidAt()).isNull();
    }

    @Test
    void atomicFailureRollsBackEntireUpdate() throws Exception {
        Expense expense = expenses.saveAndFlush(Expense.builder()
                .user(owner).project(project).category(category).supplier(supplier)
                .description("Original Inalterado").purchaseDate(LocalDate.parse("2030-01-02"))
                .totalPrice(new BigDecimal("50.00")).paid(true).build());

        // Envia edição que altera descrição e tenta passar para pendente com vencimento anterior à compra
        ObjectNode invalidBody = body(false, "2030-01-01")
                .put("description", "Descricao Alterada Invalida");

        mvc.perform(put("/api/expenses/" + expense.getId())
                        .contentType(APPLICATION_JSON)
                        .content(invalidBody.toString()))
                .andExpect(status().isBadRequest());

        expenses.flush();
        Expense reloaded = expenses.findById(expense.getId()).orElseThrow();
        // Nenhuma gravação parcial ocorreu:
        assertThat(reloaded.getDescription()).isEqualTo("Original Inalterado");
        assertThat(reloaded.isPaid()).isTrue();
        assertThat(reloaded.getPendingPayment()).isNull();
    }
}
