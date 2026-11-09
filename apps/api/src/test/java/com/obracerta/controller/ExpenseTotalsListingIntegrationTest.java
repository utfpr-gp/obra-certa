package com.obracerta.controller;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.PaymentStatus;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.model.entity.*;
import com.obracerta.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class ExpenseTotalsListingIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired ProjectRepository projects;
    @Autowired ExpenseRepository expenses;
    @Autowired ExpenseCategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @MockBean UserContextHelper identity;
    @MockBean Clock clock;

    User owner;
    Project project;

    @BeforeEach
    void setup() {
        owner = users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID() + "@test.local")
                .password("test").userRole(UserRole.USER).build());
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        when(clock.instant()).thenReturn(Instant.parse("2026-11-01T12:00:00Z"));
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
    }

    @Test
    void totalsCoverAllPagesAndRespectEachTabWithExactDecimalAmounts() throws Exception {
        for (int i = 0; i < 16; i++) addAmount(true, "100.10", null);
        addAmount(false, "200.20", LocalDate.of(2026, 10, 31));
        addAmount(false, "300.30", LocalDate.of(2026, 11, 1));
        addAmount(false, "400.40", null);
        Expense deleted = addAmount(false, "999.99", LocalDate.of(2026, 10, 1));
        deleted.setDeletedAt(Instant.now());
        expenses.saveAndFlush(deleted);
        Project original = project;
        project = projects.saveAndFlush(Project.builder().user(owner).name("Outra obra")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        addAmount(true, "888.88", null);
        project = original;
        assertTotals("ALL", 0, 1601.60, 900.90, 2502.50);
        assertTotals("ALL", 1, 1601.60, 900.90, 2502.50);
        assertTotals("ALL", 20, 1601.60, 900.90, 2502.50);
        assertTotals("PENDING", 0, 0, 900.90, 900.90);
        assertTotals("OVERDUE", 0, 0, 200.20, 200.20);
        assertTotals("PAID", 0, 1601.60, 0, 1601.60);
    }

    @Test
    void emptySetReturnsZeroTotalsAndUnauthorizedProjectsExposeNone() throws Exception {
        assertTotals("ALL", 0, 0, 0, 0);
        User other = users.saveAndFlush(User.builder().name("Outro").email(UUID.randomUUID() + "@test.local")
                .password("test").userRole(UserRole.USER).build());
        when(identity.getAuthenticatedUser()).thenReturn(other);
        mvc.perform(get("/api/expenses").param("projectId", project.getId()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.totals").doesNotExist());
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        project.setDeletedAt(Instant.now());
        projects.saveAndFlush(project);
        mvc.perform(get("/api/expenses").param("projectId", project.getId()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.totals").doesNotExist());
    }

    private void assertTotals(String tab, int page, double paid, double pending, double general) throws Exception {
        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("tab", tab)
                        .param("page", String.valueOf(page)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals.totalPaid").value(paid))
                .andExpect(jsonPath("$.totals.totalPending").value(pending))
                .andExpect(jsonPath("$.totals.totalGeneral").value(general));
    }

    private Expense addAmount(boolean paid, String amount, LocalDate dueDate) {
        Expense value = expense(paid, UUID.randomUUID().toString(), dueDate);
        value.setTotalPrice(new BigDecimal(amount));
        return expenses.saveAndFlush(value);
    }

    private Expense expense(boolean paid, String description, LocalDate dueDate) {
        Expense value = Expense.builder().project(project).user(owner)
                .category(categories.findAll().getFirst())
                .supplier(suppliers.findFirstByUserIdAndDocument(owner.getId(), null).orElse(null))
                .description(description).purchaseDate(LocalDate.of(2026, 10, 1))
                .totalPrice(BigDecimal.ONE).paid(paid).build();
        if (value.getSupplier() == null)
            value.setSupplier(suppliers.save(Supplier.builder().user(owner).name("Loja " + description).build()));
        if (!paid && dueDate != null)
            value.setPendingPayment(PendingPayment.builder().expense(value).dueDate(dueDate)
                    .status(PaymentStatus.PENDING).build());
        return expenses.saveAndFlush(value);
    }
}
