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
class ExpenseSituationListingIntegrationTest {
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
    void appliesAllSituationSlicesUsingOneApiReferenceDate() throws Exception {
        ExpenseCategory category = categories.findAll().getFirst();
        Supplier supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        expense(true, "paid", null);
        expense(false, "pending-without-due", null);
        expense(false, "overdue", LocalDate.of(2026, 10, 31));
        expense(false, "due-today", LocalDate.of(2026, 11, 1));
        Expense deleted = expense(false, "deleted", LocalDate.of(2026, 10, 1));
        deleted.setDeletedAt(Instant.parse("2026-11-01T00:00:00Z"));
        expenses.saveAndFlush(deleted);

        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("tab", "ALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.referenceDate").value("2026-11-01"));
        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("tab", "PENDING"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(3));
        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("tab", "OVERDUE"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].description").value("overdue"));
        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("tab", "PAID"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].description").value("paid"));
    }

    @Test
    void rejectsUnknownTabWithStandardApiErrorResponse() throws Exception {
        mvc.perform(get("/api/expenses")
                        .param("projectId", project.getId())
                        .param("tab", "UNKNOWN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.path").value("/api/expenses"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
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
