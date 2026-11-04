package com.obracerta.controller;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.PaymentStatus;
import com.obracerta.enums.ProjectStatus;
import com.obracerta.enums.ProjectType;
import com.obracerta.enums.UserRole;
import com.obracerta.model.entity.Expense;
import com.obracerta.model.entity.ExpenseCategory;
import com.obracerta.model.entity.PendingPayment;
import com.obracerta.model.entity.Project;
import com.obracerta.model.entity.Supplier;
import com.obracerta.model.entity.User;
import com.obracerta.repository.ExpenseCategoryRepository;
import com.obracerta.repository.ExpenseRepository;
import com.obracerta.repository.ProjectRepository;
import com.obracerta.repository.SupplierRepository;
import com.obracerta.repository.UserRepository;
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
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class PaymentSettlementListingIntegrationTest {
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
    ExpenseCategory category;
    Supplier supplier;

    @BeforeEach
    void setup() {
        owner = users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID() + "@test.local")
                .password("test").userRole(UserRole.USER).build());
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        category = categories.findAll().getFirst();
        supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        when(clock.instant()).thenReturn(Instant.parse("2026-11-01T12:00:00Z"));
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
    }

    @Test
    void settledExpenseMovesAcrossThePersistedListingSlicesAndTotals() throws Exception {
        Expense overdue = expense("overdue", false, LocalDate.of(2026, 10, 20), "100.00");
        Expense future = expense("future", false, LocalDate.of(2026, 11, 10), "50.50");
        Expense paid = expense("paid", true, null, "20.20");

        list("ALL").andExpect(status().isOk())
                .andExpect(jsonPath("$.referenceDate").value("2026-11-01"))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[*].description", containsInAnyOrder("overdue", "future", "paid")))
                .andExpect(jsonPath("$.totals.totalPaid").value(20.2))
                .andExpect(jsonPath("$.totals.totalPending").value(150.5))
                .andExpect(jsonPath("$.totals.totalGeneral").value(170.7));
        list("PENDING").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].description", containsInAnyOrder("overdue", "future")));
        list("OVERDUE").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].description").value("overdue"));
        list("PAID").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(paid.getId()));

        mvc.perform(put("/api/projects/" + project.getId() + "/expenses/" + overdue.getId() + "/payment")
                        .contentType(APPLICATION_JSON).content("{\"paymentDate\":\"2026-11-01\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(true))
                .andExpect(jsonPath("$.paidAt").value("2026-11-01T00:00:00Z"));

        list("ALL").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totals.totalPaid").value(120.2))
                .andExpect(jsonPath("$.totals.totalPending").value(50.5))
                .andExpect(jsonPath("$.totals.totalGeneral").value(170.7));
        list("PENDING").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(future.getId()))
                .andExpect(jsonPath("$.content[*].description", containsInAnyOrder("future")));
        list("OVERDUE").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
        list("PAID").andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].description", containsInAnyOrder("overdue", "paid")))
                .andExpect(jsonPath("$.content[?(@.description == 'overdue')].paidAt",
                        hasItem("2026-11-01T00:00:00Z")))
                .andExpect(jsonPath("$.content[?(@.description == 'overdue')].id", hasItem(overdue.getId())));
    }

    private org.springframework.test.web.servlet.ResultActions list(String tab) throws Exception {
        return mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("tab", tab));
    }

    private Expense expense(String description, boolean paid, LocalDate dueDate, String amount) {
        Expense value = Expense.builder().project(project).user(owner).category(category).supplier(supplier)
                .description(description).purchaseDate(LocalDate.of(2026, 10, 1))
                .totalPrice(new BigDecimal(amount)).paid(paid).build();
        if (!paid && dueDate != null) {
            value.setPendingPayment(PendingPayment.builder().expense(value)
                    .status(PaymentStatus.PENDING).dueDate(dueDate).build());
        }
        return expenses.saveAndFlush(value);
    }
}
