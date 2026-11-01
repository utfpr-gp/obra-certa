package com.obracerta.controller;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import com.obracerta.integration.ReceiptStorage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class ExpenseListingIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseRepository expenses;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @MockBean UserContextHelper identity;
    @MockBean ReceiptStorage storage;
    @Autowired JdbcTemplate jdbc;

    User owner;
    Project project;

    @BeforeEach
    void setup() {
        owner = users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID() + "@test.local")
                .password("test").userRole(UserRole.USER).build());
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        when(identity.getAuthenticatedUser()).thenReturn(owner);
    }

    @Test
    void repeatedListingIsReadOnlyAndIsolatedWithoutAccessingReceiptStorage() throws Exception {
        ExpenseCategory category = categories.findAll().getFirst();
        Supplier supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        Expense pending = Expense.builder().project(project).user(owner).category(category).supplier(supplier)
                .description("Pendente com comprovante").purchaseDate(LocalDate.of(2026, 1, 1))
                .totalPrice(new BigDecimal("321.45")).paid(false).receiptState("UPLOADED")
                .receiptKey("private/receipt.pdf").receiptContentType("application/pdf").receiptSize(25L).build();
        pending.setPendingPayment(PendingPayment.builder().expense(pending)
                .dueDate(LocalDate.of(2026, 2, 1)).status(com.obracerta.enums.PaymentStatus.PENDING).build());
        expenses.saveAndFlush(pending);
        expenses.saveAndFlush(Expense.builder().project(project).user(owner).category(category).supplier(supplier)
                .description("Quitada").purchaseDate(LocalDate.of(2026, 1, 2))
                .totalPrice(new BigDecimal("78.55")).paid(true).build());
        var beforeExpenses = jdbc.queryForList("select * from expenses order by id");
        var beforePayments = jdbc.queryForList("select * from pending_payments order by id");
        var beforeBudgets = jdbc.queryForList("select * from budgets order by id");
        var beforeProjects = jdbc.queryForList("select * from projects order by id");
        for (int attempt = 0; attempt < 2; attempt++) {
            mvc.perform(get("/api/expenses").param("projectId", project.getId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content.length()").value(2))
                    .andExpect(jsonPath("$.content[1].id").value(pending.getId()))
                    .andExpect(jsonPath("$.totals.totalPaid").value(78.55))
                    .andExpect(jsonPath("$.totals.totalPending").value(321.45))
                    .andExpect(jsonPath("$.totals.totalGeneral").value(400.00));
        }
        User outsider = users.saveAndFlush(User.builder().name("Outro").email(UUID.randomUUID() + "@test.local")
                .password("test").userRole(UserRole.USER).build());
        when(identity.getAuthenticatedUser()).thenReturn(outsider);
        mvc.perform(get("/api/expenses").param("projectId", project.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.content").doesNotExist())
                .andExpect(jsonPath("$.totals").doesNotExist());
        assertThat(jdbc.queryForList("select * from expenses order by id")).isEqualTo(beforeExpenses);
        assertThat(jdbc.queryForList("select * from pending_payments order by id")).isEqualTo(beforePayments);
        assertThat(jdbc.queryForList("select * from budgets order by id")).isEqualTo(beforeBudgets);
        assertThat(jdbc.queryForList("select * from projects order by id")).isEqualTo(beforeProjects);
        verifyNoInteractions(storage);
    }

    @Test
    void returnsOnlyActiveOwnedExpensesInPagesOfAtMostFifteenIncludingPaidWithoutPendingPayment() throws Exception {
        ExpenseCategory category = categories.findAll().getFirst();
        Supplier supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        expenses.save(Expense.builder().project(project).user(owner).category(category).supplier(supplier)
                .description("Cimento").purchaseDate(LocalDate.of(2026, 2, 1))
                .totalPrice(new BigDecimal("125.50")).paid(true).build());
        for (int i = 1; i < 16; i++)
            expenses.save(Expense.builder().project(project).user(owner).category(category).supplier(supplier)
                    .description("Despesa " + i).purchaseDate(LocalDate.of(2026, 1, 1))
                    .totalPrice(BigDecimal.TEN).paid(true).build());
        Expense deleted = Expense.builder().project(project).user(owner).category(category).supplier(supplier)
                .description("Excluída").purchaseDate(LocalDate.of(2026, 1, 1))
                .totalPrice(BigDecimal.TEN).paid(true).deletedAt(Instant.now()).build();
        expenses.save(deleted);
        expenses.flush();

        mvc.perform(get("/api/expenses").param("projectId", project.getId())
                        .param("page", "0").param("size", "15").accept(APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(15))
                .andExpect(jsonPath("$.size").value(15))
                .andExpect(jsonPath("$.totalElements").value(16))
                .andExpect(jsonPath("$.content[0].description").value("Cimento"))
                .andExpect(jsonPath("$.content[0].categoryName").value(category.getName()))
                .andExpect(jsonPath("$.content[0].supplier.name").value("Loja"))
                .andExpect(jsonPath("$.content[0].purchaseDate").value("2026-02-01"))
                .andExpect(jsonPath("$.content[0].totalPrice").value(125.50))
                .andExpect(jsonPath("$.content[0].paid").value(true))
                .andExpect(jsonPath("$.content[0].dueDate").value(org.hamcrest.Matchers.nullValue()));
        mvc.perform(get("/api/expenses").param("projectId", project.getId())
                        .param("page", "1").param("size", "15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.page").value(1));
    }

    @Test
    void doesNotReturnDeletedExpensesAndDoesNotExposeReceiptData() throws Exception {
        ExpenseCategory category = categories.findAll().getFirst();
        Supplier supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        Expense pending = Expense.builder().project(project).user(owner).category(category).supplier(supplier)
                .description("Ativa").purchaseDate(LocalDate.of(2026, 2, 1))
                .totalPrice(BigDecimal.ONE).paid(false)
                .build();
        pending.setPendingPayment(PendingPayment.builder().expense(pending)
                .dueDate(LocalDate.of(2026, 3, 1))
                .status(com.obracerta.enums.PaymentStatus.PENDING).build());
        expenses.save(pending);
        expenses.save(Expense.builder().project(project).user(owner).category(category).supplier(supplier)
                .description("Excluída").purchaseDate(LocalDate.of(2026, 2, 2))
                .totalPrice(BigDecimal.ONE).paid(true).deletedAt(Instant.now()).build());
        expenses.flush();

        mvc.perform(get("/api/expenses").param("projectId", project.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].description").value("Ativa"))
                .andExpect(jsonPath("$.content[0].dueDate").value("2026-03-01"))
                .andExpect(jsonPath("$.content[0].paid").value(false))
                .andExpect(jsonPath("$.content[0].receiptKey").doesNotExist())
                .andExpect(jsonPath("$.content[0].receiptUrl").doesNotExist());
    }

    @Test
    void doesNotExposeMissingDeletedOrForeignProjects() throws Exception {
        Project foreign = projects.saveAndFlush(Project.builder().user(
                users.saveAndFlush(User.builder().name("Outro").email(UUID.randomUUID() + "@test.local")
                        .password("test").userRole(UserRole.USER).build()))
                .name("Alheia").type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        mvc.perform(get("/api/expenses").param("projectId", UUID.randomUUID().toString()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/expenses").param("projectId", foreign.getId()))
                .andExpect(status().isNotFound());
        project.setDeletedAt(Instant.now());
        projects.saveAndFlush(project);
        mvc.perform(get("/api/expenses").param("projectId", project.getId()))
                .andExpect(status().isNotFound());
    }
}
