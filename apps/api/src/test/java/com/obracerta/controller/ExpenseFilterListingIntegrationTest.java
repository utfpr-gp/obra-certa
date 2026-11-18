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

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class ExpenseFilterListingIntegrationTest {
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
    void combinesInclusiveDatesCategoriesSupplierAndTabForRowsAndTotals() throws Exception {
        Expense first = addAmount(false, "10.10", LocalDate.of(2026, 11, 1));
        Expense second = addAmount(false, "20.20", LocalDate.of(2026, 11, 2));
        var categoryList = categories.findAll();
        second.setCategory(categoryList.get(1));
        second.setSupplier(first.getSupplier());
        second.setPurchaseDate(LocalDate.of(2026, 10, 2));
        expenses.saveAndFlush(second);
        addAmount(true, "99.99", null);
        addAmount(false, "40.40", LocalDate.of(2026, 10, 3), LocalDate.of(2026, 11, 1));
        addAmount(false, "50.50", LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 3));
        addAmount(false, "60.60", null);
        Expense otherSupplier = addAmount(false, "70.70", LocalDate.of(2026, 11, 1));
        otherSupplier.setSupplier(suppliers.saveAndFlush(Supplier.builder().user(owner).name("Outra loja").build()));
        expenses.saveAndFlush(otherSupplier);
        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("tab", "PENDING")
                .param("purchaseDateFrom", "2026-10-01").param("purchaseDateTo", "2026-10-02")
                .param("dueDateFrom", "2026-11-01").param("dueDateTo", "2026-11-02")
                .param("categoryIds", first.getCategory().getId(), second.getCategory().getId())
                .param("supplierId", first.getSupplier().getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].id", containsInAnyOrder(first.getId(), second.getId())))
                .andExpect(jsonPath("$.totals.totalPaid").value(0))
                .andExpect(jsonPath("$.totals.totalPending").value(30.30))
                .andExpect(jsonPath("$.totals.totalGeneral").value(30.30));
    }

    @Test
    void purchaseDateRangeIncludesBothBoundsAndExcludesDatesBeforeAndAfter() throws Exception {
        addAmount(true, "1.01", LocalDate.of(2026, 9, 30), null);
        Expense first = addAmount(true, "10.10", LocalDate.of(2026, 10, 1), null);
        Expense second = addAmount(false, "20.20", LocalDate.of(2026, 10, 2), null);
        addAmount(false, "99.99", LocalDate.of(2026, 10, 3), null);
        mvc.perform(get("/api/expenses").param("projectId", project.getId())
                .param("purchaseDateFrom", "2026-10-01").param("purchaseDateTo", "2026-10-02"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].id", containsInAnyOrder(first.getId(), second.getId())))
                .andExpect(jsonPath("$.totals.totalPaid").value(10.10))
                .andExpect(jsonPath("$.totals.totalPending").value(20.20))
                .andExpect(jsonPath("$.totals.totalGeneral").value(30.30));
        mvc.perform(get("/api/expenses").param("projectId", project.getId())
                .param("purchaseDateFrom", "2026-10-02").param("purchaseDateTo", "2026-10-02"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(second.getId()))
                .andExpect(jsonPath("$.totals.totalPaid").value(0))
                .andExpect(jsonPath("$.totals.totalPending").value(20.20))
                .andExpect(jsonPath("$.totals.totalGeneral").value(20.20));
    }

    @Test
    void dueDateRangeIncludesBothBoundsAndExcludesDatesBeforeAfterAndNull() throws Exception {
        addAmount(false, "1.01", LocalDate.of(2026, 10, 31));
        Expense first = addAmount(false, "10.10", LocalDate.of(2026, 11, 1));
        Expense second = addAmount(false, "20.20", LocalDate.of(2026, 11, 2));
        addAmount(false, "99.99", LocalDate.of(2026, 11, 3));
        addAmount(false, "88.88", null);
        mvc.perform(get("/api/expenses").param("projectId", project.getId())
                .param("dueDateFrom", "2026-11-01").param("dueDateTo", "2026-11-02"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].id", containsInAnyOrder(first.getId(), second.getId())))
                .andExpect(jsonPath("$.totals.totalPaid").value(0))
                .andExpect(jsonPath("$.totals.totalPending").value(30.30))
                .andExpect(jsonPath("$.totals.totalGeneral").value(30.30));
        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("dueDateFrom", "2026-11-02"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totals.totalPaid").value(0))
                .andExpect(jsonPath("$.totals.totalPending").value(120.19))
                .andExpect(jsonPath("$.totals.totalGeneral").value(120.19));
    }

    @Test
    void categoryFilterExcludesOtherCategories() throws Exception {
        Expense first = addAmount(false, "10.10", LocalDate.of(2026, 11, 1));
        Expense second = addAmount(false, "20.20", LocalDate.of(2026, 11, 2));
        second.setCategory(categories.findAll().get(1));
        expenses.saveAndFlush(second);
        Expense paid = addAmount(true, "99.99", null);
        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("categoryIds", first.getCategory().getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].id", containsInAnyOrder(first.getId(), paid.getId())))
                .andExpect(jsonPath("$.totals.totalPaid").value(99.99))
                .andExpect(jsonPath("$.totals.totalPending").value(10.10))
                .andExpect(jsonPath("$.totals.totalGeneral").value(110.09));
    }

    @Test
    void rejectsInvalidParametersWithApiErrorContract() throws Exception {
        String[][] invalid = {{"purchaseDateFrom", "2026-11-02", "purchaseDateTo", "2026-11-01"},
            {"dueDateFrom", "2026-11-02", "dueDateTo", "2026-11-01"},
            {"purchaseDateFrom", "2026-02-30"}, {"categoryIds", "invalid"}, {"supplierId", "invalid"},
            {"unknown", "anything"}, {"page", "-1"}, {"size", "16"}, {"tab", "invalid"},
            {"dueDateFrom", ""}, {"projectId", "invalid"}};
        for (var parameters : invalid) {
            var request = get("/api/expenses").param("projectId", project.getId());
            for (int i = 0; i < parameters.length; i += 2) {
                request.queryParam(parameters[i], parameters[i + 1]);
            }
            mvc.perform(request).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400)).andExpect(jsonPath("$.path").value("/api/expenses"))
                .andExpect(jsonPath("$.message").isString()).andExpect(jsonPath("$.fieldErrors").isArray());
        }
    }

    @Test
    void supplierFilterRequiresCurrentUserAuthorization() throws Exception {
        Expense own = addAmount(true, "10.10", null);
        Expense pending = addAmount(false, "20.20", null);
        Supplier anotherOwnSupplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Segunda loja").build());
        Expense otherPaid = addAmount(true, "99.99", null);
        otherPaid.setSupplier(anotherOwnSupplier);
        expenses.saveAndFlush(otherPaid);
        Expense otherPending = addAmount(false, "88.88", null);
        otherPending.setSupplier(anotherOwnSupplier);
        expenses.saveAndFlush(otherPending);
        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("supplierId", own.getSupplier().getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[*].id", containsInAnyOrder(own.getId(), pending.getId())))
                .andExpect(jsonPath("$.totals.totalPaid").value(10.10))
                .andExpect(jsonPath("$.totals.totalPending").value(20.20))
                .andExpect(jsonPath("$.totals.totalGeneral").value(30.30));
        User other = users.saveAndFlush(User.builder().name("Outro").email(UUID.randomUUID()+"@test.local")
                .password("test").userRole(UserRole.USER).build());
        Supplier foreign = suppliers.saveAndFlush(Supplier.builder().user(other).name("Restrito").document("12345678000100").build());
        mvc.perform(get("/api/expenses").param("projectId", project.getId()).param("supplierId", foreign.getId()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.totals").doesNotExist());
    }

    private Expense addAmount(boolean paid, String amount, LocalDate dueDate) {
        Expense value = expense(paid, UUID.randomUUID().toString(), dueDate);
        value.setTotalPrice(new BigDecimal(amount));
        return expenses.saveAndFlush(value);
    }

    private Expense addAmount(boolean paid, String amount, LocalDate purchaseDate, LocalDate dueDate) {
        Expense value = addAmount(paid, amount, dueDate);
        value.setPurchaseDate(purchaseDate);
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
