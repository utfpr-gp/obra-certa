package com.obracerta.controller;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.enums.*;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Stream;

import static org.hamcrest.Matchers.contains;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class ExpenseSortListingIntegrationTest {
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
    Supplier supplier;
    ExpenseCategory category;

    @BeforeEach
    void setup() {
        owner = users.saveAndFlush(User.builder().name("Dono").email(UUID.randomUUID() + "@test.local")
                .password("test").userRole(UserRole.USER).build());
        project = projects.saveAndFlush(Project.builder().user(owner).name("Casa")
                .type(ProjectType.RENOVATION).status(ProjectStatus.IN_PROGRESS).build());
        supplier = suppliers.saveAndFlush(Supplier.builder().user(owner).name("Loja").build());
        category = categories.findAll().getFirst();
        when(identity.getAuthenticatedUser()).thenReturn(owner);
        when(clock.instant()).thenReturn(Instant.parse("2026-11-01T12:00:00Z"));
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
    }

    @Test
    void ordersWholeFilteredSetBeforePaginationWithStableIdTiesAndInvariantTotals() throws Exception {
        String oldLow = add(1, 20).getId();
        String oldHigh = add(1, 40).getId();
        String newLow = add(3, 10).getId();
        String newHigh = add(3, 50).getId();
        List<String> tied = new ArrayList<>();
        for (int i = 0; i < 18; i++) tied.add(add(2, 30).getId());
        tied.sort(String::compareTo);
        List<String> oldIds = Stream.of(oldLow, oldHigh).sorted().toList();
        List<String> newIds = Stream.of(newLow, newHigh).sorted().toList();
        Expense paid = add(2, 999); paid.setPaid(true); expenses.saveAndFlush(paid);
        Expense outside = add(2, 888); outside.setPurchaseDate(LocalDate.of(2026, 9, 1)); expenses.saveAndFlush(outside);
        Expense otherSupplier = add(2, 777);
        otherSupplier.setSupplier(suppliers.saveAndFlush(Supplier.builder().user(owner).name("Outra").build()));
        expenses.saveAndFlush(otherSupplier);
        Map<String, List<String>> expected = new LinkedHashMap<>();
        expected.put("PURCHASE_DATE_DESC", join(newIds, tied, oldIds));
        expected.put("PURCHASE_DATE_ASC", join(oldIds, tied, newIds));
        expected.put("AMOUNT_DESC", join(List.of(newHigh, oldHigh), tied, List.of(oldLow, newLow)));
        expected.put("AMOUNT_ASC", join(List.of(newLow, oldLow), tied, List.of(oldHigh, newHigh)));
        for (var order : expected.entrySet()) {
            for (int page = 0; page < 2; page++) {
                var ids = order.getValue().subList(page * 15, Math.min((page + 1) * 15, 22));
                mvc.perform(filtered().param("sort", order.getKey()).param("page", String.valueOf(page)))
                        .andExpect(status().isOk()).andExpect(jsonPath("$.page").value(page))
                        .andExpect(jsonPath("$.totalElements").value(22)).andExpect(jsonPath("$.totalPages").value(2))
                        .andExpect(jsonPath("$.content[*].id", contains(ids.toArray(String[]::new))))
                        .andExpect(jsonPath("$.totals.totalPaid").value(0))
                        .andExpect(jsonPath("$.totals.totalPending").value(660))
                        .andExpect(jsonPath("$.totals.totalGeneral").value(660));
            }
        }
    }

    @Test
    void defaultsToMostRecentPurchaseWithStableIdTieBreak() throws Exception {
        String oldest = add(1, 100).getId();
        String one = add(3, 1).getId();
        String two = add(3, 50).getId();
        List<String> expected = Stream.of(one, two).sorted().toList();
        mvc.perform(filtered()).andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id", contains(expected.get(0), expected.get(1), oldest)));
    }

    @Test
    void rejectsUnknownEmptyAndRepeatedSortUsingApiErrorContract() throws Exception {
        for (String[] invalid : List.of(new String[]{"urgency"}, new String[]{""},
                new String[]{"PURCHASE_DATE_DESC", "AMOUNT_ASC"})) {
            mvc.perform(filtered().param("sort", invalid)).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400)).andExpect(jsonPath("$.path").value("/api/expenses"))
                    .andExpect(jsonPath("$.message").isString()).andExpect(jsonPath("$.fieldErrors").isArray());
        }
    }

    private MockHttpServletRequestBuilder filtered() {
        return get("/api/expenses").param("projectId", project.getId()).param("tab", "PENDING")
                .param("purchaseDateFrom", "2026-10-01").param("purchaseDateTo", "2026-10-03")
                .param("categoryIds", category.getId()).param("supplierId", supplier.getId());
    }

    private Expense add(int day, int amount) {
        return expenses.saveAndFlush(Expense.builder().project(project).user(owner).category(category).supplier(supplier)
                .description("Despesa").purchaseDate(LocalDate.of(2026, 10, day))
                .totalPrice(BigDecimal.valueOf(amount)).paid(false).build());
    }

    private List<String> join(List<String> first, List<String> middle, List<String> last) {
        return Stream.of(first, middle, last).flatMap(List::stream).toList();
    }
}
